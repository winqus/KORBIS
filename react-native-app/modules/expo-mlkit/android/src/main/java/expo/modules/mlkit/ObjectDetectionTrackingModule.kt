package expo.modules.mlkit

import android.graphics.Rect
import android.net.Uri
import android.util.Log
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.types.toJSValue
import expo.modules.kotlin.types.toJSValueExperimental
import kotlinx.coroutines.runBlocking
import java.io.IOException

class ObjectDetectionTrackingModule : Module() {
    private val context get() = requireNotNull(appContext.reactContext)

    private var detector: MyAbstractObjectDetector? = null

    private val isInitialized get() = detector != null

    override fun definition() = ModuleDefinition {
        // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
        // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
        // The module will be accessible from `requireNativeModule('ExpoMLKit')` in JavaScript.
        Name("ObjectDetectionTrackingModule")

        Function("isInitialized") {
            return@Function isInitialized;
        }

        AsyncFunction("initialize") { options: ObjectDetectionTrackingDetectorOptions?, promise: Promise ->
            if (detector != null) {
                Log.d("ObjectDetectionTrackingModule", "ObjectDetector already initialized")
                promise.resolve(true)
                return@AsyncFunction
            }

            Log.d("ObjectDetectionTrackingModule", "Loading ObjectDetector")
            try {
                detector = ObjectDetectionTrackingDetector(options, context);

                Log.d("ObjectDetectionTrackingModule", "Default ObjectDetector")
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject(
                    "ObjectDetectionTrackingModule init failed",
                    "ObjectDetectionTrackingModule initializing failed",
                    e
                )
            }
        }


        AsyncFunction("detectObjectsInImage") { uri: String, promise: Promise ->
            if (!isInitialized) {
                Log.w(
                    "ObjectDetectionTrackingModule",
                    "ObjectDetector not initialized to use detectObjectsInImage",
                )
                promise.reject(
                    "ObjectDetectionTrackingModule",
                    "ObjectDetector not initialized",
                    Exception("Not initialized")
                )
                return@AsyncFunction
            }

            runBlocking suspend@{
                if (detector == null) {
                    Log.e(
                        "ObjectDetectionTrackingModule",
                        "detector is null"
                    )
                    return@suspend
                }

                try {
                    val detectionResult = detector?.detectObjects(uri)?.getOrThrow()

                    val resultMap = mapOf(
                        "width" to detectionResult?.width,
                        "height" to detectionResult?.height,
                        "detectedObjects" to detectionResult?.detectedObjects?.map { it.record }
                    )

                    promise.resolve(resultMap)

                } catch (e: IOException) {
                    Log.e(
                        "ObjectDetectionTrackingModule",
                        "detectObjectsInImage failed",
                        e
                    )
                    promise.reject(
                        "ObjectDetectionTrackingModule",
                        "detectObjectsInImage failed",
                        e
                    )
                }
            }

            Log.d("ObjectDetectionTrackingModule", "detectObjectsInImage for: $uri");
        }
    }
}