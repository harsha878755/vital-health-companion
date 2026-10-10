package com.vital.phonecamera

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.BroadcastReceiver
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import org.json.JSONArray
import org.json.JSONObject
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZonedDateTime
import java.util.UUID
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

object MedicationReminderScheduler {
    private const val PREFS = "vital-camera"
    private const val SCHEDULE_KEY = "medication-notification-schedule"
    private const val ALARM_IDS_KEY = "medication-notification-alarm-ids"
    private const val CHANNEL_ID = "vital_medication_reminders"
    private const val ACTION_REMINDER = "com.vital.phonecamera.action.MEDICATION_REMINDER"
    private const val ACTION_MARK_TAKEN = "com.vital.phonecamera.action.MEDICATION_MARK_TAKEN"
    private const val ACTION_SNOOZE = "com.vital.phonecamera.action.MEDICATION_SNOOZE"
    private const val RESPONSE_QUEUE_KEY = "pending-medication-responses"
    private val responseLock = Any()
    private val responseExecutor by lazy { Executors.newSingleThreadExecutor() }

    private data class Stage(val minutesBefore: Int, val label: String) {
        val key: String get() = if (minutesBefore == 0) "due" else "$minutesBefore-minutes"
    }

    private val stages = listOf(
        Stage(10, "Dose due in 10 minutes"),
        Stage(5, "Dose due in 5 minutes"),
        Stage(0, "Dose is due now"),
    )

    fun saveAndSchedule(context: Context, schedule: JSONObject): Int {
        val doses = schedule.optJSONArray("doses") ?: JSONArray()
        val cleanDoses = JSONArray()
        for (index in 0 until doses.length()) {
            val dose = doses.optJSONObject(index) ?: continue
            val medication = dose.optString("medication").trim()
            val time = dose.optString("time").trim()
            if (medication.isBlank() || runCatching { LocalTime.parse(time) }.isFailure) continue
            cleanDoses.put(JSONObject()
                .put("medication", medication.take(100))
                .put("dose", dose.optString("dose").trim().take(60))
                .put("time", time))
        }

        val saved = JSONObject()
            .put("patientName", schedule.optString("patientName", "VITAL patient").take(100))
            .put("timeZone", schedule.optString("timeZone", ""))
            .put("utcOffsetMinutes", schedule.optInt("utcOffsetMinutes", 0))
            .put("doses", cleanDoses)

        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        cancelScheduled(context, prefs.getStringSet(ALARM_IDS_KEY, emptySet()).orEmpty())
        prefs.edit().putString(SCHEDULE_KEY, saved.toString()).apply()
        val alarmIds = scheduleAll(context, saved)
        prefs.edit().putStringSet(ALARM_IDS_KEY, alarmIds).apply()
        return cleanDoses.length()
    }

    fun reschedule(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val raw = prefs.getString(SCHEDULE_KEY, null) ?: return
        val schedule = runCatching { JSONObject(raw) }.getOrNull() ?: return
        cancelScheduled(context, prefs.getStringSet(ALARM_IDS_KEY, emptySet()).orEmpty())
        val alarmIds = scheduleAll(context, schedule)
        prefs.edit().putStringSet(ALARM_IDS_KEY, alarmIds).apply()
    }

