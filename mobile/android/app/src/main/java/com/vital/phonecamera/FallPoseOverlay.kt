package com.vital.phonecamera

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import java.io.ByteArrayOutputStream
import java.util.Locale

/** Draws on-device pose and temporal state on the snapshot shown by the phone and dashboard. */
internal object FallPoseOverlay {
    private val limbs = arrayOf(
        0 to 1, 0 to 2, 1 to 3, 2 to 4,
        5 to 6, 5 to 7, 7 to 9, 6 to 8, 8 to 10,
        5 to 11, 6 to 12, 11 to 12, 11 to 13, 13 to 15, 12 to 14, 14 to 16
    )

    fun render(
        bitmap: Bitmap,
        pose: YoloPose?,
        phase: String,
        descentFrameHeightsPerSecond: Float,
        verificationSecondsRemaining: Float
    ): ByteArray {
        val canvas = Canvas(bitmap)
        val scale = bitmap.width / 640f
        val redAlert = phase == "fall-verifying" || phase == "possible-fall" || phase == "horizontal-posture"
        val accent = if (redAlert) Color.rgb(255, 48, 38) else Color.rgb(68, 239, 87)
        val line = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = accent
            style = Paint.Style.STROKE
            strokeWidth = 3.2f * scale
            strokeCap = Paint.Cap.ROUND
            strokeJoin = Paint.Join.ROUND
        }
        val dot = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = accent; style = Paint.Style.FILL }
        val text = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            textSize = 15f * scale
            typeface = android.graphics.Typeface.create("sans-serif-medium", android.graphics.Typeface.NORMAL)
        }
        val panel = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.argb(215, 8, 18, 20); style = Paint.Style.FILL }

        if (pose != null && pose.poseUsable) {
            val left = pose.left * bitmap.width
            val top = pose.top * bitmap.height
            val right = (pose.left + pose.width).coerceAtMost(1f) * bitmap.width
            val bottom = (pose.top + pose.height).coerceAtMost(1f) * bitmap.height
            canvas.drawRect(left, top, right, bottom, line)

            limbs.forEach { (a, b) ->
                val first = pose.keypoints[a]
                val second = pose.keypoints[b]
                if (first.confidence >= 0.25f && second.confidence >= 0.25f) {
                    canvas.drawLine(first.x * bitmap.width, first.y * bitmap.height, second.x * bitmap.width, second.y * bitmap.height, line)
                }
            }
            pose.keypoints.filter { it.confidence >= 0.25f }.forEach {
                canvas.drawCircle(it.x * bitmap.width, it.y * bitmap.height, 3.3f * scale, dot)
            }

            val title = when (phase) {
                "fall-verifying" -> "PERSON #1  |  FALL VERIFYING"
                "possible-fall" -> "PERSON #1  |  POSSIBLE FALL"
                "horizontal-posture" -> "PERSON #1  |  HORIZONTAL POSTURE"
                else -> if (pose.torsoHorizontal) "PERSON #1  |  LYING · NO FALL TRANSITION" else "PERSON #1  |  MONITORING"
            }
            val lineHeight = 18f * scale
            val panelWidth = minOf(bitmap.width - 16f * scale, 270f * scale)
            val panelHeight = 4f * lineHeight + 12f * scale
            val panelLeft = left.coerceIn(8f * scale, bitmap.width - panelWidth - 8f * scale)
            val panelTop = (top - panelHeight - 5f * scale).coerceAtLeast(8f * scale)
            canvas.drawRoundRect(RectF(panelLeft, panelTop, panelLeft + panelWidth, panelTop + panelHeight), 5f * scale, 5f * scale, panel)
            canvas.drawText(title, panelLeft + 7f * scale, panelTop + lineHeight, text)
            canvas.drawText("Torso angle: ${pose.torsoAngleDegrees.toInt()}°", panelLeft + 7f * scale, panelTop + 2f * lineHeight, text)
            canvas.drawText("Vertical shift: ${formatSpeed(descentFrameHeightsPerSecond)} image-heights/s", panelLeft + 7f * scale, panelTop + 3f * lineHeight, text)
            canvas.drawText("Pose visibility: ${pose.visibleLandmarkPercent}%", panelLeft + 7f * scale, panelTop + 4f * lineHeight, text)
        } else {
            canvas.drawRoundRect(RectF(8f * scale, 8f * scale, bitmap.width - 8f * scale, 34f * scale), 5f * scale, 5f * scale, panel)
            canvas.drawText("PERSON NOT CLEAR  |  KEEP THE FULL BODY IN VIEW", 14f * scale, 27f * scale, text)
        }

        val bannerText = when (phase) {
            "fall-verifying" -> "FALL CHECK · ${formatSeconds(verificationSecondsRemaining)}s · STAND UP TO CANCEL"
            "possible-fall" -> "POSSIBLE FALL PATTERN · CHECK PHONE"
            "horizontal-posture" -> "HORIZONTAL POSTURE · REVIEW SAMPLE"
            else -> null
        }
        if (bannerText != null) {
            val bannerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = accent; style = Paint.Style.FILL }
            canvas.drawRect(0f, bitmap.height - 34f * scale, bitmap.width.toFloat(), bitmap.height.toFloat(), bannerPaint)
            val bannerTextPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = Color.WHITE
                textSize = 13f * scale
                typeface = android.graphics.Typeface.create("sans-serif-bold", android.graphics.Typeface.BOLD)
            }
            canvas.drawText(bannerText, 8f * scale, bitmap.height - 12f * scale, bannerTextPaint)
        }

        return ByteArrayOutputStream().use { out ->
            bitmap.compress(Bitmap.CompressFormat.JPEG, 78, out)
            out.toByteArray()
        }
    }

    private fun formatSpeed(value: Float) = String.format(Locale.US, "%+.2f", value)
    private fun formatSeconds(value: Float) = String.format(Locale.US, "%.1f", value.coerceAtLeast(0f))
}
