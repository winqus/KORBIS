package expo.modules.mlkit

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.graphics.Rect
import android.net.Uri
import android.util.Base64
import android.util.Log
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.subject.Subject
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenter
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

class MySubjectSegmenterOptions(
    @Field val confidenceThreshold: Float?
) : Record {}

class SubjectSegmentationModule : Module() {
    private val context get() = requireNotNull(appContext.reactContext)

    private var segmenter: SubjectSegmenter? = null

    private val isInitialized get() = segmenter != null

    private var segmentationConfidenceThreshold = 0.5f

    override fun definition() = ModuleDefinition {
        // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
        // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
        // The module will be accessible from `requireNativeModule('ExpoMLKit')` in JavaScript.
        Name("SubjectSegmentationModule")

        Function("isInitialized") {
            return@Function isInitialized;
        }

        AsyncFunction("initialize") { options: MySubjectSegmenterOptions?, promise: Promise ->
            segmenter = null
            Log.d(
                "SubjectSegmentationModule",
                "Loading SubjectSegmenter"
            )
            try {
                if (options?.confidenceThreshold != null) {
                    segmentationConfidenceThreshold = options.confidenceThreshold
                }

                segmenter = SubjectSegmentation.getClient(
                    SubjectSegmenterOptions.Builder()
                        .enableMultipleSubjects(
                            SubjectSegmenterOptions.SubjectResultOptions.Builder()
                                .enableConfidenceMask()
                                .enableSubjectBitmap()
                                .build()
                        )
                        .build()
                )

                Log.d(
                    "SubjectSegmentationModule",
                    "Initialized SubjectSegmenter with confidenceThreshold=$segmentationConfidenceThreshold"
                )

                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject(
                    "SubjectSegmentationModule init failed",
                    "SubjectSegmentationModule initializing failed",
                    e
                )
            }
        }

        AsyncFunction("segmentSubjectsInImage") { uri: String, promise: Promise ->
            try {
                if (segmenter == null) {
                    throw Exception("Not initialized")
                }

                val image: InputImage
                val uriInstance = Uri.parse(uri)
                image = InputImage.fromFilePath(context, uriInstance)

                requireNotNull(segmenter).process(image)
                    .addOnSuccessListener { result ->
                        val subjects = result.subjects
                        Log.d(
                            "SubjectSegmentationModule",
                            "Found ${subjects.size} subjects"
                        )

                        try {
                            // If no subjects were found, return an empty result
                            if (subjects.isEmpty()) {
                                promise.resolve(null)
                                return@addOnSuccessListener
                            }

                            // Create a target bitmap with the same dimensions as the input image
                            val resultBitmap = Bitmap.createBitmap(
                                image.width,
                                image.height,
                                Bitmap.Config.ARGB_8888
                            )
                            val canvas = Canvas(resultBitmap)

                            val subjectFrames = mutableListOf<MyRect>()
                            // For each subject, draw its bitmap onto the result bitmap with a distinct color
                            for (subjectIndex in subjects.indices) {
                                val subject = subjects[subjectIndex]
                                val subjectBitmap = subject.bitmap
                                val subjectFrame = subjectToFrame(subject)
                                subjectFrames.add(subjectFrame)

                                if (subjectBitmap != null) {
                                    // Create a colored version of the subject bitmap
                                    val color = generateDistinctColor(subjectIndex)
                                    val paint = Paint()
                                    paint.colorFilter =
                                        PorterDuffColorFilter(color, PorterDuff.Mode.SRC_IN)

                                    // Draw the colored subject onto the canvas at its position
                                    canvas.drawBitmap(
                                        subjectBitmap,
                                        subject.startX.toFloat(),
                                        subject.startY.toFloat(),
                                        paint
                                    )

                                    Log.d(
                                        "SubjectSegmentationModule",
                                        "Added subject #$subjectIndex with color ${
                                            String.format(
                                                "#%08X",
                                                color
                                            )
                                        }"
                                    )
                                } else {
                                    Log.w(
                                        "SubjectSegmentationModule",
                                        "Subject bitmap is null"
                                    )
                                }
                            }

                            // Create a file to save the result
                            val fileName = "segmentation_mask_${System.currentTimeMillis()}.png"
                            val cacheDir = context.cacheDir
                            val maskFile = File(cacheDir, fileName)

                            // Save the bitmap to the file
                            FileOutputStream(maskFile).use { out ->
                                resultBitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
                            }

                            // Return the file URI
                            val fileUri = "file://${maskFile.absolutePath}"
                            Log.d("SubjectSegmentationModule", "Saved mask to file: $fileUri")

                            val response = mutableMapOf<String, Any?>(
                                "inputImageWidth" to image.width,
                                "inputImageHeight" to image.height,
                                "frames" to subjectFrames,
                                "mask" to mapOf(
                                    "fileUri" to fileUri,
                                    "width" to resultBitmap.width,
                                    "height" to resultBitmap.height
                                )
                            )

                            promise.resolve(response)

                        } catch (e: Exception) {
                            Log.e("SubjectSegmentationModule", "Error processing segmentation", e)
                            promise.reject("SegmentationError", "Failed to process segmentation", e)
                        }
                    }
                    .addOnFailureListener { e ->
                        promise.reject("segmentSubjects Failed", "segmentSubjects failed", e)
                    }
            } catch (e: IOException) {
                e.printStackTrace()
                Log.e(
                    "SubjectSegmentationModule",
                    "segmentSubjects failed",
                    e
                )
                promise.reject(
                    "SubjectSegmentationModule",
                    "segmentSubjects failed",
                    e
                )
            }
            Log.d("SubjectSegmentationModule", "segmentSubjects for: $uri")
        }
    }

    /**
     * Generates a distinct color for a given index using HSV color space
     * @param index The index used to generate a unique color
     * @param alpha The alpha transparency value (0-255)
     * @return An ARGB color integer
     */
    private fun generateDistinctColor(index: Int, alpha: Int = 128): Int {
        // Use golden angle approximation for good distribution around the color wheel
        val hue = (index * 137.5f) % 360f
        val saturation = 0.9f  // High saturation for vibrant colors
        val value = 0.9f       // Bright but not too bright

        // Convert HSV to RGB with specified alpha
        val hsv = floatArrayOf(hue, saturation, value)
        return Color.HSVToColor(alpha, hsv)
    }

    private fun subjectToFrame(subject: Subject): MyRect {
        val frameObject = MyRect(
            left = subject.startX.toFloat(),
            top = subject.startY.toFloat(),
            width = subject.width.toFloat(),
            height = subject.height.toFloat()
        )

        return frameObject
    }
}
