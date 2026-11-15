#include "NordventCore.hpp"
#include <limits>

namespace nordvent {
namespace {
void roomPreset(std::array<RoomState,kRoomCount>& rooms,
                const std::array<int,4>& lights,
                const std::array<int,4>& blinds,
                const std::array<int,4>& temperatures) noexcept {
  for (std::size_t i=0;i<kRoomCount;++i) {
    rooms[i].lightPercent=static_cast<std::uint8_t>(lights[i]);
    rooms[i].blindsClosedPercent=static_cast<std::uint8_t>(blinds[i]);
    rooms[i].targetTenthsC=static_cast<std::int16_t>(temperatures[i]);
  }
}
}
Controller::Controller() noexcept { applyScene(Scene::Home); }
Result Controller::setLight(Room room, int value) noexcept {
  if(!validRoom(room)) return Result::InvalidRoom;
  if(value<0||value>100) return Result::OutOfRange;
  state_.rooms[static_cast<std::size_t>(room)].lightPercent=static_cast<std::uint8_t>(value);
  state_.scene=Scene::Custom;
  return Result::OK;
}
Result Controller::setBlinds(Room room, int value) noexcept {
  if(!validRoom(room)) return Result::InvalidRoom;
  if(!hasBlinds(room)) return Result::UnsupportedDevice;
  if(value<0||value>100) return Result::OutOfRange;
  state_.rooms[static_cast<std::size_t>(room)].blindsClosedPercent=static_cast<std::uint8_t>(value);
  state_.scene=Scene::Custom;
  return Result::OK;
}
Result Controller::setTargetTenthsC(Room room, int value) noexcept {
  if(!validRoom(room)) return Result::InvalidRoom;
  if(value<160||value>280||value%5!=0) return Result::OutOfRange;
  state_.rooms[static_cast<std::size_t>(room)].targetTenthsC=static_cast<std::int16_t>(value);
  state_.scene=Scene::Custom;
  return Result::OK;
}
Result Controller::setMode(Mode mode) noexcept {
  if(mode!=Mode::Auto&&mode!=Mode::Eco&&mode!=Mode::Manual) return Result::OutOfRange;
  if(boostActive())state_.boostEndsAtSeconds=0;  // Explicit mode selection takes over with fan running.
  state_.mode=mode;
  state_.scene=Scene::Custom;
  return Result::OK;
}
Result Controller::setManualFlow(int flow) noexcept {
  if(flow<100||flow>300||flow%10!=0)return Result::OutOfRange;
  state_.manualFlowM3h=static_cast<std::uint16_t>(flow);
  state_.scene=Scene::Custom;
  return Result::OK;
}
void Controller::setVentilation(bool enabled) noexcept {
  if(boostActive())stopBoost();
  state_.ventilation=enabled;
}
void Controller::applyScene(Scene scene) noexcept {
  if(scene==Scene::Custom)return;
  if(boostActive())stopBoost();
  switch(scene) {
    case Scene::Home:
      roomPreset(state_.rooms,{40,70,65,80},{0,0,0,0},{200,220,210,190}); state_.mode=Mode::Auto;break;
    case Scene::Night:
      roomPreset(state_.rooms,{15,10,0,0},{100,100,100,0},{190,200,190,180}); state_.mode=Mode::Eco;break;
    case Scene::Away:
      roomPreset(state_.rooms,{0,0,0,0},{100,100,100,0},{170,170,170,170}); state_.mode=Mode::Eco;break;
    default: break;
  }
  state_.ventilation=true;
  state_.scene=scene;
}
void Controller::startBoost(std::uint32_t now, std::uint32_t duration) noexcept {
  if(duration==0)return;
  if(!boostActive()) {
    state_.modeBeforeBoost=state_.mode;
    state_.ventilationBeforeBoost=state_.ventilation;
  }
  state_.boostEndsAtSeconds=(duration>std::numeric_limits<std::uint32_t>::max()-now)
      ? std::numeric_limits<std::uint32_t>::max() : now+duration;
  state_.ventilation=true;
}
void Controller::stopBoost() noexcept {
  if(!boostActive())return;
  state_.boostEndsAtSeconds=0;
  state_.mode=state_.modeBeforeBoost;
  state_.ventilation=state_.ventilationBeforeBoost;
}
void Controller::tick(std::uint32_t now) noexcept {
  if(boostActive()&&now>=state_.boostEndsAtSeconds)stopBoost();
}
std::uint16_t Controller::airflowM3h() const noexcept {
  if(!state_.ventilation)return 0;
  if(boostActive())return 350;
  return state_.mode==Mode::Eco?110:state_.mode==Mode::Manual?state_.manualFlowM3h:215;
}
}
