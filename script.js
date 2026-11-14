/* ============================================================
   Scenes: draw silhouettes, switch with ← →, auto-advance timer
   ============================================================ */
const SCENE_SECONDS = 30;

const SVG_NS = "http://www.w3.org/2000/svg";
const LEN = { torso: 62, shoulder: 54, ua: 34, fa: 32, th: 46, sh: 46, head: 17 };
const WIDTH = { torso: 34, shoulders: 20, hips: 26, arm: 14, leg: 17 };
const GAP = 4; // space between neighbouring figures in a group (0 = hands touching)

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

function el(tag, attrs, parent) {
  const n = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

// Joint positions for a pose, with the hip at (0, 0). Grounding and mirroring happen later.
function skeleton(pose) {
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

  return { hip, neck, lS, rS, lH, rH, lE, lHand, rE, rHand, lK, lF, rK, rF, head };
}

/* ---------- Shapes: everything is built from thick lines, discs and rings ---------- */
const seg = (pts, w) => ({ k: "seg", pts, w });
const disc = (c, r) => ({ k: "disc", c, r });
const ring = (c, r, w) => ({ k: "ring", c, r, w });

function bodyShapes(p, pose) {
  const shapes = [
    seg([p.lH, p.lK, p.lF], WIDTH.leg),
    seg([p.rH, p.rK, p.rF], WIDTH.leg),
    seg([p.lH, p.rH], WIDTH.hips),
    seg([p.hip, p.neck], WIDTH.torso),
    seg([p.lS, p.rS], WIDTH.shoulders),
    seg([p.lS, p.lE, p.lHand], WIDTH.arm),
    seg([p.rS, p.rE, p.rHand], WIDTH.arm),
    disc(p.head, LEN.head),
  ];
  if (pose.cast === "r") shapes.push(seg([p.rK, p.rF], 26)); // leg in a cast
  if (pose.cast === "l") shapes.push(seg([p.lK, p.lF], 26));
  return shapes;
}

// Bottom of a foot (where the floor is for a standing pose)
const footY = (f) => f[1] + WIDTH.leg / 2;

/* Mobility aids and seats. Seated / side-view poses face right; use flip to face left. */
const PROPS = {
  wheelchair() {
    const hub = [-6, 18], R = 38;
    const floor = hub[1] + R + 3.5;
    const caster = [46, floor - 7];
    return [
      ring(hub, R, 7), disc(hub, 6),                   // big wheel
      seg([[-16, 4], [34, 4]], 6),                     // seat
      seg([[-16, 4], [-20, -48], [-34, -50]], 6),      // backrest + push handle
      seg([[34, 4], caster], 5),                       // front frame
      seg([[32, 50], [50, 50]], 5),                    // footrest
      disc(caster, 7),                                 // front caster
    ];
  },
  chair(p) {
    const y = Math.max(footY(p.lF), footY(p.rF)) - 3;
    return [
      seg([[-18, 6], [36, 6]], 8),                     // seat
      seg([[-18, 6], [-21, -52]], 7),                  // back
      seg([[-16, 6], [-16, y]], 6),                    // back leg
      seg([[32, 6], [32, y]], 6),                      // front leg
    ];
  },
  cane(p) {
    const h = p.rHand, y = footY(p.lF) - 3;
    return [seg([[h[0] - 9, h[1] - 2], [h[0] + 2, h[1] - 2], [h[0] + 6, y]], 6)];
  },
  crutches(p) {
    const y = footY(p.lF) - 3;
    const crutch = (s, hand, side) => {
      const top = [s[0] - side * 12, s[1] + 16]; // under the armpit
      const t = (y - top[1]) / (hand[1] - top[1]);
      const bottom = [top[0] + (hand[0] - top[0]) * t, y];
      return [
        seg([top, bottom], 6),
        seg([[top[0] - 8, top[1]], [top[0] + 8, top[1]]], 7),     // underarm pad
        seg([[hand[0] - 6, hand[1]], [hand[0] + 6, hand[1]]], 6), // hand grip
      ];
    };
    return [...crutch(p.lS, p.lHand, 1), ...crutch(p.rS, p.rHand, -1)];
  },
  kneeScooter(p) {
    const y = footY(p.lF);
    const deck = p.rK[1] + 16;
    const h = p.rHand;
    return [
      seg([[p.rF[0] - 6, deck], [p.rK[0] + 8, deck]], 8),  // knee platform
      seg([[-12, deck], [-12, y - 14]], 6),                // post
      seg([[-34, y - 14], [66, y - 14]], 6),               // base
      seg([[62, y - 14], [h[0] - 2, h[1]]], 6),            // steering stem
      seg([[h[0] - 8, h[1] - 2], [h[0] + 6, h[1] - 4]], 6), // handlebar
      disc([-30, y - 9], 9), disc([62, y - 9], 9),         // wheels
    ];
  },
  walker(p) {
    const y = Math.max(footY(p.lF), footY(p.rF));
    const h = p.rHand;
    const front = [h[0] + 16, y - 8], back = [h[0] - 18, y - 8];
    return [
      seg([[h[0] - 8, h[1]], [h[0] + 6, h[1]]], 7),        // handle
      seg([h, front], 6), seg([h, back], 6),               // frame
      seg([[h[0] - 9, h[1] + 50], [h[0] + 8, h[1] + 50]], 5), // brace
      disc(front, 8), disc(back, 8),                       // wheels
    ];
  },
};

/* ---------- Geometry helpers ---------- */
// Call fn(x, y, r) for points along every shape (used for bounds and packing)
function sample(shapes, fn) {
  for (const s of shapes) {
    if (s.k === "seg") {
      for (let i = 0; i < s.pts.length - 1; i++) {
        const [a, b] = [s.pts[i], s.pts[i + 1]];
        const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3));
        for (let j = 0; j <= steps; j++) {
          fn(a[0] + ((b[0] - a[0]) * j) / steps, a[1] + ((b[1] - a[1]) * j) / steps, s.w / 2);
        }
      }
    } else if (s.k === "disc") {
      fn(s.c[0], s.c[1], s.r);
    } else if (s.k === "ring") {
      for (let a = 0; a < 360; a += 6) {
        const d = dir(a);
        fn(s.c[0] + d[0] * s.r, s.c[1] + d[1] * s.r, s.w / 2);
      }
    } else if (s.k === "image") {
      for (let y = s.y; y <= s.y + s.h; y += 3) fn(s.x + s.w / 2, y, s.w / 2);
    }
  }
}

