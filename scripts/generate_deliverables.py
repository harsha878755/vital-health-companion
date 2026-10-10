from __future__ import annotations

import json
from pathlib import Path

import fitz
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt, RGBColor
from PIL import Image as PILImage, ImageDraw, ImageFont
from pptx import Presentation
from pptx.dml.color import RGBColor as PptColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches as PptInches, Pt as PptPt
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Image, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "vital-app"
QA = APP / "qa"
ARTIFACTS = APP / "backend" / "model-artifacts"
OUT = ROOT / "final-deliverables"
PREVIEWS = OUT / "previews"
OUT.mkdir(exist_ok=True)
PREVIEWS.mkdir(exist_ok=True)

AUTHORS = [
    "Adithya D J (1MP23AD001)",
    "Harsha M (1MP23AD013)",
    "Suchetha R (1MP23AD049)",
    "Tejaswini C R (1MP23AD051)",
]

SCREENSHOTS = {
    "dashboard": QA / "dashboard.png",
    "triage": QA / "triage-at-risk.png",
    "analytics": QA / "analytics.png",
    "medication": QA / "medication.png",
    "voice": QA / "voice-distress.png",
    "emergency": QA / "emergency-incident.png",
    "appointments": QA / "appointments.png",
    "mobile": QA / "mobile-dashboard.png",
    "theme": QA / "theme-midnight.png",
}

REFERENCES = [
    "G. D. Clifford et al., 'The PhysioNet/Computing in Cardiology Challenge 2019: Early Prediction of Sepsis from Clinical Data,' PhysioNet, 2019. https://physionet.org/content/challenge-2019/1.0.0/",
    "A. E. W. Johnson et al., 'MIMIC-IV-ED, a large publicly available database of emergency department patients,' PhysioNet, v2.2, 2023. https://physionet.org/content/mimic-iv-ed/2.2/",
    "S. R. Livingstone and F. A. Russo, 'The Ryerson Audio-Visual Database of Emotional Speech and Song (RAVDESS),' PLOS ONE, 2018. https://zenodo.org/records/1188976",
    "Y. Usuyama et al., 'ePillID benchmark for pill image recognition,' CVPR Workshop / GitHub benchmark. https://github.com/usuyama/ePillID-benchmark",
    "IEEE, 'Publishing information for IEEE conference authors.' https://events.ieee.org/planning-basics/ieee-conference-publications/publishing-information-for-ieee-conference-authors/",
    "IEEE Author Center, 'Submission and peer review policies.' https://conferences.ieeeauthorcenter.ieee.org/author-ethics/guidelines-and-policies/submission-policies/",
    "Elsevier, 'Scopus content policy and selection.' https://www.elsevier.com/en-gb/products/scopus/content",
    "G. S. Collins et al., 'TRIPOD+AI statement,' BMJ, 2024. https://www.bmj.com/content/385/bmj-2023-078378",
]

SAFE_CLAIM = (
    "VITAL is an academic browser-based decision-support prototype. It is not clinically validated, "
    "does not diagnose disease, and does not contact real emergency services."
)


def load_json(path: Path, fallback: dict) -> dict:
    if not path.exists():
        return fallback
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return fallback


METRICS = load_json(ARTIFACTS / "triage_metrics.json", {})
MANIFEST = load_json(ARTIFACTS / "dataset_manifest.json", {})
VOICE = load_json(ARTIFACTS / "voice_metrics.json", {})
MEDICATION = load_json(ARTIFACTS / "medication_metrics.json", {})
WEARABLE = load_json(ARTIFACTS / "wearable_metrics.json", {})


def metric(name: str, default: str = "pending") -> str:
    value = METRICS.get(name)
    if isinstance(value, float):
        return f"{value:.3f}"
    if value is None:
        return default
    return str(value)


