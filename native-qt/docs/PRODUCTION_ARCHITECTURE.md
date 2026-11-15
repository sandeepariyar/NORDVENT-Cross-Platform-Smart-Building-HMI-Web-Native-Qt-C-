# Production-minded architecture (future hardware phase)

The native Qt Quick implementation is a desktop engineering harness for an eventual physical smart-building HMI. **Fidelity to v17 comes first; deployment hardware has not been selected or measured.**

## Module boundaries

1. **View / QML**: presentation, native text, touch events, page and camera transitions. No direct hardware I/O.
2. **Application adapter / QObject**: current `NordventBackend`, exposes UI properties, handles actions, maps simulation values to typed `nordvent::Controller` commands.
3. **Portable control logic / C++17**: `core/include/NordventCore.hpp`; bounds, modes, room states, boost lifecycle, simple deterministic state machine. Buildable without Qt.
4. **Future `DeviceGateway`**: board-independent hardware interface supplying sensor telemetry and issuing actuator requests. Keep as a replaceable implementation, not invoked by this prototype.
5. **Future real drivers**: RS-485/Modbus/CAN/BLE/Wi-Fi/fieldbus or GPIO as required by selected system hardware.

## Physical-control contract before hardware connection

- A UI slider issues a **requested setpoint**, never asserts an actuator has reached it.
- Commands should have correlation IDs, timestamp, range validation, permission check, state (`pending/acknowledged/rejected/timed out`), and an explicit device acknowledgment.
- Telemetry needs value, unit, source, monotonic capture time, quality (`valid/stale/unavailable/fault`) and source freshness limits.
- On communication loss, show stale/unavailable and preserve the last known value only with an explicit quality indicator; never display fabricated live data.
- For relays/motors/valves: actuator interlocks, duty limits, limits/feedback and watchdogs belong below the HMI.
- Lock/alarm/fire/smoke/CO systems must be independently certified and must not depend on the Qt GUI for life-safety action.
- Persistent scene/settings storage needs a versioned schema, atomic writes and recovery paths; safety-critical state does not simply follow persisted UI toggles.
- Bench test with fault injection, loss of power/network, startup recovery and user confirmation workflows before production integration.

## MCU adaptation after fidelity sign-off

- Choose the actual MCU and display before declaring RAM/flash/frame-rate budgets.
- Profile at 800×480; 15 RGB frames decoded simultaneously would consume ~12.7 MiB of pixel buffers (15 × 800 × 352 × 3). A constrained MCU may instead need streamed or reduced frame sequences, precomputed camera variants or frozen backgrounds.
- Optimize alpha and palette on a per-asset basis, deduplicate controls, use nine-slice where appropriate and keep dynamic labels as text if the target's font engine supports them.
- Avoid runtime particles, GPU shaders and heavyweight drop shadows. Validate every used QML primitive against the target Qt Quick Ultralite version; Qt 6 Desktop API compatibility does not imply Ultralite support.
- Verify visual consistency and UX on the actual physical display at its viewing distance.

## Verification scope

- Source and PNG dimensions/placement verified in the packaging process.
- Standalone C++ `core/` test suite validated where a C++ compiler exists.
- The native Qt 6 GUI requires the user's Windows Qt 6.11.2 MinGW kit for launch, interaction testing and comparison screenshots.