function mapPoints(shapes, f) {
  return shapes.map((s) => {
    if (s.k === "seg") return { ...s, pts: s.pts.map(f) };
    if (s.k === "image") {
      const [x, y] = f([s.x, s.y]), [x2] = f([s.x + s.w, s.y]);
      return { ...s, x: Math.min(x, x2), y };
    }
    return { ...s, c: f(s.c) };
  });
}

// Build a figure's shapes, standing on y = 0 (lift raises it for jumps)
function figureShapes(fig) {
  let shapes;
  if (fig.src) {
    const h = fig.h || 200, w = fig.w || h;
    shapes = [{ k: "image", href: fig.src, x: -w / 2, y: -h, w, h }];
  } else {
    const pose = Object.assign({}, POSES[fig.pose], fig.tweak);
    const p = skeleton(pose);
    shapes = bodyShapes(p, pose);
    if (pose.prop) shapes.push(...PROPS[pose.prop](p));
  }
  let floor = -Infinity;
  sample(shapes, (x, y, r) => { floor = Math.max(floor, y + r); });
  const sx = fig.flip ? -1 : 1;
  return mapPoints(shapes, (q) => [sx * q[0], q[1] - floor - (fig.lift || 0)]);
}

// Horizontal extent of a figure in thin height bands, so neighbours can tuck together
const BAND = 6;
function profileOf(shapes) {
  const bands = new Map();
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity;
  sample(shapes, (x, y, r) => {
    x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); y0 = Math.min(y0, y - r);
    for (let b = Math.floor((y - r) / BAND); b <= Math.floor((y + r) / BAND); b++) {
      const e = bands.get(b);
      if (e) { e[0] = Math.min(e[0], x - r); e[1] = Math.max(e[1], x + r); }
      else bands.set(b, [x - r, x + r]);
    }
  });
  return { bands, x0, x1, y0 };
}

function drawShapes(g, shapes) {
  for (const s of shapes) {
    if (s.k === "seg") {
      el("path", { class: "limb", d: "M" + s.pts.map((q) => q.join(" ")).join("L"), "stroke-width": s.w }, g);
    } else if (s.k === "disc") {
      el("circle", { cx: s.c[0], cy: s.c[1], r: s.r }, g);
    } else if (s.k === "ring") {
      el("circle", { class: "limb", cx: s.c[0], cy: s.c[1], r: s.r, "stroke-width": s.w }, g);
    } else if (s.k === "image") {
      el("image", { href: s.href, x: s.x, y: s.y, width: s.w, height: s.h }, g);
    }
  }
}

function renderScene(scene) {
  const svg = el("svg", { role: "img", "aria-label": scene.name, preserveAspectRatio: "xMidYMax meet" });
  const shadows = el("g", {}, svg);

  // Slide each figure right up against the ones already placed (GAP apart at the closest
  // height), so arms and props at different heights can tuck past each other.
  const sky = new Map(); // band -> rightmost x so far
  const placed = scene.figures.map((fig) => {
    const shapes = figureShapes(fig);
    const prof = profileOf(shapes);
    let x = fig.x;
    if (x === undefined) {
      x = sky.size ? -Infinity : 0;
      for (const [b, [lo]] of prof.bands) {
        if (sky.has(b)) x = Math.max(x, sky.get(b) - lo + GAP);
      }
      if (x === -Infinity) x = Math.max(...sky.values()) - prof.x0 + GAP;
    }
    for (const [b, [, hi]] of prof.bands) sky.set(b, Math.max(sky.get(b) ?? -Infinity, hi + x));
    return { shapes, prof, x };
  });

  // Centre the group and frame it tightly so it fills the screen height
  const x0 = Math.min(...placed.map((f) => f.prof.x0 + f.x));
  const x1 = Math.max(...placed.map((f) => f.prof.x1 + f.x));
  const y0 = Math.min(...placed.map((f) => f.prof.y0));
  const shift = -(x0 + x1) / 2;

  placed.forEach(({ shapes, prof, x }, i) => {
    const cx = x + shift;
    const half = (prof.x1 - prof.x0) / 2;
    el("ellipse", { class: "floor-shadow", cx: cx + (prof.x0 + prof.x1) / 2, cy: 4, rx: Math.max(40, half * 0.9), ry: 7 }, shadows);
    // Outer group positions the figure; inner group animates (a CSS transform would override the position)
    const pos = el("g", { transform: `translate(${cx} 0)` }, svg);
    drawShapes(el("g", { class: "figure", style: `--i:${i}` }, pos), shapes);
  });

  const w = x1 - x0, h = -y0;
  svg.setAttribute("viewBox", `${-w / 2} ${-h} ${w} ${h + 12}`);
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
