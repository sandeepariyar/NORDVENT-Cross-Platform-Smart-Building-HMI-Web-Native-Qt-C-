#include "NordventBackend.hpp"
#include <QDateTime>
#include <algorithm>
#include <cmath>
using nordvent::Room;
using nordvent::Mode;
using nordvent::Scene;
static const char* names[]={"Bedroom","Living Room","Kitchen","Utility"};
NordventBackend::NordventBackend(QObject* parent):QObject(parent) {
 m_elapsed.start();
 m_light={0,100,100,0}; m_blinds={0,0,100,0}; m_target={200,220,210,190};
 m_fixture.fill(true);
 syncCore();
 m_clock=QDateTime::currentDateTime().toString("hh:mm");
 connect(&m_tick,&QTimer::timeout,this,[this]{
   m_clock=QDateTime::currentDateTime().toString("hh:mm");
   m_core.tick(static_cast<uint32_t>(m_elapsed.elapsed()/1000));
   ++m_revision;emit changed();
 }); m_tick.start(1000);
}
void NordventBackend::syncCore() {
 for (int i=0;i<4;i++) {
  m_core.setLight(static_cast<Room>(i),m_light[i]);
  if(i<3)m_core.setBlinds(static_cast<Room>(i),m_blinds[i]);
  m_core.setTargetTenthsC(static_cast<Room>(i),m_target[i]);
 }
 m_core.setMode(static_cast<Mode>(m_mode));
}
void NordventBackend::touch(const QString&message){if(!message.isEmpty())m_toast=message;++m_revision;emit changed();}
QVariantList NordventBackend::rooms() const { QVariantList v; for(int i=0;i<4;i++)v.push_back(room(i)); return v; }
QVariantList NordventBackend::faultStates() const { QVariantList v; for(bool b:m_faults)v.push_back(b);return v; }
QString NordventBackend::roomName(int i) const {return i>=0&&i<4?QString::fromLatin1(names[i]):QString();}
QVariantMap NordventBackend::room(int i) const {
 if(i<0||i>=4)return {};
 return {{"name",roomName(i)},{"key",QStringList{"bedroom","living","kitchen","utility"}.at(i)},
 {"temperature",m_faults[5]?0.0:m_measured[i]},{"sensorValid",!m_faults[5]},{"co2",m_co2[i]},
 {"light",m_light[i]},{"blinds",m_blinds[i]},{"target",m_target[i]/10.0},
 {"occupied",i==1},{"hasBlinds",i<3}};
}
bool NordventBackend::fixtureEnabled(const QString& id) const {
 const QStringList ids={"bedroom_ceiling","bedroom_left_lamp","bedroom_right_lamp","living_ceiling","living_floor_lamp","kitchen_pendants","kitchen_cabinets","utility_worklight"};
 int idx=ids.indexOf(id);return idx>=0?m_fixture[idx]:false;
}
void NordventBackend::showPage(int i){if(i<0||i>5)return;m_page=i;m_room=-1;touch();}
void NordventBackend::selectRoom(int i){if(i<0||i>3)return;m_room=i;m_page=0;touch();}
void NordventBackend::closeRoom(){m_room=-1;touch();}
void NordventBackend::cycleRoom(int d){if(m_room>=0)m_room=(m_room+d+8)%4;touch();}
void NordventBackend::setLight(int i,int v){if(i<0||i>3)return;m_light[i]=std::clamp(v,0,100);m_core.setLight(static_cast<Room>(i),m_light[i]);m_scene=3;touch();}
void NordventBackend::setBlinds(int i,int v){if(i<0||i>2)return;m_blinds[i]=std::clamp(v,0,100);m_core.setBlinds(static_cast<Room>(i),m_blinds[i]);m_scene=3;touch();}
void NordventBackend::stepTarget(int i,int dir){if(i<0||i>3)return;m_target[i]=std::clamp(m_target[i]+dir*5,160,280);m_core.setTargetTenthsC(static_cast<Room>(i),m_target[i]);m_scene=3;touch();}
void NordventBackend::setMode(int v){if(v<0||v>2)return;m_mode=v;m_core.stopBoost();m_core.setMode(static_cast<Mode>(v));m_scene=3;touch();}
void NordventBackend::setManualFlow(int v){m_manualFlow=std::clamp(((v+5)/10)*10,100,300);m_core.setManualFlow(m_manualFlow);m_scene=3;touch();}
void NordventBackend::applyScene(int scene){if(scene<0||scene>2)return;
 m_scene=scene;
 if(scene==0){m_light={0,100,100,0};m_blinds={0,0,100,0};m_target={200,220,210,190};m_mode=1;}
 if(scene==1){m_light={70,35,0,0};m_blinds={100,55,100,0};m_target={190,200,190,180};m_mode=1;}
 if(scene==2){m_light={0,0,0,0};m_blinds={100,100,100,0};m_target={170,170,170,170};m_mode=1;}
 m_core.stopBoost();m_core.setVentilation(true);syncCore();touch(QString("%1 mode applied").arg(QStringList{"Home","Night","Away"}.at(scene)));
}
void NordventBackend::setDevice(const QString&k,bool v) {
 if(k=="ventilation")m_core.setVentilation(v);
 else if(k=="recovery")m_core.setHeatRecovery(v);
 else if(k=="iaq")m_iaqAuto=v;
 else if(k=="heating")m_core.setHeating(v);
 else if(k=="water")m_core.setHotWater(v);
 else if(k=="valve")m_waterValve=v;
 else if(k=="lock")m_locked=v;
 else if(k=="alarm")m_alarm=v;
 else if(k=="defrost")m_defrost=v;
 touch();
}
void NordventBackend::toggleBoost(){if(m_core.boostActive()){m_core.stopBoost();touch("Ventilation boost stopped");}
 else{m_core.startBoost(static_cast<uint32_t>(m_elapsed.elapsed()/1000),1800);touch("Boost ventilation · 30 min");}}
