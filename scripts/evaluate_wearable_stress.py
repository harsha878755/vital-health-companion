from __future__ import annotations

import csv
import io
import json
import zipfile
from pathlib import Path

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, f1_score, recall_score

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = Path(r"D:\vital-data\archives\wearable-device-dataset-1.0.1.zip")
ARTIFACTS = ROOT / "backend" / "model-artifacts"
BASE = "wearable-device-dataset-from-induced-stress-and-structured-exercise-sessions-1.0.1/Wearable_Dataset/"


def numeric_rows(raw: bytes, start: int = 2) -> np.ndarray:
    rows = list(csv.reader(io.StringIO(raw.decode("utf-8-sig"))))
    values: list[float] = []
    for row in rows[start:]:
        if not row:
            continue
        try:
            values.append(float(row[-1]))
        except ValueError:
            continue
    return np.asarray(values, dtype=np.float64)


def hrv_features(ibi: np.ndarray) -> tuple[float, float, float]:
    rr_ms = ibi[(ibi > 0.3) & (ibi < 2.0)] * 1000
    if len(rr_ms) < 3:
        return 0.0, 0.0, 0.0
    diff = np.diff(rr_ms)
    return float(np.sqrt(np.mean(diff**2))), float(np.std(rr_ms, ddof=1)), float(np.mean(np.abs(diff) > 50) * 100)


def main() -> None:
    if not ARCHIVE.exists():
        raise SystemExit(f"Wearable archive missing: {ARCHIVE}")
    features: list[list[float]] = []
    labels: list[int] = []
    subjects: list[str] = []
    with zipfile.ZipFile(ARCHIVE) as archive:
        files = {name for name in archive.namelist()}
        for condition in ("AEROBIC", "ANAEROBIC", "STRESS"):
            prefixes = sorted({name.rsplit("/", 1)[0] for name in files if name.startswith(f"{BASE}{condition}/") and name.endswith("/HR.csv")})
            for prefix in prefixes:
                hr = numeric_rows(archive.read(f"{prefix}/HR.csv"))
                ibi_path = f"{prefix}/IBI.csv"
                ibi = numeric_rows(archive.read(ibi_path), start=1) if ibi_path in files else np.array([])
                rmssd, sdnn, pnn50 = hrv_features(ibi)
                features.append([float(np.mean(hr)), float(np.std(hr)), rmssd, sdnn, pnn50])
                labels.append(int(condition == "STRESS"))
                subjects.append(prefix.rsplit("/", 1)[-1].split("_")[0])
    x, y, groups = np.asarray(features), np.asarray(labels), np.asarray(subjects)
    ordered_subjects = sorted(set(groups))
    held_out = set(ordered_subjects[-max(1, len(ordered_subjects) // 4):])
    test = np.array([group in held_out for group in groups])
    model = LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)
    model.fit(x[~test], y[~test])
    predicted = model.predict(x[test])
    truth = y[test]
    stress_recall = recall_score(truth, predicted, pos_label=1, zero_division=0)
    metrics = {
        "benchmark": "PhysioNet wearable device dataset from induced stress and structured exercise sessions",
        "sourceStatus": "local_public_archive_evaluated",
        "task": "stress-session versus structured exercise-session proxy classification",
        "model": "logistic regression using mean HR, HR variability, RMSSD, SDNN, and pNN50",
        "records": int(len(y)),
        "subjects": int(len(set(groups))),
        "split": f"subject-held-out: {len(ordered_subjects) - len(held_out)} train subjects, {len(held_out)} test subjects",
        "macroF1": round(float(f1_score(truth, predicted, average="macro")), 3),
        "stressRecall": round(float(stress_recall), 3),
        "confusionMatrix": {"labels": ["exercise", "stress"], "values": confusion_matrix(truth, predicted, labels=[0, 1]).tolist()},
        "features": ["mean_hr", "std_hr", "rmssd_ms", "sdnn_ms", "pnn50_percent"],
        "cnnStatus": "not trained; no CNN claim is made in VITAL results",
        "limitations": [
            "This is a small session-level proxy benchmark, not a clinical stress diagnosis.",
            "HRV measures are calculated only from valid 0.3-2.0 second IBI values.",
            "Wearable values remain separate from VITAL triage until a validated fusion study is completed.",
        ],
    }
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    (ARTIFACTS / "wearable_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
