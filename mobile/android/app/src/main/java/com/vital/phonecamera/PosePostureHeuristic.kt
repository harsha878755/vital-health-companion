package com.vital.phonecamera

import com.google.mlkit.vision.pose.Pose
import com.google.mlkit.vision.pose.PoseLandmark

/** Shared posture rule used by live snapshots and the offline prerecorded-video check. */
internal object PosePostureHeuristic {
    const val REQUIRED_CONSECUTIVE_SAMPLES = 5

    data class Assessment(val hasTorsoLandmarks: Boolean, val horizontalTorso: Boolean, val lowHorizontal: Boolean)

    fun assess(pose: Pose, imageWidth: Int, imageHeight: Int): Assessment {
        val leftShoulder = pose.getPoseLandmark(PoseLandmark.LEFT_SHOULDER)
        val rightShoulder = pose.getPoseLandmark(PoseLandmark.RIGHT_SHOULDER)
        val leftHip = pose.getPoseLandmark(PoseLandmark.LEFT_HIP)
        val rightHip = pose.getPoseLandmark(PoseLandmark.RIGHT_HIP)
        if (leftShoulder == null || rightShoulder == null || leftHip == null || rightHip == null) {
            return Assessment(hasTorsoLandmarks = false, horizontalTorso = false, lowHorizontal = false)
        }

        val shoulderX = (leftShoulder.position.x + rightShoulder.position.x) / 2f
        val shoulderY = (leftShoulder.position.y + rightShoulder.position.y) / 2f
        val hipX = (leftHip.position.x + rightHip.position.x) / 2f
        val hipY = (leftHip.position.y + rightHip.position.y) / 2f
        val torsoDx = kotlin.math.abs(shoulderX - hipX)
        val torsoDy = kotlin.math.abs(shoulderY - hipY)
        val centerY = (shoulderY + hipY) / 2f
        val horizontalTorso = torsoDx > 1f && torsoDy < torsoDx * 0.65f
        val lowHorizontal = horizontalTorso && centerY > imageHeight * 0.48f
        return Assessment(hasTorsoLandmarks = true, horizontalTorso = horizontalTorso, lowHorizontal = lowHorizontal)
    }
}
