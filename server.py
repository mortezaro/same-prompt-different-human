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
            "focused": "Natural human speech. Alert, confident, quick, and conversational. Never sound like an announcer.",
            "confused": "Natural human speech with genuine uncertainty, small hesitations, and a searching cadence. Subtle, not theatrical.",
            "overloaded": "Natural human speech under cognitive load: slightly rushed, self-correcting, and uncertain. Keep it believable and understated.",
            "low": "Natural human speech with distinctly low energy. Speak very slowly and quietly, with weak breath support, delayed starts, and long pauses. Sound genuinely tired and depleted, never theatrical.",
            "longform": "Natural continuous speech from a somewhat tired but engaged student thinking aloud. Keep the tone human, grounded, slightly breathy, and imperfect. Use only occasional natural fillers and small restarts when they feel genuinely motivated. Preserve the hesitations and word-retrieval pauses, but do not overdo them. Leave clear conversational space after incomplete thoughts, after saying Okay, and before the final request. Never sound scripted, polished, or theatrical.",
        },
        "standard": "Polished general-purpose AI assistant. Clear and neutral, but somewhat uniform and information-dense.",
        "aware": {
            "focused": "An excellent conversational AI. Speak briskly and directly with compact, high-density phrasing.",
            "confused": "An excellent conversational AI with a clearly different feminine voice from the user. Warm, unhurried, and natural. For short backchannels, sound light and conversational, not announcer-like. For explanations, stay calm, supportive, and concise.",
            "longform": "An excellent conversational AI with one stable feminine voice throughout this entire conversation. Sound like the same listener in every short cue, backchannel, correction, and final answer. Keep the delivery calm, restrained, and consistent in tone. Avoid dramatic pitch changes, bubbly reactions, or mode-switching between short and long responses. For overlap moments like 'Mm-hmm' and 'Exactly,' stay supportive and slightly quieter than the human, but still clear and natural.",
            "overloaded": "An excellent conversational AI. Calm and grounded. Use short turns, gentle emphasis, and plenty of breathing room.",
            "low": "An excellent conversational AI responding to a depleted user. Speak much more slowly than normal, softly and quietly, with long pauses between short phrases. Offer only one optional step. Never sound upbeat or energetic.",
        },
    }
    instruction = instructions[role]
    if isinstance(instruction, dict):
        instruction = instruction[state]

    voice = {"human": "ash", "standard": "ash", "aware": "alloy"}[role]
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
