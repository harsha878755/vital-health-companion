import type {
  Appointment,
  Incident,
  MedicationLog,
  PatientProfile,
  PatientTimelineEvent,
  PrescriptionPlan,
  TriageResponse,
  WearableSummary
} from "./types";

export type ReportVitals = { spo2: string; pulse: string; temperature: string; systolicBp: string; respiration: string };

export interface HealthReportPdfData {
  profile: PatientProfile;
  triage: TriageResponse;
  medicationScore: number;
  appointments: Appointment[];
  incident: Incident | null;
  voiceDistress: boolean;
  prescriptionPlan: PrescriptionPlan | null;
  medicationLogs: MedicationLog[];
  patientTimeline: PatientTimelineEvent[];
  wearable: WearableSummary | null;
  symptoms: string;
  vitals: ReportVitals;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CANVAS_WIDTH = 1488;
const CANVAS_HEIGHT = 2105;
const SCALE = CANVAS_WIDTH / PAGE_WIDTH;
const COLORS = {
  ink: "#172D31", muted: "#587073", pale: "#F2F7F5", white: "#FFFFFF",
  teal: "#075A55", teal2: "#087F73", mint: "#2CD2A2", mintPale: "#E1F7EF",
  blue: "#4A86C5", bluePale: "#E9F1FB", amber: "#D38A19", amberPale: "#FFF3DC",
  red: "#BB5146", redPale: "#FCEAE7", line: "#D8E5E1", navy: "#123A3D"
};

const ascii = (value: string) => value
  .replace(/[\u2010-\u2015\u2212]/g, "-")
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201c\u201d]/g, '"')
  .replace(/[\u2022\u00b7]/g, " | ")
  .replace(/\u00b0/g, " deg")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^\x20-\x7e]/g, "?");

