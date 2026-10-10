export type PaletteId =
  | "clinical-aurora"
  | "midnight-icu"
  | "paper-ward"
  | "trauma-signal"
  | "bengaluru-monsoon"
  | "sterile-graphite"
  | "human-warmth"
  | "public-health";

export const palettes: Array<{ id: PaletteId; name: string; swatches: string[] }> = [
  { id: "clinical-aurora", name: "Clinical Aurora", swatches: ["#0f766e", "#d9fff1", "#ef5a46"] },
  { id: "midnight-icu", name: "Midnight ICU", swatches: ["#07111f", "#22d3ee", "#fb7185"] },
  { id: "paper-ward", name: "Paper Ward", swatches: ["#f8faf7", "#21765c", "#d97706"] },
  { id: "trauma-signal", name: "Trauma Signal", swatches: ["#111111", "#dc2626", "#facc15"] },
  { id: "bengaluru-monsoon", name: "Bengaluru Monsoon", swatches: ["#1e3a5f", "#10b981", "#f59e0b"] },
  { id: "sterile-graphite", name: "Sterile Graphite", swatches: ["#111827", "#64748b", "#38bdf8"] },
  { id: "human-warmth", name: "Human Warmth", swatches: ["#7c3f2c", "#0f766e", "#f97373"] },
  { id: "public-health", name: "Public Health", swatches: ["#ffffff", "#2563eb", "#16a34a"] }
];

export const defaultPalette: PaletteId = "clinical-aurora";

