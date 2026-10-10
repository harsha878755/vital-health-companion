package com.vital.phonecamera

import ai.onnxruntime.OnnxTensor
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import kotlin.math.max
import kotlin.math.min

internal data class YoloPose(
    val observedAtMs: Long,
    val centerX: Float,
    val centerY: Float,
    val left: Float,
    val top: Float,
    val width: Float,
    val height: Float,
    val torsoAngleDegrees: Float,
    val visibleLandmarkPercent: Int,
    val keypoints: List<YoloKeypoint>,
    val torsoHorizontal: Boolean,
    val poseUsable: Boolean,
    val confidence: Float
)

internal data class YoloKeypoint(val x: Float, val y: Float, val confidence: Float)

/** On-device YOLO11n pose inference. Images never leave the phone for model inference. */
internal class YoloPoseDetector(context: Context) : AutoCloseable {
    private val environment = OrtEnvironment.getEnvironment()
    private val session: OrtSession
    private val inputName: String
    private val inputBuffer: FloatBuffer = ByteBuffer
        .allocateDirect(3 * INPUT_SIZE * INPUT_SIZE * Float.SIZE_BYTES)
        .order(ByteOrder.nativeOrder())
        .asFloatBuffer()

    init {
        val modelBytes = context.assets.open(MODEL_FILE).use { it.readBytes() }
        val options = OrtSession.SessionOptions().apply { setIntraOpNumThreads(2) }
        session = environment.createSession(modelBytes, options)
        options.close()
        inputName = session.inputNames.first()
        val shape = session.inputInfo[inputName]?.info as? ai.onnxruntime.TensorInfo
            ?: error("YOLO model input metadata is invalid")
        require(shape.shape.contentEquals(longArrayOf(1, 3, INPUT_SIZE.toLong(), INPUT_SIZE.toLong()))) {
            "YOLO pose model must accept a 640 × 640 RGB tensor"
        }
    }

    @Synchronized
    fun detect(bitmap: Bitmap, observedAtMs: Long): YoloPose? {
        val transform = letterbox(bitmap)
        inputBuffer.clear()
        val pixels = IntArray(INPUT_SIZE * INPUT_SIZE)
        transform.getPixels(pixels, 0, INPUT_SIZE, 0, 0, INPUT_SIZE, INPUT_SIZE)
        val planeSize = INPUT_SIZE * INPUT_SIZE
        for (index in pixels.indices) {
            val pixel = pixels[index]
            inputBuffer.put(index, Color.red(pixel) / 255f)
            inputBuffer.put(planeSize + index, Color.green(pixel) / 255f)
            inputBuffer.put(2 * planeSize + index, Color.blue(pixel) / 255f)
        }
        inputBuffer.position(0)

        val tensor = OnnxTensor.createTensor(
            environment,
            inputBuffer,
            longArrayOf(1, 3, INPUT_SIZE.toLong(), INPUT_SIZE.toLong())
        )
        try {
            session.run(mapOf(inputName to tensor)).use { results ->
                val output = results[0].value as? Array<*> ?: return null
                val channelValues = output.firstOrNull() as? Array<*> ?: return null
                if (channelValues.size != OUTPUT_CHANNELS) return null
                val channels = Array(OUTPUT_CHANNELS) { channelValues[it] as? FloatArray ?: return null }
                var bestIndex = -1
                var bestConfidence = PERSON_CONFIDENCE_THRESHOLD
                for (index in 0 until PREDICTION_COUNT) {
                    val confidence = channels[4][index]
                    if (confidence > bestConfidence) {
                        bestConfidence = confidence
                        bestIndex = index
                    }
                }
                if (bestIndex < 0) return null

                fun sourceX(modelX: Float): Float = ((modelX - transform.padX) / transform.scale / bitmap.width).coerceIn(0f, 1f)
                fun sourceY(modelY: Float): Float = ((modelY - transform.padY) / transform.scale / bitmap.height).coerceIn(0f, 1f)

                val centerX = sourceX(channels[0][bestIndex])
                val centerY = sourceY(channels[1][bestIndex])
                val width = (channels[2][bestIndex] / transform.scale / bitmap.width).coerceIn(0f, 1f)
                val height = (channels[3][bestIndex] / transform.scale / bitmap.height).coerceIn(0f, 1f)
                val points = List(17) { pointIndex ->
                    val offset = 5 + pointIndex * 3
                    YoloKeypoint(
                        x = sourceX(channels[offset][bestIndex]),
                        y = sourceY(channels[offset + 1][bestIndex]),
                        confidence = channels[offset + 2][bestIndex]
                    )
                }
                val shoulders = midpoint(points[5], points[6])
                val hips = midpoint(points[11], points[12])
                val poseUsable = shoulders != null && hips != null
                val torsoDx = if (poseUsable) kotlin.math.abs(shoulders!!.first - hips!!.first) else 0f
                val torsoDy = if (poseUsable) kotlin.math.abs(shoulders!!.second - hips!!.second) else 0f
                // Person boxes include blankets, arms, and bent legs and can be
                // nearly square even when the torso is clearly horizontal. Use
                // the shoulder-to-hip axis as the primary posture signal.
                val horizontal = poseUsable && torsoDx > 0.015f && torsoDx > torsoDy * 1.15f
                val torsoAngle = if (poseUsable) Math.toDegrees(kotlin.math.atan2(torsoDy.toDouble(), torsoDx.toDouble())).toFloat() else 0f
                val visibleLandmarks = points.count { it.confidence >= KEYPOINT_CONFIDENCE_THRESHOLD }
                return YoloPose(
                    observedAtMs = observedAtMs,
                    centerX = centerX,
                    centerY = centerY,
                    left = (centerX - width / 2f).coerceIn(0f, 1f),
                    top = (centerY - height / 2f).coerceIn(0f, 1f),
                    width = width,
                    height = height,
                    torsoAngleDegrees = torsoAngle,
                    visibleLandmarkPercent = (visibleLandmarks * 100 / points.size),
                    keypoints = points,
                    torsoHorizontal = horizontal,
                    poseUsable = poseUsable,
                    confidence = bestConfidence
                )
            }
        } finally {
            tensor.close()
            transform.bitmap.recycle()
        }
    }

