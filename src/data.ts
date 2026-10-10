import {
  Hospital,
  MedicationLog,
  PatientProfile,
  TriageResponse,
  PatientTimelineEvent
} from "./types";

export const API_BASE = "";
export const seedPatientTimeline: PatientTimelineEvent[] = [];

export const demoProfile: PatientProfile = {
  name: "",
  age: 0,
  condition: "",
  patientPhone: "",
  caretaker: "",
  caretakerPhone: "",
  location: ""
};

export const fallbackHospitals: Hospital[] = [
  {
    id: "bgscet-h1",
    name: "People Tree Hospitals",
    area: "Yeshwanthpur",
    phone: "+91 8023509999",
    specialties: ["Emergency", "Cardiology", "General Medicine"]
  },
  {
    id: "bgscet-h2",
    name: "Manipal Hospital",
    area: "Malleshwaram",
    phone: "+91 8045694569",
    specialties: ["Emergency", "Neurology", "Internal Medicine"]
  },
  {
    id: "bgscet-h3",
    name: "Fortis Hospital",
    area: "Rajajinagar",
    phone: "+91 8023088800",
    specialties: ["Emergency", "Critical Care", "Pulmonology"]
  },
  {
    id: "bgscet-h4",
    name: "KC General Hospital",
    area: "Malleshwaram",
    phone: "+91 8023301771",
    specialties: ["Emergency", "Public Hospital", "Trauma"]
  }
];

export const seedMedicationLogs: MedicationLog[] = [];

export const baselineTriage: TriageResponse = {
  state: "Normal",
  score: 0,
  probabilities: { Normal: 0, "At-Risk": 0, Emergency: 0 },
  confidence: 0,
  riskFactors: [],
  recommendations: [],
  modelVersion: "awaiting-live-calculation",
  dataset: "No model result yet",
  datasetStatus: "pending_local_api",
  topFeatures: [{ feature: "stable symptom description", direction: "lowers risk", weight: -8 }],
  fallback: false,
  model: {
    predictedClass: "Not assessed",
    probabilities: { Normal: 0, "At-Risk": 0, Emergency: 0 },
    engine: "No model call has been made in this browser session",
    disclaimer: "No estimate has been made. Enter current symptoms and readings, then run a check."
  }
};

export const demoScenarios = [
  {
    name: "Normal follow-up",
    text: "mild headache, normal breathing, took medicine, stable temperature"
  },
  {
    name: "At-risk monitoring",
    text: "moderate fever, mild dizziness, delayed medicine, high blood pressure reading"
  },
  {
    name: "Emergency trigger",
    text: "severe chest pain, breathlessness, sweating, left arm pain"
  }
];
