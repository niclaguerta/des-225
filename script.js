/* ============================================================
   Scenes: draw silhouettes, switch with ← →, auto-advance timer
   ============================================================ */
const SCENE_SECONDS = 30;

const SVG_NS = "http://www.w3.org/2000/svg";
const LEN = { torso: 62, shoulder: 54, ua: 34, fa: 32, th: 46, sh: 46, head: 17 };
const WIDTH = { torso: 34, shoulders: 20, hips: 26, arm: 14, leg: 17 };
const SPACING = 125;

const stage = document.getElementById("stage");
const timerEl = document.getElementById("timer");
const timerText = document.getElementById("timerText");
const timerRing = document.getElementById("timerRing");
const RING_LEN = 2 * Math.PI * 27;

// angle 0 = down, 90 = right, 180 = up (y grows downward in SVG)
const dir = (deg) => {
  const r = (deg * Math.PI) / 180;
  return [Math.sin(r), Math.cos(r)];
};
const add = (p, d, len) => [p[0] + d[0] * len, p[1] + d[1] * len];

// Work out joint positions for a pose, standing on y = 0
function skeleton(pose, flip, lift) {
  const lean = pose.lean || 0;
  const up = dir(180 - lean);
  const hip = [0, 0];
  const neck = add(hip, up, LEN.torso);
  const sc = add(hip, up, LEN.shoulder);
  const lS = [sc[0] - 11, sc[1]], rS = [sc[0] + 11, sc[1]];
  const lH = [-8, 0], rH = [8, 0];

  const lE = add(lS, dir(pose.lUA), LEN.ua), lHand = add(lE, dir(pose.lFA), LEN.fa);
  const rE = add(rS, dir(pose.rUA), LEN.ua), rHand = add(rE, dir(pose.rFA), LEN.fa);
  const lK = add(lH, dir(pose.lTh), LEN.th), lF = add(lK, dir(pose.lSh), LEN.sh);
  const rK = add(rH, dir(pose.rTh), LEN.th), rF = add(rK, dir(pose.rSh), LEN.sh);
  const head = add(neck, up, LEN.head + 5);

  const pts = { hip, neck, lS, rS, lH, rH, lE, lHand, rE, rHand, lK, lF, rK, rF, head };

  // Put the lowest foot on the floor, then lift (for jumps) and mirror if needed
  const floor = Math.max(lF[1], rF[1]) + WIDTH.leg / 2;
  for (const k in pts) {
    pts[k] = [(flip ? -1 : 1) * pts[k][0], pts[k][1] - floor - (lift || 0)];
  }
  return pts;
}

function el(tag, attrs, parent) {
  const n = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

const line = (g, a, b, w) =>
  el("path", { class: "limb", d: `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`, "stroke-width": w }, g);
const poly = (g, pts, w) =>
  el("path", { class: "limb", d: "M" + pts.map((p) => p.join(" ")).join("L"), "stroke-width": w }, g);

// Returns [minX, minY, maxX, maxY] of what was drawn, relative to the figure's own origin
function drawFigure(g, fig) {
  if (fig.src) {
    const h = fig.h || 200;
    const w = fig.w || h;
    el("image", { href: fig.src, x: -w / 2, y: -h - (fig.lift || 0), width: w, height: h }, g);
    return [-w / 2, -h - (fig.lift || 0), w / 2, 0];
  }

  const pose = Object.assign({}, POSES[fig.pose], fig.tweak);
  const p = skeleton(pose, fig.flip, fig.lift);

  poly(g, [p.lH, p.lK, p.lF], WIDTH.leg);
  poly(g, [p.rH, p.rK, p.rF], WIDTH.leg);
  line(g, p.lH, p.rH, WIDTH.hips);
  line(g, p.hip, p.neck, WIDTH.torso);
  line(g, p.lS, p.rS, WIDTH.shoulders);
  poly(g, [p.lS, p.lE, p.lHand], WIDTH.arm);
  poly(g, [p.rS, p.rE, p.rHand], WIDTH.arm);
  el("circle", { cx: p.head[0], cy: p.head[1], r: LEN.head }, g);

  const pad = WIDTH.leg;
  const xs = Object.values(p).map((q) => q[0]);
  const ys = Object.values(p).map((q) => q[1]);
  return [Math.min(...xs) - pad, Math.min(p.head[1] - LEN.head, ...ys) - pad,
          Math.max(...xs) + pad, 0];
}

function renderScene(scene) {
  const svg = el("svg", { role: "img", "aria-label": scene.name, preserveAspectRatio: "xMidYMax meet" });
  const n = scene.figures.length;
  let box = [Infinity, Infinity, -Infinity, 0];

  scene.figures.forEach((fig, i) => {
    const x = fig.x ?? (i - (n - 1) / 2) * SPACING;
    el("ellipse", { class: "floor-shadow", cx: x, cy: 4, rx: 46, ry: 7 }, svg);
    // Outer group positions the figure; inner group animates (a CSS transform would override the position)
    const pos = el("g", { transform: `translate(${x} 0)` }, svg);
    const g = el("g", { class: "figure", style: `--i:${i}` }, pos);
    const b = drawFigure(g, fig);
    box = [Math.min(box[0], b[0] + x), Math.min(box[1], b[1]), Math.max(box[2], b[2] + x), 0];
  });

  // Frame the figures tightly so they fill the screen height (width only limits wide groups)
  const [x0, y0, x1] = box;
  const w = x1 - x0, h = -y0;
  svg.setAttribute("viewBox", `${x0} ${-h} ${w} ${h + 12}`);

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