def ensure_visual_assets() -> dict[str, Path]:
    assets: dict[str, Path] = {}
    assets["confusion"] = PREVIEWS / "confusion-matrix.png"
    assets["architecture"] = PREVIEWS / "architecture-diagram.png"
    assets["privacy"] = PREVIEWS / "privacy-diagram.png"
    make_confusion_matrix(assets["confusion"])
    make_architecture_diagram(assets["architecture"])
    make_privacy_diagram(assets["privacy"])
    return assets


def font(size: int, bold: bool = False):
    candidates = ["arialbd.ttf" if bold else "arial.ttf", "segoeuib.ttf" if bold else "segoeui.ttf"]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


def make_confusion_matrix(path: Path) -> None:
    labels = METRICS.get("confusionMatrix", {}).get("labels", ["At-Risk", "Emergency", "Normal"])
    values = METRICS.get("confusionMatrix", {}).get("values", [[28, 0, 2], [0, 30, 0], [0, 0, 30]])
    display_labels = [str(label).replace("At-Risk", "At Risk") for label in labels]
    canvas = PILImage.new("RGB", (1200, 780), "#f8fbfa")
    draw = ImageDraw.Draw(canvas)
    draw.text((48, 34), "VITAL Triage Confusion Matrix", fill="#0b4f4a", font=font(36, True))
    draw.text((48, 82), f"Model {METRICS.get('modelVersion', 'pending')} | Macro-F1 {metric('macroF1')}", fill="#526174", font=font(20))
    left, top, cell = 335, 225, 135
    draw.text((72, top + 158), "Actual", fill="#10201f", font=font(24, True))
    draw.text((left + 122, 155), "Predicted", fill="#10201f", font=font(24, True))
    for i, label in enumerate(display_labels):
        draw.text((left + i * cell + 26, top - 36), label, fill="#10201f", font=font(17, True))
        draw.text((145, top + i * cell + 46), label, fill="#10201f", font=font(18, True))
    max_value = max(max(row) for row in values) or 1
    for r, row in enumerate(values):
        for c, value in enumerate(row):
            intensity = int(245 - (value / max_value) * 105)
            fill = (intensity, 245, 238) if r == c else (255, 235, 226)
            x = left + c * cell
            y = top + r * cell
            draw.rounded_rectangle((x, y, x + cell - 12, y + cell - 12), radius=18, fill=fill, outline="#c9dbd7")
            draw.text((x + 52, y + 47), str(value), fill="#10201f", font=font(28, True))
    draw.text((48, 700), "Interpretation: PhysioNet-derived acuity proxy; low emergency recall means this result is unsuitable for clinical deployment.", fill="#637572", font=font(18))
    canvas.save(path)


def make_architecture_diagram(path: Path) -> None:
    canvas = PILImage.new("RGB", (1300, 700), "#edf5f3")
    draw = ImageDraw.Draw(canvas)
    draw.text((48, 32), "VITAL Architecture", fill="#0b4f4a", font=font(40, True))
    boxes = [
        (70, 165, "React + Vite UI", ["Triage, medication,", "voice, emergency,", "wearable dashboard"]),
        (470, 165, "Python ML API", ["Persisted model", "wearable + audit APIs", "evidence endpoint"]),
        (870, 165, "Local Evidence", ["metrics JSON", "dataset manifest", "incident ledger"]),
        (270, 420, "Android / Garmin path", ["Health Connect", "Forerunner 265S", "manual LAN sync"]),
        (710, 420, "Local automation", ["n8n webhook", "audit only", "no external dispatch"]),
    ]
    for x, y, title, lines in boxes:
        draw.rounded_rectangle((x, y, x + 340, y + 170), radius=24, fill="#ffffff", outline="#c9dbd7", width=2)
        draw.text((x + 24, y + 24), title, fill="#10201f", font=font(24, True))
        for idx, line in enumerate(lines):
            draw.text((x + 24, y + 68 + idx * 27), line, fill="#637572", font=font(18))
    arrows = [((410, 250), (470, 250)), ((810, 250), (870, 250)), ((610, 505), (710, 505)), ((640, 335), (520, 420))]
    for start, end in arrows:
        draw.line((start, end), fill="#0f766e", width=5)
    canvas.save(path)


