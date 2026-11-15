# NORDVENT v16 — Compact Status Dock & Micro-Transitions

NORDVENT is a browser-based smart-building MCU **design simulation** for a fixed 800 × 480 logical screen. No connected devices, QML, commercial MCU license, or safety-rated controller are included.

## What's new

- **Unified icon-only global status dock:** 3 buttons on the upper-right building area; no visible labels or enclosing container border. Each has a 44 × 44 px touch target and 22 px custom SVG icon.
  - **Door:** closed lock icon in green while locked; open lock icon in amber when unlocked. Tapping opens the original confirmation dialog.
  - **Alarm:** neutral shield when disarmed, green shield when armed. Tapping opens the original confirmation dialog.
  - **System health:** green for healthy, amber for service warnings, red for critical simulated alerts. Tapping opens the original health popup.
  - Accessible names and desktop tooltips retain the full text status for icon-only controls.
- **Page micro-transitions:** a 190 ms opacity and 8 px sideways entrance animation affects only new controller content. The building image, SVG FX, header and navigation are not translated. Motion OFF and system reduced-motion preferences disable the transition.
- **Home panel:** dark navy translucent gradient (approx. 73–88% opacity) replaces the opaque slab. No expensive backdrop filter is used on Home. Other panels remain more solid for touch/readability.

## Run

1. Open `NORDVENT_Standalone.html` directly in a modern browser (all assets and frame sequence are embedded; no internet required).
2. Source build: `python build_standalone.py`.
3. Tests: `python tests/test_v15.py` and `python tests/test_v16.py` with Playwright and Chromium at `/usr/bin/chromium`.
4. Optional C++17 reference-core smoke test: `cmake -S core -B core/build && cmake --build core/build && ctest --test-dir core/build`.

## Verification

- **65/65 inherited v15 browser checks passed**.
- **33/33 v16-specific checks passed**: touch-target dimensions, label accessibility, lock/alarm confirmation and visual states, health popup and critical warnings, page-transition class, motion-off behavior, scaling and zero page scroll.
- **C++ reference-core CTest passed**. The core is intentionally independent and does **not** implement the new JavaScript/UI features.

## Design limitations

Not a safety-rated, hardware-connected smart-home controller. Sensors, alarms, locks, valves, modes and animations are simulated. CSS transitions and image-sequence playback demonstrate intended UI behavior; MCU firmware implementations must profile memory, decode, refresh and timing on the actual target hardware.
