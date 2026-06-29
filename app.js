const scenes = [...document.querySelectorAll(".story-scene")];
const timers = new WeakMap();
const originalReadouts = new WeakMap();
let audioManifest = null;
let activeAudios = [];
const scenePlayers = new WeakMap();

const internalStateStreams = {
  morning: [
    "Listening to the student reconstruct the concept from memory. The pause after slope looks like lexical retrieval, not disengagement. Prosody stays even, attention is stable, and the system should wait before helping.",
    "The retrieval pause is unresolved for long enough to offer one lexical cue. Working memory is open, so a full explanation would be intrusive. Minimal cue is the policy.",
    "Cue accepted. The student resumes the explanation and keeps ownership of the turn. Internal state shifts from repair pressure back to active listening.",
    "The concept is grounded enough for a light backchannel. Keep the student talking; do not convert this into a lecture."
  ],
  cafe: [
    "The learner still has the morning concept, but the acoustic scene is unstable. Target speech remains foreground while competing speakers enter the pickup field.",
    "Attention drops during the math phrase. Head orientation and mic distance drift at the same time, so the likely failure mode is divided attention, not lack of understanding.",
    "The right action is not a long explanation. Compress the idea, anchor it to one sentence, and watch whether attention stabilizes after the response.",
    "Compression worked. The student repeats the core mapping in their own words. Keep the policy short: confirm direction and step size."
  ],
  evening: [
    "The physical channel is clean, so the breakdown is not acoustic. The learner is tired, but the statement is becoming more confident.",
    "False premise forming: larger learning rate means always faster learning. Because confidence is rising, waiting too long will let the misconception compound.",
    "Intervention threshold crossed. Select a brief, low-pressure correction. The goal is repair, not taking over the session.",
    "Self-repair detected. The student corrected the rule to balanced learning rate. Reduce autonomy, confirm the key idea, and close the session."
  ],
};

fetch("audio/cast_day_v2/manifest.json", { cache: "no-store" })
  .then((response) => (response.ok ? response.json() : null))
  .then((manifest) => {
    audioManifest = manifest;
    document.body.classList.toggle("has-audio", Boolean(manifest));
    if (manifest) {
      scenes.forEach((scene) => {
        const sceneAudio = manifest.scenes?.[`${scene.dataset.scene}_audio`];
        if (sceneAudio?.file) getScenePlayer(scene, sceneAudio.file);
      });
    }
  })
  .catch(() => {
    audioManifest = null;
  });

const sceneObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("is-active", entry.isIntersecting);
    });
  },
  {
    rootMargin: "-28% 0px -28% 0px",
    threshold: 0.18,
  }
);

function resetScene(scene) {
  scene._runToken = (scene._runToken || 0) + 1;
  const existing = timers.get(scene) || [];
  existing.forEach((timer) => clearTimeout(timer));
  timers.set(scene, []);

  scene.classList.remove("is-running", "is-complete");
  activeAudios.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  activeAudios = [];
  scene.querySelectorAll("[data-at]").forEach((node) => {
    node.classList.remove("is-live", "is-visible");
  });
  scene.querySelectorAll(".word").forEach((word) => {
    word.classList.remove("is-spoken", "is-speaking");
  });
  scene.querySelectorAll(".signal-tick").forEach((node) => {
    node.classList.remove("signal-tick");
  });
  scene.querySelectorAll(".generated-state").forEach((node) => {
    node.style.removeProperty("--chars");
    node.classList.remove("is-typing");
  });
  const button = scene.querySelector(".play-session");
  if (button) button.innerHTML = "<i></i>Run session";

  scene.querySelectorAll("meter").forEach((meter) => {
    const original = originalReadouts.get(meter);
    if (original != null) meter.value = original;
  });
  scene.querySelectorAll(".metric-grid strong").forEach((node) => {
    const original = originalReadouts.get(node);
    if (original != null) node.textContent = original;
  });
}

function getScenePlayer(scene, file) {
  let audio = scenePlayers.get(scene);
  if (!audio) {
    audio = document.createElement("audio");
    audio.className = "session-audio";
    audio.preload = "auto";
    audio.playsInline = true;
    audio.setAttribute("aria-hidden", "true");
    scene.appendChild(audio);
    scenePlayers.set(scene, audio);
  }
  if (!audio.src.endsWith(file)) {
    audio.src = file;
    audio.load();
  }
  return audio;
}

function rememberOriginals(scene) {
  scene.querySelectorAll("meter").forEach((meter) => {
    if (!originalReadouts.has(meter)) originalReadouts.set(meter, Number(meter.value));
  });
  scene.querySelectorAll(".metric-grid strong").forEach((node) => {
    if (!originalReadouts.has(node)) originalReadouts.set(node, node.textContent);
  });
}

