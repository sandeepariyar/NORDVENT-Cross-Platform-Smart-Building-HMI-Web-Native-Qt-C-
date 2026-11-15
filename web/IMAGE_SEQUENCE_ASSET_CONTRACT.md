# Built-in 15-frame animation contract

- Source: user-provided `house_loop_frames.zip`
- Ordered frames: `assets/sequence/frame_01.png` … `frame_15.png`
- Frame dimensions: 800 × 352 PNG
- Playback: 12 fps, looped with frame image replacement in the browser prototype
- Motion OFF: freezes current frame; Motion ON: resumes
- Reset background: restores this original 15-frame sequence and playback
- Building effect alignment: SVG viewBox 0 0 800 352. For different imagery, retarget all geometry.
- Embedded standalone: `build_standalone.py` inlines all 15 frames as data URIs; the unpacked source version references their file paths
- MCU port: convert to optimized frame sequence/sprite sheet compatible with target graphics API; evaluate memory and decode costs before deciding frame rate and palette
