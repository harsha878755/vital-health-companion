import { API_BASE, fallbackHospitals } from "./data";
import {
  Appointment,
  AutomationEvent,
  Hospital,
  Incident,
  PossibleFallAlert,
  CaregiverCheckIn,
  LocalAiStatus,
  MedicationVisionProof,
  MedicationTrainingManifest,
  MedicationReferenceImage,
  ModelEvidence,
  PrescriptionImageExtraction,
  PrescriptionPlan,
  TriagePayload,
  TriageResponse,
  WearableReading,
  WearableSummary
} from "./types";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!response.ok) throw await responseError(response, `GET ${path} failed`);
  return (await response.json()) as T;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw await responseError(response, `POST ${path} failed`);
  return (await response.json()) as T;
}

async function responseError(response: Response, fallback: string) {
  try {
    const payload = await response.json() as { error?: string };
    return new Error(payload.error || fallback);
  } catch {
    return new Error(fallback);
  }
}

export type AuthUser = { id: string; email: string; expiresAt: number };

export async function fetchAuthSession() {
  return getJson<{ authenticated: boolean; user: AuthUser | null }>("/api/auth/session");
}

export async function registerAccount(email: string, password: string) {
  return postJson<{ authenticated: boolean; user: AuthUser }>("/api/auth/register", { email, password });
}

export async function loginAccount(email: string, password: string) {
  return postJson<{ authenticated: boolean; user: AuthUser }>("/api/auth/login", { email, password });
}

export async function logoutAccount() {
  return postJson<{ authenticated: false }>("/api/auth/logout", {});
}

export async function fetchHealth() {
  return getJson<{ ok: boolean; modelVersion?: string; datasetStatus?: string }>("/api/health");
}

export async function fetchHospitals() {
  const payload = await getJson<{ hospitals: Hospital[] }>("/api/hospitals");
  return payload.hospitals || fallbackHospitals;
}

export async function fetchModelEvidence() {
  return getJson<ModelEvidence>("/api/model/evidence");
}

export async function fetchLocalAiStatus() {
  return getJson<LocalAiStatus>("/api/local-ai/status");
}

export async function postTriage(payload: TriagePayload) {
  return postJson<TriageResponse>("/api/triage", payload);
}

export async function postHealthQuestion(question: string, context: Record<string, string | number>, history: Array<{ role: "user" | "assistant"; text: string }>) {
  return postJson<{ answer: string; urgent: boolean; mode: string; suggestions?: string[] }>("/api/assistant/chat", { question, context, history });
}

export async function transcribeAssistantVoice(audioBase64: string) {
  return postJson<{ transcription: string; engine: string }>("/api/assistant/transcribe", { audioBase64 });
}

export async function postAppointment(appointment: Appointment & { patientPhone?: string; caretakerPhone?: string }) {
  return postJson<Appointment>("/api/appointments", appointment);
}

export async function fetchAppointments() {
  return getJson<{ appointments: Appointment[] }>("/api/appointments");
}

export async function createPhoneCameraPairing() {
  return postJson<{ pairingCode: string; expiresAt: number }>("/api/camera/pairing", {});
}

export async function fetchPhoneCameraStream() {
  return getJson<{ paired: boolean; active: boolean; lastFrameAt: number | null; frameBase64: string | null; poseStatus: string; poseStatusAt: number | null; lanEnabled: boolean; hostAddresses: string[] }>("/api/camera/stream");
}

export async function fetchPhoneCameraStatus() {
  return getJson<{ paired: boolean; active: boolean; lastFrameAt: number | null; poseStatus: string; poseStatusAt: number | null; lanEnabled: boolean; hostAddresses: string[] }>("/api/camera/stream?metadataOnly=1");
}

export async function revokePhoneCamera() {
  return postJson<{ paired: boolean; revoked: boolean }>("/api/camera/revoke", {});
}

export async function fetchCameraEmergencySettings() {
  return getJson<{ enabled: boolean; caretakerPhone: string; emergencyPhones: string[]; smsConfigured: boolean; simSmsAvailable: boolean; ready: boolean }>("/api/camera/emergency-settings");
}

export async function saveCameraEmergencySettings(payload: { enabled: boolean; caretakerPhone: string; emergencyPhones: string[]; patientName: string }) {
  return postJson<{ enabled: boolean; smsConfigured: boolean; simSmsAvailable: boolean; ready: boolean }>("/api/camera/emergency-settings", payload);
}

export async function postIncident(payload: Partial<Incident>) {
  return postJson<Incident>("/api/emergency/incidents", payload);
}

export async function fetchEmergencyIncidents() {
  const payload = await getJson<{ incidents: Array<Incident | PossibleFallAlert> }>("/api/emergency/incidents");
  return payload.incidents || [];
}

