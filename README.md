# NORDVENT — Embedded Smart-Building HMI

**Designed & Developed by Sandeep Pariyar** · © 2026 · All rights reserved

An 800 × 480 smart-building control interface implemented in **Qt Quick/QML and C++17**, with an independently running HTML/CSS/JavaScript design prototype for comparison. The project examines how a visual concept is translated into native controls, reusable QML components, image-sequence animation, a typed C++ backend and an MCU-oriented asset pipeline.

**[Open the interactive engineering showcase](https://sandeepariyar.github.io/NORDVENT-Cross-Platform-Smart-Building-HMI-Web-Native-Qt-C-/)**

The first screen leads with the native Qt/QML/C++ WebAssembly runtime and places the independent HTML design reference alongside it. The native build starts automatically when the compiled bundle is available; otherwise the UI shows an explicit build status. Neither demonstration controls real equipment.

## Native implementation

- **QML:** fixed 800 × 480 scene, page/room navigation, reusable buttons, labels, icons and sliders; moving blinds, HVAC rotor, lighting and flow animations.
- **C++17:** Qt-independent typed control core, Qt/QML adapter and simulated room, lighting, climate and security state.
- **Build:** CMake and Qt 6 Quick/QML; desktop Qt Creator target and a separate WebAssembly CI target.
- **Tests:** portable controller checks, asset/route validation and a browser smoke test in the published WASM workflow.

## Project layout

| Path | Purpose |
| --- | --- |
| `native-qt/qml/` | Native QML screens, controls and animation routes |
| `native-qt/src/` | Qt/C++ application entry and QML-facing backend |
| `native-qt/core/` | Portable C++ controller state and logic |
| `native-qt/assets/` | Raster artwork used by the native runtime |
| `web/` | Original independent browser prototype |
| `docs/` | Native C++ diagnostics, dual-runtime showcase, design system and engineering notes |
| `.github/workflows/pages.yml` | Qt WebAssembly build, checks and Pages deployment |

## Run with Qt Creator

Open `native-qt/CMakeLists.txt` with a **Qt 6.11.2 MinGW 64-bit** kit on Windows. Configure, build and run `NordventDesktop`. The desktop build copies QML and assets alongside the executable so visual work can continue without relinking C++.

## Browser presentation and device-size inspection

The landing page prioritizes the native Qt implementation while retaining the browser prototype as a visual comparison. The engineering panel is driven by read-only messages emitted from the **actual C++ backend running in WebAssembly**, including state revision, runtime uptime, selected view, ventilation model value, simulated fault count and controller JSON. These are not browser click events, measured frame rates or real hardware telemetry.

The **Actual size** control has two modes: an 800 × 480 logical-pixel inspection view and a calibrated physical 5-inch-screen view. Physical-size accuracy depends on measuring the supplied 100 mm calibration line with a ruler; CSS pixels alone cannot determine a monitor's physical scale.

To preview the static showcase locally:

```bash
python -m http.server 8080 -d docs
```

Open `http://localhost:8080`. A real native browser run requires the compiled Qt WebAssembly artifacts at `/native/`; the static placeholder is not presented as a running Qt application. See [PUBLISH.md](PUBLISH.md) for the build/deployment workflow.

## Implementation status

The desktop QML/C++ project and its source files are included. CI builds the WebAssembly port and checks native controller snapshots, changes in state revision and the portfolio's device-view controls before deploying. A working local Qt desktop build has been reported by the project author; this README does not substitute for a fresh native runtime test.

**Not implemented or validated:** physical MCU firmware, Qt Quick Ultralite or LVGL ports, real sensor/actuator integration, safety-rated equipment control and device-level timing/memory measurements. Those require target hardware and separate verification.

## License

**Proprietary — all rights reserved.** See [LICENSE.md](LICENSE.md). Third-party components retain their own licenses.
