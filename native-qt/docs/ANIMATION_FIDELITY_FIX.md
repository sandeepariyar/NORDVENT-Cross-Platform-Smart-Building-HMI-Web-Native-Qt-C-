# NORDVENT v17 — Native animation fidelity update

**Design source:** Original uploaded `NORDVENT-v17-Camera-Reframe-Source`.
This patch replaces the existing simplified/incorrect port animations without changing controller state or UI screen layouts.

## Fan
- Original SVG turbine hub: `(628, 37)` in the 800×352 architectural scene.
- Static fan is removed only from the existing `airFx.png` transparent effect layer.
- New `fan_ring.png` and `fan_blades.png` are rasterized from the original SVG geometry.
- The rotor rotates via a Qt Quick `RotationAnimation`; it stops when ventilation/motion is off.

## Blinds
- The original v17 is a **vertical-slat blind**, not a horizontal venetian blind.
- A single 4×72 PNG slat is reused for all three visible glazing banks.
- The correct v17 glazing ranges are bedroom `(456,80,154×64)`, living `(448,157,166×67)` and kitchen `(446,238,138×71)`.
- State 0 is stacked/open; 100 is spread/closed, 50 intermediate.
- `NvVerticalBlinds.qml` animates the slat spacing and cloth coverage for ~470ms.

## Routing the dots
- `NvV17Routes.js` contains the original v17 SVG paths converted to exact local positions (quadratic corners sampled at 1/6-arc steps).
- Cyan dots trace all **three** original ventilation paths (source `air-moving`), recovery counterflows trace original roof routes.
- Amber dots trace original hydronic paths, and blue dots trace the independent hot-water circuit.
- `NvFlowDots.qml` uses **arc-length interpolation**, avoiding speed jumps on unequal line segments.
- Every route sits within the same camera transform as the house. No particle engine or dynamic SVG.

## Windows Security warning
The notification is caused by Windows code integrity / Smart App Control rejecting an unsigned newly built executable or component loaded into Qt Creator. It is not a QML bug and is not resolved by changing a code path. Determine the exact file through the CodeIntegrity event log. Production Windows distribution should sign binaries with a trusted code-signing certificate; do not disable protective controls merely to silence the notification.

## Verification
Static layout/asset checks and portable C++ tests are available. Native Qt 6/MinGW runtime is not installed in this build environment, so actual animated-frame visual testing must be performed in Qt Creator on Windows.
