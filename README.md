# NORDVENT — Cross-Platform Smart Building HMI | Web & Native Qt/C++

**Designed & Developed by Sandeep Pariyar** · **Proprietary / All Rights Reserved**

**One interface. Two technology stacks. Engineering beyond the interface.**

NORDVENT is a portfolio engineering lab for a smart-building human–machine interface implemented independently in **HTML/CSS/JavaScript** and **native Qt 6 / QML / C++17**. Its architectural visualization, room-level controls, ventilation, heating, lighting and blinds illustrate the challenge of keeping an interface consistent across browser and native runtimes.

## Current implementation and honesty of claims

- **Web v17:** interactive original HTML application with building visualization and simulated control states.
- **Qt v17.1:** native desktop port with a C++ controller, QML interface, camera framing, raster overlays, airflow paths, fan and blinds animation.
- **Engineering Lab:** interactive comparison website, event/state inspector for the **web** simulation, design-system references, technical architecture, engineering case study and performance notes.
- **Not represented as complete:** Qt WebAssembly, physical MCU firmware, hardware gateways, BACnet certification, or real actuator/sensor feedback.

The web and Qt applications are **separate implementations**, not a single shared runtime backend. The inspector must show actual observed web simulation events, not fabricated device acknowledgments.

## Repository structure (prepared for publication)

- `docs/` — GitHub Pages showcase and inspector, including browser demo at `docs/web/`
- `web/` — original HTML v17 source and reference assets
- `native-qt/` — Qt 6.11.2 MinGW-ready QML / C++ project and assets
- `tools/` — source integrity checks
- `.github/workflows/` — validation pipeline

Read the [complete-source publishing instructions](PUBLISHING.md) for the one-command Windows upload.

**Publishing status (15 November 2026):** A standalone, responsive portfolio landing page is now committed at [docs/index.html](docs/index.html), including a clearly labeled local simulated-control inspector, design-system preview, architecture and case study. The ORIGINAL v17 HTML app, binary assets and complete Qt source are **not yet uploaded**: use [PUBLISHING.md](PUBLISHING.md) and the supplied ZIP to complete that step. The website intentionally marks those parts as pending rather than pretending a Qt WebAssembly demo exists.

Once the complete source is uploaded, enable GitHub Pages under **Settings → Pages → Deploy from a branch → main /docs**.

## Repository and branch strategy

**One product, one repository, two independent implementations.**

Keep the original web implementation in `web/` and the native Qt/QML/C++ implementation in `native-qt/`, with the public engineering showcase in `docs/`. Shared architectural and verification material belongs in common documentation and test folders. This structure allows recruiters to see both implementations together without switching branches.

Use `main` as the authoritative integrated branch (and GitHub Pages source from `main /docs`). Create short-lived feature branches such as `feature/virtual-device-lab`, `feature/qt-wasm` and `feature/lvgl-port` for changes under development. Merge only after validation. Release tags may identify independently verified versions such as `web-v17` or `qt-v17.1`.

The native Qt desktop app is not the same as an MCU/Qt Quick Ultralite build; WebAssembly and LVGL remain separate targets until built and tested.

## Building the native app

Open `native-qt/CMakeLists.txt` in Qt Creator and use **Desktop Qt 6.11.2 MinGW 64-bit**. Build and run `NordventDesktop`.

## Ownership

© 2026 **Sandeep Pariyar**. All rights reserved. **Not MIT or open source.** See [LICENSE.md](LICENSE.md). Dependencies and third-party assets retain their respective license terms.
