/*
  SCENES — each scene is a name (read aloud by screen readers) and a list of 1–4 figures.
    icon:  a name from icons.js
    flip:  mirror the icon left/right
    h:     height (optional; default 210). Figures in one scene share the same floor.
    floor: where the floor is, in the icon's own units (0 = top of the original icon, about 95 =
           bottom). Use it to stand a figure on the bottom edge and let the rest go off screen.
  Figures in a group are packed side by side, as close as they fit.
*/

const SCENES = [
  { name: "Skate",          figures: [{ icon: "skateboarding" }] },
  { name: "Lift",           figures: [{ icon: "weightlifting" }] },
  { name: "Hoops",          figures: [{ icon: "basketball" }] },
  { name: "Saddle up",      figures: [{ icon: "horseRiding", floor: 61.4 }] },
  { name: "Fore!",          figures: [{ icon: "golf" }] },
  { name: "Pedal",          figures: [{ icon: "cycling" }] },
  { name: "Row, row, row",  figures: [{ icon: "rowing" }] },
  { name: "Hit the trail",  figures: [{ icon: "hiking" }] },
  { name: "Pull-up",        figures: [{ icon: "pullUp" }] },
  { name: "En garde",       figures: [{ icon: "fencing" }] },
  { name: "Wrestle",        figures: [{ icon: "wrestling" }] },
  { name: "Tug of war",     figures: [{ icon: "tugOfWar" }] },
  { name: "Corner pocket",  figures: [{ icon: "billiards" }] },
  { name: "Gym buddies", figures: [
      { icon: "weightlifting" },
      { icon: "pullUp" },
  ]},
  { name: "Weekend plans", figures: [
      { icon: "hiking" },
      { icon: "golf", flip: true },
  ]},
  { name: "Street crew", figures: [
      { icon: "skateboarding" },
      { icon: "basketball", flip: true },
  ]},
];
