export type HealthState = "Normal" | "At-Risk" | "Emergency";

export interface Hospital {
  id: string;
  name: string;
  area: string;
  phone: string;
  specialties: string[];
}

export interface TriageResponse {
  state: HealthState;
  score: number;
  probabilities?: Record<HealthState, number>;
  confidence?: number;
    explainability?: {
    riskSignals: Array<{
      label: string;
      detail: string;
      impact: number;
    }>;
    protectiveSignals: Array<{
      label: string;
      detail: string;
      impact: number;
    }>;
    summary: string;
  };
  riskFactors: string[];
  recommendations: string[];
  followUpPrompt?: string;
  dataQualityWarnings?: string[];
  modelVersion?: string;
  dataset?: string;
  datasetStatus?: string;
  topFeatures?: Array<{ feature: string; direction: string; weight: number }>;
  fallback?: boolean;
  model?: {
    predictedClass: string;
    probabilities: Record<string, number>;
    engine?: string;
    disclaimer: string;
  };
}

export interface TriagePayload {
  symptoms: string;
  medicationScore?: number;
  voiceDistress: boolean;
  age: number;
  vitals: {
    spo2: number;
    pulse: number;
    temperature: number;
    systolicBp?: number;
    respiration?: number;
  };
}

export interface ModelEvidence {
  modelVersion: string;
  dataset: {
    name: string;
    source: string;
    sourceUrl?: string;
    sourceStatus: string;
    rows: number;
    clinicalUse: string;
    classCounts?: Record<string, number>;
  };
  metrics: {
    accuracy?: number | null;
    balancedAccuracy?: number | null;
    macroF1: number | null;
    weightedF1: number | null;
    emergencyRecall: number | null;
    emergencyDetected?: number | null;
    emergencySupport?: number | null;
    emergencyFalseNegativeCount?: number | null;
    emergencyFalseNegativeRate: number | null;
    aurocOvR?: number | null;
    brierScore?: number | null;
    crossValidation?: Record<string, unknown>;
    confusionMatrix?: { labels: string[]; values: number[][] } | unknown[];
    classificationReport?: Record<string, unknown>;
    split?: Record<string, unknown>;
  };
  voiceProxy?: Record<string, unknown>;
  medicationProxy?: Record<string, unknown>;
  featurePolicy?: string;
  limitations: string[];
  references: Array<{ label: string; url: string }>;
}

export interface PatientProfile {
  name: string;
  age: number;
  condition: string;
  patientPhone: string;
  caretaker: string;
  caretakerPhone: string;
  location: string;
}

export interface MedicationLog {
  id: string;
  time: string;
  label: string;
  status: "Verified" | "Missed" | "Pending" | "Photo checked";
  confidence: number;
  dateKey?: string;
  doseKey?: string;
}

export interface MedicationVisionProof {
  version: string;
  status: string;
  pipeline: Array<{ stage: string; implementation: string; output: string }>;
  evidence: { dataset: string; datasetStatus: string; privacy: string; limitation: string };
}

export interface MedicationTrainingManifest {
  datasetName: string;
  status: string;
  imageCount: number;
  distinctProducts: number;
  classes: Array<{
    label: string;
    ingredient: string;
    visualProfile: string;
    files: string[];
    activeReference?: string;
  }>;
  qualityNotes: string[];
  sourceDirectory: string;
}

export interface MedicationReferenceImage {
  title: string;
  thumbnail: string;
  source: string;
  license?: string;
  verified: boolean;
}

export interface PrescriptionDose {
  medication: string;
  dose: string;
  time: string;
  instructions: string;
}

export interface PrescriptionPlan {
  source: string;
  parsedAt: string;
  engine: string;
  modelId?: string;
  confidence: number;
  requiresReview: boolean;
  humanReviewed?: boolean;
  summary: string;
  doses: PrescriptionDose[];
  warnings: string[];
}

export interface PrescriptionImageExtraction {
  transcription: string;
  unclear: string[];
  confidence: "low" | "medium" | "high";
  modelId: string;
  engine: string;
}

export interface LocalAiStatus {
  available: boolean;
  provider: "LM Studio" | "Ollama" | "None";
  modelId?: string;
  endpoint?: string;
  modelPath?: string;
  notes: string[];
}

export interface Appointment {
  id?: string;
  patient: string;
  hospitalId: string;
  hospitalName: string;
  department: string;
  date: string;
  time: string;
  reason: string;
  status?: string;
  notifications?: {
    patient: "accepted" | "unavailable" | "provider_rejected" | "not_configured" | "invalid_number" | "backend_unavailable" | "status_unavailable" | "queued_for_phone" | "phone_sending" | "submitted-by-phone" | "phone-send-failed";
    caretaker: "accepted" | "unavailable" | "provider_rejected" | "not_configured" | "invalid_number" | "backend_unavailable" | "status_unavailable" | "queued_for_phone" | "phone_sending" | "submitted-by-phone" | "phone-send-failed";
    deliveryNote?: string;
  };
}

export interface Incident {
  id: string;
  state: HealthState;
  score: number;
  patient: string;
  message: string;
  hospital: Hospital;
  timeline: Array<{ time: string; label: string }>;
}

export type CaregiverCheckIn = "checked-on-patient" | "false-alarm" | "unable-to-reach";

export interface PossibleFallAlert {
  id: string;
  kind: "possible-fall";
  patient: string;
  detectedAt: number;
  source: string;
  smsStatus: "provider-accepted" | "phone-submission-pending" | "submitted-by-phone" | "phone-send-failed" | "not-sent" | "delivery-unknown";
  smsDetail: string;
  acknowledgement: null | { status: CaregiverCheckIn; note: string; acknowledgedAt: number };
}

export type WearableSource = "health-connect" | "garmin-connect-iq" | "fit-import" | "simulator";

export interface WearableMetrics {
  heartRateBpm?: number;
  restingHeartRateBpm?: number;
  steps?: number;
  sleepMinutes?: number;
  activeMinutes?: number;
  activeCaloriesKcal?: number;
  totalCaloriesKcal?: number;
  distanceMeters?: number;
  basalMetabolicRateKcalPerDay?: number;
  heightCm?: number;
  weightKg?: number;
  spo2Percent?: number;
  systolicBp?: number;
  temperatureF?: number;
  respirationPerMinute?: number;
}

export interface WearableReading {
  id?: string;
  patientId: string;
  source: WearableSource;
  deviceModel: string;
  syncMethod: string;
  observedAt: string;
  receivedAt?: string;
  metrics: WearableMetrics;
  warnings?: string[];
  provenance?: { isClinical: boolean; note: string };
}

export interface WearableSummary {
  patientId: string;
  count: number;
  latest: WearableReading | null;
  context: WearableMetrics;
  disclaimer: string;
}

export interface AutomationEvent {
  id?: string;
  createdAt?: string;
  eventType: string;
  patientId: string;
  source: string;
  status?: string;
  payload?: Record<string, unknown>;
  note?: string;
}
export interface PatientTimelineEvent {
  id: string;
  createdAt: string;
  eventType:
    | "triage"
    | "medication"
    | "prescription"
    | "voice"
    | "wearable"
    | "appointment"
    | "emergency";
  title: string;
  detail: string;
  status?: string;
}
