from __future__ import annotations

import io
import json
import zipfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = Path(r"D:\vital-data\archives\ePillID_data_v1.0.zip")
ARTIFACTS = ROOT / "backend" / "model-artifacts"
PREFIX = "ePillID_data/classification_data/segmented_nih_pills_224/"


def main() -> None:
    if not ARCHIVE.exists():
        raise SystemExit(f"ePillID archive missing: {ARCHIVE}")
    with zipfile.ZipFile(ARCHIVE) as archive:
        samples = [name for name in archive.namelist() if name.startswith(PREFIX) and name.lower().endswith(".jpg")]
        labels = [Path(name).name.split("_")[0] for name in samples]
        counts = Counter(labels)
        repeatable_classes = sum(1 for count in counts.values() if count >= 2)
    metrics = {
        "benchmark": "ePillID segmented NIH pill images",
        "sourceUrl": "https://github.com/usuyama/ePillID-benchmark",
        "sourceStatus": "local_public_archive_evaluated",
        "task": "closed-set pill image identification baseline; separate from the VITAL webcam visibility workflow",
        "model": None,
        "totalArchiveImages": len(samples),
        "distinctPillLabels": len(counts),
        "classesWithAtLeastTwoImages": repeatable_classes,
        "evaluationStatus": "not_evaluated_two_images_per_label_without_official_split",
        "macroF1": None,
        "top1Recognition": None,
        "limitations": [
            "This downloaded archive has only two segmented images per pill label and no documented official split, which is insufficient for a robust recognition evaluation.",
            "A future evaluation must use the official multi-view/split protocol or a separately documented acquisition set.",
            "The browser workflow reports tablet visibility support, not pill identity or ingestion proof.",
            "Do not use this result to recommend medication or to make clinical claims.",
        ],
    }
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    (ARTIFACTS / "medication_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
