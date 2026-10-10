package com.vital.phonecamera

/** Confirms a sustained horizontal body posture instead of relying on one noisy frame. */
internal class FallTemporalClassifier {
    private var horizontalSinceMs = 0L
    private var lastHorizontalSampleAtMs = 0L
    private var horizontalSamples = 0

    @Synchronized
    fun observe(pose: YoloPose?, nowMs: Long): Boolean {
        val usable = pose != null && pose.poseUsable && pose.confidence >= MIN_PERSON_CONFIDENCE
        if (!usable || pose?.torsoHorizontal != true) {
            // A single missed/rotated keypoint frame should not erase an otherwise
            // stable posture candidate. Expire only after a real observation gap.
            if (horizontalSinceMs > 0L && nowMs - lastHorizontalSampleAtMs > MAX_SAMPLE_GAP_MS) resetCandidate()
            return false
        }

        if (horizontalSinceMs == 0L || nowMs - lastHorizontalSampleAtMs > MAX_SAMPLE_GAP_MS) {
            horizontalSinceMs = nowMs
            horizontalSamples = 0
        }
        lastHorizontalSampleAtMs = nowMs
        horizontalSamples++

        if (horizontalSamples >= MIN_HORIZONTAL_SAMPLES && nowMs - horizontalSinceMs >= HORIZONTAL_HOLD_MS) {
            resetCandidate()
            return true
        }
        return false
    }

    @Synchronized
    fun reset() = resetCandidate()

    private fun resetCandidate() {
        horizontalSinceMs = 0L
        lastHorizontalSampleAtMs = 0L
        horizontalSamples = 0
    }

    private companion object {
        const val MIN_PERSON_CONFIDENCE = 0.35f
        const val HORIZONTAL_HOLD_MS = 1_800L
        const val MIN_HORIZONTAL_SAMPLES = 3
        const val MAX_SAMPLE_GAP_MS = 2_700L
    }
}
