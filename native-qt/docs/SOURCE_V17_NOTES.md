# NORDVENT v17 — Contextual Camera Reframing

This is a **fixed 800 × 480 HTML/CSS/JavaScript engineering prototype**, not MCU firmware. It uses the original 15-frame building image sequence, existing independent lighting/blinds/temperature and HVAC FX, and the C++17 reference core. No QML code is generated.

## What's new

A small, preset-driven camera drift is triggered by bottom-menu navigation or room selection. It is a two-dimensional **translate + scale**, not a 3D camera or perspective warp. The full architectural scene is one element (`#art`), ensuring frame playback, lighting overlays, window blinds, heat/hot-water circuits, room temperature masks, fan animation, fault markers, and room highlights move together. Interactive control panels and the top-right three-icon status dock remain anchored to the 800 × 480 screen.

The image transform takes 320 ms using a gentle ease-out, with maximum menu zoom of 2.5% and maximum selected-room zoom of 7.6%. Home keeps the neutral framing. The page panel entrance animation remains 190 ms. `More → FX → Motion` switches off both transitions and contextual camera offsets; OS-level reduced-motion preference is also respected. Camera changes run **only when the target preset changes**, not during continuous frame playback.

| View | X (px) | Y (px) | Scale |
|---|---:|---:|---:|
| Home | 0 | 0 | 1.000 |
| Rooms | -7 | +1 | 1.014 |
| Climate (roof bias) | -6 | +7 | 1.025 |
| Energy (utility bias) | -10 | -7 | 1.025 |
| Routines | -1 | 0 | 1.006 |
| More | -6 | -3 | 1.010 |
| Bedroom selected | -26 | +13 | 1.074 |
| Living Room selected | -25 | +2 | 1.068 |
| Kitchen selected | -25 | -12 | 1.071 |
| Utility selected | -31 | -12 | 1.076 |

### Where to edit

- `app.js`: `CAMERA_PRESETS` and `updateCameraFrame()`; update is called by the existing `updateEffects()` state-render path.
- `v17.css`: unified `#art` transform and reduced-motion styles. This CSS file is included last, after earlier styles, so legacy zoom overrides do not split layers.
- `index.html`: the added `v17.css` link.
- `build_standalone.py`: embeds `v17.css` along with every prior source and raster asset into one offline HTML file.

## Tests

- `python tests/test_v17_camera.py` — 40 camera-specific assertions covering all menu presets and room presets, preserved frame/FX alignment, anchored status dock, no scroll, motion off, no errors and scaled viewport.
- `python tests/test_v16.py` — 33 inherited status/transition checks.
- `python tests/test_v15.py` — 65 inherited interface and system-interaction checks.

All tests are browser simulations. Real embedded hardware performance, RAM and decoding constraints are **not validated** here. For MCU deployment, camera presets may be ported to inexpensive pre-rendered crops or 2D raster translations rather than using browser CSS rendering.
