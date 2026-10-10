import {
  Activity,
  AlertTriangle,
  Apple,
  Ambulance,
  BarChart3,
  BellRing,
  Bot,
  CalendarCheck,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Download,
  HeartPulse,
  History,
  Hand,
  Hospital as HospitalIcon,
  KeyRound,
  LogOut,
  MapPin,
  MessageCircle,
  Mic,
  Moon,
  Pause,
  PhoneCall,
  Pill,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  ScanFace,
  Send,
  ShieldCheck,
  Settings2,
  Smartphone,
  Square,
  Stethoscope,
  TimerReset,
  Upload,
  UserRound,
  Users,
  Volume2,
  Watch,
  Wind,
  Bike,
  X
} from "lucide-react";
import { ChangeEvent, CSSProperties, FormEvent, Fragment, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchHealth,
  fetchHospitals,
  fetchAppointments,
  fetchMedicationReminderStatus,
  fetchSmsDeliveryStatus,
  fetchAutomationEvents,
  fetchMedicationReferenceImages,
  fetchLocalAiStatus,
  fetchWearableSummary,
  postHealthQuestion,
  parsePrescription,
  extractPrescriptionImage,
  readTabletImprint,
  readMedicinePackageLabel,
  screenHealthPhoto,
  postAppointment,
  postIncident,
  postTriage,
  syncMedicationReminderSchedule,
  createPhoneCameraPairing,
  fetchPhoneCameraStatus,
  fetchPhoneCameraStream,
  fetchEmergencyIncidents,
  acknowledgePossibleFall,
  revokePhoneCamera,
  fetchCameraEmergencySettings,
  saveCameraEmergencySettings,
  fetchAuthSession,
  loginAccount,
  fetchWearableReadings,
  logoutAccount,
  registerAccount,
  AuthUser
} from "./api";
import {
  baselineTriage,
  demoProfile,
  demoScenarios,
  fallbackHospitals,
  seedMedicationLogs,
  seedPatientTimeline
} from "./data";
import { accountStorageKey, useStoredState } from "./hooks/useStoredState";
import { createHealthReportPdf } from "./healthReportPdf";
import { defaultPalette, PaletteId, palettes } from "./theme";
import {
  Appointment,
  HealthState,
  Hospital,
  Incident,
  PossibleFallAlert,
  CaregiverCheckIn,
  MedicationLog,
  PatientProfile,
  PatientTimelineEvent,
  PrescriptionDose,
  PrescriptionPlan,
  TriagePayload,
  TriageResponse,
  WearableReading,
  WearableSummary,
  MedicationReferenceImage,
  LocalAiStatus
} from "./types";

type TabId =
  | "dashboard"
  | "triage"
  | "medication"
  | "photoScreening"
  | "camera"
  | "phoneConnection"
  | "voice"
  | "emergency"
  | "appointments"
  | "wearables"
  | "analytics"
  | "timeline"
  | "export"
  | "settings";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  processLocally?: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = {
  new (): SpeechRecognitionLike;
  available?: (options: { langs: string[]; processLocally: boolean; quality?: "dictation" }) => Promise<"available" | "downloadable" | "unavailable">;
  install?: (options: { langs: string[]; processLocally: boolean; quality?: "dictation" }) => Promise<boolean>;
};

type TriageVitals = {
  spo2: string;
  pulse: string;
  temperature: string;
  systolicBp: string;
  respiration: string;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const tabs: Array<{ id: TabId; label: string; icon: ReactNode; group: "My health" | "Monitoring" | "History" | "Care" | "Settings" }> = [
  { id: "dashboard", label: "Home", icon: <HeartPulse />, group: "My health" },
  { id: "triage", label: "Symptoms & vitals", icon: <Stethoscope />, group: "My health" },
  { id: "medication", label: "Medications", icon: <Pill />, group: "My health" },
  { id: "photoScreening", label: "Photo health check", icon: <ScanFace />, group: "My health" },
  { id: "phoneConnection", label: "Connect phone", icon: <Smartphone />, group: "Monitoring" },
  { id: "camera", label: "Camera check", icon: <Camera />, group: "Monitoring" },
  { id: "voice", label: "Voice check", icon: <Mic />, group: "Monitoring" },
  { id: "wearables", label: "Wearables", icon: <Watch />, group: "Monitoring" },
  { id: "analytics", label: "Health summary", icon: <BarChart3 />, group: "History" },
  { id: "export", label: "Health report", icon: <Download />, group: "History" },
  { id: "timeline", label: "Health timeline", icon: <History />, group: "History" },
  { id: "emergency", label: "Emergency help", icon: <Ambulance />, group: "Care" },
  { id: "appointments", label: "Appointments", icon: <CalendarCheck />, group: "Care" },
  { id: "settings", label: "Settings", icon: <Settings2 />, group: "Settings" }
];

const navigationGroups = ["My health", "Monitoring", "History", "Care", "Settings"] as const;

const pageDescriptions: Record<TabId, string> = {
  dashboard: "A clear view of recent health activity, care plans, and connected sources.",
  triage: "Record symptoms and measurements, then review the screening result.",
  medication: "Review prescriptions, dose history, and reminder preferences.",
  photoScreening: "Review visible features in a health photo and consider safe next steps; this is not a diagnosis.",
  camera: "Review phone camera monitoring and posture check controls.",
  phoneConnection: "Pair the VITAL Android app with this dashboard over your trusted network.",
  voice: "Record a voice check-in and review the resulting wellness context.",
  emergency: "Review emergency options and configured caregiver contacts.",
  appointments: "Keep planned visits and appointment details together.",
  wearables: "Review readings shared by connected health and wearable sources.",
  analytics: "Explore recent readings and health activity over time.",
  timeline: "See recent care, monitoring, and medication events in order.",
  export: "Prepare a shareable summary of the health information in VITAL.",
  settings: "Manage app preferences, reminders, and connected services."
};

const guidedDemoSteps: Array<{ tab: TabId; title: string; instruction: string }> = [
  { tab: "dashboard", title: "Patient overview", instruction: "Review the patient summary and current monitoring status." },
  { tab: "triage", title: "Symptoms, vitals & screening", instruction: "Enter current information and review the screening estimate." },
  { tab: "voice", title: "Voice check", instruction: "Say or type how you are feeling to record a check-in." },
  { tab: "medication", title: "Medication schedule", instruction: "Review your recorded doses and confirm medication activity." },
  { tab: "wearables", title: "Wearable context", instruction: "Review synced readings and their source; these are wellness context." },
  { tab: "timeline", title: "Patient timeline", instruction: "See recent monitoring and care events in one history." },
  { tab: "analytics", title: "Health summary", instruction: "Review your recent readings and care activity." },
  { tab: "appointments", title: "Plan a visit", instruction: "Save appointment details or review a visit you have planned." },
  { tab: "emergency", title: "Emergency help", instruction: "Review nearby care options and ways to contact help." },
  { tab: "export", title: "Health report", instruction: "Preview the patient summary and save it as a PDF." }
];

function stateClass(state: string) {
  return state.toLowerCase().replace("-", "");
}

function hasTriageResult(triage: TriageResponse) {
  return triage.modelVersion !== baselineTriage.modelVersion && triage.datasetStatus !== "pending_local_api";
}

function safeScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function localDateInputValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function minutesFromTime(value: string) {
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

// Explainable visual hints for common medicines; this never diagnoses or identifies a pill.
function dueDose(plan: PrescriptionPlan | null) {
  if (!plan?.doses?.length) return null;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  return (
    plan.doses
      .map((dose) => ({ dose, minutes: minutesFromTime(dose.time) }))
      .filter((item): item is { dose: NonNullable<PrescriptionPlan["doses"]>[number]; minutes: number } => item.minutes !== null)
      .map((item) => ({ ...item, distance: Math.abs(item.minutes - current) }))
      .sort((a, b) => a.distance - b.distance)[0] || null
  );
}

function medicationDoseKey(dose: { medication: string; dose: string; time: string }) {
  return `${dose.medication}|${dose.dose}|${dose.time}`.toLowerCase().replace(/\s+/g, " ").trim();
}

function localPrescriptionFallback(text: string): PrescriptionPlan {
  const segments = text.split(/\n|(?<=[.;])\s+/).map((part) => part.trim()).filter(Boolean);
  const parsed: Array<{ medication: string; dose: string; instructions: string }> = [];
  const medicineLine = /^(?:tab(?:let)?|cap(?:sule)?)?\s*([A-Za-z][A-Za-z0-9+.-]*(?:\s+[A-Za-z][A-Za-z0-9+.-]*)*?)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|µg|g|ml|iu)?\b/i;
  for (const segment of segments) {
    const match = segment.match(medicineLine);
    if (match) parsed.push({ medication: match[1].trim(), dose: `${match[2]}${match[3] ? ` ${match[3]}` : " (unit not specified)"}`, instructions: segment });
    else if (parsed.length) parsed[parsed.length - 1].instructions += ` ${segment}`;
  }
  const doses: PrescriptionPlan["doses"] = [];
  for (const item of parsed) {
    const guidance = item.instructions.toLowerCase();
    const times = [...guidance.matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g)].map(([, hour, minute]) => `${hour.padStart(2, "0")}:${minute}`);
    const hasFrequency = /\b(once|twice|daily|\d+\s+times|bd|od)\b/.test(guidance);
    const hasTimeOfDay = /\b(morning|afternoon|evening|night|bedtime)\b/.test(guidance);
    const uniqueTimes = [...new Set(times.length ? times : /\b(as needed|when required|prn)\b/.test(guidance) ? ["As needed"] : /\b(twice|2 times|bd|bid)\b/.test(guidance) ? ["Set time 1", "Set time 2"] : ["Set time"])];
    const timingNote = !hasFrequency
      ? " Frequency and timing were not stated; confirm and enter them from the prescription."
      : !hasTimeOfDay && !/\b([01]?\d|2[0-3]):[0-5]\d\b/.test(guidance)
        ? " Set the exact reminder time(s) manually from the prescription."
        : "";
    uniqueTimes.forEach((time) => doses.push({ medication: item.medication, dose: item.dose, time, instructions: "Parsed from entered text. Confirm medicine spelling and strength/unit against the labeled prescription." + timingNote }));
  }
  return {
    source: "browser fallback", parsedAt: new Date().toISOString(), engine: "browser-regex-fallback", confidence: doses.length ? 0.46 : 0.2,
    requiresReview: true, humanReviewed: false, summary: "Schedule extracted from entered text for review. Confirm every item against the prescription.",
    doses: doses.length ? doses.slice(0, 8) : [{ medication: "Unspecified medication", dose: "Review manually", time: "Set time", instructions: "Could not find a medicine name and strength. Enter the schedule manually." }],
    warnings: ["Human review required.", "Medicine identity and dose must be checked against the prescription."]
  };
}

type TabletImprintResult = { imprint: string; readable: boolean; confidence: "low" | "medium" | "high"; uncertainCharacters: string[]; modelId: string; engine: string; note: string; checkedAt: string };
type PackageLabelResult = { medicineName: string; strength: string; transcription: string; confidence: "low" | "medium" | "high"; modelId: string; engine: string; note: string; comparison: "consistent" | "possible-mismatch" | "review"; checkedAt: string };
type MedicationVisualProfile = { medication: string; dose: string; samples: number[][]; referencePhotos?: string[]; imprintResult?: TabletImprintResult; packagePhoto?: string; packageRead?: PackageLabelResult; updatedAt: string };

function medicationProfileKey(dose: { medication: string; dose: string }) {
  return `${dose.medication}|${dose.dose}`.toLowerCase().replace(/\s+/g, " ").trim();
}

