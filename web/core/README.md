# NORDVENT portable C++17 model

The C++ controller is a **deterministic, hardware-independent reference** for future MCU integration. It models commands and simulation states only. No GPIO, PWM, sensor, bus protocol, safety certification or physical actuator is implemented.

Use `#include "NordventCore.hpp"` and link `nordvent_core`. `Controller` contains an entire fixed-size state without heap allocation. `Room` and `Mode` are strongly typed. Every room command checks device capabilities and value limits. The `tick(nowSeconds)` argument makes the 30-minute boost timeout deterministic.

The HTML prototype **does not call C++**. Its JavaScript mirrors these important semantics as a UI demonstration. Future integration should choose a single authoritative backend, test JS/C++ behavior parity and require acknowledgement before displaying physical command success.
