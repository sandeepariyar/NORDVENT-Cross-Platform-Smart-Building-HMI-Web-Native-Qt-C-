# Publish NORDVENT Engineering Lab

**Destination:** https://github.com/sandeepariyar/NORDVENT-Cross-Platform-Smart-Building-HMI-Web-Native-Qt-C-

This repository remains **proprietary**, copyright © 2026 Sandeep Pariyar. No MIT or other blanket open-source license is included for original project materials. Third-party dependencies retain their own license requirements.

## Complete source and artwork — Windows

The currently checked GitHub repository contains documentation but not the complete web/Qt binary artwork. Use the preconfigured **non-force** script to publish the source, images and website together. It uploads only to the destination linked above.

1. Download and extract the **NORDVENT v17.1 Qt WebAssembly Ready to Publish** ZIP from this ChatGPT conversation.
2. Open the extracted project directory in Windows Explorer. Confirm that `docs/index.html`, `docs/web/index.html`, `native-qt/CMakeLists.txt`, `Publish-NORDVENT.ps1` and `LICENSE.md` exist.
3. Make sure Git for Windows is installed and the Git credentials on your computer have push access to your repository.
4. Open **PowerShell in the extracted folder** and run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Publish-NORDVENT.ps1
```

The script clones **only** this NORDVENT repository into a uniquely named temporary folder, copies the project, stages source changes, creates a standard commit, and pushes to `main`. It does not force-push, delete the other repositories, or overwrite the remote git history. It is safe to run again if a previous run completed; it detects an unchanged tree.

Afterward, verify these paths in GitHub: `docs/index.html`, `docs/web/assets/`, `web/app.js`, `native-qt/qml/Main.qml`, `native-qt/assets/sequence/`, and `LICENSE.md`.

## GitHub Pages — one-time enablement

1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment**, select **GitHub Actions** as the publishing source.
3. The updated workflow `.github/workflows/pages.yml` installs Qt for WebAssembly, builds the REAL native QML/C++ application, executes its browser smoke test and deploys the `docs/` site together with the Qt `/native/` application after success. It runs on each `main` push or manually from **Actions**.
4. Verify a green deployment job and then open:

https://sandeepariyar.github.io/NORDVENT-Cross-Platform-Smart-Building-HMI-Web-Native-Qt-C-/

When fully uploaded, the page includes the actual HTML v17 app and a live, read-only web-side state/event inspector. The reference screenshot remains clearly labelled; an independent `/native/` URL hosts the real Qt WebAssembly build after CI succeeds.

## Local preview

From the root of this extracted repository:

```powershell
python -m http.server 8080 -d docs
```

Open `http://localhost:8080` in your browser. `file://` does not support the same-origin inspection bridge reliably.

## Engineering scope

Web runtime states are simulated; they do not represent real sensor telemetry. The Qt C++ controller is separate and currently lacks production-ready hardware gateways, acknowledgments, sensor freshness, persistence, safety interlocks and target MCU validation. LVGL and Qt for MCUs support are planned engineering targets, not implemented claims.

## Qt WebAssembly live display

After publishing all source and assets with the PowerShell script above, open the **Actions** tab and verify the `NORDVENT · Qt WebAssembly + Engineering Lab` workflow is green. Its smoke test must launch the real `NordventDesktop.wasm` before deploying. Then open:

https://sandeepariyar.github.io/NORDVENT-Cross-Platform-Smart-Building-HMI-Web-Native-Qt-C-/native/

The publishing script requires normal Git authentication and never force-pushes. GitHub Pages must be set to **GitHub Actions**.
