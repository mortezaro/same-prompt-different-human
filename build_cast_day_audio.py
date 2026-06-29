#!/usr/bin/env python3
import hashlib
import json
import os
import re
import subprocess
import uuid
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "audio" / "cast_day"
MODEL = "gpt-4o-mini-tts"
USER_VOICE = "echo"
CAST_VOICE = "nova"


SCENES = {
    "morning": [
        ("user", 0, "Okay, I want to try explaining gradient descent from memory."),
        ("user", 900, "It is when the model tries to reduce the error by moving downhill on the loss curve."),
        ("user", 2100, "So it looks at the slope, or the... the thing that tells it which direction is steepest."),
        ("cast", 3200, "Gradient?"),
        ("user", 3900, "Yes, gradient. It uses the gradient to know which way to move."),
        ("cast", 5000, "Mm-hmm. Good."),
        ("user", 5200, "And the learning rate decides how big the step is."),
        ("user", 6500, "So if the loss is high, it keeps adjusting the parameters until the loss gets lower."),
        ("cast", 7600, "Exactly. Keep going."),
    ],
    "cafe": [
        ("user", 0, "I think I understood it this morning, but now I am losing the thread."),
        ("user", 1200, "The cafe is loud, and every time I get to the math part, I forget what the pieces mean."),
        ("cast", 2500, "Want the one-sentence version again?"),
        ("user", 3200, "Yeah. Just one sentence."),
        ("cast", 4200, "Gradient descent is repeated correction: check the error, move a little to reduce it, then check again."),
        ("user", 5600, "Okay. Repeated correction. That is much easier."),
        ("user", 7000, "So the gradient tells the direction, and the learning rate tells the size of the step?"),
        ("cast", 8200, "Yes. Direction and step size."),
    ],
    "evening": [
        ("user", 0, "Okay, last pass. Gradient descent keeps changing the model to reduce the loss."),
        ("user", 1600, "The learning rate controls step size, so if the learning rate is bigger, it should always learn faster."),
        ("cast", 3000, "Small correction there."),
        ("user", 3600, "Okay."),
        ("cast", 4200, "A bigger learning rate can help, but only up to a point. If it is too large, the model can overshoot the minimum."),
        ("user", 5700, "Right. So bigger is not always better. It has to be balanced."),
        ("cast", 6600, "Exactly. That is the key idea."),
        ("user", 7400, "Can we stop there for today?"),
        ("cast", 8200, "Yes. That is a good stopping point."),
    ],
}


INSTRUCTIONS = {
    ("user", "morning"): (
        "Natural adult male student, warm and human. Morning energy: rested, engaged, "
        "slightly tentative while reconstructing an idea from memory. Use small natural "
        "pauses around hesitation, but do not over-act. Never sound like a narrator."
    ),
    ("user", "cafe"): (
        "Natural adult male student, same speaker identity as morning. Midday in a cafe: "
        "still engaged, mildly distracted and a little frustrated by noise. Conversational, "
        "not theatrical. Slightly quicker and more clipped than morning."
    ),
    ("user", "evening"): (
        "Natural adult male student, same speaker identity. Evening: tired but motivated, "
        "lower energy, slower starts, softer delivery. Keep it natural and humane, not sleepy "
        "or robotic."
    ),
    ("cast", "morning"): (
        "Natural female tutor voice. Compact, calm, supportive, and consistent. The response "
        "is a micro-cue or backchannel, so keep it brief and conversational."
    ),
    ("cast", "cafe"): (
        "Natural female tutor voice, same speaker identity. Calm, clear, and grounding. "
        "Slightly lower volume and steady pacing, as if helping in a noisy setting."
    ),
    ("cast", "evening"): (
        "Natural female tutor voice, same speaker identity. Gentle, low-pressure, precise. "
        "For the correction, be soft but clear; do not sound alarmed or robotic."
    ),
}


