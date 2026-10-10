# VITAL Health Companion

VITAL is a local academic health-record and screening prototype. It combines a React browser dashboard with a local Python ML API, symptom-based safety guidance, a static Bengaluru hospital directory, optional webcam medication appearance checks, voice distress screening, visit reminders, and account-scoped local persistence. Screening estimates and sensory checks are not clinically validated.

Important claim boundary: VITAL is not clinically validated and does not diagnose disease or automatically dispatch emergency services. The live Android posture prototype can attempt an opt-in SMS to the primary caretaker after it flags a possible fall; this may be a false alert. Fall alerts are saved to the signed-in account's alert history, where a caregiver can record a check-in outcome. SMS status distinguishes provider acceptance or phone submission from confirmed delivery. VITAL does not call an ambulance. Emergency guidance opens the phone dialer only after a person selects the India 112 link. Medication SMS reminders are separately configured and off until enabled in Settings.

## Start VITAL on Windows

Requirements: Windows 10/11, Node.js 20 or newer, Python 3.10 or newer, and internet access for the first dependency installation.

1. Extract the shared ZIP into a permanent folder. Do not run it from inside the ZIP preview.
2. Double-click `START VITAL.cmd`. On first launch, VITAL installs its frontend and Python dependencies, builds the app, starts both local services, and opens `http://127.0.0.1:5186`.
3. To start VITAL automatically after you sign in to Windows, right-click `install-vital-startup.ps1`, choose **Run with PowerShell**, and approve the script if Windows asks. This is a one-time per-user setup. Keep the extracted folder in the same location afterward; if you move it, run the installer again.

The startup launcher checks the VITAL backend health endpoint and the served frontend before opening the app. It is safe to run more than once: already-healthy VITAL services are reused. Logs are written to `runtime-logs` if startup needs troubleshooting. VITAL uses ports 5055 and 5186; CyberSahay on port 5173 is separate.

## Account and session

On first use, choose **Create an account** and register with an email and a password of at least 10 characters. Later visits on the same browser stay signed in for up to one year; choose **Sign out** on a shared device. Passwords are stored as salted PBKDF2 hashes, the session token is an HttpOnly cookie, and authenticated API requests and backend records are separated by account. Existing single-user browser data is carried into the first account on that browser.

This is local-demo authentication, not a hosted identity service. Accounts and server-side records live in JSON files under `backend/runtime-data/`; browser-side health state remains in that browser's local storage and does not sync to another device. There is no email verification, password reset, multi-factor authentication, encrypted database, remote backup, or administrator recovery. Keep the project folder private and back it up securely. Do not expose the local server to the public internet or use real patient data. For a real deployment, replace the JSON store and demo login with a reviewed identity provider, managed encrypted database, TLS, recovery and MFA flows, access auditing, backups, and applicable health-data compliance controls. If the backend is ever served over HTTPS, set `VITAL_COOKIE_SECURE=1` in its environment so browser session cookies require HTTPS.

### Deployment hardening baseline

The application now supports a production configuration guard. Set `VITAL_ENV=production`, set `VITAL_ALLOWED_ORIGINS` to exact HTTPS origins (comma-separated, no paths or wildcards), keep `VITAL_HOST=127.0.0.1` behind a TLS reverse proxy, and set `VITAL_COOKIE_SECURE=1`. Production mode fails at startup if the origin allowlist is missing or not HTTPS, and production sessions default to 12 hours. Registration and sign-in share an IP-based attempt limit. Production frontend builds include a Content Security Policy; local development builds do not. See `backend/.env.example` for the configuration names.

This is a hardening baseline, not production certification. The built-in Python HTTP server and JSON files are still intended for a single local installation, not internet-facing multi-user hosting. Before real deployment, replace them with a supported production server and transactional encrypted database, add MFA/account recovery and operational audit controls, configure TLS and backups, complete a security/privacy review, and validate the clinical workflows and model independently. Do not enter real patient information into a public deployment of this repository.

For development, run `npm run dev` from this folder and start the local API with `.venv\Scripts\python.exe backend\server.py` after the first setup.

## Ask VITAL

Select **Ask VITAL** in the lower-right corner from any screen. Ask about the current triage result, readings, medication schedule, or preparing for an appointment. VITAL uses an available local LM Studio/Ollama model when configured; without one, it provides offline help for common questions. Chat messages and the selected current-session context are sent only to the VITAL service running on this computer and are not saved as chat history. No question is sent to a cloud AI service.

