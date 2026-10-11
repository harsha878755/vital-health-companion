package com.vital.phonecamera

/**
 * Looks for a rapid upright-to-horizontal descent before starting the stillness
 * confirmation. A person who is already lying down (for example, asleep in bed)
 * is not treated as a fall candidate merely for remaining horizontal.
 *
 * This is a fall-pattern heuristic, not an intent classifier: a staged fall can
 * look like a real fall to a camera-only system.
 */
internal class FallTemporalClassifier {
    private var lastUprightPose: YoloPose? = null
    private var lastUprightAtMs = 0L
    private var lastObservedAtMs = 0L
    private var horizontalCandidateSinceMs = 0L
    private var horizontalCandidateSamples = 0

    @Synchronized
    fun observe(pose: YoloPose?, nowMs: Long): Boolean {
        val usable = pose != null && pose.poseUsable && pose.confidence >= MIN_PERSON_CONFIDENCE
        if (!usable) {
            expireUprightReference(nowMs)
            return false
        }

        pose!!
        if (!pose.torsoHorizontal) {
            // Keep the latest upright pose as the baseline for a possible descent.
            lastUprightPose = pose
            lastUprightAtMs = nowMs
            lastObservedAtMs = nowMs
            resetHorizontalCandidate()
            return false
        }

        val upright = lastUprightPose
        val transitionAgeMs = nowMs - lastUprightAtMs
        val sampleGapMs = if (lastObservedAtMs == 0L) Long.MAX_VALUE else nowMs - lastObservedAtMs
        lastObservedAtMs = nowMs

        if (upright == null || transitionAgeMs !in MIN_TRANSITION_MS..MAX_TRANSITION_MS || sampleGapMs > MAX_SAMPLE_GAP_MS) {
            // Horizontal posture without a recent upright-to-horizontal transition
            // is ordinary resting/lying behavior, not a fall signal.
            resetHorizontalCandidate()
            expireUprightReference(nowMs)
            return false
        }

        val downwardShift = pose.centerY - upright.centerY
        val descentSpeed = downwardShift / (transitionAgeMs / 1_000f)
        val torsoRotation = upright.torsoAngleDegrees - pose.torsoAngleDegrees
        val looksLikeRapidDescent = downwardShift >= MIN_DOWNWARD_SHIFT &&
            descentSpeed >= MIN_DESCENT_SPEED &&
            torsoRotation >= MIN_TORSO_ROTATION_DEGREES

        if (!looksLikeRapidDescent) {
            resetHorizontalCandidate()
            // Once the transition window passes, don't compare against stale upright
            // coordinates if the person continues to lie down.
            expireUprightReference(nowMs)
            return false
        }

        if (horizontalCandidateSinceMs == 0L || nowMs - horizontalCandidateSinceMs > MAX_SAMPLE_GAP_MS) {
            horizontalCandidateSinceMs = nowMs
            horizontalCandidateSamples = 0
        }
        horizontalCandidateSamples++

        val confirmed = horizontalCandidateSamples >= REQUIRED_HORIZONTAL_SAMPLES &&
            nowMs - horizontalCandidateSinceMs >= HORIZONTAL_CONFIRMATION_MS
        if (confirmed) reset()
        return confirmed
    }

    @Synchronized
    fun reset() {
        lastUprightPose = null
        lastUprightAtMs = 0L
        lastObservedAtMs = 0L
        resetHorizontalCandidate()
    }

    private fun expireUprightReference(nowMs: Long) {
        if (lastUprightAtMs > 0L && nowMs - lastUprightAtMs > MAX_TRANSITION_MS) {
            lastUprightPose = null
            lastUprightAtMs = 0L
        }
    }

    private fun resetHorizontalCandidate() {
        horizontalCandidateSinceMs = 0L
        horizontalCandidateSamples = 0
    }

    private companion object {
        const val MIN_PERSON_CONFIDENCE = 0.35f
        const val MIN_TRANSITION_MS = 250L
        const val MAX_TRANSITION_MS = 2_400L
        const val MAX_SAMPLE_GAP_MS = 1_800L
        const val MIN_DOWNWARD_SHIFT = 0.075f
        const val MIN_DESCENT_SPEED = 0.055f
        const val MIN_TORSO_ROTATION_DEGREES = 32f
        const val HORIZONTAL_CONFIRMATION_MS = 650L
        const val REQUIRED_HORIZONTAL_SAMPLES = 2
    }
}
