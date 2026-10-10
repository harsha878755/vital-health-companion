from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ARTIFACT_DIR = Path(__file__).resolve().parents[1] / "model-artifacts"

DEFAULT_EVIDENCE: dict[str, Any] = {
    "modelVersion": "vital-triage-fallback-0.1",
    "dataset": {
        "name": "VITAL controlled seed benchmark",
        "source": "Bundled reproducible prototype cases",
        "sourceStatus": "fallback_seed_pack",
        "rows": 0,
        "clinicalUse": "No. This is a prototype fallback when public raw datasets are absent.",
    },
    "metrics": {
        "macroF1": None,
        "weightedF1": None,
        "emergencyRecall": None,
        "emergencyFalseNegativeRate": None,
        "confusionMatrix": [],
    },
    "limitations": [
        "No clinical validation is claimed from fallback seed data.",
        "Emergency workflow is simulated and does not contact real services.",
        "Voice and medication modules are proxy demonstrations, not diagnostic tests.",
    ],
    "references": [
        {
            "label": "PhysioNet/CinC 2019 Sepsis Challenge",
            "url": "https://physionet.org/content/challenge-2019/1.0.0/",
        },
        {
            "label": "MIMIC-IV-ED v2.2",
            "url": "https://physionet.org/content/mimic-iv-ed/2.2/",
        },
        {"label": "RAVDESS", "url": "https://zenodo.org/records/1188976"},
        {"label": "ePillID benchmark", "url": "https://github.com/usuyama/ePillID-benchmark"},
    ],
}


def _read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def get_model_evidence() -> dict[str, Any]:
    metrics = _read_json(ARTIFACT_DIR / "triage_metrics.json")
    manifest = _read_json(ARTIFACT_DIR / "dataset_manifest.json")
    voice = _read_json(ARTIFACT_DIR / "voice_metrics.json")
    medication = _read_json(ARTIFACT_DIR / "medication_metrics.json")

    if not metrics and not manifest:
        return DEFAULT_EVIDENCE

    evidence = {
        **DEFAULT_EVIDENCE,
        "modelVersion": metrics.get("modelVersion", DEFAULT_EVIDENCE["modelVersion"]),
        "dataset": manifest or DEFAULT_EVIDENCE["dataset"],
        "metrics": {
            "accuracy": metrics.get("accuracy"),
            "balancedAccuracy": metrics.get("balancedAccuracy"),
            "macroF1": metrics.get("macroF1"),
            "weightedF1": metrics.get("weightedF1"),
            "emergencyRecall": metrics.get("emergencyRecall"),
            "emergencyDetected": metrics.get("emergencyDetected"),
            "emergencySupport": metrics.get("emergencySupport"),
            "emergencyFalseNegativeCount": metrics.get("emergencyFalseNegativeCount"),
            "emergencyFalseNegativeRate": metrics.get("emergencyFalseNegativeRate"),
            "aurocOvR": metrics.get("aurocOvR"),
            "brierScore": metrics.get("brierScore"),
            "crossValidation": metrics.get("crossValidation", {}),
            "confusionMatrix": metrics.get("confusionMatrix", []),
            "classificationReport": metrics.get("classificationReport", {}),
            "split": metrics.get("split", {}),
        },
        "featurePolicy": metrics.get("featurePolicy"),
        "voiceProxy": voice,
        "medicationProxy": medication,
        "limitations": [
            "Use public retrospective datasets or controlled vignettes only; do not claim prospective clinical validation.",
            "Sepsis Challenge data is a deterioration-risk proxy, not a full emergency-department triage dataset.",
            "MIMIC-IV-ED support is available when credentialed raw files are placed locally.",
            "RAVDESS voice output is acted-emotion proxy evidence, not medical distress diagnosis.",
            "ePillID supports pill image recognition/visibility, not verified ingestion.",
        ],
    }
    return evidence

