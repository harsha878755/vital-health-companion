package com.vital.phonecamera

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SmsManager
import androidx.core.content.ContextCompat
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

object AppointmentSmsSync {
    private val executor = Executors.newSingleThreadExecutor()
    private val busy = AtomicBoolean(false)
    private val http by lazy {
        OkHttpClient.Builder()
            .connectTimeout(5, TimeUnit.SECONDS)
            .readTimeout(8, TimeUnit.SECONDS)
            .writeTimeout(8, TimeUnit.SECONDS)
            .callTimeout(15, TimeUnit.SECONDS)
            .build()
    }

    fun poll(context: Context, onStatus: ((String) -> Unit)? = null) {
        if (!busy.compareAndSet(false, true)) return
        val appContext = context.applicationContext
        executor.execute {
            try {
                val prefs = appContext.getSharedPreferences("vital-camera", Context.MODE_PRIVATE)
                val base = prefs.getString("server", "").orEmpty().trimEnd('/')
                val token = prefs.getString("token", "").orEmpty()
                if (base.isBlank() || token.isBlank()) return@execute
                val allowed = ContextCompat.checkSelfPermission(appContext, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED
                val queueRequest = Request.Builder()
                    .url("$base/api/camera/appointment-sms/queue")
                    .header("Authorization", "Bearer $token")
                    .header("X-Vital-Sms-Permission", allowed.toString())
                    .get()
                    .build()
                val tasks = http.newCall(queueRequest).execute().use { response ->
                    val payload = JSONObject(response.body?.string().orEmpty())
                    if (!response.isSuccessful) {
                        if (response.code == 401) onStatus?.invoke("Phone pairing expired. Create a new code in VITAL and pair this phone again.")
                        return@execute
                    }
                    if (payload.optBoolean("permissionRequired")) {
                        onStatus?.invoke("Allow SMS permission to send appointment messages through this phone.")
                    }
                    payload.optJSONArray("tasks") ?: JSONArray()
                }
                if (!allowed) {
                    onStatus?.invoke("Allow SMS permission to send VITAL messages through this phone.")
                    return@execute
                }
                @Suppress("DEPRECATION")
                val sms = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    appContext.getSystemService(SmsManager::class.java)
                } else SmsManager.getDefault()
                if (tasks.length() > 0) {
                    val byAppointment = mutableMapOf<String, JSONArray>()
                    for (index in 0 until tasks.length()) {
                        val task = tasks.optJSONObject(index) ?: continue
                        val recipient = task.optString("recipient")
                        val phone = task.optString("phone")
                        val message = task.optString("message")
                        val (taskStatus, detail) = if (recipient !in setOf("patient", "caretaker") || !phone.matches(Regex("\\+[1-9]\\d{7,14}")) || message.isBlank()) {
                            "phone-send-failed" to "The saved SMS recipient or message is invalid; no text was submitted."
                        } else {
                            try {
                                val parts = sms.divideMessage(message)
                                if (parts.size > 1) sms.sendMultipartTextMessage(phone, null, parts, null, null)
                                else sms.sendTextMessage(phone, null, message, null, null)
                                "submitted-by-phone" to "Android submitted the SMS request to the phone carrier. Delivery is not confirmed."
                            } catch (_: Exception) {
                                "phone-send-failed" to "Android could not submit this SMS. Check SIM service and SMS permission."
                            }
                        }
                        val result = JSONObject()
                            .put("recipient", recipient)
                            .put("status", taskStatus)
                            .put("detail", detail)
                        byAppointment.getOrPut(task.optString("appointmentId")) { JSONArray() }.put(result)
                    }
                    byAppointment.forEach { (appointmentId, appointmentResults) ->
                        val body = JSONObject().put("appointmentId", appointmentId).put("results", appointmentResults)
                            .toString().toRequestBody("application/json".toMediaType())
                        val reportRequest = Request.Builder()
                            .url("$base/api/camera/appointment-sms/result")
                            .header("Authorization", "Bearer $token")
                            .post(body)
                            .build()
                        http.newCall(reportRequest).execute().close()
                    }
                }

                val genericQueueRequest = Request.Builder()
                    .url("$base/api/camera/sms/queue")
                    .header("Authorization", "Bearer $token")
                    .header("X-Vital-Sms-Permission", "true")
                    .get()
                    .build()
                val smsTasks = http.newCall(genericQueueRequest).execute().use { response ->
                    if (!response.isSuccessful) return@execute
                    JSONObject(response.body?.string().orEmpty()).optJSONArray("tasks") ?: JSONArray()
                }
                val smsResults = JSONArray()
                val savedPhoneResults = runCatching {
                    JSONObject(prefs.getString("phone-sms-results", "{}") ?: "{}")
                }.getOrDefault(JSONObject())
                for (index in 0 until smsTasks.length()) {
                    val task = smsTasks.optJSONObject(index) ?: continue
                    val taskId = task.optString("taskId")
                    val phone = task.optString("phone")
                    val message = task.optString("message")
                    val savedStatus = savedPhoneResults.optString(taskId)
                    val status = if (savedStatus in setOf("submitted-by-phone", "phone-send-failed")) {
                        savedStatus
                    } else if (!phone.matches(Regex("\\+[1-9]\\d{7,14}")) || message.isBlank()) {
                        "phone-send-failed"
                    } else try {
                        val parts = sms.divideMessage(message)
                        if (parts.size > 1) sms.sendMultipartTextMessage(phone, null, parts, null, null)
                        else sms.sendTextMessage(phone, null, message, null, null)
                        "submitted-by-phone"
                    } catch (_: Exception) {
                        "phone-send-failed"
                    }
                    savedPhoneResults.put(taskId, status)
                    smsResults.put(JSONObject().put("taskId", taskId).put("status", status))
                }
                if (savedPhoneResults.length() > 200) {
                    val keys = mutableListOf<String>()
                    val iterator = savedPhoneResults.keys()
                    while (iterator.hasNext()) keys += iterator.next()
                    keys.drop(200).forEach { savedPhoneResults.remove(it) }
                }
                prefs.edit().putString("phone-sms-results", savedPhoneResults.toString()).apply()
                if (smsResults.length() > 0) {
                    val body = JSONObject().put("results", smsResults).toString().toRequestBody("application/json".toMediaType())
                    val reportRequest = Request.Builder()
                        .url("$base/api/camera/sms/result")
                        .header("Authorization", "Bearer $token")
                        .post(body)
                        .build()
                    http.newCall(reportRequest).execute().close()
                }
                if (tasks.length() > 0 || smsTasks.length() > 0) {
                    onStatus?.invoke("Phone submitted queued VITAL SMS to the carrier. Delivery is not confirmed.")
                }
            } catch (_: Exception) {
                // Keep the queue for a later poll; VITAL only marks a message
                // submitted after Android reports the result.
            } finally {
                busy.set(false)
            }
        }
    }
}
