package com.vital.phonecamera

import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.widget.TextView

class PermissionsRationaleActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.rgb(16, 31, 48)
        window.navigationBarColor = Color.rgb(16, 31, 48)
        setContentView(TextView(this).apply {
            text = "VITAL reads only the Health Connect record types you approve, such as heart rate, oxygen saturation, steps, activity calories, distance, sleep, height, and weight. Readings are sent to the VITAL computer you paired on your local Wi-Fi and shown as wellness context. VITAL does not use these readings to diagnose a condition. You can review or revoke access in Android Health Connect settings."
            textSize = 18f
            setTextColor(Color.rgb(229, 242, 247))
            setBackgroundColor(Color.rgb(16, 31, 48))
            gravity = Gravity.CENTER_VERTICAL
            setPadding(48, 48, 48, 48)
        })
    }
}