export async function acknowledgePossibleFall(id: string, status: CaregiverCheckIn, note = "") {
  return postJson<PossibleFallAlert>(`/api/emergency/incidents/${encodeURIComponent(id)}/acknowledgement`, { status, note });
}

export async function parsePrescription(text: string, source = "manual-entry") {
  return postJson<PrescriptionPlan>("/api/prescriptions/parse", { text, source });
}

export async function extractPrescriptionImage(imageBase64: string, mimeType = "image/jpeg") {
  return postJson<PrescriptionImageExtraction>("/api/prescriptions/extract-image", { imageBase64, mimeType });
}

export async function readTabletImprint(imageBase64: string, mimeType = "image/jpeg") {
  return postJson<{ imprint: string; readable: boolean; confidence: "low" | "medium" | "high"; uncertainCharacters: string[]; modelId: string; engine: string; note: string }>("/api/medication/read-imprint", { imageBase64, mimeType });
}

export async function readMedicinePackageLabel(imageBase64: string, mimeType = "image/jpeg") {
  return postJson<{ medicineName: string; strength: string; transcription: string; confidence: "low" | "medium" | "high"; modelId: string; engine: string; note: string }>("/api/medication/read-package-label", { imageBase64, mimeType });
}

export async function screenHealthPhoto(imageBase64: string, concernType: string, symptoms: string[]) {
  return postJson<{ observations: string[]; limitations: string[]; modelId: string; engine: string }>("/api/health/photo-screen", { imageBase64, mimeType: "image/jpeg", concernType, symptoms });
}

export async function fetchWearableSummary(patientId = "demo-patient") {
  return getJson<WearableSummary>(`/api/wearables/summary?patientId=${encodeURIComponent(patientId)}`);
}

export async function fetchWearableReadings(patientId = "demo-patient") {
  return getJson<{ readings: WearableReading[] }>(`/api/wearables/readings?patientId=${encodeURIComponent(patientId)}`);
}

export async function postWearableReading(reading: WearableReading) {
  return postJson<WearableReading>("/api/wearables/readings", reading);
}

export async function fetchAutomationEvents() {
  return getJson<{ events: AutomationEvent[] }>("/api/automation/audit");
}

export async function fetchMedicationReminderStatus() {
  return getJson<{ smsConfigured: boolean; enabled: boolean; patientSmsEnabled: boolean; dailyHealthTipSms?: boolean; healthTipTime?: string; lastHealthTipAt?: string | null; lastHealthTipError?: string | null; whatsappConfigured: boolean; whatsappEnabled: boolean; scheduleSaved?: boolean; doseCount?: number; lastSentAt?: string | null; lastError?: string | null }>("/api/medication/reminders");
}

export interface SmsDeliveryRecord {
  id: string;
  sid?: string;
  purpose: string;
  toLast4: string;
  status: string;
  errorCode?: string;
  submittedAt: string;
  updatedAt: string;
}

export async function fetchSmsDeliveryStatus() {
  return getJson<{ configured: boolean; senderReady: boolean; senderMessage: string; senderType?: string; messages: SmsDeliveryRecord[]; checkedAt: string }>("/api/sms/deliveries");
}

export async function syncMedicationReminderSchedule(payload: {
  enabled: boolean;
  patientSmsEnabled: boolean;
  dailyHealthTipSms: boolean;
  healthTipTime: string;
  whatsappEnabled: boolean;
  phone: string;
  patientPhone: string;
  patientName: string;
  timeZone: string;
  utcOffsetMinutes: number;
  doses: Array<{ medication: string; dose: string; time: string }>;
}) {
  return postJson<{ enabled: boolean; patientSmsEnabled: boolean; dailyHealthTipSms: boolean; healthTipTime: string; smsConfigured: boolean; whatsappConfigured: boolean; whatsappEnabled: boolean; scheduleSaved?: boolean; doseCount: number; lastSentAt?: string | null; lastError?: string | null; lastHealthTipAt?: string | null; lastHealthTipError?: string | null }>("/api/medication/reminders", payload);
}

export async function fetchAutomationAudit() {
  return getJson<{ events: import("./types").AutomationEvent[] }>("/api/automation/audit");
}

export async function fetchMedicationVisionProof() {
  return getJson<MedicationVisionProof>("/api/medication/vision-proof");
}

export async function fetchMedicationTrainingManifest() {
  return getJson<MedicationTrainingManifest>("/api/medication/training-manifest");
}

export async function fetchMedicationReferenceImages(name: string) {
  return getJson<{ query: string; source: string; images: MedicationReferenceImage[]; disclaimer: string }>(`/api/medication/reference-images?name=${encodeURIComponent(name)}`);
}
