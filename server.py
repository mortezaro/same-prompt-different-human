import hashlib
import json
import os
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent
CACHE = ROOT / "audio"


class DemoHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/api/speech":
            self.send_error(404)
            return

        length = int(self.headers.get("Content-Length", "0"))
        try:
            payload = json.loads(self.rfile.read(length))
            audio = synthesize(payload)
        except KeyError:
            self.send_json(
                503,
                {"error": "OPENAI_API_KEY is not configured for studio voice."},
            )
            return
        except (ValueError, urllib.error.HTTPError, urllib.error.URLError) as exc:
            detail = exc.read().decode("utf-8", errors="replace") if isinstance(exc, urllib.error.HTTPError) else str(exc)
            self.send_json(502, {"error": f"Speech generation failed: {detail[:240]}"})
            return

        self.send_response(200)
        self.send_header("Content-Type", "audio/mpeg")
        self.send_header("Content-Length", str(len(audio)))
        self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        self.end_headers()
        self.wfile.write(audio)

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def synthesize(payload):
    text = str(payload["text"]).strip()
    role = payload.get("role", "aware")
    state = payload.get("state", "overloaded")
    if not text or len(text) > 4096:
        raise ValueError("Invalid speech text.")

    instructions = {
        "human": {
            "focused": "Natural male human speech. Alert, confident, slightly brisk, and conversational. Sound like a real person talking, never like a narrator or voice actor.",
            "confused": "Natural male human speech that sounds frustrated and impatient, but still controlled. Slightly clipped delivery, sharper onsets, and audible irritation. Keep it believable and fully human.",
            "overloaded": "Natural male human speech under cognitive load. Slightly rushed, effortful, and tense, with small self-repairs. Keep it understated and believable, never theatrical.",
            "low": "Natural male human speech with clearly low energy. Softer, slower, tired, and depleted, with light breathiness and delayed starts. Keep it natural, not exaggerated.",
            "longform": "Natural continuous speech from a somewhat tired but engaged student thinking aloud. Keep the tone human, grounded, slightly breathy, and imperfect. Use only occasional natural fillers and small restarts when they feel genuinely motivated. Preserve the hesitations and word-retrieval pauses, but do not overdo them. Leave clear conversational space after incomplete thoughts, after saying Okay, and before the final request. Never sound scripted, polished, or theatrical.",
        },
        "standard": "Neutral AI assistant voice. Clear and competent, but generic, steady, and less adaptive than a conversational partner.",
        "aware": {
            "focused": "A natural female AI voice. Brisk, clear, and compact, but still conversational and human-sounding. Avoid the feel of a scripted assistant.",
            "confused": "A natural female AI voice responding to a frustrated user. Calm the interaction down, sound steady and composed, and make the next step concrete. Keep the same speaker identity and avoid robotic sharpness.",
            "longform": "A natural female AI voice that stays stable for the entire conversation. Use the exact same speaker identity and emotional register for every cue, backchannel, correction, and longer answer. Calm, restrained, supportive, and consistent. No sudden tone shifts, exaggerated expressiveness, or robotic crispness. For overlap moments like 'Mm-hmm' and 'Exactly,' stay slightly quieter than the human while remaining natural and clear.",
            "overloaded": "A natural female AI voice. Calm, grounded, and concise, with short turns and gentle emphasis. Sound supportive without becoming flat or robotic.",
            "low": "A natural female AI voice responding to a depleted user. Softer and slower than normal, gentle and quiet, with more space between phrases. Never sound upbeat, bright, or energetic.",
        },
    }
    instruction = instructions[role]
    if isinstance(instruction, dict):
        instruction = instruction[state]

    voice = {"human": "echo", "standard": "onyx", "aware": "nova"}[role]
    cache_state = "all-states" if role == "standard" else state
    cache_key = hashlib.sha256(
        json.dumps([text, role, cache_state, voice, instruction]).encode("utf-8")
    ).hexdigest()
    CACHE.mkdir(exist_ok=True)
    cache_path = CACHE / f"{cache_key}.mp3"
    if cache_path.exists():
        return cache_path.read_bytes()

    api_key = os.environ["OPENAI_API_KEY"]
    request_body = json.dumps(
        {
            "model": "gpt-4o-mini-tts",
            "voice": voice,
            "input": text,
            "response_format": "mp3",
            "instructions": instruction,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        "https://api.openai.com/v1/audio/speech",
        data=request_body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=180) as response:
        audio = response.read()
    cache_path.write_bytes(audio)
    return audio


if __name__ == "__main__":
    os.chdir(ROOT)
    print("Same Words, Different Human: http://127.0.0.1:4173")
    ThreadingHTTPServer(("127.0.0.1", 4173), DemoHandler).serve_forever()
