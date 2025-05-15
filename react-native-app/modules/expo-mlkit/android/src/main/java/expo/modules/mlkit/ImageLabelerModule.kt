package expo.modules.mlkit

import android.net.Uri
import android.util.Log
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.label.ImageLabeler
import com.google.mlkit.vision.label.ImageLabeling
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.IOException

class MyImageLabelerOptions(
    @Field val confidenceThreshold: Float?
) : Record {}

class ImageLabelerModule : Module() {
    private val context get() = requireNotNull(appContext.reactContext)

    private var labeler: ImageLabeler? = null

    private val isInitialized get() = labeler != null

    override fun definition() = ModuleDefinition {
        // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
        // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
        // The module will be accessible from `requireNativeModule('ExpoMLKit')` in JavaScript.
        Name("ImageLabelerModule")

        Function("isInitialized") {
            return@Function isInitialized;
        }

        AsyncFunction("initialize") { options: MyImageLabelerOptions?, promise: Promise ->
            labeler = null
            val confidenceThreshold = options?.confidenceThreshold ?: 0.5F
            Log.d(
                "ImageLabelerModule",
                "Loading ImageLabeler with confidenceThreshold: $confidenceThreshold"
            )
            try {
                val labelerOptions = ImageLabelerOptions.Builder()
                    .setConfidenceThreshold(confidenceThreshold)
                    .build()
                labeler = ImageLabeling.getClient(labelerOptions)

                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject(
                    "ImageLabelerModule init failed",
                    "ImageLabelerModule initializing failed",
                    e
                )
            }
        }

        AsyncFunction("labelImage") { uri: String, promise: Promise ->
            try {
                if (labeler == null) {
                    throw Exception("Not initialized")
                }

                val image: InputImage
                val uriInstance = Uri.parse(uri)
                image = InputImage.fromFilePath(context, uriInstance)

                requireNotNull(labeler).process(image)
                    .addOnSuccessListener { labels ->
                        // Task completed successfully
                        val result = labels.map { label ->
                            MyLabel(
                                text = label.text,
                                confidence = label.confidence,
                                index = label.index
                            )
                        }

                        promise.resolve(result)
                    }
                    .addOnFailureListener { e ->
                        promise.reject("labelImage Failed", "labelImage failed", e)
                    }
            } catch (e: IOException) {
                e.printStackTrace()
                Log.e(
                    "ImageLabelerModule",
                    "labelImage failed",
                    e
                )
                promise.reject(
                    "ImageLabelerModule",
                    "labelImage failed",
                    e
                )
            }
            Log.d("ImageLabelerModule", "labelImage for: $uri")
        }
    }
}