    private fun midpoint(first: YoloKeypoint, second: YoloKeypoint): Pair<Float, Float>? {
        val firstVisible = first.confidence >= KEYPOINT_CONFIDENCE_THRESHOLD
        val secondVisible = second.confidence >= KEYPOINT_CONFIDENCE_THRESHOLD
        return when {
            firstVisible && secondVisible -> ((first.x + second.x) / 2f) to ((first.y + second.y) / 2f)
            firstVisible -> first.x to first.y
            secondVisible -> second.x to second.y
            else -> null
        }
    }

    private fun letterbox(source: Bitmap): LetterboxedBitmap {
        val scale = min(INPUT_SIZE.toFloat() / source.width, INPUT_SIZE.toFloat() / source.height)
        val width = max(1, (source.width * scale).toInt())
        val height = max(1, (source.height * scale).toInt())
        val padX = (INPUT_SIZE - width) / 2f
        val padY = (INPUT_SIZE - height) / 2f
        val output = Bitmap.createBitmap(INPUT_SIZE, INPUT_SIZE, Bitmap.Config.ARGB_8888)
        Canvas(output).apply {
            drawColor(Color.rgb(114, 114, 114))
            drawBitmap(source, null, android.graphics.RectF(padX, padY, padX + width, padY + height), Paint(Paint.FILTER_BITMAP_FLAG))
        }
        return LetterboxedBitmap(output, scale, padX, padY)
    }

    override fun close() {
        session.close()
    }

    private data class LetterboxedBitmap(val bitmap: Bitmap, val scale: Float, val padX: Float, val padY: Float) {
        fun getPixels(pixels: IntArray, offset: Int, stride: Int, x: Int, y: Int, width: Int, height: Int) =
            bitmap.getPixels(pixels, offset, stride, x, y, width, height)
        fun recycle() = bitmap.recycle()
    }

    companion object {
        private const val MODEL_FILE = "yolo11n-pose.onnx"
        private const val INPUT_SIZE = 640
        private const val OUTPUT_CHANNELS = 56
        private const val PREDICTION_COUNT = 8400
        private const val PERSON_CONFIDENCE_THRESHOLD = 0.35f
        private const val KEYPOINT_CONFIDENCE_THRESHOLD = 0.25f
    }
}
