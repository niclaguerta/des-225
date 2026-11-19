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

The last 5 seconds of each scene count down on screen with a camera badge, and a live, mirrored camera preview appears in the top-right corner so people can line up. Then the webcam takes a photo (mirrored like a selfie). The photo shows for 6 seconds, then the next scene starts. Change `COUNTDOWN` and `PHOTO_SECONDS` at the top of `script.js` to adjust.

It uses the browser's built-in camera API, so no extra library is needed. It always picks the laptop's built-in camera (FaceTime HD) over an iPhone or other camera, if one is there. The browser asks for camera permission the first time; click Allow. The camera only works on `https://` pages or `localhost`, which includes the GitHub Pages site. If permission is refused or there is no camera, scenes advance without photos. ## Photo gallery

Every photo is saved in the browser on the laptop running the installation. To see them, open `gallery.html` (https://niclaguerta.github.io/des-225/gallery.html) **on the same laptop, in the same browser**. From there you can download one photo or all of them as a .zip, or delete them.

- Photos never leave the laptop; nothing is uploaded.
- They stay until you delete them or clear the browser's site data, so download a .zip after the exhibition.
- Use Chrome for the installation. Safari can clear a site's saved data after a week of not visiting it.
- The gallery updates by itself if it's open in another tab while the installation runs.

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

## Auto-update

Once a minute, the installation checks whether a newer version is live (a higher `?v=` number in `index.html`). If there is one, it reloads itself at the next scene change and carries on from there, so a laptop left running always ends up on the latest version. This is why it matters to bump `?v=` with every change.

A reload exits fullscreen started with the button or **F**, so in that mode the update waits until you leave fullscreen. To get updates even while full screen, use Chrome's own full screen instead: **View → Enter Full Screen** (Cmd+Ctrl+F), which stays on through reloads.

## Fullscreen

Click the button in the bottom-right corner or press **F**. While fullscreen, the button and cursor hide after a few seconds of no movement.

## Files

- `index.html` — page markup
- `style.css` — styles
- `icons.js` — Noun Project silhouette icons
- `scenes.js` — scenes
- `script.js` — draws and packs silhouettes, scene switching, timer, webcam photo, fullscreen
- `photos-db.js` — saves photos in the browser (shared with the gallery)
- `gallery.html` — view, download and delete saved photos
- `assets/background.webp` — background artwork
