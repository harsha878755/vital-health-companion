from __future__ import annotations

import base64
import io
import json
import threading
import wave
from pathlib import Path
from typing import Any


MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "vosk-model-small-en-in-0.4"
MAX_AUDIO_BYTES = 600_000
MAX_AUDIO_SECONDS = 12
_MODEL_LOCK = threading.Lock()
_MODEL: Any | None = None


def transcribe_wav(payload: dict[str, Any]) -> dict[str, Any]:
    encoded = payload.get("audioBase64")
    if not isinstance(encoded, str) or not encoded or len(encoded) > MAX_AUDIO_BYTES * 4 // 3 + 16:
        raise ValueError("Record a short voice question and try again.")
    try:
        audio = base64.b64decode(encoded, validate=True)
        with wave.open(io.BytesIO(audio), "rb") as wav:
            if wav.getnchannels() != 1 or wav.getsampwidth() != 2 or wav.getcomptype() != "NONE" or wav.getframerate() != 16000:
                raise ValueError("Voice recording format is unsupported. Record again in VITAL.")
            if wav.getnframes() <= 0 or wav.getnframes() > 16000 * MAX_AUDIO_SECONDS:
                raise ValueError("Voice questions must be 12 seconds or shorter.")
            frames = wav.readframes(wav.getnframes())
    except (ValueError, wave.Error, OSError) as exc:
        if isinstance(exc, ValueError) and str(exc).startswith(("Record", "Voice recording", "Voice questions")):
            raise
        raise ValueError("VITAL could not read that voice recording. Please record it again.") from exc

    model = _get_model()
    try:
        from vosk import KaldiRecognizer

        recognizer = KaldiRecognizer(model, 16000)
        recognizer.SetWords(False)
        recognizer.AcceptWaveform(frames)
        result = json.loads(recognizer.FinalResult())
    except Exception as exc:
        raise RuntimeError("Local speech recognition failed. Restart VITAL and try again.") from exc

    return {"transcription": str(result.get("text") or "").strip()[:1500], "engine": "Vosk local Indian English"}


def _get_model() -> Any:
    global _MODEL
    if _MODEL is not None:
        return _MODEL
    with _MODEL_LOCK:
        if _MODEL is not None:
            return _MODEL
        if not (MODEL_PATH / "am" / "final.mdl").is_file():
            raise RuntimeError("VITAL’s offline speech model is not installed. Start VITAL while online once to finish setup.")
        try:
            from vosk import Model, SetLogLevel

            SetLogLevel(-1)
            _MODEL = Model(str(MODEL_PATH))
        except Exception as exc:
            raise RuntimeError("VITAL’s offline speech model could not load. Restart VITAL and try again.") from exc
    return _MODEL
