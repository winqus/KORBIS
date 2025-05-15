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
import java.io.IOException

class TextRecognitionV2Module : Module() {
    private val context
        get() = requireNotNull(appContext.reactContext)

    fun getRectMap(rect: Rect?): Map<String, Int>? {
        if (rect == null) {
            return null
        }

        val rectObject = mapOf(
            "left" to rect.left,
            "top" to rect.top,
            "width" to (rect.right - rect.left),
            "height" to (rect.bottom - rect.top)
        )

        return rectObject
    }

    override fun definition() = ModuleDefinition {
        // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
        // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
        // The module will be accessible from `requireNativeModule('ExpoMLKit')` in JavaScript.
        Name("TextRecognitionV2Module")

        AsyncFunction("recognizeTextInImage") { uri: String, promise: Promise ->
            val image: InputImage

            val uriInstance = Uri.parse(uri)


            try {
                image = InputImage.fromFilePath(context, uriInstance)

                val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

                recognizer.process(image)
                    .addOnSuccessListener { result ->
                        val response = mutableMapOf<String, Any?>(
                            "width" to image.width,
                            "height" to image.height,
                            "text" to result.text
                        )

                        val blocks = result.textBlocks.map { block ->
                            val blockMap = mutableMapOf<String, Any?>(
                                "text" to block.text,
                                "rect" to getRectMap(block.boundingBox)
                            )

                            val lines = block.lines.map { line ->
                                mapOf(
                                    "text" to line.text,
                                    "rect" to getRectMap(line.boundingBox)
                                )
                            }

                            blockMap["lines"] = lines
                            blockMap
                        }

                        response["blocks"] = blocks
                        promise.resolve(response)
                    }
                    .addOnFailureListener { e ->
                        // Task failed with an exception
                        promise.reject("Text Recognition Failed", "recognizeTextInImage failed", e)
                    }
            } catch (e: IOException) {
                e.printStackTrace()
            }
            Log.d("TextRecognitionV2Module", "recognizeTextInImage for: $uri")
        }
    }
}