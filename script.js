/* ============================================================
   Scenes: show silhouettes, switch with ← →, auto-advance timer
   ============================================================ */
const SCENE_SECONDS = 20;
const COUNTDOWN = 5;      // the last seconds of each scene count down to a webcam photo
const PHOTO_SECONDS = 4;  // how long the photo stays up before the next scene

const SVG_NS = "http://www.w3.org/2000/svg";
const GAP = 12;     // space between neighbouring figures in a group (0 = touching)
const ICON_H = 210; // default height of an icon, in scene units
const BAND = 6;     // height of the slices used to pack figures together

const stage = document.getElementById("stage");
const timerEl = document.getElementById("timer");
const timerText = document.getElementById("timerText");
const timerRing = document.getElementById("timerRing");
const RING_LEN = 2 * Math.PI * 27;

function el(tag, attrs, parent) {
  const n = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

/* ---------- Icons (icons.js) ---------- */
// Measure each icon once: draw it on a small hidden canvas and record, for every pixel row,
// the leftmost and rightmost filled pixel. Groups use these spans to pack tightly.
const RASTER = 400; // canvas size (pixels) for the icon's longer side
const iconCache = {};
function iconData(name) {
  if (iconCache[name]) return iconCache[name];
  if (!ICONS[name]) throw new Error(`No icon called "${name}" in icons.js`);
  const d = ICONS[name];
  const svg = el("svg", { width: 0, height: 0, style: "position:absolute;visibility:hidden" }, document.body);
  const box = el("path", { d }, svg).getBBox();
  svg.remove();

  const R = RASTER / Math.max(box.width, box.height); // pixels per icon unit
  const w = Math.ceil(box.width * R) + 2, h = Math.ceil(box.height * R) + 2;
  const ctx = Object.assign(document.createElement("canvas"), { width: w, height: h }).getContext("2d", { willReadFrequently: true });
  ctx.setTransform(R, 0, 0, R, 1 - box.x * R, 1 - box.y * R);
  ctx.fill(new Path2D(d));
  const px = ctx.getImageData(0, 0, w, h).data;
  const rows = []; // [y, xLeft, xRight] in icon units
  for (let r = 0; r < h; r++) {
    let lo = -1, hi = -1;
    for (let c = 0; c < w; c++) if (px[(r * w + c) * 4 + 3] > 64) { if (lo < 0) lo = c; hi = c; }
    if (lo >= 0) {
      const toX = (c) => box.x + (c - 1) / R;
      rows.push([box.y + (r - 0.5) / R, toX(lo), toX(hi + 1)]);
    }
  }
  return (iconCache[name] = { d, box, rows });
}

// Scale an icon so its top-to-floor span is h, centre it on x = 0 and stand it on y = 0.
// fig.floor / fig.top (in the icon's own units) move those lines in, so anything below the
// floor or above the top goes off screen.
function placeIcon(fig) {
  const { d, box, rows } = iconData(fig.icon);
  const floor = fig.floor ?? box.y + box.height;
  const top = fig.top ?? box.y;
  const s = (fig.h || ICON_H) / (floor - top);
  const sx = fig.flip ? -s : s;
  const m = [sx, 0, 0, s, -sx * (box.x + box.width / 2), -s * floor];
  const spans = rows.map(([y, a, b]) => {
    const xa = sx * a + m[4], xb = sx * b + m[4];
    return [s * y + m[5], Math.min(xa, xb), Math.max(xa, xb)];
  });
  return { d, m, spans };
}

// Horizontal extent of a figure in thin height bands, so neighbours can tuck together
function profileOf(spans) {
  const bands = new Map();
  let x0 = Infinity, x1 = -Infinity;
  for (const [y, a, b] of spans) {
    x0 = Math.min(x0, a); x1 = Math.max(x1, b);
    const k = Math.floor(y / BAND), e = bands.get(k);
    if (e) { e[0] = Math.min(e[0], a); e[1] = Math.max(e[1], b); }
    else bands.set(k, [a, b]);
  }
  return { bands, x0, x1 };
}

function renderScene(scene) {
  const svg = el("svg", { role: "img", "aria-label": scene.name, preserveAspectRatio: "xMidYMax meet" });

  // Slide each figure right up against the ones already placed (GAP apart at the closest
  // height), so arms and equipment at different heights can tuck past each other.
  const sky = new Map(); // band -> rightmost x so far
  const placed = scene.figures.map((fig) => {
    const icon = placeIcon(fig);
    const prof = profileOf(icon.spans);
    let x = sky.size ? -Infinity : 0;
    for (const [b, [lo]] of prof.bands) {
      if (sky.has(b)) x = Math.max(x, sky.get(b) - lo + GAP);
    }
    if (x === -Infinity) x = Math.max(...sky.values()) - prof.x0 + GAP;
    for (const [b, [, hi]] of prof.bands) sky.set(b, Math.max(sky.get(b) ?? -Infinity, hi + x));
    return { icon, prof, x };
  });

  // Centre the group and frame it tightly: top of the tallest figure to the floor (the screen's bottom edge)
  const x0 = Math.min(...placed.map((p) => p.prof.x0 + p.x));
  const x1 = Math.max(...placed.map((p) => p.prof.x1 + p.x));
  const y0 = -Math.max(...scene.figures.map((f) => f.h || ICON_H));
  const shift = -(x0 + x1) / 2;

  const boil = el("g", { filter: "url(#boil-fig)" }, svg); // hand-drawn wobble (see index.html)
  placed.forEach(({ icon, x }, i) => {
    // Outer group positions the figure; inner group animates (a CSS transform would override the position)
    const pos = el("g", { transform: `translate(${x + shift} 0)` }, boil);
    const g = el("g", { class: "figure", style: `--i:${i}` }, pos);
    el("path", { d: icon.d, transform: `matrix(${icon.m.join(" ")})` }, g);
  });

  const w = x1 - x0, h = -y0;
  svg.setAttribute("viewBox", `${-w / 2} ${-h} ${w} ${h}`);
  stage.replaceChildren(svg);
}

/* ---------- Scene switching + timer ---------- */
let current = 0;
let remaining = SCENE_SECONDS * 1000;
let paused = false;
let last = performance.now();
let photoUntil = 0; // while a photo is showing: when to move on

function goTo(i) {
  current = (i + SCENES.length) % SCENES.length;
  remaining = SCENE_SECONDS * 1000;
  photoUntil = 0;
  photoEl.hidden = true;
  renderScene(SCENES[current]);
  updateTimer();
}

function updateTimer() {
  const secs = Math.ceil(remaining / 1000);
  timerText.textContent = paused ? "paused" : secs;
  timerEl.classList.toggle("paused", paused);
  timerEl.classList.toggle("urgent", !paused && secs <= 5);
  timerRing.style.strokeDashoffset = RING_LEN * (1 - remaining / (SCENE_SECONDS * 1000));
  showCountdown(!paused && camReady && remaining > 0 && secs <= COUNTDOWN ? secs : null);
}

function tick(now) {
  const dt = now - last;
  last = now;
  if (photoUntil) {
    if (now >= photoUntil) goTo(current + 1);
  } else if (!paused) {
    remaining -= dt;
    if (remaining <= 0) {
      remaining = 0;
      updateTimer();
      if (camReady) {
        takePhoto();
        photoUntil = now + PHOTO_SECONDS * 1000;
      } else goTo(current + 1);
    } else updateTimer();
  }
  requestAnimationFrame(tick);
}

/* ---------- Webcam photo ---------- */
// Uses the browser's built-in camera API (no extra library). The browser asks for camera
// permission once; if it's refused or there's no camera, scenes just advance without photos.
const cam = document.getElementById("cam");
const countdownEl = document.getElementById("countdown");
const flashEl = document.getElementById("flash");
const photoEl = document.getElementById("photo");
let camReady = false;

if (navigator.mediaDevices?.getUserMedia) {
  navigator.mediaDevices
    .getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
    .then((stream) => { cam.srcObject = stream; return cam.play(); })
    .then(() => { camReady = true; })
    .catch((err) => console.warn("Camera not available, photos are off:", err));
}

function showCountdown(n) {
  if (n === null) { countdownEl.hidden = true; countdownEl.textContent = ""; return; }
  if (countdownEl.textContent === String(n)) return;
  countdownEl.hidden = false;
  countdownEl.textContent = n;
  countdownEl.classList.remove("tick");
  void countdownEl.offsetWidth; // restart the pop animation for each number
  countdownEl.classList.add("tick");
}

// Grab the current camera frame, mirrored like a selfie so it lines up with the silhouette
function takePhoto() {
  const w = cam.videoWidth, h = cam.videoHeight;
  const canvas = Object.assign(document.createElement("canvas"), { width: w, height: h });
  const ctx = canvas.getContext("2d");
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(cam, 0, 0, w, h);
  photoEl.src = canvas.toDataURL("image/jpeg", 0.9);
  photoEl.hidden = false;
  flashEl.classList.remove("go");
  void flashEl.offsetWidth;
  flashEl.classList.add("go");
}

document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === "ArrowRight") goTo(current + 1);
  else if (e.key === "ArrowLeft") goTo(current - 1);
  else if (e.key === " ") {
    e.preventDefault();
    paused = !paused;
    updateTimer();
  } else if (e.key === "f" || e.key === "F") toggleFullscreen();
});

