# NORDVENT — Interactive Embedded HMI Engineering Lab

**Designed & Developed by Sandeep Pariyar** · Proprietary / All Rights Reserved

A dual-implementation smart-building HMI showcase: the original fully interactive HTML v17 and the separate Qt 6/QML/C++ v17.1 native desktop port. It features an engineering inspector for **actual web UI actions and browser simulation state**, component and motion documentation, an architecture walkthrough, and an honest MCU-readiness checklist.

## Live showcase

Enable GitHub Pages once using **Settings → Pages → Source: GitHub Actions**. The build workflow deploys `docs/` plus the compiled Qt WebAssembly runtime to `https://sandeepariyar.github.io/NORDVENT-Cross-Platform-Smart-Building-HMI-Web-Native-Qt-C-/`.

To preview locally (from this repository root):

```bash
python -m http.server 8080 -d docs
```

Open `http://localhost:8080`. Do not open the showcase using `file://`: browser security prevents cross-frame inspection in that context.

For the complete source/asset upload instructions, see **[PUBLISH.md](PUBLISH.md)**. The initial GitHub repository includes an honest standalone preview; the complete original applications become visible there after the full package upload.

## Repository structure

- `docs/` — GitHub Pages site, developer inspector, design system, engineering case study and embedded web application
- `web/` — unmodified original source v17 (plus original technical documentation)
- `native-qt/` — working v17.1 CMake / Qt Quick / QML / C++ project with animated blinds, rotor, fixed-route flow effects
- `docs/web/` — browser deployment of original v17 with an additional **read-only** state inspection hook

## Engineering truth and scope

- **Live web controls are real**, and the developer inspector observes input events and snapshots reported by the original web simulation.
- **The Qt implementation is a separate native application**. The Qt panel screenshot remains labelled as an original design reference; its separate `/native/` viewer loads a real QML/C++ WebAssembly build once the CI compile and browser test have passed.
- No connected building hardware, MCU target or actuator feedback is demonstrated. Virtual state changes do **not** imply physical device acknowledgments.
- Qt Quick Ultralite and LVGL target builds are future engineering tracks, not shipped targets.

## Qt Desktop development

Open `native-qt/CMakeLists.txt` in Qt Creator using **Qt 6.11.2 MinGW 64-bit** (Windows), then configure/build/run `NordventDesktop`. Original README and build notes are preserved.

## Working versions and remaining work

- Original HTML v17 — complete browser source and assets in this package.
- Qt v17.1 — working native Windows Qt 6/QML/C++ desktop application (reported by creator); source and portable C++ unit tests included.
- Developer inspector — real browser-side event/state changes, no invented hardware communication.
- Qt WebAssembly — **implemented as a CI build; browser runtime must pass the workflow smoke test before deployment**.
- Actual MCU deployment, LVGL renderer, physical devices — **not built or validated**.

## Licensing

**Copyright © 2026 Sandeep Pariyar. All rights reserved. Not MIT.** See [LICENSE.md](LICENSE.md). Third-party components retain their own licenses.

## Real Qt WebAssembly demo

`/native/` is a **native Qt 6.11.2 / QML / C++17** application compiled by Emscripten 4.0.7, not an HTML recreation. It uses the exact v17.1 control backend and graphics. The workflow `.github/workflows/pages.yml` packages source QML and all raster assets into the WebAssembly resource system, tests it with Chromium/Playwright, and publishes the GitHub Pages site only if tests pass.

The existing `/web/` is the original independent HTML/JS version. Windows Qt Creator builds remain supported and use local source QML for rapid editing. No physical MCU deployment is claimed.

**Live Pages URL after a successful workflow:** https://sandeepariyar.github.io/NORDVENT-Cross-Platform-Smart-Building-HMI-Web-Native-Qt-C-/native/