function pulseSignals(scene, step) {
  const visibleLayers = [...scene.querySelectorAll(".layer.is-visible, .layer-bars.is-visible .layer")];
  const visibleMetrics = [...scene.querySelectorAll(".science-board.is-visible .metric-grid div")];
  const visiblePolicies = [...scene.querySelectorAll(".policy-board.is-visible .policy-step")];
  const visiblePhysical = [...scene.querySelectorAll(".room-map.is-visible .physical-readout strong, .mini-room.is-visible b")];

  [...visibleLayers, ...visibleMetrics, ...visiblePolicies, ...visiblePhysical].forEach((node, index) => {
    if (index % 2 === step % 2) {
      node.classList.remove("signal-tick");
      void node.offsetWidth;
      node.classList.add("signal-tick");
    }
  });

  scene.querySelectorAll(".layer-bars.is-visible meter").forEach((meter, index) => {
    const base = originalReadouts.get(meter) ?? Number(meter.value);
    const drift = ((step + index) % 3) - 1;
    meter.value = Math.max(8, Math.min(96, base + drift * 5));
  });

  scene.querySelectorAll(".science-board.is-visible .metric-grid strong").forEach((node, index) => {
    const base = originalReadouts.get(node) ?? node.textContent;
    const match = String(base).match(/^(\d+)%$/);
    if (!match) return;
    const drift = ((step + index) % 3) - 1;
    node.textContent = `${Math.max(5, Math.min(97, Number(match[1]) + drift * 3))}%`;
  });
}

