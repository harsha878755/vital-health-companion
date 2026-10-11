package com.vital.phonecamera

import android.Manifest
import android.app.AlertDialog
import android.app.AlarmManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.res.ColorStateList
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.RippleDrawable
import android.media.MediaMetadataRetriever
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.net.Uri
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ImageView
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.ComponentActivity
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.BasalMetabolicRateRecord
import androidx.health.connect.client.records.BodyTemperatureRecord
import androidx.health.connect.client.records.BloodPressureRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.HeightRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.RespiratoryRateRecord
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.records.metadata.Device
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.temporal.ChronoUnit
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

class MainActivity : ComponentActivity() {
    private val healthPermissions = setOf(
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(RestingHeartRateRecord::class),
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(OxygenSaturationRecord::class),
        HealthPermission.getReadPermission(BloodPressureRecord::class),
        HealthPermission.getReadPermission(BodyTemperatureRecord::class),
        HealthPermission.getReadPermission(RespiratoryRateRecord::class),
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(DistanceRecord::class),
        HealthPermission.getReadPermission(BasalMetabolicRateRecord::class),
        HealthPermission.getReadPermission(HeightRecord::class),
        HealthPermission.getReadPermission(WeightRecord::class)
    )
    private val healthPermissionRequest = registerForActivityResult(
        PermissionController.createRequestPermissionResultContract()
    ) { _ ->
        // Always re-check the full granted set. Health Connect can grant only a
        // subset, and previously this callback path treated one granted type
        // (for example Steps) as permission for every requested type.
        readAndUploadWatchReadings()
    }
    private val prefs by lazy { getSharedPreferences("vital-camera", MODE_PRIVATE) }
    private val network = Executors.newSingleThreadExecutor()
    private val videoAnalysis = Executors.newSingleThreadExecutor()
    private val watchSyncHandler = Handler(Looper.getMainLooper())
    private val appointmentSmsPermissionRequest = registerForActivityResult(ActivityResultContracts.RequestPermission()) { allowed ->
        if (allowed) {
            setStatus("Phone SMS is enabled for VITAL messages. Carrier charges may apply.")
            AppointmentSmsSync.poll(this)
        } else setStatus("SMS permission was not granted. VITAL messages remain queued.")
    }
    private val appointmentSmsTicker = object : Runnable {
        override fun run() {
            AppointmentSmsSync.poll(this@MainActivity) { message ->
                runOnUiThread { if (::statusText.isInitialized) setStatus(message) }
            }
            appointmentSmsHandler.postDelayed(this, TimeUnit.SECONDS.toMillis(10))
        }
    }
    private val appointmentSmsHandler = Handler(Looper.getMainLooper())
    @Volatile private var watchSyncInProgress = false
    private val watchSyncTicker = object : Runnable {
        override fun run() {
            syncWatchReadingsIfAlreadyAllowed()
            watchSyncHandler.postDelayed(this, TimeUnit.MINUTES.toMillis(1))
        }
    }
    private lateinit var addressField: EditText
    private lateinit var codeField: EditText
    private lateinit var consentBox: CheckBox
    private lateinit var medicationConsentBox: CheckBox
    private lateinit var statusText: TextView
    private lateinit var phoneOverviewValue: TextView
    private lateinit var watchOverviewValue: TextView
    private lateinit var cameraOverviewValue: TextView
    private var homeCheckInStatus: TextView? = null
    private var homeWeekHistory: LinearLayout? = null
    private val homeCheckInButtons = mutableListOf<Pair<String, Button>>()
    private lateinit var watchSyncStatusText: TextView
    private lateinit var postureTestText: TextView
    private lateinit var offlinePreviewImage: ImageView
    private lateinit var cameraPreviewImage: ImageView
    private var cameraPreviewBitmap: android.graphics.Bitmap? = null
    private var offlinePreviewBitmap: android.graphics.Bitmap? = null
    private var fallConfirmationDialog: AlertDialog? = null
    private var cameraFrameReceiverRegistered = false
    private val cameraFrameReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == CameraRelayService.ACTION_POSSIBLE_FALL_CONFIRMED) {
                fallConfirmationDialog?.dismiss()
                fallConfirmationDialog = AlertDialog.Builder(this@MainActivity)
                    .setTitle("Possible fall pattern")
                    .setMessage("VITAL detected a fall-like movement. If you are okay, tap I'm okay within 10 seconds to cancel the caregiver alert. Otherwise it will be sent automatically. This camera check cannot tell whether you are injured.")
                    .setPositiveButton("I'm okay") { _, _ ->
                        startService(Intent(this@MainActivity, CameraRelayService::class.java).setAction(CameraRelayService.ACTION_CANCEL_FALL_ALERT))
                    }
                    .setNegativeButton("Send caregiver alert now") { _, _ ->
                        startService(Intent(this@MainActivity, CameraRelayService::class.java).setAction(CameraRelayService.ACTION_SEND_FALL_ALERT_NOW))
                    }
                    .setNeutralButton("Call 112") { _, _ ->
                        startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:112")))
                    }
                    .setCancelable(true)
                    .show()
                return
            }
            if (intent?.action == CameraRelayService.ACTION_POSSIBLE_FALL_CANCELLED) {
                fallConfirmationDialog?.dismiss()
                fallConfirmationDialog = null
                if (::statusText.isInitialized) setStatus("Fall alert cancelled. No caregiver SMS or emergency call was sent.")
                return
            }
            if (intent?.action == CameraRelayService.ACTION_POSSIBLE_FALL_DISPATCHED) {
                fallConfirmationDialog?.dismiss()
                fallConfirmationDialog = null
                val reason = intent.getStringExtra(CameraRelayService.EXTRA_FALL_DISPATCH_REASON) ?: "VITAL is attempting the caregiver alert."
                if (::statusText.isInitialized) setStatus("$reason SMS delivery is not guaranteed.")
                return
            }
            val jpeg = intent?.getByteArrayExtra(CameraRelayService.EXTRA_FRAME_JPEG) ?: return
            val frame = BitmapFactory.decodeByteArray(jpeg, 0, jpeg.size) ?: return
            if (::cameraPreviewImage.isInitialized) {
                cameraPreviewImage.setImageBitmap(frame)
                cameraPreviewBitmap?.takeIf { it !== frame && !it.isRecycled }?.recycle()
                cameraPreviewBitmap = frame
            } else {
                frame.recycle()
            }
        }
    }
    private val prerecordedVideoPicker = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri == null) {
            postureTestText.text = "No video selected."
            if (::offlinePreviewImage.isInitialized) offlinePreviewImage.visibility = View.GONE
        } else {
            offlinePreviewBitmap?.takeIf { !it.isRecycled }?.recycle()
            offlinePreviewBitmap = null
            offlinePreviewImage.setImageDrawable(null)
            offlinePreviewImage.visibility = View.GONE
            postureTestText.text = "Analyzing the video with the on-device YOLO pose model… no call or message will be sent."
            videoAnalysis.execute { analyzePrerecordedVideo(uri) }
        }
    }

    private val permissionRequest = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
        val cameraAllowed = result[Manifest.permission.CAMERA] == true || hasPermission(Manifest.permission.CAMERA)
        val noticesAllowed = Build.VERSION.SDK_INT < 33 || result[Manifest.permission.POST_NOTIFICATIONS] == true || hasPermission(Manifest.permission.POST_NOTIFICATIONS)
        val smsAllowed = result[Manifest.permission.SEND_SMS] == true || hasPermission(Manifest.permission.SEND_SMS)
        if (cameraAllowed && noticesAllowed) {
            startRelay()
            if (!smsAllowed) setStatus("Camera is running, but automatic caregiver SMS is disabled until SMS permission is allowed.")
        } else setStatus("Allow camera and notifications to start the visible camera service.")
    }

    private val reminderNotificationRequest = registerForActivityResult(ActivityResultContracts.RequestPermission()) { allowed ->
        if (allowed || Build.VERSION.SDK_INT < 33) requestExactAlarmPermissionOrSync()
        else setStatus("Allow notifications so Android can show medicine reminders.")
    }

    private val exactAlarmSettings = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) {
        syncMedicineSchedule()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = color("#101F30")
        window.navigationBarColor = color("#101F30")
        window.decorView.systemUiVisibility = 0
        addressField = EditText(this).apply {
            hint = "Computer address, e.g. http://192.168.1.20:5055"
            setSingleLine(true)
            setText(prefs.getString("server", ""))
            inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_URI
            styleInput(this)
        }
        codeField = EditText(this).apply {
            hint = "6-digit code from VITAL"
            setSingleLine(true)
            inputType = android.text.InputType.TYPE_CLASS_NUMBER
            filters = arrayOf(android.text.InputFilter.LengthFilter(6))
            styleInput(this)
        }
        consentBox = CheckBox(this).apply { text = "The patient has agreed to this camera session."; setTextColor(color("#C4D4DF")); buttonTintList = android.content.res.ColorStateList.valueOf(color("#17C99A")) }
        medicationConsentBox = CheckBox(this).apply { text = "The patient agrees to receive reminders and sync reminder responses to VITAL."; setTextColor(color("#C4D4DF")); buttonTintList = android.content.res.ColorStateList.valueOf(color("#17C99A")) }
        statusText = TextView(this).apply {
            text = "Pair this phone with VITAL on the same trusted Wi-Fi. Start is manual; the persistent notification includes Stop."
            textSize = 14f; setTextColor(color("#C6D9E3")); setPadding(dp(14), dp(12), dp(14), dp(12)); background = rounded("#203F5B", 14, "#2E5872")
        }

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(18), dp(22), dp(18), dp(28))
            setBackgroundColor(color("#101F30"))
        }
        val connectPage = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(18), dp(22), dp(18), dp(24))
            setBackgroundColor(color("#101F30"))
        }
        val monitorPage = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(18), dp(22), dp(18), dp(24))
            setBackgroundColor(color("#101F30"))
        }
        val brandRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, 0, 0, dp(10))
        }
        brandRow.addView(ImageView(this).apply {
            setImageResource(R.drawable.vital_mark)
            background = GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                intArrayOf(color("#B8FFF0"), color("#FFDFB4"))
            ).apply { cornerRadius = dp(18).toFloat() }
            setPadding(dp(11), dp(11), dp(11), dp(11))
            contentDescription = "VITAL heart and pulse logo"
        }, LinearLayout.LayoutParams(dp(56), dp(56)).apply { marginEnd = dp(13) })
        brandRow.addView(LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            addView(TextView(this@MainActivity).apply {
                text = "VITAL"; textSize = 34f; letterSpacing = .06f; typeface = Typeface.create("sans-serif", Typeface.BOLD)
                setTextColor(color("#E5F2F7"))
            })
            addView(TextView(this@MainActivity).apply {
                text = "PHONE COMPANION"; textSize = 11f; letterSpacing = .14f; typeface = Typeface.DEFAULT_BOLD
                setTextColor(color("#18D0A0"))
            })
        })
        val hero = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(18), dp(18), dp(18), dp(16))
            background = GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                intArrayOf(color("#1A4053"), color("#173147"), color("#182B40"))
            ).apply { cornerRadius = dp(24).toFloat(); setStroke(dp(1), color("#315970")) }
        }
        hero.addView(brandRow)
        hero.addView(TextView(this).apply {
            text = "Your care, connected."; textSize = 21f; typeface = Typeface.DEFAULT_BOLD
            setTextColor(color("#F0F7FA")); setPadding(0, dp(2), 0, dp(3))
        })
        hero.addView(TextView(this).apply {
            text = "Camera monitoring, watch readings and medicine reminders"; textSize = 13f
            setTextColor(color("#B7CBD6")); setPadding(0, 0, 0, dp(15))
        })
        hero.addView(statusText)
        root.addView(hero, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { bottomMargin = dp(14) })

        val overview = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        phoneOverviewValue = overviewTile(overview, "VITAL LINK", "Checking")
        watchOverviewValue = overviewTile(overview, "WATCH DATA", "Health Connect")
        cameraOverviewValue = overviewTile(overview, "CAMERA", "Ready")
        root.addView(overview, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { bottomMargin = dp(16) })
        refreshOverview()

        val checkInCard = section("Daily check-in", "A quick note about how you feel today.")
        val checkInPrompt = TextView(this).apply {
            text = "How are you feeling?"
            textSize = 17f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(color("#EAF4F8"))
            setPadding(0, dp(2), 0, dp(4))
        }
        checkInCard.addView(checkInPrompt)
        homeCheckInStatus = TextView(this).apply {
            textSize = 12f
            setTextColor(color("#AFC4D1"))
            setPadding(0, 0, 0, dp(10))
        }
        checkInCard.addView(homeCheckInStatus)
        val checkInOptions = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
        }
        homeCheckInButtons.clear()
        listOf("Good", "Okay", "Need support").forEach { feeling ->
            val button = secondaryButton(feeling) {
                val currentDate = java.time.LocalDate.now()
                val today = currentDate.toString()
                val history = readCheckInHistory()
                history.put(today, feeling)
                val oldestDate = currentDate.minusDays(6)
                history.keys().asSequence().toList().forEach { savedDay ->
                    val date = runCatching { java.time.LocalDate.parse(savedDay) }.getOrNull()
                    if (date == null || date.isBefore(oldestDate) || date.isAfter(currentDate)) history.remove(savedDay)
                }
                prefs.edit()
                    .putString("home-checkin-date", today)
                    .putString("home-checkin-feeling", feeling)
                    .putString("home-checkin-history", history.toString())
                    .apply()
                updateHomeCheckIn()
                Toast.makeText(this, "Check-in saved: $feeling", Toast.LENGTH_SHORT).show()
                if (feeling == "Need support") {
                    startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:112")))
                }
            }.apply { textSize = 12f; minHeight = dp(46); setPadding(dp(5), dp(3), dp(5), dp(3)) }
            homeCheckInButtons += feeling to button
            checkInOptions.addView(button, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                if (checkInOptions.childCount > 0) marginStart = dp(6)
            })
        }
        checkInCard.addView(checkInOptions, fieldParams())
        checkInCard.addView(label("YOUR LAST 7 DAYS"), LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
            topMargin = dp(3)
            bottomMargin = dp(5)
        })
        homeWeekHistory = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(0, dp(3), 0, dp(8))
        }
        checkInCard.addView(homeWeekHistory, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        checkInCard.addView(bodyText("G · Good     O · Okay     ! · Need support     · · No entry"), fieldParams())
        checkInCard.addView(bodyText("Saved on this phone only. This check-in is not a medical assessment."), fieldParams())
        root.addView(checkInCard, cardParams())
        updateHomeCheckIn()

        val tipCard = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(16), dp(15), dp(16), dp(15))
            background = rounded("#153C3F", 18, "#287268")
        }
        tipCard.addView(TextView(this).apply {
            text = "✦"
            textSize = 23f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(color("#49DDB2"))
            gravity = Gravity.CENTER
        }, LinearLayout.LayoutParams(dp(36), dp(42)).apply { marginEnd = dp(10) })
        tipCard.addView(LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            addView(TextView(this@MainActivity).apply {
                text = "TODAY'S HEALTH NUDGE"
                textSize = 10f
                letterSpacing = .08f
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(color("#49DDB2"))
            })
            addView(TextView(this@MainActivity).apply {
                text = listOf(
                    "Make time to pause, stretch, and reset.",
                    "A steady routine can make room for better self-care.",
                    "Stay connected with the people who support your wellbeing.",
                    "Take medicines only as prescribed by your clinician."
                )[java.time.LocalDate.now().dayOfYear % 4]
                textSize = 14f
                setTextColor(color("#E0F0F1"))
                setPadding(0, dp(4), 0, 0)
            })
        }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        root.addView(tipCard, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { bottomMargin = dp(12) })

        val pairingCard = section("Connect to VITAL", "Use the computer address and one-time code shown on the VITAL dashboard.")
        pairingCard.addView(label("VITAL computer address"))
        pairingCard.addView(addressField, fieldParams())
        pairingCard.addView(label("One-time pairing code"))
        pairingCard.addView(codeField, fieldParams())
        pairingCard.addView(actionButton("Pair with VITAL") { pairWithVital() }, fieldParams())
        connectPage.addView(pairingCard, cardParams())

        val smsCard = section("Phone SMS fallback", "When Twilio is unavailable, the paired phone can submit visit reminders, medicine reminders, health tips, and caregiver alerts using its SIM. Keep VITAL open or the camera service running. Carrier charges may apply.")
        smsCard.addView(actionButton("Enable phone SMS") {
            if (prefs.getString("token", "").isNullOrBlank()) {
                setStatus("Pair this phone with VITAL before enabling visit reminder SMS.")
            } else if (hasPermission(Manifest.permission.SEND_SMS)) {
                AppointmentSmsSync.poll(this)
                setStatus("Phone SMS is enabled; checking for queued visit reminders.")
            } else {
                appointmentSmsPermissionRequest.launch(Manifest.permission.SEND_SMS)
            }
        }, fieldParams())
        connectPage.addView(smsCard, cardParams())

        val medicineCard = section("Medicine reminders", "Schedule local alerts without SMS charges. Mark a dose from its notification or snooze it; responses sync to VITAL when connected.")
        medicineCard.addView(medicationConsentBox, fieldParams())
        medicineCard.addView(actionButton("Sync medicine reminders") { requestReminderPermissionsAndSync() }, fieldParams())
        connectPage.addView(medicineCard, cardParams())

        val watchCard = section("Watch health data", "Sync the readings the watch app actually shares with Android.")
        watchCard.addView(bodyText("1. Sync the watch in Fastrack Smart. In that app, enable its Google Fit health-data sync if available.\n2. In Google Fit, open Profile → Settings → Health Connect and turn on Sync Fit with Health Connect.\n3. In Health Connect, allow Google Fit to write readings and VITAL to read them. Confirm watch readings appear in Health Connect before syncing here.\nVITAL checks about once a minute while this app is open; it is not a live sensor stream."), fieldParams())
        watchCard.addView(actionButton("Sync watch readings") { requestWatchReadAccess() }, fieldParams())
        watchSyncStatusText = bodyText("Tap Sync watch readings to check permissions, read available records, and send them to VITAL.").apply {
            setPadding(dp(12), dp(10), dp(12), dp(10))
            setLineSpacing(dp(3).toFloat(), 1f)
            background = rounded("#203F5B", 12, "#2E5872")
            contentDescription = "Watch sync status"
        }
        watchCard.addView(watchSyncStatusText, fieldParams())
        connectPage.addView(watchCard, cardParams())

        val cameraCard = section("Phone camera monitor", "Live YOLO pose tracking on this phone. Keep the person and most of their body in view.")
        cameraCard.addView(consentBox, fieldParams())
        cameraPreviewImage = ImageView(this).apply {
            scaleType = ImageView.ScaleType.FIT_CENTER
            adjustViewBounds = true
            setBackgroundColor(color("#07141B"))
            contentDescription = "Live camera frame with VITAL pose tracking overlay"
        }
        cameraCard.addView(cameraPreviewImage, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(250)).apply { bottomMargin = dp(10) })
        cameraCard.addView(actionButton("Start camera while locked") { requestCameraPermissions() }, fieldParams())
        cameraCard.addView(secondaryButton("Stop camera") {
            stopRelay()
            if (::cameraPreviewImage.isInitialized) cameraPreviewImage.setImageDrawable(null)
            cameraPreviewBitmap?.takeIf { !it.isRecycled }?.recycle()
            cameraPreviewBitmap = null
        }, fieldParams())
        cameraCard.addView(bodyText("Green tracking means normal monitoring. Simply lying or sleeping in view does not start a fall alert. The system looks for a recent upright posture followed by rapid downward movement and a horizontal torso, then checks for 4 seconds of stillness. Standing up cancels this check. If the pattern persists, VITAL asks the person to confirm they're okay and waits 10 seconds before attempting a caregiver SMS; choose I'm okay to cancel or Send alert now to act immediately. VITAL cannot identify intent and never calls an ambulance automatically."), fieldParams())
        monitorPage.addView(cameraCard, cardParams())

        val testCard = section("Offline posture test", "Analyze a video with the same on-device YOLO rapid-descent and stillness rules used by live monitoring.")
        testCard.addView(bodyText("The check looks for upright posture followed by a rapid downward transition into a horizontal posture, then sustained stillness. Resting or sleeping without that transition should not trigger a match. This is a movement-pattern heuristic: it cannot infer intent or determine consciousness. Offline analysis never sends an alert, SMS, or call."), fieldParams())
        postureTestText = TextView(this).apply {
            text = "No video analyzed yet."
            textSize = 14f
            setTextColor(color("#D1E2EA"))
            setPadding(dp(14), dp(12), dp(14), dp(12))
            background = rounded("#203F5B", 14, "#2E5872")
        }
        testCard.addView(postureTestText, fieldParams())
        testCard.addView(secondaryButton("Choose prerecorded video") { prerecordedVideoPicker.launch(arrayOf("video/*")) }, fieldParams())
        offlinePreviewImage = ImageView(this).apply {
            scaleType = ImageView.ScaleType.FIT_CENTER
            adjustViewBounds = true
            setBackgroundColor(color("#07141B"))
            contentDescription = "Offline posture test frame with VITAL pose overlay"
        }
        testCard.addView(offlinePreviewImage, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(250)).apply { bottomMargin = dp(10) })
        monitorPage.addView(testCard, cardParams())

        monitorPage.addView(bodyText("Keep VITAL running on the computer and both devices on the same trusted Wi-Fi when pairing or syncing. Android may restrict background activity for battery or device-specific reasons; this is not guaranteed 24/7 monitoring."), fieldParams())

        val pages = listOf(root, connectPage, monitorPage)
        val pageHost = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            pages.forEachIndexed { index, page ->
                addView(page, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
                page.visibility = if (index == 0) View.VISIBLE else View.GONE
            }
        }
        val contentScroller = ScrollView(this).apply {
            clipToPadding = false
            setPadding(0, 0, 0, dp(4))
            isFillViewport = true
            addView(pageHost)
        }
        val navLabels = listOf("Home", "Connect", "Monitor")
        val navButtons = mutableListOf<Button>()
        val navigation = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(dp(10), dp(7), dp(10), dp(8))
            background = rounded("#13283A", 18, "#29475E")
        }
        fun selectPage(index: Int) {
            pages.forEachIndexed { pageIndex, page -> page.visibility = if (pageIndex == index) View.VISIBLE else View.GONE }
            navButtons.forEachIndexed { buttonIndex, button ->
                val selected = buttonIndex == index
                button.background = rippleBackground(
                    if (selected) "#1D514F" else "#13283A",
                    14,
                    if (selected) "#377E77" else "#29475E",
                    if (selected) "#6656E0C1" else "#4449DDB2"
                )
                button.setTextColor(color(if (selected) "#79F0CC" else "#B0C6D2"))
                button.isSelected = selected
            }
            contentScroller.scrollTo(0, 0)
        }
        navLabels.forEachIndexed { index, title ->
            val button = Button(this).apply {
                text = title
                isAllCaps = false
                textSize = 13f
                typeface = Typeface.DEFAULT_BOLD
                minHeight = dp(48)
                setPadding(dp(8), dp(4), dp(8), dp(4))
                contentDescription = "$title tab"
                addPressFeedback()
                setOnClickListener { selectPage(index) }
            }
            navButtons.add(button)
            navigation.addView(button, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                if (index > 0) marginStart = dp(7)
            })
        }
        val appShell = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(color("#101F30"))
            addView(contentScroller, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
            addView(navigation, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(dp(12), dp(4), dp(12), dp(10))
            })
        }
        selectPage(0)
        setContentView(appShell)
        MedicationReminderScheduler.reschedule(this)
        MedicationReminderScheduler.syncPendingResponses(this)
    }

    override fun onResume() {
        super.onResume()
        if (::phoneOverviewValue.isInitialized) refreshOverview()
        updateHomeCheckIn()
        if (!cameraFrameReceiverRegistered) {
            ContextCompat.registerReceiver(
                this,
                cameraFrameReceiver,
                IntentFilter().apply {
                    addAction(CameraRelayService.ACTION_FRAME_UPDATED)
                    addAction(CameraRelayService.ACTION_POSSIBLE_FALL_CONFIRMED)
                    addAction(CameraRelayService.ACTION_POSSIBLE_FALL_CANCELLED)
                    addAction(CameraRelayService.ACTION_POSSIBLE_FALL_DISPATCHED)
                },
                ContextCompat.RECEIVER_NOT_EXPORTED
            )
            cameraFrameReceiverRegistered = true
        }
        watchSyncHandler.removeCallbacks(watchSyncTicker)
        syncWatchReadingsIfAlreadyAllowed()
        watchSyncHandler.postDelayed(watchSyncTicker, TimeUnit.MINUTES.toMillis(1))
        appointmentSmsHandler.removeCallbacks(appointmentSmsTicker)
        appointmentSmsTicker.run()
    }

    override fun onPause() {
        watchSyncHandler.removeCallbacks(watchSyncTicker)
        appointmentSmsHandler.removeCallbacks(appointmentSmsTicker)
        if (cameraFrameReceiverRegistered) {
            unregisterReceiver(cameraFrameReceiver)
            cameraFrameReceiverRegistered = false
        }
        super.onPause()
    }

    private fun pairWithVital() {
        val base = normalizedBaseUrl() ?: run { setStatus("Enter the computer address shown in VITAL."); return }
        val code = codeField.text.toString().trim()
        if (!code.matches(Regex("\\d{6}"))) { setStatus("Enter the 6-digit pairing code shown in VITAL."); return }
        setStatus("Pairing…")
        network.execute {
            try {
                val body = JSONObject().put("pairingCode", code).toString().toRequestBody("application/json".toMediaType())
                val request = Request.Builder().url("$base/api/camera/pair").post(body).build()
                OkHttpClient.Builder().callTimeout(10, TimeUnit.SECONDS).build().newCall(request).execute().use { response ->
                    val result = JSONObject(response.body?.string().orEmpty())
                    if (!response.isSuccessful) throw IllegalStateException(result.optString("error", "Pairing failed."))
                    prefs.edit().putString("server", base).putString("token", result.getString("cameraToken")).apply()
                    runOnUiThread { setStatus("Paired. For camera use, get separate patient agreement before tapping Start.") }
                }
            } catch (error: Exception) {
                runOnUiThread { setStatus(error.message ?: "Could not pair. Check the Wi-Fi address and pairing code.") }
            }
        }
    }

    private fun requestReminderPermissionsAndSync() {
        if (!medicationConsentBox.isChecked) {
            setStatus("Get the patient's agreement before syncing medicine reminders to this phone.")
            return
        }
        if (prefs.getString("token", null).isNullOrBlank()) {
            setStatus("Pair this phone with VITAL first, then sync the medicine schedule.")
            return
        }
        if (Build.VERSION.SDK_INT >= 33 && !hasPermission(Manifest.permission.POST_NOTIFICATIONS)) {
            reminderNotificationRequest.launch(Manifest.permission.POST_NOTIFICATIONS)
            return
        }
        requestExactAlarmPermissionOrSync()
    }

    private fun requestExactAlarmPermissionOrSync() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val alarms = getSystemService(AlarmManager::class.java)
            if (!alarms.canScheduleExactAlarms()) {
                val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).setData(Uri.parse("package:$packageName"))
                exactAlarmSettings.launch(intent)
                return
            }
        }
        syncMedicineSchedule()
    }

    private fun syncMedicineSchedule() {
        val base = prefs.getString("server", "").orEmpty().trimEnd('/')
        val token = prefs.getString("token", null)
        if (base.isBlank() || token.isNullOrBlank()) {
            setStatus("Pair this phone with VITAL first, then sync the medicine schedule.")
            return
        }
        setStatus("Loading the medicine schedule from VITAL…")
        network.execute {
            try {
                val request = Request.Builder()
                    .url("$base/api/camera/medication-schedule")
                    .header("Authorization", "Bearer $token")
                    .get()
                    .build()
                OkHttpClient.Builder().callTimeout(10, TimeUnit.SECONDS).build().newCall(request).execute().use { response ->
                    val payload = JSONObject(response.body?.string().orEmpty())
                    if (!response.isSuccessful) throw IllegalStateException(payload.optString("error", "Could not load medicine schedule."))
                    val count = MedicationReminderScheduler.saveAndSchedule(this, payload)
                    runOnUiThread {
                        if (count == 0) setStatus("No valid medicine name, dose, and time were found. Add or review the schedule in VITAL, then sync again.")
                        else setStatus("Synced $count medicine schedule${if (count == 1) "" else "s"}. Android will remind 10 minutes before, 5 minutes before, and at each dose time. Sync again after schedule changes.")
                    }
                }
            } catch (error: Exception) {
                runOnUiThread { setStatus(error.message ?: "Could not sync. Check that VITAL is running on the same Wi-Fi.") }
            }
        }
    }

    private fun requestWatchReadAccess() {
        setWatchSyncStatus("Checking Health Connect access…")
        if (prefs.getString("token", null).isNullOrBlank()) {
            setWatchSyncStatus("Pair this phone with VITAL first, then sync watch readings.")
            return
        }
        if (Build.VERSION.SDK_INT < 28) {
            setWatchSyncStatus("Health Connect requires Android 9 or later.")
            return
        }
        val sdkStatus = HealthConnectClient.getSdkStatus(this)
        if (sdkStatus != HealthConnectClient.SDK_AVAILABLE) {
            setWatchSyncStatus(if (Build.VERSION.SDK_INT <= 33) "Install or update Health Connect from Google Play, then try again." else "Health Connect is unavailable on this phone.")
            return
        }
        lifecycleScope.launch {
            try {
                val client = HealthConnectClient.getOrCreate(this@MainActivity)
                val granted = withContext(Dispatchers.IO) { client.permissionController.getGrantedPermissions() }
                val missing = healthPermissions - granted
                if (missing.isEmpty()) readAndUploadWatchReadings()
                else {
                    setWatchSyncStatus("Opening Health Connect to request ${missing.size} missing VITAL read permission(s)…")
                    healthPermissionRequest.launch(missing)
                }
            } catch (error: Exception) {
                setWatchSyncStatus(error.message ?: "Could not open Health Connect permissions.")
            }
        }
    }

    private fun syncWatchReadingsIfAlreadyAllowed() {
        if (Build.VERSION.SDK_INT < 28 || prefs.getString("token", null).isNullOrBlank()) return
        if (HealthConnectClient.getSdkStatus(this) != HealthConnectClient.SDK_AVAILABLE) return
        lifecycleScope.launch {
            runCatching {
                val client = HealthConnectClient.getOrCreate(this@MainActivity)
                val granted = withContext(Dispatchers.IO) { client.permissionController.getGrantedPermissions() }
                if (healthPermissions.any { it in granted }) readAndUploadWatchReadings()
            }
        }
    }

    private fun readAndUploadWatchReadings(showStatus: Boolean = true) {
        if (watchSyncInProgress) {
            if (showStatus) setWatchSyncStatus("A watch sync is already running…")
            return
        }
        watchSyncInProgress = true
        lifecycleScope.launch {
            if (showStatus) setWatchSyncStatus("Reading permitted watch records from Health Connect…")
            try {
                val client = HealthConnectClient.getOrCreate(this@MainActivity)
                val now = Instant.now()
                val from = now.minus(48, ChronoUnit.HOURS)
                val metrics = JSONObject()
                var latestObserved = from
                val healthDataOrigins = linkedSetOf<String>()
                val localWarnings = mutableListOf<String>()
                val granted = withContext(Dispatchers.IO) { client.permissionController.getGrantedPermissions() }
                val missingReadPermissions = healthPermissions - granted
                suspend fun <T : androidx.health.connect.client.records.Record> records(
                    type: kotlin.reflect.KClass<T>, start: Instant = from
                ): List<T> {
                    if (HealthPermission.getReadPermission(type) !in granted) return emptyList()
                    return withContext(Dispatchers.IO) {
                        client.readRecords(ReadRecordsRequest(recordType = type, timeRangeFilter = TimeRangeFilter.between(start, now))).records
                    }
                }

                val heartRecords = records(HeartRateRecord::class)
                heartRecords.flatMap { record -> record.samples.map { record to it } }
                    .maxByOrNull { it.second.time }?.let { (record, sample) ->
                        metrics.put("heartRateBpm", sample.beatsPerMinute.toDouble())
                        healthDataOrigins.add(record.metadata.dataOrigin.packageName)
                        latestObserved = maxOf(latestObserved, sample.time)
                    }
                records(RestingHeartRateRecord::class)
                    .maxByOrNull { it.time }?.let { record ->
                        metrics.put("restingHeartRateBpm", record.beatsPerMinute.toDouble())
                        healthDataOrigins.add(record.metadata.dataOrigin.packageName)
                        latestObserved = maxOf(latestObserved, record.time)
                    }
                val dayStart = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant()
                val dailyActivityStart = dayStart
                val stepRecords = records(StepsRecord::class, dayStart)
                val phoneStepOrigins = stepRecords.map { it.metadata.dataOrigin.packageName }
                    .filter { it == "android" || it.startsWith("com.android.healthconnect.phone") }
                    .toSet()
                val nonPhoneStepRecords = stepRecords.filter { it.metadata.dataOrigin.packageName !in phoneStepOrigins }
                val explicitWatchOrigins = nonPhoneStepRecords
                    .filter { it.metadata.device?.type == Device.TYPE_WATCH }
                    .map { it.metadata.dataOrigin }
                    .toSet()
                // Prefer records explicitly marked as a watch. Some Fit versions
                // omit device.type even when Fit is forwarding watch data; fall
                // back to non-phone Health Connect origins and state the caveat.
                val selectedStepOrigins = explicitWatchOrigins.ifEmpty {
                    nonPhoneStepRecords.map { it.metadata.dataOrigin }.toSet()
                }
                val selectedStepRecords = nonPhoneStepRecords.filter { it.metadata.dataOrigin in selectedStepOrigins }
                if (explicitWatchOrigins.isEmpty() && selectedStepOrigins.isNotEmpty()) {
                    localWarnings += "Health Connect did not label the step source as a watch. Showing the non-phone source total; it may combine phone and watch activity."
                } else if (selectedStepOrigins.isEmpty()) {
                    localWarnings += if (phoneStepOrigins.isNotEmpty()) {
                        "Health Connect has phone steps but no non-phone step source to show as watch activity."
                    } else {
                        "No step records were available in Health Connect for today."
                    }
                }
                if (selectedStepOrigins.isNotEmpty()) {
                    val stepTotal = withContext(Dispatchers.IO) {
                        client.aggregate(
                            AggregateRequest(
                                metrics = setOf(StepsRecord.COUNT_TOTAL),
                                timeRangeFilter = TimeRangeFilter.between(dayStart, now),
                                dataOriginFilter = selectedStepOrigins
                            )
                        )[StepsRecord.COUNT_TOTAL]
                    }
                    if (stepTotal != null && stepTotal > 0) {
                        metrics.put("steps", stepTotal)
                        healthDataOrigins.addAll(selectedStepOrigins.map { it.packageName })
                        latestObserved = maxOf(latestObserved, selectedStepRecords.maxOf { it.endTime })
                    } else {
                        localWarnings += "A non-phone step source exists, but Health Connect returned no step total for today."
                    }
                }
                val activityTotals = withContext(Dispatchers.IO) {
                    client.aggregate(
                        AggregateRequest(
                            metrics = setOf(
                                ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL,
                                TotalCaloriesBurnedRecord.ENERGY_TOTAL,
                                DistanceRecord.DISTANCE_TOTAL
                            ),
                            timeRangeFilter = TimeRangeFilter.between(dailyActivityStart, now)
                        )
                    )
                }
                activityTotals[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.let { energy ->
                    metrics.put("activeCaloriesKcal", energy.inKilocalories)
                }
                activityTotals[TotalCaloriesBurnedRecord.ENERGY_TOTAL]?.let { energy ->
                    metrics.put("totalCaloriesKcal", energy.inKilocalories)
                }
                activityTotals[DistanceRecord.DISTANCE_TOTAL]?.let { distance ->
                    metrics.put("distanceMeters", distance.inMeters)
                }
                val longRangeStart = now.minus(365, ChronoUnit.DAYS)
                records(BasalMetabolicRateRecord::class, longRangeStart)
                    .maxByOrNull { it.time }?.let { record ->
                        metrics.put("basalMetabolicRateKcalPerDay", record.basalMetabolicRate.inKilocaloriesPerDay)
                        healthDataOrigins.add(record.metadata.dataOrigin.packageName)
                        latestObserved = maxOf(latestObserved, record.time)
                    }
                records(HeightRecord::class, longRangeStart)
                    .maxByOrNull { it.time }?.let { record ->
                        metrics.put("heightCm", record.height.inMeters * 100.0)
                        healthDataOrigins.add(record.metadata.dataOrigin.packageName)
                        latestObserved = maxOf(latestObserved, record.time)
                    }
                records(WeightRecord::class, longRangeStart)
                    .maxByOrNull { it.time }?.let { record ->
                        metrics.put("weightKg", record.weight.inKilograms)
                        healthDataOrigins.add(record.metadata.dataOrigin.packageName)
                        latestObserved = maxOf(latestObserved, record.time)
                    }
                val sleepRecords = records(SleepSessionRecord::class)
                sleepRecords.maxByOrNull { it.endTime }?.let { record ->
                        val minutes = ChronoUnit.MINUTES.between(record.startTime, record.endTime).coerceAtLeast(0)
                        metrics.put("sleepMinutes", minutes)
                        healthDataOrigins.add(record.metadata.dataOrigin.packageName)
                        latestObserved = maxOf(latestObserved, record.endTime)
                    }
                if (sleepRecords.isEmpty()) {
                    localWarnings += "No sleep session was shared with Health Connect in the last 48 hours. Check whether Fastrack Smart or Google Fit exports sleep records."
                }
                val oxygenRecords = records(OxygenSaturationRecord::class)
                val validOxygenRecords = oxygenRecords.filter { record ->
                    record.percentage.value in 50.0..100.0
                }
                if (oxygenRecords.isNotEmpty() && validOxygenRecords.isEmpty()) {
                    localWarnings += "Health Connect contains SpO₂ record(s), but their values are 0 or outside the valid 50–100% range. Check whether Google Fit or Fastrack Smart is sharing actual oxygen readings."
                } else if (validOxygenRecords.size < oxygenRecords.size) {
                    localWarnings += "Some SpO₂ records had invalid values and were skipped. VITAL used the newest valid reading."
                }
                validOxygenRecords
                    .maxByOrNull { it.time }?.let { record ->
                        metrics.put("spo2Percent", record.percentage.value)
                        healthDataOrigins.add(record.metadata.dataOrigin.packageName)
                        latestObserved = maxOf(latestObserved, record.time)
                    }
                records(BloodPressureRecord::class)
                    .maxByOrNull { it.time }?.let { record ->
                        metrics.put("systolicBp", record.systolic.inMillimetersOfMercury)
                        healthDataOrigins.add(record.metadata.dataOrigin.packageName)
                        latestObserved = maxOf(latestObserved, record.time)
                    }
                records(BodyTemperatureRecord::class)
                    .maxByOrNull { it.time }?.let { record ->
                        metrics.put("temperatureF", record.temperature.inFahrenheit)
                        healthDataOrigins.add(record.metadata.dataOrigin.packageName)
                        latestObserved = maxOf(latestObserved, record.time)
                    }
                records(RespiratoryRateRecord::class)
                    .maxByOrNull { it.time }?.let { record ->
                        metrics.put("respirationPerMinute", record.rate)
                        healthDataOrigins.add(record.metadata.dataOrigin.packageName)
                        latestObserved = maxOf(latestObserved, record.time)
                    }

                if (metrics.length() == 0) {
                    if (showStatus) {
                        val permissionNote = if (missingReadPermissions.isNotEmpty()) "\n\nVITAL is missing ${missingReadPermissions.size} Health Connect read permission(s). Tap Sync again and allow them." else ""
                        val phoneOnlyNote = if (phoneStepOrigins.isNotEmpty()) "\n\nHealth Connect contains phone steps, but no steps marked as watch data. VITAL did not substitute the phone total for the watch." else ""
                        setWatchSyncStatus("No watch readings found in Health Connect in the last 48 hours.$phoneOnlyNote$permissionNote\n\nSync the watch in Fastrack Smart and enable its Google Fit sync. In Google Fit, turn on Profile → Settings → Health Connect → Sync Fit with Health Connect. Then check Health Connect → App permissions and Recent access. VITAL can only transfer records that appear there; permissions alone do not create watch data.")
                    }
                    return@launch
                }
                val originLabels = healthDataOrigins.map { packageName ->
                    if (packageName == "android" || packageName.startsWith("com.android.healthconnect.phone")) {
                        "Your phone (on-device Health Connect steps)"
                    } else if (packageName == "com.google.android.apps.fitness") {
                        "Google Fit"
                    } else {
                        runCatching {
                            val appInfo = packageManager.getApplicationInfo(packageName, 0)
                            packageManager.getApplicationLabel(appInfo).toString()
                        }.getOrDefault(packageName)
                    }
                }
                val originSummary = originLabels.distinct().joinToString(", ").ifBlank { "source unavailable" }
                val payload = JSONObject()
                    .put("source", "health-connect")
                    .put("deviceModel", "Health Connect · $originSummary".take(120))
                    .put("syncMethod", "Android Health Connect")
                    .put("observedAt", latestObserved.toString())
                    .put("warnings", org.json.JSONArray(localWarnings))
                    .put("metrics", metrics)
                val base = prefs.getString("server", "").orEmpty().trimEnd('/')
                val token = prefs.getString("token", null).orEmpty()
                val result = withContext(Dispatchers.IO) {
                    val body = payload.toString().toRequestBody("application/json".toMediaType())
                    val request = Request.Builder().url("$base/api/camera/wearable-reading")
                        .header("Authorization", "Bearer $token").post(body).build()
                    OkHttpClient.Builder().callTimeout(15, TimeUnit.SECONDS).build().newCall(request).execute().use { response ->
                        val responseBody = JSONObject(response.body?.string().orEmpty())
                        if (!response.isSuccessful) throw IllegalStateException(responseBody.optString("error", "Watch sync failed."))
                        responseBody
                    }
                }
                val acceptedMetrics = result.optJSONObject("metrics") ?: JSONObject()
                val synced = acceptedMetrics.length()
                if (showStatus) {
                    val readableMetricNames = mapOf(
                        "heartRateBpm" to "Heart rate",
                        "restingHeartRateBpm" to "Resting heart rate",
                        "spo2Percent" to "SpO₂",
                        "systolicBp" to "Systolic blood pressure",
                        "temperatureF" to "Body temperature",
                        "respirationPerMinute" to "Respiratory rate",
                        "steps" to "Steps",
                        "sleepMinutes" to "Sleep",
                        "activeCaloriesKcal" to "Active calories",
                        "totalCaloriesKcal" to "Total calories",
                        "distanceMeters" to "Distance",
                        "basalMetabolicRateKcalPerDay" to "Basal metabolic rate",
                        "heightCm" to "Height",
                        "weightKg" to "Weight"
                    )
                    val metricNames = acceptedMetrics.keys().asSequence()
                        .map { key -> readableMetricNames[key] ?: key }
                        .joinToString(", ")
                    val warnings = result.optJSONArray("warnings")
                    val warningLines = localWarnings.toMutableList()
                    if (warnings != null) {
                        for (index in 0 until warnings.length()) warningLines += warnings.optString(index)
                    }
                    val warningText = warningLines.joinToString("\n")
                    val permissionNote = if (missingReadPermissions.isNotEmpty()) {
                        "\n\nVITAL still needs read permission for ${missingReadPermissions.size} record type(s). Tap Sync again and allow them."
                    } else ""
                    val measurementNote = if (warningText.isNotBlank()) "\n\nSync notes:\n$warningText" else ""
                    setWatchSyncStatus("Sync complete · $synced reading type${if (synced == 1) "" else "s"}\n$metricNames\nSource · $originSummary$measurementNote$permissionNote\n\nThe source is the app that shared each reading with Health Connect. A blank value means no valid reading of that type was available in this sync.")
                }
            } catch (error: Exception) {
                if (showStatus) setWatchSyncStatus(error.message ?: "Could not read watch data. Check Health Connect permissions and Wi-Fi pairing.")
            } finally {
                watchSyncInProgress = false
            }
        }
    }

    private fun requestCameraPermissions() {
        if (!consentBox.isChecked) { setStatus("Confirm the patient’s agreement before starting the camera."); return }
        if (prefs.getString("token", null).isNullOrBlank()) { setStatus("Pair this phone with VITAL first."); return }
        val needed = mutableListOf<String>()
        if (!hasPermission(Manifest.permission.CAMERA)) needed += Manifest.permission.CAMERA
        if (Build.VERSION.SDK_INT >= 33 && !hasPermission(Manifest.permission.POST_NOTIFICATIONS)) needed += Manifest.permission.POST_NOTIFICATIONS
        if (!hasPermission(Manifest.permission.SEND_SMS)) needed += Manifest.permission.SEND_SMS
        if (needed.isNotEmpty()) permissionRequest.launch(needed.toTypedArray()) else startRelay()
    }

    private fun startRelay() {
        val intent = Intent(this, CameraRelayService::class.java).setAction(CameraRelayService.ACTION_START)
        ContextCompat.startForegroundService(this, intent)
        setStatus("Camera service starting. Keep the notification visible; use Stop there or below to end the session.")
    }

    private fun stopRelay() {
        stopService(Intent(this, CameraRelayService::class.java))
        setStatus("Camera service stopped.")
    }

    private fun analyzePrerecordedVideo(uri: android.net.Uri) {
        val retriever = MediaMetadataRetriever()
        var detector: YoloPoseDetector? = null
        try {
            retriever.setDataSource(this, uri)
            val durationMs = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull()
                ?: throw IllegalArgumentException("Could not read this video's duration.")
            val rotation = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)?.toIntOrNull() ?: 0
            val activeDetector = YoloPoseDetector(this)
            detector = activeDetector
            val scanLimitMs = durationMs
            var timeMs = 0L
            val sampleIntervalMs = CameraRelayService.FRAME_INTERVAL_MS
            var usableFrames = 0
            var sawHorizontalPosture = false
            var possibleFallAtMs: Long? = null
            var verificationStartedAtMs = 0L
            var verificationBadPoseSinceMs = 0L
            var verificationUprightSamples = 0
            var previousVerificationPose: YoloPose? = null
            var previousPose: YoloPose? = null
            var descentSpeed = 0f
            var phase = "monitoring"
            val fallClassifier = FallTemporalClassifier()

            while (timeMs < scanLimitMs && possibleFallAtMs == null) {
                val decoded = retriever.getFrameAtTime(timeMs * 1_000L, MediaMetadataRetriever.OPTION_CLOSEST)
                if (decoded != null) {
                    val frame = prepareVideoFrame(decoded, rotation)
                    try {
                        val observedAtMs = timeMs + 1L
                        val pose = activeDetector.detect(frame, observedAtMs)
                        val priorPose = previousPose
                        if (pose != null && priorPose != null) {
                            val seconds = ((observedAtMs - priorPose.observedAtMs).coerceAtLeast(1L)) / 1_000f
                            descentSpeed = (pose.centerY - priorPose.centerY) / seconds
                        }
                        if (pose != null) {
                            usableFrames++
                            previousPose = pose
                        }

                        if (pose != null && pose.poseUsable && pose.torsoHorizontal) sawHorizontalPosture = true
                        val now = observedAtMs
                        if (verificationStartedAtMs > 0L) {
                            if (pose != null && pose.poseUsable && pose.torsoHorizontal) {
                                verificationBadPoseSinceMs = 0L
                                verificationUprightSamples = 0
                                val previous = previousVerificationPose
                                val seconds = previous?.let { ((now - it.observedAtMs).coerceAtLeast(1L)) / 1_000f } ?: 0f
                                val movement = if (previous != null && seconds > 0f) {
                                    val dx = pose.centerX - previous.centerX
                                    val dy = pose.centerY - previous.centerY
                                    kotlin.math.sqrt(dx * dx + dy * dy) / seconds
                                } else 0f
                                if (movement > CameraRelayService.STILLNESS_MOTION_LIMIT_PER_SECOND) verificationStartedAtMs = now
                                previousVerificationPose = pose
                                phase = if (now - verificationStartedAtMs >= CameraRelayService.FALL_STILLNESS_CONFIRMATION_MS) {
                                    possibleFallAtMs = now
                                    verificationStartedAtMs = 0L
                                    previousVerificationPose = null
                                    "possible-fall"
                                } else "fall-verifying"
                            } else {
                                if (verificationBadPoseSinceMs == 0L) verificationBadPoseSinceMs = now
                                val clearlyUpright = pose != null && pose.poseUsable && !pose.torsoHorizontal && pose.centerY < CameraRelayService.UPRIGHT_CENTER_Y_MAX
                                verificationUprightSamples = if (clearlyUpright) verificationUprightSamples + 1 else 0
                                if (verificationUprightSamples >= CameraRelayService.UPRIGHT_CANCEL_SAMPLES || now - verificationBadPoseSinceMs > CameraRelayService.VERIFICATION_POSE_GRACE_MS) {
                                    verificationStartedAtMs = 0L
                                    previousVerificationPose = null
                                    verificationBadPoseSinceMs = 0L
                                    verificationUprightSamples = 0
                                    fallClassifier.reset()
                                    phase = if (pose == null || !pose.poseUsable) "person-not-detected" else "monitoring"
                                } else phase = "fall-verifying"
                            }
                        } else if (pose != null && pose.poseUsable) {
                            if (fallClassifier.observe(pose, now)) {
                                verificationStartedAtMs = now
                                previousVerificationPose = pose
                                verificationBadPoseSinceMs = 0L
                                verificationUprightSamples = 0
                                phase = "fall-verifying"
                            } else phase = "monitoring"
                        } else {
                            if (verificationStartedAtMs > 0L) {
                                verificationStartedAtMs = 0L
                                previousVerificationPose = null
                                fallClassifier.reset()
                            }
                            phase = "person-not-detected"
                        }

                        val secondsRemaining = if (verificationStartedAtMs > 0L)
                            (CameraRelayService.FALL_STILLNESS_CONFIRMATION_MS - (now - verificationStartedAtMs)).coerceAtLeast(0L) / 1_000f
                        else 0f
                        val annotation = FallPoseOverlay.render(
                            frame,
                            pose,
                            phase,
                            descentSpeed,
                            secondsRemaining
                        )
                        val preview = BitmapFactory.decodeByteArray(annotation, 0, annotation.size)
                        if (preview != null) {
                            runOnUiThread {
                                if (::offlinePreviewImage.isInitialized) {
                                    offlinePreviewImage.setImageBitmap(preview)
                                    offlinePreviewImage.visibility = View.VISIBLE
                                    offlinePreviewBitmap?.takeIf { it !== preview && !it.isRecycled }?.recycle()
                                    offlinePreviewBitmap = preview
                                } else preview.recycle()
                            }
                        }
                    } finally {
                        frame.recycle()
                        if (frame !== decoded && !decoded.isRecycled) decoded.recycle()
                    }
                }
                timeMs += sampleIntervalMs
            }

            val result = if (possibleFallAtMs != null) {
                "A rapid upright-to-horizontal descent followed by stillness matched the possible-fall rule near ${possibleFallAtMs!! / 1_000}s. Review the highlighted frames. A deliberate staged fall can look the same to this camera-only model. No alert, SMS, or call was made."
            } else if (sawHorizontalPosture) {
                "Horizontal/resting posture was detected without a confirmed rapid upright-to-horizontal descent followed by stillness. This does not rule out a real fall; the camera cannot infer intent. No alert, SMS, or call was made."
            } else if (usableFrames == 0) {
                "The YOLO model could not find a clear person pose. Try a brighter clip with the person's full body visible. No alert, SMS, or call was made."
            } else {
                "No possible-fall movement sequence was confirmed in $usableFrames sampled frames. This does not rule out a fall or unconsciousness. No alert, SMS, or call was made."
            }
            runOnUiThread {
                postureTestText.text = result
                if (possibleFallAtMs != null && !isFinishing && !isDestroyed) {
                    showOfflinePossibleFallResult(possibleFallAtMs!!)
                }
            }
        } catch (error: Exception) {
            val message = error.cause?.message ?: error.message ?: "Could not analyze this video."
            runOnUiThread { postureTestText.text = "$message No alert or SMS was sent." }
        } finally {
            detector?.close()
            runCatching { retriever.release() }
        }
    }

    private fun showOfflinePossibleFallResult(matchAtMs: Long) {
        AlertDialog.Builder(this)
            .setTitle("Possible-fall pattern detected")
            .setMessage(
                "The live YOLO posture and stillness checks matched near ${matchAtMs / 1_000}s. Review the highlighted video frame and check the person if appropriate.\n\n" +
                    "This is an offline video analysis. No call, SMS, or caregiver alert was made, and posture cannot establish consciousness."
            )
            .setPositiveButton("Close", null)
            .show()
    }

    private fun prepareVideoFrame(source: Bitmap, rotationDegrees: Int): Bitmap {
        val oriented = if (rotationDegrees % 360 != 0) {
            val matrix = Matrix().apply { postRotate(rotationDegrees.toFloat()) }
            Bitmap.createBitmap(source, 0, 0, source.width, source.height, matrix, true).also {
                if (it !== source) source.recycle()
            }
        } else source
        val scale = minOf(1f, 640f / maxOf(oriented.width, oriented.height))
        if (scale >= 1f) return oriented
        val scaled = Bitmap.createScaledBitmap(oriented, (oriented.width * scale).toInt().coerceAtLeast(1), (oriented.height * scale).toInt().coerceAtLeast(1), true)
        if (scaled !== oriented) oriented.recycle()
        return scaled
    }

    private fun normalizedBaseUrl(): String? {
        val entered = addressField.text.toString().trim().trimEnd('/')
        if (!entered.startsWith("http://") && !entered.startsWith("https://")) return null
        return entered.takeIf { runCatching { java.net.URI(it).host != null }.getOrDefault(false) }
    }

    private fun hasPermission(permission: String) = ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
    private fun setStatus(message: String) {
        statusText.text = message
        if (::phoneOverviewValue.isInitialized) refreshOverview()
    }
    private fun refreshOverview() {
        if (!::phoneOverviewValue.isInitialized) return
        val paired = !prefs.getString("token", null).isNullOrBlank()
        phoneOverviewValue.text = if (paired) "Paired" else "Not paired"
        watchOverviewValue.text = when {
            Build.VERSION.SDK_INT < 26 -> "Unavailable"
            HealthConnectClient.getSdkStatus(this) == HealthConnectClient.SDK_AVAILABLE -> "Available"
            else -> "Needs setup"
        }
        cameraOverviewValue.text = when {
            !hasPermission(Manifest.permission.CAMERA) -> "Permission needed"
            prefs.getString("token", null).isNullOrBlank() -> "Pair phone first"
            else -> "Ready to start"
        }
    }
    private fun updateHomeCheckIn() {
        val currentDate = java.time.LocalDate.now()
        val today = currentDate.toString()
        val savedDate = prefs.getString("home-checkin-date", "")
        val feeling = prefs.getString("home-checkin-feeling", "")
        homeCheckInStatus?.text = if (savedDate == today && !feeling.isNullOrBlank()) {
            "Saved today · You’re feeling $feeling"
        } else {
            "No check-in saved today"
        }
        homeCheckInButtons.forEach { (option, button) ->
            val selected = savedDate == today && option == feeling
            button.background = rippleBackground(
                if (selected) "#1D514F" else "#24435E",
                15,
                if (selected) "#377E77" else "#41637A",
                if (selected) "#6656E0C1" else "#6649DDB2"
            )
            button.setTextColor(color(if (selected) "#79F0CC" else "#D6E6EE"))
        }
        val history = readCheckInHistory()
        // Migrate the prior single-day value into the weekly history.
        if (!savedDate.isNullOrBlank() && !history.has(savedDate) && !feeling.isNullOrBlank()) {
            runCatching {
                java.time.LocalDate.parse(savedDate)
                history.put(savedDate, feeling)
                prefs.edit().putString("home-checkin-history", history.toString()).apply()
            }
        }
        homeWeekHistory?.let { row ->
            row.removeAllViews()
            val firstDate = currentDate.minusDays(6)
            for (offset in 0L..6L) {
                val date = firstDate.plusDays(offset)
                val savedFeeling = history.optString(date.toString()).takeIf { it.isNotBlank() }
                val moodColor = when (savedFeeling) {
                    "Good" -> "#33D3A5"
                    "Okay" -> "#F0C66A"
                    "Need support" -> "#FF8279"
                    else -> "#456177"
                }
                val dayColumn = LinearLayout(this).apply {
                    orientation = LinearLayout.VERTICAL
                    gravity = Gravity.CENTER
                    setPadding(dp(2), dp(4), dp(2), dp(4))
                    addView(TextView(this@MainActivity).apply {
                        text = date.dayOfWeek.getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.getDefault()).take(1)
                        textSize = 10f
                        gravity = Gravity.CENTER
                        setTextColor(color("#9FB8C7"))
                    })
                    addView(TextView(this@MainActivity).apply {
                        text = date.dayOfMonth.toString()
                        textSize = 12f
                        typeface = Typeface.DEFAULT_BOLD
                        gravity = Gravity.CENTER
                        setTextColor(color("#E3EFF4"))
                        setPadding(0, dp(2), 0, dp(4))
                    })
                    addView(TextView(this@MainActivity).apply {
                        text = when (savedFeeling) {
                            "Good" -> "G"
                            "Okay" -> "O"
                            "Need support" -> "!"
                            else -> "·"
                        }
                        textSize = 12f
                        typeface = Typeface.DEFAULT_BOLD
                        gravity = Gravity.CENTER
                        setTextColor(this@MainActivity.color(if (savedFeeling == null) "#AFC4D1" else "#102331"))
                        background = rounded(moodColor, 16, moodColor)
                        minimumWidth = dp(28)
                        minimumHeight = dp(28)
                    })
                }
                row.addView(dayColumn, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            }
        }
    }
    private fun readCheckInHistory(): JSONObject = runCatching {
        JSONObject(prefs.getString("home-checkin-history", "{}") ?: "{}")
    }.getOrElse { JSONObject() }
    private fun setWatchSyncStatus(message: String) {
        if (::watchSyncStatusText.isInitialized) watchSyncStatusText.text = message
    }
    private fun label(text: String) = TextView(this).apply { this.text = text; textSize = 13f; typeface = Typeface.DEFAULT_BOLD; setTextColor(color("#9FB8C7")); setPadding(0, dp(7), 0, dp(3)) }
    private fun bodyText(text: String) = TextView(this).apply { this.text = text; textSize = 13f; setTextColor(color("#AFC4D1")); setPadding(0, dp(4), 0, dp(5)) }
    private fun section(title: String, subtitle: String) = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(17), dp(17), dp(17), dp(10))
        background = rounded("#172F45", 21, "#31536B")
        addView(TextView(this@MainActivity).apply { text = title; textSize = 20f; typeface = Typeface.create("sans-serif", Typeface.BOLD); setTextColor(color("#EAF4F8")); setPadding(0, 0, 0, dp(5)) })
        addView(TextView(this@MainActivity).apply { text = subtitle; textSize = 13f; setLineSpacing(dp(2).toFloat(), 1f); setTextColor(color("#AEC4D0")); setPadding(0, 0, 0, dp(9)) })
    }
    private fun overviewTile(row: LinearLayout, caption: String, initial: String): TextView {
        val tile = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(10), dp(11), dp(8), dp(11))
            background = rounded("#18364D", 16, "#2E526B")
            addView(TextView(this@MainActivity).apply {
                text = caption; textSize = 9f; letterSpacing = .08f; typeface = Typeface.DEFAULT_BOLD
                setTextColor(color("#49DDB2"))
            })
            addView(TextView(this@MainActivity).apply {
                text = initial; textSize = 12f; typeface = Typeface.DEFAULT_BOLD
                setTextColor(color("#E3EFF4")); setPadding(0, dp(5), 0, 0)
            })
        }
        val value = tile.getChildAt(1) as TextView
        row.addView(tile, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
            if (row.childCount > 0) marginStart = dp(7)
        })
        return value
    }
    private fun actionButton(text: String, action: () -> Unit) = Button(this).apply {
        this.text = text; isAllCaps = false; textSize = 15f; minHeight = dp(54); typeface = Typeface.DEFAULT_BOLD; setTextColor(color("#062B2B"))
        background = rippleBackground("#24D0A0", 15, ripple = "#66062B2B")
        setPadding(dp(12), dp(5), dp(12), dp(5)); addPressFeedback(); setOnClickListener { action() }
    }
    private fun secondaryButton(text: String, action: () -> Unit) = Button(this).apply {
        this.text = text; isAllCaps = false; textSize = 14f; minHeight = dp(50); typeface = Typeface.DEFAULT_BOLD; setTextColor(color("#D6E6EE"))
        background = rippleBackground("#24435E", 15, stroke = "#41637A", ripple = "#6649DDB2")
        setPadding(dp(12), dp(5), dp(12), dp(5)); addPressFeedback(); setOnClickListener { action() }
    }
    private fun rippleBackground(fill: String, radius: Int, stroke: String? = null, ripple: String) =
        RippleDrawable(
            ColorStateList.valueOf(color(ripple)),
            rounded(fill, radius, stroke),
            rounded("#FFFFFFFF", radius)
        )
    private fun Button.addPressFeedback() {
        setOnTouchListener { view, event ->
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> view.animate().scaleX(.975f).scaleY(.975f).setDuration(85).start()
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> view.animate().scaleX(1f).scaleY(1f).setDuration(125).start()
            }
            false
        }
    }
    private fun styleInput(input: EditText) {
        input.textSize = 14f; input.setTextColor(color("#E2EDF3")); input.setHintTextColor(color("#88A4B4"))
        input.setPadding(dp(13), dp(12), dp(13), dp(12)); input.background = rounded("#203F5B", 13, "#3A6078")
    }
    private fun rounded(fill: String, radius: Int, stroke: String? = null) = GradientDrawable().apply {
        setColor(color(fill)); cornerRadius = dp(radius).toFloat()
        if (stroke != null) setStroke(dp(1), color(stroke))
    }
    private fun color(value: String) = Color.parseColor(value)
    private fun cardParams() = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { bottomMargin = dp(14) }
    private fun fieldParams() = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { bottomMargin = dp(10) }
    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()

    override fun onDestroy() {
        watchSyncHandler.removeCallbacks(watchSyncTicker)
        if (cameraFrameReceiverRegistered) {
            unregisterReceiver(cameraFrameReceiver)
            cameraFrameReceiverRegistered = false
        }
        cameraPreviewBitmap?.takeIf { !it.isRecycled }?.recycle()
        cameraPreviewBitmap = null
        offlinePreviewBitmap?.takeIf { !it.isRecycled }?.recycle()
        offlinePreviewBitmap = null
        network.shutdown()
        videoAnalysis.shutdown()
        super.onDestroy()
    }
}