    private fun scheduleAll(context: Context, schedule: JSONObject): MutableSet<String> {
        createChannel(context)
        val doses = schedule.optJSONArray("doses") ?: return mutableSetOf()
        val zone = runCatching { ZoneId.of(schedule.optString("timeZone")) }.getOrElse {
            val offset = schedule.optInt("utcOffsetMinutes", 0).coerceIn(-840, 840)
            runCatching { java.time.ZoneOffset.ofTotalSeconds(offset * 60) }.getOrElse { ZoneId.systemDefault() }
        }
        val alarmManager = context.getSystemService(AlarmManager::class.java)
        val ids = mutableSetOf<String>()
        for (index in 0 until doses.length()) {
            val dose = doses.optJSONObject(index) ?: continue
            val medication = dose.optString("medication")
            val strength = dose.optString("dose")
            val time = dose.optString("time")
            val parsedTime = runCatching { LocalTime.parse(time) }.getOrNull() ?: continue
            for (stage in stages) {
                val stableKey = "$medication|$strength|$time|${stage.key}"
                val id = stableKey.hashCode() and 0x7fffffff
                ids += id.toString()
                val intent = reminderIntent(context, id)
                    .putExtra("medication", medication)
                    .putExtra("dose", strength)
                    .putExtra("time", time)
                    .putExtra("stageMinutes", stage.minutesBefore)
                    .putExtra("stageLabel", stage.label)
                    .putExtra("patientName", schedule.optString("patientName", "VITAL patient"))
                    .putExtra("timeZone", zone.id)
                val pending = PendingIntent.getBroadcast(
                    context, id, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                val trigger = nextTrigger(parsedTime, stage.minutesBefore, zone).toInstant().toEpochMilli()
                setAlarm(alarmManager, trigger, pending)
            }
        }
        return ids
    }

    private fun scheduleNext(context: Context, intent: Intent) {
        val time = runCatching { LocalTime.parse(intent.getStringExtra("time").orEmpty()) }.getOrNull() ?: return
        val minutesBefore = intent.getIntExtra("stageMinutes", 0)
        val zone = runCatching { ZoneId.of(intent.getStringExtra("timeZone").orEmpty()) }
            .getOrElse { ZoneId.systemDefault() }
        val id = intent.data?.lastPathSegment?.toIntOrNull() ?: return
        val pending = PendingIntent.getBroadcast(
            context, id, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val alarmManager = context.getSystemService(AlarmManager::class.java)
        val trigger = nextTrigger(time, minutesBefore, zone).toInstant().toEpochMilli()
        setAlarm(alarmManager, trigger, pending)
    }

    private fun nextTrigger(time: LocalTime, minutesBefore: Int, zone: ZoneId): ZonedDateTime {
        val now = ZonedDateTime.now(zone)
        for (offsetDays in 0L..2L) {
            val candidate = now.toLocalDate().plusDays(offsetDays)
                .atTime(time).atZone(zone).minusMinutes(minutesBefore.toLong())
            if (candidate.isAfter(now)) return candidate
        }
        return now.plusDays(1)
    }

    private fun setAlarm(alarmManager: AlarmManager, triggerAtMillis: Long, pending: PendingIntent) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pending)
        } else {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pending)
        }
    }

    private fun reminderIntent(context: Context, id: Int): Intent = Intent(context, MedicationReminderReceiver::class.java)
        .setAction(ACTION_REMINDER)
        .setData(Uri.parse("vital://medication-reminder/$id"))

    private fun cancelScheduled(context: Context, ids: Set<String>) {
        val manager = context.getSystemService(AlarmManager::class.java)
        for (value in ids) {
            val id = value.toIntOrNull() ?: continue
            val pending = PendingIntent.getBroadcast(
                context, id, reminderIntent(context, id),
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            ) ?: continue
            manager.cancel(pending)
            pending.cancel()
        }
    }

    private fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Medicine reminders",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "On-device notifications for the medicine schedule synced from VITAL"
            enableVibration(true)
        }
        context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    internal fun showReminder(context: Context, intent: Intent) {
        showReminder(context, intent, snoozed = false)
    }

    internal fun showSnoozedReminder(context: Context, intent: Intent) {
        showReminder(context, intent, snoozed = true)
    }

    private fun showReminder(context: Context, intent: Intent, snoozed: Boolean) {
        val medication = intent.getStringExtra("medication")?.takeIf { it.isNotBlank() } ?: return
        val dose = intent.getStringExtra("dose").orEmpty()
        val time = intent.getStringExtra("time").orEmpty()
        val stage = if (snoozed) "Snoozed reminder · please check the prescription now" else intent.getStringExtra("stageLabel") ?: "Dose is due now"
        val patient = intent.getStringExtra("patientName").orEmpty()
        val id = intent.data?.lastPathSegment?.toIntOrNull() ?: ("$medication|$dose|$time".hashCode() and 0x7fffffff)
        val medicationAndDose = listOf(medication, dose).filter { it.isNotBlank() }.joinToString(" ")
        val message = "$medicationAndDose is scheduled for $time. $stage. Follow the prescription; this notification does not confirm that the dose was taken."
        val openIntent = PendingIntent.getActivity(
            context, id,
            Intent(context, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("Medicine reminder${if (patient.isBlank()) "" else " · $patient"}")
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setContentIntent(openIntent)
            .setAutoCancel(true)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .addAction(android.R.drawable.checkbox_on_background, "I took it", actionIntent(context, intent, ACTION_MARK_TAKEN, id))
            .addAction(android.R.drawable.ic_lock_idle_alarm, "Snooze 10 min", actionIntent(context, intent, ACTION_SNOOZE, id + 1))
            .build()
        context.getSystemService(NotificationManager::class.java).notify(id, notification)
        if (!snoozed) scheduleNext(context, intent)
    }

    private fun actionIntent(context: Context, source: Intent, action: String, requestCode: Int): PendingIntent {
        val reminderId = source.data?.lastPathSegment?.toIntOrNull() ?: requestCode
        val intent = Intent(context, MedicationReminderActionReceiver::class.java)
            .setAction(action)
            .setData(Uri.parse("vital://medication-action/$reminderId/${action.substringAfterLast('_')}"))
            .putExtra("notificationId", reminderId)
        for (key in listOf("medication", "dose", "time", "stageMinutes", "stageLabel", "patientName", "timeZone")) {
            source.extras?.get(key)?.let { intent.putExtra(key, it.toString()) }
        }
        return PendingIntent.getBroadcast(
            context, requestCode, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    internal fun respondToReminder(context: Context, intent: Intent, action: String) {
        val event = JSONObject()
            .put("actionId", UUID.randomUUID().toString())
            .put("action", action)
            .put("medication", intent.getStringExtra("medication").orEmpty())
            .put("dose", intent.getStringExtra("dose").orEmpty())
            .put("time", intent.getStringExtra("time").orEmpty())
        synchronized(responseLock) {
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val queue = runCatching { JSONArray(prefs.getString(RESPONSE_QUEUE_KEY, "[]")) }.getOrElse { JSONArray() }
            queue.put(event)
            val bounded = JSONArray()
            for (index in (queue.length() - 100).coerceAtLeast(0) until queue.length()) bounded.put(queue.getJSONObject(index))
            prefs.edit().putString(RESPONSE_QUEUE_KEY, bounded.toString()).commit()
        }
        syncPendingResponses(context)
    }

    internal fun showResponseSaved(context: Context, source: Intent, taken: Boolean) {
        createChannel(context)
        val medication = source.getStringExtra("medication")?.takeIf { it.isNotBlank() } ?: "Your medicine"
        val dose = source.getStringExtra("dose")?.takeIf { it.isNotBlank() }?.let { " $it" }.orEmpty()
        val title = if (taken) "Dose response saved" else "Reminder snoozed"
        val text = if (taken) {
            "You reported taking $medication$dose. Saved on this phone; it will sync with VITAL when connected."
        } else {
            "Reminder snoozed for 10 minutes. Your response is saved and will sync with VITAL when connected."
        }
        val id = (source.getIntExtra("notificationId", 0) xor 0x40000000)
        val openIntent = PendingIntent.getActivity(
            context, id, Intent(context, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setContentIntent(openIntent)
            .setAutoCancel(true)
            .setCategory(NotificationCompat.CATEGORY_STATUS)
            .build()
        context.getSystemService(NotificationManager::class.java).notify(id, notification)
    }

    fun syncPendingResponses(context: Context) {
        val appContext = context.applicationContext
        responseExecutor.execute {
            val prefs = appContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val server = prefs.getString("server", "").orEmpty().trimEnd('/')
            val token = prefs.getString("token", null)
            if (server.isBlank() || token.isNullOrBlank()) return@execute
            val client = OkHttpClient.Builder().callTimeout(8, TimeUnit.SECONDS).build()
            val pending = runCatching { JSONArray(prefs.getString(RESPONSE_QUEUE_KEY, "[]")) }.getOrElse { JSONArray() }
            for (index in 0 until pending.length()) {
                val event = pending.optJSONObject(index) ?: continue
                try {
                    val body = event.toString().toRequestBody("application/json".toMediaType())
                    val request = Request.Builder()
                        .url("$server/api/camera/medication-response")
                        .header("Authorization", "Bearer $token")
                        .post(body)
                        .build()
                    client.newCall(request).execute().use { response ->
                        if (response.isSuccessful) removePendingResponse(appContext, event.optString("actionId"))
                    }
                } catch (_: Exception) {
                    // Keep the report on-device and retry the next time the app opens or another response is made.
                    return@execute
                }
            }
        }
    }

    private fun removePendingResponse(context: Context, actionId: String) {
        synchronized(responseLock) {
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val current = runCatching { JSONArray(prefs.getString(RESPONSE_QUEUE_KEY, "[]")) }.getOrElse { JSONArray() }
            val remaining = JSONArray()
            for (index in 0 until current.length()) {
                val item = current.optJSONObject(index) ?: continue
                if (item.optString("actionId") != actionId) remaining.put(item)
            }
            prefs.edit().putString(RESPONSE_QUEUE_KEY, remaining.toString()).commit()
        }
    }

    internal fun snoozeReminder(context: Context, source: Intent) {
        val originalId = source.getIntExtra("notificationId", -1)
        if (originalId < 0) return
        val snoozeId = ("$originalId|${System.currentTimeMillis()}".hashCode() and 0x7fffffff)
        val snoozedIntent = Intent(context, MedicationReminderSnoozeReceiver::class.java)
            .setAction("com.vital.phonecamera.action.MEDICATION_SNOOZED_REMINDER")
            .setData(Uri.parse("vital://medication-snooze/$snoozeId"))
            .putExtra("notificationId", originalId)
        for (key in listOf("medication", "dose", "time", "stageMinutes", "stageLabel", "patientName", "timeZone")) {
            source.extras?.get(key)?.let { snoozedIntent.putExtra(key, it.toString()) }
        }
        val pending = PendingIntent.getBroadcast(
            context, snoozeId, snoozedIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val alarmManager = context.getSystemService(AlarmManager::class.java)
        val triggerAt = System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(10)
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pending)
        } else {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pending)
        }
    }
}

class MedicationReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        MedicationReminderScheduler.showReminder(context, intent)
    }
}

class MedicationReminderRescheduleReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        MedicationReminderScheduler.reschedule(context)
    }
}

class MedicationReminderActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val notificationId = intent.getIntExtra("notificationId", -1)
        when (intent.action) {
            "com.vital.phonecamera.action.MEDICATION_MARK_TAKEN" -> {
                MedicationReminderScheduler.respondToReminder(context, intent, "patient-reported-taken")
                if (notificationId >= 0) context.getSystemService(NotificationManager::class.java).cancel(notificationId)
                MedicationReminderScheduler.showResponseSaved(context, intent, taken = true)
            }
            "com.vital.phonecamera.action.MEDICATION_SNOOZE" -> {
                MedicationReminderScheduler.respondToReminder(context, intent, "snoozed-10-minutes")
                if (notificationId >= 0) context.getSystemService(NotificationManager::class.java).cancel(notificationId)
                MedicationReminderScheduler.snoozeReminder(context, intent)
                MedicationReminderScheduler.showResponseSaved(context, intent, taken = false)
            }
        }
    }
}

class MedicationReminderSnoozeReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        MedicationReminderScheduler.showSnoozedReminder(context, intent)
    }
}
