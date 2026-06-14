# Same Prompt, Different Human

An interactive, speech-first multimodal demo for internal-state-aware AI,
focused on coding assistance and tutoring.

## Run

For the full neural-voice demo:

```bash
export OPENAI_API_KEY="..."
python3 server.py
```

Then open `http://localhost:4173`.

Speech is generated with `gpt-4o-mini-tts` and cached under `audio/`.
Without an API key, the visual, transcript, live-signal, and microphone-recording
features still work; neural voice buttons report that studio voice is unavailable.
Camera and microphone streams remain local to the browser.
