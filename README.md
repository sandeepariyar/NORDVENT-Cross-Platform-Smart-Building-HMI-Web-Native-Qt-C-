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

**Publishing status:** The repository has been initialized with the project description and proprietary notice. The full source/assets upload is a separate step; paths above may not appear until it completes. Do not enable GitHub Pages as a completed demonstration until the files are present.

Once the complete source is uploaded, enable GitHub Pages under **Settings → Pages → Deploy from a branch → main /docs**.

## Building the native app

Open `native-qt/CMakeLists.txt` in Qt Creator and use **Desktop Qt 6.11.2 MinGW 64-bit**. Build and run `NordventDesktop`.

## Ownership

© 2026 **Sandeep Pariyar**. All rights reserved. **Not MIT or open source.** See [LICENSE.md](LICENSE.md). Dependencies and third-party assets retain their respective license terms.
