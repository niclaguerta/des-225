/*
  POSES — each pose is a set of limb angles in degrees.
    0 = pointing straight down, 90 = pointing right, -90 = pointing left, 180 = straight up.
    l* = limbs on the LEFT of the screen, r* = limbs on the RIGHT.
    UA = upper arm, FA = forearm, Th = thigh, Sh = shin, lean = torso tilt (+ leans right).

  SCENES — each scene is a list of figures.
    pose:  a name from POSES
    x:     horizontal position (optional; figures are spaced evenly if left out)
    flip:  mirror the pose left/right
    lift:  raise the figure off the floor (for jumps)
    tweak: override any angle for this one figure, e.g. { lean: -12 }
    src:   use an image file instead of a drawn pose, e.g. "assets/silhouettes/dancer.svg"
           (pair with h: height in the same units; a standing figure is about 200 tall)
*/

const POSES = {
  stand:    { lUA: -12, lFA: -6,   rUA: 12,  rFA: 6,   lTh: -6,  lSh: -4,  rTh: 6,   rSh: 4 },
  armsUp:   { lUA: -158, lFA: -165, rUA: 158, rFA: 165, lTh: -8,  lSh: -6,  rTh: 8,   rSh: 6 },
  star:     { lUA: -128, lFA: -132, rUA: 128, rFA: 132, lTh: -26, lSh: -26, rTh: 26,  rSh: 26 },
  tpose:    { lUA: -90,  lFA: -90,  rUA: 90,  rFA: 90,  lTh: -8,  lSh: -6,  rTh: 8,   rSh: 6 },
  flamingo: { lUA: -118, lFA: -150, rUA: 118, rFA: 150, lTh: -4,  lSh: -2,  rTh: 82,  rSh: -8 },
  strong:   { lUA: -88,  lFA: -178, rUA: 88,  rFA: 178, lTh: -18, lSh: -14, rTh: 18,  rSh: 14 },
  lunge:    { lUA: -95,  lFA: -95,  rUA: 95,  rFA: 95,  lTh: -42, lSh: -42, rTh: 62,  rSh: 4 },
  point:    { lUA: -32,  lFA: 42,   rUA: 132, rFA: 134, lTh: -10, lSh: -8,  rTh: 10,  rSh: 8 },
  hips:     { lUA: -36,  lFA: 44,   rUA: 36,  rFA: -44, lTh: -14, lSh: -10, rTh: 14,  rSh: 10 },
  wave:     { lUA: -12,  lFA: -6,   rUA: 128, rFA: 172, lTh: -8,  lSh: -6,  rTh: 8,   rSh: 6 },
  teapot:   { lUA: -36,  lFA: 44,   rUA: 118, rFA: 72,  lTh: -8,  lSh: -6,  rTh: 8,   rSh: 6, lean: 12 },
  squat:    { lUA: -92,  lFA: -96,  rUA: 92,  rFA: 96,  lTh: -68, lSh: 6,   rTh: 68,  rSh: -6 },
  dab:      { lUA: 118,  lFA: 62,   rUA: 128, rFA: 128, lTh: -12, lSh: -10, rTh: 12,  rSh: 10, lean: -8 },
  tilt:     { lUA: -150, lFA: -150, rUA: 30,  rFA: 30,  lTh: -12, lSh: -10, rTh: 10,  rSh: 8, lean: 22 },
};

const SCENES = [
  { name: "Reach for the sky", figures: [{ pose: "armsUp" }] },
  { name: "Superstar",         figures: [{ pose: "star" }] },
  { name: "Flamingo",          figures: [{ pose: "flamingo" }] },
  { name: "Show your muscles", figures: [{ pose: "strong" }] },
  { name: "Mirror, mirror", figures: [
      { pose: "point", x: -75 },
      { pose: "point", x: 75, flip: true },
  ]},
  { name: "High five", figures: [
      { pose: "wave", x: -50 },
      { pose: "wave", x: 50, flip: true },
  ]},
  { name: "Teapot & friend", figures: [
      { pose: "teapot", x: -70 },
      { pose: "hips", x: 80 },
  ]},
  { name: "Back to back", figures: [
      { pose: "lunge", x: -55, flip: true },
      { pose: "lunge", x: 55 },
  ]},
  { name: "Human pyramid", figures: [
      { pose: "tilt", x: -120, flip: true },
      { pose: "armsUp", x: 0 },
      { pose: "tilt", x: 120 },
  ]},
  { name: "Jump squad", figures: [
      { pose: "star", lift: 30 },
      { pose: "squat" },
      { pose: "star", lift: 30 },
  ]},
  { name: "Chorus line", figures: [
      { pose: "flamingo" },
      { pose: "flamingo", flip: true },
      { pose: "flamingo" },
      { pose: "flamingo", flip: true },
  ]},
  { name: "The wave", figures: [
      { pose: "squat" },
      { pose: "stand" },
      { pose: "wave" },
      { pose: "armsUp" },
  ]},
  { name: "Dance party", figures: [
      { pose: "dab" },
      { pose: "star", lift: 20 },
      { pose: "dab", flip: true },
      { pose: "strong" },
  ]},
];
