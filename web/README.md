# NORDVENT v16 — Status Dock + Micro-Transitions

See [README_V16.md](README_V16.md) for the current changes, build instructions and verification. All earlier v15 features remain in the application.

---

# NORDVENT v15 — Spatial Climate & Energy Controls

A premium, fixed **800 × 480** smart-building controller **design simulation**. Includes HTML/CSS/JavaScript/SVG UI, 15 user-supplied animated house frames, realistic light overlays and an *independent* C++17 reference core for later MCU work. **No QML or real equipment connection is provided.**

## Run

- Open `NORDVENT_Standalone.html` in a modern browser (all UI assets and 15 optimized WebP playback frames embedded, no server required).
- Or run `python -m http.server 8000` inside the source directory and visit `http://localhost:8000/` to inspect/edit component files.
- Build the standalone HTML from current sources: `python build_standalone.py`.
- Browser checks: `python tests/test_v14.py` (requires Playwright and Chromium at `/usr/bin/chromium`).
- C++ reference tests: `cmake -S core -B build-core && cmake --build build-core && ctest --test-dir build-core`.

## What is new

### FX: coherent color + intensity language

- **Ventilation cyan**: Eco is sparse, slow and dim; Auto is moderate; Manual reveals the airflow slider and changes brightness, spacing and speed; Boost runs brighter near-white cyan with dense animated particles, brighter outlet jets and a brief activation surge. A simulated air-quality override increases flow to 280 m³/h when high readings are triggered, if Air quality auto is enabled (unless Manual or Boost takes priority).
- **Heating amber**: independently controlled space-heating circuit along utility equipment and kitchen floor.
- **Domestic hot water blue**: separate blue circuit around the hot-water cylinder. The circuit responds independently to Hot water ON/OFF and a confirmed water shutoff. The water valve is a simulation, not a physical device.
- **Heat-pump defrost icy blue**: temporary defrost indication at rooftop equipment and pause of the decorative heating circuit; heating system state remains saved.
- **Security FX**: brief acknowledgment ring on confirmed Lock/Unlock and Arm/Disarm. An armed state is green; unlocked is amber. A *triggered* simulated smoke/CO event has a separate high-priority red alert marker; never confuse armed with triggered.
- Motion OFF pauses continuous UI animation and built-in frame playback.

### New fault/system-health layer

The building has a small **Systems OK / n alerts** button at the top right. Tap it for **More → Health**, alerts, simulated water shutoff and diagnostics. Markers are attached to equipment/room coordinates in the same 800×352 SVG space as the animated house (not to the entire viewport).

**More → Tests** includes ten compact scenario buttons for: water leak, air-quality test, smoke/CO, frost, open window, dirty air filter, stale/offline sensor, heat pump defrost, heat-pump fault and peak electricity tariff. Air-quality test cycles through **CO₂ → PM2.5 → VOC → restored** on successive taps. The test toggles do not connect to actual sensors.

- Leak in Utility: prominent red alert, location marker, confirmed water-valve shutoff action; blue domestic water animation stops when the valve is shut.
- Smoke/CO in Kitchen: red critical indicator. This is an *illustrative scenario* and not a replacement for certified detectors or life-safety systems.
- Air quality: simulated CO₂/PM2.5/VOC values; IAQ override increases ventilation while automation is enabled. Manual override remains manual.
- Frost risk: utility marker and warning, with no unsafe automatic setpoint changes.
- Open window in Living: window marker and heat-loss reminder.
- Filter, heat-pump service and stale sensor warnings: summarized in Health. Sensor readings show **unavailable / stale** rather than pretending to remain fresh when the offline test is active.
- Peak tariff: informational demo state on Energy; does not claim live energy-price information.

### Preserved and verified from v13.4

- Home, Rooms, Climate, Energy, Routines, More and room focus remain fixed **800 × 480**, with no document scrolling.
- One-column original room illustrations, in-place direct room switching with arrows and four mini room buttons.
- Light overlays from v13.2 remain brighter when on; fresh Home defaults: Living Room and Kitchen lights on, Bedroom and Living Room blinds open.
- Distinct Home / Night / Away lighting/blind states; building-specific mode shadows.
- Lock/Alarm floating controls over the house, freeing the mode selector in the header. Confirmations before simulated security changes.
- Room-specific lights, blinds and temperatures; optional imported frame sequences or video; original user-supplied animation plays on its own.

## Verification

- `tests/test_v14.py`: **49/49** targeted browser assertions passed (FX, critical faults, IAQ override, water valve, room/mode/security behavior, and no-scroll layouts).
- C++17 reference core: CTest suite passed, **not wired to new JS v14 fault states**.
- Human visual check of Home, Eco, Boost, Energy, leak and Health screenshots in `screenshots/`.

## Engineering limitations

This is **not safety-rated control software**. No alarm, sensor, actuator, safety interlock, valve, heat-pump driver, cloud link or tariff service is connected. All telemetry and fault states are simulated. The 800×480 HTML and browser-based PNG/WebP frame decode are demonstration targets only; converting to real MCU firmware would require rendering/storage profiling, asset optimization, hardware acknowledgements, offline persistence, watchdogs, sensor validation, safety approvals and integration testing. The bundled C++17 reference core has not been extended for new fault/IAQ/valve state behavior.


## v15 spatial control layout
- **Climate:** Operating airflow, Eco/Auto/Manual mode selector and active automatic override are displayed on the building-side HUD; the left control dock contains enlarged Fan, Heat recovery, Air quality auto and Boost actions. Manual alone reveals a setpoint slider beneath the toggles. The 800×480 fixed display continues to use the existing FX and security controls.
- **Energy:** Estimated power, heating and hot-water states, and a compact load-distribution strip are on the building; enlarged Heating, Hot water and confirmed Water valve controls are in the left dock. Heat-pump state and System health remain accessible.
- System values are **simulated**, not connected to measured building telemetry or actual equipment.

## v15 verification

- Run `python tests/test_v15.py` after `python build_standalone.py` (Playwright/Chromium required).
- **65/65 browser checks passed**: operating-mode selection, live manual slider and Boost states, visual FX status, heating/hot-water/valve state isolation, system health, room cycling, security confirmations, all six non-scrolling fixed 800×480 screens, click-target dimensions and overlay collision checks.
- The unchanged C++17 reference core compiled and passed its single CTest test target. These new spatial controls remain HTML/CSS/JS and are **not** ported to Qt/MCU firmware.
- `tests/capture_v15_clean.py` exports overview screenshots from the tested standalone version.