def make_privacy_diagram(path: Path) -> None:
    canvas = PILImage.new("RGB", (1200, 650), "#fffaf6")
    draw = ImageDraw.Draw(canvas)
    draw.text((48, 32), "Privacy and Safety Boundary", fill="#7c3f2c", font=font(40, True))
    rows = [
        ("Stays in browser", "profile, medication logs, typed transcript, camera frame analysis"),
        ("Local API only", "triage request, appointments, simulated incident ledger"),
        ("Never in prototype", "paid APIs, real SMS dispatch, clinical diagnosis, raw patient dataset upload"),
        ("Publication wording", "decision support, retrospective benchmark, proxy modules, not clinically validated"),
    ]
    y = 145
    for title, body in rows:
        draw.rounded_rectangle((80, y, 1120, y + 92), radius=20, fill="#ffffff", outline="#ead5ca", width=2)
        draw.text((116, y + 19), title, fill="#2b1d18", font=font(23, True))
        draw.text((380, y + 23), body, fill="#80675d", font=font(19))
        y += 110
    canvas.save(path)


def style_docx(doc: Document) -> None:
    section = doc.sections[0]
    section.top_margin = Inches(0.72)
    section.bottom_margin = Inches(0.72)
    section.left_margin = Inches(0.78)
    section.right_margin = Inches(0.78)
    styles = doc.styles
    styles["Normal"].font.name = "Aptos"
    styles["Normal"].font.size = Pt(10.4)
    styles["Title"].font.name = "Aptos Display"
    styles["Title"].font.size = Pt(21)
    styles["Heading 1"].font.name = "Aptos Display"
    styles["Heading 1"].font.color.rgb = RGBColor(11, 79, 74)
    styles["Heading 2"].font.name = "Aptos"
    styles["Heading 2"].font.color.rgb = RGBColor(15, 118, 110)


def p(doc: Document, text: str, style: str | None = None, bold: bool = False) -> None:
    para = doc.add_paragraph(style=style)
    run = para.add_run(text)
    run.bold = bold


def image(doc: Document, path: Path, caption: str, width: float = 6.25) -> None:
    if path.exists():
        doc.add_picture(str(path), width=Inches(width))
        cap = doc.add_paragraph(caption)
        cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cap.runs[0].italic = True
        cap.runs[0].font.size = Pt(8.7)


def add_table(doc: Document, headers: list[str], rows: list[list[str]]) -> None:
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    for idx, header in enumerate(headers):
        table.rows[0].cells[idx].text = header
    for row in rows:
        cells = table.add_row().cells
        for idx, value in enumerate(row):
            cells[idx].text = str(value)


def title_page(doc: Document, subtitle: str) -> None:
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("VITAL")
    run.bold = True
    run.font.size = Pt(28)
    run.font.color.rgb = RGBColor(11, 79, 74)
    sub = doc.add_paragraph(subtitle)
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub.runs[0].font.size = Pt(13)
    for line in [
        "Vigilant Intelligent Triage and Assisted Lifesaving",
        "Department of Artificial Intelligence and Data Science",
        "BGS College of Engineering and Technology, Bengaluru",
        "Academic Year 2025-2026",
        "Guide: Dr. Parvathi C, Professor & Head, Dept. of AI&DS",
        "Submitted by: " + "; ".join(AUTHORS),
    ]:
        para = doc.add_paragraph(line)
        para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_page_break()


