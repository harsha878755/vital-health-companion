from __future__ import annotations

import math
import re
from pathlib import Path
from typing import Any

try:
    import joblib
    import pandas as pd
except ImportError:  # pragma: no cover - fallback keeps demo runnable.
    joblib = None
    pd = None

from .evidence import get_model_evidence

ARTIFACT_DIR = Path(__file__).resolve().parents[1] / "model-artifacts"
MODEL_PATH = ARTIFACT_DIR / "triage_model.joblib"

KEYWORD_WEIGHTS = {
    "chest pain": 42,
    "breathlessness": 38,
    "shortness": 28,
    "can't breathe": 38,
    "cannot breathe": 38,
    "unconscious": 45,
    "fainting": 34,
    "seizure": 42,
    "stroke": 44,
    "blue lips": 38,
    "stabbed": 52,
    "stabbing": 52,
    "gunshot": 55,
    "shot me": 55,
    "attacked": 40,
    "bleeding heavily": 52,
    "severe": 12,
    "sweating": 8,
    "dizziness": 8,
    "fever": 8,
    "missed medicine": 10,
    "high sugar": 10,
    "high bp": 10,
    "blood pressure": 8,
    "confusion": 20,
}

_MODEL_BUNDLE: dict[str, Any] | None = None


def _optional_float(value: Any) -> float | None:
    """Parse a supplied measurement without inventing a normal-looking value."""
    if value is None or value == "":
        return None
    try:
        number = float(value)
        return number if math.isfinite(number) else None
    except (TypeError, ValueError):
        return None


def _load_bundle() -> dict[str, Any] | None:
    global _MODEL_BUNDLE
    if _MODEL_BUNDLE is not None:
        return _MODEL_BUNDLE
    if joblib is None or not MODEL_PATH.exists():
        return None
    try:
        _MODEL_BUNDLE = joblib.load(MODEL_PATH)
        return _MODEL_BUNDLE
    except Exception:
        return None


def _frame_from_payload(payload: dict[str, Any]):
    vitals = payload.get("vitals", {}) or {}
    row = {
        "symptoms": str(payload.get("symptoms", "") or "routine check no urgent symptoms"),
        "age": _optional_float(payload.get("age")),
        "pulse": _optional_float(vitals.get("pulse")),
        "spo2": _optional_float(vitals.get("spo2")),
        "temperature": _optional_float(vitals.get("temperature")),
        "systolic_bp": _optional_float(vitals.get("systolicBp", vitals.get("systolic_bp"))),
        "respiration": _optional_float(vitals.get("respiration")),
        "medication_score": _optional_float(payload.get("medicationScore")),
        "voice_distress": 1.0 if payload.get("voiceDistress") is True else 0.0 if payload.get("voiceDistress") is False else math.nan,
    }
    if pd is None:
        return row
    return pd.DataFrame([row])


def _missing_vital_readings(payload: dict[str, Any]) -> list[str]:
    vitals = payload.get("vitals", {}) or {}
    fields = [
        ("spo2", "SpO2"),
        ("pulse", "pulse"),
        ("temperature", "temperature"),
        ("systolicBp", "systolic blood pressure"),
        ("respiration", "respiration rate"),
    ]
    missing = [label for key, label in fields if _optional_float(vitals.get(key, vitals.get("systolic_bp") if key == "systolicBp" else None)) is None]
    return missing