To enable open-ended answers, install and run a model in LM Studio or Ollama, then start VITAL. The assistant still provides general information only; it cannot diagnose, prescribe, or contact emergency services. For urgent symptoms in India, call 112.

## Reproducible Evidence

The model evidence layer lives under `backend/model-artifacts`.

The current triage classifier is a scikit-learn gradient-boosting model over numeric vital/profile inputs. It deliberately excludes the benchmark's generated case-context text because it is not a verified patient symptom narrative. The committed metrics use the same stratified 75/25 split as the earlier model and add five-fold cross-validation on training data. In the latest run, held-out accuracy is 91.5% (up from 74.4%) and macro-F1 is 0.806 (up from 0.513). Emergency-proxy recall improved from 11.4% to 36.7%, but the model still missed 50 of 79 emergency-proxy cases in the held-out set. These are results against rule-derived proxy labels, not clinical accuracy; the model remains unsuitable for clinical or emergency decision-making. Raw PhysioNet files are absent from this workspace and the prepared export's patient-sampling history is unknown. Missing readings are retained as missing and imputed only within the model pipeline; VITAL warns when current readings were not supplied. The app rejects out-of-range vital entries, the API ignores and warns about out-of-range inputs, and symptom rules ignore explicitly denied symptoms.

```powershell
npm run prepare:data
npm run train:model
npm run evidence:voice
npm run evidence:medication
```

The backend exposes:

- `POST /api/triage` with `state`, `score`, probabilities, confidence, model version, dataset status, top features, and fallback flag.
- `GET /api/model/evidence` with dataset manifest, metrics, confusion matrix, proxy module evidence, references, and limitations.
- `GET /api/local-ai/status` with local LM Studio/Ollama availability. The optional LM Studio model path defaults to `%USERPROFILE%\.lmstudio\models\lmstudio-community\gemma-4-26B-A4B-it-GGUF`; override it with `VITAL_LOCAL_GEMMA_PATH`. This is Gemma-family desktop support, not Gemma 3n Android support.
- `POST /api/prescriptions/parse` for prescription schedule extraction. It tries the local LM Studio endpoint first and intentionally falls back to deterministic parsing when model output is not valid JSON.
- `POST /api/medication/reminders` to keep a user's confirmed daily schedule on the local backend. With Twilio configured, the patient can opt in to SMS reminders 10 minutes before, 5 minutes before, and at each dose time; caretaker SMS is a separate option sent at dose time. Provider failures are retried up to three times during the following five minutes and provider acceptance is recorded in the automation audit.

The Android companion can also deliver local medicine notifications without SMS charges. Pair it with VITAL, check the patient's separate medicine-reminder consent box, grant Android notification and alarm permissions, then tap **Sync medicine reminders**. It schedules the saved medication name, dose, and time on the phone for 10 minutes before, 5 minutes before, and at the scheduled time. Notifications offer **I took it** (a patient self-report) and **Snooze 10 min** actions. Responses are queued on the phone if offline and sync to the VITAL timeline when the phone reconnects. They are not proof of ingestion. Sync again after changing the prescription schedule. Android may delay alarms under battery restrictions, and force-stopping the app can pause them until the app is opened again.

The Android posture monitor analyzes camera frames locally and can raise a possible-fall alert after sustained low, horizontal posture. This can produce false alerts, does not establish loss of consciousness, and does not call emergency services. If the patient opted in and SMS is configured, the phone may attempt a caretaker SMS; the app reports submission status, not confirmed handset delivery. The **Call 112** action opens the dialer for a person to place a call. The offline posture test analyzes an existing video and shows model detections for review; it does not contact anyone. Neither mode is validated fall or unconsciousness detection.

### Optional medication SMS reminders

SMS sending is off by default. VITAL uses Twilio when the configured account has a valid SMS sender. If Twilio is unavailable or explicitly rejects a non-appointment message, VITAL queues it for the paired Android companion to submit through its SIM. Appointment messages use the companion's existing SIM queue. Carrier/provider fees may apply. Keep the backend running; for phone fallback, keep the Android app open or its camera service running and grant SMS permission.

1. Copy `backend/.env.example` to `backend/.env` and fill in the account SID, auth token, and either `VITAL_TWILIO_FROM_NUMBER` or `VITAL_TWILIO_MESSAGING_SERVICE_SID`. The sender must be active on the same Twilio account and SMS-capable. Keep this private file out of source control and never put credentials in frontend code or share them.
2. Fully restart the VITAL backend so it loads the credentials. The startup launcher reuses an already-running backend, so simply opening the app again may not reload them.
3. In VITAL, open **Settings → Patient profile** and enter your mobile number and/or the primary caretaker number in international format (for example, `+919876543210`). Analyze the prescription and confirm the medicine times.
4. Pair the Android companion, tap **Enable phone SMS**, and grant SMS permission to use SIM fallback. For best delivery, keep the app open or its camera service running.
5. In **Settings → Monitoring preferences**, enable **SMS me about scheduled medicines** to receive patient reminders 10 minutes before, 5 minutes before, and at each dose time. Enable **Text the primary caretaker at dose time** separately if needed. VITAL never treats a message as proof that medicine was taken.