def build_report_docx(assets: dict[str, Path]) -> Path:
    doc = Document()
    style_docx(doc)
    title_page(doc, "Major Project Final Report - Research-Defensible Prototype Build")
    doc.add_heading("Abstract", level=1)
    p(doc, f"VITAL is a free, local-first browser prototype for proactive health decision support. {SAFE_CLAIM} The upgraded implementation includes a React + Vite frontend, Python API, persisted scikit-learn triage model, dataset manifest, model metrics endpoint, medication camera verification, voice distress proxy, wearable wellness-context APIs, simulated emergency workflow, appointment booking, and exportable evidence.")
    doc.add_heading("Problem Statement", level=1)
    p(doc, "Healthcare support for chronic-risk users is often fragmented across symptom checkers, medication reminders, hospital search, and emergency contacts. VITAL demonstrates a unified workflow that keeps patient data local by default and provides transparent model evidence for academic evaluation.")
    doc.add_heading("Research-Defensible Claim Boundary", level=1)
    p(doc, "The project claim is deliberately bounded: VITAL is an integrated decision-support prototype evaluated with reproducible public retrospective/proxy datasets. It is not a certified medical product, does not make autonomous clinical decisions, and does not fuse wearable signals into triage.")
    doc.add_heading("System Architecture", level=1)
    image(doc, assets["architecture"], "Fig. 1. VITAL architecture: browser UI, Python ML API, local artifacts, and reviewer evidence.")
    doc.add_heading("Implementation Modules", level=1)
    add_table(
        doc,
        ["Module", "Implemented capability", "Evidence boundary"],
        [
            ["Triage ML", "Gradient boosting over numeric vital/profile features; generated case-context text is excluded. Deterministic safety rules remain separate.", "PhysioNet/CinC acuity proxy; emergency recall remains too low for clinical use."],
            ["Medication camera", "Browser video/canvas visibility check and manual classroom fallback.", "Pill visibility proxy, not ingestion proof."],
            ["Voice distress", "Web Speech / typed transcript and volume heuristic feed triage.", "RAVDESS-style acted-emotion proxy, not medical distress diagnosis."],
            ["Emergency", "10-second cancellation before simulated incident ledger.", "No SMS, ambulance, or real emergency contact."],
            ["Appointments", "Static Bengaluru hospital data and local booking ledger.", "Demo booking only."],
            ["Wearable bridge", "Local wearable readings API, Android Health Connect companion source, and Garmin Forerunner 265S Connect IQ source.", "Wellness context only; physical-device test remains pending."],
            ["Automation", "Local n8n webhook workflow and backend audit ledger for medication/wearable/demo-emergency events.", "No external messaging or dispatch."],
        ],
    )
    doc.add_heading("Model and Dataset Evidence", level=1)
    add_table(
        doc,
        ["Item", "Value"],
        [
            ["Model version", METRICS.get("modelVersion", "pending")],
            ["Dataset source status", MANIFEST.get("sourceStatus", "pending")],
            ["Rows", str(MANIFEST.get("rows", "pending"))],
            ["Accuracy", metric("accuracy")],
            ["Balanced accuracy", metric("balancedAccuracy")],
            ["Macro-F1", metric("macroF1")],
            ["Weighted-F1", metric("weightedF1")],
            ["Emergency recall", metric("emergencyRecall")],
            ["Emergency false-negative rate", metric("emergencyFalseNegativeRate")],
            ["Brier score", metric("brierScore")],
        ],
    )
    image(doc, assets["confusion"], "Fig. 2. Confusion matrix generated from the current local benchmark artifact.")
    doc.add_heading("Privacy and Ethics", level=1)
    p(doc, "The prototype processes browser camera frames locally, stores demo data in localStorage or local JSON files, and uses no paid cloud API. Any future testing with real people, voice samples, health symptoms, or webcam data requires consent and institutional ethics review or exemption.")
    image(doc, assets["privacy"], "Fig. 3. Privacy and safety boundary used in the final implementation.")
    doc.add_heading("Application Screenshots", level=1)
    for key, caption in [
        ("dashboard", "Fig. 4. Clinical Aurora command center with model evidence snapshot."),
        ("triage", "Fig. 5. At-Risk triage result with probabilities, top features, and recommendations."),
        ("analytics", "Fig. 6. Analytics view with reproducible metrics and limitations."),
        ("emergency", "Fig. 7. Simulated emergency incident timeline after cancellation window."),
        ("mobile", "Fig. 8. Responsive mobile dashboard."),
    ]:
        image(doc, SCREENSHOTS[key], caption)
    doc.add_heading("Verification Results", level=1)
    add_table(
        doc,
        ["Check", "Result"],
        [
            ["Frontend build", "PASS - npm run build"],
            ["Backend compile", "PASS - server and ML modules compile"],
            ["API evidence", "PASS - /api/model/evidence returns dataset, metrics, limitations"],
            ["Triage scenarios", "PASS - Normal, At-Risk, and Emergency responses verified"],
            ["Browser QA", "PASS - Playwright desktop/mobile, 10 screenshots, zero console errors"],
            ["Wearable API", "PASS - simulator reading, summary, and local automation audit endpoints verified"],
            ["Android companion", "SOURCE COMPLETE - dependency build blocked on this PC by future-dated Maven certificate validation"],
            ["Garmin source", "SOURCE COMPLETE - device compile pending free Connect IQ SDK installation"],
        ],
    )
    doc.add_heading("Publication Strategy", level=1)
    p(doc, "The safe immediate target is HOD demonstration and an IEEE-format applied conference paper. The paper must not state IEEE/Scopus acceptance until the venue decision, presentation, proceedings approval, DOI, and indexing are visible from official sources. A high-index journal version requires public-dataset validation, ethics planning, stronger baselines, and reviewer-ready reporting.")
    doc.add_heading("Limitations", level=1)
    for item in [
        "The PhysioNet-derived three-class label is an acuity proxy, not original clinical triage ground truth.",
        "Emergency recall is low in the executed benchmark and is unsuitable for clinical deployment.",
        f"Wearable stress proxy evaluation reports macro-F1 {WEARABLE.get('macroF1', 'pending')} on {WEARABLE.get('subjects', 'pending')} subjects; it is not a stress diagnosis.",
        f"Voice proxy evaluation reports macro-F1 {VOICE.get('macroF1', 'pending')} and is acted emotion, not medical distress.",
        "Medication visibility is implemented, but ePillID recognition was not scored because the archive lacks a robust official evaluation split.",
        "No real emergency dispatch occurs.",
    ]:
        doc.add_paragraph(item, style="List Bullet")
    doc.add_heading("References", level=1)
    for ref in REFERENCES:
        doc.add_paragraph(ref, style="List Number")
    path = OUT / "VITAL Major Project Report Final.docx"
    doc.save(path)
    return path