function makePage(pageNumber: number, title: string) {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not prepare the health report preview.");
  const textLayer: Array<{ x: number; y: number; size: number; bold: boolean; text: string }> = [];
  const sx = CANVAS_WIDTH / PAGE_WIDTH;
  ctx.scale(sx, sx);
  const scale = sx;
  const pageW = PAGE_WIDTH;
  const pageH = PAGE_HEIGHT;

  const fill = (color: string | CanvasGradient | CanvasPattern) => { ctx.fillStyle = color; };
  const rounded = (x: number, y: number, w: number, h: number, r: number, color: string, border?: string) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    fill(color); ctx.fill();
    if (border) { ctx.strokeStyle = border; ctx.lineWidth = 1; ctx.stroke(); }
  };
  const line = (x1: number, y1: number, x2: number, y2: number, color: string, width = 1) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  };
  const text = (value: string, x: number, y: number, size: number, color = COLORS.ink, bold = false, maxWidth = pageW - 72, maxLines = 5) => {
    // The canvas context already has the PDF-to-pixel transform applied.
    // Keep drawing coordinates and font sizes in PDF points here, then only
    // scale the saved text-layer coordinates for the generated bitmap.
    const fontSize = size;
    ctx.font = `${bold ? "700" : "400"} ${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = color;
    const words = ascii(value).split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (current && ctx.measureText(next).width > maxWidth) { lines.push(current); current = word; }
      else current = next;
    }
    if (current) lines.push(current);
    const visible = lines.slice(0, maxLines);
    if (lines.length > maxLines && visible.length) visible[visible.length - 1] = `${visible[visible.length - 1].replace(/[.,;:]?$/, "")}...`;
    visible.forEach((row, index) => {
      const baseline = y + index * size * 1.34;
      ctx.fillText(row, x, baseline, maxWidth);
      textLayer.push({ x: x * scale, y: baseline * scale, size: fontSize * scale, bold, text: row });
    });
    return y + visible.length * size * 1.34;
  };
  const label = (value: string, x: number, y: number, color = COLORS.muted) => text(value.toUpperCase(), x, y, 7.1, color, true);
  const heading = (value: string, x: number, y: number) => text(value, x, y, 13.5, COLORS.ink, true);
  const dot = (x: number, y: number, color: string) => { ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); fill(color); ctx.fill(); };
  const logo = (x: number, y: number, size: number) => {
    rounded(x, y, size, size, 11, COLORS.mint);
    ctx.save(); ctx.translate(x + size * .17, y + size * .14); ctx.scale((size * .66) / 24, (size * .66) / 24);
    ctx.beginPath();
    ctx.moveTo(12, 20.2); ctx.lineTo(4, 12.4);
    ctx.bezierCurveTo(1.1, 9.6, 2, 4.5, 6.1, 3.5);
    ctx.bezierCurveTo(8.4, 2.9, 10.8, 4, 12, 6);
    ctx.bezierCurveTo(13.2, 4, 15.6, 2.9, 17.9, 3.5);
    ctx.bezierCurveTo(22, 4.5, 22.9, 9.6, 20, 12.4); ctx.closePath();
    ctx.strokeStyle = COLORS.navy; ctx.lineWidth = 1.7; ctx.lineJoin = "round"; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3.6, 12.2); ctx.lineTo(8, 12.2); ctx.lineTo(9.8, 9.1); ctx.lineTo(12, 15.1); ctx.lineTo(14, 11.5); ctx.lineTo(15.1, 12.2); ctx.lineTo(20.5, 12.2);
    ctx.strokeStyle = COLORS.navy; ctx.lineWidth = 1.65; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke(); ctx.restore();
  };
  const background = () => { fill(COLORS.pale); ctx.fillRect(0, 0, pageW, pageH); };
  const footer = () => {
    line(38, 804, pageW - 38, 804, COLORS.line, .8);
    text("VITAL  |  SUMMARY ONLY  |  NOT A DIAGNOSIS", 38, 818, 6.8, COLORS.teal, true);
    text(`PRIVATE HEALTH INFORMATION  |  PAGE ${pageNumber}`, pageW - 180, 818, 6.5, COLORS.muted, true, 142, 1);
  };
  const header = (mainTitle: string, subtitle: string, firstPage = false) => {
    const h = firstPage ? 154 : 112;
    const gradient = ctx.createLinearGradient(0, 0, pageW, h);
    gradient.addColorStop(0, COLORS.navy); gradient.addColorStop(1, COLORS.teal);
    fill(gradient); ctx.fillRect(0, 0, pageW, h);
    logo(38, 25, 38);
    text("VITAL", 86, 47, 20, COLORS.white, true);
    text("PERSONAL HEALTH", 86, 60, 6.7, "#B7E9DA", true);
    text(mainTitle, 38, firstPage ? 101 : 82, firstPage ? 22 : 18, COLORS.white, true, pageW - 76, 1);
    text(subtitle, 38, firstPage ? 121 : 105, 7.6, "#D4E9E3", false, pageW - 76, 1);
  };
  const metricBar = (name: string, value: string, ratio: number, x: number, y: number, w: number, unit = "") => {
    rounded(x, y, w, 69, 8, COLORS.white, COLORS.line);
    label(name, x + 10, y + 15);
    text(value, x + 10, y + 39, 14, COLORS.ink, true, w - 20, 1);
    if (unit) text(unit, x + w - 62, y + 39, 6.5, COLORS.muted, false, 52, 1);
    rounded(x + 10, y + 52, w - 20, 4, 2, "#E5EEEB");
    rounded(x + 10, y + 52, (w - 20) * Math.max(.02, Math.min(1, ratio)), 4, 2, COLORS.teal2);
  };
  const metricData: Array<{ name: string; value: string; ratio: number; unit: string }> = [];

  background();
  header(title, "A clear snapshot of the health information saved in VITAL", pageNumber === 1);
  return { canvas, ctx, textLayer, scale, pageW, pageH, rounded, line, text, label, heading, dot, footer, header, metricBar, metricData, colors: COLORS };
}

function drawPageOne(data: HealthReportPdfData, dateLabel: string) {
  const page = makePage(1, "Your health at a glance");
  const { ctx, text, label, heading, rounded, line, colors: c, scale } = page;
  // date chip in the banner
  rounded(438, 29, 119, 25, 12, "#245E5B");
  text(dateLabel, 449, 45, 7, "#E5F5EF", true, 100, 1);

  rounded(38, 174, 519, 92, 12, c.white, c.line);
  label("Prepared for", 54, 193);
  text(data.profile.name || "VITAL patient", 54, 220, 19, c.ink, true, 330, 1);
  text(`${data.profile.age} years  |  ${data.profile.condition || "Health context not provided"}`, 54, 239, 8, c.muted, false, 345, 1);
  line(416, 190, 416, 250, c.line, 1);
  label("Location", 433, 198);
  text(data.profile.location || "Not provided", 433, 218, 8, c.ink, true, 108, 2);
  text(`Care contact: ${data.profile.caretaker || "Not provided"}`, 433, 245, 6.5, c.muted, false, 110, 2);

  rounded(38, 281, 519, 143, 12, c.white, c.line);
  const riskColor = data.triage.state === "Emergency" ? c.red : data.triage.state === "At-Risk" ? c.amber : c.teal2;
  const riskPale = data.triage.state === "Emergency" ? c.redPale : data.triage.state === "At-Risk" ? c.amberPale : c.mintPale;
  rounded(54, 300, 148, 101, 10, riskPale);
  label("Latest VITAL check", 65, 318, riskColor);
  text(data.triage.state, 65, 344, 13, riskColor, true, 125, 1);
  text(`${Math.round(data.triage.score)} / 100`, 65, 377, 20, c.ink, true, 125, 1);
  text("recorded risk score", 65, 392, 6.4, c.muted, false, 125, 1);
  heading("What was reported", 220, 306);
  label("Symptoms", 220, 327);
  text(data.symptoms.trim() || "No symptom description was recorded.", 220, 343, 8.5, c.ink, false, 317, 2);
  label("Risk signals", 220, 378);
  text(data.triage.riskFactors.length ? data.triage.riskFactors.join("  |  ") : "No additional risk factors listed.", 220, 394, 7.5, c.muted, false, 317, 2);

  rounded(38, 439, 519, 286, 12, c.white, c.line);
  heading("Vital readings", 54, 466);
  text("Latest values on file", 54, 481, 7, c.muted, false, 220, 1);
  const vitalCards = [
    { name: "Oxygen saturation", value: data.vitals.spo2, unit: "%", ratio: Number.parseFloat(data.vitals.spo2) / 100 },
    { name: "Pulse", value: data.vitals.pulse, unit: "bpm", ratio: Number.parseFloat(data.vitals.pulse) / 180 },
    { name: "Temperature", value: data.vitals.temperature, unit: "deg F", ratio: (Number.parseFloat(data.vitals.temperature) - 90) / 20 },
    { name: "Systolic pressure", value: data.vitals.systolicBp, unit: "mmHg", ratio: Number.parseFloat(data.vitals.systolicBp) / 240 },
    { name: "Breathing rate", value: data.vitals.respiration, unit: "/min", ratio: Number.parseFloat(data.vitals.respiration) / 60 }
  ];
  vitalCards.forEach((metric, index) => {
    const col = index % 2; const row = Math.floor(index / 2);
    const x = 54 + col * 248; const y = 495 + row * 76;
    const value = metric.value && metric.value !== "--" ? metric.value : "No reading";
    page.metricBar(metric.name, value, Number.isFinite(metric.ratio) ? metric.ratio : 0, x, y, 232, value === "No reading" ? "" : metric.unit);
  });
  text("Bar lengths are visual scales only; they are not normal ranges or a medical risk assessment.", 54, 720, 6.4, c.muted, false, 485, 1);

  rounded(38, 741, 519, 49, 9, "#E8F4F0");
  text("Suggested next step", 52, 760, 6.6, c.teal, true, 94, 1);
  text(data.triage.recommendations[0] || "Discuss this summary with a healthcare professional.", 151, 760, 6.6, c.muted, false, 393, 2);
  page.footer();
  return { canvas: page.canvas, textLayer: page.textLayer, scale };
}

function drawPageTwo(data: HealthReportPdfData, generatedAt: Date) {
  const page = makePage(2, "Care, medicines & daily wellness");
  const { text, label, heading, rounded, line, dot, colors: c } = page;
  const statusCounts = {
    Taken: data.medicationLogs.filter((item) => item.status === "Verified").length,
    "Photo checked": data.medicationLogs.filter((item) => item.status === "Photo checked").length,
    Missed: data.medicationLogs.filter((item) => item.status === "Missed").length,
    Pending: data.medicationLogs.filter((item) => item.status === "Pending").length
  };
  rounded(38, 128, 519, 290, 12, c.white, c.line);
  rounded(438, 25, 119, 23, 11, "#245E5B");
  text(`As of ${generatedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`, 450, 40, 6.3, "#E5F5EF", true, 100, 1);
  heading("Medication check-ins", 54, 154);
  text("Recent check-ins summarized from this VITAL profile", 54, 170, 7, c.muted, false, 470, 1);
  const score = Math.max(0, Math.min(100, data.medicationScore));
  // Donut chart: the open segment is the remainder to 100%.
  const cx = 103; const cy = 235; const radius = 40;
  page.ctx.beginPath(); page.ctx.arc(cx, cy, radius, 0, Math.PI * 2); page.ctx.strokeStyle = "#E5EFEB"; page.ctx.lineWidth = 11; page.ctx.stroke();
  page.ctx.beginPath(); page.ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * score / 100); page.ctx.strokeStyle = c.teal2; page.ctx.lineWidth = 11; page.ctx.lineCap = "round"; page.ctx.stroke();
  text(`${score}%`, 77, 241, 14, c.ink, true, 53, 1);
  text("adherence", 77, 254, 5.7, c.muted, false, 53, 1);
  const statusColors = [c.teal2, c.blue, c.red, c.amber];
  Object.entries(statusCounts).forEach(([name, count], index) => {
    const x = 170 + (index % 2) * 176; const y = 209 + Math.floor(index / 2) * 53;
    rounded(x, y, 164, 43, 7, c.pale);
    rounded(x + 9, y + 10, 4, 22, 2, statusColors[index]);
    text(String(count), x + 22, y + 27, 13, c.ink, true, 32, 1);
    text(name, x + 58, y + 26, 7, c.muted, true, 96, 1);
  });
  label("Recent check-in pattern", 54, 301);
  const dateGroups = new Map<string, Record<string, number>>();
  for (const item of [...data.medicationLogs].reverse()) {
    const key = item.dateKey || "Undated";
    const group = dateGroups.get(key) || { taken: 0, photo: 0, missed: 0, pending: 0 };
    const statusKey = item.status === "Verified" ? "taken" : item.status === "Photo checked" ? "photo" : item.status === "Missed" ? "missed" : "pending";
    group[statusKey] += 1; dateGroups.set(key, group);
  }
  const trends = [...dateGroups.entries()].slice(-4);
  if (trends.length) {
    const maxCount = Math.max(1, ...trends.map(([, counts]) => Object.values(counts).reduce((sum, count) => sum + count, 0)));
    trends.forEach(([day, counts], index) => {
      const y = 313 + index * 11;
      text(day === "Undated" ? "Date n/a" : day.slice(5), 54, y + 7, 5.9, c.muted, false, 45, 1);
      let offset = 108;
      const available = 254;
      const categories = [[counts.taken, c.teal2], [counts.photo, c.blue], [counts.missed, c.red], [counts.pending, c.amber]] as const;
      categories.forEach(([count, color]) => {
        if (count <= 0) return;
        const segmentWidth = Math.max(4, (count / maxCount) * available);
        rounded(offset, y, segmentWidth, 9, 3, color); offset += segmentWidth + 2;
      });
      line(108, y + 12, 108 + available, y + 12, "#EDF2F0", .5);
    });
  } else {
    text("No medication check-in history is recorded yet.", 54, 335, 7, c.muted, false, 350, 1);
  }
  // Legend
  const legend = [["Taken", c.teal2], ["Photo checked", c.blue], ["Missed", c.red], ["Pending", c.amber]] as const;
  legend.forEach(([name, color], index) => { const x = 54 + index * 116; dot(x + 3, 365, color); text(name, x + 11, 367, 5.5, c.muted, false, 102, 1); });
  if (data.prescriptionPlan?.doses?.length) {
    label("Prescription schedule", 54, 386);
    text(data.prescriptionPlan.doses.slice(0, 4).map((dose) => `${dose.time} ${dose.medication} ${dose.dose}`).join("  |  "), 54, 402, 5.8, c.muted, false, 486, 2);
  }

  rounded(38, 432, 519, 157, 12, c.white, c.line);
  heading("Wellness snapshot", 54, 458);
  const latest = data.wearable?.latest;
  if (latest) {
    text(`${latest.deviceModel || "Connected device"}  |  synced ${new Date(latest.observedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`, 54, 475, 6.5, c.muted, false, 485, 1);
    const metrics: Array<[string, number | undefined, string, number]> = [
      ["Heart rate", data.wearable?.context.heartRateBpm, "bpm", 180],
      ["Oxygen", data.wearable?.context.spo2Percent, "%", 100],
      ["Steps", data.wearable?.context.steps, "steps", 12000],
      ["Sleep", data.wearable?.context.sleepMinutes, "min", 600]
    ];
    metrics.forEach(([name, value, unit, max], index) => {
      const x = 54 + (index % 2) * 248; const y = 496 + Math.floor(index / 2) * 39;
      label(name, x, y + 7);
      const shown = value == null ? "No reading" : `${value.toLocaleString()} ${unit}`;
      text(shown, x + 83, y + 7, 6.7, c.ink, true, 132, 1);
      rounded(x, y + 15, 218, 4, 2, "#E7EFEC");
      if (value != null) rounded(x, y + 15, 218 * Math.max(.02, Math.min(1, value / max)), 4, 2, c.teal2);
    });
  } else {
    text("No wearable record was available when this report was prepared.", 54, 495, 8, c.muted, false, 470, 2);
  }
  text("Optional wellness context only. Bars are visual scales, not clinical ranges or a diagnosis.", 54, 575, 6, c.muted, false, 485, 1);

  rounded(38, 603, 251, 183, 12, c.white, c.line);
  heading("Visit reminders", 54, 629);
  const visits = data.appointments.slice(0, 4);
  if (visits.length) visits.forEach((item, index) => {
    const y = 650 + index * 32;
    dot(59, y - 3, c.teal2);
    text(item.hospitalName, 69, y, 7, c.ink, true, 202, 1);
    text(`${item.department}  |  ${item.date} ${item.time}`, 69, y + 12, 6.2, c.muted, false, 202, 1);
  });
  else text("No visit reminders saved.", 54, 660, 7.5, c.muted, false, 210, 1);
  if (data.incident) text(`Emergency activity: ${data.incident.id}  |  saved in VITAL`, 54, 770, 5.7, c.red, true, 220, 1);
  else text("Reminders in VITAL do not confirm a hospital booking.", 54, 773, 5.7, c.muted, false, 218, 1);

  rounded(306, 603, 251, 183, 12, c.white, c.line);
  heading("Recent care activity", 322, 629);
  const events = [...data.patientTimeline].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);
  if (events.length) events.forEach((item, index) => {
    const y = 651 + index * 31;
    dot(327, y - 4, index === 0 ? c.mint : c.blue);
    text(item.title, 337, y, 6.8, c.ink, true, 205, 1);
    text(`${new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}  |  ${item.detail}`, 337, y + 12, 5.4, c.muted, false, 205, 2);
  });
  else text("No recent care activity is recorded.", 322, 660, 7.5, c.muted, false, 215, 1);

  page.footer();
  return { canvas: page.canvas, textLayer: page.textLayer, scale: page.scale };
}

function joinBytes(chunks: Uint8Array[]) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}

function encode(text: string) { return new TextEncoder().encode(text); }

function makePdf(pages: Array<{ canvas: HTMLCanvasElement; textLayer: Array<{ x: number; y: number; size: number; bold: boolean; text: string }>; scale: number }>) {
  const objectCount = 2 + pages.length * 3 + 2;
  const fontRegular = 3 + pages.length * 3;
  const fontBold = fontRegular + 1;
  const objects: Uint8Array[] = new Array(objectCount + 1);
  objects[1] = encode("<< /Type /Catalog /Pages 2 0 R >>");
  objects[2] = encode(`<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 3} 0 R`).join(" ")}] /Count ${pages.length} >>`);
  const escape = (value: string) => ascii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  pages.forEach((page, index) => {
    const pageId = 3 + index * 3;
    const contentId = pageId + 1;
    const imageId = pageId + 2;
    const jpegString = page.canvas.toDataURL("image/jpeg", .91).split(",")[1];
    const jpeg = Uint8Array.from(atob(jpegString), (char) => char.charCodeAt(0));
    const textCommands = page.textLayer.map((item) => `BT /${item.bold ? "F2" : "F1"} ${(item.size / page.scale).toFixed(2)} Tf 3 Tr 1 0 0 1 ${(item.x / page.scale).toFixed(2)} ${(PAGE_HEIGHT - item.y / page.scale).toFixed(2)} Tm (${escape(item.text)}) Tj ET`).join("\n");
    const content = encode(`q ${PAGE_WIDTH} 0 0 ${PAGE_HEIGHT} 0 0 cm /Im0 Do Q\n${textCommands}\n`);
    objects[pageId] = encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /ProcSet [/PDF /ImageC] /XObject << /Im0 ${imageId} 0 R >> /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects[contentId] = joinBytes([encode(`<< /Length ${content.length} >>\nstream\n`), content, encode("endstream")]);
    objects[imageId] = joinBytes([encode(`<< /Type /XObject /Subtype /Image /Width ${page.canvas.width} /Height ${page.canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`), jpeg, encode("\nendstream")]);
  });
  objects[fontRegular] = encode("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  objects[fontBold] = encode("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

  const parts: Uint8Array[] = [encode("%PDF-1.4\n%VITAL\n")];
  const offsets = new Array<number>(objects.length).fill(0);
  let byteOffset = parts[0].length;
  for (let id = 1; id < objects.length; id += 1) {
    const objectParts = [encode(`${id} 0 obj\n`), objects[id], encode("\nendobj\n")];
    offsets[id] = byteOffset;
    parts.push(...objectParts);
    byteOffset += objectParts.reduce((sum, chunk) => sum + chunk.length, 0);
  }
  const xrefOffset = byteOffset;
  let xref = `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) xref += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  xref += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  parts.push(encode(xref));
  return new Blob([joinBytes(parts)], { type: "application/pdf" });
}

export function createHealthReportPdf(data: HealthReportPdfData) {
  const date = new Date();
  const dateLabel = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const pages = [drawPageOne(data, dateLabel), drawPageTwo(data, date)];
  return {
    pdf: makePdf(pages),
    previewPages: pages.map((page) => page.canvas.toDataURL("image/jpeg", .9))
  };
}