The Android companion polls the phone-SMS queue while it is open or its camera service is running. It submits queued messages using the phone's default SIM; Android submission is not a carrier delivery receipt. Phone-SIM fallback can incur carrier charges. The local scheduler runs only while the VITAL backend computer is on, connected, and the backend process is running. VITAL never claims that the patient took a dose based on a sent reminder.

### Daily health tips

The dashboard displays a browsable health-slogan card at the bottom of the page; it does not interrupt the screen. In **Settings → Monitoring preferences**, enter your mobile number with country code and opt in to **Daily health slogan by SMS** to receive one general wellness tip per day at the selected local time. This uses the configured Twilio SMS sender, may incur provider/carrier charges, and only runs while the VITAL backend is running. It is disabled by default; turn it off in Settings to stop future messages. Provider acceptance does not confirm handset delivery. Messages contain general wellness guidance, not individualized medical advice.

For stronger publication evidence, place real downloaded public dataset files under `data/raw/challenge-2019` or add credentialed MIMIC-IV-ED exports locally, then rerun `npm run prepare:data` and `npm run train:model`. Raw clinical files are excluded from the WhatsApp source package; the prepared demo dataset and model artifacts needed to run the app are included.

## Using VITAL

1. Review your health overview and profile.
2. Enter symptoms and readings in **Symptom Checker**, then review the result and general care guidance.
3. Use **Ask VITAL** to ask questions about your recorded results, readings, medicines, or preparing for a doctor visit.
4. Review medication activity, wearable context, and your health timeline.

### Watch data (Android)

VITAL's Android companion reads records from Android Health Connect after the patient grants per-record read access. For a Fastrack watch, sync it in Fastrack Smart first and allow that app to write the available record types to Health Connect. Pair the phone with VITAL on the same trusted Wi-Fi and tap **Sync watch readings**. VITAL uploads only the recent records Health Connect actually returns; a permission toggle allows access but does not mean a measurement has been written. Check the companion's status for the metrics received and grant any missing VITAL read permissions. Sync is initiated while the Android app is open; it is not a real-time watch stream or a background medical monitor. Wearable values remain wellness context, not a diagnosis or a substitute for current clinical measurements.
5. Save a visit reminder (this does not book a hospital appointment) or open emergency help when needed. Emergency workflows record a local event; VITAL does not call an ambulance.
6. In **Health Report**, select **Save health report as PDF** to download the report directly.

## Privacy and Scope

VITAL is not a medical device and does not diagnose illness. Emergency incident logging is local recordkeeping; no dispatch occurs. Hospital entries are static directory references and do not provide live availability, routing, or travel time. The emergency call link opens the phone dialer for the person to place the call. Optional medication reminder SMS is sent to the saved primary caretaker only after SMS credentials are configured and the user enables it in Settings. Patient profile and monitoring data are kept in browser localStorage unless the local backend API is called. The assistant sends the current question and selected session context only to the local backend on this computer; it does not persist the conversation or send it to a cloud service.

Medication verification is adherence support only. After analyzing a prescription, select a prescribed medicine, start the camera, confirm the pack label with a caregiver or pharmacist, and capture five reference views. VITAL stores small color-feature vectors locally and compares later camera frames with those references. This is a visual similarity demo, not a validated pill-identity model: lookalike tablets may score similarly, and it cannot prove ingestion or prescribe medication changes. Always check the medicine name and strength on its labeled packaging.

### Voice dictation

VITAL requests on-device browser speech recognition so microphone audio is not sent to the browser's remote speech service. On the first use, a supported browser may download its English speech pack once; allow microphone access when prompted. If the browser has no on-device speech API or language pack, the page shows that status. On Windows, focus the transcript box and press **Win+H** to use Windows voice typing as a fallback. The typed transcript is saved with the local VITAL demo state.

## Verification

With the backend and frontend running:

```powershell
npm run build
npm audit --json
npm run qa
npm run deliverables
```

Final generated artifacts are in `D:\vital\final-deliverables`.
"# vital-health-companion" 