function normalizeText(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findTurn(scene, event) {
  const candidates = [...scene.querySelectorAll(".turn")];
  const wanted = normalizeText(event.text);
  return candidates.find((turn) => normalizeText(turn.querySelector("p")?.textContent || "") === wanted);
}

function applyAudioTimings(scene) {
  const sceneName = scene.dataset.scene;
  const audioEvents = audioManifest?.scenes?.[sceneName] || [];
  audioEvents.forEach((event) => {
    const turn = findTurn(scene, event);
    if (turn) turn.dataset.at = String(event.at || 0);
  });
}

function prepareWords(turn, words) {
  const p = turn?.querySelector("p");
  if (!p || p.dataset.wordWrapped === "true") return p;
  p.innerHTML = words
    .map((word, index) => `<span class="word" data-word-index="${index}">${word.w}</span>`)
    .join(" ");
  p.dataset.wordWrapped = "true";
  return p;
}

function trackTranscript(audio, turn, words) {
  const p = prepareWords(turn, words);
  if (!p) return;
  const spans = [...p.querySelectorAll(".word")];
  const tick = () => {
    if (audio.paused || audio.ended) return;
    const time = audio.currentTime;
    spans.forEach((span, index) => {
      const word = words[index];
      const active = word && time >= word.s && time <= word.e;
      const spoken = word && time > word.e;
      span.classList.toggle("is-speaking", active);
      span.classList.toggle("is-spoken", spoken);
    });
    requestAnimationFrame(tick);
  };
  audio.addEventListener("play", tick, { once: true });
  audio.addEventListener("ended", () => {
    spans.forEach((span) => {
      span.classList.remove("is-speaking");
      span.classList.add("is-spoken");
    });
  });
}

function prepareSceneWords(scene, audioEvents) {
  audioEvents.forEach((event) => {
    const turn = findTurn(scene, event);
    if (turn && event.words) prepareWords(turn, event.words);
  });
}

function trackSceneTranscript(audio, scene, audioEvents) {
  const tracked = audioEvents
    .map((event) => {
      const turn = findTurn(scene, event);
      const p = turn && event.words ? prepareWords(turn, event.words) : null;
      return {
        at: Number(event.at || 0) / 1000,
        words: event.words || [],
        spans: p ? [...p.querySelectorAll(".word")] : [],
      };
    })
    .filter((item) => item.spans.length);

  const tick = () => {
    if (audio.paused || audio.ended) return;
    const time = audio.currentTime;
    tracked.forEach((item) => {
      const local = time - item.at;
      item.spans.forEach((span, index) => {
        const word = item.words[index];
        const active = word && local >= word.s && local <= word.e;
        const spoken = word && local > word.e;
        span.classList.toggle("is-speaking", active);
        span.classList.toggle("is-spoken", spoken);
      });
    });
    requestAnimationFrame(tick);
  };
  audio.addEventListener("play", tick, { once: true });
  audio.addEventListener("ended", () => {
    tracked.forEach((item) => {
      item.spans.forEach((span) => {
        span.classList.remove("is-speaking");
        span.classList.add("is-spoken");
      });
    });
  });
}

function setSceneTranscriptTime(scene, audioEvents, time) {
  audioEvents.forEach((event) => {
    const turn = findTurn(scene, event);
    const p = turn && event.words ? prepareWords(turn, event.words) : null;
    if (!p) return;
    const local = time - Number(event.at || 0) / 1000;
    const spans = [...p.querySelectorAll(".word")];
    spans.forEach((span, index) => {
      const word = event.words[index];
      const active = word && local >= word.s && local <= word.e;
      const spoken = word && local > word.e;
      span.classList.toggle("is-speaking", active);
      span.classList.toggle("is-spoken", spoken);
    });
  });
}

function startClockTranscript(scene, audioEvents, durationMs) {
  const token = scene._runToken;
  const startedAt = performance.now();
  const tick = (now) => {
    if (scene._runToken !== token) return;
    const elapsed = (now - startedAt) / 1000;
    setSceneTranscriptTime(scene, audioEvents, elapsed);
    if (elapsed * 1000 < durationMs) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function playSceneAudio(scene, sceneAudio, audioEvents) {
  if (!sceneAudio?.file) return false;
  const audio = getScenePlayer(scene, sceneAudio.file);
  audio.currentTime = 0;
  audio.volume = 1;
  activeAudios.push(audio);
  prepareSceneWords(scene, audioEvents);
  trackSceneTranscript(audio, scene, audioEvents);
  audio.play().catch(() => {
    const button = scene.querySelector(".play-session");
    if (button) button.innerHTML = "<i></i>Tap again for audio";
    startClockTranscript(scene, audioEvents, Number(sceneAudio.duration || 40) * 1000);
    console.warn("CAST audio playback was blocked by the browser for", scene.dataset.scene);
  });
  return true;
}

function updateInternalState(scene, text) {
  const state = scene.querySelector(".generated-state p");
  const shell = scene.querySelector(".generated-state");
  if (!state || !shell) return;
  shell.classList.remove("is-typing");
  state.textContent = text;
  void shell.offsetWidth;
  shell.classList.add("is-visible", "is-typing");
}

function playEventAudio(scene, event) {
  if (!event.file) return;
  const audio = new Audio(event.file);
  audio.preload = "auto";
  audio.volume = event.role === "cast" ? 0.82 : 1;
  activeAudios.push(audio);
  const turn = findTurn(scene, event);
  if (turn && event.words) trackTranscript(audio, turn, event.words);
  audio.play().catch(() => {
    const button = scene.querySelector(".play-session");
    if (button) button.innerHTML = "<i></i>Tap again for audio";
  });
}

function runScene(scene) {
  resetScene(scene);
  rememberOriginals(scene);
  applyAudioTimings(scene);
  scene.classList.add("is-running");
  const button = scene.querySelector(".play-session");
  if (button) button.innerHTML = "<i></i>Running";

  const scheduled = [];
  const nodes = [...scene.querySelectorAll("[data-at]")].sort(
    (a, b) => Number(a.dataset.at || 0) - Number(b.dataset.at || 0)
  );

  nodes.forEach((node) => {
    const delay = Number(node.dataset.at || 0);
    scheduled.push(
      setTimeout(() => {
        node.classList.add("is-visible", "is-live");
        if (node.classList.contains("generated-state")) {
          const text = node.textContent.trim();
          node.style.setProperty("--chars", Math.min(text.length, 430));
          node.classList.add("is-typing");
        }
      }, delay)
    );
  });

  const sceneName = scene.dataset.scene;
  const audioEvents = audioManifest?.scenes?.[sceneName] || [];
  const sceneAudio = audioManifest?.scenes?.[`${sceneName}_audio`];
  const audioEndMs = audioEvents.reduce(
    (max, event) => Math.max(max, Number(event.at || 0) + Number(event.duration || 0) * 1000),
    Number(sceneAudio?.duration || 0) * 1000 || 9400
  );
  const completionMs = Math.ceil(audioEndMs + 700);
  [0.16, 0.32, 0.52, 0.72, 0.88].forEach((ratio, step) => {
    const delay = Math.round(completionMs * ratio);
    scheduled.push(setTimeout(() => pulseSignals(scene, step), delay));
  });

  if (sceneAudio?.file) {
    playSceneAudio(scene, sceneAudio, audioEvents);
  } else {
    audioEvents.forEach((event) => {
      scheduled.push(setTimeout(() => playEventAudio(scene, event), Number(event.at || 0)));
    });
  }

  const stateUpdates = internalStateStreams[sceneName] || [];
  stateUpdates.forEach((text, index) => {
    const delay = Math.round((completionMs * (index + 0.7)) / (stateUpdates.length + 0.7));
    scheduled.push(setTimeout(() => updateInternalState(scene, text), delay));
  });

  scheduled.push(
    setTimeout(() => {
      scene.classList.remove("is-running");
      scene.classList.add("is-complete");
      if (button) button.innerHTML = "<i></i>Replay";
    }, completionMs)
  );

  timers.set(scene, scheduled);
}

scenes.forEach((scene, index) => {
  sceneObserver.observe(scene);
  scene.style.setProperty("--scene-index", index);
  rememberOriginals(scene);
  resetScene(scene);
});

document.querySelectorAll(".play-session").forEach((button) => {
  button.addEventListener("click", () => {
    const scene = button.closest(".story-scene");
    if (!scene) return;
    runScene(scene);
  });
});