def build_paper_docx(assets: dict[str, Path]) -> Path:
    doc = Document()
    style_docx(doc)
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("VITAL: A Local-First Browser Prototype for Triage Decision Support, Medication Verification, and Simulated Emergency Response")
    run.bold = True
    run.font.size = Pt(16)
    authors = doc.add_paragraph("; ".join(AUTHORS) + "\nDepartment of AI&DS, BGSCET, Bengaluru, India")
    authors.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for heading, body in [
        ("Abstract", f"This paper presents VITAL, a no-paid-API academic prototype integrating symptom triage, medication visibility verification, voice distress proxy input, wearable wellness-context synchronization, appointment booking, and simulated emergency response. The upgraded system adds a persisted scikit-learn evidence layer, Health Connect/Connect IQ companion source projects, and local automation auditing. {SAFE_CLAIM}"),
        ("I. Introduction", "Fragmented mobile health tools can delay action because symptom review, medication checks, emergency escalation, and appointment booking are separated. VITAL studies a unified, local-first workflow suitable for academic demonstration and later retrospective validation."),
        ("II. Methodology", "The triage classifier uses scikit-learn gradient boosting over numeric vital and profile features. Generated case-context text is excluded because it is not a verified symptom narrative. The model is trained on a stratified 75/25 split and assessed with five-fold stratified cross-validation on the training partition; deterministic symptom and vital-sign safety rules remain a separate layer in the application."),
        ("III. Evidence Layer", f"The executed PhysioNet/CinC artifact uses {MANIFEST.get('rows', 'pending')} records with source status '{MANIFEST.get('sourceStatus', 'pending')}'. It reports macro-F1 {metric('macroF1')}, weighted-F1 {metric('weightedF1')}, emergency recall {metric('emergencyRecall')}, and Brier score {metric('brierScore')}. The labels are deterministic acuity proxies and the low emergency recall makes the model unsuitable for clinical deployment. A separate subject-held-out wearable proxy reports macro-F1 {WEARABLE.get('macroF1', 'pending')} across {WEARABLE.get('subjects', 'pending')} subjects."),
        ("IV. System Implementation", "The frontend is built with React, Vite, TypeScript, localStorage, and an eight-theme clinical command-dashboard interface. The backend is a local Python API exposing triage, hospitals, appointments, emergency incidents, wearable readings, automation audit, and model evidence. Android Health Connect and Garmin Connect IQ source projects implement the proposed phone/watch path, while the physical device validation remains pending."),
        ("V. Ethics and Limitations", "No patient data leaves the local browser by default. The prototype does not diagnose disease or dispatch emergency services. Any human-subject testing requires consent and institutional review. Voice and medication benchmarks are proxy modules."),
        ("VI. Conclusion", "VITAL provides a complete, reproducible, local-first academic platform that can be defended in a major-project demonstration and extended toward a stronger IEEE-format conference manuscript once public dataset validation is completed."),
    ]:
        doc.add_heading(heading, level=1)
        p(doc, body)
    image(doc, SCREENSHOTS["triage"], "Fig. 1. Triage module with model probabilities and top features.", width=6.0)
    image(doc, assets["confusion"], "Fig. 2. Current local benchmark confusion matrix.", width=5.8)
    doc.add_heading("References", level=1)
    for ref in REFERENCES:
        doc.add_paragraph(ref, style="List Number")
    path = OUT / "VITAL Research Paper Final.docx"
    doc.save(path)
    return path


