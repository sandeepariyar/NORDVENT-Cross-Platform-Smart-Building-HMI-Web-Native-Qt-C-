## v17.1 — Fan / Blinds / Routed Dots correction (2026-11-12)

The v17 layout and native C++ backend remain unchanged. The CMake project now also syncs QML and PNG files on every Build, even if no C++ source was recompiled. This update fixes three native visual behaviors:

* **Real folding vertical blinds:** new `NvVerticalBlinds.qml` repeats one small `4×72` slat PNG across original v17 front glazing; opening stacks the slats at the left, closing spreads them across the opening, and 50% creates an intermediate folded state. All state changes animate through 470 ms when Motion is on.
* **Rotating rooftop fan:** the original authored v17 rotor and ring have been exported as separate small PNGs, with QML rotating the rotor at `(628,37)` in the shared scene camera. The static baked fan has been removed from `airFx.png`.
* **Dots exactly on original pipes:** airflow now follows all three v17 authored SVG branches, heating follows its original floor and equipment circuits, domestic hot water follows the blue loop, and the two heat-recovery lines follow their original rooftop routes. The positions are precomputed in `qml/NvV17Routes.js` and use distance-weighted movement; no runtime SVG or Qt Particles.

The Windows Security notification is separate from these visual changes. It is consistent with Smart App Control rejecting an unsigned new executable loaded into Qt Creator; diagnose with Windows CodeIntegrity Event Viewer. Do not disable security just for this warning.

Quick checks:

```bash
python tests/check_project.py
python tests/check_animation_routes.py
cmake -S core -B build-core
cmake --build build-core
ctest --test-dir build-core --output-on-failure
```

Qt 6.11.2 / MinGW runtime verification still needs to be done on the Windows Qt kit; static checks and portable core tests do not prove GUI launch or animation performance.

---

## MinGW build correction (2026-11-11)

Fixed the C++ compilation failure in `src/main.cpp`:
`unable to find string literal operator 'operator""C'`.

Cause: `QStringLiteral(NORDVENT_SOURCE_QML)` received a poorly quoted
CMake preprocessor definition containing a Windows drive-letter path.

Fix: `src/main.cpp` loads `qml/Main.qml` from beside `NordventDesktop.exe`;
`CMakeLists.txt` already copies the complete `qml/` and `assets/` folders
after linking. This needs no compile-time path macro and is independent of
where you extract the source.

In Qt Creator select **Build > Clear CMake Configuration**, reconfigure and
**Rebuild Project**. This is needed to discard any cached compiler invocation
with the previous `-DNORDVENT_SOURCE_QML` argument.

The application still requires a native Qt runtime; this source bundle is not
a tested Qt Quick Ultralite build.

---

# NORDVENT v17 — Native Qt Quick / C++ Desktop Port

**Authoritative design:** `NORDVENT-v17-Camera-Reframe-Source(1).zip`. Earlier NORDVENT Qt versions are not design references for this project.

This is a **native Qt 6 / QML / C++17** engineering port. It runs as a desktop UI with the same 800×480 logical layout as the user's original v17 browser prototype; it does **not** embed a browser, Qt WebEngine, JavaScript app.js or any network service.

## Run in Qt Creator (Windows)

1. Extract the whole ZIP to a writable folder, preserving `assets`, `qml`, `src` and `core`.
2. Open the root `CMakeLists.txt` in Qt Creator.
3. Choose **Desktop Qt 6.11.2 MinGW 64-bit** (Qt 6.5+ also supported by the CMake configuration).
4. Configure, build and run **NordventDesktop**. If you relocate the source, reconfigure the CMake project instead of reusing an unrelated build cache.
5. The post-build action copies `qml/` and `assets/` beside the executable, making runtime resolution independent of source location.

Only Qt 6 Core/Gui/Qml/Quick are required. No Qt Quick Controls, WebEngine, 3D, shader or particle modules are linked.

## Included v17 behaviors

- Home, Rooms, selected room focus, Climate, Energy, Routines and More.
- Header Home/Night/Away scenes and exact ten contextual camera presets (six pages and four room selections).
- 15 original source building frames playing at 12 fps; pauses when Motion is off.
- Eight registered independent lighting fixture assets and per-room dimming controls, three blind masks, airflow/heating/hot-water/defrost overlays.
- 44×44 icon-only global lock/alarm/health dock with confirmation dialogs.
- HVAC Fan, Heat recovery, Auto IAQ, Eco/Auto/Manual airflow, Boost 30 minutes, Heating, Domestic hot water, Water valve.
- Simulated alert/test controls, stale-sensor indication, security states and selected-room navigation.
- Reusable `NvButton`, `NvIcon`, `NvSlider`, `NvLabel`, `NvFlowDots` QML primitives.

## Fidelity and engineering status

The native QML port uses the exact v17 source images, room crops, overlay images, coordinate system, camera presets, and original color direction. Its scene layers move as one camera group while fixed controls remain screen-anchored. The original v17 screenshots are in `docs/` for side-by-side comparison, and the original offline HTML is provided as `docs/NORDVENT_v17_HTML_REFERENCE.html` **only for comparison**.

**Important:** This runtime does not have a Qt 6 installation, so the Qt GUI binary has **not** been compiled, launched or pixel-diff tested here. Portable C++ core unit tests and static source/asset verification can be run locally; use the supplied Windows Qt Creator kit for a true end-to-end Qt render check. Some secondary dialogs and visual details will need further refinement against v17. Do not treat this initial port as already pixel-perfect.

## Targeting real equipment later

This build is a **UI and simulated-controller prototype**, not a certified building automation controller. `core/` is a Qt-independent C++17 library with typed control state and input bounds; `src/NordventBackend.*` adapts it to QML. Actual sensors, actuator acknowledgments, persistence and fault/communication semantics require a future hardware gateway (see `docs/PRODUCTION_ARCHITECTURE.md`). No UI action currently drives physical hardware.

Do **not** wire the existing simulation setters directly to a safety-rated lock, smoke detector, fire alarm or emergency valve. Those need independent certified hardware logic and validated command/feedback workflows.

## Tests without Qt 6

```bash
python tests/check_project.py
cmake -S core -B build-core
cmake --build build-core
ctest --test-dir build-core --output-on-failure
```

These tests verify the portable logic and source/asset packaging, **not native Qt rendering**.

For true fidelity acceptance: launch `NordventDesktop`, capture each 800×480 viewport, compare against `docs/v17_reference_*.png`, and test the input matrix (mode, room arrows, each light fixture, blinds, airflow/boost, heat/water and security confirmation, faults, motion off).
