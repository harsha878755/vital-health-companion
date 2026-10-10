from __future__ import annotations

import io
import json
import wave
import zipfile
from pathlib import Path

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, f1_score, recall_score

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = Path(r"D:\vital-data\archives\ravdess-1.0.0\Audio_Speech_Actors_01-24.zip")
ARTIFACTS = ROOT / "backend" / "model-artifacts"


def acoustic_features(raw: bytes) -> np.ndarray:
    with wave.open(io.BytesIO(raw), "rb") as audio:
        samples = np.frombuffer(audio.readframes(audio.getnframes()), dtype=np.int16).astype(np.float32)
        rate = audio.getframerate()
    samples /= max(np.max(np.abs(samples)), 1.0)
    samples = samples[: rate * 4]
    if len(samples) < 256:
        return np.zeros(6, dtype=np.float32)
    frame = samples[: min(len(samples), 8192)]
    spectrum = np.abs(np.fft.rfft(frame * np.hanning(len(frame))))
    frequencies = np.fft.rfftfreq(len(frame), 1 / rate)
    centroid = float((frequencies * spectrum).sum() / max(spectrum.sum(), 1e-9))
    zcr = float(np.mean(np.abs(np.diff(np.signbit(samples)))))
    return np.array([len(samples) / rate, samples.mean(), samples.std(), np.sqrt(np.mean(samples**2)), zcr, centroid], dtype=np.float32)


def main() -> None:
    if not ARCHIVE.exists():
        raise SystemExit(f"RAVDESS speech archive missing: {ARCHIVE}")
    features: list[np.ndarray] = []
    labels: list[int] = []
    actors: list[int] = []
    with zipfile.ZipFile(ARCHIVE) as archive:
        for name in archive.namelist():
            if not name.endswith(".wav"):
                continue
            parts = Path(name).stem.split("-")
            if len(parts) != 7:
                continue
            emotion, actor = int(parts[2]), int(parts[6])
            # RAVDESS emotion codes 04/05/06 are sad/angry/fearful. This is an acted-emotion proxy only.
            labels.append(int(emotion in {4, 5, 6}))
            actors.append(actor)
            features.append(acoustic_features(archive.read(name)))
    x, y, groups = np.vstack(features), np.array(labels), np.array(actors)
    train = groups <= 18
    model = LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)
    model.fit(x[train], y[train])
    predicted = model.predict(x[~train])
    truth = y[~train]
    matrix = confusion_matrix(truth, predicted, labels=[0, 1]).tolist()
    metrics = {
        "benchmark": "RAVDESS Audio Speech",
        "sourceUrl": "https://zenodo.org/records/1188976",
        "sourceStatus": "local_public_archive_evaluated",
        "task": "binary acted-emotion distress proxy: sad, angry, or fearful versus other acted emotions",
        "model": "logistic regression over six transparent waveform features",
        "rows": int(len(y)),
        "split": "actor-held-out: actors 01-18 train, 19-24 test",
        "macroF1": round(float(f1_score(truth, predicted, average="macro")), 3),
        "distressRecall": round(float(recall_score(truth, predicted, pos_label=1)), 3),
        "confusionMatrix": {"labels": ["other", "acted-distress"], "values": matrix},
        "classificationReport": classification_report(truth, predicted, target_names=["other", "acted-distress"], output_dict=True, zero_division=0),
        "limitations": [
            "RAVDESS contains acted speech emotion, not medical distress or emergency calls.",
            "This model is a reproducible research proxy and is not deployed for clinical decision-making.",
            "Browser voice support remains a user-triggered accessibility/demo feature.",
        ],
    }
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    (ARTIFACTS / "voice_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
