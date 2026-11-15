#include "NordventCore.hpp"
#undef NDEBUG
#include <cassert>
#include <iostream>
using namespace nordvent;
int main(){
 Controller c;
 assert(c.state().rooms[0].lightPercent==40);
 assert(c.state().rooms[1].lightPercent==70);
 assert(c.setBlinds(Room::Utility,100)==Result::UnsupportedDevice);
 assert(c.setBlinds(Room::Bedroom,100)==Result::OK);
 assert(c.state().rooms[0].blindsClosedPercent==100);
 assert(c.state().rooms[1].blindsClosedPercent==0);
 assert(c.state().scene==Scene::Custom);
 assert(c.setTargetTenthsC(Room::Bedroom,285)==Result::OutOfRange);
 assert(c.setTargetTenthsC(Room::Bedroom,195)==Result::OK);
 assert(c.setLight(Room::Kitchen,101)==Result::OutOfRange);
 assert(c.setMode(Mode::Eco)==Result::OK && c.airflowM3h()==110);
 c.setVentilation(false);
 c.startBoost(100,1800);
 assert(c.state().ventilation && c.airflowM3h()==350 && c.boostActive());
 assert(c.state().rooms[0].blindsClosedPercent==100);
 c.tick(1899);
 assert(c.boostActive());
 c.tick(1900);
 assert(!c.boostActive() && !c.state().ventilation && c.airflowM3h()==0);
 c.applyScene(Scene::Night);
 assert(c.state().rooms[0].blindsClosedPercent==100);
 assert(c.state().rooms[1].lightPercent==10);
 assert(c.state().rooms[3].blindsClosedPercent==0);
 c.applyScene(Scene::Away);
 assert(c.state().rooms[0].targetTenthsC==170);
 c.setMode(Mode::Manual);assert(c.setManualFlow(260)==Result::OK);
 assert(c.airflowM3h()==260);
 c.startBoost(4000,120);assert(c.airflowM3h()==350);
 c.stopBoost();assert(c.airflowM3h()==260);
 std::cout<<"PASS: room isolation, capabilities, limits, scenes, boost restore, manual airflow\n";
}