// Swipe left/right on touch screens
let touchX = null;
document.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
document.addEventListener("touchend", (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) goTo(current + (dx < 0 ? 1 : -1));
  touchX = null;
});

/* ---------- Fullscreen ---------- */
const btn = document.getElementById("fsBtn");
const root = document.documentElement;
const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;

function toggleFullscreen() {
  if (fsElement()) {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  } else {
    const req = root.requestFullscreen || root.webkitRequestFullscreen;
    if (req) req.call(root);
  }
}

function syncState() {
  const on = !!fsElement();
  document.body.classList.toggle("is-fullscreen", on);
  btn.setAttribute("aria-label", on ? "Exit fullscreen" : "Enter fullscreen");
}

btn.addEventListener("click", () => { toggleFullscreen(); btn.blur(); });
document.addEventListener("fullscreenchange", syncState);
document.addEventListener("webkitfullscreenchange", syncState);

// Hide button, hint and cursor after 2.5s of no movement (only while fullscreen)
let idleTimer;
function wake() {
  document.body.classList.remove("idle");
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => document.body.classList.add("idle"), 2500);
}
["mousemove", "touchstart", "keydown"].forEach((ev) => document.addEventListener(ev, wake));
wake();

if (!(root.requestFullscreen || root.webkitRequestFullscreen)) btn.hidden = true;

/* ---------- Line boil ---------- */
// Step through a few noise patterns, like redrawing the frame (skipped if the viewer prefers less motion)
const BOIL_FPS = 3; // redraws per second
const BOIL_SEEDS = [1, 2, 3, 4];
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const noise = document.querySelectorAll(".boil-noise");
  let step = 0;
  setInterval(() => {
    step = (step + 1) % BOIL_SEEDS.length;
    noise.forEach((n) => n.setAttribute("seed", BOIL_SEEDS[step]));
  }, 1000 / BOIL_FPS);
}

/* ---------- Start ---------- */
goTo(0);
requestAnimationFrame(tick);
// Measure the remaining icons now, a few at a time, so the first visit to each scene is instant
const toMeasure = Object.keys(ICONS);
(function warm() {
  const until = performance.now() + 8;
  while (toMeasure.length && performance.now() < until) iconData(toMeasure.pop());
  if (toMeasure.length) setTimeout(warm, 0);
})();
