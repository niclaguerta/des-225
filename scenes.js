/*
  POSES — each pose is a set of limb angles in degrees.
    0 = pointing straight down, 90 = pointing right, -90 = pointing left, 180 = straight up.
    l* = limbs on the LEFT of the screen, r* = limbs on the RIGHT.
    UA = upper arm, FA = forearm, Th = thigh, Sh = shin, lean = torso tilt (+ leans right).
    prop:  a seat or mobility aid drawn with the figure: wheelchair, chair, cane, crutches,
           kneeScooter, walker (seated and side-view poses face right; flip to face left).
    cast:  "l" or "r" draws a cast on that leg.

  SCENES — each scene is a list of figures.
    pose:  a name from POSES
    x:     horizontal position (optional; if left out, figures are packed side by side)
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

  // Seated
  wheelchair:     { prop: "wheelchair", lUA: 15,  lFA: 50,  rUA: 15,  rFA: 50,  lTh: 88, lSh: 2, rTh: 86, rSh: 4 },
  wheelchairWave: { prop: "wheelchair", lUA: 15,  lFA: 50,  rUA: 140, rFA: 170, lTh: 88, lSh: 2, rTh: 86, rSh: 4 },
  wheelchairUp:   { prop: "wheelchair", lUA: 165, lFA: 172, rUA: 155, rFA: 165, lTh: 88, lSh: 2, rTh: 86, rSh: 4 },
  sitChair:       { prop: "chair", lUA: 20,   lFA: 75,   rUA: 25,  rFA: 80,  lTh: 88, lSh: 2, rTh: 86, rSh: 4 },
  sitChairStar:   { prop: "chair", lUA: -130, lFA: -135, rUA: 130, rFA: 135, lTh: 88, lSh: 2, rTh: 86, rSh: 4 },

  // Standing with mobility aids
  cane:        { prop: "cane", lUA: -12,  lFA: -6,   rUA: 25, rFA: 15, lTh: -6, lSh: -4, rTh: 8, rSh: 6, lean: 4 },
  caneWave:    { prop: "cane", lUA: -130, lFA: -170, rUA: 25, rFA: 15, lTh: -6, lSh: -4, rTh: 8, rSh: 6, lean: 4 },
  crutches:    { prop: "crutches", cast: "r", lUA: -26, lFA: -16, rUA: 26, rFA: 16, lTh: -4, lSh: -2, rTh: 48, rSh: 22 },
  kneeScooter: { prop: "kneeScooter", cast: "r", lean: 8, lUA: 40, lFA: 50, rUA: 40, rFA: 50, lTh: 2, lSh: 0, rTh: 25, rSh: -90 },
  walker:      { prop: "walker", lean: 10, lUA: 30, lFA: 40, rUA: 30, rFA: 40, lTh: -6, lSh: -4, rTh: 10, rSh: 6 },
};

const SCENES = [
  { name: "Reach for the sky", figures: [{ pose: "armsUp" }] },
  { name: "Wheelie wave",      figures: [{ pose: "wheelchairWave" }] },
  { name: "Superstar",         figures: [{ pose: "star" }] },
  { name: "Take a seat",       figures: [{ pose: "sitChairStar" }] },
  { name: "Flamingo",          figures: [{ pose: "flamingo" }] },
  { name: "Cane & wave",       figures: [{ pose: "caneWave" }] },
  { name: "Scoot!",            figures: [{ pose: "kneeScooter" }] },
  { name: "Show your muscles", figures: [{ pose: "strong" }] },
  { name: "Crutch champ",      figures: [{ pose: "crutches" }] },
  { name: "High five", figures: [
      { pose: "wave", x: -50 },
      { pose: "wave", x: 50, flip: true },
  ]},
  { name: "Hello, neighbour", figures: [
      { pose: "wheelchairWave" },
      { pose: "wave", flip: true },
  ]},
  { name: "Mirror, mirror", figures: [
      { pose: "point" },
      { pose: "point", flip: true },
  ]},
  { name: "Teapot & friend", figures: [
      { pose: "teapot" },
      { pose: "sitChair", flip: true },
  ]},
  { name: "Back to back", figures: [
      { pose: "lunge", flip: true },
      { pose: "lunge" },
  ]},
  { name: "Human pyramid", figures: [
      { pose: "tilt", flip: true },
      { pose: "wheelchairUp" },
      { pose: "tilt" },
  ]},
  { name: "Jump squad", figures: [
      { pose: "star", lift: 30 },
      { pose: "squat" },
      { pose: "star", lift: 30 },
  ]},
  { name: "Walk this way", figures: [
      { pose: "walker" },
      { pose: "cane" },
      { pose: "kneeScooter" },
  ]},
  { name: "Chorus line", figures: [
      { pose: "flamingo" },
      { pose: "crutches" },
      { pose: "flamingo", flip: true },
      { pose: "sitChairStar" },
  ]},
  { name: "The wave", figures: [
      { pose: "squat" },
      { pose: "sitChair" },
      { pose: "wave" },
      { pose: "armsUp" },
  ]},
  { name: "Dance party", figures: [
      { pose: "dab" },
      { pose: "wheelchairWave" },
      { pose: "star", lift: 20 },
      { pose: "caneWave", flip: true },
  ]},
];
