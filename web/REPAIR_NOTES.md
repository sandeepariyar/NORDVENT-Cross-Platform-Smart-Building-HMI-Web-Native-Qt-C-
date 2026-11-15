# NORDVENT v13.1 Repair Notes

## Reproduced defect
The previously delivered Home and Room screens rendered very bright purple full-area rectangles over the building. This was caused by `.fx-blind rect` and `.blind-bank rect` CSS declarations overriding the SVG blind gradient fill and opacity with a solid violet panel. Functional checks passed, but visual correctness was poor.

## Changes
- Restored gradient blind fabric, removed excessive blur/glow and retuned slat edges for a more credible closed-blind appearance.
- Rebuilt original uploaded 15-frame PNG sequence as optimized playback WebP frames (800 × 352) and embedded these into the standalone HTML. Original PNGs retained unchanged under `assets/sequence/`.
- Added frame preloading for smoother switching and less blank/flickering frames.
- Fresh state namespace to avoid stale state from earlier experimental builds.
- Kept fixed 800 × 480, all home/room/climate/energy/routines/more interactions and persistent Lock/Alarm controls.

## Validation
- 75/75 existing Chromium browser assertions passed; zero page or console errors.
- Additional checks: 800×480, 1200×720, and 400×240 scaling; gradient source fill; blind Open, 50%, Closed coverage; Lock confirmation; Routines modal; Motion ON/OFF playback.
- JavaScript syntax checked with Node.

## Limitations
- This repairs defects reproduced in the prior build. If the user is seeing an unrelated issue, a screenshot or description of the exact failure is needed.
- These are visual UI simulations; the separate C++17 core is not wired to browser controls or physical devices.
- Curtain geometry remains a stylized architectural overlay, not a photorealistic occlusion pass. Further perspective matching can improve the result.
