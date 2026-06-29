const scenes = [...document.querySelectorAll(".story-scene")];
const timers = new WeakMap();
const originalReadouts = new WeakMap();
let audioManifest = null;
let activeAudios = [];

fetch("audio/cast_day/manifest.json", { cache: "no-store" })
  .then((response) => (response.ok ? response.json() : null))
  .then((manifest) => {
    audioManifest = manifest;
    document.body.classList.toggle("has-audio", Boolean(manifest));
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
  const audioEndMs = audioEvents.reduce(
    (max, event) => Math.max(max, Number(event.at || 0) + Number(event.duration || 0) * 1000),
    9400
  );
  const completionMs = Math.ceil(audioEndMs + 700);
  [0.16, 0.32, 0.52, 0.72, 0.88].forEach((ratio, step) => {
    const delay = Math.round(completionMs * ratio);
    scheduled.push(setTimeout(() => pulseSignals(scene, step), delay));
  });

  audioEvents.forEach((event) => {
    scheduled.push(setTimeout(() => playEventAudio(scene, event), Number(event.at || 0)));
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
