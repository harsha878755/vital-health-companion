package com.vital.phonecamera

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.telephony.SmsManager
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageCapture.OutputFileOptions
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleService
import androidx.exifinterface.media.ExifInterface
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.io.ByteArrayInputStream
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

class CameraRelayService : LifecycleService() {
    private val ui = Handler(Looper.getMainLooper())
    private val appointmentSmsTicker = object : Runnable {
        override fun run() {
            if (stopped) return
            AppointmentSmsSync.poll(this@CameraRelayService)
            ui.postDelayed(this, 15_000L)
        }
    }
    private val cameraExecutor: ExecutorService by lazy { Executors.newSingleThreadExecutor() }
    private val networkExecutor: ExecutorService by lazy { Executors.newSingleThreadExecutor() }
    private val alertExecutor: ExecutorService by lazy { Executors.newSingleThreadExecutor() }
    private val http by lazy {
        OkHttpClient.Builder()
            .connectTimeout(5, TimeUnit.SECONDS)
            .writeTimeout(8, TimeUnit.SECONDS)
            .readTimeout(8, TimeUnit.SECONDS)
            .callTimeout(12, TimeUnit.SECONDS)
            .build()
    }
    private var imageCapture: ImageCapture? = null
    private var cameraProvider: ProcessCameraProvider? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var yoloPoseDetector: YoloPoseDetector? = null
    private val fallClassifier = FallTemporalClassifier()
    @Volatile private var isCapturing = false
    @Volatile private var stopped = false
    @Volatile private var fallAlertPending = false
    @Volatile private var fallAlertCooldownUntil = 0L
    @Volatile private var yoloUnavailable = false
    private var previousPoseForMetrics: YoloPose? = null
    private var previousVerificationPose: YoloPose? = null
    private var fallVerificationStartedAtMs = 0L
    private var verificationBadPoseSinceMs = 0L
    private var verificationUprightSamples = 0
    private var confirmedFallDisplayUntilMs = 0L
    private val networkBusy = AtomicBoolean(false)
    private val captureLoop: Runnable = object : Runnable {
        override fun run() {
            if (stopped || isCapturing) return
            val capture = imageCapture ?: return
            isCapturing = true
            val file = File(cacheDir, "vital-camera-latest.jpg")
            runCatching { file.delete() }
            val options = OutputFileOptions.Builder(file)
                .setMetadata(ImageCapture.Metadata().apply { isReversedHorizontal = false })
                .build()
            capture.takePicture(options, cameraExecutor, object : ImageCapture.OnImageSavedCallback {
                override fun onImageSaved(result: ImageCapture.OutputFileResults) {
                    try {
                        if (!stopped && file.exists()) {
                            val bytes = file.readBytes()
                            val analysis = analyzePossibleFall(bytes)
                            sendFrame(analysis.jpeg, analysis.poseStatus)
                            publishFrameToPhone(analysis.jpeg)
                        }
                    } finally {
                        file.delete()
                        isCapturing = false
                        if (!stopped) ui.postDelayed(captureLoop, FRAME_INTERVAL_MS)
                    }
                }

                override fun onError(exception: ImageCaptureException) {
                    file.delete()
                    isCapturing = false
                    if (!stopped) ui.postDelayed(captureLoop, FRAME_INTERVAL_MS)
                }
            })
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)
        if (intent?.action == ACTION_STOP) {
            stopRelay()
            return START_NOT_STICKY
        }
        if (stopped) return START_NOT_STICKY
        startAsForeground()
        acquireWakeLock()
        ui.removeCallbacks(appointmentSmsTicker)
        ui.post(appointmentSmsTicker)
        startCamera()
        return START_NOT_STICKY
    }