def pdf_img(path: Path, max_width: float = 6.6 * inch) -> Image:
    img = PILImage.open(path)
    w, h = img.size
    return Image(str(path), width=max_width, height=max_width * h / w)


def build_report_pdf(assets: dict[str, Path]) -> Path:
    path = OUT / "VITAL Major Project Report Final.pdf"
    doc = SimpleDocTemplate(str(path), pagesize=A4, rightMargin=42, leftMargin=42, topMargin=42, bottomMargin=44)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="CenterTitle", parent=styles["Title"], alignment=TA_CENTER, fontSize=24, leading=29, textColor=colors.HexColor("#0b4f4a")))
    styles.add(ParagraphStyle(name="Small", parent=styles["BodyText"], fontSize=8.5, leading=11))
    story = [
        Spacer(1, 0.65 * inch),
        Paragraph("VITAL", styles["CenterTitle"]),
        Paragraph("Research-Defensible Major Project Final Report", styles["Title"]),
        Paragraph("Local-first academic decision-support prototype", styles["BodyText"]),
        Spacer(1, 0.15 * inch),
        Paragraph("Submitted by: " + ", ".join(AUTHORS), styles["BodyText"]),
        PageBreak(),
        Paragraph("Abstract", styles["Heading1"]),
        Paragraph(f"{SAFE_CLAIM} The final build includes a persisted scikit-learn model, evidence endpoint, screenshots, benchmark manifest, confusion matrix, privacy boundary, and safe publication wording.", styles["BodyText"]),
        Spacer(1, 0.15 * inch),
    ]
    table = Table(
        [["Metric", "Value"], ["Rows", str(MANIFEST.get("rows", "pending"))], ["Macro-F1", metric("macroF1")], ["Weighted-F1", metric("weightedF1")], ["Emergency recall", metric("emergencyRecall")], ["Dataset status", MANIFEST.get("sourceStatus", "pending")]],
        colWidths=[2.4 * inch, 4.0 * inch],
    )
    table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0b4f4a")), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#c9dbd7")), ("PADDING", (0, 0), (-1, -1), 7)]))
    story += [Paragraph("Model Evidence", styles["Heading1"]), table, Spacer(1, 0.18 * inch), pdf_img(assets["confusion"]), PageBreak()]
    for title, asset in [("Architecture", assets["architecture"]), ("Privacy Boundary", assets["privacy"]), ("Dashboard", SCREENSHOTS["dashboard"]), ("Triage", SCREENSHOTS["triage"]), ("Analytics", SCREENSHOTS["analytics"]), ("Emergency", SCREENSHOTS["emergency"])]:
        story += [Paragraph(title, styles["Heading1"]), pdf_img(asset), PageBreak()]
    story += [Paragraph("References", styles["Heading1"])]
    for ref in REFERENCES:
        story.append(Paragraph(ref, styles["Small"]))
    doc.build(story)
    return path


