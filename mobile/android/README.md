# VITAL Phone Camera (Android)

This native Android companion runs a local YOLO11n pose model on camera snapshots (about once per second, depending on phone performance). It syncs a low-resolution JPEG and the latest person/pose status to a signed-in VITAL account each sample for the live dashboard. CameraX runs in a user-started foreground service, so capture can continue while the screen is locked. A partial wake lock keeps the capture loop running and can drain battery; keep the phone on power and stop if it gets hot. Android shows an ongoing notification with a Stop action.

The fall rule is temporal: it must first observe an upright person, then a low/horizontal pose sustained over multiple samples. A person already lying down when monitoring starts will not count as a detected fall. A possible-fall event raises an Android alert, opens the phone dialer for a person to call 112, and attempts SMS to the configured primary contact and up to two additional emergency contacts (SMS permission/contact/provider required). It does not place an emergency call automatically.

## Build and install

Open this `mobile/android` folder in Android Studio and let Gradle sync. Run the `app` configuration on an Android 8.0+ phone, or build a debug APK. The built APK is at:

`app/build/outputs/apk/debug/app-debug.apk`

The project uses Android SDK 37 and Android Gradle Plugin 9.1.1. The YOLO11n pose model is bundled in `app/src/main/assets/yolo11n-pose.onnx` and runs locally through ONNX Runtime; camera images are not uploaded for model inference. `local.properties` points to the SDK on this computer and is intentionally ignored by Git.

## Connect to VITAL

1. Keep the phone and VITAL computer on the same trusted private Wi-Fi. Do not port-forward the VITAL port or use this prototype over public Wi-Fi.
2. On the computer, run `START VITAL - PHONE CAMERA.cmd`. It restarts VITAL’s local API in private-LAN mode and prints the computer’s Wi-Fi address. If Windows Firewall asks, allow Python on **Private networks only**.
3. Sign in to VITAL on the computer and open **Camera check**. Confirm the patient agreed, then create a one-time pairing code.
4. Open the VITAL Phone Camera app on Android. Enter the computer address shown by VITAL (including `:5055`) and the six-digit code, then press **Pair with VITAL**.
5. Confirm consent in the Android app and press **Start camera while locked**. Grant Camera and Notifications permissions. Locking the screen should leave the camera foreground service active; use its notification’s **Stop camera** action to end it.

## Connect a Fastrack watch

The companion reads records that Android Health Connect makes available. It does not pair directly to the watch over Bluetooth, and it cannot force the watch or its vendor app to publish measurements sooner.

1. Install **Fastrack Smart**, pair the watch, and sync it in that app. Enable its Google Fit health-data sync if available.
2. In **Google Fit → Profile → Settings → Health Connect**, turn on **Sync Fit with Health Connect**.
3. In **Health Connect → App permissions**, allow Google Fit to write data and VITAL to read the health types you want to share. Seeing an app listed with permissions does not prove it has written records; check Health Connect's recent data/access and verify a watch reading appears.
4. Open VITAL Phone Camera, pair it with the VITAL computer using the steps above, and press **Sync watch readings** once to grant permissions and check the connection. VITAL then checks Health Connect about once a minute while the companion is open and uploads available readings to the dashboard.

The watch may sync only some metrics, and measurements can arrive with a delay. VITAL displays actual records that Health Connect provides; it does not invent missing values. This bridge is periodic health-data sync, not a second-by-second stream or a fall detector. The watch identifier `FT_A7001_7427` alone does not establish a direct Bluetooth data protocol.

## Limits and privacy

- VITAL keeps only the latest JPEG snapshot in server memory. Android creates a temporary cache file for capture and deletes it after sending. There is no audio or video recording.
- This prototype uses HTTP on the local network. Use a trusted private Wi-Fi only; do not expose port 5055 to the internet. Pairing codes expire after five minutes and are single-use. The backend stores only a hash of the phone's camera token so pairing survives a backend restart; tokens expire after 30 days and can be revoked from VITAL.
- The phone and computer must both stay powered, connected to the same Wi-Fi, and running. Battery, heat, Android vendor policies, or network interruption can stop capture; it is not guaranteed 24/7.
- Fall detection is an unvalidated prototype heuristic built on general human pose keypoints, not a medical or certified fall detector. It may miss falls or raise false alerts; it cannot determine injury or consciousness. The phone only opens the emergency dialer; it does not call emergency services by itself. Keep a responsible person available and use normal emergency services when needed.
