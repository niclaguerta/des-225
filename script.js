// Fullscreen toggle: click the button or press "F". Esc exits (browser default).
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

btn.addEventListener("click", toggleFullscreen);
document.addEventListener("keydown", (e) => {
  if ((e.key === "f" || e.key === "F") && !e.metaKey && !e.ctrlKey && !e.altKey) toggleFullscreen();
});
document.addEventListener("fullscreenchange", syncState);
document.addEventListener("webkitfullscreenchange", syncState);

// Hide button + cursor after 2.5s of no mouse movement (only while fullscreen)
let idleTimer;
function wake() {
  document.body.classList.remove("idle");
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => document.body.classList.add("idle"), 2500);
}
["mousemove", "touchstart", "keydown"].forEach((ev) => document.addEventListener(ev, wake));
wake();

// Hide the button entirely on browsers without fullscreen support (e.g. iPhone Safari)
if (!(root.requestFullscreen || root.webkitRequestFullscreen)) btn.hidden = true;
