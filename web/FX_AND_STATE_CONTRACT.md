# NORDVENT v14 — FX state contract for an embedded port

| System | Visual color | Simulated input | Visual output | Priority |
|---|---|---|---|---|
| Ventilation Eco | Cyan dim | User Eco | Sparse dots, slower fan/airflow | Baseline |
| Ventilation Auto | Cyan | User Auto | Medium dots and speed | Baseline |
| Ventilation Manual | Cyan | Slider 100–300 m³/h | Dot gap, stroke weight and speed scale with flow | Manual |
| IAQ automatic response | Cyan-green | CO₂ >= 1100 ppm, PM2.5 >=35 µg/m³ or VOC >=450 ppb (demo thresholds only) | 280 m³/h if enabled and ventilation on and not Manual/Boost | Automatic |
| Boost | Ice white/cyan | User, 30-minute timer | 350 m³/h, short surge, bright outlet jets and fast fan | Highest for fan |
| Heating | Amber | Heating toggle | Floor/utility flow | Independent |
| Hot water | Blue | Hot-water toggle and main valve open | Hot-water cylinder loop | Independent |
| Defrost | Icy blue | Defrost simulation | Rooftop ring, decorative heating circuit paused | Equipment mode |
| Door locked | Green | Confirmed door command | Short acknowledge ring, steady locked text | Persistent |
| Door unlocked | Amber | Confirmed door command | Short acknowledge ring, steady unlocked text | Persistent |
| Alarm armed | Green | Confirmed alarm command | Short acknowledge ring, steady armed text | Persistent |
| Alarm disarmed | Grey | Confirmed alarm command | Short acknowledge ring, steady disarmed text | Persistent |
| Smoke/CO alert | Red | Simulated detector event | Kitchen marker + critical health status | Highest alert |
| Water leak | Red | Simulated utility detector | Utility marker + critical health + available valve shutoff | Highest alert |
| Frost | Ice blue | Simulated frost event | Utility marker + health warning | High |
| Window open | Muted blue | Simulated contact | Living-window marker + notice | Informational |
| Filter/sensor/heat pump | Amber | Simulated faults | Equipment status and diagnostics | Warning |

**Units/values are examples from the browser simulation, not measured readings.** Production versions should never invent or interpolate sensor values during connectivity loss: show unavailable/stale and use fail-safe hardware logic. Hardware state should be authoritative and every command should wait for acknowledgement. Safety-critical alerts require independent certified safety systems.

SVG coordinates use the **original 800×352 house art source space**. When importing new artwork, effects are hidden by default until explicitly allowed by the user. No QML is included.