def slug(scene, role, index, text):
    digest = hashlib.sha1(f"{scene}|{role}|{index}|{text}".encode()).hexdigest()[:10]
    return f"{scene}_{index:02d}_{role}_{digest}.mp3"


def synthesize(scene, role, text, output):
    api_key = os.environ["OPENAI_API_KEY"]
    body = json.dumps(
        {
            "model": MODEL,
            "voice": USER_VOICE if role == "user" else CAST_VOICE,
            "input": text,
            "response_format": "mp3",
            "instructions": INSTRUCTIONS[(role, scene)],
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        "https://api.openai.com/v1/audio/speech",
        data=body,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=180) as response:
        output.write_bytes(response.read())


def duration_seconds(path):
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def word_timings(text, duration):
    tokens = re.findall(r"\S+", text)
    if not tokens:
        return []
    total_weight = sum(max(0.7, len(re.sub(r"\W", "", token)) / 4) for token in tokens)
    cursor = 0.0
    words = []
    for token in tokens:
        clean = token.strip()
        weight = max(0.7, len(re.sub(r"\W", "", token)) / 4)
        span = duration * weight / total_weight
        words.append({"w": clean, "s": round(cursor, 3), "e": round(min(duration, cursor + span), 3)})
        cursor += span
    return words


def transcribe_words(path, fallback_text, duration):
    boundary = f"----castboundary{uuid.uuid4().hex}"
    parts = []

    def field(name, value):
        parts.append(
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="{name}"\r\n\r\n'
            f"{value}\r\n".encode("utf-8")
        )

    field("model", "whisper-1")
    field("response_format", "verbose_json")
    field("timestamp_granularities[]", "word")
    audio_bytes = path.read_bytes()
    parts.append(
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{path.name}"\r\n'
        f"Content-Type: audio/mpeg\r\n\r\n".encode("utf-8")
        + audio_bytes
        + b"\r\n"
    )
    parts.append(f"--{boundary}--\r\n".encode("utf-8"))
    body = b"".join(parts)
    request = urllib.request.Request(
        "https://api.openai.com/v1/audio/transcriptions",
        data=body,
        headers={
            "Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            payload = json.loads(response.read())
        words = payload.get("words") or []
        if words:
            return [
                {
                    "w": item.get("word", "").strip(),
                    "s": round(float(item.get("start", 0)), 3),
                    "e": round(float(item.get("end", 0)), 3),
                }
                for item in words
                if item.get("word", "").strip()
            ]
    except Exception as exc:
        print(f"word timestamps fallback for {path.name}: {exc}", flush=True)
    return word_timings(fallback_text, duration)


def main():
    if "OPENAI_API_KEY" not in os.environ:
        raise SystemExit("OPENAI_API_KEY is not set. Run: OPENAI_API_KEY=... python3 build_cast_day_audio.py")
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {"model": MODEL, "voices": {"user": USER_VOICE, "cast": CAST_VOICE}, "scenes": {}}
    for scene, events in SCENES.items():
        manifest["scenes"][scene] = []
        cursor_ms = 0
        previous_role = None
        for index, (role, at, text) in enumerate(events):
            filename = slug(scene, role, index, text)
            path = OUT / filename
            if not path.exists():
                print(f"generating {filename} :: {text[:56]}", flush=True)
                synthesize(scene, role, text, path)
            duration = duration_seconds(path)
            if index:
                if previous_role == "user" and role == "cast":
                    cursor_ms += 260
                elif previous_role == "cast" and role == "user":
                    cursor_ms += 360
                else:
                    cursor_ms += 220
            manifest["scenes"][scene].append(
                {
                    "role": role,
                    "at": cursor_ms,
                    "text": text,
                    "file": f"audio/cast_day/{filename}",
                    "duration": round(duration, 3),
                    "words": transcribe_words(path, text, duration),
                }
            )
            cursor_ms += int(duration * 1000)
            previous_role = role
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"wrote {OUT / 'manifest.json'}")


if __name__ == "__main__":
    main()