def _normalize_triage_payload(payload: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    """Exclude impossible values before they reach model and rule features."""
    normalized = dict(payload)
    vitals = dict(payload.get("vitals", {}) or {})
    ranges = {
        "spo2": (50, 100, "SpO2"),
        "pulse": (20, 240, "pulse"),
        "temperature": (80, 115, "temperature in °F"),
        "systolicBp": (50, 260, "systolic blood pressure"),
        "respiration": (4, 80, "respiration rate"),
    }
    warnings: list[str] = []
    for key, (minimum, maximum, label) in ranges.items():
        source_key = "systolic_bp" if key == "systolicBp" and key not in vitals else key
        value = _optional_float(vitals.get(source_key))
        if value is not None and not minimum <= value <= maximum:
            warnings.append(f"Out-of-range {label} was ignored. Enter a reading from {minimum} to {maximum} in the displayed units.")
            value = None
        vitals[source_key] = value
    normalized["vitals"] = vitals

    age = _optional_float(normalized.get("age"))
    if age is not None and not 1 <= age <= 120:
        warnings.append("Out-of-range age was ignored. Enter an age from 1 to 120.")
        normalized["age"] = None
    medication_score = _optional_float(normalized.get("medicationScore"))
    if medication_score is not None and not 0 <= medication_score <= 100:
        warnings.append("Out-of-range medication adherence was ignored. Enter a percentage from 0 to 100.")
        normalized["medicationScore"] = None
    return normalized, warnings


def _is_negated_symptom(text: str, keyword: str) -> bool:
    """Avoid treating a clearly denied symptom as a present symptom signal."""
    for match in re.finditer(re.escape(keyword), text, flags=re.IGNORECASE):
        preceding = text[max(0, match.start() - 48):match.start()].lower()
        # Keep this deliberately narrow: only explicit nearby denial phrases
        # suppress the signal; broad negation scope can hide a second symptom.
        if re.search(r"\b(?:no|denies?|denied|without|negative for|not experiencing)\s+(?:(?:any|the|of|a)\s+){0,2}$", preceding):
            return True
    return False


def _fallback_probabilities(text: str) -> dict[str, float]:
    lower = text.lower()
    emergency_hits = sum(1 for keyword in ["chest pain", "breath", "stroke", "seizure", "unconscious", "stabbed", "stabbing", "gunshot", "shot me", "bleeding heavily"] if keyword in lower)
    atrisk_hits = sum(1 for keyword in ["fever", "dizziness", "blood pressure", "missed", "sugar"] if keyword in lower)
    if emergency_hits:
        return {"Normal": 0.08, "At-Risk": 0.2, "Emergency": 0.72}
    if atrisk_hits:
        return {"Normal": 0.17, "At-Risk": 0.66, "Emergency": 0.17}
    return {"Normal": 0.74, "At-Risk": 0.18, "Emergency": 0.08}


def _feature_flags(payload: dict[str, Any]) -> tuple[list[str], bool, int]:
    text = str(payload.get("symptoms", "") or "").lower()
    vitals = payload.get("vitals", {}) or {}
    matched: list[str] = []
    score_add = 0
    emergency_signal = False
    for keyword, weight in KEYWORD_WEIGHTS.items():
        if keyword in text and not _is_negated_symptom(text, keyword):
            score_add += weight
            matched.append(keyword)
            # "Shortness" by itself is too broad (for example, shortness on exertion).
            # Keep it as a risk signal, but reserve immediate escalation for explicit
            # breathing difficulty and other unambiguous danger phrases.
            if keyword in {"chest pain", "breathlessness", "can't breathe", "cannot breathe", "unconscious", "seizure", "stroke", "blue lips", "stabbed", "stabbing", "gunshot", "shot me", "bleeding heavily"}:
                emergency_signal = True

    medication_score = _optional_float(payload.get("medicationScore"))
    if medication_score is not None and medication_score < 80:
        score_add += 14 if medication_score < 60 else 6
        matched.append("low medication adherence")

    if payload.get("voiceDistress", False):
        score_add += 18
        matched.append("voice distress flag")

    age = _optional_float(payload.get("age"))
    if age is not None and age >= 65:
        score_add += 5
        matched.append("age risk modifier")

    spo2 = _optional_float(vitals.get("spo2"))
    pulse = _optional_float(vitals.get("pulse"))
    temperature = _optional_float(vitals.get("temperature"))
    respiration = _optional_float(vitals.get("respiration"))
    if spo2 is not None and spo2 < 92:
        score_add += 34
        matched.append("low oxygen")
        emergency_signal = True
    if pulse is not None and (pulse > 120 or pulse < 45):
        score_add += 18
        matched.append("abnormal pulse")
    if respiration is not None and respiration > 28:
        score_add += 16
        matched.append("high respiration")
    if temperature is not None and temperature >= 102:
        score_add += 14
        matched.append("high fever")
    return sorted(set(matched)), emergency_signal, score_add

def _explainability(
    payload: dict[str, Any],
    matched: list[str],
    score: int,
    state: str,
) -> dict[str, Any]:
    """
    Creates transparent evidence signals from the same inputs used by
    the triage pipeline.

    These are decision-support signals, not model feature-importance
    or clinical explanations.
    """
    vitals = payload.get("vitals", {}) or {}

    risk_signals: list[dict[str, Any]] = []
    protective_signals: list[dict[str, Any]] = []

    # Symptom signals
    for item in matched:
        weight = KEYWORD_WEIGHTS.get(item, 8)

        risk_signals.append({
            "label": item.replace("_", " ").title(),
            "detail": f"Detected symptom/context signal: {item}",
            "impact": int(weight),
        })

    # Medication adherence
    medication_score = _optional_float(payload.get("medicationScore"))

    if medication_score is not None and medication_score < 80:
        impact = 14 if medication_score < 60 else 6

        risk_signals.append({
            "label": "Medication adherence",
            "detail": f"Adherence score is {round(medication_score)}%",
            "impact": impact,
        })
    elif medication_score is not None:
        protective_signals.append({
            "label": "Medication adherence",
            "detail": f"Adherence score is {round(medication_score)}%",
            "impact": 5,
        })

    # SpO2
    spo2 = _optional_float(vitals.get("spo2"))

    if spo2 is not None and spo2 < 92:
        risk_signals.append({
            "label": "Low oxygen saturation",
            "detail": f"SpO₂ is {spo2:.0f}%",
            "impact": 34,
        })
    elif spo2 is not None and spo2 >= 95:
        protective_signals.append({
            "label": "Stable oxygen saturation",
            "detail": f"SpO₂ is {spo2:.0f}%",
            "impact": 8,
        })

    # Pulse
    pulse = _optional_float(vitals.get("pulse"))

    if pulse is not None and (pulse > 120 or pulse < 45):
        risk_signals.append({
            "label": "Abnormal pulse",
            "detail": f"Pulse is {pulse:.0f} BPM",
            "impact": 18,
        })
    elif pulse is not None and 60 <= pulse <= 100:
        protective_signals.append({
            "label": "Stable pulse",
            "detail": f"Pulse is {pulse:.0f} BPM",
            "impact": 5,
        })

    # Temperature
    temperature = _optional_float(vitals.get("temperature"))

    if temperature is not None and temperature >= 102:
        risk_signals.append({
            "label": "High temperature",
            "detail": f"Temperature is {temperature:.1f}°F",
            "impact": 14,
        })
    elif temperature is not None and 97 <= temperature <= 100.4:
        protective_signals.append({
            "label": "Stable temperature",
            "detail": f"Temperature is {temperature:.1f}°F",
            "impact": 4,
        })

    # Respiration
    respiration = _optional_float(vitals.get("respiration"))

    if respiration is not None and respiration > 28:
        risk_signals.append({
            "label": "High respiration rate",
            "detail": f"Respiration is {respiration:.0f}/min",
            "impact": 16,
        })
    elif respiration is not None and 12 <= respiration <= 20:
        protective_signals.append({
            "label": "Stable respiration",
            "detail": f"Respiration is {respiration:.0f}/min",
            "impact": 4,
        })

    # Voice distress
    if payload.get("voiceDistress", False):
        risk_signals.append({
            "label": "Voice distress flag",
            "detail": "Voice monitoring produced a distress flag",
            "impact": 18,
        })

    # Age
    age = _optional_float(payload.get("age"))

    if age is not None and age >= 65:
        risk_signals.append({
            "label": "Age risk modifier",
            "detail": f"Patient age is {age:.0f}",
            "impact": 5,
        })

    # Remove duplicate labels and keep strongest signals.
    risk_signals = sorted(
        risk_signals,
        key=lambda item: item["impact"],
        reverse=True,
    )[:5]

    protective_signals = sorted(
        protective_signals,
        key=lambda item: item["impact"],
        reverse=True,
    )[:5]

    if risk_signals:
        summary = (
            f"The {state} result is supported by "
            f"{len(risk_signals)} observed risk signal(s) "
            f"combined with the model probability."
        )
    else:
        summary = (
            "No major risk signal was detected in the supplied "
            "symptoms and vital readings."
        )

    return {
        "riskSignals": risk_signals,
        "protectiveSignals": protective_signals,
        "summary": summary,
    }

def _recommendations(state: str) -> list[str]:
    return {
        "Normal": [
            "Continue scheduled medication and hydration.",
            "Record symptoms again if any new discomfort appears.",
            "Keep emergency contacts verified for readiness.",
        ],
        "At-Risk": [
            "Book a same-day consultation or telemedicine check.",
            "Repeat medication verification and monitor vitals for 30 minutes.",
            "Alert a caretaker if symptoms intensify.",
        ],
        "Emergency": [
            "If this is happening now, call local emergency services immediately and move to safety if possible.",
            "Apply firm direct pressure to severe bleeding with a clean cloth if it is safe to do so.",
            "Do not delay professional medical help for app output.",
        ],
    }[state]


def _is_unspecified_pain(text: str) -> bool:
    normalized = re.sub(r"[^a-z0-9']+", " ", text.lower()).strip()
    return normalized in {
        "pain",
        "some pain",
        "i have pain",
        "i am in pain",
        "i'm in pain",
        "having pain",
        "i am having pain",
        "i'm having pain",
    }


def predict_triage(payload: dict[str, Any]) -> dict[str, Any]:
    payload, data_quality_warnings = _normalize_triage_payload(payload)
    text = str(payload.get("symptoms", "") or "routine check no urgent symptoms")
    bundle = _load_bundle()
    probabilities: dict[str, float]
    predicted = "Normal"
    fallback = True
    engine = "deterministic rule fallback"
    model_version = "vital-triage-fallback-0.1"

    if bundle is not None and pd is not None:
        model = bundle.get("model")
        frame = _frame_from_payload(payload)
        classes = list(getattr(model, "classes_", []))
        try:
            predicted = str(model.predict(frame)[0])
            raw_probabilities = model.predict_proba(frame)[0]
            probabilities = {str(label): round(float(value), 3) for label, value in zip(classes, raw_probabilities)}
            fallback = False
            engine = bundle.get("engine", "scikit-learn numeric vital/profile classifier")
            model_version = bundle.get("modelVersion", model_version)
        except Exception:
            probabilities = _fallback_probabilities(text)
    else:
        probabilities = _fallback_probabilities(text)
        predicted = max(probabilities, key=probabilities.get)

    for label in ["Normal", "At-Risk", "Emergency"]:
        probabilities.setdefault(label, 0.0)

    matched, emergency_signal, rule_score = _feature_flags(payload)
    missing_vitals = _missing_vital_readings(payload)
    score = 10
    score += probabilities.get("At-Risk", 0) * 28
    score += probabilities.get("Emergency", 0) * 56
    score += rule_score
    score = int(max(0, min(100, round(score))))

    if emergency_signal or score >= 82 or (predicted == "Emergency" and score >= 65):
        state = "Emergency"
    elif score >= 42 or predicted == "At-Risk":
        state = "At-Risk"
    else:
        state = "Normal"

    confidence = round(max(probabilities.values()), 3)
    evidence = get_model_evidence()
    source_status = evidence.get("dataset", {}).get("sourceStatus", "unknown")
    risk_factors = [f"Detected signal: {item}" for item in matched]
    if not risk_factors:
        risk_factors = ["No high-severity signal identified in the information entered"]

    top_features = [
        {"feature": item, "direction": "raises risk", "weight": KEYWORD_WEIGHTS.get(item, 8)}
        for item in matched[:5]
    ]
    if not top_features:
        top_features = [{"feature": "stable symptom description", "direction": "lowers risk", "weight": -8}]
    explainability = _explainability(
        payload=payload,
        matched=matched,
        score=score,
        state=state,
    )
    if missing_vitals:
        missing_list = ", ".join(missing_vitals)
        data_quality_warnings.append(
            f"Missing current readings: {missing_list}. The model fills missing values from training medians; this estimate is less dependable and must not be treated as reassurance."
        )
        explainability["summary"] += " Some vital readings were not supplied, so the model used training-set median values for those inputs."

    unspecified_pain = _is_unspecified_pain(text)
    recommendations = _recommendations(state)
    if data_quality_warnings:
        missing_step = f"Record actual current readings for: {', '.join(missing_vitals)}. Do not infer these values."
        if state == "Emergency":
            recommendations.insert(1, missing_step)
        else:
            recommendations.insert(0, missing_step)
    follow_up_prompt = None
    if unspecified_pain and state != "Emergency":
        risk_factors = ["Pain reported, but its location, onset, and severity are not specified"]
        top_features = [{"feature": "unspecified pain", "direction": "needs more detail", "weight": 0}]
        explainability["summary"] = "The word pain alone is not enough to assess what may be causing it or how urgent it is."
        follow_up_prompt = "Tell us where it hurts, when it started, how severe it is from 0–10, and whether it is getting better or worse. Add any other symptoms you notice."
        recommendations = [
            "Add where it hurts, when it started, how severe it is (0–10), and whether it is getting better or worse.",
            "Mention any other symptoms and the readings you have; VITAL cannot assess pain from a single word.",
            "If pain is sudden or severe, or comes with chest discomfort, trouble breathing, fainting, or reduced responsiveness, seek urgent medical help.",
        ]

    return {
        "state": state,
        "score": score,
        "explainability": explainability,
        "probabilities": {key: round(float(value), 3) for key, value in probabilities.items()},
        "confidence": confidence,
        "riskFactors": risk_factors,
        "recommendations": recommendations,
        "followUpPrompt": follow_up_prompt,
        "dataQualityWarnings": data_quality_warnings,
        "modelVersion": model_version,
        "dataset": evidence.get("dataset", {}).get("name", "VITAL controlled seed benchmark"),
        "datasetStatus": source_status,
        "topFeatures": top_features,
        "fallback": fallback,
        "model": {
            "predictedClass": predicted,
            "probabilities": {key: round(float(value), 3) for key, value in probabilities.items()},
            "engine": engine,
            "disclaimer": "This estimate is for general guidance only. It is not a diagnosis.",
        },
    }
