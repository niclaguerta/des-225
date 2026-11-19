# Match the Silhouette

Website for a playful DES 225 installation: visitors are encouraged to match the silhouettes on the wall.

The page cycles through silhouette scenes (solo figures and small groups) for people to match. The silhouettes are Noun Project icons; see Credits.

## Controls

| Key | Action |
| --- | --- |
| → / ← | Next / previous scene (swipe on touch screens) |
| Space | Pause / resume the timer |
| F | Fullscreen (Esc to exit) |

Each scene lasts 20 seconds. Change `SCENE_SECONDS` at the top of `script.js` to adjust.

## Webcam photo

The last 5 seconds of each scene count down on screen, then the webcam takes a photo (mirrored like a selfie). The photo shows for 4 seconds, then the next scene starts. Change `COUNTDOWN` and `PHOTO_SECONDS` at the top of `script.js` to adjust.

It uses the browser's built-in camera API, so no extra library is needed. The browser asks for camera permission the first time; click Allow. The camera only works on `https://` pages or `localhost`, which includes the GitHub Pages site. If permission is refused or there is no camera, scenes advance without photos. Photos are not saved or uploaded anywhere yet.

## Editing scenes

Scenes live in `scenes.js`. Each scene is a name plus a list of 1–4 icons from `icons.js`:

```js
{ name: "Weekend plans", figures: [{ icon: "hiking" }, { icon: "golf", flip: true }] }
```

Every scene stands on the bottom edge of the screen, so set the screen so its bottom edge meets the floor. Figures in a group are packed as close as they fit; change `GAP` in `script.js` to space them out.

To add another Noun Project icon, copy the `d="…"` value of the SVG's `<path>` into `icons.js` under a new name (circles, ellipses and polygons need converting to path data first). Leave out the "Created by…" text, and add the artist to the credits below. After any change, bump the `?v=` number in `index.html` so browsers load the new files.

## Credits

Silhouette icons by Lewen Design from Noun Project: Skateboarding, Weightlifting, Basketball, Horse Riding, Golf, Hiking, Cycling, Rowing, Fencing, Wrestling, Tug of War, Billiards and Pull-up.

Silhouette icons by Toni Olm from Noun Project: Angler, Drinking Bottle and Taking the Dog for a Walk.

Silhouette icons by Gan Khoon Lay from Noun Project: Haunting and Man Shouting.

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
- `icons.js` — Noun Project silhouette icons
- `scenes.js` — scenes
- `script.js` — draws and packs silhouettes, scene switching, timer, fullscreen
- `assets/background.webp` — background artwork