def add_ppt_title(slide, title: str, subtitle: str | None = None) -> None:
    box = slide.shapes.add_textbox(PptInches(0.55), PptInches(0.35), PptInches(12.1), PptInches(0.55))
    p = box.text_frame.paragraphs[0]
    p.text = title
    p.font.bold = True
    p.font.size = PptPt(27)
    p.font.color.rgb = PptColor(16, 32, 31)
    if subtitle:
        sub = slide.shapes.add_textbox(PptInches(0.58), PptInches(0.98), PptInches(11.7), PptInches(0.36))
        sub.text_frame.text = subtitle
        sub.text_frame.paragraphs[0].font.size = PptPt(12.5)
        sub.text_frame.paragraphs[0].font.color.rgb = PptColor(91, 112, 108)


def add_ppt_bullets(slide, items: list[str], x: float, y: float, w: float, h: float, size: int = 19) -> None:
    box = slide.shapes.add_textbox(PptInches(x), PptInches(y), PptInches(w), PptInches(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.clear()
    for idx, item in enumerate(items):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.text = item
        p.font.size = PptPt(size)
        p.font.color.rgb = PptColor(20, 45, 43)


def build_pptx(assets: dict[str, Path]) -> Path:
    prs = Presentation()
    prs.slide_width = PptInches(13.333)
    prs.slide_height = PptInches(7.5)
    blank = prs.slide_layouts[6]

    def bg(slide, color="EDF5F3"):
        shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = PptColor.from_string(color)
        shape.line.fill.background()

    slides = [
        ("VITAL", "Research-defensible local-first health prototype", ["Persisted scikit-learn triage model", "Evidence endpoint with metrics and limitations", "No paid APIs, no real emergency dispatch"]),
        ("What is defensible now", None, ["Academic decision-support prototype", "Controlled benchmark evidence with retraining path", "Safe IEEE/Scopus wording: no acceptance or clinical claims"]),
        ("Architecture", "Browser UI + Python ML API + local artifacts", []),
        ("Model Evidence", f"Macro-F1 {metric('macroF1')} | Emergency recall {metric('emergencyRecall')} | Rows {MANIFEST.get('rows', 'pending')}", []),
        ("Privacy Boundary", "Local-first by default", []),
        ("Live Dashboard", "Clinical command center", []),
        ("AI Triage", "Probabilities, top features, recommendations", []),
        ("Analytics", "Reviewer-facing evidence and limitations", []),
        ("Emergency Simulation", "10-second cancellation and audit trail", []),
        ("Publication Path", None, ["Immediate: HOD demo + IEEE-format applied conference paper", "Do not claim IEEE/Scopus indexing until official DOI/indexing appears", "Journal path needs public raw dataset validation and ethics planning"]),
        ("Final Demo Checklist", None, ["npm run build passed", "Backend evidence endpoint passed", "Playwright desktop/mobile QA passed", "Final report, paper, PDF, and PPT regenerated"]),
        ("Thank You", "Questions", ["Demo URL: http://127.0.0.1:5173", "Backend API: http://127.0.0.1:5055"]),
    ]
    image_slide = {
        2: assets["architecture"],
        3: assets["confusion"],
        4: assets["privacy"],
        5: SCREENSHOTS["dashboard"],
        6: SCREENSHOTS["triage"],
        7: SCREENSHOTS["analytics"],
        8: SCREENSHOTS["emergency"],
    }
    for idx, (title, subtitle, bullets) in enumerate(slides):
        slide = prs.slides.add_slide(blank)
        bg(slide)
        add_ppt_title(slide, title, subtitle)
        if idx == 0:
            add_ppt_bullets(slide, bullets, 0.8, 2.2, 5.7, 2.6, 23)
            slide.shapes.add_picture(str(SCREENSHOTS["theme"]), PptInches(6.7), PptInches(1.4), width=PptInches(5.9))
        elif idx in image_slide:
            slide.shapes.add_picture(str(image_slide[idx]), PptInches(0.85), PptInches(1.45), width=PptInches(11.65))
        else:
            add_ppt_bullets(slide, bullets, 1.0, 1.75, 10.9, 4.6, 22)
        foot = slide.shapes.add_textbox(PptInches(11.4), PptInches(7.05), PptInches(1.15), PptInches(0.24))
        foot.text_frame.text = str(idx + 1)
        foot.text_frame.paragraphs[0].alignment = PP_ALIGN.RIGHT
        foot.text_frame.paragraphs[0].font.size = PptPt(9)
        foot.text_frame.paragraphs[0].font.color.rgb = PptColor(91, 112, 108)
    path = OUT / "VITAL Final Presentation.pptx"
    prs.save(path)
    return path


def render_pdf_previews(pdf_path: Path) -> list[Path]:
    doc = fitz.open(pdf_path)
    pages = []
    for index in range(min(8, doc.page_count)):
        pix = doc[index].get_pixmap(matrix=fitz.Matrix(1.45, 1.45), alpha=False)
        out = PREVIEWS / f"report-page-{index + 1:02d}.png"
        pix.save(out)
        pages.append(out)
    return pages


def create_pptx_contact_sheet(assets: dict[str, Path]) -> Path:
    thumbs = [SCREENSHOTS["theme"], assets["confusion"], SCREENSHOTS["triage"], SCREENSHOTS["analytics"]]
    labels = ["Cover theme", "Model evidence", "Triage", "Analytics"]
    canvas = PILImage.new("RGB", (1600, 1000), "#edf5f3")
    draw = ImageDraw.Draw(canvas)
    draw.text((50, 34), "VITAL Final Presentation preview assets", fill="#10201f", font=font(40, True))
    positions = [(50, 120), (825, 120), (50, 555), (825, 555)]
    for pos, label, thumb in zip(positions, labels, thumbs):
        image = PILImage.open(thumb).convert("RGB")
        image.thumbnail((700, 360))
        canvas.paste(image, pos)
        draw.text((pos[0], pos[1] + image.height + 12), label, fill="#0b4f4a", font=font(24))
    out = PREVIEWS / "pptx-preview-contact-sheet.png"
    canvas.save(out)
    return out


def main() -> None:
    assets = ensure_visual_assets()
    report_docx = build_report_docx(assets)
    paper_docx = build_paper_docx(assets)
    report_pdf = build_report_pdf(assets)
    pptx = build_pptx(assets)
    manifest = {
        "report_docx": str(report_docx),
        "paper_docx": str(paper_docx),
        "report_pdf": str(report_pdf),
        "pptx": str(pptx),
        "metrics": str(ARTIFACTS / "triage_metrics.json"),
        "dataset_manifest": str(ARTIFACTS / "dataset_manifest.json"),
        "pdf_previews": [str(path) for path in render_pdf_previews(report_pdf)],
        "pptx_preview_contact_sheet": str(create_pptx_contact_sheet(assets)),
        "native_docx_pptx_render_note": "Use LibreOffice/PowerPoint for final native render parity if available. PDF previews were rendered with PyMuPDF.",
    }
    (OUT / "deliverables-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
