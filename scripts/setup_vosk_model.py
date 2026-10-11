from __future__ import annotations

import shutil
import sys
import urllib.request
import zipfile
from pathlib import Path, PurePosixPath


ROOT = Path(__file__).resolve().parents[1]
MODEL_NAME = "vosk-model-small-en-in-0.4"
MODEL_ROOT = ROOT / "backend" / "models"
MODEL_DIR = MODEL_ROOT / MODEL_NAME
MODEL_URL = f"https://alphacephei.com/vosk/models/{MODEL_NAME}.zip"
MODEL_ARCHIVE = MODEL_ROOT / f"{MODEL_NAME}.zip"
MODEL_TEMP = MODEL_ROOT / f"{MODEL_NAME}.partial"


def model_ready(path: Path) -> bool:
    return (path / "am" / "final.mdl").is_file()


def main() -> int:
    if model_ready(MODEL_DIR):
        print("VITAL offline speech model is ready.")
        return 0

    MODEL_ROOT.mkdir(parents=True, exist_ok=True)
    print("Downloading VITAL's offline Indian English speech model (about 36 MB)...")
    try:
        request = urllib.request.Request(MODEL_URL, headers={"User-Agent": "VITAL-local-setup/1.0"})
        with urllib.request.urlopen(request, timeout=45) as response, MODEL_TEMP.open("wb") as output:
            shutil.copyfileobj(response, output)
        if MODEL_TEMP.stat().st_size > 100_000_000:
            raise RuntimeError("Speech model archive exceeded the expected size limit.")

        staging = MODEL_ROOT / f".{MODEL_NAME}.extracting"
        if staging.exists():
            shutil.rmtree(staging)
        staging.mkdir()
        with zipfile.ZipFile(MODEL_TEMP) as archive:
            for item in archive.infolist():
                member = PurePosixPath(item.filename)
                if member.is_absolute() or ".." in member.parts or not member.parts or member.parts[0] != MODEL_NAME:
                    raise RuntimeError("Speech model archive contains an unexpected path.")
            archive.extractall(staging)

        extracted_model = staging / MODEL_NAME
        if not model_ready(extracted_model):
            raise RuntimeError("Downloaded speech model is incomplete.")
        if MODEL_DIR.exists():
            shutil.rmtree(MODEL_DIR)
        extracted_model.replace(MODEL_DIR)
        shutil.rmtree(staging, ignore_errors=True)
        print("VITAL offline speech model setup is complete.")
        return 0
    except Exception as exc:
        print(f"Could not set up local voice recognition: {exc}", file=sys.stderr)
        print("Check your internet connection and run START VITAL.cmd again.", file=sys.stderr)
        return 1
    finally:
        MODEL_TEMP.unlink(missing_ok=True)
        MODEL_ARCHIVE.unlink(missing_ok=True)


if __name__ == "__main__":
    raise SystemExit(main())
