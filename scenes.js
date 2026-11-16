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
    icon:  use a Noun Project icon from icons.js instead of a drawn pose, e.g. "basketball"
    h:     an icon's height (default 210, about the same as a drawn standing figure)
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

// Noun Project icons (icons.js) plus the drawn seated and mobility-aid figures, which have no icon match
const SCENES = [
  { name: "Skate",          figures: [{ icon: "skateboarding" }] },
  { name: "Wheelie wave",   figures: [{ pose: "wheelchairWave" }] },
  { name: "Lift",           figures: [{ icon: "weightlifting" }] },
  { name: "Hoops",          figures: [{ icon: "basketball" }] },
  { name: "Cane & wave",    figures: [{ pose: "caneWave" }] },
  { name: "Saddle up",      figures: [{ icon: "horseRiding" }] },
  { name: "Pedal",          figures: [{ icon: "cycling" }] },
  { name: "Scoot!",         figures: [{ pose: "kneeScooter" }] },
  { name: "Row, row, row",  figures: [{ icon: "rowing" }] },
  { name: "Pull-up",        figures: [{ icon: "pullUp" }] },
  { name: "Crutch champ",   figures: [{ pose: "crutches" }] },
  { name: "En garde",       figures: [{ icon: "fencing" }] },
  { name: "Take a seat",    figures: [{ pose: "sitChairStar" }] },
  { name: "Wrestle",        figures: [{ icon: "wrestling" }] },
  { name: "Tug of war",     figures: [{ icon: "tugOfWar" }] },
  { name: "Corner pocket",  figures: [{ icon: "billiards" }] },
  { name: "Gym buddies", figures: [
      { icon: "weightlifting" },
      { pose: "wheelchairUp" },
      { icon: "pullUp" },
  ]},
  { name: "Pickup game", figures: [
      { icon: "basketball" },
      { pose: "wheelchairWave", flip: true },
  ]},
  { name: "Street crew", figures: [
      { icon: "skateboarding" },
      { pose: "caneWave" },
      { icon: "cycling", flip: true },
  ]},
  { name: "Walk this way", figures: [
      { pose: "walker" },
      { pose: "cane" },
      { pose: "kneeScooter" },
  ]},
];
