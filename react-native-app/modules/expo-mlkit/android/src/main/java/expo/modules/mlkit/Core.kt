package expo.modules.mlkit

import android.graphics.Rect
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

import android.graphics.PointF

data class MyPoint(
    @Field var x: Float = 0f,
    @Field var y: Float = 0f
) : Record {
    companion object {
        fun fromPointF(p: PointF): MyPoint {
            return MyPoint(p.x, p.y)
        }

        fun zero(): MyPoint {
            return MyPoint(0f, 0f)
        }
    }
}

data class MySize(
    @Field var width: Float = 0f,
    @Field var height: Float = 0f
) : Record {
    companion object {
        fun fromPointF(p: PointF): MySize {
            return MySize(p.x, p.y)
        }

        fun zero(): MySize {
            return MySize(0f, 0f)
        }
    }
}


data class MyRect(
    @Field var left: Float = 0f,
    @Field var top: Float = 0f,
    @Field var width: Float = 0f,
    @Field var height: Float = 0f
) : Record {
    companion object {
        fun fromRect(rect: Rect): MyRect {
            return MyRect(
                left = rect.left.toFloat(),
                top = rect.top.toFloat(),
                width = rect.width().toFloat(),
                height = rect.height().toFloat()
            )
        }

        fun zero(): MyRect {
            return MyRect(0f, 0f, 0f, 0f)
        }
    }
}

data class MyLabel(
    @Field var text: String,
    @Field var confidence: Float,
    @Field var index: Int? = null,
) : Record