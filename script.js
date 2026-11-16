/* ============================================================
   Scenes: show silhouettes, switch with ← →, auto-advance timer
   ============================================================ */
const SCENE_SECONDS = 30;

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
// Measure each icon once and trace its outline, so groups can pack tightly
const iconCache = {};
function iconData(name) {
  if (iconCache[name]) return iconCache[name];
  if (!ICONS[name]) throw new Error(`No icon called "${name}" in icons.js`);
  const svg = el("svg", { width: 0, height: 0, style: "position:absolute;visibility:hidden" }, document.body);
  const path = el("path", { d: ICONS[name] }, svg);
  const box = path.getBBox(), len = path.getTotalLength(), pts = [];
  for (let t = 0; t <= len; t += 0.5) { const q = path.getPointAtLength(t); pts.push([q.x, q.y]); }
  svg.remove();
  return (iconCache[name] = { d: ICONS[name], box, pts });
}

// Scale an icon so its top-to-floor span is h, centre it on x = 0 and stand it on y = 0.
// fig.floor / fig.top (in the icon's own units) move those lines in, so anything below the
// floor or above the top goes off screen.
function placeIcon(fig) {
  const { d, box, pts } = iconData(fig.icon);
  const floor = fig.floor ?? box.y + box.height;
  const top = fig.top ?? box.y;
  const s = (fig.h || ICON_H) / (floor - top);
  const sx = fig.flip ? -s : s;
  const m = [sx, 0, 0, s, -sx * (box.x + box.width / 2), -s * floor];
  return { d, m, pts: pts.map(([x, y]) => [m[0] * x + m[4], m[3] * y + m[5]]) };
}

// Horizontal extent of a figure in thin height bands, so neighbours can tuck together
function profileOf(pts) {
  const bands = new Map();
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y);
    const b = Math.floor(y / BAND), e = bands.get(b);
    if (e) { e[0] = Math.min(e[0], x); e[1] = Math.max(e[1], x); }
    else bands.set(b, [x, x]);
  }
  return { bands, x0, x1, y0 };
}

function renderScene(scene) {
  const svg = el("svg", { role: "img", "aria-label": scene.name, preserveAspectRatio: "xMidYMax meet" });

  // Slide each figure right up against the ones already placed (GAP apart at the closest
  // height), so arms and equipment at different heights can tuck past each other.
  const sky = new Map(); // band -> rightmost x so far
  const placed = scene.figures.map((fig) => {
    const icon = placeIcon(fig);
    const prof = profileOf(icon.pts);
    let x = sky.size ? -Infinity : 0;
    for (const [b, [lo]] of prof.bands) {
      if (sky.has(b)) x = Math.max(x, sky.get(b) - lo + GAP);
    }
    if (x === -Infinity) x = Math.max(...sky.values()) - prof.x0 + GAP;
    for (const [b, [, hi]] of prof.bands) sky.set(b, Math.max(sky.get(b) ?? -Infinity, hi + x));
    return { icon, x };
  });

  // Centre the group and frame it tightly: top of the tallest figure to the floor (the screen's bottom edge)
  const profs = placed.map(({ icon, x }) => ({ ...profileOf(icon.pts), x }));
  const x0 = Math.min(...profs.map((p) => p.x0 + p.x));
  const x1 = Math.max(...profs.map((p) => p.x1 + p.x));
  const y0 = -Math.max(...scene.figures.map((f) => f.h || ICON_H));
  const shift = -(x0 + x1) / 2;

  placed.forEach(({ icon, x }, i) => {
    // Outer group positions the figure; inner group animates (a CSS transform would override the position)
    const pos = el("g", { transform: `translate(${x + shift} 0)` }, svg);
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

function goTo(i) {
  current = (i + SCENES.length) % SCENES.length;
  remaining = SCENE_SECONDS * 1000;
  renderScene(SCENES[current]);
  updateTimer();
}

function updateTimer() {
  const secs = Math.ceil(remaining / 1000);
  timerText.textContent = paused ? "paused" : secs;
  timerEl.classList.toggle("paused", paused);
  timerEl.classList.toggle("urgent", !paused && secs <= 5);
  timerRing.style.strokeDashoffset = RING_LEN * (1 - remaining / (SCENE_SECONDS * 1000));
}

function tick(now) {
  const dt = now - last;
  last = now;
  if (!paused) {
    remaining -= dt;
    if (remaining <= 0) goTo(current + 1);
    else updateTimer();
  }
  requestAnimationFrame(tick);
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

/* ---------- Start ---------- */
goTo(0);
requestAnimationFrame(tick);
