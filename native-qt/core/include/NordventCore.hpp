#pragma once
// NORDVENT v6 portable, hardware-independent command model.
// No Qt, no dynamic allocation, no I/O. For demonstration and future adaptation.
#include <array>
#include <cstddef>
#include <cstdint>

namespace nordvent {

enum class Room : std::uint8_t { Bedroom=0, LivingRoom, Kitchen, Utility, Count };
enum class Mode : std::uint8_t { Auto, Eco, Manual };
enum class Scene : std::uint8_t { Home, Night, Away, Custom };
enum class Result : std::uint8_t { OK, InvalidRoom, UnsupportedDevice, OutOfRange };

constexpr std::size_t kRoomCount=static_cast<std::size_t>(Room::Count);
constexpr bool hasBlinds(Room r) noexcept { return r!=Room::Utility && static_cast<unsigned>(r)<kRoomCount; }

struct RoomState {
  std::uint8_t lightPercent{0};
  std::uint8_t blindsClosedPercent{0};
  std::int16_t targetTenthsC{200};  // 200 == 20.0 C
};

struct State {
  std::array<RoomState,kRoomCount> rooms{};
  Scene scene{Scene::Home};
  Mode mode{Mode::Auto};
  Mode modeBeforeBoost{Mode::Auto};
  bool ventilation{true};
  bool ventilationBeforeBoost{true};
  bool heatRecovery{true};
  bool heating{true};
  bool hotWater{true};
  std::uint16_t manualFlowM3h{190};
  std::uint32_t boostEndsAtSeconds{0};
};

class Controller final {
 public:
  Controller() noexcept;
  const State& state() const noexcept { return state_; }
  Result setLight(Room room, int percent) noexcept;
  Result setBlinds(Room room, int closedPercent) noexcept;
  Result setTargetTenthsC(Room room, int tenthsC) noexcept;
  Result setMode(Mode mode) noexcept;
  Result setManualFlow(int m3h) noexcept;
  void setVentilation(bool enabled) noexcept;
  void setHeatRecovery(bool enabled) noexcept { state_.heatRecovery=enabled; }
  void setHeating(bool enabled) noexcept { state_.heating=enabled; }
  void setHotWater(bool enabled) noexcept { state_.hotWater=enabled; }
  void applyScene(Scene scene) noexcept;
  void startBoost(std::uint32_t monotonicNowSeconds, std::uint32_t durationSeconds=1800) noexcept;
  void stopBoost() noexcept;
  void tick(std::uint32_t monotonicNowSeconds) noexcept;
  bool boostActive() const noexcept { return state_.boostEndsAtSeconds!=0; }
  std::uint16_t airflowM3h() const noexcept;
 private:
  State state_{};
  static bool validRoom(Room room) noexcept { return static_cast<unsigned>(room)<kRoomCount; }
};
}
