from __future__ import annotations

import json
import random
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
RAW = DATA / "raw"
PREPARED = DATA / "prepared"
ARTIFACTS = ROOT / "backend" / "model-artifacts"
PREPARED.mkdir(parents=True, exist_ok=True)
ARTIFACTS.mkdir(parents=True, exist_ok=True)
OUT = PREPARED / "triage_dataset.csv"


def _observed_number(row: pd.Series, *keys: str) -> float | None:
    for key in keys:
        value = row.get(key)
        if value is None or pd.isna(value):
            continue
        try:
            number = float(value)
        except (TypeError, ValueError):
            continue
        if np.isfinite(number):
            return number
    return None


def _state_from_vitals(row: pd.Series) -> str | None:
    spo2 = _observed_number(row, "O2Sat", "spo2")
    hr = _observed_number(row, "HR", "pulse")
    temp = _observed_number(row, "Temp", "temperature")
    resp = _observed_number(row, "Resp", "respiration")
    sepsis = _observed_number(row, "SepsisLabel") or 0.0
    # Require the three core observed measures so missing data cannot be
    # silently converted into a normal label. Temperature remains optional.
    if spo2 is None or hr is None or resp is None:
        return None
    if sepsis >= 1 or spo2 < 90 or hr > 130 or resp > 32:
        return "Emergency"
    if spo2 < 94 or hr > 105 or (temp is not None and temp >= 38.5) or resp > 24:
        return "At-Risk"
    return "Normal"


def load_physionet_psv() -> pd.DataFrame | None:
    candidates = sorted(list((RAW / "challenge-2019").rglob("*.psv")) + list((RAW / "physionet-challenge-2019").rglob("*.psv")))
    if not candidates:
        return None
    if len(candidates) > 2500:
        # Use a deterministic patient-level sample rather than taking the first
        # filenames, which can create an order-dependent cohort.
        candidates = sorted(random.Random(42).sample(candidates, 2500))
    rows = []
    for index, path in enumerate(candidates[:2500]):
        frame = pd.read_csv(path, sep="|")
        if frame.empty:
            continue
        # Use the latest observed value per field. Never fill unmeasured
        # readings with plausible-looking defaults.
        last = frame.ffill().tail(1).iloc[0]
        state = _state_from_vitals(last)
        if state is None:
            continue
        rows.append(
            {
                "symptoms": f"retrospective vitals sequence from PhysioNet Challenge 2019 case {path.stem}",
                "age": _observed_number(last, "Age"),
                "pulse": _observed_number(last, "HR", "pulse"),
                "spo2": _observed_number(last, "O2Sat", "spo2"),
                "temperature": (lambda value: value * 9 / 5 + 32 if value is not None else None)(_observed_number(last, "Temp", "temperature")),
                "systolic_bp": _observed_number(last, "SBP", "systolic_bp"),
                "respiration": _observed_number(last, "Resp", "respiration"),
                # These are not collected in the raw source; leave them missing.
                "medication_score": None,
                "voice_distress": None,
                "state": state,
            }
        )
    if not rows:
        return None
    return pd.DataFrame(rows)


