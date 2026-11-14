# Match the Silhouette

Website for a playful DES 225 installation: visitors are encouraged to match the silhouettes on the wall.

Currently a **Coming Soon** page that cycles through silhouette scenes (solo poses and groups of 2–4) for people to match. Scenes are designed to be inclusive: some figures sit (wheelchair, chair) or use mobility aids (cane, crutches with a leg cast, knee scooter, walker), mixed in with standing poses.

## Controls

| Key | Action |
| --- | --- |
| → / ← | Next / previous scene (swipe on touch screens) |
| Space | Pause / resume the 30-second timer |
| F | Fullscreen (Esc to exit) |

Each scene auto-advances after 30 seconds. Change `SCENE_SECONDS` at the top of `script.js` to adjust.

## Editing scenes

Scenes live in `scenes.js`. Each scene is a name plus a list of figures that use a pose from `POSES`. Poses can include a `prop` (wheelchair, chair, cane, crutches, kneeScooter, walker) and a `cast` on one leg. Figures in a group are packed as close as they can get without touching; change `GAP` in `script.js` to space them out. You can also use an image instead of a drawn pose, for example an SVG downloaded from the Noun Project:

```js
{ name: "Ballerina", figures: [{ src: "assets/silhouettes/ballerina.svg", h: 220 }] }
```

Remember to credit Noun Project icons as their license requires.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Fullscreen

Click the button in the bottom-right corner or press **F**. While fullscreen, the button and cursor hide after a few seconds of no movement.

## Files

- `index.html` — page markup
- `style.css` — styles
- `scenes.js` — poses and scenes
- `script.js` — draws silhouettes, scene switching, timer, fullscreen
- `assets/background.webp` — background artwork