void NordventBackend::toggleFixture(const QString&id) {
 const QStringList ids={"bedroom_ceiling","bedroom_left_lamp","bedroom_right_lamp","living_ceiling","living_floor_lamp","kitchen_pendants","kitchen_cabinets","utility_worklight"};
 int i=ids.indexOf(id);if(i>=0){m_fixture[i]=!m_fixture[i];touch();}
}
void NordventBackend::setFault(int idx,bool v){
 if(idx<0||idx>=10)return;
 if(idx==1) { // Air quality simulation cycles CO2 -> PM2.5 -> VOC -> restored.
   m_iaqTestStep=(m_iaqTestStep+1)%4;
   m_faults[1]=m_iaqTestStep>0;
   touch(m_iaqTestStep==0?"Air quality restored":m_iaqTestStep==1?"High CO2 · simulated":m_iaqTestStep==2?"High PM2.5 · simulated":"High VOC · simulated");
   return;
 }
 m_faults[idx]=v;
 if(idx==7)m_defrost=v;
 touch(v?"Simulated fault enabled":"Simulated fault cleared");
}
void NordventBackend::clearFaults(){m_faults.fill(false);m_iaqTestStep=0;m_defrost=false;m_waterValve=true;touch("Demo faults cleared");}
void NordventBackend::setMotion(bool on){m_motion=on;touch();}
void NordventBackend::setEffects(bool on){m_effects=on;touch();}
void NordventBackend::notify(const QString& msg){touch(msg);}
void NordventBackend::clearToast(){m_toast.clear();++m_revision;emit changed();}
int NordventBackend::peakCO2() const {return m_iaqTestStep==1?1450:724;}
int NordventBackend::flow() const {
 if(!m_core.state().ventilation)return 0;
 if(boost())return 350;
 if(m_iaqAuto&&(m_iaqTestStep>0||peakCO2()>=1100)&&m_mode!=2)return 280;
 if(m_mode==0)return 215;
 if(m_mode==1)return 110;
 return m_manualFlow;
}
double NordventBackend::averageTemperature() const {return (m_measured[0]+m_measured[1]+m_measured[2]+m_measured[3])/4.0;}
double NordventBackend::power() const {double light=0;for(int v:m_light)light+=v/100.0;return 0.15+(ventilation()?flow()*0.0012:0)+(heating()?0.75:0)+(hotWater()?0.2:0)+light*.07;}
int NordventBackend::healthCount() const {int n=0;for(bool f:m_faults)if(f)n++;return n;}
QString NordventBackend::healthLevel() const {if(m_faults[0]||m_faults[2])return "critical";return healthCount()>0?"warning":"ok";}