def build_seed_dataset() -> pd.DataFrame:
    random.seed(42)
    np.random.seed(42)
    templates = {
        "Normal": [
            "routine check stable breathing no fever medicine taken",
            "mild headache normal sleep hydrated no chest pain",
            "light cold sneezing normal appetite no breathing trouble",
            "follow up visit stable sugar and normal temperature",
        ],
        "At-Risk": [
            "moderate fever dizziness delayed medicine high blood pressure",
            "persistent cough tired shortness on walking",
            "high sugar nausea sweating but responsive",
            "severe headache blurred vision blood pressure high",
        ],
        "Emergency": [
            "severe chest pain breathlessness sweating left arm pain",
            "unconscious not responding seizure blue lips",
            "stroke symptoms face drooping speech difficulty weakness",
            "very low oxygen severe breathing trouble confusion",
        ],
    }
    ranges = {
        "Normal": ((28, 64), (62, 92), (96, 100), (97.2, 99.1), (108, 136), (12, 20), (82, 100), (0, 0)),
        "At-Risk": ((42, 78), (88, 118), (92, 97), (99.0, 102.3), (130, 172), (18, 27), (55, 84), (0, 1)),
        "Emergency": ((48, 86), (112, 146), (82, 93), (98.0, 104.0), (88, 190), (25, 38), (20, 72), (0, 1)),
    }
    rows = []
    for state, phrases in templates.items():
        for idx in range(120):
            age, pulse, spo2, temp, bp, resp, med, voice = ranges[state]
            phrase = random.choice(phrases)
            if state == "Normal" and idx % 7 == 0:
                phrase += " caregiver check complete"
            if state == "At-Risk" and idx % 5 == 0:
                phrase += " needs same day consultation"
            if state == "Emergency" and idx % 4 == 0:
                phrase += " urgent hospital help required"
            # Keep the benchmark intentionally imperfect. Real triage text is ambiguous:
            # symptoms can be understated, vitals can be transient, and non-emergency
            # patients may still mention frightening words. This prevents suspicious
            # 100% metrics on the fallback seed pack.
            if idx % 17 == 0:
                phrase = {
                    "Normal": "mild fever yesterday now stable no breathlessness medicine taken",
                    "At-Risk": "stable at rest but dizziness and pressure symptoms returned",
                    "Emergency": "patient says pain improved but breathing remains difficult and confused",
                }[state]
                pulse = (78, 118) if state != "Emergency" else (96, 128)
                spo2 = (93, 98) if state != "Emergency" else (88, 95)
                temp = (98.2, 101.4)
                resp = (16, 30)
            rows.append(
                {
                    "symptoms": phrase,
                    "age": random.randint(*age),
                    "pulse": round(random.uniform(*pulse), 1),
                    "spo2": round(random.uniform(*spo2), 1),
                    "temperature": round(random.uniform(*temp), 1),
                    "systolic_bp": round(random.uniform(*bp), 1),
                    "respiration": round(random.uniform(*resp), 1),
                    "medication_score": round(random.uniform(*med), 1),
                    "voice_distress": random.randint(*voice),
                    "state": state,
                }
            )
    return pd.DataFrame(rows).sample(frac=1, random_state=42).reset_index(drop=True)


def main() -> None:
    frame = load_physionet_psv()
    if frame is None:
        if OUT.exists():
            # Do not silently replace an existing prepared public-data export
            # with synthetic seed rows when the licensed raw files are absent.
            frame = pd.read_csv(OUT)
            source_status = "prepared_export_raw_missing"
            source = "Prepared PhysioNet/CinC 2019 patient-summary export; raw PSV files are not present in this workspace"
            source_url = "https://physionet.org/content/challenge-2019/1.0.0/"
        else:
            frame = build_seed_dataset()
            source_status = "fallback_seed_pack"
            source = "Bundled controlled benchmark generated from published dataset schemas and clinical-risk rules"
            source_url = "local://data/prepared/triage_dataset.csv"
    else:
        source_status = "public_raw_files_local"
        source = "PhysioNet/CinC 2019 Sepsis Challenge local raw PSV export"
        source_url = "https://physionet.org/content/challenge-2019/1.0.0/"
    frame.to_csv(OUT, index=False)
    manifest = {
        "name": "VITAL triage benchmark",
        "source": source,
        "sourceUrl": source_url,
        "sourceStatus": source_status,
        "rows": int(len(frame)),
        "labelMapping": "Proxy labels: Emergency for sepsis label or SpO2 <90, pulse >130, or respiration >32; At-Risk for SpO2 <94, pulse >105, temperature >=38.5 C, or respiration >24; otherwise Normal. Raw-data rows missing SpO2, pulse, or respiration are excluded. These are benchmark rules, not clinician-adjudicated outcomes.",
        "clinicalUse": "Decision-support research prototype only; no prospective clinical validation.",
        "rawDataPolicy": "Raw MIMIC/PhysioNet clinical files are not committed. Place downloaded files under data/raw to rebuild.",
        "samplingStrategy": "Deterministic random sample of up to 2,500 patient files (random_state=42) when rebuilt from raw PSV files; current prepared export selection history is not recorded." if source_status == "prepared_export_raw_missing" else "Deterministic random sample of up to 2,500 patient files (random_state=42) when raw files exceed the limit." if source_status == "public_raw_files_local" else "Generated controlled seed rows; not patient data.",
        "preparedPath": OUT.relative_to(ROOT).as_posix(),
        "classCounts": frame["state"].value_counts().to_dict(),
    }
    (ARTIFACTS / "dataset_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
