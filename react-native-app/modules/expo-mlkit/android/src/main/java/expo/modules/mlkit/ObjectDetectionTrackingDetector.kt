package expo.modules.mlkit

import android.content.Context
import android.net.Uri
import android.util.Log
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.objects.DetectedObject
import com.google.mlkit.vision.objects.ObjectDetection
import com.google.mlkit.vision.objects.ObjectDetector
import com.google.mlkit.vision.objects.defaults.ObjectDetectorOptions
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import kotlinx.coroutines.CompletableDeferred
import java.io.IOException

class ObjectDetectionTrackingDetectorOptions : Record {
    @Field
    var shouldEnableClassification: Boolean = false

    @Field
    var shouldEnableMultipleObjects: Boolean = false

    @Field
    var detectorMode: String = "singleImage"

    @Field
    var classificationConfidenceThreshold: Float = 0.0f

    @Field
    var maxPerObjectLabelCount: Int = 10
}

public data class MyDetectedObjectRecord(
    @Field
    var frame: MyRect,

    @Field
    var labels: List<MyLabel> = mutableListOf(),

    @Field
    var trackingId: Int? = null
) : Record

public data class ObjectDetectionResult(
    @Field
    var width: Int,

    @Field
    var height: Int,

    @Field
    var detectedObjects: List<MyDetectedObject>
) : Record

public class MyDetectedObject(private val detectedObject: DetectedObject) {
    val record: MyDetectedObjectRecord
        get() = MyDetectedObjectRecord(
            frame = MyRect.fromRect(detectedObject.boundingBox),
            labels = detectedObject.labels.map { MyLabel(it.text, it.confidence) },
            trackingId = detectedObject.trackingId
        )
}

abstract class MyAbstractObjectDetector {
    internal abstract var objectDetector: ObjectDetector?
    abstract suspend fun detectObjects(
        imagePath: String
    ): Result<ObjectDetectionResult>

    abstract val isLoaded: Boolean
}


class ObjectDetectionTrackingDetector(
    private var options: ObjectDetectionTrackingDetectorOptions?,
    private var context: Context
) : MyAbstractObjectDetector() {
    override var objectDetector: ObjectDetector? = null
    private var isModelLoaded: Boolean = false

    override val isLoaded: Boolean
        get() = isModelLoaded


    init {
        try {
            val mode = when (options?.detectorMode?.toString()) {
                "singleImage" -> ObjectDetectorOptions.SINGLE_IMAGE_MODE
                "stream" -> ObjectDetectorOptions.STREAM_MODE
                else -> ObjectDetectorOptions.SINGLE_IMAGE_MODE
            }

            val options =
                ObjectDetectorOptions.Builder().setDetectorMode(mode).apply {
                    options?.let {
                        if (it.shouldEnableClassification) enableClassification()
                        if (it.shouldEnableMultipleObjects) enableMultipleObjects()
                    }
                }.build()

            objectDetector = ObjectDetection.getClient(options)
            isModelLoaded = true


        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override suspend fun detectObjects(
        imagePath: String
    ): Result<ObjectDetectionResult> {
        val result = CompletableDeferred<Result<ObjectDetectionResult>>()

        Log.d(
            "ObjectDetectionTrackingDetector",
            "detectObjects: Starting detection with default model"
        )

        val image: InputImage

        try {
            val uriInstance = Uri.parse(imagePath)
            image = InputImage.fromFilePath(context, uriInstance)

            if (objectDetector == null || !isModelLoaded) {
                result.complete(Result.failure(Exception("ObjectDetectionTrackingDetector: Model is not loaded")))
                return result.await()
            }

            objectDetector?.process(image)
                ?.addOnSuccessListener { detectedObjects ->
                    Log.d(
                        "ObjectDetectionTrackingDetector",
                        "detectObjects.addOnSuccessListener: Got Labels from default model"
                    )
                    Log.d(
                        "ObjectDetectionTrackingDetector",
                        "detectObjects.addOnSuccessListener: Detected ${detectedObjects.size} objects"
                    )
                    Log.d(
                        "ObjectDetectionTrackingDetector",
                        detectedObjects.map { it.toString() }.toString()
                    )

                    val myDetectedObjects = detectedObjects.map { detectedObject ->
                        MyDetectedObject(detectedObject)
                    }

                    val detectionResult = ObjectDetectionResult(
                        width = image.width,
                        height = image.height,
                        detectedObjects = myDetectedObjects
                    )

                    result.complete(Result.success(detectionResult))
                }
                ?.addOnFailureListener { e ->
                    Log.e(
                        "ObjectDetectionTrackingDetector",
                        "detectObjects.addOnFailureListener: Failed to get labels",
                        e
                    )
                    result.complete(Result.failure(e))
                }

        } catch (e: IOException) {
            Log.e("ObjectDetectionTrackingDetector", "detectObjects: Failed to load image", e)
            result.complete(Result.failure(e))
        } catch (e: Exception) {
            Log.e("ObjectDetectionTrackingDetector", "detectObjects: Unexpected error", e)
            result.complete(Result.failure(e))
        }

        return result.await()
    }
}