// Small local color descriptor for a user-confirmed reference set. It is an
// appearance similarity aid, not a pill identity classifier.
function medicationImageSignature(data: Uint8ClampedArray, width: number, height: number) {
  const hueSaturation = Array(36).fill(0) as number[];
  let red = 0, green = 0, blue = 0, count = 0;
  let backgroundCount = 0, backgroundR = 0, backgroundG = 0, backgroundB = 0;
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const offset = (y * width + x) * 4;
    if (x < width * .15 || x > width * .85 || y < height * .15 || y > height * .85) {
      backgroundCount += 1; backgroundR += data[offset]; backgroundG += data[offset + 1]; backgroundB += data[offset + 2];
    }
  }
  const sceneR = backgroundR / Math.max(backgroundCount, 1), sceneG = backgroundG / Math.max(backgroundCount, 1), sceneB = backgroundB / Math.max(backgroundCount, 1);
  let minX = width, maxX = 0, minY = height, maxY = 0;
  const objectPixels: number[] = [];
  for (let y = Math.floor(height * .17); y < height * .83; y += 1) for (let x = Math.floor(width * .17); x < width * .83; x += 1) {
    const offset = (y * width + x) * 4;
    const rawR = data[offset], rawG = data[offset + 1], rawB = data[offset + 2];
    const brightness = (rawR + rawG + rawB) / 3;
    const sceneDistance = Math.sqrt((rawR - sceneR) ** 2 + (rawG - sceneG) ** 2 + (rawB - sceneB) ** 2);
    const warmCandidate = rawR > rawB * 1.12 && rawG > rawB * 1.03;
    if (brightness < 92 || (sceneDistance <= 18 && !warmCandidate)) continue;
    objectPixels.push(offset);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  if (objectPixels.length < 25) return null;
  for (const offset of objectPixels) {
    const r = data[offset] / 255, g = data[offset + 1] / 255, b = data[offset + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
    let hue = 0;
    if (delta) {
      if (max === r) hue = ((g - b) / delta) % 6;
      else if (max === g) hue = (b - r) / delta + 2;
      else hue = (r - g) / delta + 4;
      hue /= 6;
      if (hue < 0) hue += 1;
    }
    const hueBin = Math.min(11, Math.floor(hue * 12));
    const saturationBin = Math.min(2, Math.floor((max ? delta / max : 0) * 3));
    hueSaturation[hueBin * 3 + saturationBin] += 1;
    red += r; green += g; blue += b; count += 1;
  }
  const normalizedHistogram = hueSaturation.map((value) => value / Math.max(count, 1));
  const objectRatio = objectPixels.length / (width * height);
  const aspectRatio = (maxX - minX + 1) / Math.max(1, maxY - minY + 1);
  return [...normalizedHistogram, red / Math.max(count, 1), green / Math.max(count, 1), blue / Math.max(count, 1), objectRatio, aspectRatio];
}

function medicationProfileSimilarity(a: number[], b: number[]) {
  const histogramOverlap = a.slice(0, 36).reduce((sum, value, index) => sum + Math.min(value, b[index]), 0);
  const rgbDistance = Math.sqrt([36, 37, 38].reduce((sum, index) => sum + (a[index] - b[index]) ** 2, 0));
  const sizeSimilarity = Math.max(0, 1 - Math.abs(a[39] - b[39]) / .2);
  const shapeSimilarity = Math.max(0, 1 - Math.abs(Math.log(Math.max(a[40], .01) / Math.max(b[40], .01))) / 1.5);
  return Math.max(0, Math.min(1, histogramOverlap * 0.5 + (1 - rgbDistance / Math.sqrt(3)) * 0.25 + sizeSimilarity * 0.1 + shapeSimilarity * 0.15));
}

function fallbackTriage(symptoms: string, medicationScore: number, voiceDistress: boolean): TriageResponse {
  const lower = symptoms.toLowerCase();
  let score = 12;
  const factors: string[] = [];
  const rules = [
    ["chest pain", 42],
    ["breath", 34],
    ["severe", 12],
    ["unconscious", 45],
    ["stroke", 44],
    ["faint", 34],
    ["sweat", 8],
    ["fever", 8],
    ["dizz", 8],
    ["missed", 10],
    ["blood pressure", 8]
  ] as const;
  let emergencySignal = false;

  rules.forEach(([keyword, weight]) => {
    if (lower.includes(keyword)) {
      score += weight;
      factors.push(`Detected keyword: ${keyword}`);
      if (["chest pain", "breath", "unconscious", "stroke", "faint"].includes(keyword)) {
        emergencySignal = true;
      }
    }
  });
  if (medicationScore < 80) {
    score += medicationScore < 60 ? 14 : 6;
    factors.push(`Medication compliance below target: ${medicationScore}%`);
  }
  if (voiceDistress) {
    score += 18;
    factors.push("Voice distress flag is active");
  }
  const finalScore = safeScore(score);
  const state: HealthState = emergencySignal || finalScore >= 82 ? "Emergency" : finalScore >= 42 ? "At-Risk" : "Normal";

  const probabilities = { Normal: state === "Normal" ? 0.74 : 0.1, "At-Risk": state === "At-Risk" ? 0.66 : 0.2, Emergency: state === "Emergency" ? 0.72 : 0.08 };
  return {
    state,
    score: finalScore,
    probabilities,
    confidence: Math.max(...Object.values(probabilities)),
    riskFactors: factors.length ? factors : ["No high-severity signal identified in the information entered"],
    recommendations:
      state === "Emergency"
        ? [
            "Start the emergency response timer and notify contacts.",
            "Prefer the nearest emergency-ready hospital.",
            "Do not delay professional medical help for app output."
          ]
        : state === "At-Risk"
          ? [
              "Book a same-day consultation or telemedicine check.",
              "Repeat medication verification and monitor vitals for 30 minutes.",
              "Alert a caretaker if symptoms intensify."
            ]
          : ["No high-risk pattern was flagged in the information entered. This estimate cannot rule out illness.", "If symptoms persist or worsen, contact a qualified clinician."],
    modelVersion: "browser-fallback-0.1",
    dataset: "Browser fallback heuristic",
    datasetStatus: "offline_fallback",
    topFeatures: factors.map((factor) => ({ feature: factor.replace("Detected keyword: ", ""), direction: "raises risk", weight: 8 })),
    fallback: true,
    model: {
      predictedClass: state,
      probabilities,
      disclaimer: "This offline estimate is for general guidance only, not a diagnosis."
    }
  };
}

function StateBadge({ state }: { state: HealthState | "Not assessed" }) {
  return <span className={`state-badge ${stateClass(state)}`}>{state}</span>;
}

function ScoreRing({ score, label, state, suffix = "" }: { score: number; label: string; state?: HealthState; suffix?: string }) {
  const angle = `${safeScore(score) * 3.6}deg`;
  return (
    <div className={`score-ring ${state ? stateClass(state) : ""}`} style={{ "--angle": angle } as React.CSSProperties}>
      <div>
        <strong>{safeScore(score)}{suffix}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function Panel({ title, kicker, children, action }: { title: string; kicker?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          {kicker ? <span className="kicker">{kicker}</span> : null}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ActionButton({
  children,
  icon,
  onClick,
  type = "button",
  variant = "primary",
  disabled
}: {
  children: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
}) {
  return (
    <button className={`button ${variant}`} onClick={onClick} type={type} disabled={disabled}>
      {icon}
      <span>{children}</span>
    </button>
  );
}

function appointmentMessageLabel(status?: string) {
  if (status === "accepted") return "SMS accepted by provider · delivery not confirmed";
  if (status === "queued_for_phone") return "Waiting for the paired Android phone · open VITAL Companion and allow SMS permission";
  if (status === "phone_sending") return "Android is submitting this SMS via the SIM · carrier delivery is not confirmed";
  if (status === "submitted-by-phone") return "Submitted by Android through the SIM · carrier delivery is not confirmed";
  if (status === "phone-send-failed") return "Android could not submit the SMS · check permission and SIM service";
  if (status === "not_configured") return "Not sent · SMS service is not configured";
  if (status === "invalid_number") return "Not sent · add a valid number with country code";
  if (status === "unavailable") return "Not sent · SMS provider could not accept the message; check its connection and account settings";
  if (status === "provider_rejected") return "Not sent · the configured Twilio sender is not listed as an SMS-capable number on this account. Set VITAL_TWILIO_FROM_NUMBER to a sender assigned to this account; Trial accounts also require verified recipients.";
  if (status === "backend_unavailable") return "Not sent · VITAL backend could not save or send messages";
  return "Unknown · backend returned no SMS status; check before retrying";
}

function smsDeliveryLabel(status: string) {
  if (status === "delivered") return "Delivered to handset";
  if (status === "sent") return "Sent to carrier · awaiting delivery receipt";
  if (["queued", "accepted", "sending", "scheduled"].includes(status)) return "Accepted by Twilio · in progress";
  if (["undelivered", "failed", "canceled"].includes(status)) return "Failed · not delivered";
  if (status === "not_configured") return "Not sent · Twilio is not configured";
  if (status === "queued-for-phone") return "Queued for paired phone SIM";
  if (status === "submitted-by-phone") return "Submitted by phone · carrier delivery unconfirmed";
  if (status === "phone-send-failed") return "Phone could not submit SMS";
  return status.replace(/-/g, " ");
}

function appointmentIdentity(appointment: Appointment) {
  return [
    appointment.patient,
    appointment.hospitalId || appointment.hospitalName,
    appointment.department,
    appointment.date,
    appointment.time
  ].map((value) => String(value || "").trim().toLocaleLowerCase()).join("|");
}

function dedupeAppointments(appointments: Appointment[]) {
  const seen = new Set<string>();
  return appointments.filter((appointment) => {
    const key = appointmentIdentity(appointment);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function upsertAppointment(appointments: Appointment[], saved: Appointment) {
  const key = appointmentIdentity(saved);
  const matching = appointments.find((appointment) => appointmentIdentity(appointment) === key);
  return dedupeAppointments([{ ...matching, ...saved, id: saved.id || matching?.id }, ...appointments]);
}

function ThemeSwitcher({ palette, setPalette }: { palette: PaletteId; setPalette: (palette: PaletteId) => void }) {
  const selected = palettes.find((item) => item.id === palette) || palettes[0];
  return (
    <label className="theme-switcher" title="Switch visual theme">
      <span>Theme</span>
      <select value={palette} onChange={(event) => setPalette(event.target.value as PaletteId)}>
        {palettes.map((item) => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </select>
      <i aria-hidden="true">
        {selected.swatches.map((color) => (
          <b key={color} style={{ background: color }} />
        ))}
      </i>
    </label>
  );
}

function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let active = true;
    fetchAuthSession()
      .then(({ authenticated, user }) => {
        if (!active) return;
        if (authenticated && user) {
          window.localStorage.setItem("vital.auth.userId", user.id);
          setAuthUser(user);
        } else {
          window.localStorage.removeItem("vital.auth.userId");
        }
        setAuthReady(true);
      })
      .catch(() => {
        if (!active) return;
        setAuthError("VITAL could not reach its local security service. Start the VITAL launcher and retry.");
        setAuthReady(true);
      });
    return () => { active = false; };
  }, []);

  function acceptAuth(user: AuthUser) {
    if (!window.localStorage.getItem("vital.auth.legacyMigrated")) window.localStorage.setItem("vital.auth.legacyMigrated", user.id);
    window.localStorage.setItem("vital.auth.userId", user.id);
    setAuthError("");
    setAuthUser(user);
  }

  async function signOut() {
    try { await logoutAccount(); } finally {
      window.localStorage.removeItem("vital.auth.userId");
      setAuthUser(null);
    }
  }

  if (!authReady) return <AuthLoading error="" onRetry={() => window.location.reload()} />;
  if (!authUser) return <AuthScreen onAuthenticated={acceptAuth} initialError={authError} />;
  return <VitalDashboard authUser={authUser} onLogout={() => void signOut()} />;
}

function AuthLoading({ error, onRetry }: { error: string; onRetry: () => void }) {
  return <main className="auth-screen"><section className="auth-card"><div className="auth-brand"><span><HeartPulse /></span><div><strong>VITAL</strong><small>Personal health, protected</small></div></div><div className="auth-loading"><span className="auth-spinner" /><p>{error || "Checking your secure session…"}</p>{error ? <button type="button" onClick={onRetry}>Try again</button> : null}</div></section></main>;
}

function AuthScreen({ onAuthenticated, initialError }: { onAuthenticated: (user: AuthUser) => void; initialError: string }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = mode === "register" ? await registerAccount(email, password) : await loginAccount(email, password);
      onAuthenticated(result.user);
    } catch (cause) {
      setError(cause instanceof TypeError
        ? "VITAL’s local sign-in service is unreachable. Start VITAL on the computer and retry; your password was not sent."
        : cause instanceof Error ? cause.message : "Could not complete sign in. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-screen">
    <div className="auth-glow auth-glow-one" /><div className="auth-glow auth-glow-two" />
    <section className="auth-card">
      <div className="auth-brand"><span><HeartPulse /></span><div><strong>VITAL</strong><small>Your health, all in one place</small></div></div>
      <div className="auth-welcome"><span className="auth-eyebrow">PRIVATE HEALTH SPACE</span><h1>{mode === "register" ? "Create your account" : "Welcome back"}</h1><p>{mode === "register" ? "Register once to keep your health activity under your account on this device." : "Sign in once. VITAL will remember this device for your next visit."}</p></div>
      <form className="auth-form" onSubmit={(event) => void submit(event)}>
        <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required maxLength={254} placeholder="you@example.com" /></label>
        <label>Password<span className="auth-password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={mode === "register" ? 10 : 1} maxLength={128} placeholder={mode === "register" ? "At least 10 characters" : "Enter your password"} /><button type="button" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button></span>{mode === "register" ? <small>Use 10 or more characters. VITAL stores a salted password hash, never the original password.</small> : null}</label>
        {error ? <p className="auth-error" role="alert">{error}</p> : null}
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "register" ? "Create secure account" : "Sign in"}<KeyRound /></button>
      </form>
      <p className="auth-switch">{mode === "register" ? "Already registered?" : "First time using VITAL?"}<button type="button" onClick={() => { setError(""); setMode(mode === "register" ? "login" : "register"); }}>{mode === "register" ? "Sign in" : "Create an account"}</button></p>
      <p className="auth-footnote">This local demo remembers your sign-in on this browser for up to one year. Use a private device only if it is yours.</p>
    </section>
  </main>;
}

function VitalDashboard({ authUser, onLogout }: { authUser: AuthUser; onLogout: () => void }) {
  const [tab, setTab] = useState<TabId>("dashboard");
  const activePage = tabs.find((item) => item.id === tab) ?? tabs[0];
  const [cameraConsentConfirmed, setCameraConsentConfirmed] = useState(false);
  const [phoneConnectPromptOpen, setPhoneConnectPromptOpen] = useState(false);
  const [phoneCameraStatus, setPhoneCameraStatus] = useState<Awaited<ReturnType<typeof fetchPhoneCameraStatus>> | null>(null);
  const [pendingFallAlerts, setPendingFallAlerts] = useState<PossibleFallAlert[]>([]);
  const [guidedDemoStep, setGuidedDemoStep] = useState<number | null>(null);
  const [palette, setPalette] = useStoredState<PaletteId>("vital.theme", defaultPalette);
  const [accessibility, setAccessibility] = useStoredState("vital.accessibility.v1", { largeText: false, highContrast: false });
  const [preferences, setPreferences] = useStoredState("vital.preferences.v1", { medicationReminders: true, medicationReminderLeadMinutes: 10, caretakerAlerts: true, caretakerDoseSms: false, patientDoseSms: false, dailyHealthTipSms: false, healthTipTime: "09:00", patientDoseWhatsApp: false, emergencyCountdown: 10, demoMode: true, shareWearableContext: true });
  const [profile, setProfile] = useStoredState<PatientProfile>("vital.profile", demoProfile);
  const [triage, setTriage] = useStoredState<TriageResponse>("vital.triage.v2", baselineTriage);
  const [symptoms, setSymptoms] = useStoredState("vital.symptoms", "");
  const [triageVitals, setTriageVitals] = useStoredState<TriageVitals>("vital.triage.vitals.v2", {
    spo2: "", pulse: "", temperature: "", systolicBp: "", respiration: ""
  });
  const [triageRequestState, setTriageRequestState] = useState<"idle" | "loading" | "ready" | "unavailable">(() => hasTriageResult(triage) ? "ready" : "idle");
  const [triageError, setTriageError] = useState("");
  const [medicationLogs, setMedicationLogs] = useStoredState<MedicationLog[]>("vital.medicationLogs", seedMedicationLogs);
  const [patientTimeline, setPatientTimeline] =
  useStoredState<PatientTimelineEvent[]>(
    "vital.patientTimeline",
    seedPatientTimeline
  );
  const [voiceTranscript, setVoiceTranscript] = useStoredState("vital.voiceTranscript", "I feel okay, just a little tired today.");
  const [voiceDistress, setVoiceDistress] = useStoredState("vital.voiceDistress", false);
  const [appointments, setAppointments] = useStoredState<Appointment[]>("vital.appointments", []);
  useEffect(() => {
    const unique = dedupeAppointments(appointments);
    if (unique.length !== appointments.length) setAppointments(unique);
  }, [appointments, setAppointments]);
  useEffect(() => {
    const seededMedicationIds = new Set(["med-1", "med-2", "med-3"]);
    const seededTimelineIds = new Set(["timeline-1", "timeline-2", "timeline-3", "timeline-4", "timeline-5"]);
    setMedicationLogs((current) => current.filter((entry) => !seededMedicationIds.has(entry.id)));
    setPatientTimeline((current) => current.filter((entry) => !seededTimelineIds.has(entry.id)));
    setSymptoms((current) => current === "mild headache, normal breathing, took medicine" ? "" : current);
    // Remove the exact synthetic profile visible in older demo screenshots if
    // it was persisted locally. Do not clear other profile data that may have
    // been entered by the user.
    setProfile((current) => current.name === "Seethalakshmi"
      && current.age === 99
      && current.condition === "Diabetes + hypertension monitoring"
      && current.location === "Mahalakshmipuram, Bengaluru"
      && current.caretaker === "Primary Caretaker"
      ? demoProfile
      : current);
    setProfile((current) => current.name === "Demo Patient"
      && current.age === 58
      && current.condition === "Diabetes + hypertension monitoring"
      && current.caretakerPhone === "+91 98765 43210"
      ? demoProfile
      : current);
  }, [setMedicationLogs, setPatientTimeline, setProfile, setSymptoms]);
  const [incident, setIncident] = useStoredState<Incident | null>("vital.incident", null);
  const [autoEmergencyTrigger, setAutoEmergencyTrigger] = useState(0);
  const voiceDistressActiveRef = useRef(false);
  const [prescriptionText, setPrescriptionText] = useStoredState("vital.prescriptionText", "");
  const [prescriptionPlan, setPrescriptionPlan] = useStoredState<PrescriptionPlan | null>("vital.prescriptionPlan", null);
  useEffect(() => {
    if (prescriptionText === "Metformin 500 mg twice daily after food. Amlodipine 5 mg every morning.") setPrescriptionText("");
  }, [prescriptionText, setPrescriptionText]);
  const [hospitals, setHospitals] = useState<Hospital[]>(fallbackHospitals);
  const [wearable, setWearable] = useState<WearableSummary | null>(null);
  const [referenceImages, setReferenceImages] = useState<MedicationReferenceImage[]>([]);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [lastEvent, setLastEvent] = useState("Your health dashboard is ready");
  const [doseReminderNotice, setDoseReminderNotice] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(() => typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  const [caretakerSmsStatus, setCaretakerSmsStatus] = useState<{ smsConfigured: boolean; enabled: boolean; patientSmsEnabled: boolean; dailyHealthTipSms?: boolean; healthTipTime?: string; lastHealthTipAt?: string | null; lastHealthTipError?: string | null; whatsappConfigured: boolean; whatsappEnabled: boolean; scheduleSaved?: boolean; doseCount?: number; lastSentAt?: string | null; lastError?: string | null }>({ smsConfigured: false, enabled: false, patientSmsEnabled: false, whatsappConfigured: false, whatsappEnabled: false, dailyHealthTipSms: false, healthTipTime: "09:00", scheduleSaved: false, doseCount: 0 });

  useEffect(() => {
    if (tab !== "dashboard") {
      setPhoneConnectPromptOpen(false);
      return;
    }
    let active = true;
    void fetchPhoneCameraStream()
      .then((status) => { if (active) setPhoneConnectPromptOpen(!status.paired); })
      .catch(() => { if (active) setPhoneConnectPromptOpen(false); });
    return () => { active = false; };
  }, [tab]);

  // Keep fall status visible throughout the dashboard, not only while the
  // Camera check page is selected. The phone's local YOLO analysis remains
  // authoritative; stale or inactive camera status must never raise an alert.
  useEffect(() => {
    let active = true;
    const refreshFallStatus = async () => {
      try {
        const status = await fetchPhoneCameraStatus();
        const fresh = status.poseStatusAt != null
          && Date.now() / 1000 - status.poseStatusAt >= 0
          && Date.now() / 1000 - status.poseStatusAt <= 8;
        if (active) setPhoneCameraStatus(status);
      } catch {
        if (active) setPhoneCameraStatus(null);
      }
    };
    void refreshFallStatus();
    const timer = window.setInterval(() => void refreshFallStatus(), 1600);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    let active = true;
    const refreshPendingFallAlerts = async () => {
      try {
        const incidents = await fetchEmergencyIncidents();
        if (active) setPendingFallAlerts(incidents.filter((item): item is PossibleFallAlert => "kind" in item && item.kind === "possible-fall" && !item.acknowledgement));
      } catch {
        // The dashboard still works when incident history is unavailable.
      }
    };
    void refreshPendingFallAlerts();
    const timer = window.setInterval(() => void refreshPendingFallAlerts(), 10_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const livePoseFresh = phoneCameraStatus?.poseStatusAt != null
    && Date.now() / 1000 - phoneCameraStatus.poseStatusAt >= 0
    && Date.now() / 1000 - phoneCameraStatus.poseStatusAt <= 8;
  const livePossibleFall = phoneCameraStatus?.active === true && livePoseFresh && phoneCameraStatus.poseStatus === "possible-fall";
  const lastCameraFrameAge = phoneCameraStatus?.lastFrameAt != null ? Date.now() / 1000 - phoneCameraStatus.lastFrameAt : null;
  const cameraFrameFresh = phoneCameraStatus?.active === true && lastCameraFrameAge != null && lastCameraFrameAge >= 0 && lastCameraFrameAge <= 10;
  const phoneConnectionLabel = !phoneCameraStatus ? "Phone status unavailable"
    : !phoneCameraStatus.paired ? "Phone not paired"
    : cameraFrameFresh ? `Camera live · ${Math.max(1, Math.floor(lastCameraFrameAge!))}s ago`
    : phoneCameraStatus.active ? "Camera feed stale"
    : "Phone paired · Camera off";

  useEffect(() => {
    let active = true;
    void fetchMedicationReminderStatus().then((status) => { if (active) setCaretakerSmsStatus(status); }).catch(() => { if (active) setCaretakerSmsStatus({ smsConfigured: false, enabled: false, patientSmsEnabled: false, whatsappConfigured: false, whatsappEnabled: false, scheduleSaved: false, doseCount: 0, lastError: "VITAL backend is unavailable." }); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const refreshWearable = async () => {
      try {
        const summary = await fetchWearableSummary();
        if (active) setWearable(summary);
      } catch { /* Keep the last successful wearable snapshot visible during a brief disconnect. */ }
    };
    const timer = window.setInterval(() => void refreshWearable(), 15_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    const metrics = wearable?.latest?.metrics;
    if (!metrics) return;
    setTriageVitals((current) => ({
      ...current,
      ...(metrics.spo2Percent != null ? { spo2: String(metrics.spo2Percent) } : {}),
      ...(metrics.heartRateBpm != null ? { pulse: String(metrics.heartRateBpm) } : {}),
      ...(metrics.temperatureF != null ? { temperature: String(metrics.temperatureF) } : {}),
      ...(metrics.systolicBp != null ? { systolicBp: String(metrics.systolicBp) } : {}),
      ...(metrics.respirationPerMinute != null ? { respiration: String(metrics.respirationPerMinute) } : {}),
    }));
  }, [wearable?.latest?.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void syncMedicationReminderSchedule({
        enabled: Boolean(prescriptionPlan?.humanReviewed && preferences.caretakerDoseSms),
        patientSmsEnabled: Boolean(prescriptionPlan?.humanReviewed && preferences.patientDoseSms),
        dailyHealthTipSms: Boolean(preferences.dailyHealthTipSms),
        healthTipTime: preferences.healthTipTime || "09:00",
        whatsappEnabled: false,
        phone: profile.caretakerPhone.replace(/[\s()-]/g, ""),
        patientPhone: (profile.patientPhone || "").replace(/[\s()-]/g, ""),
        patientName: profile.name,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        utcOffsetMinutes: -new Date().getTimezoneOffset(),
        doses: prescriptionPlan?.humanReviewed ? prescriptionPlan.doses.map(({ medication, dose, time }) => ({ medication, dose, time })) : []
      }).then(setCaretakerSmsStatus).catch((error: unknown) => {
        setCaretakerSmsStatus((current) => ({ ...current, lastError: error instanceof Error ? error.message : "Could not sync the medication reminder schedule." }));
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [prescriptionPlan, preferences.caretakerDoseSms, preferences.patientDoseSms, preferences.dailyHealthTipSms, preferences.healthTipTime, profile.caretakerPhone, profile.patientPhone, profile.name]);

  useEffect(() => {
    if (!preferences.medicationReminders || !prescriptionPlan?.humanReviewed || !prescriptionPlan.doses.length) return;
    const checkDoseReminders = () => {
      const now = new Date();
      const todayKey = localDateInputValue(now);
      const leadMinutes = preferences.medicationReminderLeadMinutes === 5 ? 5 : 10;
      const messages: string[] = [];
      prescriptionPlan.doses.forEach((dose) => {
        const match = dose.time.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
        if (!match) return;
        const target = new Date(now);
        target.setHours(Number(match[1]), Number(match[2]), 0, 0);
        const untilDose = target.getTime() - now.getTime();
        if (untilDose <= 0 || untilDose > leadMinutes * 60_000) return;
        const reminderKey = `vital.doseReminder.${todayKey}.${medicationDoseKey(dose)}`;
        const accountReminderKey = accountStorageKey(reminderKey);
        if (window.localStorage.getItem(accountReminderKey)) return;
        window.localStorage.setItem(accountReminderKey, new Date().toISOString());
        const message = `It’s almost time for ${dose.medication} (${dose.dose}), scheduled for ${dose.time}. Please follow your prescription.`;
        messages.push(message);
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          const notification = new Notification("Medicine reminder", { body: message, tag: reminderKey });
          window.setTimeout(() => notification.close(), 15_000);
        }
        const event: PatientTimelineEvent = {
          id: `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
          eventType: "medication",
          title: "Dose reminder sent",
          detail: `${dose.medication} · ${dose.dose} · scheduled for ${dose.time}; reminder shown ${leadMinutes} minutes beforehand.`,
          status: "Reminder"
        };
        setPatientTimeline((current) => [event, ...current].slice(0, 50));
      });
      if (messages.length) setDoseReminderNotice(messages.join(" "));
    };
    checkDoseReminders();
    const interval = window.setInterval(checkDoseReminders, 15_000);
    return () => window.clearInterval(interval);
  }, [preferences.medicationReminders, preferences.medicationReminderLeadMinutes, prescriptionPlan, setPatientTimeline]);

  async function enableDoseNotifications() {
    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  }

  function startGuidedDemo() {
    setGuidedDemoStep(0);
    setTab(guidedDemoSteps[0].tab);
  }

  function moveGuidedDemo(step: number) {
    if (step < 0) return;
    if (step >= guidedDemoSteps.length) {
      setGuidedDemoStep(null);
      return;
    }
    setGuidedDemoStep(step);
    setTab(guidedDemoSteps[step].tab);
  }

  function addTimelineEvent(
    eventType: PatientTimelineEvent["eventType"],
    title: string,
    detail: string,
    status?: string
  ) {
    const event: PatientTimelineEvent = {
      id: `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      eventType,
      title,
      detail,
      status
    };

    setPatientTimeline((current) => [event, ...current].slice(0, 50));
  }

  const medicationScore = useMemo(() => {
    const completed = medicationLogs.filter((log) => log.status === "Verified").length;
    const adherenceEvents = medicationLogs.filter((log) => log.status !== "Photo checked").length;
    return safeScore(adherenceEvents ? (completed / adherenceEvents) * 100 : 0);
  }, [medicationLogs]);
  const triageAssessed = hasTriageResult(triage);

  useEffect(() => {
    Promise.all([fetchHealth(), fetchHospitals(), fetchWearableSummary().catch(() => null)])
      .then(([, hospitalPayload, wearablePayload]) => {
        setApiStatus("online");
        setHospitals(hospitalPayload);
        setWearable(wearablePayload);
      })
      .catch(() => {
        setApiStatus("offline");
        setHospitals(fallbackHospitals);
      });
  }, []);

  useEffect(() => {
    let active = true;
    const syncAndroidDoseResponses = async () => {
      try {
        const { events } = await fetchAutomationEvents();
        if (!active) return;
        const responses: PatientTimelineEvent[] = events
          .filter((event) => event.eventType === "medication-dose-response")
          .map((event) => {
            const payload = event.payload || {};
            const medication = String(payload.medication || "Scheduled medicine");
            const dose = String(payload.dose || "").trim();
            const scheduledTime = String(payload.scheduledTime || "scheduled time");
            const action = payload.action === "patient-reported-taken" ? "taken" : "snoozed";
            const isTaken = action === "taken";
            return {
              id: event.id || `android-dose-${String(payload.actionId || "")}`,
              createdAt: event.createdAt || new Date().toISOString(),
              eventType: "medication" as const,
              title: isTaken ? `${medication} ${dose} marked taken` : `${medication} reminder snoozed`,
              detail: isTaken
                ? `${medication} ${dose} scheduled for ${scheduledTime}: patient reported taking this dose from the Android reminder. This report does not confirm ingestion.`
                : `${medication} ${dose} scheduled for ${scheduledTime}: patient snoozed the Android reminder for 10 minutes.`,
              status: isTaken ? "Patient reported" : "Snoozed 10 min"
            };
          });
        if (responses.length) {
          setPatientTimeline((current) => {
            const existing = new Set(current.map((event) => event.id));
            const unseen = responses.filter((event) => !existing.has(event.id));
            if (!unseen.length) return current;
            return [...current, ...unseen]
              .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
              .slice(0, 50);
          });
        }
      } catch {
        // Android dose responses will be picked up on the next successful sync.
      }
    };
    void syncAndroidDoseResponses();
    const timer = window.setInterval(() => void syncAndroidDoseResponses(), 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [setPatientTimeline]);

  async function runTriage(input = symptoms) {
    const vitalValues = Object.fromEntries(
      Object.entries(triageVitals).map(([key, value]) => [key, Number(value)])
    ) as Record<keyof TriageVitals, number>;
  if (!input.trim()) {
      setTriageError("Add a short description before requesting a care route.");
      return;
  }
    if (!Number.isInteger(profile.age) || profile.age < 1 || profile.age > 120) {
      setTriageError("Enter the patient's age (1–120) in Settings before requesting an estimate.");
      return;
    }
    if (Object.values(triageVitals).some((value) => value.trim() === "") || !Object.values(vitalValues).every(Number.isFinite)) {
      setTriageError("Enter a value for each vital reading, or choose an example below.");
      return;
    }
    const vitalRanges: Array<[keyof TriageVitals, number, number, string]> = [
      ["spo2", 50, 100, "SpO₂"],
      ["pulse", 20, 240, "Pulse"],
      ["temperature", 80, 115, "Temperature"],
      ["systolicBp", 50, 260, "Systolic blood pressure"],
      ["respiration", 4, 80, "Respiration rate"]
    ];
    const invalidVital = vitalRanges.find(([key, minimum, maximum]) =>
      vitalValues[key] < minimum || vitalValues[key] > maximum
    );
    if (invalidVital) {
      const [key, minimum, maximum, label] = invalidVital;
      setTriageError(`${label} must be between ${minimum} and ${maximum}. Check the reading and units.`);
      return;
    }
    setTriageError("");
    setTriageRequestState("loading");
    const payload: TriagePayload = {
      symptoms: input,
      ...(medicationLogs.length ? { medicationScore } : {}),
      voiceDistress,
      age: profile.age,
      vitals: {
        spo2: vitalValues.spo2,
        pulse: vitalValues.pulse,
        temperature: vitalValues.temperature,
        systolicBp: vitalValues.systolicBp,
        respiration: vitalValues.respiration
      }
    };
    try {
      const result = await postTriage(payload);
      setTriage(result);
setTriageRequestState("ready");

if (result.state === "Emergency") {
  setTab("emergency");
  setAutoEmergencyTrigger((current) => current + 1);
}

setLastEvent(`Screening estimate recorded: ${result.state} (${result.score}/100)`);

addTimelineEvent(
  "triage",
  "Screening estimate recorded",
  `The submitted symptoms and readings produced an estimate of ${result.score}/100.`,
  result.state
);
    } catch {
      setTriageRequestState("unavailable");
      setTriageError("The local triage service did not respond. No score was generated; check the API and retry.");
      setLastEvent("Triage service unavailable — no fallback score shown");
    }
  }

  function applyScenario(text: string) {
    setSymptoms(text);
    void runTriage(text);
  }

  function markMedication(status: MedicationLog["status"], confidence: number, label = "Live camera dose", doseKey?: string) {
    const todayKey = localDateInputValue(new Date());
    if (doseKey && medicationLogs.some((log) => log.dateKey === todayKey && log.doseKey === doseKey && log.status === status)) return;
    const next: MedicationLog = {
      id: `med-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      label,
      status,
      confidence,
      dateKey: todayKey,
      doseKey
    };
    setMedicationLogs([next, ...medicationLogs]);

setLastEvent(status === "Photo checked"
  ? `Prescription-specific visual similarity check recorded (${confidence}%)`
  : `Medication ${status.toLowerCase()} recorded`);

addTimelineEvent(
  "medication",
  label,
  status === "Photo checked"
    ? `Camera frame similarity to the locally enrolled reference views: ${confidence}%. Appearance similarity is not pill identity and does not confirm ingestion.`
    : `Medication check recorded with ${confidence}% confidence.`,
  status
);
  }

  function updatePrescriptionDoseTime(index: number, time: string) {
    updatePrescriptionDose(index, "time", time);
  }

  function updatePrescriptionDose(index: number, field: keyof PrescriptionDose, value: string) {
    if (!prescriptionPlan) return;
    const priorDose = prescriptionPlan.doses[index];
    if (!priorDose) return;
    const oldKey = medicationDoseKey(priorDose);
    const updatedDoses = prescriptionPlan.doses.map((dose, doseIndex) => doseIndex === index ? { ...dose, [field]: value } : dose);
    const updatedDose = updatedDoses[index];
    const newKey = medicationDoseKey(updatedDose);
    setPrescriptionPlan({ ...prescriptionPlan, humanReviewed: false, doses: updatedDoses });
    if (oldKey !== newKey) {
      setMedicationLogs((logs) => logs.map((log) => log.doseKey === oldKey ? { ...log, doseKey: newKey } : log));
    }
  }

  async function analyzePrescription(text = prescriptionText) {
    try {
      const plan = await parsePrescription(text, "VITAL medication tab");
      setPrescriptionPlan({ ...plan, humanReviewed: false });
      addTimelineEvent(
  "prescription",
  "Prescription analyzed",
  `${plan.doses.length} medication dose(s) extracted using ${plan.engine}.`,
  plan.requiresReview ? "Review required" : "Processed"
);
      const medicines = [...new Set(plan.doses.map((dose) => dose.medication).filter(Boolean))];
      const refPayloads = await Promise.all(medicines.map((medicine) => fetchMedicationReferenceImages(medicine).catch(() => null)));
      setReferenceImages(refPayloads.flatMap((payload) => payload?.images || []));
      setLastEvent(`Prescription schedule parsed using ${plan.engine}`);
    } catch {
      const fallback = { ...localPrescriptionFallback(text), humanReviewed: false };
      setPrescriptionPlan(fallback);
      setLastEvent(`Prescription parsed with browser fallback · ${fallback.doses[0]?.medication || "review needed"}`);
    }
  }

  async function saveAppointment(appointment: Appointment): Promise<Appointment> {
    try {
      const saved = await postAppointment({ ...appointment, patientPhone: profile.patientPhone, caretakerPhone: profile.caretakerPhone });
      setAppointments((current) => upsertAppointment(current, saved));

setLastEvent(
  `Visit reminder saved for ${appointment.hospitalName}`
);

addTimelineEvent(
  "appointment",
  "Visit reminder saved",
  `${appointment.hospitalName} · ${appointment.department} · ${appointment.date} ${appointment.time}`,
      "Reminder saved"
);
      return saved;
    } catch {
      const saved = { ...appointment, id: `APT-${Date.now()}`, status: "Saved in this browser only", notifications: { patient: "backend_unavailable" as const, caretaker: "backend_unavailable" as const } };
      setAppointments((current) => upsertAppointment(current, saved));
      setLastEvent(`Visit reminder saved for ${appointment.hospitalName}`);
      return saved;
    }
  }

  async function createIncident() {
    const hospital = hospitals[0];
    const incidentState: HealthState = voiceDistress ? "Emergency" : triage.state;
    const incidentScore = voiceDistress ? Math.max(82, triage.score) : triage.score;
    const payload = {
      state: incidentState,
      score: incidentScore,
      patient: profile.name,
      hospital,
      caretakerAlerts: preferences.caretakerAlerts
    };
    try {
      const saved = await postIncident(payload);
      setIncident(saved);
      addTimelineEvent(
  "emergency",
  "Emergency help flow recorded",
  `${saved.hospital.name} listed as a nearby option. VITAL did not contact the hospital or your caretaker.`,
  "Recorded"
);
      setLastEvent("Emergency help flow recorded");
    } catch {
      const saved: Incident = {
        id: `EMG-${Date.now().toString().slice(-6)}`,
        state: incidentState,
        score: incidentScore,
        patient: profile.name,
        hospital,
        message: "No emergency services were contacted. Use the call or message options to reach help.",
        timeline: [
          { time: "00:00", label: "Emergency warning recorded" },
          { time: "00:02", label: preferences.caretakerAlerts ? "Caretaker message link prepared; no message was sent" : "Caretaker message was not prepared because alerts are disabled" },
          { time: "00:05", label: `Nearby hospital option: ${hospital.name} — call to confirm` },
          { time: "00:10", label: "Practice countdown ended; no call was placed" },
          { time: "00:12", label: "Emergency activity saved in VITAL" }
        ]
      };
      setIncident(saved);
      addTimelineEvent(
  "emergency",
  "Emergency help flow recorded",
  `${saved.hospital.name} listed as a nearby option. VITAL did not contact the hospital or your caretaker.`,
  "Recorded"
);
      setLastEvent("Emergency help flow recorded");
    }
  }

  async function refreshWearableSummary() {
    try {
      const summary = await fetchWearableSummary();
      setWearable(summary);
      setLastEvent(summary.latest
        ? `Wearable data checked · VITAL last received a record ${new Date(summary.latest.receivedAt || summary.latest.observedAt).toLocaleString()}`
        : "No watch-sourced readings have reached VITAL yet");
    } catch {
      setLastEvent("Could not refresh wearable readings. Check that VITAL is online.");
    }
  }

  function restoreLocalBackup(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("This file is not a VITAL backup.");
    const backup = value as Record<string, unknown>;
    if (backup.format !== "VITAL local health data backup" || backup.version !== 1 || String(backup.accountEmail || "").toLowerCase() !== authUser.email.toLowerCase()) {
      throw new Error("This backup is unsupported or belongs to a different VITAL account.");
    }
    const data = backup.data;
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("The backup does not contain valid VITAL data.");
    const saved = data as Record<string, unknown>;
    const objectValue = (item: unknown) => item !== null && typeof item === "object" && !Array.isArray(item);
    const profileData = objectValue(saved.profile) ? saved.profile as Record<string, unknown> : {};
    const preferenceData = objectValue(saved.preferences) ? saved.preferences as Record<string, unknown> : {};
    const triageData = objectValue(saved.triage) ? saved.triage as Record<string, unknown> : {};
    const vitalData = objectValue(saved.triageVitals) ? saved.triageVitals as Record<string, unknown> : {};
    if (!objectValue(saved.profile) || !objectValue(saved.preferences) || !objectValue(saved.triage) || !objectValue(saved.triageVitals)
      || !Array.isArray(saved.medicationLogs) || !saved.medicationLogs.every(objectValue)
      || !Array.isArray(saved.appointments) || !saved.appointments.every(objectValue)
      || !Array.isArray(saved.patientTimeline) || !saved.patientTimeline.every(objectValue)
      || typeof saved.symptoms !== "string" || typeof saved.prescriptionText !== "string" || typeof saved.voiceTranscript !== "string"
      || typeof saved.voiceDistress !== "boolean" || !(saved.prescriptionPlan === null || objectValue(saved.prescriptionPlan))
      || !(saved.incident === null || objectValue(saved.incident)) || !palettes.some((item) => item.id === saved.palette)
      || typeof profileData.name !== "string" || typeof profileData.age !== "number"
      || typeof triageData.score !== "number" || typeof triageData.state !== "string"
      || typeof preferenceData.medicationReminders !== "boolean" || typeof preferenceData.caretakerAlerts !== "boolean"
      || typeof preferenceData.dailyHealthTipSms !== "boolean" || typeof preferenceData.healthTipTime !== "string"
      || !["spo2", "pulse", "temperature", "systolicBp", "respiration"].every((key) => typeof vitalData[key] === "string")) {
      throw new Error("The backup is incomplete or has an invalid data format.");
    }
    setProfile(saved.profile as PatientProfile);
    setPreferences(saved.preferences as typeof preferences);
    setTriage(saved.triage as TriageResponse);
    setSymptoms(saved.symptoms);
    setTriageVitals(saved.triageVitals as TriageVitals);
    setMedicationLogs(saved.medicationLogs as MedicationLog[]);
    setPrescriptionText(saved.prescriptionText);
    setPrescriptionPlan(saved.prescriptionPlan as PrescriptionPlan | null);
    setAppointments(saved.appointments as Appointment[]);
    setPatientTimeline(saved.patientTimeline as PatientTimelineEvent[]);
    setIncident(saved.incident as Incident | null);
    setVoiceTranscript(saved.voiceTranscript);
    setVoiceDistress(saved.voiceDistress);
    setPalette(saved.palette as PaletteId);
    setLastEvent("VITAL data restored from a local backup");
    return "Backup restored. Your VITAL data on this browser has been replaced with the selected backup.";
  }

  return (
    <div className="app" data-theme={palette} data-large-text={accessibility.largeText} data-high-contrast={accessibility.highContrast}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <HeartPulse />
          </div>
          <div>
            <strong>VITAL</strong>
            <span>Proactive Health Guardian</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="VITAL modules">
          {navigationGroups.map((group) => (
            <div className="nav-group" key={group}>
              <span className="nav-group-label">{group}</span>
              {tabs.filter((item) => item.group === group).map((item) => (
                <button
                  key={item.id}
                  className={tab === item.id ? "active" : ""}
                  onClick={() => setTab(item.id)}
                  type="button"
                  aria-current={tab === item.id ? "page" : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

      </aside>

      <main className="main" id="main-content" tabIndex={-1}>
        <header className="topbar">
          <div>
            <span className="session-label">{activePage.group}</span>
            <h1>{activePage.id === "dashboard" ? "Health overview" : activePage.label}</h1>
            <p>{pageDescriptions[activePage.id]}</p>
          </div>
          <div className="topbar-actions">
            <ThemeSwitcher palette={palette} setPalette={setPalette} />
            <StateBadge state={triageAssessed ? triage.state : "Not assessed"} />
            <span className={`api-status ${apiStatus}`} title="VITAL service connection; this does not indicate that a watch is connected">{apiStatus === "online" ? "Backend online" : apiStatus === "offline" ? "Backend offline" : "Connecting to backend"}</span>
            <button type="button" className={`api-status phone-connection-status ${cameraFrameFresh ? "online" : phoneCameraStatus?.paired ? "stale" : "offline"}`} onClick={() => setTab("phoneConnection")} aria-label={`${phoneConnectionLabel}. Open phone connection settings.`} title="Open phone connection settings">{phoneConnectionLabel}</button>
            <div className="account-menu"><span title={authUser.email}>{authUser.email}</span><button type="button" onClick={onLogout} aria-label="Sign out of VITAL"><LogOut /><span>Sign out</span></button></div>
          </div>
        </header>

        <div className="live-strip">
          <div>
            <Activity />
            <span>{lastEvent}</span>
          </div>
          <button onClick={() => triageAssessed ? void runTriage() : setTab("triage")} type="button">
            {triageAssessed ? <RefreshCw /> : <Stethoscope />}
            {triageAssessed ? "Recheck symptoms & readings" : "Enter symptoms & readings"}
          </button>
        </div>
        {livePossibleFall && tab !== "camera" ? <aside className="global-fall-alert" role="alert">
          <Ambulance aria-hidden="true" />
          <div><strong>Possible fall detected</strong><span>Check the person if safe. VITAL has not called emergency services.</span></div>
          <a href="tel:112"><PhoneCall /> Call 112</a>
          <button type="button" onClick={() => setTab("camera")}>View camera</button>
        </aside> : null}
        {doseReminderNotice ? <aside className="dose-reminder-alert" role="status" aria-live="assertive"><BellRing /><div><strong>Medicine reminder</strong><span>{doseReminderNotice}</span></div><button type="button" onClick={() => setDoseReminderNotice("")} aria-label="Dismiss medicine reminder">Dismiss</button></aside> : null}

        {guidedDemoStep !== null ? <GuidedDemoBar
          step={guidedDemoStep}
          onPrevious={() => moveGuidedDemo(guidedDemoStep - 1)}
          onNext={() => moveGuidedDemo(guidedDemoStep + 1)}
          onExit={() => setGuidedDemoStep(null)}
        /> : null}

        {tab === "dashboard" && phoneConnectPromptOpen ? <div className="phone-connect-prompt-backdrop">
          <section className="phone-connect-prompt" role="dialog" aria-modal="true" aria-labelledby="phone-connect-prompt-title" aria-describedby="phone-connect-prompt-description">
            <span className="phone-connect-prompt-icon"><Smartphone /></span>
            <h2 id="phone-connect-prompt-title">Phone not connected</h2>
            <p id="phone-connect-prompt-description">Connect the VITAL Android app to this computer to use phone camera monitoring and phone-based health sync.</p>
            <div className="phone-connect-prompt-actions">
              <button type="button" onClick={() => { setPhoneConnectPromptOpen(false); setTab("phoneConnection"); }}>Connect phone</button>
              <button type="button" className="secondary" onClick={() => setPhoneConnectPromptOpen(false)}>Maybe later</button>
            </div>
          </section>
        </div> : null}

        {tab === "dashboard" ? (
          <DashboardView
            profile={profile}
            triage={triage}
            hasTriageResult={triageAssessed}
            medicationScore={medicationScore}
            medicationLogCount={medicationLogs.length}
            hospitals={hospitals}
            appointments={appointments}
            wearable={wearable}
            phonePaired={phoneCameraStatus?.paired === true}
            cameraActive={phoneCameraStatus?.active === true}
            cameraFrameFresh={cameraFrameFresh}
            wearableStale={Boolean(wearable?.latest && (!Number.isFinite(Date.parse(wearable.latest.observedAt)) || Date.now() - Date.parse(wearable.latest.observedAt) > 24 * 60 * 60 * 1000))}
            prescriptionNeedsReview={Boolean(prescriptionPlan && !prescriptionPlan.humanReviewed)}
            pendingFallAlerts={pendingFallAlerts}
            patientTimeline={patientTimeline}
            setTab={setTab}
            onStartWalkthrough={startGuidedDemo}
          />
        ) : null}
        {tab === "triage" ? (
         <TriageView
  age={profile.age}
  symptoms={symptoms}
  hasTriageResult={triageAssessed}
  setSymptoms={setSymptoms}
  triage={triage}
  vitals={triageVitals}
  setVitals={setTriageVitals}
  watchReading={wearable?.latest || null}
  requestState={triageRequestState}
  error={triageError}
  setTriageRequestState={setTriageRequestState}
  setTriageError={setTriageError}
  runTriage={runTriage}
  applyScenario={applyScenario}
/>
        ) : null}
        {tab === "medication" ? (
          <MedicationView
            logs={medicationLogs}
            markMedication={markMedication}
            score={medicationScore}
            prescriptionText={prescriptionText}
            setPrescriptionText={setPrescriptionText}
            prescriptionPlan={prescriptionPlan}
            analyzePrescription={analyzePrescription}
            setPrescriptionReviewed={(reviewed) => setPrescriptionPlan((current) => current ? { ...current, humanReviewed: reviewed } : current)}
            updatePrescriptionDoseTime={updatePrescriptionDoseTime}
            updatePrescriptionDose={updatePrescriptionDose}
            onDoseTimeSaved={(dose, time) => addTimelineEvent("medication", "Medication time updated", `${dose.medication} · ${dose.dose} · scheduled for ${time}. Confirm this time against the prescription.`, "Schedule updated")}
            referenceImages={referenceImages}
          />
        ) : null}
        {tab === "photoScreening" ? <HealthPhotoScreeningView /> : null}
        {tab === "camera" ? <PhoneCameraView profile={profile} consentConfirmed={cameraConsentConfirmed} onConnectPhone={() => setTab("phoneConnection")} addTimelineEvent={addTimelineEvent} onEmergencyHelp={() => setTab("emergency")} /> : null}
        {tab === "phoneConnection" ? <PhoneConnectionView consentConfirmed={cameraConsentConfirmed} setConsentConfirmed={setCameraConsentConfirmed} addTimelineEvent={addTimelineEvent} /> : null}
        {tab === "voice" ? (
          <VoiceView
            transcript={voiceTranscript}
            setTranscript={setVoiceTranscript}
            distress={voiceDistress}
            setDistress={setVoiceDistress}
            checkRecorded={patientTimeline.some((event) => event.eventType === "voice")}
            onAnalyze={(distress, recordEvent = true) => {
  setVoiceDistress(distress);

  if (distress && !voiceDistressActiveRef.current) {
    setTab("emergency");
    setAutoEmergencyTrigger((current) => current + 1);
  }
  voiceDistressActiveRef.current = distress;

  if (recordEvent) {
    setLastEvent(
      distress
        ? "Voice distress flag activated"
        : "Voice check completed with no distress flag"
    );
    addTimelineEvent(
      "voice",
      "Voice distress check",
      distress
        ? "The voice/typed distress detector produced a distress flag."
        : "The voice/typed distress detector found no distress flag.",
      distress ? "Distress detected" : "No distress"
    );
  }
}}
          />
        ) : null}
        {tab === "emergency" ? (
          <EmergencyView triage={triage} symptoms={symptoms} hospitals={hospitals} profile={profile} incident={incident} createIncident={createIncident} countdownSeconds={preferences.emergencyCountdown} caretakerAlerts={preferences.caretakerAlerts} autoTriggerToken={autoEmergencyTrigger} addTimelineEvent={addTimelineEvent} />
        ) : null}
        {tab === "appointments" ? (
          <AppointmentView profile={profile} hospitals={hospitals} appointments={appointments} saveAppointment={saveAppointment} />
        ) : null}
        {tab === "wearables" ? (
          <WearableView wearable={wearable} refreshWearable={refreshWearableSummary} />
        ) : null}
        {tab === "analytics" ? (
          <AnalyticsView
  triage={triage}
  hasTriageResult={triageAssessed}
  medicationScore={medicationScore}
  medicationLogs={medicationLogs}
  voiceDistress={voiceDistress}
  appointments={appointments}
  patientTimeline={patientTimeline}
/>
        ) : null}
        {tab === "timeline" ? <TimelineView events={patientTimeline} /> : null}
        {tab === "settings" ? <SettingsView profile={profile} setProfile={setProfile} palette={palette} setPalette={setPalette} accessibility={accessibility} setAccessibility={setAccessibility} preferences={preferences} setPreferences={setPreferences} notificationPermission={notificationPermission} enableDoseNotifications={enableDoseNotifications} caretakerSmsStatus={caretakerSmsStatus} hasMedicationSchedule={Boolean(prescriptionPlan?.humanReviewed && prescriptionPlan.doses.some((dose) => /^([01]\d|2[0-3]):[0-5]\d$/.test(dose.time)))} accountEmail={authUser.email} backupData={{ profile, preferences, triage, symptoms, triageVitals, medicationLogs, prescriptionText, prescriptionPlan, appointments, patientTimeline, incident, voiceTranscript, voiceDistress, palette }} restoreBackup={restoreLocalBackup} /> : null}
        {tab === "export" ? (
          <ExportView
            profile={profile}
            triage={triage}
            medicationScore={medicationScore}
            appointments={appointments}
            incident={incident}
            voiceDistress={voiceDistress}
            prescriptionPlan={prescriptionPlan}
            medicationLogs={medicationLogs}
            patientTimeline={patientTimeline}
            wearable={wearable}
            symptoms={symptoms}
            vitals={triageVitals}
          />
        ) : null}
        <HealthNudge />
        <HealthAssistant
          age={profile.age}
          conditions={profile.condition}
          symptoms={symptoms}
          triage={triage}
          vitals={triageVitals}
          prescriptionPlan={prescriptionPlan}
          onEmergency={() => setTab("emergency")}
          onAppointment={() => setTab("appointments")}
        />
      </main>
    </div>
  );
}

type AssistantMessage = { id: number; role: "assistant" | "user"; text: string; mode?: string; urgent?: boolean; suggestions?: string[] };

function localAssistantFallback(question: string, context: { symptoms: string; triage: TriageResponse; vitals: TriageVitals; prescriptionPlan: PrescriptionPlan | null; previousQuestion?: string }): AssistantMessage {
  const text = question.toLowerCase();
  const urgent = /\b(chest pain|can't breathe|cannot breathe|difficulty breathing|shortness of breath|unconscious|not waking|face droop|slurred speech|severe bleeding|severe allergic reaction)\b/i;
  if (urgent.test(question) || urgent.test(context.symptoms)) {
    return { id: Date.now(), role: "assistant", urgent: true, mode: "safety guidance", text: "If this is happening now, call 112 in India or your local emergency number immediately. Do not wait for a chat reply. VITAL cannot contact emergency services." };
  }
  if (/^\s*(hi|hello|hey|hiya|good morning|good afternoon|good evening)\s*[!.?]*\s*$/i.test(question)) {
    return { id: Date.now(), role: "assistant", mode: "here to help", text: "Hi! 👋 What would you like help with? I can look at your VITAL result, readings, medicine schedule, or help you prepare for a doctor visit.", suggestions: ["Explain my triage result", "Show my latest readings", "Help me prepare for a doctor visit"] };
  }
  if (/\b(how are (you|u)|how r u|hru|how('s| is) it going|what('s| is) up|sup)\b/i.test(question)) {
    return { id: Date.now(), role: "assistant", mode: "here to help", text: "I’m doing well, thanks for asking! 🙂 How are you feeling today? Tell me what you’re experiencing and I can share general guidance, or choose a topic below.", suggestions: ["I have a fever", "Explain my triage result", "Show my latest readings"] };
  }
  if (/\b(help|what can you do|how can you help)\b/i.test(question)) {
    return { id: Date.now(), role: "assistant", mode: "here to help", text: "I can explain your latest VITAL result, summarize readings or your recorded medication schedule, share general fever information, and help you prepare questions for your clinician. Pick a topic below to get started.", suggestions: ["Explain my triage result", "What can I do about a fever?", "Help me prepare for a doctor visit"] };
  }
  if (/\b(thanks|thank you|that helps|got it)\b/i.test(question)) {
    return { id: Date.now(), role: "assistant", mode: "here to help", text: "You’re welcome. What else would you like to go over?", suggestions: ["Explain my triage result", "Show my latest readings", "Help me prepare for a doctor visit"] };
  }
  if (/\b(i feel|i'm feeling|im feeling|i am feeling|feeling)\b/i.test(question)) {
    return { id: Date.now(), role: "assistant", mode: "symptom check-in", text: "Thanks for telling me. What symptoms are you noticing, when did they start, and are they getting better or worse? I can share general next steps from what you describe, but I can’t diagnose you. If you have severe chest pain, trouble breathing, fainting, or heavy bleeding, call emergency services now.", suggestions: ["I have a fever", "Explain my triage result", "Show my latest readings"] };
  }
  if (/\b(what should i monitor|what do i monitor|what should i watch|what next|what should i do next)\b/i.test(question) && /\b(fever|feverish|high temperature)\b/i.test(context.previousQuestion || "")) {
    return { id: Date.now(), role: "assistant", mode: "fever follow-up", text: "Keep track of the temperature, when it started, how it changes, how much you are drinking, and any new symptoms. Rest and drink fluids. Contact a doctor if it is getting worse, not improving, or you are concerned. For a child, ask a clinician or pharmacist.", suggestions: ["When should I call a doctor?", "Help me prepare for a doctor visit"] };
  }
  if (/\b(fever|feverish|high temperature)\b/i.test(question)) {
    return { id: Date.now(), role: "assistant", mode: "health guidance", text: "For an adult with a fever, rest and drink plenty of fluids. If you are considering medicine, ask a pharmacist or clinician what is safe for you and follow the product label; I can’t select a medicine or dose. Contact a doctor if symptoms worsen, do not improve, or concern you. For a child, ask a pharmacist or clinician for age- and weight-appropriate advice.\n\nGeneral reference: https://www.nhs.uk/symptoms/fever-in-adults/", suggestions: ["What should I monitor?", "When should I call a doctor?"] };
  }
  if (/\b(medicine|medication|dose|missed dose|prescription|pill)\b/i.test(question)) {
    const schedule = context.prescriptionPlan?.doses.map((dose) => `${dose.medication} ${dose.dose} at ${dose.time}`).join("; ") || "No analyzed schedule is recorded.";
    return { id: Date.now(), role: "assistant", mode: "health guidance", text: `Medication schedule currently recorded in VITAL: ${schedule}. It may be incomplete, so check your prescription. I can’t decide or change a dose. Ask your pharmacist or prescriber if a dose was missed or instructions are unclear.`, suggestions: ["What should I ask my pharmacist?", "Help me prepare for a doctor visit"] };
  }
  if (/\b(appointment|doctor|clinic|visit|consult)\b/i.test(question)) {
    return { id: Date.now(), role: "assistant", mode: "care planning", text: "For your visit, bring your current medication list and recent readings, and note when symptoms began, what makes them better or worse, and any questions you want answered. You can save a visit reminder in VITAL; call the hospital to arrange and confirm the appointment.", suggestions: ["What should I bring?", "What questions should I ask?"] };
  }
  if (/\b(vital|pulse|heart rate|blood pressure|oxygen|spo2|sleep|steps|reading)\b/i.test(question)) {
    return { id: Date.now(), role: "assistant", mode: "your health data", text: `The latest readings entered in VITAL are: SpO₂ ${context.vitals.spo2}%, pulse ${context.vitals.pulse} bpm, temperature ${context.vitals.temperature} °F, systolic BP ${context.vitals.systolicBp} mmHg, respiration ${context.vitals.respiration}/min. These are context only and cannot diagnose or rule out a problem.`, suggestions: ["Explain my triage result", "What readings should I share with my doctor?"] };
  }
  if (/\b(triage|risk score|at-risk|emergency|normal|result)\b/i.test(question)) {
    const factors = context.triage.riskFactors.length ? context.triage.riskFactors.join(", ") : "no separate risk signals returned";
    const nextSteps = context.triage.recommendations.length ? context.triage.recommendations.join(" ") : "Review the care guidance shown with your result.";
    return { id: Date.now(), role: "assistant", mode: "health guidance", text: `Your latest VITAL result is ${context.triage.state} (${context.triage.score}/100). The recorded risk factors are: ${factors}. Suggested next steps: ${nextSteps} This is a limited signal, not a diagnosis, and it cannot rule out illness.`, suggestions: ["Show my latest readings", "Help me prepare for a doctor visit"] };
  }
  return { id: Date.now(), role: "assistant", mode: "offline help", text: `I’m not sure I understood “${question.slice(0, 100)}”. I can help with your VITAL result, readings, recorded medication schedule, or preparing for an appointment. Which would you like to explore?`, suggestions: ["Explain my triage result", "Show my latest readings", "Help me prepare for a doctor visit"] };
}

function HealthAssistant({ age, conditions, symptoms, triage, vitals, prescriptionPlan, onEmergency, onAppointment }: {
  age: number; conditions: string; symptoms: string; triage: TriageResponse; vitals: TriageVitals;
  prescriptionPlan: PrescriptionPlan | null; onEmergency: () => void; onAppointment: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [voiceRepliesEnabled, setVoiceRepliesEnabled] = useState(true);
  const [localAiStatus, setLocalAiStatus] = useState<LocalAiStatus | null>(null);
  const welcome: AssistantMessage = { id: 1, role: "assistant", mode: "here to help", text: "Hi! 👋 I’m VITAL’s health assistant. What would you like help with?", suggestions: ["Explain my triage result", "Show my latest readings", "Help me prepare for a doctor visit", "What can I do about a fever?"] };
  const [messages, setMessages] = useState<AssistantMessage[]>([welcome]);
  const listRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceTranscriptRef = useRef("");
  const voiceQuestionRef = useRef(false);
  const voiceRepliesEnabledRef = useRef(true);
  voiceRepliesEnabledRef.current = voiceRepliesEnabled;

  function stopSpeaking() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  function speakText(text: string) {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setVoiceStatus("Spoken replies are not supported by this browser. You can still read the text reply.");
      return;
    }
    stopSpeaking();
    const spokenText = text.replace(/https?:\/\/\S+/g, "link omitted").replace(/\s+/g, " ").trim();
    if (!spokenText) return;
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = "en-IN";
    const preferredVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("en-in"))
      ?? window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("en"));
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.onstart = () => setVoiceStatus("Speaking VITAL’s reply…");
    utterance.onend = () => setVoiceStatus("");
    utterance.onerror = () => setVoiceStatus("Could not play the spoken reply. Use the browser’s sound settings or read the text reply.");
    window.speechSynthesis.speak(utterance);
  }

  function stopVoiceInput() {
    voiceQuestionRef.current = false;
    try { recognitionRef.current?.stop(); } catch { /* It may still be setting up. */ }
    setListening(false);
  }

  async function startVoiceInput() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceStatus("Voice input is not supported in this browser. Use the text box or try a current version of Chrome or Edge.");
      return;
    }
    if (typeof window.isSecureContext === "boolean" && !window.isSecureContext) {
      setVoiceStatus("Microphone access requires a secure page. Open VITAL on this computer at localhost or use an HTTPS address.");
      return;
    }
    stopSpeaking();
    voiceTranscriptRef.current = "";
    voiceQuestionRef.current = true;
    setListening(true);
    setVoiceStatus("Preparing speech recognition…");
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.onstart = () => {
      setListening(true);
      setVoiceStatus("Listening… Speak your question, then pause.");
    };
    recognition.onresult = (event) => {
      const finalParts: string[] = [];
      const interimParts: string[] = [];
      Array.from(event.results).forEach((result) => {
        const transcript = result[0].transcript.trim();
        if (!transcript) return;
        (result.isFinal ? finalParts : interimParts).push(transcript);
      });
      const finalTranscript = finalParts.join(" ").trim();
      const combined = [finalTranscript, interimParts.join(" ").trim()].filter(Boolean).join(" ");
      voiceTranscriptRef.current = finalTranscript || combined;
      setDraft(combined);
      if (combined) setVoiceStatus("Speech recognized. Pause to send your question, or tap the microphone to stop.");
    };
    recognition.onerror = (event) => {
      voiceQuestionRef.current = false;
      setListening(false);
      const messages: Record<string, string> = {
        "not-allowed": "Microphone access was denied. Allow microphone access for VITAL in your browser settings, then try again.",
        "service-not-allowed": "The browser blocked speech recognition. Check browser permissions or type your question instead.",
        "no-speech": "No speech was detected. Check your microphone and try again.",
        "audio-capture": "No microphone was found. Connect or enable a microphone, then try again.",
        network: recognition.processLocally
          ? "On-device speech recognition could not start. Check that the English speech pack is installed, then retry; you can also use Windows voice typing (Win+H) or type your question."
          : "The browser speech service is unavailable. Check your connection; if it remains unavailable, use Windows voice typing (Win+H) or type your question.",
        aborted: "Voice input stopped. Tap the microphone to try again."
      };
      setVoiceStatus(messages[event.error] || `Voice input failed (${event.error}). You can type your question instead.`);
    };
    recognition.onend = () => {
      setListening(false);
      const question = voiceTranscriptRef.current.trim();
      if (voiceQuestionRef.current && question) {
        voiceQuestionRef.current = false;
        setVoiceStatus("Sending your spoken question…");
        void submitQuestion(question, true);
      } else if (voiceQuestionRef.current) {
        voiceQuestionRef.current = false;
        setVoiceStatus("No clear words were captured. Try again or type your question.");
      }
    };
    recognitionRef.current = recognition;
    try {
      let localSpeechReady = false;
      if (Recognition.available && Recognition.install && "processLocally" in recognition) {
        for (const language of ["en-IN", "en-US"]) {
          if (!voiceQuestionRef.current) return;
          try {
            let availability = await Recognition.available({ langs: [language], processLocally: true, quality: "dictation" });
            if (availability === "unavailable") continue;
            if (availability === "downloadable") {
              setVoiceStatus(`Downloading the ${language} on-device speech pack. This is a one-time setup; please keep VITAL online.`);
              const installed = await Recognition.install({ langs: [language], processLocally: true, quality: "dictation" });
              if (!voiceQuestionRef.current) return;
              if (!installed) continue;
              availability = "available";
            }
            if (availability === "available") {
              recognition.lang = language;
              recognition.processLocally = true;
              localSpeechReady = true;
              break;
            }
          } catch {
            // Use standard browser recognition if the on-device pack is unavailable.
          }
        }
      }
      if (!voiceQuestionRef.current) return;
      setVoiceStatus(localSpeechReady
        ? `Listening on this device (${recognition.lang})… speak your question, then pause.`
        : "On-device speech is unavailable here. Trying your browser’s speech service; its audio handling follows your browser settings.");
      recognition.start();
    } catch {
      voiceQuestionRef.current = false;
      setListening(false);
      setVoiceStatus("Could not start the microphone. Check site permissions and try again.");
    }
  }

  useEffect(() => () => {
    recognitionRef.current?.stop();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [messages, open]);
  useEffect(() => {
    let active = true;
    const refresh = () => { void fetchLocalAiStatus().then((status) => { if (active) setLocalAiStatus(status); }).catch(() => { if (active) setLocalAiStatus({ available: false, provider: "None", notes: [] }); }); };
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  async function submitQuestion(value = draft, fromVoice = false) {
    const question = value.trim();
    if (!question || busy) return;
    setDraft("");
    setMessages((items) => [...items, { id: Date.now(), role: "user", text: question }]);
    setBusy(true);
    const context = {
      age,
      conditions,
      symptoms,
      triageState: triage.state,
      riskScore: triage.score,
      vitals: `SpO2 ${vitals.spo2}%, pulse ${vitals.pulse} bpm, temperature ${vitals.temperature} °F, systolic BP ${vitals.systolicBp} mmHg, respiration ${vitals.respiration}/min`,
      medications: prescriptionPlan?.doses.map((dose) => `${dose.medication} ${dose.dose} at ${dose.time}`).join("; ") || "No analyzed medication schedule",
      riskFactors: triage.riskFactors.join("; ") || "No separate risk factors returned",
      recommendations: triage.recommendations.join("; ") || "No separate recommendations returned"
    };
    try {
      const history = messages.slice(-8).map(({ role, text }) => ({ role, text }));
      const reply = await postHealthQuestion(question, context, history);
      setMessages((items) => [...items, { id: Date.now() + 1, role: "assistant", text: reply.answer, mode: reply.mode, urgent: reply.urgent, suggestions: reply.suggestions }]);
      if (fromVoice && voiceRepliesEnabledRef.current) speakText(reply.answer);
    } catch {
      setMessages((items) => [...items, {
        id: Date.now() + 1,
        role: "assistant",
        mode: "assistant unavailable",
        text: "VITAL could not reach its assistant service, so Ollama did not generate a reply. Check that the VITAL backend and Ollama are running, then try again."
      }]);
    } finally {
      setBusy(false);
    }
  }

  function startNewChat() {
    stopVoiceInput();
    stopSpeaking();
    setMessages([{ ...welcome, id: Date.now() }]);
    setDraft("");
    setVoiceStatus("");
  }

  function renderText(text: string) {
    return text.split(/(https?:\/\/[^\s]+)/g).map((part, index) => part.startsWith("https://") || part.startsWith("http://")
      ? <a key={`${part}-${index}`} href={part} target="_blank" rel="noreferrer">{part}</a>
      : <span key={index}>{part}</span>);
  }

  return <div className="health-assistant">
    {open ? <section className="assistant-panel" aria-label="VITAL health assistant">
      <header className="assistant-header"><div className="assistant-avatar"><Bot /></div><div><strong>Ask VITAL</strong></div><button type="button" aria-label={voiceRepliesEnabled ? "Turn off spoken replies" : "Turn on spoken replies"} aria-pressed={voiceRepliesEnabled} title={voiceRepliesEnabled ? "Spoken replies on" : "Spoken replies off"} onClick={() => { setVoiceRepliesEnabled((enabled) => !enabled); stopSpeaking(); }}><Volume2 className={voiceRepliesEnabled ? "voice-replies-enabled" : "voice-replies-muted"} /></button><button type="button" aria-label="Start a new conversation" title="New chat" onClick={startNewChat}><RotateCcw /></button><button type="button" aria-label="Close assistant" onClick={() => { stopVoiceInput(); stopSpeaking(); setOpen(false); }}><X /></button></header>
      <div className="assistant-messages" ref={listRef} aria-live="polite">
        {messages.map((message) => <article key={message.id} className={`assistant-message ${message.role} ${message.urgent ? "urgent" : ""}`}>
          {message.role === "assistant" ? <span className="assistant-message-label">{message.mode || "VITAL assistant"}</span> : null}
          <p>{renderText(message.text)}</p>
          {message.role === "assistant" ? <button className="assistant-listen-message" type="button" onClick={() => speakText(message.text)} aria-label="Listen to this reply"><Volume2 /> Listen</button> : null}
          {message.urgent ? <a className="assistant-call" href="tel:112">Call 112</a> : null}
        </article>)}
        {busy ? <div className="assistant-typing" role="status"><i /><i /><i /><span>Preparing an answer…</span></div> : null}
        {!busy && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.suggestions?.length ? <div className="assistant-suggestions"><span>{messages.length === 1 ? "Try asking" : "You can ask next"}</span>{messages[messages.length - 1].suggestions!.map((prompt) => <button type="button" key={prompt} onClick={() => void submitQuestion(prompt)}>{prompt}</button>)}</div> : null}
      </div>
      <form className="assistant-compose" onSubmit={(event) => { event.preventDefault(); void submitQuestion(); }}>
        <label className="sr-only" htmlFor="assistant-question">Ask a health question</label>
        <textarea id="assistant-question" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask a health question…" rows={1} maxLength={1500} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submitQuestion(); } }} />
        <div className="assistant-compose-actions">
          <button type="button" className={listening ? "is-listening" : ""} aria-label={listening ? "Stop voice input" : "Ask by voice"} title={listening ? "Stop voice input" : "Ask by voice"} disabled={busy} onClick={() => listening ? stopVoiceInput() : startVoiceInput()}>{listening ? <Square /> : <Mic />}</button>
          <button type="submit" aria-label="Send question" disabled={!draft.trim() || busy}><Send /></button>
        </div>
        {voiceStatus ? <small className="assistant-voice-status" role="status">{voiceStatus}</small> : <small className="assistant-voice-status">Voice recognition is handled by your browser; whether audio stays on-device depends on browser support and settings.</small>}
      </form>
      <p className="assistant-disclaimer">General information only. Not a diagnosis or prescription. For urgent symptoms, call emergency services.</p>
      <div className="assistant-shortcuts"><button type="button" onClick={onAppointment}>Appointments</button><button type="button" onClick={onEmergency}>Emergency help</button></div>
    </section> : null}
    <button className={`assistant-launcher ${open ? "open" : ""}`} type="button" aria-label={open ? "Close health assistant" : "Open health assistant"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? <X /> : <Bot />}<span>{open ? "Close" : "Ask VITAL"}</span><i className="assistant-launcher-dot" aria-hidden="true" /></button>
  </div>;
}

const healthNudges = [
  {
    category: "MOVE MORE",
    slogan: "A little movement adds up.",
    detail: "Choose activities that fit your abilities and health. Regular movement can support physical and mental wellbeing.",
    source: "WHO physical activity guidance",
    href: "https://www.who.int/news-room/fact-sheets/detail/physical-activity"
  },
  {
    category: "MOVE MORE",
    slogan: "Small steps count—keep your body moving.",
    detail: "Walking, cycling, household tasks and other movement can all contribute to activity across the week.",
    source: "WHO physical activity guidance",
    href: "https://www.who.int/news-room/fact-sheets/detail/physical-activity"
  },
  {
    category: "MOVE MORE",
    slogan: "Make movement part of your day.",
    detail: "Pick an activity you enjoy and build it into your routine at a pace that suits you.",
    source: "WHO physical activity guidance",
    href: "https://www.who.int/news-room/fact-sheets/detail/physical-activity"
  },
  {
    category: "EAT VARIETY",
    slogan: "Add more color and variety to your plate.",
    detail: "A varied mix of vegetables, fruit, pulses and whole grains supports a balanced diet. Adapt food choices to your needs and clinician’s advice.",
    source: "WHO healthy diet guidance",
    href: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet"
  },
  {
    category: "EAT VARIETY",
    slogan: "Make room for whole grains and pulses.",
    detail: "Whole grains, beans and lentils can be part of a diverse, balanced eating pattern.",
    source: "WHO healthy diet guidance",
    href: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet"
  },
  {
    category: "EAT VARIETY",
    slogan: "Choose variety over the same old plate.",
    detail: "Where available, mix different vegetables, fruits, pulses, grains and other nourishing foods.",
    source: "WHO healthy diet guidance",
    href: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet"
  },
  {
    category: "CLEAN HANDS",
    slogan: "Clean hands are a simple act of care.",
    detail: "Use soap and water for handwashing, especially at important everyday moments, to help reduce the spread of infections.",
    source: "WHO community hand hygiene guidance",
    href: "https://www.who.int/publications/i/item/9789240116559"
  },
  {
    category: "CLEAN HANDS",
    slogan: "Soap, water, and a moment of care.",
    detail: "Make handwashing with soap part of your important everyday routines.",
    source: "WHO community hand hygiene guidance",
    href: "https://www.who.int/publications/i/item/9789240116559"
  },
  {
    category: "REST WELL",
    slogan: "Good sleep belongs in your health routine.",
    detail: "Sleep needs vary with age. Talk with a healthcare professional if sleep problems persist or affect daily life.",
    source: "CDC sleep guidance",
    href: "https://www.cdc.gov/sleep/about/index.html"
  },
  {
    category: "REST WELL",
    slogan: "A steady sleep routine starts with regular bedtimes.",
    detail: "Going to bed and getting up at consistent times can support healthy sleep habits.",
    source: "CDC sleep guidance",
    href: "https://www.cdc.gov/sleep/about/index.html"
  },
  {
    category: "REST WELL",
    slogan: "Rest is part of your self-care, too.",
    detail: "Make room for rest and routines that fit your life; self-care complements professional healthcare.",
    source: "WHO self-care guidance",
    href: "https://www.who.int/news-room/questions-and-answers/item/self-care-for-health-and-well-being"
  },
  {
    category: "STAY CONNECTED",
    slogan: "A check-in can be a healthy habit.",
    detail: "Make time to connect with people you trust and ask for support when you need it.",
    source: "WHO self-care guidance",
    href: "https://www.who.int/initiatives/behealthy/healthyathome/healthyathome---mental-health"
  },
  {
    category: "TAKE A BREATHER",
    slogan: "Make space for something you enjoy.",
    detail: "A regular routine can include time for rest, hobbies and activities that matter to you.",
    source: "WHO stress guidance",
    href: "https://www.who.int/en/news-room/questions-and-answers/item/stress"
  },
  {
    category: "TOBACCO-FREE",
    slogan: "Tobacco-free is a step toward better health.",
    detail: "All forms of tobacco are harmful. If you use tobacco and want to quit, a health professional can help you find support.",
    source: "WHO tobacco guidance",
    href: "https://www.who.int/en/news-room/fact-sheets/detail/tobacco"
  },
  {
    category: "TOBACCO-FREE",
    slogan: "Thinking about quitting tobacco? Ask for support.",
    detail: "Counselling and other professional support can help people who are ready to quit.",
    source: "WHO tobacco guidance",
    href: "https://www.who.int/initiatives/behealthy/no-tobacco"
  },
  {
    category: "MEDICINES",
    slogan: "Follow your prescription; check before changing a dose.",
    detail: "If instructions are unclear or you have concerns, ask your prescriber or pharmacist before changing how you take a medicine.",
    source: "WHO self-care guidance",
    href: "https://www.who.int/news-room/questions-and-answers/item/self-care-for-health-and-well-being"
  },
  {
    category: "PREVENTION",
    slogan: "Ask your health worker which vaccines are due.",
    detail: "A healthcare professional can advise which vaccines are appropriate for your age and circumstances.",
    source: "WHO keeping-well guidance",
    href: "https://www.who.int/tools/your-life-your-health/life-phase/early-and-middle-adulthood/keeping-well-in-adulthood"
  },
  {
    category: "TRAVEL SAFELY",
    slogan: "Buckle up. Wear a helmet on two wheels.",
    detail: "Use a seat belt in a car and a helmet when riding a bicycle or motorbike.",
    source: "WHO keeping-well guidance",
    href: "https://www.who.int/tools/your-life-your-health/life-phase/early-and-middle-adulthood/keeping-well-in-adulthood"
  }
];

function HealthNudge() {
  const [activeIndex, setActiveIndex] = useState(() => new Date().getDate() % healthNudges.length);
  const [paused, setPaused] = useState(false);
  const activeNudge = healthNudges[activeIndex];
  const topicIcon = activeNudge.category === "MOVE MORE" ? <Activity />
    : activeNudge.category === "EAT VARIETY" ? <Apple />
    : activeNudge.category === "CLEAN HANDS" ? <Hand />
    : activeNudge.category === "REST WELL" ? <Moon />
    : activeNudge.category === "STAY CONNECTED" ? <Users />
    : activeNudge.category === "TAKE A BREATHER" ? <Wind />
    : activeNudge.category === "TRAVEL SAFELY" ? <Bike />
    : activeNudge.category === "MEDICINES" ? <Pill />
    : <ShieldCheck />;

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActiveIndex((index) => (index + 1) % healthNudges.length);
    }, 9000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const move = (direction: number) => setActiveIndex((index) => (index + direction + healthNudges.length) % healthNudges.length);

  return <section className="health-nudge" aria-label="Everyday health precautions">
    <div className="health-nudge-icon" aria-hidden="true">{topicIcon}</div>
    <div className="health-nudge-content" aria-live="polite" aria-atomic="true">
      <div className="health-nudge-meta"><span>DAILY HEALTH NUDGE</span><b>{activeNudge.category}</b></div>
      <h2>{activeNudge.slogan}</h2>
      <p>{activeNudge.detail}</p>
      <a href={activeNudge.href} target="_blank" rel="noreferrer">{activeNudge.source}<ChevronRight aria-hidden="true" /></a>
    </div>
    <div className="health-nudge-controls" aria-label="Health nudge controls">
      <span>{activeIndex + 1} / {healthNudges.length}</span>
      <div>
        <button type="button" onClick={() => move(-1)} aria-label="Previous health nudge"><ChevronLeft /></button>
        <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Resume automatic health nudges" : "Pause automatic health nudges"} title={paused ? "Resume rotation" : "Pause rotation"}>{paused ? <Play /> : <Pause />}</button>
        <button type="button" onClick={() => move(1)} aria-label="Next health nudge"><ChevronRight /></button>
      </div>
    </div>
  </section>
}

function DashboardView({
  profile,
  triage,
  hasTriageResult,
  medicationScore,
  medicationLogCount,
  hospitals,
  appointments,
  wearable,
  phonePaired,
  cameraActive,
  cameraFrameFresh,
  wearableStale,
  prescriptionNeedsReview,
  pendingFallAlerts,
  patientTimeline,
  setTab,
  onStartWalkthrough
}: {
  profile: PatientProfile;
  triage: TriageResponse;
  hasTriageResult: boolean;
  medicationScore: number;
  medicationLogCount: number;
  hospitals: Hospital[];
  appointments: Appointment[];
  wearable: WearableSummary | null;
  phonePaired: boolean;
  cameraActive: boolean;
  cameraFrameFresh: boolean;
  wearableStale: boolean;
  prescriptionNeedsReview: boolean;
  pendingFallAlerts: PossibleFallAlert[];
  patientTimeline: PatientTimelineEvent[];
  setTab: (tab: TabId) => void;
  onStartWalkthrough: () => void;
}) {
  const firstName = profile.name.trim().split(/\s+/)[0] || "there";
  const upcomingAppointment = appointments[0];
  return (
    <div className="dashboard-grid">
      <section className="dashboard-welcome">
        <div className="welcome-copy">
          <span className="welcome-eyebrow">YOUR HEALTH OVERVIEW</span>
          <div className="welcome-heading"><div><h2>{profile.name.trim() ? `Welcome back, ${firstName}` : "Welcome to VITAL"}</h2><p>A snapshot of information saved on this device and synced from connected sources.</p></div><StateBadge state={hasTriageResult ? triage.state : "Not assessed"} /></div>
          <div className="welcome-actions">
          <ActionButton icon={<Play />} onClick={onStartWalkthrough}>Take a quick tour</ActionButton>
            <ActionButton icon={<Stethoscope />} onClick={() => setTab("triage")} variant="secondary">Review symptoms & vitals</ActionButton>
          </div>
        </div>
        <div className="dashboard-glance">
          <article className={`glance-risk ${hasTriageResult ? stateClass(triage.state) : "notassessed"}`}><span>Latest screening</span><strong>{hasTriageResult ? triage.state : "Not assessed"}</strong><em className="screening-score">{hasTriageResult ? `Score: ${triage.score}` : "No result recorded"}</em></article>
          <article><span>Medication check-ins</span><strong>{medicationLogCount ? `${medicationScore}%` : "—"}</strong><small>{medicationLogCount ? `${medicationLogCount} recorded checks` : "No dose check-ins yet"}</small></article>
          <article><span>Planned visits</span><strong>{appointments.length}</strong><small>{upcomingAppointment ? `Next: ${upcomingAppointment.date}` : "No reminders yet"}</small></article>
          <article><span>Wearable data</span><strong>{wearable?.latest ? "Synced" : "Not connected"}</strong><small>{wearable?.latest ? `Updated ${new Date(wearable.latest.observedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Optional wellness context"}</small></article>
        </div>
        <p className="welcome-disclaimer">Health information supports your care and does not replace a clinician.</p>
      </section>
      <Panel title="Attention & connections" kicker="setup and follow-up">
        <div className="attention-center-list">
          {pendingFallAlerts.length ? <article className="attention-item urgent">
            <AlertTriangle />
            <div><strong>{pendingFallAlerts.length === 1 ? "Possible-fall alert needs review" : `${pendingFallAlerts.length} possible-fall alerts need review`}</strong><span>Check on the person if safe and review the camera alert history. VITAL cannot confirm a fall or call emergency services.</span></div>
            <ActionButton icon={<ChevronRight />} onClick={() => setTab("camera")} variant="secondary">Review alert</ActionButton>
          </article> : null}
          {!phonePaired ? <article className="attention-item">
            <Smartphone />
            <div><strong>Phone not paired</strong><span>Pair the Android app to sync phone data and enable phone camera monitoring.</span></div>
            <ActionButton icon={<ChevronRight />} onClick={() => setTab("phoneConnection")} variant="secondary">Connect phone</ActionButton>
          </article> : !cameraActive ? <article className="attention-item">
            <Camera />
            <div><strong>Camera monitoring is off</strong><span>The phone is paired, but no active camera session is sending frames.</span></div>
            <ActionButton icon={<ChevronRight />} onClick={() => setTab("camera")} variant="secondary">Check camera</ActionButton>
          </article> : !cameraFrameFresh ? <article className="attention-item urgent">
            <Camera />
            <div><strong>Camera feed is stale</strong><span>The phone session is active, but VITAL has not received a recent frame. Reopen the phone camera monitor and check Wi-Fi.</span></div>
            <ActionButton icon={<ChevronRight />} onClick={() => setTab("camera")} variant="secondary">Reconnect feed</ActionButton>
          </article> : null}
          {!wearable?.latest ? <article className="attention-item optional">
            <Watch />
            <div><strong>No wearable readings yet</strong><span>Wearable sync is optional. Connect a source to show readings when available.</span></div>
            <ActionButton icon={<ChevronRight />} onClick={() => setTab("wearables")} variant="secondary">View wearables</ActionButton>
          </article> : wearable.latest.warnings?.length ? <article className="attention-item optional">
            <Activity />
            <div><strong>Some wearable readings are unavailable</strong><span>{wearable.latest.warnings[0]}</span></div>
            <ActionButton icon={<ChevronRight />} onClick={() => setTab("wearables")} variant="secondary">Review data</ActionButton>
          </article> : wearableStale ? <article className="attention-item optional">
            <Watch />
            <div><strong>Wearable data may be out of date</strong><span>The latest measurement is over 24 hours old. Refresh the watch sync before using these values as current context.</span></div>
            <ActionButton icon={<ChevronRight />} onClick={() => setTab("wearables")} variant="secondary">Refresh sync</ActionButton>
          </article> : null}
          {!hasTriageResult ? <article className="attention-item optional">
            <Stethoscope />
            <div><strong>No screening result recorded</strong><span>Enter symptoms and readings if you want VITAL to prepare a screening estimate.</span></div>
            <ActionButton icon={<ChevronRight />} onClick={() => setTab("triage")} variant="secondary">Review screening</ActionButton>
          </article> : null}
          {prescriptionNeedsReview ? <article className="attention-item optional">
            <Pill />
            <div><strong>Prescription review is unfinished</strong><span>Confirm each medicine, dose, direction, and schedule against the doctor's original before enabling reminders.</span></div>
            <ActionButton icon={<ChevronRight />} onClick={() => setTab("medication")} variant="secondary">Review schedule</ActionButton>
          </article> : null}
          {phonePaired && cameraActive && cameraFrameFresh && !pendingFallAlerts.length && wearable?.latest && !wearable.latest.warnings?.length && !wearableStale && hasTriageResult && !prescriptionNeedsReview ? <p className="attention-center-clear"><Check /> No setup or follow-up items right now.</p> : null}
        </div>
      </Panel>

      <Panel title="Your profile" kicker="personal details" action={<ActionButton icon={<ChevronRight />} onClick={() => setTab("settings")} variant="secondary">Edit profile</ActionButton>}>
        <dl className="dashboard-profile">
          <div><dt>Patient</dt><dd>{profile.name || "Not provided"}{profile.age > 0 ? ` · ${profile.age}` : ""}</dd></div>
          <div><dt>Monitoring</dt><dd>{profile.condition || "Not provided"}</dd></div>
          <div><dt>Location</dt><dd>{profile.location || "Not provided"}</dd></div>
          <div><dt>Caretaker</dt><dd>{profile.caretaker || "Not provided"}</dd></div>
        </dl>
      </Panel>

      <Panel title="Hospital directory" kicker="Static local references · call to verify current details and availability">
        <div className="hospital-list">
          {hospitals.slice(0, 3).map((hospital) => (
            <article key={hospital.id}>
              <HospitalIcon />
              <div>
                <strong>{hospital.name}</strong>
                <span>{hospital.area}</span>
                <small>{hospital.specialties.join(" / ")}</small>
              </div>
              <a href={`tel:${hospital.phone.replace(/\s/g, "")}`} aria-label={`Call ${hospital.name}`}>
                <PhoneCall />
              </a>
            </article>
          ))}
        </div>
      </Panel>

      <Panel
        title="Wearable wellness bridge"
        kicker="Android Health Connect · actual source shown below"
        action={<ActionButton icon={<Watch />} onClick={() => setTab("wearables")} variant="secondary">Open sync</ActionButton>}
      >
        <div className="wearable-snapshot">
          <div>
            <span>Latest source</span>
            <strong>{wearable?.latest?.source || "No device data yet"}</strong>
            <small>{wearable?.latest?.deviceModel || "Connect a supported phone or wearable to sync readings."}</small>
          </div>
          <div>
            <span>Heart rate</span>
            <strong>{wearable?.context.heartRateBpm ? `${wearable.context.heartRateBpm} bpm` : "--"}</strong>
            <small>Wellness context only</small>
          </div>
          <div>
            <span>Steps</span>
            <strong>{wearable?.context.steps?.toLocaleString() || "--"}</strong>
            <small>Does not change triage</small>
          </div>
        </div>
      </Panel>

      <Panel title="Recent care activity" kicker="latest events" action={<ActionButton icon={<History />} onClick={() => setTab("timeline")} variant="secondary">Open timeline</ActionButton>}>
        <div className="dashboard-recent-events">
          {patientTimeline.length ? patientTimeline.slice(0, 3).map((event) => <article key={event.id}>
            <span className={`recent-event-dot ${event.eventType}`} />
            <div><strong>{event.title}</strong><small>{new Date(event.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</small></div>
            {event.status ? <b>{event.status}</b> : null}
          </article>) : <p>No monitoring activity yet. Start with a symptom and vital check.</p>}
        </div>
      </Panel>
    </div>
  );
}

function GuidedDemoBar({ step, onPrevious, onNext, onExit }: { step: number; onPrevious: () => void; onNext: () => void; onExit: () => void }) {
  const current = guidedDemoSteps[step];
  return <aside className="guided-demo" aria-label="Quick tour of VITAL">
    <div className="guided-demo-copy">
      <span>YOUR VITAL TOUR · STEP {step + 1} OF {guidedDemoSteps.length}</span>
      <strong>{current.title}</strong>
      <p>{current.instruction}</p>
    </div>
    <div className="guided-demo-controls">
      <div className="guided-demo-progress" role="progressbar" aria-label="Walkthrough progress" aria-valuemin={1} aria-valuemax={guidedDemoSteps.length} aria-valuenow={step + 1}><i style={{ width: `${((step + 1) / guidedDemoSteps.length) * 100}%` }} /></div>
      <div className="guided-demo-buttons">
        <button type="button" onClick={onPrevious} disabled={step === 0}><ChevronLeft /> Back</button>
        <button type="button" className="guided-demo-exit" onClick={onExit}>Exit</button>
        <button type="button" className="guided-demo-next" onClick={onNext}>{step === guidedDemoSteps.length - 1 ? "Finish" : "Next step"}<ChevronRight /></button>
      </div>
    </div>
  </aside>;
}

function WearableView({ wearable, refreshWearable }: { wearable: WearableSummary | null; refreshWearable: () => Promise<void> }) {
  const [readingHistory, setReadingHistory] = useState<WearableReading[]>([]);
  const [historyMessage, setHistoryMessage] = useState("Loading recent readings…");
  const [historyBusy, setHistoryBusy] = useState(false);
  const context = wearable?.context || {};
  const rawDeviceSource = wearable?.latest?.deviceModel || "";
  const phoneStepSource = /com\.android\.healthconnect\.phone|on-device health connect steps/i.test(rawDeviceSource);
  const readableDeviceSource = rawDeviceSource.replace(/com\.android\.healthconnect\.phone(?:\.[A-Za-z0-9_-]+)*/gi, "Your phone (on-device Health Connect steps)");
  const sourceBadge = !wearable?.latest ? "No data" : phoneStepSource ? "Phone steps only" : /fastrack/i.test(rawDeviceSource) ? "Fastrack source" : "Health Connect source";
  const receivedAt = wearable?.latest?.receivedAt || wearable?.latest?.observedAt;
  const observedAtMs = wearable?.latest?.observedAt ? new Date(wearable.latest.observedAt).getTime() : Number.NaN;
  const wearableAgeMinutes = Number.isFinite(observedAtMs) ? Math.max(0, Math.floor((Date.now() - observedAtMs) / 60_000)) : null;
  const wearableFreshness = !wearable?.latest ? "No successful sync yet"
    : wearableAgeMinutes == null ? "Measurement time unavailable"
    : wearableAgeMinutes < 60 ? `Current · measured ${wearableAgeMinutes === 0 ? "less than a minute" : `${wearableAgeMinutes} min`} ago`
    : wearableAgeMinutes < 1440 ? `Aging · measured ${Math.floor(wearableAgeMinutes / 60)} hr ago`
    : `Stale · measured ${Math.floor(wearableAgeMinutes / 1440)} day${Math.floor(wearableAgeMinutes / 1440) === 1 ? "" : "s"} ago`;
  const loadReadingHistory = async () => {
    setHistoryBusy(true);
    try {
      const result = await fetchWearableReadings();
      const readings = [...result.readings].sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime());
      setReadingHistory(readings.slice(0, 5));
      setHistoryMessage(readings.length ? "" : "No wearable readings have been recorded yet.");
    } catch {
      setHistoryMessage("Could not load reading history. Check that the VITAL service is online, then try again.");
    } finally {
      setHistoryBusy(false);
    }
  };
  useEffect(() => { void loadReadingHistory(); }, []);
  async function refreshAllReadings() {
    await refreshWearable();
    await loadReadingHistory();
  }
  const historyMetricLabels: Record<string, string> = {
    heartRateBpm: "Heart rate", restingHeartRateBpm: "Resting HR", spo2Percent: "SpO₂",
    systolicBp: "Systolic BP", temperatureF: "Body temperature", respirationPerMinute: "Respiration",
    steps: "Steps", sleepMinutes: "Sleep", activeCaloriesKcal: "Active calories", totalCaloriesKcal: "Total calories",
    distanceMeters: "Distance", basalMetabolicRateKcalPerDay: "Basal metabolic rate", heightCm: "Height", weightKg: "Weight"
  };
  const formatHistoryMetric = (key: string, value: number) => {
    if (key === "spo2Percent") return `${value}%`;
    if (key === "heartRateBpm" || key === "restingHeartRateBpm") return `${value} bpm`;
    if (key === "systolicBp") return `${value} mmHg`;
    if (key === "temperatureF") return `${value} °F`;
    if (key === "respirationPerMinute") return `${value}/min`;
    if (key === "steps") return value.toLocaleString();
    if (key === "sleepMinutes") return `${Math.floor(value / 60)}h ${Math.round(value % 60)}m`;
    if (key === "distanceMeters") return value >= 1000 ? `${(value / 1000).toFixed(2)} km` : `${Math.round(value)} m`;
    if (key === "heightCm") return `${value.toFixed(1)} cm`;
    if (key === "weightKg") return `${value.toFixed(1)} kg`;
    if (key === "basalMetabolicRateKcalPerDay") return `${Math.round(value)} kcal/day`;
    return `${Math.round(value)} kcal`;
  };
  return (
    <div className="two-column">
      <Panel title="Wearable readings" kicker="Optional wellness context" action={<span className={`wearable-source-badge ${phoneStepSource ? "phone-only" : ""}`}>{sourceBadge}</span>}>
        <div className="wearable-hero">
          <Watch />
          <div>
            <strong>{readableDeviceSource || "No reading received"}</strong>
            <p>{wearable?.latest && receivedAt ? `Received by VITAL ${new Date(receivedAt).toLocaleString()}` : "Connect a compatible device to see your readings here."}</p>
            {wearable?.latest?.receivedAt && wearable.latest.observedAt ? <small>Measurement time: {new Date(wearable.latest.observedAt).toLocaleString()}</small> : null}
            <small className={`wearable-freshness ${wearableAgeMinutes != null && wearableAgeMinutes >= 1440 ? "stale" : ""}`} role="status">{wearableFreshness}</small>
          </div>
        </div>
        <div className="signal-grid wearable-signals">
          <span><HeartPulse /><b>{context.heartRateBpm ? `${context.heartRateBpm} bpm` : "--"}</b><small>Heart rate</small></span>
          <span><HeartPulse /><b>{context.restingHeartRateBpm ? `${context.restingHeartRateBpm} bpm` : "--"}</b><small>Resting HR</small></span>
          <span><Activity /><b>{context.spo2Percent != null ? `${context.spo2Percent}%` : "--"}</b><small>SpO₂</small></span>
          {context.systolicBp != null ? <span><Activity /><b>{context.systolicBp} mmHg</b><small>Systolic BP</small></span> : null}
          {context.temperatureF != null ? <span><Activity /><b>{context.temperatureF} °F</b><small>Body temperature</small></span> : null}
          {context.respirationPerMinute != null ? <span><Activity /><b>{context.respirationPerMinute}/min</b><small>Respiration</small></span> : null}
          <span><Activity /><b>{context.steps?.toLocaleString() || "--"}</b><small>Steps</small></span>
          <span><Activity /><b>{context.activeCaloriesKcal != null ? `${Math.round(context.activeCaloriesKcal)} kcal` : "--"}</b><small>Active calories</small></span>
          <span><Activity /><b>{context.totalCaloriesKcal != null ? `${Math.round(context.totalCaloriesKcal)} kcal` : "--"}</b><small>Total calories</small></span>
          <span><Activity /><b>{context.distanceMeters != null ? `${(context.distanceMeters / 1000).toFixed(2)} km` : "--"}</b><small>Distance</small></span>
          <span><TimerReset /><b>{context.sleepMinutes ? `${Math.round(context.sleepMinutes / 60)}h ${context.sleepMinutes % 60}m` : "--"}</b><small>Sleep</small></span>
          <span><Activity /><b>{context.basalMetabolicRateKcalPerDay != null ? `${Math.round(context.basalMetabolicRateKcalPerDay)} kcal/day` : "--"}</b><small>Basal metabolic rate</small></span>
          <span><Activity /><b>{context.heightCm != null ? `${context.heightCm.toFixed(1)} cm` : "--"}</b><small>Height</small></span>
          <span><Activity /><b>{context.weightKg != null ? `${context.weightKg.toFixed(1)} kg` : "--"}</b><small>Weight</small></span>
        </div>
        {wearable?.latest ? <div className="wearable-sync-note" role="status">
          <strong>{phoneStepSource ? "Phone steps only" : "Synced readings"}</strong>
          <p>{phoneStepSource
            ? "This sync does not confirm watch data. Check that Google Fit shares the watch readings with Health Connect."
            : "Only readings shared with Health Connect are shown. Unavailable measurements are hidden until the watch app shares them."}</p>
          {wearable.latest.warnings?.length ? <ul className="wearable-missing-notes">{wearable.latest.warnings.map((warning, index) => <li key={`${index}-${warning}`}>{warning}</li>)}</ul> : null}
        </div> : null}
      </Panel>

      <Panel title="Sync a wearable" kicker="Connect through your phone's health app">
        <ol className="device-steps">
          <li>Pair and sync the watch in Fastrack Smart. Enable its Google Fit health-data sync if the option is available.</li>
          <li>In Google Fit, open <strong>Profile → Settings → Health Connect</strong> and turn on <strong>Sync Fit with Health Connect</strong>. In Health Connect, allow Google Fit to write data and VITAL to read it.</li>
          <li>Confirm the watch readings are listed in Health Connect. Then, in the VITAL Android companion, tap <strong>Sync watch readings</strong> and grant the requested read access.</li>
          <li>VITAL reads actual records Health Connect contains and uploads them over the paired local Wi-Fi connection. The phone checks about once a minute while the companion is open.</li>
          <li>This dashboard refreshes every 15 seconds. Check the source and timestamp; the vendor app may take time to sync new readings.</li>
        </ol>
        <ActionButton icon={<Radio />} onClick={() => void refreshAllReadings()} disabled={historyBusy}>{historyBusy ? "Refreshing…" : "Refresh watch readings"}</ActionButton>
        <p className="safety-note">Only readings actually shared through the watch app, Google Fit, and Health Connect are shown. Unavailable measurements are hidden. This is periodic health-data sync, not a second-by-second sensor stream. Watch data is wellness context and is not a diagnosis.</p>
      </Panel>
      <div className="wearable-history-panel">
        <Panel title="Recent reading history" kicker="latest syncs received by VITAL" action={<span className="wearable-history-count">{readingHistory.length} of 5</span>}>
          {readingHistory.length ? <div className="wearable-history-list">
            {readingHistory.map((reading, index) => {
              const observed = new Date(reading.observedAt);
              const metrics = Object.entries(reading.metrics).filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]));
              return <article className="wearable-history-record" key={reading.id || `${reading.observedAt}-${index}`}>
                <div className="wearable-history-record-head"><div><strong>{Number.isNaN(observed.getTime()) ? reading.observedAt : observed.toLocaleString()}</strong><span>{reading.deviceModel} · {reading.source}</span></div><small>{metrics.length} {metrics.length === 1 ? "reading" : "readings"}</small></div>
                <div className="wearable-history-metrics">{metrics.map(([key, value]) => <span key={key}><small>{historyMetricLabels[key] || key}</small><strong>{formatHistoryMetric(key, value)}</strong></span>)}</div>
                {reading.warnings?.length ? <p className="wearable-history-warning"><AlertTriangle /> {reading.warnings.join(" ")}</p> : null}
              </article>;
            })}
          </div> : <div className="empty-state"><History /><p>{historyMessage}</p>{historyMessage.startsWith("Could not") ? <ActionButton icon={<RefreshCw />} variant="secondary" onClick={() => void loadReadingHistory()} disabled={historyBusy}>Try again</ActionButton> : null}</div>}
        </Panel>
      </div>
    </div>
  );
}

function TriageView({
  age,
  symptoms,
  hasTriageResult,
  setSymptoms,
  triage,
  vitals,
  setVitals,
  watchReading,
  requestState,
  error,
  setTriageRequestState,
  setTriageError,
  runTriage,
  applyScenario
}: {
  age: number;
  symptoms: string;
  hasTriageResult: boolean;
  setSymptoms: (value: string) => void;
  triage: TriageResponse;
  vitals: TriageVitals;
  setVitals: (value: TriageVitals) => void;
  watchReading: WearableReading | null;
  requestState: "idle" | "loading" | "ready" | "unavailable";
error: string;
setTriageRequestState: (value: "idle" | "loading" | "ready" | "unavailable") => void;
setTriageError: (value: string) => void;
runTriage: (input?: string) => Promise<void>;
  applyScenario: (text: string) => void;
}) {
  const vitalFields: Array<{ key: keyof TriageVitals; label: string; unit: string; min: number; max: number; step: string }> = [
    { key: "spo2", label: "Oxygen saturation", unit: "%", min: 50, max: 100, step: "1" },
    { key: "pulse", label: "Pulse", unit: "bpm", min: 20, max: 240, step: "1" },
    { key: "temperature", label: "Temperature", unit: "°F", min: 80, max: 115, step: "0.1" },
    { key: "systolicBp", label: "Systolic BP", unit: "mmHg", min: 50, max: 260, step: "1" },
    { key: "respiration", label: "Respiration", unit: "/min", min: 4, max: 80, step: "1" }
  ];
  return (
    <div className="triage-workspace">
      <Panel title="Symptoms and vitals" kicker="Get general care guidance">
        <div className="triage-intro">
          <span>01 / INPUT</span>
          <p>Describe what is happening, then enter the readings you actually have. Missing or unavailable data should lead to human review — not a made-up score.</p>
        </div>
        <label className="triage-label" htmlFor="symptoms">What is happening right now?</label>
        <textarea
          id="symptoms"
          value={symptoms}
          onChange={(event) => {
            setSymptoms(event.target.value);
            setTriageRequestState("idle");
            setTriageError("");
          }}
          rows={5}
          placeholder="Describe symptoms, timing, and any change from usual."
        />
        <div className="vital-grid" aria-label="Current vital readings">
          {vitalFields.map((field) => (
            <label key={field.key}>
              <span>{field.label}<small>{field.unit}</small></span>
              <input
                type="number"
                inputMode="decimal"
                min={field.min}
                max={field.max}
                step={field.step}
                value={vitals[field.key]}
                onChange={(event) => {
                  setVitals({ ...vitals, [field.key]: event.target.value });
                  setTriageRequestState("idle");
                  setTriageError("");
                }}
              />
            </label>
          ))}
        </div>
        {watchReading?.source === "health-connect" ? <p className="safety-note">Any matching values above were filled from Health Connect ({watchReading.deviceModel}) at {new Date(watchReading.observedAt).toLocaleString()}. Check that each reading is current; watch records can be older. Missing measurements remain blank.</p> : null}
        <section className="vital-visualization" aria-label="Visual snapshot of current readings">
          <div className="vital-visualization-heading"><strong>Reading snapshot</strong><small>Visual scales only · not normal ranges or a risk assessment</small></div>
          <div className="vital-bar-grid">
            {vitalFields.map((field) => {
              const parsed = Number.parseFloat(vitals[field.key]);
              const hasValue = Number.isFinite(parsed);
              const percent = hasValue ? Math.max(0, Math.min(100, ((parsed - field.min) / (field.max - field.min)) * 100)) : 0;
              return <div className="vital-bar-card" key={field.key}>
                <div><span>{field.label}</span><strong>{hasValue ? `${vitals[field.key]} ${field.unit}` : "Not entered"}</strong></div>
                <div className="vital-bar-track" aria-hidden="true"><i style={{ width: `${percent}%` }} /></div>
              </div>;
            })}
          </div>
        </section>
        <p className="scenario-heading">Choose an example or enter your own symptoms above</p>
        <div className="scenario-grid">
          {demoScenarios.map((scenario) => (
            <button key={scenario.name} type="button" onClick={() => applyScenario(scenario.text)}>
              <span>{scenario.name}</span>
              <small>{scenario.text}</small>
            </button>
          ))}
        </div>
        {error ? <p className="triage-error" role="alert"><AlertTriangle />{error}</p> : null}
        <ActionButton icon={<Play />} onClick={() => void runTriage()} disabled={requestState === "loading"}>
          {requestState === "loading" ? "Checking route…" : "Check care route"}
        </ActionButton>
        <p className="triage-footnote">This check cannot diagnose a condition or confirm that you are safe. For severe symptoms, contact emergency services.</p>
      </Panel>
      <Panel title="Triage output" kicker="Decision support only">
        <div className={`route-status ${requestState}`}>
          <span>{requestState === "ready" ? "02 / MODEL RESPONSE" : requestState === "unavailable" ? "SERVICE UNAVAILABLE" : "02 / AWAITING CHECK"}</span>
          <strong>{requestState === "ready" ? "Estimate is tied to the values above" : requestState === "unavailable" ? "No fallback score was invented" : hasTriageResult ? "Inputs changed — the saved estimate is stale. Run a new check." : "No estimate yet. Enter current symptoms and readings to begin."}</strong>
        </div>
        {requestState === "ready" ? (
          <>
        <div className={`triage-result ${triage.followUpPrompt ? "needs-detail" : stateClass(triage.state)}`}>
          {triage.followUpPrompt ? (
            <div className="triage-follow-up">
              <span>MORE DETAIL NEEDED</span>
              <h3>Tell us more about the pain</h3>
              <p>{triage.followUpPrompt}</p>
              <small>VITAL cannot assess unspecified pain or rule out a serious problem.</small>
            </div>
          ) : <>
            <ScoreRing score={triage.score} label="risk score" state={triage.state} />
            <div>
              <StateBadge state={triage.state} />
              <h3>{triage.state === "Emergency" ? "Immediate attention recommended" : triage.state === "At-Risk" ? "Monitor and consult" : "No urgent signal identified"}</h3>
              <p>{triage.model?.disclaimer}</p>
              <small>Based on the symptoms and readings you entered · not a diagnosis</small>
            </div>
          </>}
        </div>
        {triage.dataQualityWarnings?.map((warning) => <p className="safety-note" role="status" key={warning}>{warning}</p>)}
        {triage.explainability?.summary ? (
  <div className="explain-summary triage-ai-summary">
    <ShieldCheck />
    <div>
      <strong>Why did VITAL give this result?</strong>
      <p>{triage.explainability.summary}</p>
    </div>
  </div>
) : null}
        {!triage.followUpPrompt ? <>
        <h4 className="probability-title">Estimated result breakdown</h4>
        <div className="probability-panel">
          {(["Normal", "At-Risk", "Emergency"] as HealthState[]).map((label) => {
            const value = Math.round(((triage.probabilities?.[label] ?? triage.model?.probabilities?.[label] ?? 0) as number) * 100);
            return (
              <div className="bar-row compact" key={label}>
                <span>{label}</span>
                <div><i className={stateClass(label)} style={{ width: `${safeScore(value)}%` }} /></div>
                <strong>{safeScore(value)}%</strong>
              </div>
            );
          })}
        </div>
        </> : null}
        <div className="result-columns">
  <div>
    <h4>Why did VITAL give this result?</h4>

    <div className="explain-summary triage-ai-summary">
      <ShieldCheck />
      <div>
        <strong>How this result was estimated</strong>
        <p>
          VITAL considers the symptoms and readings you entered to estimate the level of concern.
        </p>
      </div>
    </div>

    <h4>What raised concern</h4>

    {triage.riskFactors.map((item) => (
      <div className="explain-signal risk" key={item}>
        <div className="explain-signal-icon">
          <AlertTriangle />
        </div>

        <div>
          <strong>{item.replace("Detected signal: ", "")}</strong>
          <span>From the symptoms or readings you entered.</span>
        </div>

        <b>!</b>
      </div>
    ))}

  </div>

  <div>
    <h4>Reassuring information</h4>

    {(triage.explainability?.protectiveSignals?.length ? triage.explainability.protectiveSignals : [{ label: "No reassuring reading recorded", detail: "VITAL did not identify an additional protective signal in the supplied information.", impact: 0 }]).map((signal) => (
      <div className="explain-signal protective" key={signal.label}>
        <div className="explain-signal-icon"><ShieldCheck /></div>
        <div className="explain-copy"><strong>{signal.label}</strong><span>{signal.detail}</span></div>
        <b>{signal.impact ? `−${Math.abs(signal.impact)}` : "✓"}</b>
      </div>
    ))}

    <h4>Suggested next steps</h4>

    {triage.recommendations.map((item) => (
      <p className="triage-recommendation" key={item}>
        <ClipboardCheck />
        <span>{item}</span>
      </p>
    ))}
  </div>
</div>
          </>
        ) : (
          <div className="triage-pending">
            <ShieldCheck />
            <div>
              <strong>{requestState === "unavailable" ? "No care route available" : "Awaiting a current input"}</strong>
              <p>{requestState === "unavailable" ? "Your symptoms and readings are still here. The previous request did not reach a result; retry the check." : "Run a check to see guidance based on the symptoms and readings shown."}</p>
              {requestState === "unavailable" ? <button type="button" className="triage-retry" onClick={() => void runTriage()}>Retry care check</button> : null}
            </div>
          </div>
        )}
      </Panel>
      {requestState === "ready" ? <CareGuidance state={triage.state} symptoms={symptoms} age={age} /> : null}
    </div>
  );
}

function CareGuidance({ state, symptoms = "", age }: { state: HealthState; symptoms?: string; age?: number }) {
  const hasFever = /\b(fever|feverish|high temperature)\b/i.test(symptoms);
  const adultFever = hasFever && typeof age === "number" && age >= 18;
  const childFever = hasFever && typeof age === "number" && age < 18;
  const guidance = {
    Emergency: {
      title: "Seek emergency medical help now",
      summary: "If these symptoms are happening now, do not wait for VITAL or try home treatment instead of urgent care.",
      precautions: [
        "Call emergency services and follow the call handler’s instructions.",
        "If possible, ask someone to stay with the person and share symptom start time and current readings with responders.",
        "Do not drive yourself if you may be seriously unwell."
      ],
      nextSteps: ["Get urgent, in-person medical assessment.", "VITAL cannot call an ambulance or notify your caretaker. Use the call or message options in Emergency Help."],
      followUp: "Emergency assessment takes priority over routine doctor follow-up."
    },
    "At-Risk": {
      title: "Arrange a clinician review",
      summary: "The information you entered raised a concern. A healthcare professional can assess your full situation.",
      precautions: [
        "Note when symptoms began and whether they are changing; share this with a clinician.",
        "Use medicines only as prescribed. Do not start, stop, or change doses based on this app.",
        "Seek urgent help if symptoms become severe or rapidly worsen."
      ],
      nextSteps: ["Contact your doctor or a qualified healthcare professional promptly for advice.", "Keep the symptom description and any available readings ready for the consultation."],
      followUp: "Please consult a doctor for an assessment and a care plan suited to you."
    },
    Normal: {
      title: "No urgent signal was identified in the supplied information",
      summary: "A Normal result cannot rule out illness or replace a clinical assessment.",
      precautions: [
        "Monitor how you feel and note any new or changing symptoms.",
        "Continue prescribed medicines as directed; do not change treatment based on this result.",
        "Get urgent help if severe or rapidly worsening symptoms appear."
      ],
      nextSteps: ["If symptoms persist, return, or worry you, arrange a doctor or qualified healthcare professional review.", "Share the symptom history and readings with them."],
      followUp: "Consult a doctor if symptoms persist or you remain concerned."
    }
  }[state];

  const feverGuidance = state !== "Emergency" && hasFever;
  const title = feverGuidance ? "Fever: steps that may help" : guidance.title;
  const summary = feverGuidance
    ? "Your symptom description mentions fever. These are general comfort measures; the triage result cannot identify the cause or decide which medicine is safe for you."
    : guidance.summary;
  const precautions = feverGuidance
    ? [
        "Rest and drink plenty of fluids; check your temperature and note when the fever started.",
        adultFever
          ? "For an adult, paracetamol (acetaminophen) may reduce discomfort. Use it only if it is normally safe for you and follow the exact product label; this app does not calculate a dose."
          : childFever
            ? "For a child, this app cannot safely choose a medicine or dose. Ask a pharmacist or clinician for an age- and weight-appropriate option and follow the child product label."
            : "If considering an over-the-counter fever medicine, ask a pharmacist or clinician which option is safe for the person; this app does not select a dose.",
        adultFever ? "Do not take more than one product containing paracetamol at the same time. Ask a pharmacist or doctor first if you are unsure, have other health conditions, take other medicines, or are pregnant." : "Do not use adult medicines or doses for a child; ask a pharmacist or clinician if unsure."
      ]
    : guidance.precautions;
  const nextSteps = feverGuidance
    ? [
        "Contact a doctor if the fever is getting worse, is not improving, or you are concerned; share the temperature, duration, and other symptoms.",
        "Seek urgent help now if severe symptoms develop. If VITAL says Emergency, follow the emergency guidance above."
      ]
    : guidance.nextSteps;
  const followUp = feverGuidance ? "Would you like to arrange or book a doctor review?" : guidance.followUp;

  return <section className={`care-guidance ${stateClass(state)}`} aria-labelledby="care-guidance-title">
    <div className="care-guidance-heading">
      <div><span>{feverGuidance ? "SYMPTOM GUIDANCE · FEVER" : "VITAL CARE GUIDANCE · GENERAL INFORMATION"}</span><h2 id="care-guidance-title">{title}</h2><p>{summary}</p></div>
      {state === "Emergency" ? <a className="guidance-emergency-link" href="tel:112"><PhoneCall />Call 112 in India</a> : null}
    </div>
    <div className="care-guidance-columns">
      <div><h3>{feverGuidance ? "What may help" : "Precautions"}</h3><ul>{precautions.map((item) => <li key={item}>{item}</li>)}</ul>{adultFever ? <p className="guidance-source">Sources: <a href="https://www.nhs.uk/symptoms/fever-in-adults/" target="_blank" rel="noreferrer">NHS adult fever advice</a> · <a href="https://www.nhs.uk/medicines/paracetamol-for-adults/" target="_blank" rel="noreferrer">NHS paracetamol guidance</a></p> : null}</div>
      <div><h3>{feverGuidance ? "When to contact a doctor" : "Possible next steps"}</h3><ul>{nextSteps.map((item) => <li key={item}>{item}</li>)}</ul><p className="doctor-followup"><Stethoscope />{followUp}</p></div>
    </div>
    <p className="care-guidance-note"><ShieldCheck />This general guidance is based only on the information entered. It is not a diagnosis or a substitute for professional care.</p>
  </section>;
}

function MedicationView({
  logs,
  markMedication,
  score,
  prescriptionText,
  setPrescriptionText,
  prescriptionPlan,
  analyzePrescription,
  setPrescriptionReviewed,
  updatePrescriptionDoseTime,
  updatePrescriptionDose,
  onDoseTimeSaved,
  referenceImages
}: {
  logs: MedicationLog[];
  markMedication: (status: MedicationLog["status"], confidence: number, label?: string, doseKey?: string) => void;
  score: number;
  prescriptionText: string;
  setPrescriptionText: (value: string) => void;
  prescriptionPlan: PrescriptionPlan | null;
  analyzePrescription: (text?: string) => Promise<void>;
  setPrescriptionReviewed: (reviewed: boolean) => void;
  updatePrescriptionDoseTime: (index: number, time: string) => void;
  updatePrescriptionDose: (index: number, field: keyof PrescriptionDose, value: string) => void;
  onDoseTimeSaved: (dose: PrescriptionDose, time: string) => void;
  referenceImages: MedicationReferenceImage[];
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraState, setCameraState] = useState("Camera idle");
  const [prescriptionUploadMessage, setPrescriptionUploadMessage] = useState("");
  const [analyzingPrescription, setAnalyzingPrescription] = useState(false);
  const [frameScore, setFrameScore] = useState(0);
  const [scanPhase, setScanPhase] = useState<"idle" | "scanning" | "matched" | "review">("idle");
  const [stableFrames, setStableFrames] = useState(0);
  const verifiedCount = logs.filter(
  (log) => log.status === "Verified"
).length;

const missedCount = logs.filter(
  (log) => log.status === "Missed"
).length;

const pendingCount = logs.filter(
  (log) => log.status === "Pending"
).length;

const photoCheckedCount = logs.filter(
  (log) => log.status === "Photo checked"
).length;

const totalLogs = logs.length;
const adherenceEventCount = logs.filter((log) => log.status !== "Photo checked").length;

const averageConfidence = totalLogs
  ? Math.round(
      logs.reduce((sum, log) => sum + log.confidence, 0) / totalLogs
    )
  : null;

const adherenceRate = adherenceEventCount
  ? Math.round((verifiedCount / adherenceEventCount) * 100)
  : 0;
  const [selectedDoseKey, setSelectedDoseKey] = useState("");
  const [visualProfiles, setVisualProfiles] = useStoredState<Record<string, MedicationVisualProfile>>("vital.medicationVisualProfiles.v1", {});
  const [imprintPhotoIndices, setImprintPhotoIndices] = useState<Record<string, number>>({});
  const [imprintBusyKey, setImprintBusyKey] = useState("");
  const seenPrescriptionAtRef = useRef(prescriptionPlan?.parsedAt);
  const enrollmentSectionRef = useRef<HTMLElement | null>(null);
  const [autoScan, setAutoScan] = useState(true);
  const trackerDoses = prescriptionPlan?.doses?.filter((dose) => dose.medication && !/review|unspecified|prescription medicine/i.test(dose.medication)) || [];
  const nearestDue = dueDose(prescriptionPlan);
  const selectedDose = trackerDoses.find((dose) => medicationDoseKey(dose) === selectedDoseKey) || nearestDue?.dose || trackerDoses[0] || null;
  const currentDue = selectedDose ? { dose: selectedDose, distance: Math.abs((minutesFromTime(selectedDose.time) ?? -1000) - (new Date().getHours() * 60 + new Date().getMinutes())) } : null;
  const dueLabel = currentDue ? `${currentDue.dose.medication} ${currentDue.dose.dose}` : "No analyzed prescription";
  const isDueWindow = currentDue ? currentDue.distance <= 45 : false;

  const referenceLabel = currentDue?.dose.medication || "No prescribed medicine";
  const referenceDose = currentDue?.dose.dose || "dose not set";
  const isHalfDose = Boolean(currentDue && /half|½|0\.5/i.test(`${currentDue.dose.dose} ${currentDue.dose.instructions}`));
  const visibleTrackerDoses = trackerDoses;
  const referenceSetupDoses = Array.from(new Map(trackerDoses.map((dose) => [medicationProfileKey(dose), dose])).values());
  const trackerDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return { date, key: localDateInputValue(date) };
  });
  const cameraDoseKey = currentDue ? medicationDoseKey(currentDue.dose) : "";
  const visualProfileKey = currentDue ? medicationProfileKey(currentDue.dose) : "";
  const activeVisualProfile = visualProfileKey ? visualProfiles[visualProfileKey] : undefined;
  const requiredReferenceSamples = 5;
  useEffect(() => {
    const parsedAt = prescriptionPlan?.parsedAt;
    if (!parsedAt || parsedAt === seenPrescriptionAtRef.current) return;
    seenPrescriptionAtRef.current = parsedAt;
    const firstIncomplete = referenceSetupDoses.find((dose) => (visualProfiles[medicationProfileKey(dose)]?.samples.length || 0) < requiredReferenceSamples);
    if (!firstIncomplete) return;
    setSelectedDoseKey(medicationDoseKey(firstIncomplete));
    setCameraState(`Prescription loaded. Capture five one-time reference photos for ${firstIncomplete.medication} ${firstIncomplete.dose}.`);
    window.setTimeout(() => enrollmentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
  }, [prescriptionPlan?.parsedAt]);
  const statusByDayDose = new Map<string, MedicationLog>();
  logs.forEach((log) => {
    if (log.dateKey && log.doseKey) {
      const key = `${log.dateKey}|${log.doseKey}`;
      if (!statusByDayDose.has(key)) statusByDayDose.set(key, log);
    }
  });

  async function startCamera() {
    if (!prescriptionPlan?.humanReviewed) {
      setCameraState("Review the prescription schedule before starting a medication camera check.");
      setScanPhase("review");
      return;
    }
    if (!currentDue) {
      setCameraState("Analyze a prescription first. Only its listed medicines can be checked.");
      setScanPhase("review");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("Camera unavailable in this browser. Open VITAL in Chrome/Brave or use manual verification.");
      setScanPhase("review");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if (autoScan && (activeVisualProfile?.samples.length ?? 0) >= requiredReferenceSamples && (!currentDue || isDueWindow)) {
        setCameraState("Reference profile ready. Place one loose tablet inside the reticle.");
        setScanPhase("scanning");
      } else {
        setCameraState((activeVisualProfile?.samples.length ?? 0) >= requiredReferenceSamples ? "Camera active. Automatic scan starts in the dose window." : "Camera active. Capture five confirmed reference views first.");
        setScanPhase("idle");
      }
    } catch (error) {
      const reason = error instanceof DOMException && error.name === "NotAllowedError" ? "Camera permission denied." : "Camera could not start.";
      setCameraState(`${reason} Use Chrome/Brave or fallback verification buttons.`);
      setScanPhase("review");
    }
  }

  function captureVisualReference() {
    if (!prescriptionPlan?.humanReviewed) {
      setCameraState("Review the prescription schedule before capturing a medicine reference.");
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!currentDue || !visualProfileKey || !video || !canvas || !video.videoWidth) {
      setCameraState("Start the camera and center the confirmed prescribed tablet before capturing a reference.");
      return;
    }
    const captureScale = Math.min(960 / video.videoWidth, 720 / video.videoHeight, 1);
    canvas.width = Math.max(1, Math.round(video.videoWidth * captureScale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * captureScale));
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    const signature = medicationImageSignature(frame.data, frame.width, frame.height);
    if (!signature) {
      setCameraState("Could not isolate a tablet. Center one confirmed loose tablet against a plain background and retry.");
      return;
    }
    const previous = visualProfiles[visualProfileKey];
    const samples = [...(previous?.samples || []), signature].slice(-12);
    // Keep a small compressed thumbnail alongside its visual descriptor so
    // each prescription item has a visible, reviewable reference of its own.
    const referencePhoto = canvas.toDataURL("image/jpeg", 0.76);
    const referencePhotos = [...(previous?.referencePhotos || []), referencePhoto].slice(-requiredReferenceSamples);
    setVisualProfiles({
      ...visualProfiles,
      [visualProfileKey]: { medication: currentDue.dose.medication, dose: currentDue.dose.dose, samples, referencePhotos, packagePhoto: previous?.packagePhoto, packageRead: previous?.packageRead, updatedAt: new Date().toISOString() }
    });
    setStableFrames(0);
    setFrameScore(0);
    setScanPhase("idle");
    setCameraState(samples.length >= requiredReferenceSamples
      ? `Local reference profile ready for ${currentDue.dose.medication} ${currentDue.dose.dose}. You can now run a visual comparison.`
      : `Reference view ${samples.length}/${requiredReferenceSamples} saved on this device. Change angle slightly for the next view.`);
  }

  async function uploadVisualReferencePhotos(event: ChangeEvent<HTMLInputElement>, dose: PrescriptionDose) {
    const input = event.currentTarget;
    const files = Array.from(input.files || []).filter((file) => file.type.startsWith("image/"));
    input.value = "";
    if (!files.length) return;
    const key = medicationProfileKey(dose);
    const previous = visualProfiles[key];
    const available = Math.max(0, requiredReferenceSamples - (previous?.samples.length || 0));
    if (!available) {
      setCameraState(`The reference set for ${dose.medication} is full. Clear it before replacing photos.`);
      return;
    }
    const signatureCanvas = document.createElement("canvas");
    signatureCanvas.width = 160;
    signatureCanvas.height = 120;
    const signatureContext = signatureCanvas.getContext("2d");
    const photoCanvas = document.createElement("canvas");
    const photoContext = photoCanvas.getContext("2d");
    if (!signatureContext || !photoContext) return;
    const addedSignatures: number[][] = [];
    const addedPhotos: string[] = [];
    for (const file of files.slice(0, available)) {
      try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(960 / bitmap.width, 960 / bitmap.height, 1);
        photoCanvas.width = Math.max(1, Math.round(bitmap.width * scale));
        photoCanvas.height = Math.max(1, Math.round(bitmap.height * scale));
        photoContext.fillStyle = "#f2f2f2";
        photoContext.fillRect(0, 0, photoCanvas.width, photoCanvas.height);
        photoContext.drawImage(bitmap, 0, 0, photoCanvas.width, photoCanvas.height);
        signatureContext.fillStyle = "#f2f2f2";
        signatureContext.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
        signatureContext.drawImage(bitmap, 0, 0, signatureCanvas.width, signatureCanvas.height);
        bitmap.close();
        const frame = signatureContext.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height);
        const signature = medicationImageSignature(frame.data, frame.width, frame.height);
        if (!signature) continue;
        addedSignatures.push(signature);
        addedPhotos.push(photoCanvas.toDataURL("image/jpeg", 0.76));
      } catch {
        // Skip unreadable/unsupported images and keep any usable references.
      }
    }
    if (!addedSignatures.length) {
      setCameraState(`No usable tablet photos were found for ${dose.medication}. Choose clear, well-lit images with one tablet visible.`);
      return;
    }
    const samples = [...(previous?.samples || []), ...addedSignatures].slice(-12);
    const referencePhotos = [...(previous?.referencePhotos || []), ...addedPhotos].slice(-requiredReferenceSamples);
    setVisualProfiles({
      ...visualProfiles,
      [key]: { medication: dose.medication, dose: dose.dose, samples, referencePhotos, packagePhoto: previous?.packagePhoto, packageRead: previous?.packageRead, updatedAt: new Date().toISOString() },
    });
    setSelectedDoseKey(medicationDoseKey(dose));
    setCameraState(`Saved ${addedSignatures.length} reference photo${addedSignatures.length === 1 ? "" : "s"} for ${dose.medication} · ${dose.dose}. Add photos for each other medicine separately.`);
    setScanPhase("idle");
  }

  async function readImprintForDose(dose: PrescriptionDose) {
    const key = medicationProfileKey(dose);
    const profile = visualProfiles[key];
    const photoIndex = Math.max(0, Math.min(imprintPhotoIndices[key] || 0, (profile?.referencePhotos?.length || 1) - 1));
    const photo = profile?.referencePhotos?.[photoIndex];
    const encoded = photo?.match(/^data:image\/jpeg;base64,([\s\S]+)$/i)?.[1];
    if (!encoded) {
      setCameraState(`Upload a clear reference photo for ${dose.medication} first.`);
      return;
    }
    setImprintBusyKey(key);
    try {
      const result = await readTabletImprint(encoded);
      const imprintResult: TabletImprintResult = { ...result, checkedAt: new Date().toISOString() };
      setVisualProfiles((current) => ({
        ...current,
        [key]: { ...(current[key] || profile!), medication: dose.medication, dose: dose.dose, imprintResult, updatedAt: new Date().toISOString() },
      }));
    } catch (error) {
      setCameraState(error instanceof Error ? error.message : "Could not read the tablet imprint. Try a sharper close-up photo.");
    } finally {
      setImprintBusyKey("");
    }
  }

  async function uploadPackagePhoto(event: ChangeEvent<HTMLInputElement>, dose: PrescriptionDose) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    const key = medicationProfileKey(dose);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1200 / bitmap.width, 1200 / bitmap.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) { bitmap.close(); return; }
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const packagePhoto = canvas.toDataURL("image/jpeg", 0.78);
      setVisualProfiles((current) => ({
        ...current,
        [key]: { ...(current[key] || { medication: dose.medication, dose: dose.dose, samples: [], updatedAt: new Date().toISOString() }), packagePhoto, packageRead: undefined, updatedAt: new Date().toISOString() },
      }));
    } catch {
      setCameraState("Could not prepare that package photo. Try a clear JPG or PNG image.");
    }
  }

  async function readPackageLabelForDose(dose: PrescriptionDose) {
    const key = medicationProfileKey(dose);
    const profile = visualProfiles[key];
    const encoded = profile?.packagePhoto?.match(/^data:image\/jpeg;base64,([\s\S]+)$/i)?.[1];
    if (!encoded) {
      setCameraState(`Upload a package or tablet-strip photo for ${dose.medication} first.`);
      return;
    }
    setImprintBusyKey(key);
    try {
      const result = await readMedicinePackageLabel(encoded);
      const normalize = (value: string) => value.toLocaleLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
      const recognizedName = normalize(result.medicineName);
      const expectedNameTokens = dose.medication.toLocaleLowerCase().split(/[^a-z0-9]+/i).filter((part) => part.length > 2);
      const namePresent = expectedNameTokens.length > 0 && expectedNameTokens.every((part) => recognizedName.includes(normalize(part)));
      const expectedStrength = dose.dose.match(/\d+(?:\.\d+)?\s*(?:mg|mcg|µg|g|ml|iu)\b/i)?.[0] || "";
      const normalizedExpectedStrength = normalize(expectedStrength);
      const normalizedPackageStrength = normalize(result.strength);
      const strengthPresent = Boolean(normalizedExpectedStrength && normalizedPackageStrength.includes(normalizedExpectedStrength));
      const printedStrengths = result.strength.match(/\d+(?:\.\d+)?\s*(?:mg|mcg|µg|g|ml|iu)\b/gi) || [];
      const hasDifferentStrength = Boolean(namePresent && expectedStrength && printedStrengths.length && !printedStrengths.some((value) => normalize(value) === normalizedExpectedStrength));
      const comparison: PackageLabelResult["comparison"] = result.confidence === "low"
        ? "review"
        : hasDifferentStrength ? "possible-mismatch"
        : namePresent && strengthPresent ? "consistent" : "review";
      const packageRead: PackageLabelResult = { ...result, comparison, checkedAt: new Date().toISOString() };
      setVisualProfiles((current) => ({
        ...current,
        [key]: { ...(current[key] || profile!), medication: dose.medication, dose: dose.dose, packageRead, updatedAt: new Date().toISOString() },
      }));
    } catch (error) {
      setCameraState(error instanceof Error ? error.message : "Could not read the package text. Try a sharper photo.");
    } finally {
      setImprintBusyKey("");
    }
  }

  function clearVisualReference() {
    if (!visualProfileKey) return;
    const next = { ...visualProfiles };
    delete next[visualProfileKey];
    setVisualProfiles(next);
    setScanPhase("idle");
    setFrameScore(0);
    setCameraState("Reference profile cleared. Capture five confirmed views to rebuild it.");
  }

  async function handlePrescriptionUpload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    input.value = "";
    if (!files.length) return;
    // A newly selected prescription supersedes the previous approval. Disable
    // reminders and phone sync immediately, before OCR or parsing begins.
    setPrescriptionReviewed(false);
    if (files.length > 6) {
      setPrescriptionUploadMessage("Upload up to six prescription page photos at a time.");
      return;
    }
    const file = files[0];
    if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
      if (files.length !== 1) {
        setPrescriptionUploadMessage("Upload one text file at a time.");
        return;
      }
      setPrescriptionText(await file.text());
      setPrescriptionUploadMessage("Prescription text loaded. Check it against the original before using this schedule.");
    } else if (files.every((candidate) => ["image/jpeg", "image/png", "image/webp"].includes(candidate.type))) {
      setAnalyzingPrescription(true);
      setPrescriptionUploadMessage(`Reading ${files.length} prescription page photo${files.length === 1 ? "" : "s"} with local Ollama. The images stay on this computer.`);
      try {
        const pages: string[] = [];
        const unclearPages: string[] = [];
        let confidence: "low" | "medium" | "high" = "high";
        let modelId = "";
        for (const [index, page] of files.entries()) {
          setPrescriptionUploadMessage(`Reading prescription page ${index + 1} of ${files.length} with local Ollama. Handwriting can take up to a minute; keep this page open…`);
          const bitmap = await createImageBitmap(page);
          const canvas = document.createElement("canvas");
          let scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
          let jpegBase64 = "";
          for (let attempt = 0; attempt < 6; attempt += 1) {
            canvas.width = Math.max(1, Math.round(bitmap.width * scale));
            canvas.height = Math.max(1, Math.round(bitmap.height * scale));
            const context = canvas.getContext("2d");
            if (!context) throw new Error("This browser could not prepare the prescription image.");
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.84 - attempt * 0.06);
            jpegBase64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
            if (jpegBase64.length <= 950_000) break;
            scale *= 0.78;
          }
          bitmap.close();
          if (!jpegBase64 || jpegBase64.length > 950_000) throw new Error(`Prescription page ${index + 1} is too large to process. Choose a smaller photo.`);
          const result = await extractPrescriptionImage(jpegBase64);
          modelId = result.modelId;
          pages.push(`--- Prescription page ${index + 1} ---\n${result.transcription}`);
          if (result.unclear.length) unclearPages.push(`Page ${index + 1}: ${result.unclear.join("; ")}`);
          if (result.confidence === "low") confidence = "low";
          else if (result.confidence === "medium" && confidence === "high") confidence = "medium";
        }
        const transcription = pages.join("\n\n");
        setPrescriptionText(transcription);
        const unclearNote = unclearPages.length ? ` Unclear spans: ${unclearPages.join(" | ")}.` : "";
        setPrescriptionUploadMessage(`Photo read · ${modelId} · creating a reviewable schedule now…`);
        await analyzePrescription(transcription);
        setPrescriptionUploadMessage(`${files.length} page${files.length === 1 ? "" : "s"} read · ${modelId} · ${confidence} model confidence. Check the transcription and every dose against the original before confirming.${unclearNote}`);
      } catch (error) {
        setPrescriptionUploadMessage(error instanceof Error ? error.message : "Could not read that prescription image. Try a sharper, well-lit photo.");
      } finally {
        setAnalyzingPrescription(false);
      }
    } else {
      setPrescriptionUploadMessage("Choose a JPG, PNG, WebP, or plain-text prescription file.");
    }
  }

  async function runPrescriptionAnalysis() {
    if (!prescriptionText.trim()) {
      setPrescriptionUploadMessage("Paste the medicine name and prescription instructions first.");
      return;
    }
    setAnalyzingPrescription(true);
    setPrescriptionUploadMessage("Reading the prescription and updating the schedule…");
    try {
      await analyzePrescription();
      setPrescriptionUploadMessage("Schedule updated. Confirm every medicine, strength, and timing against the original prescription.");
    } catch {
      setPrescriptionUploadMessage("Could not reach the prescription service. Please try again.");
    } finally {
      setAnalyzingPrescription(false);
    }
  }

  function analyzeFrame() {
    if (!prescriptionPlan?.humanReviewed) {
      setCameraState("Check the prescription schedule and confirm your review before starting a tablet check.");
      setScanPhase("review");
      return;
    }
    if (!currentDue) {
      setCameraState("Analyze a prescription first. Only its listed medicines can be checked.");
      setScanPhase("review");
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) {
      setCameraState("No live frame detected. Start the camera or use manual confirmation.");
      setScanPhase("review");
      return;
    }
    canvas.width = 160;
    canvas.height = 120;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let centerMass = 0;
    let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
    // Estimate the scene/background from the outer frame first. The previous
    // brightness-only mask treated a bright table or wall as the tablet.
    let backgroundSamples = 0;
    let backgroundR = 0;
    let backgroundG = 0;
    let backgroundB = 0;
    for (let i = 0; i < image.data.length; i += 4) {
      const x = (i / 4) % canvas.width;
      const y = Math.floor(i / 4 / canvas.width);
      if (x < 24 || x > 136 || y < 18 || y > 102) {
        backgroundSamples += 1;
        backgroundR += image.data[i];
        backgroundG += image.data[i + 1];
        backgroundB += image.data[i + 2];
      }
    }
    const sceneR = backgroundR / Math.max(backgroundSamples, 1);
    const sceneG = backgroundG / Math.max(backgroundSamples, 1);
    const sceneB = backgroundB / Math.max(backgroundSamples, 1);
    for (let i = 0; i < image.data.length; i += 4) {
      const r = image.data[i];
      const g = image.data[i + 1];
      const b = image.data[i + 2];
      const brightness = (r + g + b) / 3;
      const x = (i / 4) % canvas.width;
      const y = Math.floor(i / 4 / canvas.width);
      const sceneDistance = Math.sqrt((r - sceneR) ** 2 + (g - sceneG) ** 2 + (b - sceneB) ** 2);
      const warmCandidate = r > b * 1.12 && g > b * 1.03;
      const candidate = brightness > 92 && (sceneDistance > 18 || warmCandidate);
      if (x > 28 && x < 132 && y > 20 && y < 100 && candidate) {
        centerMass += 1;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
    const objectRatio = centerMass / (canvas.width * canvas.height);
    const objectWidth = Math.max(0, maxX - minX);
    const objectHeight = Math.max(0, maxY - minY);
    const compactObject = objectWidth > 10 && objectHeight > 8 && objectWidth < 110 && objectHeight < 88;
    const pillPresent = centerMass >= (isHalfDose ? 45 : 90) && objectRatio < 0.30 && compactObject;
    if (!pillPresent) {
      setFrameScore(0); setStableFrames(0); setScanPhase(autoScan && (!currentDue || isDueWindow) ? "scanning" : "idle");
      setCameraState("No pill detected · centre one loose tablet in the reticle");
      return;
    }
    if (!activeVisualProfile || activeVisualProfile.samples.length < requiredReferenceSamples) {
      setFrameScore(0); setStableFrames(0); setScanPhase("review");
      setCameraState(`No trained reference for ${referenceLabel} ${referenceDose}. Capture ${requiredReferenceSamples} confirmed reference views first.`);
      return;
    }
    const liveSignature = medicationImageSignature(image.data, image.width, image.height);
    if (!liveSignature) {
      setFrameScore(0); setStableFrames(0); setScanPhase("review");
      setCameraState("Could not isolate the tablet for comparison. Use a plain background and center the pill.");
      return;
    }
    const nearestScores = activeVisualProfile.samples
      .map((sample) => medicationProfileSimilarity(liveSignature, sample))
      .sort((a, b) => b - a)
      .slice(0, 3);
    const similarity = Math.round(nearestScores.reduce((sum, value) => sum + value, 0) / nearestScores.length * 100);
    setFrameScore(similarity);
    const nextStable = similarity >= 78 ? stableFrames + 1 : 0;
    setStableFrames(nextStable);
    if (nextStable >= 3) {
      setScanPhase("matched");
      setCameraState(`Visual appearance resembles the saved ${referenceLabel} reference (${similarity}%). Check the medicine label before use.`);
      markMedication("Photo checked", similarity, `${referenceLabel} ${referenceDose} · reference-image similarity only`, cameraDoseKey);
    } else {
      setScanPhase(similarity >= 78 ? "scanning" : "review");
      setCameraState(similarity >= 78
        ? `Similar appearance (${similarity}%). Confirm the printed medicine/strength; ${nextStable}/3 stable views.`
        : `Appearance differs from the saved reference (${similarity}%). Do not rely on this result; check with a pharmacist or caregiver.`);
      if (nextStable === 0 || nextStable === 2) markMedication("Pending", similarity, `${referenceLabel} · visual comparison needs review`, cameraDoseKey);
    }
  }

  useEffect(() => {
    if (scanPhase !== "scanning") return;
    const timer = window.setInterval(() => analyzeFrame(), 850);
    return () => window.clearInterval(timer);
  }, [scanPhase, stableFrames, referenceLabel, referenceDose, isDueWindow, autoScan, activeVisualProfile, cameraDoseKey, currentDue, requiredReferenceSamples]);

  return (
    <div className="two-column medication-page">
      {/* ================= MEDICATION ADHERENCE DASHBOARD ================= */}

<Panel
  title="Medication Adherence Dashboard"
  kicker="patient medication overview"
>
  <div className="med-adherence-dashboard">

    <div className="med-adherence-hero">
      {adherenceEventCount ? (
        <ScoreRing score={adherenceRate} label="adherence" suffix="%" />
      ) : (
        <div className="med-adherence-empty" aria-label="No dose check-ins yet">
          <strong>—</strong>
          <span>No dose check-ins</span>
        </div>
      )}

      <div className="med-adherence-summary">
        <span className="section-kicker">
          DOSES MARKED TAKEN
        </span>

        <strong>{adherenceEventCount ? `${verifiedCount} / ${adherenceEventCount}` : "—"}</strong>

        <p>prescribed dose check-ins</p>
      </div>
    </div>

    <div className="med-stat-grid">

      <div className="med-stat verified">
        <div className="med-stat-icon">
          <Check />
        </div>

        <div>
          <span>Confirmed</span>
          <strong>{verifiedCount}</strong>
          <small>Marked taken by you</small>
        </div>
      </div>

      <div className="med-stat photo-checked">
        <div className="med-stat-icon">
          <Camera />
        </div>

        <div>
          <span>Photo checked</span>
          <strong>{photoCheckedCount}</strong>
          <small>Tablet image matched</small>
        </div>
      </div>

      <div className="med-stat missed">
        <div className="med-stat-icon">
          <X />
        </div>

        <div>
          <span>Missed</span>
          <strong>{missedCount}</strong>
          <small>Missed doses</small>
        </div>
      </div>

      <div className="med-stat pending">
        <div className="med-stat-icon">
          <TimerReset />
        </div>

        <div>
          <span>Pending</span>
          <strong>{pendingCount}</strong>
          <small>Need review</small>
        </div>
      </div>

      <div className="med-stat confidence">
        <div className="med-stat-icon">
          <ShieldCheck />
        </div>

        <div>
          <span>Avg. confidence</span>
          <strong>{averageConfidence === null ? "—" : `${averageConfidence}%`}</strong>
          <small>Verification confidence</small>
        </div>
      </div>

    </div>

    <div className="med-status-section">

      <div className="med-status-heading">
        <div>
          <strong>Medication activity</strong>
          <span>Current verification distribution</span>
        </div>

        <span>{totalLogs} events</span>
      </div>

      <div className="med-status-bars">

        <div className="med-status-row">
          <span>Verified</span>

          <div className="med-status-track">
            <i
              className="verified"
              style={{
                width: `${totalLogs ? (verifiedCount / totalLogs) * 100 : 0}%`
              }}
            />
          </div>

          <strong>{verifiedCount}</strong>
        </div>

        <div className="med-status-row">
          <span>Missed</span>

          <div className="med-status-track">
            <i
              className="missed"
              style={{
                width: `${totalLogs ? (missedCount / totalLogs) * 100 : 0}%`
              }}
            />
          </div>

          <strong>{missedCount}</strong>
        </div>

        <div className="med-status-row">
          <span>Photo checked</span>

          <div className="med-status-track">
            <i className="photo-checked" style={{ width: `${totalLogs ? (photoCheckedCount / totalLogs) * 100 : 0}%` }} />
          </div>

          <strong>{photoCheckedCount}</strong>
        </div>

        <div className="med-status-row">
          <span>Pending</span>

          <div className="med-status-track">
            <i
              className="pending"
              style={{
                width: `${totalLogs ? (pendingCount / totalLogs) * 100 : 0}%`
              }}
            />
          </div>

          <strong>{pendingCount}</strong>
        </div>

      </div>

    </div>

  </div>
  <section className="dose-checkins" aria-label="Daily medication check-ins">
    <div className="dose-checkins-heading"><div><span className="section-kicker">DAILY CHECK-IN</span><h3>Medication tracker</h3><p>A camera match fills a box automatically. It records a visual check, not proof that a dose was taken.</p></div><span className="dose-checkins-range">Last 7 days</span></div>
    <div className="dose-checkins-scroll" role="region" aria-label="Seven day medication check grid" tabIndex={0}>
      <div className="dose-checkins-grid" style={{ "--dose-day-count": trackerDays.length } as CSSProperties}>
        <div className="dose-checkins-label"><strong>Scheduled dose</strong></div>
        {trackerDays.map(({ date, key }) => <div className="dose-checkins-day" key={key}><strong>{key === localDateInputValue(new Date()) ? "Today" : date.toLocaleDateString(undefined, { weekday: "short" })}</strong><small>{date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small></div>)}
        {visibleTrackerDoses.map((dose) => {
          const doseKey = medicationDoseKey(dose);
          return <Fragment key={doseKey}>
            <div className="dose-checkins-label"><strong>{dose.medication}</strong><small>{dose.time}{dose.dose ? ` · ${dose.dose}` : " · daily"}</small></div>
            {trackerDays.map(({ key }) => {
              const record = statusByDayDose.get(`${key}|${doseKey}`);
              const checked = record?.status === "Photo checked" || record?.status === "Verified";
              const missed = record?.status === "Missed";
              return <div className={`dose-check-cell ${checked ? "checked" : missed ? "missed" : record ? "pending" : ""}`} key={`${doseKey}-${key}`} role="img" aria-label={`${dose.medication} ${key}: ${checked ? record?.status === "Photo checked" ? "photo checked; dose not confirmed taken" : "marked taken" : missed ? "marked missed" : record ? "needs review" : "no check-in recorded"}`} title={checked ? record?.status === "Photo checked" ? "Photo match only · does not confirm the dose was taken" : "Marked taken" : missed ? "Marked missed" : record ? "Needs review" : "No check-in"}>
                {checked ? <Check /> : missed ? <X /> : record ? <span>·</span> : null}
              </div>;
            })}
          </Fragment>;
        })}
      </div>
    </div>
    <div className="dose-checkins-legend"><span><i className="checked" />Photo checked</span><span><i className="taken" />Marked taken</span><span><i className="missed" />Missed</span><span><i className="empty" />No check-in</span></div>
    {!trackerDoses.length ? <p className="dose-checkins-hint">Analyze a prescription to display its prescribed medicines and dose check-ins here.</p> : null}
  </section>
</Panel>

{/* ================= END MEDICATION DASHBOARD ================= */}
      <Panel title="Your medication schedule" kicker="Check every detail against your prescription">
    <div className="prescription-grid">
          <label className="upload-strip">
            <Upload />
            <span>Upload doctor’s prescription page photos or text</span>
            <input type="file" multiple disabled={analyzingPrescription} accept=".txt,text/plain,image/jpeg,image/png,image/webp" onChange={(event) => void handlePrescriptionUpload(event)} />
          </label>
          <textarea
            value={prescriptionText}
            onChange={(event) => {
              setPrescriptionText(event.target.value);
              setPrescriptionReviewed(false);
            }}
            rows={7}
            placeholder="Paste prescription text: medicine, dose, frequency, timing"
          />
          <p className="safety-note">Prescription photos are processed by the local Ollama model on this computer. Review and correct the extracted text before analyzing; handwritten or unclear details must be checked against the original. VITAL never fills in missing dose times.</p>
          <div className="button-row">
            <ActionButton icon={<FileText />} onClick={() => void runPrescriptionAnalysis()} disabled={analyzingPrescription}>{analyzingPrescription ? "Reading prescription…" : "Analyze prescription"}</ActionButton>
          </div>
        </div>
        {prescriptionUploadMessage ? <p className={`safety-note prescription-upload-status${analyzingPrescription ? " is-processing" : ""}`} role="status" aria-live="polite">{analyzingPrescription ? <span className="auth-spinner" aria-hidden="true" /> : null}{prescriptionUploadMessage}</p> : null}
        {prescriptionPlan ? (
          <div className="schedule-panel">
            <div>
              <strong>{prescriptionPlan.summary}</strong>
              <span>{prescriptionPlan.engine} · Compare every detail with the doctor’s original prescription. Your schedule saves on this device.</span>
            </div>
            <div className="dose-list">
              {prescriptionPlan.doses.map((dose, index) => (
                <article key={`${dose.medication}-${dose.time}-${index}`} className={currentDue?.dose === dose ? "due" : ""}>
                  <TimerReset />
                  <div className="dose-edit-grid">
                    <label>Medicine name<input value={dose.medication} aria-label={`Medicine name for prescription item ${index + 1}`} onChange={(event) => updatePrescriptionDose(index, "medication", event.target.value)} /></label>
                    <label>Strength / dose<input value={dose.dose} aria-label={`Strength or dose for ${dose.medication}`} onChange={(event) => updatePrescriptionDose(index, "dose", event.target.value)} /></label>
                    <label>Directions<input value={dose.instructions} aria-label={`Directions for ${dose.medication}`} onChange={(event) => updatePrescriptionDose(index, "instructions", event.target.value)} /></label>
                  </div>
                  <label className="dose-time-field">
                    <span>Dose time</span>
                    <input
                      type="time"
                      value={/^([01]\d|2[0-3]):[0-5]\d$/.test(dose.time) ? dose.time : ""}
                      aria-label={`Dose time for ${dose.medication} ${dose.dose}`}
                      onChange={(event) => updatePrescriptionDoseTime(index, event.target.value)}
                      onBlur={(event) => {
                        const nextTime = event.currentTarget.value;
                        if (nextTime && nextTime !== dose.time) onDoseTimeSaved(dose, nextTime);
                      }}
                    />
                  </label>
                </article>
              ))}
            </div>
            <label className="setting-toggle prescription-review-confirm">
              <span><strong>Human review required</strong><small>I checked every medicine, strength, direction, frequency, and duration against the original. I set any reminder time that was not explicitly written.</small></span>
              <input type="checkbox" checked={Boolean(prescriptionPlan.humanReviewed)} onChange={(event) => setPrescriptionReviewed(event.target.checked)} />
            </label>
            {prescriptionPlan.warnings?.length ? <ul className="prescription-review-warnings">{prescriptionPlan.warnings.map((warning, index) => <li key={`${index}-${warning}`}>{warning}</li>)}</ul> : null}
            {!prescriptionPlan.humanReviewed ? <p className="safety-note">Medication reminders, SMS, and phone sync stay disabled until you confirm the schedule above.</p> : null}
          </div>
        ) : null}
        {referenceSetupDoses.length ? <section className="prescription-reference-setup">
          <div><span className="section-kicker">ONE-TIME SETUP</span><h3>Verify package text for each medicine</h3><p>For each prescription item, take a separate photo of its box or strip with the printed medicine name and strength in focus. VITAL transcribes the visible package text locally and compares it with that prescription row. It reports “text appears consistent,” “possible strength mismatch,” or “needs manual review.” Also upload tablet photos if you want an optional visual appearance comparison; that comparison does not identify a pill.</p></div>
          <div className="prescription-reference-list">{referenceSetupDoses.map((dose) => {
            const profile = visualProfiles[medicationProfileKey(dose)];
            const count = Math.min(profile?.samples.length || 0, requiredReferenceSamples);
            const ready = count >= requiredReferenceSamples;
            return <article key={medicationProfileKey(dose)} className={ready ? "ready" : ""}>
              <div className="prescription-reference-item"><strong>{dose.medication} · {dose.dose}</strong><span>{ready ? "Reference ready · reused for scheduled doses" : `${count}/${requiredReferenceSamples} reference photos added`}</span>{profile?.referencePhotos?.length ? <div className="prescription-reference-thumbnails" aria-label={`Saved reference photos for ${dose.medication}`}>
                {profile.referencePhotos.map((photo, photoIndex) => <a key={`${medicationProfileKey(dose)}-${photoIndex}`} href={photo} target="_blank" rel="noreferrer" aria-label={`Open enlarged reference photo ${photoIndex + 1} for ${dose.medication}`}><img src={photo} alt={`${dose.medication} ${dose.dose} reference photo ${photoIndex + 1}`} /></a>)}
              </div> : null}</div>
              {profile?.referencePhotos?.length ? <div className="imprint-tools">
                {profile.referencePhotos.length > 1 ? <label>Photo<select value={imprintPhotoIndices[medicationProfileKey(dose)] || 0} onChange={(event) => setImprintPhotoIndices((current) => ({ ...current, [medicationProfileKey(dose)]: Number(event.target.value) }))}>{profile.referencePhotos.map((_, photoIndex) => <option value={photoIndex} key={photoIndex}>Photo {photoIndex + 1}</option>)}</select></label> : null}
                <button type="button" disabled={!prescriptionPlan?.humanReviewed || imprintBusyKey === medicationProfileKey(dose)} onClick={() => void readImprintForDose(dose)}>{imprintBusyKey === medicationProfileKey(dose) ? "Reading…" : "Read imprint"}</button>
              </div> : null}
              {profile?.imprintResult ? <p className={`imprint-result ${profile.imprintResult.readable ? "readable" : "unreadable"}`} role="status"><strong>{profile.imprintResult.readable ? `Visible imprint: “${profile.imprintResult.imprint}”` : "Imprint not readable"}</strong><span>{profile.imprintResult.readable ? `OCR confidence: ${profile.imprintResult.confidence}. Compare every character with the labeled pack.` : "Try a sharper close-up of the marked side. Do not guess from this result."}</span><small>{profile.imprintResult.note}</small></p> : null}
              <div className="package-label-check">
                <strong>Package label · {dose.medication}</strong>
                <span>Photograph this medicine’s own box or strip with its printed name and strength visible.</span>
                {profile?.packagePhoto ? <a className="package-label-photo" href={profile.packagePhoto} target="_blank" rel="noreferrer"><img src={profile.packagePhoto} alt={`Package label reference for ${dose.medication} ${dose.dose}`} /><small>Open package photo</small></a> : null}
                <label className="reference-photo-upload">{profile?.packagePhoto ? "Replace package photo" : "Upload package photo"}<input type="file" accept="image/*" capture="environment" disabled={!prescriptionPlan?.humanReviewed} aria-label={`Upload package or strip photo for ${dose.medication} ${dose.dose}`} onChange={(event) => void uploadPackagePhoto(event, dose)} /></label>
                {profile?.packagePhoto ? <button type="button" className="package-read-button" disabled={!prescriptionPlan?.humanReviewed || imprintBusyKey === medicationProfileKey(dose)} onClick={() => void readPackageLabelForDose(dose)}>{imprintBusyKey === medicationProfileKey(dose) ? "Reading label…" : "Read label and compare"}</button> : null}
                {profile?.packageRead ? <div className={`package-label-result ${profile.packageRead.comparison}`} role="status">
                  <strong>{profile.packageRead.comparison === "consistent" ? "Package text appears consistent" : profile.packageRead.comparison === "possible-mismatch" ? "Possible strength mismatch · check the label" : "Unable to confirm · review the package manually"}</strong>
                  <span>OCR name: {profile.packageRead.medicineName || "not clearly read"} · Strength: {profile.packageRead.strength || "not clearly read"} · Confidence: {profile.packageRead.confidence}</span>
                  {profile.packageRead.transcription ? <small>Transcribed: {profile.packageRead.transcription}</small> : null}
                  <small>{profile.packageRead.note}</small>
                </div> : null}
              </div>
              <label className="reference-photo-upload">{profile?.referencePhotos?.length ? "Add photos" : "Upload photos"}<input type="file" accept="image/*" capture="environment" multiple disabled={!prescriptionPlan?.humanReviewed || count >= requiredReferenceSamples} aria-label={`Upload reference photos for ${dose.medication} ${dose.dose}`} onChange={(event) => void uploadVisualReferencePhotos(event, dose)} /></label>
              <button onClick={() => { setSelectedDoseKey(medicationDoseKey(dose)); setStableFrames(0); setFrameScore(0); setScanPhase("idle"); setCameraState("Confirm this medicine on its pack, start the camera, then capture five reference views."); document.getElementById("pill-model-enrollment")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>
                {ready ? "Review profile" : "Set up references"}
              </button>
            </article>;
          })}</div>
        </section> : null}
        {(() => {
          const parsedMedicine = prescriptionPlan?.doses?.[0]?.medication || "";
          const usableMedicine = /review|unspecified|prescription medicine/i.test(parsedMedicine) ? "" : parsedMedicine;
          const fallbackMedicine = /paracip/i.test(prescriptionText) ? "ParaCIP" : /celin/i.test(prescriptionText) ? "Celin" : "";
          const accessMedicine = usableMedicine || fallbackMedicine;
          return accessMedicine ? <div className="medicine-access">
          <div><strong>Find this exact medicine</strong><span>{accessMedicine} · {prescriptionPlan?.doses?.[0]?.dose || "strength from prescription"}</span></div>
          <div className="access-links">
            <a href={`https://www.1mg.com/search/all?name=${encodeURIComponent(`${accessMedicine} ${prescriptionPlan?.doses?.[0]?.dose || ""}`)}`} target="_blank" rel="noreferrer">Tata 1mg ↗</a>
            <a href={`https://pharmeasy.in/search/all?name=${encodeURIComponent(accessMedicine)}`} target="_blank" rel="noreferrer">PharmEasy ↗</a>
            <a href={`https://www.netmeds.com/catalogsearch/result/${encodeURIComponent(accessMedicine)}`} target="_blank" rel="noreferrer">Netmeds ↗</a>
            <a href={`https://www.google.com/maps/search/pharmacy+${encodeURIComponent(accessMedicine)}`} target="_blank" rel="noreferrer">Nearby pharmacy ↗</a>
          </div>
          <small>Links open a live search for the parsed name and strength. Confirm brand, dosage, prescription requirement, and stock with the pharmacy.</small>
        </div> : null;
        })()}
        {prescriptionPlan?.doses?.slice(1).filter((dose) => !/review|unspecified|prescription medicine/i.test(dose.medication)).map((dose) => {
          const query = `${dose.medication} ${dose.dose}`;
          return <div className="medicine-access medicine-access-secondary" key={query}><div><strong>Find this prescribed medicine</strong><span>{query}</span></div><div className="access-links"><a href={`https://www.1mg.com/search/all?name=${encodeURIComponent(query)}`} target="_blank" rel="noreferrer">Tata 1mg ↗</a><a href={`https://pharmeasy.in/search/all?name=${encodeURIComponent(query)}`} target="_blank" rel="noreferrer">PharmEasy ↗</a><a href={`https://www.netmeds.com/catalogsearch/result/${encodeURIComponent(query)}`} target="_blank" rel="noreferrer">Netmeds ↗</a></div></div>;
        })}
      </Panel>
      <Panel title="Prescription-linked tablet check" kicker="Local reference comparison · not proof of pill identity or ingestion">
        {currentDue ? (
          <div className={`due-banner ${isDueWindow ? "active" : ""}`}>
            <BellRing />
            <div>
              <strong>{isDueWindow ? "Dose window active" : "Next scheduled dose"}</strong>
              <span>{currentDue.dose.time} · {dueLabel}</span>
            </div>
          </div>
        ) : null}
        <div className={`camera-box ${scanPhase}`}>
          <video ref={videoRef} muted playsInline />
          <canvas ref={canvasRef} hidden />
          <div className="scan-reticle" aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="camera-overlay">
            <Camera />
            <span>{cameraState}</span>
          </div>
        </div>
        {trackerDoses.length ? <label className="camera-dose-select">Prescribed medicine to check
          <select value={currentDue ? medicationDoseKey(currentDue.dose) : ""} onChange={(event) => { setSelectedDoseKey(event.target.value); setStableFrames(0); setFrameScore(0); setScanPhase("idle"); setCameraState("Selected prescription item. Confirm its label and capture reference views."); }}>
            {trackerDoses.map((dose) => <option value={medicationDoseKey(dose)} key={medicationDoseKey(dose)}>{dose.medication} · {dose.dose} · {dose.time}</option>)}
          </select>
        </label> : <p className="camera-prescription-required">Analyze a prescription above to choose a prescribed medicine. Camera checks are unavailable until a prescription schedule exists.</p>}
        <div className="vision-readout">
          <div><span>Reference</span><strong>{referenceLabel}</strong><small>{isHalfDose ? "½ tablet · split dose" : referenceDose}</small></div>
          <div><span>Visual similarity</span><strong>{frameScore ? `${frameScore}%` : "—"}</strong><small>compared with enrolled views</small></div>
          <div><span>Appearance check</span><strong className={scanPhase === "matched" ? "good" : "pending"}>{scanPhase === "matched" ? "SIMILAR" : "REVIEW"}</strong><small>confirm printed name and strength</small></div>
        </div>
        <section className="pill-model-enrollment" id="pill-model-enrollment" ref={enrollmentSectionRef}>
          <div><strong>{(activeVisualProfile?.samples.length || 0) >= requiredReferenceSamples ? "Saved reference for this medicine" : "One-time medicine reference setup"}</strong><p>{(activeVisualProfile?.samples.length || 0) >= requiredReferenceSamples ? "This medicine’s saved reference will be reused for later camera checks. You do not need to capture it again at each dose." : "Confirm the medicine and strength on its labeled pack with a caregiver or pharmacist. Start the camera once, keep the same tablet in view, and capture five photos from slightly different angles."}</p></div>
          <div className="pill-model-status"><span>{Math.min(activeVisualProfile?.samples.length || 0, requiredReferenceSamples)}/{requiredReferenceSamples} reference photos</span><small>{(activeVisualProfile?.samples.length || 0) >= requiredReferenceSamples && activeVisualProfile ? `Saved on this browser · ${new Date(activeVisualProfile.updatedAt).toLocaleDateString()}` : "Complete this setup before the first visual dose check"}</small></div>
          <div className="button-row">
            {(activeVisualProfile?.samples.length || 0) < requiredReferenceSamples ? <ActionButton icon={<Camera />} onClick={captureVisualReference} variant="secondary" disabled={!currentDue || !prescriptionPlan?.humanReviewed}>Capture reference photo</ActionButton> : null}
            <ActionButton icon={<X />} onClick={clearVisualReference} variant="ghost" disabled={!activeVisualProfile?.samples.length}>Clear reference profile</ActionButton>
          </div>
          <small className="pill-model-caveat">VITAL stores compressed reference thumbnails and visual features locally in this browser, separately for each medicine and strength. This is a visual similarity aid—not a medical-grade pill identifier. Lookalike pills may still pass; check the package/label every time. A visual check cannot prove ingestion.</small>
        </section>
        <div className="button-row">
          <ActionButton icon={<Camera />} onClick={startCamera} disabled={!currentDue || !prescriptionPlan?.humanReviewed}>Start camera</ActionButton>
          <ActionButton icon={<ScanIcon />} onClick={analyzeFrame} variant="secondary" disabled={!currentDue || !prescriptionPlan?.humanReviewed || (activeVisualProfile?.samples.length || 0) < requiredReferenceSamples}>Analyze frame</ActionButton>
          <label className="auto-scan-toggle"><input type="checkbox" checked={autoScan} disabled={!prescriptionPlan?.humanReviewed} onChange={(event) => setAutoScan(event.target.checked)} /> Auto-scan in the selected dose window</label>
        </div>
        {referenceImages.length ? <div className="reference-gallery"><div className="reference-gallery-title"><strong>Web reference candidates</strong><span>Openverse · manual confirmation required</span></div><div className="reference-thumbs">{referenceImages.slice(0, 4).map((image) => <a key={image.thumbnail} href={image.source} target="_blank" rel="noreferrer"><img src={image.thumbnail} alt={image.title} /><small>{image.license || "source"}</small></a>)}</div></div> : null}
        <div className="manual-checks">
          <button disabled={!currentDue || !prescriptionPlan?.humanReviewed} onClick={() => currentDue && markMedication("Verified", isDueWindow ? 94 : 91, dueLabel, cameraDoseKey)}><Check /> I took this dose</button>
          <button disabled={!currentDue || !prescriptionPlan?.humanReviewed} onClick={() => currentDue && markMedication("Missed", 18, dueLabel, cameraDoseKey)}><X /> Dose missed</button>
          <button disabled={!currentDue || !prescriptionPlan?.humanReviewed} onClick={() => currentDue && markMedication("Pending", 52, dueLabel, cameraDoseKey)}><TimerReset /> Retry needed</button>
        </div>
      </Panel>
</div>
  );
}

function ScanIcon() {
  return <Radio aria-hidden="true" />;
}

function VoiceView({
  transcript,
  setTranscript,
  distress,
  setDistress,
  checkRecorded,
  onAnalyze
}: {
  transcript: string;
  setTranscript: (value: string) => void;
  distress: boolean;
  setDistress: (value: boolean) => void;
  checkRecorded: boolean;
  onAnalyze: (distress: boolean, recordEvent?: boolean) => void;
}) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptFieldRef = useRef<HTMLTextAreaElement | null>(null);
  const transcriptTimerRef = useRef<number | null>(null);
  const recognitionStartedRef = useRef(false);
  const setupCancelledRef = useRef(false);
  const [listening, setListening] = useState(false);
  const [volumeScore, setVolumeScore] = useState(0);
  const [speechStatus, setSpeechStatus] = useState("");

  useEffect(() => () => {
    if (transcriptTimerRef.current !== null) window.clearTimeout(transcriptTimerRef.current);
    if (recognitionStartedRef.current) recognitionRef.current?.stop();
  }, []);

  function analyzeText(value = transcript, recordEvent = true) {
    const text = value.trim();
    if (!text) {
      setSpeechStatus("Enter or dictate how you are feeling first, then select Analyze text.");
      transcriptFieldRef.current?.focus();
      return;
    }
    const lower = text.toLowerCase();
    const riskTerms = ["help", "can't breathe", "cannot breathe", "shortness of breath", "pain", "emergency", "dizzy", "faint", "chest"];
    const matches = riskTerms.filter((word) => lower.includes(word));
    const highRisk = matches.length > 0;
    const distressFlag = highRisk || volumeScore > 78;
    setDistress(distressFlag);
    onAnalyze(distressFlag, recordEvent);
    const evidence = matches.length ? `Words noticed: ${matches.join(", ")}.` : "No distress words matched.";
    const volume = volumeScore > 0 ? ` Voice volume: ${volumeScore > 78 ? "marked change detected" : "no marked change"}.` : "";
    setSpeechStatus(`${distressFlag ? "Distress signal detected" : "No distress signal detected"}. ${evidence}${volume} This simple word and voice-volume check is not a medical assessment.`);
  }

  async function micVolumeCheck() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      await new Promise((resolve) => setTimeout(resolve, 900));
      analyser.getByteFrequencyData(data);
      const average = data.reduce((sum, value) => sum + value, 0) / data.length;
      const score = safeScore(average * 2.4);
      setVolumeScore(score);
      stream.getTracks().forEach((track) => track.stop());
      await context.close();
      onAnalyze(score > 78 || distress, true);
    } catch {
      setVolumeScore(0);
    }
  }

  function startSpeech() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setListening(false);
      setSpeechStatus("Live speech-to-text is not supported in this browser. Try Chrome or Edge, or type in the box below.");
      return;
    }
    setupCancelledRef.current = false;
    setSpeechStatus("Preparing private, on-device speech recognition…");
    try {
      const recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN";
      recognition.onstart = () => {
        recognitionStartedRef.current = true;
        setSpeechStatus(`Listening on this device (${recognition.lang})… speak clearly; your words will appear here.`);
      };
      recognition.onresult = (event) => {
        const latest = Array.from(event.results)
          .map((result) => result[0].transcript.trim())
          .filter(Boolean)
          .join(" ");
        if (!latest) return;
        setTranscript(latest);
        setSpeechStatus("Speech captured. You can keep speaking or stop listening.");
        analyzeText(latest, false);
      };
      recognition.onerror = (event) => {
        const messages: Record<string, string> = {
          "not-allowed": "Microphone access was blocked. Allow microphone access for this local VITAL page in your browser’s site settings, then try again.",
          "service-not-allowed": "The browser blocked its speech service. Check microphone permission or use the text box instead.",
          "no-speech": "No speech was detected. Check that the correct microphone is connected, then try again.",
          "audio-capture": "No microphone was found. Connect or enable a microphone, then try again.",
          network: "The browser could not start speech recognition. VITAL requested on-device processing, so microphone audio is not sent to a speech service. Check that your browser supports local speech recognition and that its English language pack is installed.",
          "language-not-supported": "This browser does not have the selected on-device English speech pack. Install an English speech pack in browser settings, then try again.",
          aborted: "Speech capture stopped. Select Start speech check to try again."
        };
        setSpeechStatus(messages[event.error] || `Speech recognition stopped (${event.error}). You can type in the text box instead.`);
        setListening(false);
        recognitionStartedRef.current = false;
      };
      recognition.onend = () => {
        setListening(false);
        recognitionStartedRef.current = false;
        setSpeechStatus((current) => current.startsWith("Listening") ? "Speech capture ended. If no words appeared, check microphone permission and try again." : current);
      };
      recognitionRef.current = recognition;
      setListening(true);
      void (async () => {
        if (!Recognition.available || !Recognition.install || !("processLocally" in recognition)) {
          setListening(false);
          setSpeechStatus("This browser does not offer on-device speech recognition. Update to a browser with local speech packs, or use Windows voice typing (Win+H) while the transcript box is focused.");
          return;
        }
        for (const language of ["en-IN", "en-US"]) {
          try {
            if (setupCancelledRef.current) return;
            let availability = await Recognition.available({ langs: [language], processLocally: true, quality: "dictation" });
            if (availability === "unavailable") continue;
            if (availability === "downloadable") {
              setSpeechStatus(`Downloading the ${language} on-device speech pack. This is a one-time browser language-pack download; your microphone audio stays on this device.`);
              const installed = await Recognition.install({ langs: [language], processLocally: true, quality: "dictation" });
              if (setupCancelledRef.current) return;
              if (!installed) continue;
              availability = "available";
            }
            if (availability === "available") {
              recognition.lang = language;
              recognition.processLocally = true;
              recognitionStartedRef.current = true;
              recognition.start();
              return;
            }
          } catch {
            // Try the next English locale; if neither exists, show a local-only fallback.
          }
        }
        setListening(false);
        setSpeechStatus("No on-device English speech pack is available. Update your browser and install its English language pack, or use Windows voice typing (Win+H) while the transcript box is focused.");
      })();
    } catch {
      setListening(false);
      setSpeechStatus("Could not start speech recognition. Check microphone permission, then try typing your message.");
    }
  }

  function stopSpeech() {
    setupCancelledRef.current = true;
    if (recognitionStartedRef.current) recognitionRef.current?.stop();
    setListening(false);
    setSpeechStatus("Speech capture stopped.");
    analyzeText(transcriptFieldRef.current?.value ?? transcript, true);
  }

  function useWindowsVoiceTyping() {
    transcriptFieldRef.current?.focus();
    transcriptFieldRef.current?.select();
    setSpeechStatus("Transcript box focused. Press Win+H to dictate; new words will replace the current text and VITAL will analyze them automatically.");
  }

  function updateTranscript(value: string) {
    setTranscript(value);
    if (transcriptTimerRef.current !== null) window.clearTimeout(transcriptTimerRef.current);
    if (!value.trim()) return;
    transcriptTimerRef.current = window.setTimeout(() => {
      analyzeText(value, false);
      setSpeechStatus("Transcript received and analyzed. Check the distress result before using it for any decision.");
    }, 1000);
  }

  return (
    <div className="two-column">
      <Panel title="Voice distress detector" kicker="On-device speech + text fallback">
        <label className="voice-transcript-label" htmlFor="voice-transcript">Speak or type how you are feeling</label>
        <textarea ref={transcriptFieldRef} id="voice-transcript" aria-label="Speech transcript or typed text" placeholder="Your recognized words will appear here. You can also type a phrase." value={transcript} onChange={(event) => updateTranscript(event.target.value)} rows={8} />
        <p className={`speech-status ${listening ? "listening" : ""}`} role="status" aria-live="polite">{speechStatus || "Select Start speech check and allow microphone access when prompted."}</p>
        <div className="button-row">
          <ActionButton icon={listening ? <Square /> : <Mic />} onClick={listening ? stopSpeech : startSpeech}>
            {listening ? "Stop listening" : "Start speech check"}
          </ActionButton>
          <ActionButton icon={<Mic />} onClick={useWindowsVoiceTyping} variant="secondary">Use Windows voice typing · Win+H</ActionButton>
          <ActionButton icon={<Volume2 />} onClick={micVolumeCheck} variant="secondary">Volume check</ActionButton>
          <ActionButton icon={<AlertTriangle />} onClick={() => {
            if (transcriptTimerRef.current !== null) window.clearTimeout(transcriptTimerRef.current);
            analyzeText(transcriptFieldRef.current?.value ?? transcript);
          }} variant="secondary">Analyze text</ActionButton>
        </div>
      </Panel>
      <Panel title="Distress signal" kicker="multimodal input">
        <div className={`voice-card ${distress ? "distress" : ""}`}>
          {distress ? <BellRing /> : <ShieldCheck />}
          <strong>{distress ? "Distress flag active" : checkRecorded ? "No distress flag recorded" : "Not checked yet"}</strong>
          <p>Volume score: {volumeScore || "not sampled"} · Keyword check: typed or speech transcript.</p>
        </div>
        <div className="signal-grid">
          <span><Check /> Speech or typed phrase capture</span>
          <span><Check /> Local speech when supported</span>
          <span><Check /> Feeds the triage score</span>
        </div>
      </Panel>
    </div>
  );
}

function PhoneConnectionView({ consentConfirmed, setConsentConfirmed, addTimelineEvent }: {
  consentConfirmed: boolean;
  setConsentConfirmed: (confirmed: boolean) => void;
  addTimelineEvent: (eventType: PatientTimelineEvent["eventType"], title: string, detail: string, status?: string) => void;
}) {
  const [status, setStatus] = useState<Awaited<ReturnType<typeof fetchPhoneCameraStream>> | null>(null);
  const [pairCode, setPairCode] = useState("");
  const [pairExpiresAt, setPairExpiresAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refreshStatus() {
    try { setStatus(await fetchPhoneCameraStream()); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not reach the VITAL phone service."); }
  }

  useEffect(() => {
    void refreshStatus();
    const timer = window.setInterval(() => void refreshStatus(), 5000);
    return () => window.clearInterval(timer);
  }, []);

  async function pairPhone() {
    if (!consentConfirmed) {
      setMessage("Confirm the patient’s consent before pairing the phone.");
      return;
    }
    if (!status?.lanEnabled) {
      setMessage("Phone access is off. Reopen START VITAL - PHONE CAMERA.cmd, then refresh this screen.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await createPhoneCameraPairing();
      setPairCode(result.pairingCode);
      setPairExpiresAt(result.expiresAt);
      setMessage("Pairing code ready. Enter it in the VITAL Android app within five minutes.");
      addTimelineEvent("emergency", "Phone camera pairing code created", "A one-time code was created for the consent-based local camera connection. Frames are held in memory only.", "Manual setup");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create a pairing code.");
    } finally { setBusy(false); }
  }

  async function disconnectPhone() {
    try {
      await revokePhoneCamera();
      setPairCode("");
      setPairExpiresAt(null);
      setMessage("Phone access revoked. Stop the Android camera service from its notification too.");
      await refreshStatus();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not revoke phone access."); }
  }

  return <div className="phone-camera-page">
    <Panel title="Connect your Android phone" kicker="One-time setup · same trusted Wi-Fi">
      <p className="phone-connect-intro">Pair the VITAL Android companion with this computer. Once connected, the camera monitor and watch sync can use the phone connection.</p>
      <label className="camera-consent"><input type="checkbox" checked={consentConfirmed} onChange={(event) => setConsentConfirmed(event.target.checked)} /><span>I confirm the patient has agreed to this camera session, and a person will monitor the screen.</span></label>
      <div className="phone-pair-card">
        <div><strong>{status?.paired ? "Phone paired" : "Pair the VITAL app"}</strong><p>Keep the phone and computer on the same trusted Wi-Fi. Start VITAL with the phone-camera launcher, then enter a computer address and one-time code in the Android app.</p></div>
        {status?.hostAddresses.length ? <div className="phone-host-list">{status.hostAddresses.map((host) => <code key={host}>http://{host}:5055</code>)}</div> : <p className="phone-camera-status">No local network address detected. Check that both devices are on Wi-Fi.</p>}
        {pairCode ? <div className="phone-pair-code"><span>PAIR CODE · expires {pairExpiresAt ? new Date(pairExpiresAt * 1000).toLocaleTimeString() : "soon"}</span><strong>{pairCode}</strong></div> : null}
        {consentConfirmed && status && !status.lanEnabled ? <p className="phone-camera-status">Phone access is off. Close this VITAL session and reopen <strong>START VITAL - PHONE CAMERA.cmd</strong>, then refresh this page.</p> : null}
        <ActionButton icon={<KeyRound />} onClick={() => void pairPhone()} disabled={busy || !consentConfirmed || status?.lanEnabled !== true}>{busy ? "Creating code…" : status?.lanEnabled !== true ? "Enable phone access to create code" : pairCode ? "Generate new pairing code" : "Create one-time pairing code"}</ActionButton>
        {status?.paired ? <ActionButton icon={<X />} onClick={() => void disconnectPhone()} variant="secondary">Revoke phone access</ActionButton> : null}
        <small>In the Android app, enter the address and code, then press Start. You may lock the phone afterward; its persistent notification includes a Stop control.</small>
      </div>
      {message ? <p className="phone-camera-status" role="status">{message}</p> : null}
    </Panel>
  </div>;
}

function PhoneCameraView({ profile, consentConfirmed, onConnectPhone, addTimelineEvent, onEmergencyHelp }: {
  profile: PatientProfile;
  consentConfirmed: boolean;
  onConnectPhone: () => void;
  addTimelineEvent: (eventType: PatientTimelineEvent["eventType"], title: string, detail: string, status?: string) => void;
  onEmergencyHelp: () => void;
}) {
  const [cameraStatus, setCameraStatus] = useState<{ paired: boolean; active: boolean; lastFrameAt: number | null; frameBase64: string | null; poseStatus: string; poseStatusAt: number | null; lanEnabled: boolean; hostAddresses: string[] } | null>(null);
  const [cameraMessage, setCameraMessage] = useState("Camera is off. Pair the VITAL Android app to start a visible, consent-based camera session.");
  const [fallSmsOptIn, setFallSmsOptIn] = useState(false);
  const [fallSmsConfigured, setFallSmsConfigured] = useState(false);
  const [fallSmsSaved, setFallSmsSaved] = useState(false);
  const [fallSmsConsent, setFallSmsConsent] = useState(false);
  const [fallSmsMessage, setFallSmsMessage] = useState("");
  const [additionalEmergencyPhones, setAdditionalEmergencyPhones] = useState(["", ""]);
  const [fallSmsBusy, setFallSmsBusy] = useState(false);
  const [fallAlerts, setFallAlerts] = useState<PossibleFallAlert[]>([]);
  const [acknowledgingAlert, setAcknowledgingAlert] = useState("");
  const [fallPromptOpen, setFallPromptOpen] = useState(false);
  const [fallSoundState, setFallSoundState] = useState<"locked" | "ready" | "playing" | "blocked">("locked");
  const fallAudioContext = useRef<AudioContext | null>(null);
  const previousFallPrompt = useRef(false);

  function playFallSiren() {
    const context = fallAudioContext.current;
    if (!context || context.state !== "running") return false;
    try {
      const startAt = context.currentTime + 0.04;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.linearRampToValueAtTime(0.2, startAt + 0.1);
      gain.gain.setValueAtTime(0.2, startAt + 3.15);
      gain.gain.linearRampToValueAtTime(0.0001, startAt + 3.45);
      gain.connect(context.destination);
      for (let index = 0; index < 3; index += 1) {
        const oscillator = context.createOscillator();
        const offset = startAt + index * 1.03;
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(720, offset);
        oscillator.frequency.linearRampToValueAtTime(1040, offset + 0.47);
        oscillator.frequency.linearRampToValueAtTime(720, offset + 0.94);
        oscillator.connect(gain);
        oscillator.start(offset);
        oscillator.stop(offset + 1);
      }
      return true;
    } catch {
      return false;
    }
  }

  async function enableFallAlertSound() {
    try {
      fallAudioContext.current ??= new window.AudioContext();
      if (fallAudioContext.current.state !== "running") await fallAudioContext.current.resume();
      if (fallAudioContext.current.state !== "running" || !playFallSiren()) {
        setFallSoundState("blocked");
        return;
      }
      setFallSoundState("ready");
    } catch {
      setFallSoundState("blocked");
    }
  }

  async function refreshFallAlerts() {
    try {
      const items = await fetchEmergencyIncidents();
      setFallAlerts(items.filter((item): item is PossibleFallAlert => "kind" in item && item.kind === "possible-fall"));
    } catch {
      // Camera pairing and preview can still be used when signed-in history is unavailable.
    }
  }

  async function refreshCameraStatus() {
    try {
      setCameraStatus(await fetchPhoneCameraStream());
    } catch (error) {
      setCameraMessage(error instanceof Error ? error.message : "VITAL camera service is unavailable.");
    }
  }

  useEffect(() => {
    void refreshCameraStatus();
    void refreshFallAlerts();
    void fetchCameraEmergencySettings().then((settings) => {
      setFallSmsOptIn(settings.enabled);
      setFallSmsSaved(settings.enabled);
      setFallSmsConfigured(settings.smsConfigured);
      setAdditionalEmergencyPhones(settings.emergencyPhones.filter((phone) => phone !== profile.caretakerPhone).slice(0, 2).concat(["", ""]).slice(0, 2));
    }).catch(() => setFallSmsMessage("Sign in to VITAL to configure caregiver alerts."));
    const timer = window.setInterval(() => void refreshCameraStatus(), 1600);
    const alertTimer = window.setInterval(() => void refreshFallAlerts(), 5000);
    return () => { window.clearInterval(timer); window.clearInterval(alertTimer); };
  }, []);

  async function recordCaregiverCheckIn(alertId: string, status: CaregiverCheckIn) {
    setAcknowledgingAlert(alertId);
    try {
      const updated = await acknowledgePossibleFall(alertId, status);
      setFallAlerts((current) => current.map((alert) => alert.id === updated.id ? updated : alert));
    } catch (error) {
      setFallSmsMessage(error instanceof Error ? error.message : "Could not save the caregiver check-in.");
    } finally {
      setAcknowledgingAlert("");
    }
  }

  async function saveFallAlertSettings() {
    if (fallSmsOptIn && !fallSmsConsent) {
      setFallSmsMessage("Confirm that the patient agrees to automatic caregiver SMS alerts first.");
      return;
    }
    setFallSmsBusy(true);
    try {
      const result = await saveCameraEmergencySettings({
        enabled: fallSmsOptIn,
        caretakerPhone: profile.caretakerPhone,
        emergencyPhones: additionalEmergencyPhones.filter((phone) => phone.trim()),
        patientName: profile.name || "VITAL patient"
      });
      setFallSmsSaved(result.enabled);
      setFallSmsConfigured(result.smsConfigured);
      setFallSmsMessage(result.ready
        ? result.smsConfigured
          ? `Possible-fall SMS alert is armed for ${[profile.caretakerPhone, ...additionalEmergencyPhones].filter((phone) => phone.trim()).length} emergency contact(s). The phone checks pose about once per second.`
          : `Possible-fall SMS alert is armed for ${[profile.caretakerPhone, ...additionalEmergencyPhones].filter((phone) => phone.trim()).length} emergency contact(s). The paired phone will use its SIM; allow SMS permission. Carrier charges may apply.`
        : "Add at least one emergency number in international format, then save these alert settings.");
    } catch (error) {
      setFallSmsMessage(error instanceof Error ? error.message : "Could not save caregiver alert settings.");
    } finally {
      setFallSmsBusy(false);
    }
  }

  const caretakerNumber = (profile.caretakerPhone || "").replace(/[^\d]/g, "");
  const caretakerMessage = `Please check on ${profile.name || "the patient"}. I would like you to confirm they are okay. This message was prepared in VITAL.`;
  const caretakerLink = caretakerNumber ? `https://wa.me/${caretakerNumber}?text=${encodeURIComponent(caretakerMessage)}` : "";
  const unacknowledgedFallAlert = fallAlerts.find((alert) => !alert.acknowledgement) || null;
  const poseStatusIsFresh = cameraStatus?.poseStatusAt != null
    && Date.now() / 1000 - cameraStatus.poseStatusAt >= 0
    && Date.now() / 1000 - cameraStatus.poseStatusAt <= 8;
  // Only a live, recently updated detection may open the alert. Historical
  // unacknowledged events remain in the alert history and must not pop up just
  // because the user navigated back to Camera check.
  const showAmbulanceCallPrompt = cameraStatus?.active === true
    && poseStatusIsFresh
    && cameraStatus.poseStatus === "possible-fall";

  useEffect(() => {
    if (!showAmbulanceCallPrompt) {
      previousFallPrompt.current = false;
      return;
    }
    if (previousFallPrompt.current) return;
    previousFallPrompt.current = true;
    setFallPromptOpen(true);
    if (fallSoundState === "ready" && playFallSiren()) {
      setFallSoundState("playing");
      window.setTimeout(() => setFallSoundState("ready"), 3600);
    } else {
      setFallSoundState("blocked");
    }
  }, [showAmbulanceCallPrompt, fallSoundState]);
  const poseStatusLabel: Record<string, string> = {
    "waiting-for-phone-analysis": "Waiting for the phone’s local pose analysis",
    "person-not-detected": "No person detected in the latest frame",
    "pose-not-clear": "Person/pose unclear in the latest frame",
    "person-upright": "Person detected · upright pose",
    "person-horizontal": "Person detected · horizontal pose",
    "fall-verifying": "Possible fall posture · checking stillness; stand up to cancel",
    "possible-fall": "Possible fall posture confirmed · caregiver alert status below"
  };

  return <div className="phone-camera-page">
    <Panel title="Phone camera monitor" kicker="android · local wi-fi · visible service">
      <div className="camera-watch-notice"><ShieldCheck /><p><strong>Live horizontal-posture monitoring.</strong> The paired Android phone runs YOLO pose analysis locally and streams an annotated tracking frame here. A sustained horizontal torso posture starts a 4-second stillness check, including when the person was already lying down as monitoring began; brief noisy pose frames no longer reset the check. Standing up cancels it. After confirmation, VITAL attempts SMS to the saved emergency contacts. It never calls an ambulance automatically; a person must choose Call 112. This prototype can miss or falsely flag falls.</p></div>
      <div className={`phone-camera-preview ${cameraStatus?.active ? "active" : ""}`}>
        {cameraStatus?.frameBase64 ? <img src={`data:image/jpeg;base64,${cameraStatus.frameBase64}`} alt="Latest snapshot from the paired Android camera" /> : null}
        {!cameraStatus?.frameBase64 ? <div className="phone-camera-placeholder"><Camera /><span>Waiting for phone camera</span></div> : null}
        <span className="camera-live-badge">{cameraStatus?.active ? "CAMERA CONNECTED" : "CAMERA OFFLINE"}</span>
      </div>
      <p className="phone-camera-status" role="status">{cameraStatus?.active && cameraStatus.lastFrameAt ? `Latest snapshot received ${new Date(cameraStatus.lastFrameAt * 1000).toLocaleTimeString()}.` : cameraStatus?.paired ? "Phone is paired; waiting for its camera service to send a frame." : "No phone camera is paired."}</p>
      <p className="phone-camera-status" role="status">Phone detection: {poseStatusLabel[cameraStatus?.poseStatus || "waiting-for-phone-analysis"] || "Pose status unavailable"}{cameraStatus?.poseStatusAt ? ` · updated ${new Date(cameraStatus.poseStatusAt * 1000).toLocaleTimeString()}` : ""}</p>
      {showAmbulanceCallPrompt && fallPromptOpen ? <div className="fall-call-modal-backdrop">
        <section className="fall-call-modal" role="alertdialog" aria-modal="true" aria-labelledby="fall-call-title" aria-describedby="fall-call-description">
          <Ambulance aria-hidden="true" />
          <h2 id="fall-call-title">Possible fall detected</h2>
          <p id="fall-call-description">{unacknowledgedFallAlert?.smsDetail || "A possible-fall posture was detected. Check the person now if safe."} No emergency call has been placed. Use the button to open the phone dialer and call 112.</p>
          <p className="fall-call-sound-status" role="status">{fallSoundState === "playing" ? "Emergency siren playing in this browser." : fallSoundState === "ready" ? "Browser siren enabled." : "Browser audio is locked. Enable and test the siren below."}</p>
          <div className="fall-call-modal-actions">
            <a className="button danger" href="tel:112" aria-label="Open the dialer to call 112"><PhoneCall /> Call 112</a>
            <button className="button secondary" type="button" onClick={() => setFallPromptOpen(false)}>Dismiss</button>
          </div>
        </section>
      </div> : null}
      <div className="button-row fall-sound-controls">
        <ActionButton icon={<Volume2 />} onClick={() => void enableFallAlertSound()} variant="secondary">{fallSoundState === "ready" || fallSoundState === "playing" ? "Test alert siren" : "Enable and test alert siren"}</ActionButton>
        <span className="phone-camera-status" role="status">{fallSoundState === "ready" ? "Sound enabled in this browser." : fallSoundState === "playing" ? "Siren is playing." : fallSoundState === "blocked" ? "Sound was blocked. Allow site audio, then test again." : "Click to unlock browser audio; browsers block alarms until a user gesture."}</span>
      </div>
      <p className="phone-camera-status" role="status">{cameraMessage}</p>
      <div className="phone-connection-shortcut">
        <div><strong>{cameraStatus?.paired ? "Android phone paired" : "Connect the Android phone"}</strong><p>{consentConfirmed ? "Patient consent is confirmed. Manage the phone connection in its own screen." : "Open phone connection to confirm patient consent and pair the Android app."}</p></div>
        <ActionButton icon={<Smartphone />} onClick={onConnectPhone} variant="secondary">Open phone connection</ActionButton>
      </div>
      <section className="camera-fall-setup" aria-label="Fall alert setup">
        <div><strong>Possible-fall emergency-contact alerts</strong><p>{fallSmsConfigured ? "SMS provider is configured. Alerts go to the saved emergency contacts." : "The paired Android phone can send alerts from its SIM to the saved emergency contacts. Allow SMS permission; carrier charges may apply."}</p></div>
        {additionalEmergencyPhones.map((phone, index) => <label key={index}>Additional emergency contact {index + 2} phone<input type="tel" inputMode="tel" placeholder="+919876543210" value={phone} onChange={(event) => setAdditionalEmergencyPhones((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /></label>)}
        <p className="phone-camera-status">Primary number is taken from Patient profile: {profile.caretakerPhone || "not set"}. Up to two additional numbers can be added here. Use international format.</p>
        <label className="camera-consent camera-fall-toggle"><input type="checkbox" checked={fallSmsOptIn} onChange={(event) => setFallSmsOptIn(event.target.checked)} /><span>Enable automatic possible-fall SMS alerts to these emergency contacts</span></label>
        {fallSmsOptIn ? <label className="camera-consent camera-fall-toggle"><input type="checkbox" checked={fallSmsConsent} onChange={(event) => setFallSmsConsent(event.target.checked)} /><span>The patient agrees to immediate automatic caretaker SMS attempts when the prototype flags a possible fall. False alerts are possible.</span></label> : null}
        <ActionButton icon={<ShieldCheck />} onClick={() => void saveFallAlertSettings()} disabled={fallSmsBusy}>{fallSmsBusy ? "Saving…" : fallSmsSaved ? "Update alert settings" : "Save alert settings"}</ActionButton>
        {fallSmsMessage ? <p className="phone-camera-status" role="status">{fallSmsMessage}</p> : null}
      </section>
      <section className="fall-alert-history" aria-label="Possible-fall alert history">
        <div className="fall-alert-history-heading"><div><strong>Alert history and caregiver check-ins</strong><p>Updates from the paired phone appear here. A check-in is saved to this VITAL account; it does not confirm SMS delivery.</p></div><button className="button secondary" type="button" onClick={() => void refreshFallAlerts()}><RefreshCw /> Refresh</button></div>
        {fallAlerts.length === 0 ? <p className="fall-alert-empty">No possible-fall alerts have been recorded yet.</p> : <div className="fall-alert-list">{fallAlerts.map((alert) => (
          <article className="fall-alert-item" key={alert.id}>
            <div className="fall-alert-item-top"><strong>{alert.patient} · Possible fall flagged</strong><time>{new Date(alert.detectedAt * 1000).toLocaleString()}</time></div>
            <p><b>SMS:</b> {alert.smsDetail}</p>
            {alert.acknowledgement ? <p className="fall-alert-ack"><b>Caregiver check-in:</b> {alert.acknowledgement.status === "checked-on-patient" ? "Checked on patient" : alert.acknowledgement.status === "false-alarm" ? "Marked as a false alarm" : "Unable to reach patient"} · {new Date(alert.acknowledgement.acknowledgedAt * 1000).toLocaleString()}{alert.acknowledgement.note ? ` · ${alert.acknowledgement.note}` : ""}</p> : <div className="fall-alert-actions"><span>Awaiting caregiver check-in</span><button type="button" disabled={acknowledgingAlert === alert.id} onClick={() => void recordCaregiverCheckIn(alert.id, "checked-on-patient")}>Checked on patient</button><button type="button" disabled={acknowledgingAlert === alert.id} onClick={() => void recordCaregiverCheckIn(alert.id, "false-alarm")}>False alarm</button><button type="button" disabled={acknowledgingAlert === alert.id} onClick={() => void recordCaregiverCheckIn(alert.id, "unable-to-reach")}>Unable to reach</button></div>}
          </article>
        ))}</div>}
      </section>
      <div className="phone-camera-actions">
        <div><strong>Need immediate help?</strong><p>For an emergency, call local emergency services. The caregiver SMS alert is not an emergency-service call.</p></div>
        <div className="button-row">
          {caretakerLink ? <a className="button secondary" href={caretakerLink} target="_blank" rel="noreferrer" onClick={() => addTimelineEvent("emergency", "Caregiver message prepared", "Opened a prefilled WhatsApp message for the primary caretaker. VITAL did not send it.", "Manual action")}><MessageCircle /> Message caretaker</a> : <button className="button secondary" onClick={() => onEmergencyHelp()}>Add caretaker contact</button>}
          <a className="button danger" href="tel:112"><PhoneCall /> Call 112</a>
        </div>
      </div>
    </Panel>
  </div>;
}

function EmergencyView({
  triage,
  symptoms,
  hospitals,
  profile,
  incident,
  createIncident,
  countdownSeconds,
  caretakerAlerts,
  autoTriggerToken,
  addTimelineEvent
}: {
  triage: TriageResponse;
  symptoms: string;
  hospitals: Hospital[];
  profile: PatientProfile;
  incident: Incident | null;
  createIncident: () => Promise<void>;
  countdownSeconds: number;
  caretakerAlerts: boolean;
  autoTriggerToken: number;
  addTimelineEvent: (eventType: PatientTimelineEvent["eventType"], title: string, detail: string, status?: string) => void;
}) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [practiceComplete, setPracticeComplete] = useState(false);
  const [alarmPlayed, setAlarmPlayed] = useState(false);
  const alarmAudioContext = useRef<AudioContext | null>(null);
  const [soundReady, setSoundReady] = useState<boolean | null>(null);

  async function prepareEmergencySound() {
    try {
      const AudioContextConstructor = window.AudioContext;
      if (!AudioContextConstructor) return false;
      alarmAudioContext.current ??= new AudioContextConstructor();
      const context = alarmAudioContext.current;
      const resumed = context.state === "running" ? Promise.resolve() : context.resume();

      // Start a short audible preview directly from the click gesture. This
      // both verifies output and unlocks Web Audio before the countdown wait.
      const previewGain = context.createGain();
      const preview = context.createOscillator();
      const previewStart = context.currentTime + 0.02;
      preview.type = "sawtooth";
      preview.frequency.setValueAtTime(720, previewStart);
      preview.frequency.linearRampToValueAtTime(1000, previewStart + 0.28);
      preview.frequency.linearRampToValueAtTime(720, previewStart + 0.62);
      previewGain.gain.setValueAtTime(0.0001, previewStart);
      previewGain.gain.linearRampToValueAtTime(0.12, previewStart + 0.06);
      previewGain.gain.setValueAtTime(0.12, previewStart + 0.52);
      previewGain.gain.linearRampToValueAtTime(0.0001, previewStart + 0.66);
      preview.connect(previewGain);
      previewGain.connect(context.destination);
      preview.start(previewStart);
      preview.stop(previewStart + 0.68);

      await resumed;
      return context.state === "running";
    } catch {
      return false;
    }
  }

  function playEmergencySound() {
    const context = alarmAudioContext.current;
    if (!context || context.state !== "running") return false;
    const startAt = context.currentTime + 0.05;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(0.18, startAt + 0.12);
    gain.gain.setValueAtTime(0.18, startAt + 3.2);
    gain.gain.linearRampToValueAtTime(0.0001, startAt + 3.5);
    gain.connect(context.destination);

    // Three clear, rising/falling siren sweeps, generated locally in the browser.
    for (let index = 0; index < 3; index += 1) {
      const oscillator = context.createOscillator();
      const offset = startAt + index * 1.05;
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(720, offset);
      oscillator.frequency.linearRampToValueAtTime(1040, offset + 0.48);
      oscillator.frequency.linearRampToValueAtTime(720, offset + 0.96);
      oscillator.connect(gain);
      oscillator.start(offset);
      oscillator.stop(offset + 1.02);
    }
    return true;
  }

  useEffect(() => {
    if (countdown === null) return undefined;
    if (countdown <= 0) {
      setCountdown(null);
      setPracticeComplete(true);
      setAlarmPlayed(playEmergencySound());
      void createIncident();
      return undefined;
    }
    const timer = window.setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, createIncident]);

  useEffect(() => {
    if (autoTriggerToken === 0) return;
    setCancelled(false);
    setCountdown(countdownSeconds);
    addTimelineEvent(
      "emergency",
      "Emergency warning detected",
      `A ${countdownSeconds}-second practice countdown started. VITAL did not call anyone or send a message.`,
      "Review now"
    );
  }, [autoTriggerToken]);

  return (
    <div className="two-column medication-layout emergency-layout">
      <Panel title="Emergency help" kicker="Call or message someone directly">
        <div className={`emergency-stage ${countdown !== null ? "armed" : ""}`}>
          <Ambulance />
          <strong>{countdown !== null ? `Practice countdown · ${countdown}s` : cancelled ? "Countdown cancelled" : practiceComplete ? alarmPlayed ? "Practice alert · siren played" : "Practice alert · browser blocked sound" : "Emergency contacts"}</strong>
          <p>{countdown !== null
            ? "Sound check played at start. When the countdown ends, this browser plays the siren and saves a local practice event. No one is contacted."
            : practiceComplete && !alarmPlayed
              ? "The local practice event was saved, but this browser blocked the siren. Allow sound for this site, check device volume, and try the alarm test again. No one was contacted."
              : soundReady === false
                ? "Browser audio could not be enabled, so the alarm test has not started. Allow sound for this site, check device volume, and try again. No one will be contacted."
                : "This countdown tests the browser siren and records a local practice event. Starting it plays a brief sound check; the siren plays when the countdown ends. It does not contact anyone. If someone needs urgent help, use the contact options below."}</p>
        </div>
        <div className="button-row">
          <ActionButton
            icon={<BellRing />}
            onClick={async () => {
              const ready = await prepareEmergencySound();
              setSoundReady(ready);
              if (!ready) return;
              setCancelled(false);
              setPracticeComplete(false);
              setAlarmPlayed(false);
              setCountdown(countdownSeconds);
              addTimelineEvent("emergency", "Emergency alarm test started", `${countdownSeconds}-second countdown. VITAL will play a local browser siren when it ends; no contact will be made.`, "Practice");
            }}
            variant="danger"
          >
            Start countdown
          </ActionButton>
          <ActionButton
            icon={<X />}
            onClick={() => {
              setCancelled(true);
              setCountdown(null);
              addTimelineEvent("emergency", "Emergency countdown cancelled", "No call or message was sent.", "Cancelled");
            }}
            variant="secondary"
          >
            Cancel response
          </ActionButton>
        </div>
        <div className="contact-card">
          <UserRound />
          <div>
            <strong>{profile.caretaker}</strong>
            <span>{profile.caretakerPhone}</span>
          </div>
          {caretakerAlerts ? <>
            <a href={`https://wa.me/${profile.caretakerPhone.replace(/\D/g, "")}?text=VITAL%20emergency%20alert%20for%20${encodeURIComponent(profile.name)}`}>Message on WhatsApp</a>
            <a href={`sms:${profile.caretakerPhone}?body=${encodeURIComponent(`VITAL emergency alert for ${profile.name}. Please check on them.`)}`}>Text caretaker</a>
          </> : <span className="contact-disabled">Caretaker message shortcuts are turned off in Settings.</span>}
        </div>
      </Panel>
      <Panel title="Hospital directory" kicker="Static local reference · call to confirm details and availability">
        <div className="selected-hospital">
          <MapPin />
          <div>
            <strong>{hospitals[0]?.name}</strong>
            <span>{hospitals[0]?.area}</span>
          </div>
        </div>
        {incident ? (
          <div className="timeline">
            {incident.timeline.map((item) => (
              <div key={`${incident.id}-${item.time}`}>
                <span>{item.time}</span>
                <p>{item.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <AlertTriangle />
            <p>This section keeps a local record of emergency activity. It does not contact the hospital or send a message.</p>
          </div>
        )}
      </Panel>
      {triage.state === "Emergency" ? <CareGuidance state={triage.state} symptoms={symptoms} age={profile.age} /> : null}
    </div>
  );
}

function AppointmentView({
  profile,
  hospitals,
  appointments,
  saveAppointment
}: {
  profile: PatientProfile;
  hospitals: Hospital[];
  appointments: Appointment[];
  saveAppointment: (appointment: Appointment) => Promise<Appointment>;
}) {
  const [hospitalId, setHospitalId] = useState(hospitals[0]?.id || "");
  const [department, setDepartment] = useState("General Medicine");
  const [reason, setReason] = useState("Follow-up after VITAL risk assessment");
  const [date, setDate] = useState(() => { const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); return localDateInputValue(tomorrow); });
  const earliestDate = localDateInputValue(new Date());
  const [time, setTime] = useState("10:30");
  const hospital = hospitals.find((item) => item.id === hospitalId) || hospitals[0];

  useEffect(() => {
    if (!hospitalId && hospitals[0]) setHospitalId(hospitals[0].id);
  }, [hospitalId, hospitals]);

  const [saveNotice, setSaveNotice] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);
  const uniqueAppointments = dedupeAppointments(appointments);

  useEffect(() => {
    if (!saveNotice?.id) return;
    const isPending = (status?: string) => status === "queued_for_phone" || status === "phone_sending";
    if (!isPending(saveNotice.notifications?.patient) && !isPending(saveNotice.notifications?.caretaker)) return;
    let active = true;
    const timer = window.setInterval(async () => {
      try {
        const payload = await fetchAppointments();
        const updated = payload.appointments.find((item) => item.id === saveNotice.id);
        if (active && updated) setSaveNotice(updated);
      } catch { /* Keep showing the last known state while offline. */ }
    }, 4000);
    return () => { active = false; window.clearInterval(timer); };
  }, [saveNotice]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const saved = await saveAppointment({
      patient: profile.name,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      department,
      date,
      time,
      reason
    });
    setSaveNotice(saved);
    setSaving(false);
  }

  return (
    <div className="medication-layout">
      <Panel title="Plan a hospital visit" kicker="Save a reminder for yourself">
        <p className="safety-note">This saves a reminder in VITAL; it does not book an appointment with the hospital. Call the hospital to confirm availability.</p>
        <form className="appointment-form" onSubmit={submit}>
          <label>
            Hospital
            <select value={hospitalId} onChange={(event) => setHospitalId(event.target.value)}>
              {hospitals.map((item) => (
                <option key={item.id} value={item.id}>{item.name} · {item.area}</option>
              ))}
            </select>
          </label>
          <label>
            Department
            <select value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option>General Medicine</option>
              <option>Cardiology</option>
              <option>Emergency Review</option>
              <option>Neurology</option>
              <option>Diabetes Clinic</option>
            </select>
          </label>
          <label>
            Date
            <input type="date" min={earliestDate} value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label>
            Time
            <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
          </label>
          <label className="wide">
            Reason
            <textarea rows={4} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <ActionButton type="submit" disabled={saving} icon={<CalendarCheck />}>{saving ? "Saving…" : "Save visit reminder"}</ActionButton>
        </form>
      </Panel>
      {saveNotice ? <div className="appointment-confirm-backdrop" role="presentation" onClick={() => setSaveNotice(null)}><section className="appointment-confirm" role="dialog" aria-modal="true" aria-labelledby="appointment-confirm-title" onClick={(event) => event.stopPropagation()}><div className="appointment-confirm-icon"><CalendarCheck /></div><h2 id="appointment-confirm-title">Appointment saved</h2><p>{saveNotice.hospitalName} · {saveNotice.department}</p><p>{saveNotice.date} at {saveNotice.time}</p><div className="appointment-message-status"><strong>Mobile message</strong><span>{appointmentMessageLabel(saveNotice.notifications?.patient)}</span><strong>Caretaker message</strong><span>{appointmentMessageLabel(saveNotice.notifications?.caretaker)}</span></div><small>Android submission or provider acceptance does not confirm handset delivery. Carrier charges may apply. This reminder does not book a hospital appointment.</small><ActionButton type="button" icon={<Check />} onClick={() => setSaveNotice(null)}>Done</ActionButton></section></div> : null}
      <Panel title="Your planned visits" kicker="saved reminders">
        <div className="appointment-list">
          {uniqueAppointments.length ? (
            uniqueAppointments.map((appointment) => (
              <article key={appointment.id || `${appointment.hospitalId}-${appointment.date}`}>
                <CalendarCheck />
                <div>
                  <strong>{appointment.hospitalName}</strong>
                  <span>{appointment.department} · {appointment.date} at {appointment.time}</span>
                  <small>{appointment.reason}</small>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <CalendarCheck />
              <p>You have no saved visit reminders yet.</p>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

function AnalyticsView({
  triage,
  hasTriageResult,
  medicationScore,
  medicationLogs,
  voiceDistress,
  appointments,
  patientTimeline
}: {
  triage: TriageResponse;
  hasTriageResult: boolean;
  medicationScore: number;
  medicationLogs: MedicationLog[];
  voiceDistress: boolean;
  appointments: Appointment[];
  patientTimeline: PatientTimelineEvent[];
}) {
  const voiceCheckRecorded = patientTimeline.some((event) => event.eventType === "voice");
  const latestEvents = [...patientTimeline].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const riskHistory = patientTimeline
    .filter((event) => event.eventType === "triage")
    .map((event) => ({ event, score: Number(event.detail.match(/(\d{1,3})\s*\/\s*100/)?.[1]) }))
    .filter((item) => Number.isFinite(item.score) && item.score >= 0 && item.score <= 100)
    .sort((a, b) => new Date(a.event.createdAt).getTime() - new Date(b.event.createdAt).getTime())
    .slice(-7)
    .map(({ event, score }) => ({ score, label: new Date(event.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }), state: event.status || "Recorded" }));
  if (hasTriageResult && (!riskHistory.length || riskHistory[riskHistory.length - 1].score !== triage.score)) {
    riskHistory.push({ score: triage.score, label: "Now", state: triage.state });
  }
  const chartPoints = riskHistory.map((point, index) => ({
    ...point,
    x: riskHistory.length === 1 ? 210 : 42 + (index * 336) / (riskHistory.length - 1),
    y: 151 - (point.score / 100) * 112
  }));
  const riskLine = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const doseCounts = {
    confirmed: medicationLogs.filter((log) => log.status === "Verified").length,
    photo: medicationLogs.filter((log) => log.status === "Photo checked").length,
    missed: medicationLogs.filter((log) => log.status === "Missed").length,
    pending: medicationLogs.filter((log) => log.status === "Pending").length
  };
  const doseTotal = Object.values(doseCounts).reduce((sum, count) => sum + count, 0);
  const dosePercentages = Object.values(doseCounts).map((count) => doseTotal ? (count / doseTotal) * 100 : 0);
  const doseMixStyle = { background: doseTotal ? `conic-gradient(#16876c 0% ${dosePercentages[0]}%, #4f92d8 ${dosePercentages[0]}% ${dosePercentages[0] + dosePercentages[1]}%, #e26a5b ${dosePercentages[0] + dosePercentages[1]}% ${dosePercentages[0] + dosePercentages[1] + dosePercentages[2]}%, #e0a21d ${dosePercentages[0] + dosePercentages[1] + dosePercentages[2]}% 100%)` : undefined };
  return <div className="analytics-page">
    <Panel title="Health analytics" kicker="patient monitoring summary">
      <p className="evidence-explainer">A quick view of your recent monitoring results and care activity.</p>
      <div className="analytics-summary-grid">
        <article className={`analytics-summary-card ${hasTriageResult ? stateClass(triage.state) : "notassessed"}`}><span>Latest screening</span><strong>{hasTriageResult ? triage.state : "Not assessed"}</strong><b className="screening-score">{hasTriageResult ? `Score: ${triage.score}` : "No result recorded"}</b></article>
        <article className="analytics-summary-card"><span>Medication check-ins</span><strong>{medicationLogs.length ? `${medicationScore}%` : "—"}</strong><b>{medicationLogs.length ? "Recorded check-ins" : "No dose data"}</b></article>
        <article className={`analytics-summary-card ${voiceCheckRecorded && voiceDistress ? "emergency" : "normal"}`}><span>Voice distress check</span><strong>{!voiceCheckRecorded ? "Not checked" : voiceDistress ? "Flag detected" : "No flag"}</strong><b>{voiceCheckRecorded ? "Latest recorded session" : "No session recorded"}</b></article>
        <article className="analytics-summary-card"><span>Planned visits</span><strong>{appointments.length}</strong><b>{appointments.length ? "Reminders saved" : "None planned"}</b></article>
      </div>
      <div className={`state-card ${hasTriageResult ? stateClass(triage.state) : "notassessed"}`}><div><span>Latest saved screening estimate</span><strong>{hasTriageResult ? triage.state : "Not assessed"}</strong><p>{hasTriageResult ? triage.model?.disclaimer || "This result is guidance only and is not a diagnosis." : "Enter current symptoms and readings to record a screening estimate."}</p></div><HeartPulse /></div>
    </Panel>
    <section className="analytics-charts" aria-label="Health data charts">
      <Panel title="Triage score trend" kicker="recent recorded results">
        <div className="health-chart-caption"><span>Risk score</span><strong>{hasTriageResult ? <>{triage.score}<small>/100</small></> : "—"}</strong></div>
        <div className="risk-chart-wrap">
          {chartPoints.length ? <svg className="risk-chart" viewBox="0 0 420 190" role="img" aria-label={`Screening estimate history: ${riskHistory.map((point) => `${point.label} ${point.score} out of 100, ${point.state}`).join("; ")}`}>
            {[0, 25, 50, 75, 100].map((tick) => { const y = 151 - (tick / 100) * 112; return <g key={tick}><line x1="38" x2="390" y1={y} y2={y} className="risk-chart-gridline" /><text x="4" y={y + 4} className="risk-chart-tick">{tick}</text></g>; })}
            {chartPoints.length > 1 ? <polygon points={`38,151 ${riskLine} 390,151`} className="risk-chart-area" /> : null}
            {chartPoints.length > 1 ? <polyline points={riskLine} className="risk-chart-line" /> : null}
            {chartPoints.map((point, index) => <g key={`${point.label}-${index}`}><circle cx={point.x} cy={point.y} r="5" className="risk-chart-point" /><text x={point.x} y={point.y - 11} textAnchor="middle" className="risk-chart-value">{point.score}</text></g>)}
          </svg> : <div className="empty-state"><Activity /><p>No screening estimates have been recorded yet.</p></div>}
          {chartPoints.length ? <div className="risk-chart-dates">{chartPoints.map((point, index) => <span key={`${point.label}-${index}`}>{point.label}</span>)}</div> : null}
        </div>
        <p className="chart-note">Scores are recorded screening estimates. Changes alone do not diagnose a condition.</p>
      </Panel>
      <Panel title="Medication check-in mix" kicker="saved records">
        <div className="dose-mix-layout">
          <div className={`dose-mix-donut ${doseTotal ? "has-data" : ""}`} style={doseMixStyle} role="img" aria-label={`Medication records: ${doseCounts.confirmed} marked taken, ${doseCounts.photo} photo checked, ${doseCounts.missed} marked missed, ${doseCounts.pending} need review.`}><div><strong>{doseTotal}</strong><span>records</span></div></div>
          <div className="dose-mix-legend">
            <span><i className="confirmed" />Marked taken <b>{doseCounts.confirmed}</b></span>
            <span><i className="photo" />Photo checked <b>{doseCounts.photo}</b></span>
            <span><i className="missed" />Marked missed <b>{doseCounts.missed}</b></span>
            <span><i className="pending" />Needs review <b>{doseCounts.pending}</b></span>
          </div>
        </div>
        <p className="chart-note">A photo match is shown separately and does not confirm a dose was taken.</p>
      </Panel>
    </section>
    <Panel title="Recent monitoring activity" kicker="latest recorded events">
      {latestEvents.length ? <div className="dashboard-recent-events">{latestEvents.map((event) => <article key={event.id}><span className={`recent-event-dot ${event.eventType}`} /><div><strong>{event.title}</strong><small>{new Date(event.createdAt).toLocaleString()}</small></div>{event.status ? <b>{event.status}</b> : null}</article>)}</div> : <div className="empty-state"><Activity /><p>No monitoring events have been recorded yet.</p></div>}
    </Panel>
  </div>;
}

function HealthPhotoScreeningView() {
  const [photo, setPhoto] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [observations, setObservations] = useState<string[]>([]);
  const [modelLabel, setModelLabel] = useState("");
  const [concernType, setConcernType] = useState("Skin / rash / visible mark");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempted, setAttempted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const warningOptions = [
    "The concern is spreading or getting worse quickly",
    "Severe or increasing pain, warmth, or swelling",
    "Fever, chills, or feeling very unwell",
    "Bleeding, fluid/pus, blisters, or an open area",
    "Numbness, weakness, or difficulty using the affected area",
    "Diabetes, poor circulation, or a weakened immune system"
  ];
  const emergencyOptions = ["Trouble breathing or swallowing", "Heavy bleeding that will not stop", "Unconscious, confused, or difficult to wake", "Sudden weakness or loss of movement"];
  const emergency = selected.some((item) => emergencyOptions.includes(item));
  const urgent = selected.some((item) => warningOptions.slice(0, 5).includes(item));

  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(""); setObservations([]); setAttempted(false);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setError("Choose a JPG, PNG, or WebP image."); return; }
    if (file.size > 15 * 1024 * 1024) { setError("Choose an image smaller than 15 MB."); return; }
    try {
      const source = await new Promise<HTMLImageElement>((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
        image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This image could not be opened.")); };
        image.src = url;
      });
      const scale = Math.min(1, 1024 / Math.max(source.naturalWidth, source.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(source.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("This browser could not prepare the photo.");
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      let quality = 0.82;
      let jpeg = canvas.toDataURL("image/jpeg", quality);
      while (jpeg.length > 950_000 && quality > 0.48) { quality -= 0.08; jpeg = canvas.toDataURL("image/jpeg", quality); }
      if (jpeg.length > 950_000) throw new Error("This photo is too detailed to process. Choose a smaller crop.");
      setPhoto(jpeg); setPhotoName(file.name);
    } catch (caught) {
      setPhoto(""); setPhotoName(""); setError(caught instanceof Error ? caught.message : "Could not prepare this photo.");
    }
  }

  async function analyze() {
    if (!photo) { setError("Add a photo first. If you cannot upload one, you can still use the symptom check below."); return; }
    setLoading(true); setError(""); setObservations([]); setAttempted(true);
    try {
      const result = await screenHealthPhoto(photo.split(",")[1], concernType, selected);
      setObservations(result.observations); setModelLabel(`${result.engine} · ${result.modelId}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Photo review is unavailable.");
    } finally { setLoading(false); }
  }

  function toggle(item: string) {
    setSelected((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
  }

  function clearPhoto() {
    setPhoto(""); setPhotoName(""); setObservations([]); setError(""); setAttempted(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return <div className="skin-screening-page">
    <section className="panel skin-screening-intro">
      <div className="section-heading"><span className="eyebrow">PHOTO-ASSISTED HEALTH CHECK</span><h2>Document a visible health concern</h2><p>Use a photo to record a visible change—such as a rash, wound, swelling, eye concern, or injury—and note how the person feels. This tool cannot diagnose or rule out a condition.</p></div>
      <div className="skin-privacy-note"><ShieldCheck /><span>Photo is processed by Ollama on this computer and is not saved to VITAL’s health record. Remove faces, labels, and other identifying details where possible.</span></div>
    </section>

    <div className="skin-screening-grid">
      <section className="panel skin-photo-panel">
        <div className="section-heading"><span className="eyebrow">1 · PHOTO</span><h2>Add a photo</h2><p>Use good lighting, keep the camera in focus, and avoid filters. Photograph only the area needed.</p></div>
        <label className="skin-concern-select">What does the photo show?
          <select value={concernType} onChange={(event) => { setConcernType(event.target.value); setObservations([]); }}>
            <option>Skin / rash / visible mark</option><option>Wound / cut / burn</option><option>Eye / face concern</option><option>Swelling / bruise / injury</option><option>Other visible health concern</option>
          </select>
        </label>
        <input ref={inputRef} className="skin-file-input" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => void choosePhoto(event)} aria-label="Choose a health photo" />
        {photo ? <div className="skin-photo-preview"><img src={photo} alt="Preview of selected skin photo" /><div><strong>{photoName}</strong><button className="button ghost" type="button" onClick={clearPhoto}><X /> Remove photo</button></div></div> : <button className="skin-upload-target" type="button" onClick={() => inputRef.current?.click()}><span><Upload /></span><strong>Take or choose a photo</strong><small>JPG, PNG, or WebP · private, local processing</small></button>}
        <div className="button-row skin-actions"><button className="button" type="button" disabled={!photo || loading} onClick={() => void analyze()}>{loading ? <><RefreshCw className="spin" /> Reviewing photo…</> : <><ScanFace /> Review visible features</>}</button>{!photo ? <button className="button secondary" type="button" onClick={() => { setAttempted(true); setError(""); }}>Continue without photo</button> : null}</div>
        {error ? <p className="skin-error" role="alert"><AlertTriangle />{error}</p> : null}
        {observations.length ? <div className="skin-observations" aria-live="polite"><div><ScanFace /><div><strong>Visible features</strong><small>{modelLabel}</small></div></div><ul>{observations.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul><p>These are generated visual observations, not verified findings. Check them against the photo yourself.</p></div> : attempted && !loading && !error ? <p className="skin-inline-note">You can use the symptom check and precaution guide below without a photo.</p> : null}
      </section>

      <section className="panel skin-symptom-panel">
        <div className="section-heading"><span className="eyebrow">2 · SYMPTOMS</span><h2>How is the person feeling?</h2><p>Select anything that applies. A photo alone cannot assess symptoms or urgency.</p></div>
        <div className="skin-checklist">
          {warningOptions.map((item) => <label key={item}><input type="checkbox" checked={selected.includes(item)} onChange={() => toggle(item)} /><span>{item}</span></label>)}
          {emergencyOptions.map((item) => <label className="skin-emergency-option" key={item}><input type="checkbox" checked={selected.includes(item)} onChange={() => toggle(item)} /><span>{item}</span></label>)}
        </div>
        <div className={`skin-guidance ${emergency ? "critical" : urgent ? "urgent" : ""}`} role={emergency || urgent ? "alert" : "status"}>
          <strong>{emergency ? "Seek emergency help now" : urgent ? "Contact a clinician urgently today" : "Precautions while you monitor"}</strong>
          <p>{emergency ? "These can be emergency warning signs. Call your local emergency number now; do not wait for a photo result." : urgent ? "The selected symptoms may need prompt in-person assessment. Contact a clinician or urgent care service today; do not wait for a photo result." : "Avoid irritating or manipulating the area. If there is an open wound, wash your hands before and after care and cover it with a clean dressing. Record when the change started and seek professional advice if it persists or concerns you."}</p>
          {selected.includes("Diabetes, poor circulation, or a weakened immune system") ? <p>With this health history, contact a clinician earlier about a new or worsening concern.</p> : null}
          {urgent && !emergency ? <p>Seek emergency help if the person becomes very unwell, symptoms worsen rapidly, or any emergency warning sign appears.</p> : null}
        </div>
      </section>
    </div>

    <section className="panel skin-next-steps"><div><span className="eyebrow">IMPORTANT</span><h2>A photo cannot rule out a health problem</h2><p>Get professional advice for a new, worsening, painful, or persistent concern—even if the image review looks reassuring. Contact emergency services for severe or rapidly worsening symptoms.</p><p>Do not start leftover medicines or delay care based on an AI description. A qualified clinician can examine the person and decide what evaluation or treatment is appropriate.</p></div><div className="skin-sources"><strong>Further guidance</strong><a href="https://www.nhs.uk/conditions/cellulitis/" target="_blank" rel="noreferrer">NHS: Cellulitis and skin infection warning signs</a><a href="https://www.aad.org/news/signs-your-rash-needs-medical-attention" target="_blank" rel="noreferrer">American Academy of Dermatology: When a rash needs medical attention</a></div></section>
  </div>;
}

function TimelineView({ events }: { events: PatientTimelineEvent[] }) {
  type TimelineFilter = "all" | "triage" | "medication" | "prescription" | "voice" | "wearable" | "care";
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const [query, setQuery] = useState("");
  const sorted = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const eventInfo: Record<PatientTimelineEvent["eventType"], { label: string; icon: ReactNode }> = {
    triage: { label: "AI triage", icon: <Activity /> },
    medication: { label: "Medication", icon: <Pill /> },
    prescription: { label: "Prescription", icon: <FileText /> },
    voice: { label: "Voice check", icon: <Mic /> },
    wearable: { label: "Wearable", icon: <Watch /> },
    appointment: { label: "Appointment", icon: <CalendarCheck /> },
    emergency: { label: "Emergency", icon: <Ambulance /> }
  };
  const filters: Array<{ id: TimelineFilter; label: string }> = [
    { id: "all", label: "All activity" }, { id: "triage", label: "Triage" },
    { id: "medication", label: "Medication" }, { id: "prescription", label: "Prescription" }, { id: "voice", label: "Voice" },
    { id: "wearable", label: "Wearables" }, { id: "care", label: "Appointments & SOS" }
  ];
  const chartTypes: PatientTimelineEvent["eventType"][] = ["triage", "medication", "prescription", "voice", "wearable", "appointment", "emergency"];
  const chartLabels: Record<PatientTimelineEvent["eventType"], string> = {
    triage: "Triage", medication: "Medication", prescription: "Prescription", voice: "Voice",
    wearable: "Wearables", appointment: "Visits", emergency: "Emergency"
  };
  const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const today = new Date();
  const activityDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - index));
    const counts = Object.fromEntries(chartTypes.map((type) => [type, 0])) as Record<PatientTimelineEvent["eventType"], number>;
    sorted.forEach((event) => {
      if (dayKey(new Date(event.createdAt)) === dayKey(date)) counts[event.eventType] += 1;
    });
    return { date, counts, total: Object.values(counts).reduce((sum, count) => sum + count, 0) };
  });
  const maxDailyActivity = Math.max(1, ...activityDays.map((day) => day.total));
  const activityTotals = chartTypes.map((type) => ({ type, count: activityDays.reduce((sum, day) => sum + day.counts[type], 0) }));
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = sorted.filter((event) => {
    const matchesCategory = filter === "all" ||
      (filter === "care" ? event.eventType === "appointment" || event.eventType === "emergency" : event.eventType === filter);
    const matchesQuery = !normalizedQuery || `${event.title} ${event.detail} ${event.status || ""} ${event.eventType}`.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });
  const grouped = filtered.reduce<Array<{ event: PatientTimelineEvent; occurrences: PatientTimelineEvent[] }>>((groups, event) => {
    const existing = event.eventType === "voice" && groups.find((group) =>
      group.event.eventType === "voice" && dayKey(new Date(group.event.createdAt)) === dayKey(new Date(event.createdAt)) &&
      group.event.title === event.title && group.event.detail === event.detail && group.event.status === event.status
    );
    if (existing) existing.occurrences.push(event);
    else groups.push({ event, occurrences: [event] });
    return groups;
  }, []);
  return <Panel title="Your health timeline" kicker="recent care activity">
    <div className="timeline-intro"><p>See your check-ins and care activity at a glance. Repeated voice checks are grouped by day.</p><span>{filtered.length} events</span></div>
    <section className="timeline-insights" aria-label="Recent activity overview">
      <div className="timeline-insight-heading"><div><span>YOUR WEEK</span><h3>Activity overview</h3></div><small>Last 7 days</small></div>
      <div className="timeline-chart" role="img" aria-label={`Daily activity for the last seven days. ${activityDays.map((day) => `${day.date.toLocaleDateString(undefined, { weekday: "long" })}: ${day.total} events`).join("; ")}`}>
        {activityDays.map((day) => <div className="timeline-chart-row" key={day.date.toISOString()}><span>{day.date.toLocaleDateString(undefined, { weekday: "short" })}</span><div className="timeline-chart-track"><div className="timeline-chart-fill" style={{ width: `${day.total ? Math.max(5, (day.total / maxDailyActivity) * 100) : 0}%` }}>{chartTypes.map((type) => day.counts[type] ? <i key={type} className={`chart-segment ${type}`} style={{ width: `${(day.counts[type] / day.total) * 100}%` }} title={`${chartLabels[type]}: ${day.counts[type]}`} /> : null)}</div></div><b>{day.total}</b></div>)}
      </div>
      <div className="timeline-legend">{activityTotals.filter((item) => item.count > 0).map(({ type, count }) => <span key={type}><i className={`chart-dot ${type}`} />{chartLabels[type]} <b>{count}</b></span>)}{activityTotals.every((item) => item.count === 0) ? <small>No activity recorded yet</small> : null}</div>
    </section>
    <div className="timeline-tools">
      <label className="timeline-search"><Search aria-hidden="true" /><span className="sr-only">Search patient history</span><input type="search" placeholder="Search activity…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="timeline-filters" role="group" aria-label="Filter timeline by activity">
        {filters.map((item) => <button type="button" key={item.id} aria-pressed={filter === item.id} className={filter === item.id ? "active" : ""} onClick={() => setFilter(item.id)}>{item.label}</button>)}
      </div>
    </div>
    <div className="patient-timeline">{grouped.length ? grouped.map(({ event, occurrences }) => <article className={`patient-timeline-event ${event.eventType}`} key={event.id}>
      <div className="timeline-marker"><span>{eventInfo[event.eventType].icon}</span></div>
      <div className="timeline-content">
        <div className="timeline-event-header"><span className="timeline-category">{eventInfo[event.eventType].label}</span>{occurrences.length > 1 ? <span className="timeline-status grouped-count">{occurrences.length} checks</span> : event.status ? <span className={`timeline-status ${event.status.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{event.status}</span> : null}</div>
        <h3>{event.title}</h3>
        <p>{event.detail}</p>
        <time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time>
        {occurrences.length > 1 ? <details className="timeline-occurrences"><summary>See all {occurrences.length} checks</summary><ul>{occurrences.map((item) => <li key={item.id}>{new Date(item.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {item.status || "Recorded"}</li>)}</ul></details> : null}
      </div>
    </article>) : <div className="empty-state"><History /><p>{events.length ? "No activity matches those filters. Clear the search or choose another category." : "No events recorded yet. Run a triage or monitoring action to begin the history."}</p>{events.length ? <button type="button" onClick={() => { setQuery(""); setFilter("all"); }}>Clear filters</button> : null}</div>}</div>
    <p className="safety-note">Your recent activity is saved in this browser. It may be incomplete; share it with a clinician as a reference.</p>
  </Panel>;
}

function SettingsView({ profile, setProfile, palette, setPalette, accessibility, setAccessibility, preferences, setPreferences, notificationPermission, enableDoseNotifications, caretakerSmsStatus, hasMedicationSchedule, accountEmail, backupData, restoreBackup }: {
  profile: PatientProfile; setProfile: (value: PatientProfile) => void; palette: PaletteId; setPalette: (value: PaletteId) => void;
  accessibility: { largeText: boolean; highContrast: boolean }; setAccessibility: (value: { largeText: boolean; highContrast: boolean }) => void;
  preferences: { medicationReminders: boolean; medicationReminderLeadMinutes: number; caretakerAlerts: boolean; caretakerDoseSms: boolean; patientDoseSms: boolean; dailyHealthTipSms: boolean; healthTipTime: string; patientDoseWhatsApp: boolean; emergencyCountdown: number; demoMode: boolean; shareWearableContext: boolean };
  setPreferences: (value: { medicationReminders: boolean; medicationReminderLeadMinutes: number; caretakerAlerts: boolean; caretakerDoseSms: boolean; patientDoseSms: boolean; dailyHealthTipSms: boolean; healthTipTime: string; patientDoseWhatsApp: boolean; emergencyCountdown: number; demoMode: boolean; shareWearableContext: boolean }) => void;
  notificationPermission: NotificationPermission | "unsupported";
  enableDoseNotifications: () => Promise<void>;
  caretakerSmsStatus: { smsConfigured: boolean; enabled: boolean; patientSmsEnabled: boolean; dailyHealthTipSms?: boolean; healthTipTime?: string; lastHealthTipAt?: string | null; lastHealthTipError?: string | null; whatsappConfigured: boolean; whatsappEnabled: boolean; scheduleSaved?: boolean; doseCount?: number; lastSentAt?: string | null; lastError?: string | null };
  hasMedicationSchedule: boolean;
  accountEmail: string;
  backupData: Record<string, unknown>;
  restoreBackup: (value: unknown) => string;
}) {
  const updateProfile = (key: keyof PatientProfile, value: string) => setProfile({ ...profile, [key]: key === "age" ? Number(value) : value });
  const toggle = (key: "medicationReminders" | "caretakerAlerts" | "shareWearableContext") => setPreferences({ ...preferences, [key]: !preferences[key] });
  const [backupMessage, setBackupMessage] = useState("");
  const [lastBackupAt, setLastBackupAt] = useStoredState<string | null>("vital.backup.lastExport.v1", null);
  const [smsMessages, setSmsMessages] = useState<Awaited<ReturnType<typeof fetchSmsDeliveryStatus>>["messages"]>([]);
  const [smsConfiguredLive, setSmsConfiguredLive] = useState<boolean | null>(null);
  const [smsSenderReady, setSmsSenderReady] = useState<boolean | null>(null);
  const [smsSenderMessage, setSmsSenderMessage] = useState("");
  const [smsHistoryError, setSmsHistoryError] = useState("");
  const [smsHistoryBusy, setSmsHistoryBusy] = useState(false);
  const backupFileInput = useRef<HTMLInputElement | null>(null);
  function downloadBackup() {
    try {
      const exportedAt = new Date();
      const contents = JSON.stringify({ format: "VITAL local health data backup", version: 1, exportedAt: exportedAt.toISOString(), accountEmail, data: backupData }, null, 2);
      const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `vital-backup-${exportedAt.toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setLastBackupAt(exportedAt.toISOString());
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setBackupMessage("Backup downloaded. Store the file somewhere private; it contains sensitive health information.");
    } catch {
      setBackupMessage("Could not create the backup. Check browser download permissions and try again.");
    }
  }
  async function importBackupFile(file: File | undefined) {
    if (!file) return;
    if (!window.confirm("Restore this VITAL backup? It will replace the health data currently saved in this browser for this account.")) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      setBackupMessage(restoreBackup(parsed));
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : "Could not restore this backup.");
    } finally {
      if (backupFileInput.current) backupFileInput.current.value = "";
    }
  }
  async function refreshSmsHistory() {
    setSmsHistoryBusy(true);
    try {
      const result = await fetchSmsDeliveryStatus();
      setSmsMessages(result.messages);
      setSmsConfiguredLive(result.configured);
      setSmsSenderReady(result.senderReady);
      setSmsSenderMessage(result.senderMessage);
      setSmsHistoryError("");
    } catch (error) {
      setSmsHistoryError(error instanceof Error ? error.message : "Could not check Twilio message status.");
    } finally {
      setSmsHistoryBusy(false);
    }
  }
  useEffect(() => {
    void refreshSmsHistory();
    const timer = window.setInterval(() => void refreshSmsHistory(), 45_000);
    return () => window.clearInterval(timer);
  }, []);
  const phoneReminderStatus = !caretakerSmsStatus.smsConfigured
    ? "Twilio has no active SMS sender. VITAL queues messages for a paired Android phone to send through its SIM; keep the phone app open or camera service running and enable phone SMS. Browser reminders are local to this device."
    : !/^\+[1-9]\d{7,14}$/.test((profile.patientPhone || "").replace(/[\s()-]/g, ""))
      ? "SMS sending is configured. Add your mobile number in international format in Patient profile to receive reminders."
      : !hasMedicationSchedule || !caretakerSmsStatus.scheduleSaved
        ? "SMS is configured, but analyze the prescription and save at least one dose time before reminders can be sent."
        : !caretakerSmsStatus.patientSmsEnabled
          ? "Your schedule is saved. Turn on SMS reminders below to receive dose messages on your phone."
          : `SMS reminders are enabled for ${caretakerSmsStatus.doseCount || "your scheduled"} dose times: 10 minutes before, 5 minutes before, and at the scheduled time. Twilio or the paired Android phone must be available; the VITAL backend must stay running.`;
  return <div className="two-column settings-page">
    <Panel title="Accessibility" kicker="display preferences">
      <div className="settings-options">
        <label className="setting-toggle"><span><strong>Larger text</strong><small>Increase text size across VITAL for easier reading.</small></span><input type="checkbox" checked={accessibility.largeText} onChange={() => setAccessibility({ ...accessibility, largeText: !accessibility.largeText })} /></label>
        <label className="setting-toggle"><span><strong>Higher contrast</strong><small>Strengthen text and borders throughout the app.</small></span><input type="checkbox" checked={accessibility.highContrast} onChange={() => setAccessibility({ ...accessibility, highContrast: !accessibility.highContrast })} /></label>
      </div>
    </Panel>
    <Panel title="Patient profile" kicker="saved in this browser">
      <div className="appointment-form settings-form">{([ ["name", "Name"], ["age", "Age"], ["condition", "Conditions monitored"], ["patientPhone", "Your mobile number for SMS"], ["caretaker", "Caretaker"], ["caretakerPhone", "Caretaker phone"], ["location", "Location"] ] as Array<[keyof PatientProfile, string]>).map(([key, label]) => <label key={key}>{label}<input type={key === "age" ? "number" : "text"} min={key === "age" ? 1 : undefined} max={key === "age" ? 120 : undefined} value={key === "age" && !profile.age ? "" : profile[key] ?? ""} onChange={(event) => updateProfile(key, event.target.value)} /></label>)}
      <label>Theme<select value={palette} onChange={(event) => setPalette(event.target.value as PaletteId)}>{palettes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
    </Panel>
    <Panel title="Your data backup" kicker="download a private copy">
      <div className="data-backup-panel">
        <p>Download your VITAL profile, preferences, screening result, symptoms, medication records, appointments, and timeline as a JSON file.</p>
        <ActionButton icon={<Download />} onClick={downloadBackup}>Download data backup</ActionButton>
        <input ref={backupFileInput} className="sr-only" type="file" accept="application/json,.json" aria-label="Choose a VITAL backup JSON file" onChange={(event) => void importBackupFile(event.target.files?.[0])} />
        <ActionButton icon={<Upload />} onClick={() => backupFileInput.current?.click()} variant="secondary">Restore backup</ActionButton>
        <p className={`backup-reminder${lastBackupAt && Date.now() - new Date(lastBackupAt).getTime() > 30 * 24 * 60 * 60 * 1000 ? " overdue" : ""}`} role="status">{lastBackupAt ? `Last backup download started ${new Date(lastBackupAt).toLocaleDateString()}. Download a fresh copy monthly.` : "No backup download recorded yet. Save a private copy now and repeat monthly."}</p>
        <small>This file contains sensitive health information. It stays on this device unless you choose to move or share it.</small>
        {backupMessage ? <p className="safety-note" role="status">{backupMessage}</p> : null}
      </div>
    </Panel>
    <Panel title="SMS delivery status" kicker="message history" action={<span className={`wearable-source-badge ${smsSenderReady ? "" : "phone-only"}`}>{smsSenderReady === null ? "Checking sender…" : smsSenderReady ? "Twilio sender ready" : "Phone SIM fallback"}</span>}>
      <div className="sms-delivery-panel">
        <div className="sms-delivery-heading"><p>VITAL uses Twilio when a sender is ready. Otherwise, messages queue for the paired Android phone’s SIM. Phone submission is not proof of carrier delivery.</p><ActionButton icon={<RefreshCw />} onClick={() => void refreshSmsHistory()} disabled={smsHistoryBusy} variant="secondary">{smsHistoryBusy ? "Checking…" : "Refresh statuses"}</ActionButton></div>
        <p className="sms-delivery-note">For phone fallback, pair the VITAL Android app, enable Phone SMS there, and keep it open or its camera service running. Carrier fees may apply.</p>
        {smsSenderMessage ? <p className={smsSenderReady ? "sms-sender-ready" : "sms-delivery-error"} role="status">{smsSenderMessage}</p> : null}
        {smsHistoryError ? <p className="sms-delivery-error" role="status">{smsHistoryError} The last recorded status is kept below.</p> : null}
        {smsMessages.length ? <div className="sms-delivery-list" aria-live="polite">{smsMessages.slice(0, 12).map((message) => <article key={message.id} className={[
          "sms-delivery-record",
          ["failed", "undelivered", "canceled"].includes(message.status) ? "failed" : message.status === "delivered" ? "delivered" : ""
        ].filter(Boolean).join(" ")}>
          <div><strong>{message.purpose.replace(/-/g, " ")}</strong><small>{new Date(message.submittedAt).toLocaleString()} · to number ending {message.toLast4 || "????"}</small></div>
          <span>{smsDeliveryLabel(message.status)}</span>
          {message.errorCode ? <small className="sms-delivery-error-code">Twilio error code {message.errorCode}</small> : null}
        </article>)}</div> : <div className="empty-state"><MessageCircle /><p>{smsHistoryBusy ? "Checking for recent messages…" : "No SMS attempts have been recorded for this account yet."}</p></div>}
        <small>SMS history records delivery metadata only. A message queued for Android SMS is held on the VITAL computer for up to 24 hours, then its body and number are removed if unsent. Phone submission does not confirm carrier delivery.</small>
      </div>
    </Panel>
    <Panel title="Monitoring preferences" kicker="your preferences">
      <div className="settings-options">
        <div className="notification-permission" role="status"><div><strong>Phone reminder delivery</strong><small>{caretakerSmsStatus.lastError || phoneReminderStatus}</small></div></div>
        <label className="setting-toggle"><span><strong>Daily health slogan by SMS</strong><small>{!/^\+[1-9]\d{7,14}$/.test((profile.patientPhone || "").replace(/[\s()-]/g, "")) ? "Add your mobile number with country code to receive daily tips." : "Send one general wellness slogan each day. Twilio is used when available; otherwise it queues for the paired phone SIM. Carrier charges may apply."}</small></span><input type="checkbox" checked={Boolean(preferences.dailyHealthTipSms)} disabled={!preferences.dailyHealthTipSms && !/^\+[1-9]\d{7,14}$/.test((profile.patientPhone || "").replace(/[\s()-]/g, ""))} onChange={() => setPreferences({ ...preferences, dailyHealthTipSms: !preferences.dailyHealthTipSms })} /></label>
        <label className="health-tip-time-setting">Daily tip time<input type="time" value={preferences.healthTipTime || "09:00"} onChange={(event) => setPreferences({ ...preferences, healthTipTime: event.target.value })} /><small>Uses this device’s local time zone. SMS is sent only when you enable the daily tip above.</small></label>
        {caretakerSmsStatus.lastHealthTipError ? <p className="safety-note" role="status">{caretakerSmsStatus.lastHealthTipError}</p> : null}
        {caretakerSmsStatus.lastHealthTipAt ? <p className="safety-note">Last daily health tip submitted or queued: {new Date(caretakerSmsStatus.lastHealthTipAt).toLocaleString()} · handset delivery is not confirmed.</p> : null}
        {[ ["medicationReminders", "Medication reminders", "Show a reminder before each scheduled dose."], ["caretakerAlerts", "Caretaker message shortcuts", "Show WhatsApp and text options. You review and send each message yourself."], ["shareWearableContext", "Include wearable readings", "Show synced readings with your health monitoring."] ].map(([key, label, detail]) => <label className="setting-toggle" key={key as string}><span><strong>{label}</strong><small>{detail}</small></span><input type="checkbox" checked={preferences[key as keyof typeof preferences] as boolean} onChange={() => toggle(key as "medicationReminders" | "caretakerAlerts" | "shareWearableContext")} /></label>)}
        <label>Reminder lead time<select value={preferences.medicationReminderLeadMinutes ?? 10} onChange={(event) => setPreferences({ ...preferences, medicationReminderLeadMinutes: Number(event.target.value) })}><option value={5}>5 minutes before</option><option value={10}>10 minutes before</option></select></label>
        <div className="notification-permission"><div><strong>Browser notifications</strong><small>{notificationPermission === "granted" ? "Enabled · reminders can appear outside this tab while the browser is open." : notificationPermission === "denied" ? "Blocked by your browser. Allow notifications for this site in browser settings." : notificationPermission === "unsupported" ? "Not supported here; in-app reminders still work while VITAL is open." : "Allow notifications so dose reminders can appear outside the page."}</small></div>{notificationPermission !== "granted" && notificationPermission !== "unsupported" ? <button type="button" onClick={() => void enableDoseNotifications()}>{notificationPermission === "denied" ? "Check permission" : "Enable notifications"}</button> : null}</div>
        <label className="setting-toggle"><span><strong>Text the primary caretaker at dose time</strong><small>{!/^\+[1-9]\d{7,14}$/.test(profile.caretakerPhone.replace(/[\s()-]/g, "")) ? "Add the caretaker number in international format in Patient profile." : !hasMedicationSchedule ? "Analyze the prescription and set a dose time first." : "Send one SMS for each scheduled medicine dose. Twilio or the paired Android phone SIM can send it."}</small></span><input type="checkbox" checked={Boolean(preferences.caretakerDoseSms)} disabled={!preferences.caretakerDoseSms && (!/^\+[1-9]\d{7,14}$/.test(profile.caretakerPhone.replace(/[\s()-]/g, "")) || !hasMedicationSchedule)} onChange={() => setPreferences({ ...preferences, caretakerDoseSms: !preferences.caretakerDoseSms })} /></label>
        <label className="setting-toggle"><span><strong>SMS me about scheduled medicines</strong><small>{!/^\+[1-9]\d{7,14}$/.test((profile.patientPhone || "").replace(/[\s()-]/g, "")) ? "Add your mobile number with country code in Patient profile." : !hasMedicationSchedule ? "Analyze the prescription and set a dose time first." : "Receive SMS 10 minutes before, 5 minutes before, and at each scheduled dose time. Twilio or the paired Android phone SIM can send it."}</small></span><input type="checkbox" checked={Boolean(preferences.patientDoseSms)} disabled={!preferences.patientDoseSms && (!/^\+[1-9]\d{7,14}$/.test((profile.patientPhone || "").replace(/[\s()-]/g, "")) || !hasMedicationSchedule)} onChange={() => setPreferences({ ...preferences, patientDoseSms: !preferences.patientDoseSms })} /></label>
        {caretakerSmsStatus.lastSentAt ? <p className="safety-note">Last reminder submitted or queued: {new Date(caretakerSmsStatus.lastSentAt).toLocaleString()}. VITAL cannot confirm that the handset received or displayed it.</p> : null}
        <label>Emergency cancellation countdown<select value={preferences.emergencyCountdown} onChange={(event) => setPreferences({ ...preferences, emergencyCountdown: Number(event.target.value) })}><option value={5}>5 seconds</option><option value={10}>10 seconds</option><option value={15}>15 seconds</option></select></label>
      </div><p className="safety-note">Your profile and preferences are saved in this browser. Emergency alerts are not sent automatically; use the phone or message controls to contact someone.</p>
    </Panel>
  </div>;
}

function ExportView({
  profile,
  triage,
  medicationScore,
  appointments,
  incident,
  voiceDistress,
  prescriptionPlan,
  medicationLogs,
  patientTimeline,
  wearable,
  symptoms,
  vitals
}: {
  profile: PatientProfile;
  triage: TriageResponse;
  medicationScore: number;
  appointments: Appointment[];
  incident: Incident | null;
  voiceDistress: boolean;
  prescriptionPlan: PrescriptionPlan | null;
  medicationLogs: MedicationLog[]; patientTimeline: PatientTimelineEvent[]; wearable: WearableSummary | null; symptoms: string; vitals: TriageVitals;
}) {
  const triageAssessed = hasTriageResult(triage);
  const voiceCheckRecorded = patientTimeline.some((event) => event.eventType === "voice");
  const generatedAt = new Date();

  const [reportPreview, setReportPreview] = useState<{ url: string; filename: string; pages: string[] } | null>(null);

  useEffect(() => {
    if (!reportPreview) return;
    return () => URL.revokeObjectURL(reportPreview.url);
  }, [reportPreview]);

  function previewReport() {
    try {
      const report = createHealthReportPdf({
        profile,
        triage,
        medicationScore,
        appointments,
        incident,
        voiceDistress,
        prescriptionPlan,
        medicationLogs,
        patientTimeline,
        wearable,
        symptoms,
        vitals
      });
      const url = URL.createObjectURL(report.pdf);
      const patientName = (profile.name || 'patient').normalize('NFKD').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'patient';
      setReportPreview({
        url,
        filename: `vital-health-report-${patientName}-${generatedAt.toISOString().slice(0, 10)}.pdf`,
        pages: report.previewPages
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'The health report could not be prepared.');
    }
  }
  function downloadPreviewPdf() {
    if (!reportPreview) return;
    const link = document.createElement("a");
    link.href = reportPreview.url;
    link.download = reportPreview.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  const reportEvents = [...patientTimeline]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
  const verifiedDoses = medicationLogs.filter((item) => item.status === "Verified").length;
  const photoCheckedDoses = medicationLogs.filter((item) => item.status === "Photo checked").length;
  const missedDoses = medicationLogs.filter((item) => item.status === "Missed").length;
  const pendingDoses = medicationLogs.filter((item) => item.status === "Pending").length;

  return (
    <div className="medication-layout">
      {reportPreview ? <div className="report-preview-backdrop" role="presentation" onClick={() => setReportPreview(null)}><section className="report-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="report-preview-title" onClick={(event) => event.stopPropagation()}><header className="report-preview-header"><div><h2 id="report-preview-title">Preview health report</h2><p>Review the report pages, then download the PDF when you’re ready.</p></div><button type="button" className="report-preview-close" aria-label="Close preview" onClick={() => setReportPreview(null)}><X /></button></header><div className="report-preview-pages" aria-label="Health report pages">{reportPreview.pages.map((page, index) => <img className="report-preview-page" key={index} src={page} alt={`Health report page ${index + 1}`} />)}</div><footer className="report-preview-actions"><button type="button" className="button secondary" onClick={() => setReportPreview(null)}>Close preview</button><ActionButton icon={<Download />} onClick={downloadPreviewPdf}>Download PDF</ActionButton></footer></section></div> : null}
      <Panel title="Health report" kicker="shareable patient summary">
        <div className="export-card">
          <Download />
          <strong>Save a readable report</strong>
          <p>Preview a report of information recorded in VITAL. Unavailable and unreported values are identified as such.</p>
          <ActionButton icon={<FileText />} onClick={previewReport}>Download PDF</ActionButton>
        </div>
      </Panel>
      <Panel title="What’s in your report" kicker="current patient summary">
        <div className="report-overview">
          <p className="report-intro">Prepared for <strong>{profile.name || "Patient"}</strong>{profile.condition ? ` · ${profile.condition}` : ""}</p>
          <div className="report-stat-grid">
            <div><span>Latest screening estimate</span><strong>{triageAssessed ? triage.state : "Not assessed"}</strong><small>{triageAssessed ? `Risk score ${triage.score}/100` : "No result recorded"}</small></div>
            <div><span>Medication check-ins</span><strong>{medicationLogs.length ? `${medicationScore}%` : "No data"}</strong><small>{medicationLogs.length} dose records</small></div>
            <div><span>Voice check</span><strong>{!voiceCheckRecorded ? "Not checked" : voiceDistress ? "Distress flag" : "No flag"}</strong><small>{voiceCheckRecorded ? "Latest recorded session" : "No session recorded"}</small></div>
            <div><span>Care activity</span><strong>{appointments.length} appointments</strong><small>{patientTimeline.length} timeline events</small></div>
          </div>
          <h3>Your PDF includes</h3>
          <ul className="report-includes">
            <li>Patient profile and recorded vital readings</li>
            <li>Triage score, risk factors, protective signals, and recommendations</li>
            <li>Medication adherence history{prescriptionPlan ? " and analyzed dose schedule" : ""}</li>
            <li>Wearable context, appointments, and recent timeline events</li>
          </ul>
          <p className="safety-note">This summary contains the information saved in VITAL. Share it with a clinician as helpful.</p>
        </div>
      </Panel>
      <article className="print-health-report">
        <header className="report-print-header">
          <div className="report-print-brand"><span className="report-brand-mark">V</span><span>VITAL <small>PERSONAL HEALTH SUMMARY</small></span></div>
          <div className="report-generated"><span>Prepared {generatedAt.toLocaleDateString()}</span><small>{generatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small></div>
          <h1>Patient health report</h1>
          <p>A summary of the information recorded in VITAL to help you prepare for a conversation with your care team.</p>
        </header>
        <div className="report-print-notice"><ShieldCheck /><span>This report is based on information saved in VITAL. It is not a diagnosis or a substitute for professional medical advice.</span></div>

        <section className="report-print-section report-patient-section">
          <div className="report-section-title"><span>01</span><h2>Patient details</h2></div>
          <div className="report-patient-grid">
            <div><small>Patient</small><strong>{profile.name || "Not provided"}</strong></div><div><small>Age</small><strong>{profile.age > 0 ? profile.age : "Not provided"}</strong></div>
            <div><small>Health context</small><strong>{profile.condition || "Not provided"}</strong></div><div><small>Location</small><strong>{profile.location || "Not provided"}</strong></div>
            <div><small>Care contact</small><strong>{profile.caretaker || "Not provided"}</strong></div><div><small>Contact number</small><strong>{profile.caretakerPhone || "Not provided"}</strong></div>
          </div>
        </section>

        <section className="report-print-section">
          <div className="report-section-title"><span>02</span><h2>Latest symptom check</h2></div>
          <div className={`report-triage-card ${triageAssessed ? stateClass(triage.state) : "notassessed"}`}>
            <div className="report-triage-score"><small>VITAL screening estimate</small><strong>{triageAssessed ? triage.state : "Not assessed"}</strong><span>{triageAssessed ? `Risk score ${triage.score}/100` : "No estimate recorded"}</span><div className="report-score-track"><i style={{ width: `${triageAssessed ? Math.max(0, Math.min(100, triage.score)) : 0}%` }} /></div></div>
            <div className="report-triage-detail"><small>Symptoms entered</small><p>{symptoms.trim() || "No symptom description recorded."}</p><small>Risk factors</small><p>{triageAssessed ? triage.riskFactors.length ? triage.riskFactors.join(" · ") : "No additional risk factors listed." : "No screening estimate recorded."}</p></div>
          </div>
          {triage.recommendations.length ? <div className="report-recommendations"><h3>Suggested next steps</h3><ul>{triage.recommendations.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></div> : null}
        </section>

        <section className="report-print-section">
          <div className="report-section-title"><span>03</span><h2>Recorded vital readings</h2></div>
          <div className="report-vitals-grid">
            <div><small>Oxygen saturation</small><strong>{vitals.spo2 ? `${vitals.spo2}%` : "Not recorded"}</strong></div><div><small>Pulse</small><strong>{vitals.pulse ? `${vitals.pulse} bpm` : "Not recorded"}</strong></div>
            <div><small>Temperature</small><strong>{vitals.temperature ? `${vitals.temperature} °F` : "Not recorded"}</strong></div><div><small>Systolic pressure</small><strong>{vitals.systolicBp ? `${vitals.systolicBp} mmHg` : "Not recorded"}</strong></div><div><small>Breathing rate</small><strong>{vitals.respiration ? `${vitals.respiration}/min` : "Not recorded"}</strong></div>
          </div>
          <p className="report-voice-note"><strong>Voice check:</strong> {!voiceCheckRecorded ? "No session recorded." : voiceDistress ? "A distress flag was recorded in the latest voice or typed-text check." : "No distress flag was recorded in the latest voice or typed-text check."} This simple check is not a medical assessment.</p>
        </section>

        <section className="report-print-section">
          <div className="report-section-title"><span>04</span><h2>Medication check-ins</h2></div>
          <div className="report-medication-summary"><strong>{medicationLogs.length ? `${medicationScore}%` : "No data"}</strong><span>{medicationLogs.length ? "recorded check-in proportion" : "No dose check-ins recorded"}</span><div><b>{verifiedDoses}</b> marked taken <b>{photoCheckedDoses}</b> photo checked <b>{missedDoses}</b> missed <b>{pendingDoses}</b> need review</div></div>
          {prescriptionPlan?.doses?.length ? <div className="report-schedule-list"><h3>Recorded schedule · check against your prescription</h3>{prescriptionPlan.doses.map((dose, index) => <div key={`${dose.time}-${dose.medication}-${index}`}><time>{dose.time}</time><strong>{dose.medication}</strong><span>{dose.dose} · {dose.instructions}</span></div>)}</div> : null}
          <div className="report-medication-list">{medicationLogs.slice(0, 10).map((item) => <div key={item.id}><time>{item.dateKey || "Date not recorded"} · {item.time}</time><strong>{item.label}</strong><span className={`report-status ${item.status === "Photo checked" ? "photo" : item.status === "Verified" ? "confirmed" : item.status === "Missed" ? "missed" : "pending"}`}>{item.status}</span></div>)}</div>
          {photoCheckedDoses ? <p className="report-small-note">A photo check records a visual tablet match only. It does not confirm that the dose was taken.</p> : null}
        </section>

        <section className="report-print-section report-two-columns">
          <div><div className="report-section-title"><span>05</span><h2>Wearable context</h2></div>{wearable?.latest ? <><p><strong>{wearable.latest.deviceModel}</strong> · {wearable.latest.source}</p><p>Recorded {new Date(wearable.latest.observedAt).toLocaleString()}</p><div className="report-wearable-stats"><span>Heart rate <b>{wearable.context.heartRateBpm ?? "—"} bpm</b></span><span>Steps <b>{wearable.context.steps?.toLocaleString() ?? "—"}</b></span><span>Sleep <b>{wearable.context.sleepMinutes != null ? `${Math.round(wearable.context.sleepMinutes / 60)}h ${wearable.context.sleepMinutes % 60}m` : "—"}</b></span></div><p className="report-small-note">Wellness context only; not a medical measurement.</p></> : <p>No wearable reading is saved.</p>}</div>
          <div><div className="report-section-title"><span>06</span><h2>Visit reminders</h2></div>{appointments.length ? appointments.slice(0, 4).map((item) => <div className="report-visit" key={item.id}>{item.hospitalName}<small>{item.department} · {item.date} at {item.time}</small><small>Reminder saved in VITAL; contact the hospital to confirm.</small></div>) : <p>No visit reminders saved.</p>}</div>
        </section>

        {incident ? <section className="report-print-section"><div className="report-section-title"><span>07</span><h2>Emergency help activity</h2></div><p><strong>{incident.id}</strong> · {incident.hospital.name}</p><p className="report-small-note">Saved in VITAL only. No emergency service or caretaker was contacted.</p></section> : null}

        <section className="report-print-section">
          <div className="report-section-title"><span>{incident ? "08" : "07"}</span><h2>Recent activity</h2></div>
          {reportEvents.length ? <div className="report-event-list">{reportEvents.map((item) => <div key={item.id}><time>{new Date(item.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time><span><strong>{item.title}</strong><small>{item.detail}</small></span></div>)}</div> : <p>No recent activity is saved.</p>}
        </section>
        <footer className="report-print-footer"><strong>VITAL</strong><span>For discussion with a healthcare professional · Generated {generatedAt.toLocaleString()}</span></footer>
      </article>
    </div>
  );
}

export default App;
