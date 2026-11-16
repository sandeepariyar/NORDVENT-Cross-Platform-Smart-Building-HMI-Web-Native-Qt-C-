# NORDVENT — Smart Building HMI

**ENGINEERING LAB / 17.1**

**Sandeep Pariyar · Developer / Designer**

A winter-night control panel for lighting, ventilation, blinds, and security. Explore two independent implementations of the same smart-building interface.

[![Launch the NORDVENT demo](https://img.shields.io/badge/Open%20live%20applications-57DCE2?style=for-the-badge&labelColor=0B1924)](https://sandeepariyar.github.io/NORDVENT-Cross-Platform-Smart-Building-HMI-Web-Native-Qt-C-/)

[Open the side-by-side demo →](https://sandeepariyar.github.io/NORDVENT-Cross-Platform-Smart-Building-HMI-Web-Native-Qt-C-/) · Runs in your browser

## Try it

- Move between rooms and adjust the lighting, ventilation, or blinds.
- Compare the independent web and Qt interfaces at the same **800 × 480** logical size.
- Open the engineering panel while using the Qt version. Watch the C++ state revision, selected view, ventilation value, and simulated fault count update.

Use **Actual size** to inspect the logical display dimensions or calibrate the physical 5-inch view with the 100 mm reference line.

## Two implementations, one design

| | A · Native engineering port | B · Original design reference |
| --- | --- | --- |
| Interface | Qt Quick / QML | HTML, CSS, JavaScript |
| Control logic | Typed C++17 controller and QML adapter | Independent browser simulation |
| Browser runtime | Qt WebAssembly | JavaScript |
| Source | [Native Qt project](native-qt/) | [Web prototype](web/) |

The Qt view uses reusable QML controls, raster artwork, and frame sequences for selected motion. The engineering panel reads state from the C++ backend running in WebAssembly. If the compiled Qt bundle is unavailable, the showcase displays its build status.

## Embedded display budget

The reference is an **800 × 480, 5-inch WVGA-class touch display**.

| RGB565 display buffer | Estimated memory |
| --- | ---: |
| One full framebuffer | 768,000 bytes (750 KiB) |
| Two full framebuffers | 1,536,000 bytes (1,500 KiB) |

These figures cover pixel storage. Images, fonts, application state, stack, and heap add to the runtime budget. The showcase demonstrates desktop Qt and its browser build. Qt Quick Ultralite, firmware fit, physical I/O, and on-device performance remain to be validated.

## Build and explore the source

Open [native-qt/CMakeLists.txt](native-qt/CMakeLists.txt) in Qt Creator with the **Qt 6.11.2 MinGW 64-bit** desktop kit and build **NordventDesktop**. See the [native build notes](native-qt/README.md), [WebAssembly publishing workflow](PUBLISH.md), and [GitHub Actions build](.github/workflows/pages.yml).

**Proprietary · All rights reserved.** See [LICENSE.md](LICENSE.md). Third-party components retain their own licenses.
