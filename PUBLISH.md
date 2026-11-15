# NORDVENT — Build and publish

This repository contains the native Qt/QML/C++ project, the original self-contained v17 browser design reference and the engineering showcase. **Original source is proprietary**; see [LICENSE.md](LICENSE.md). The two applications are independent simulations, not deployed building-control firmware.

## Automated GitHub Pages build

The workflow at `.github/workflows/pages.yml` runs on pushes to `main`. It:

1. Checks the source layout and parses the showcase JavaScript.
2. Rebuilds Qt raster assets, HTML image sequences and preview screenshots from `web/NORDVENT_Standalone.html`. These generated files do not have to be committed as binary assets.
3. Configures Qt 6.11.2 for WebAssembly and Emscripten 4.0.7.
4. Builds the actual native QML/C++ runtime and packages it at `/native/`.
5. Performs an automated Chromium test: launches the Qt canvas, checks a native UI interaction, opens the main showcase, confirms C++ state snapshots update, and checks the device-size viewer.
6. Deploys both applications only if the build and checks succeed.

To enable publishing, select **Settings → Pages → Build and deployment → GitHub Actions** in GitHub. Check the latest `NORDVENT · Qt WebAssembly + Engineering Lab` job in the [Actions tab](https://github.com/sandeepariyar/NORDVENT-Cross-Platform-Smart-Building-HMI-Web-Native-Qt-C-/actions).

**Showcase:** https://sandeepariyar.github.io/NORDVENT-Cross-Platform-Smart-Building-HMI-Web-Native-Qt-C-/

**Standalone Qt WebAssembly runtime (after successful deployment):** https://sandeepariyar.github.io/NORDVENT-Cross-Platform-Smart-Building-HMI-Web-Native-Qt-C-/native/

## Local Qt desktop development

Open `native-qt/CMakeLists.txt` in Qt Creator using the Qt 6.11.2 MinGW 64-bit kit on Windows. Build the `NordventDesktop` target; the project copies native QML and raster assets alongside the executable. See `native-qt/README.md` for the simulation behavior and build notes.

A static preview of the showcase is available with:

```bash
python -m http.server 8080 -d docs
```

This preview does not independently compile Qt WebAssembly. It displays a truthful build-pending status until the `/native/` bundle is present.

## Runtime diagnostics

The engineering inspector reads **read-only snapshots emitted by the running C++ backend** of the WebAssembly application. It shows native state revision, uptime, page, simulated ventilation and fault state. It does not read HTML click logs or claim access to actual physical sensors.

The HTML app remains a design reference. The **Actual size** controls provide a logical 800 × 480 view and a physical 5-inch display estimate that must be calibrated against a real 100 mm ruler.

## Scope and limitations

This is a Qt Quick desktop/WebAssembly HMI engineering prototype. It has no verified MCU firmware binary, LVGL or Qt Quick Ultralite target, production safety logic, actuator acknowledgments or measured RAM/performance on target silicon. Verify those separately before representing the project as a deployed embedded controller.