    private fun startAsForeground() {
        val notification = buildNotification("Camera on · connecting to VITAL")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun startCamera() {
        val future = ProcessCameraProvider.getInstance(this)
        future.addListener({
            if (stopped) return@addListener
            try {
                cameraProvider = future.get().also { provider ->
                    val capture = ImageCapture.Builder()
                        .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                        .setTargetResolution(android.util.Size(FRAME_WIDTH, FRAME_HEIGHT))
                        .setJpegQuality(JPEG_QUALITY)
                        .build()
                    imageCapture = capture
                    provider.unbindAll()
                    provider.bindToLifecycle(this, CameraSelector.DEFAULT_BACK_CAMERA, capture)
                }
                updateNotification("YOLO fall monitor active · syncing live status")
                ui.post(captureLoop)
            } catch (_: Exception) {
                updateNotification("Camera unavailable · open VITAL app to retry")
                stopRelay()
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun sendFrame(jpeg: ByteArray, poseStatus: String) {
        if (!networkBusy.compareAndSet(false, true)) return
        networkExecutor.execute {
            try {
                val prefs = getSharedPreferences("vital-camera", Context.MODE_PRIVATE)
                val base = prefs.getString("server", "").orEmpty().trimEnd('/')
                val token = prefs.getString("token", "").orEmpty()
                if (base.isBlank() || token.isBlank()) {
                    ui.post { updateNotification("VITAL pairing missing · open the app to reconnect") }
                    return@execute
                }
                val request = Request.Builder()
                    .url("$base/api/camera/frame")
                    .header("Authorization", "Bearer $token")
                    .header("X-Vital-Pose-Status", poseStatus)
                    .post(jpeg.toRequestBody("image/jpeg".toMediaType()))
                    .build()
                http.newCall(request).execute().use { response ->
                    if (response.code == 401) {
                        prefs.edit().remove("token").apply()
                        ui.post { stopRelay() }
                    } else if (!response.isSuccessful) {
                        ui.post { updateNotification("VITAL connection issue · retrying") }
                    }
                }
            } catch (_: Exception) {
                ui.post { updateNotification("VITAL offline · retrying on Wi-Fi") }
            } finally {
                networkBusy.set(false)
            }
        }
    }

    private data class FrameAnalysis(val jpeg: ByteArray, val poseStatus: String)

    private fun analyzePossibleFall(jpeg: ByteArray): FrameAnalysis {
        if (stopped || yoloUnavailable) return FrameAnalysis(jpeg, "pose-not-clear")
        val decoded = BitmapFactory.decodeByteArray(jpeg, 0, jpeg.size) ?: return FrameAnalysis(jpeg, "pose-not-clear")
        val mutable = if (decoded.isMutable) decoded else decoded.copy(Bitmap.Config.ARGB_8888, true).also { decoded.recycle() }
        val bitmap = runCatching {
            val orientation = ExifInterface(ByteArrayInputStream(jpeg)).getAttributeInt(
                ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL
            )
            val degrees = when (orientation) {
                ExifInterface.ORIENTATION_ROTATE_90 -> 90f
                ExifInterface.ORIENTATION_ROTATE_180 -> 180f
                ExifInterface.ORIENTATION_ROTATE_270 -> 270f
                else -> 0f
            }
            if (degrees == 0f) mutable else Bitmap.createBitmap(
                mutable, 0, 0, mutable.width, mutable.height, Matrix().apply { postRotate(degrees) }, true
            ).also { if (it !== mutable) mutable.recycle() }
        }.getOrElse { mutable }
        val now = System.currentTimeMillis()
        var observedPose: YoloPose? = null
        var descentSpeed = 0f
        var phase = "monitoring"
        var poseStatus = "pose-not-clear"
        var possibleFall = false
        try {
            val pose = (yoloPoseDetector ?: YoloPoseDetector(this).also { yoloPoseDetector = it }).detect(bitmap, now)
            observedPose = pose
            val priorPose = previousPoseForMetrics
            if (pose != null && priorPose != null) {
                val seconds = ((now - priorPose.observedAtMs).coerceAtLeast(1L)) / 1_000f
                descentSpeed = (pose.centerY - priorPose.centerY) / seconds
            }
            if (pose != null) previousPoseForMetrics = pose

            val canRaiseAlert = !fallAlertPending && now >= fallAlertCooldownUntil
            if (canRaiseAlert && fallVerificationStartedAtMs > 0L) {
                if (pose != null && pose.poseUsable && pose.torsoHorizontal) {
                    verificationBadPoseSinceMs = 0L
                    verificationUprightSamples = 0
                    val previousVerification = previousVerificationPose
                    val sampleSeconds = previousVerification?.let { ((now - it.observedAtMs).coerceAtLeast(1L)) / 1_000f } ?: 0f
                    val movement = if (previousVerification != null && sampleSeconds > 0f) {
                        val dx = pose.centerX - previousVerification.centerX
                        val dy = pose.centerY - previousVerification.centerY
                        kotlin.math.sqrt(dx * dx + dy * dy) / sampleSeconds
                    } else 0f
                    if (movement > STILLNESS_MOTION_LIMIT_PER_SECOND) fallVerificationStartedAtMs = now
                    previousVerificationPose = pose
                    val elapsed = now - fallVerificationStartedAtMs
                    if (elapsed >= FALL_STILLNESS_CONFIRMATION_MS) {
                        possibleFall = true
                        fallVerificationStartedAtMs = 0L
                        previousVerificationPose = null
                        confirmedFallDisplayUntilMs = now + CONFIRMED_OVERLAY_HOLD_MS
                        phase = "possible-fall"
                        poseStatus = "possible-fall"
                    } else {
                        phase = "fall-verifying"
                        poseStatus = "fall-verifying"
                    }
                } else {
                    if (verificationBadPoseSinceMs == 0L) verificationBadPoseSinceMs = now
                    val clearlyUpright = pose != null && pose.poseUsable && !pose.torsoHorizontal && pose.centerY < UPRIGHT_CENTER_Y_MAX
                    verificationUprightSamples = if (clearlyUpright) verificationUprightSamples + 1 else 0
                    if (verificationUprightSamples >= UPRIGHT_CANCEL_SAMPLES) {
                        fallVerificationStartedAtMs = 0L
                        previousVerificationPose = null
                        verificationBadPoseSinceMs = 0L
                        verificationUprightSamples = 0
                        fallClassifier.reset()
                        phase = "monitoring"
                        poseStatus = "person-upright"
                        ui.post { updateNotification("Fall check cancelled · upright posture held") }
                    } else if (now - verificationBadPoseSinceMs > VERIFICATION_POSE_GRACE_MS) {
                        fallVerificationStartedAtMs = 0L
                        previousVerificationPose = null
                        verificationBadPoseSinceMs = 0L
                        verificationUprightSamples = 0
                        fallClassifier.reset()
                        phase = "monitoring"
                        poseStatus = if (pose == null) "person-not-detected" else "pose-not-clear"
                    } else {
                        // Keep the countdown through a brief missed/noisy pose frame;
                        // only a sustained loss of the horizontal posture cancels it.
                        phase = "fall-verifying"
                        poseStatus = "fall-verifying"
                    }
                }
            } else if (canRaiseAlert && pose != null && pose.poseUsable) {
                if (fallClassifier.observe(pose, now)) {
                    fallVerificationStartedAtMs = now
                    previousVerificationPose = pose
                    verificationBadPoseSinceMs = 0L
                    verificationUprightSamples = 0
                    phase = "fall-verifying"
                    poseStatus = "fall-verifying"
                    ui.post { updateNotification("Sustained horizontal posture · stillness check started; standing cancels it") }
                } else {
                    poseStatus = if (pose.torsoHorizontal) "person-horizontal" else "person-upright"
                }
            } else {
                if (fallVerificationStartedAtMs > 0L && (pose == null || !pose.poseUsable)) {
                    fallVerificationStartedAtMs = 0L
                    previousVerificationPose = null
                    fallClassifier.reset()
                }
                phase = if (now < confirmedFallDisplayUntilMs || fallAlertPending) "possible-fall" else "monitoring"
                poseStatus = when {
                    now < confirmedFallDisplayUntilMs || fallAlertPending -> "possible-fall"
                    pose == null -> "person-not-detected"
                    !pose.poseUsable -> "pose-not-clear"
                    pose.torsoHorizontal -> "person-horizontal"
                    else -> "person-upright"
                }
            }
        } catch (_: Exception) {
            if (!bitmap.isRecycled) bitmap.recycle()
            yoloUnavailable = true
            fallClassifier.reset()
            ui.post { updateNotification("YOLO model unavailable · fall monitoring stopped; reopen VITAL") }
            return FrameAnalysis(jpeg, "pose-not-clear")
        }

        val remaining = if (fallVerificationStartedAtMs > 0L) {
            (FALL_STILLNESS_CONFIRMATION_MS - (now - fallVerificationStartedAtMs)).coerceAtLeast(0L) / 1_000f
        } else 0f
        val annotated = FallPoseOverlay.render(bitmap, observedPose, phase, descentSpeed, remaining)
        bitmap.recycle()
        if (possibleFall) {
            fallAlertPending = true
            fallAlertCooldownUntil = now + ALERT_COOLDOWN_MS
            ui.post {
                updateNotification("Possible fall flagged · attempting caregiver SMS now")
                showFallAlertNotification()
                sendBroadcast(Intent(ACTION_POSSIBLE_FALL_CONFIRMED).setPackage(packageName))
                sendPossibleFallEvent()
            }
        }
        return FrameAnalysis(annotated, poseStatus)
    }

    private fun publishFrameToPhone(jpeg: ByteArray) {
        sendBroadcast(Intent(ACTION_FRAME_UPDATED).setPackage(packageName).putExtra(EXTRA_FRAME_JPEG, jpeg))
    }

    private fun sendPossibleFallEvent() {
        alertExecutor.execute {
            val prefs = getSharedPreferences("vital-camera", Context.MODE_PRIVATE)
            val base = prefs.getString("server", "").orEmpty().trimEnd('/')
            val token = prefs.getString("token", "").orEmpty()
            if (base.isBlank() || token.isBlank()) {
                ui.post {
                    fallAlertPending = false
                    val status = "Possible fall · VITAL offline; no caregiver alert sent"
                    updateNotification(status)
                    updateFallAlertNotification(status)
                }
                return@execute
            }
            try {
                val smsAllowed = ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED
                val body = org.json.JSONObject()
                    .put("source", "android-yolo11n-pose+temporal-rule")
                    .put("localSmsPermission", smsAllowed)
                    .toString()
                    .toRequestBody("application/json".toMediaType())
                val request = Request.Builder().url("$base/api/camera/fall-event")
                .header("Authorization", "Bearer $token").post(body).build()
                http.newCall(request).execute().use { response ->
                    val detail = response.body?.string().orEmpty()
                    val result = runCatching { org.json.JSONObject(detail) }.getOrNull()
                    val alertId = result?.optString("alertId").orEmpty()
                    var phoneSmsStatus: String? = null
                    var phoneSmsDetail = ""
                    val status = if (response.isSuccessful && result?.optBoolean("localSms") == true) {
                        val phonesJson = result.optJSONArray("phoneNumbers")
                        val phones = if (phonesJson != null) {
                            (0 until phonesJson.length()).map { phonesJson.optString(it) }.filter { it.isNotBlank() }
                        } else listOf(result.optString("caretakerPhone")).filter { it.isNotBlank() }
                        val patient = result.optString("patientName", "VITAL patient")
                        if (!smsAllowed || phones.isEmpty()) {
                            phoneSmsStatus = "phone-send-failed"
                            phoneSmsDetail = "Android SMS permission or emergency contact numbers are unavailable; no message was submitted."
                            "Possible fall · SMS permission/contact unavailable; no text sent"
                        } else {
                            val text = "VITAL possible-fall alert for $patient. Please check on them now. This camera alert may be a false alarm. If urgent, call local emergency services."
                            var submitted = 0
                            val failures = mutableListOf<String>()
                            @Suppress("DEPRECATION")
                            val sms = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                                getSystemService(SmsManager::class.java)
                            } else {
                                SmsManager.getDefault()
                            }
                            phones.forEach { phone ->
                                try {
                                    sms.sendTextMessage(phone, null, text, null, null)
                                    submitted++
                                } catch (_: Exception) {
                                    failures += phone
                                }
                            }
                            if (submitted > 0) {
                                phoneSmsStatus = "submitted-by-phone"
                                phoneSmsDetail = "Android submitted $submitted of ${phones.size} SMS requests; carrier delivery is not confirmed.${if (failures.isNotEmpty()) " Some contact numbers could not be submitted." else ""}"
                                "Possible-fall SMS submitted to $submitted of ${phones.size} contacts · delivery not confirmed"
                            } else {
                                phoneSmsStatus = "phone-send-failed"
                                phoneSmsDetail = "Android could not submit the SMS to any emergency contact."
                                "Possible fall · phone could not submit any SMS; delivery not confirmed"
                            }
                        }
                    } else if (response.isSuccessful && result?.optBoolean("queuedForPhone") == true) {
                        "Possible-fall SMS queued for phone SIM submission · delivery not confirmed"
                    } else if (response.isSuccessful) {
                        val accepted = result?.optInt("acceptedCount", 1) ?: 1
                        val intended = result?.optInt("recipientCount", 1) ?: 1
                        "Possible-fall SMS accepted for $accepted of $intended contacts by the provider; delivery not confirmed"
                    } else if (response.code == 412) {
                        val reason = result?.optString("reason")
                        "Possible fall · ${reason?.takeIf { it.isNotBlank() } ?: "caregiver SMS unavailable; no alert sent"}"
                    } else {
                        val reason = result?.optString("reason")
                        "Possible fall · ${reason?.takeIf { it.isNotBlank() } ?: "caregiver alert failed; delivery not confirmed"}"
                    }
                    if (phoneSmsStatus != null && alertId.isNotBlank()) {
                        runCatching {
                            val statusBody = org.json.JSONObject()
                                .put("alertId", alertId)
                                .put("status", phoneSmsStatus)
                                .put("detail", phoneSmsDetail)
                                .toString()
                                .toRequestBody("application/json".toMediaType())
                            val statusRequest = Request.Builder().url("$base/api/camera/fall-event/status")
                                .header("Authorization", "Bearer $token").post(statusBody).build()
                            http.newCall(statusRequest).execute().close()
                        }
                    }
                    ui.post {
                        fallAlertPending = false
                        updateNotification(status)
                        updateFallAlertNotification(status)
                    }
                }
            } catch (_: Exception) {
                ui.post {
                    fallAlertPending = false
                    val status = "Possible fall · VITAL offline; no caregiver alert sent"
                    updateNotification(status)
                    updateFallAlertNotification(status)
                }
            }
        }
    }

    private fun stopRelay() {
        if (stopped) return
        stopped = true
        ui.removeCallbacksAndMessages(null)
        runCatching { yoloPoseDetector?.close() }
        yoloPoseDetector = null
        cameraProvider?.unbindAll()
        fallVerificationStartedAtMs = 0L
        previousVerificationPose = null
        verificationBadPoseSinceMs = 0L
        verificationUprightSamples = 0
        previousPoseForMetrics = null
        imageCapture = null
        releaseWakeLock()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        stopped = true
        ui.removeCallbacksAndMessages(null)
        runCatching { yoloPoseDetector?.close() }
        yoloPoseDetector = null
        runCatching { cameraProvider?.unbindAll() }
        releaseWakeLock()
        cameraExecutor.shutdown()
        networkExecutor.shutdown()
        alertExecutor.shutdown()
        super.onDestroy()
    }

    private fun buildNotification(status: String): Notification {
        val stopIntent = PendingIntent.getService(
            this,
            0,
            Intent(this, CameraRelayService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val openIntent = PendingIntent.getActivity(
            this,
            1,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setContentTitle("VITAL camera session active")
            .setContentText(status)
            .setContentIntent(openIntent)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop camera", stopIntent)
        if (fallAlertPending) {
            val callIntent = PendingIntent.getActivity(
                this, 3,
                Intent(Intent.ACTION_DIAL, Uri.parse("tel:112")),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            builder.addAction(android.R.drawable.ic_menu_call, "Call 112", callIntent)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
        }
        return builder.build()
    }

    private fun updateNotification(status: String) {
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID, buildNotification(status))
    }

    private fun showFallAlertNotification() {
        val callIntent = PendingIntent.getActivity(
            this, 3,
            Intent(Intent.ACTION_DIAL, Uri.parse("tel:112")),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = NotificationCompat.Builder(this, FALL_ALERT_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("VITAL: possible fall")
            .setContentText("Emergency alert: possible fall detected. Check the person now; this alert may be a false alarm.")
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .addAction(android.R.drawable.ic_menu_call, "Call 112", callIntent)
            .build()
        getSystemService(NotificationManager::class.java).notify(FALL_ALERT_NOTIFICATION_ID, notification)
    }

    private fun updateFallAlertNotification(status: String) {
        val callIntent = PendingIntent.getActivity(
            this, 3,
            Intent(Intent.ACTION_DIAL, Uri.parse("tel:112")),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = NotificationCompat.Builder(this, FALL_ALERT_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("VITAL: possible fall")
            .setContentText(status)
            .setStyle(NotificationCompat.BigTextStyle().bigText("$status. This is an unverified possible-fall alert; check the person if safe."))
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setOnlyAlertOnce(true)
            .setAutoCancel(true)
            .addAction(android.R.drawable.ic_menu_call, "Call 112", callIntent)
            .build()
        getSystemService(NotificationManager::class.java).notify(FALL_ALERT_NOTIFICATION_ID, notification)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "VITAL camera session", NotificationManager.IMPORTANCE_LOW).apply {
                description = "Visible status and stop control for the user-started camera session"
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
            val alarmSound = Uri.parse("android.resource://$packageName/${R.raw.vital_emergency_siren}")
            val alarmAudioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
            val alertChannel = NotificationChannel(FALL_ALERT_CHANNEL_ID, "VITAL emergency fall alerts", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Audible alarm and vibration for possible-fall alerts and caretaker SMS status"
                setSound(alarmSound, alarmAudioAttributes)
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 600, 250, 600, 250, 1_000)
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(alertChannel)
        }
    }

    private fun acquireWakeLock() {
        if (wakeLock?.isHeld == true) return
        val power = getSystemService(PowerManager::class.java)
        wakeLock = power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "VITAL:PhoneCamera").apply {
            setReferenceCounted(false)
            acquire()
        }
    }

    private fun releaseWakeLock() {
        val lock = wakeLock ?: return
        if (lock.isHeld) lock.release()
        wakeLock = null
    }

    companion object {
        const val ACTION_START = "com.vital.phonecamera.action.START"
        const val ACTION_STOP = "com.vital.phonecamera.action.STOP"
        const val ACTION_FRAME_UPDATED = "com.vital.phonecamera.action.FRAME_UPDATED"
        const val ACTION_POSSIBLE_FALL_CONFIRMED = "com.vital.phonecamera.action.POSSIBLE_FALL_CONFIRMED"
        const val EXTRA_FRAME_JPEG = "frameJpeg"
        private const val CHANNEL_ID = "vital_camera_session"
        // A new channel ID lets existing installs get the alarm sound setting;
        // Android does not let an app change the sound on an already-created channel.
        private const val FALL_ALERT_CHANNEL_ID = "vital_possible_fall_alert_v3"
        private const val NOTIFICATION_ID = 6204
        private const val FALL_ALERT_NOTIFICATION_ID = 6205
        internal const val FRAME_INTERVAL_MS = 900L
        private const val ALERT_COOLDOWN_MS = 15 * 60 * 1000L
        internal const val FALL_STILLNESS_CONFIRMATION_MS = 4_000L
        internal const val VERIFICATION_POSE_GRACE_MS = 2_200L
        internal const val UPRIGHT_CANCEL_SAMPLES = 2
        // Camera framing and pose-box jitter should not keep restarting the
        // confirmation window for a person who is otherwise still.
        internal const val STILLNESS_MOTION_LIMIT_PER_SECOND = 0.20f
        internal const val UPRIGHT_CENTER_Y_MAX = 0.72f
        private const val CONFIRMED_OVERLAY_HOLD_MS = 8_000L
        private const val FRAME_WIDTH = 640
        private const val FRAME_HEIGHT = 480
        private const val JPEG_QUALITY = 50
    }
}
