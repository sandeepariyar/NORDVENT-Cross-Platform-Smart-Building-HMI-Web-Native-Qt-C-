#pragma once
#include <QObject>
#include <QVariantList>
#include <QVariantMap>
#include <QStringList>
#include <QTimer>
#include <QElapsedTimer>
#include <array>
#include "NordventCore.hpp"
// v17 display/state adapter. Portable nordvent_core remains hardware-independent.
// No browser, WebEngine, networking, particles or JavaScript business model.
class NordventBackend : public QObject {
 Q_OBJECT
 Q_PROPERTY(int page READ page NOTIFY changed)
 Q_PROPERTY(int revision READ revision NOTIFY changed)
 Q_PROPERTY(QVariantList rooms READ rooms NOTIFY changed)
 Q_PROPERTY(QVariantMap focusRoom READ focusRoom NOTIFY changed)
 Q_PROPERTY(QVariantList faultStates READ faultStates NOTIFY changed)
 Q_PROPERTY(int pm25 READ pm25 NOTIFY changed)
 Q_PROPERTY(int voc READ voc NOTIFY changed)
 Q_PROPERTY(int selectedRoom READ selectedRoom NOTIFY changed)
 Q_PROPERTY(int scene READ scene NOTIFY changed)
 Q_PROPERTY(int mode READ mode NOTIFY changed)
 Q_PROPERTY(bool motion READ motion NOTIFY changed)
 Q_PROPERTY(bool effects READ effects NOTIFY changed)
 Q_PROPERTY(bool locked READ locked NOTIFY changed)
 Q_PROPERTY(bool alarm READ alarm NOTIFY changed)
 Q_PROPERTY(bool ventilation READ ventilation NOTIFY changed)
 Q_PROPERTY(bool recovery READ recovery NOTIFY changed)
 Q_PROPERTY(bool iaqAuto READ iaqAuto NOTIFY changed)
 Q_PROPERTY(bool heating READ heating NOTIFY changed)
 Q_PROPERTY(bool hotWater READ hotWater NOTIFY changed)
 Q_PROPERTY(bool waterValve READ waterValve NOTIFY changed)
 Q_PROPERTY(bool boost READ boost NOTIFY changed)
 Q_PROPERTY(bool sensorOffline READ sensorOffline NOTIFY changed)
 Q_PROPERTY(bool hpDefrost READ hpDefrost NOTIFY changed)
 Q_PROPERTY(bool hpFault READ hpFault NOTIFY changed)
 Q_PROPERTY(int flow READ flow NOTIFY changed)
 Q_PROPERTY(int manualFlow READ manualFlow NOTIFY changed)
 Q_PROPERTY(double power READ power NOTIFY changed)
 Q_PROPERTY(double averageTemperature READ averageTemperature NOTIFY changed)
 Q_PROPERTY(int peakCO2 READ peakCO2 NOTIFY changed)
 Q_PROPERTY(int healthCount READ healthCount NOTIFY changed)
 Q_PROPERTY(QString healthLevel READ healthLevel NOTIFY changed)
 Q_PROPERTY(QString toast READ toast NOTIFY changed)
 Q_PROPERTY(QString clock READ clock NOTIFY changed)
 public:
 explicit NordventBackend(QObject* parent=nullptr);
 int page() const {return m_page;}
 int revision() const {return m_revision;}
 QVariantList rooms() const;
 QVariantList faultStates() const;
 int pm25() const { return m_iaqTestStep==2?55:8; }
 int voc() const { return m_iaqTestStep==3?580:120; }
 QVariantMap focusRoom() const {return room(m_room);}
 int selectedRoom() const {return m_room;}
 int scene() const {return m_scene;}
 int mode() const {return m_mode;}
 bool motion() const {return m_motion;}
 bool effects() const {return m_effects;}
 bool locked() const {return m_locked;}
 bool alarm() const {return m_alarm;}
 bool ventilation() const {return m_core.state().ventilation;}
 bool recovery() const {return m_core.state().heatRecovery;}
 bool iaqAuto() const {return m_iaqAuto;}
 bool heating() const {return m_core.state().heating;}
 bool hotWater() const {return m_core.state().hotWater;}
 bool waterValve() const {return m_waterValve;}
 bool boost() const {return m_core.boostActive();}
 bool sensorOffline() const {return m_faults[5];}
 bool hpDefrost() const {return m_defrost;}
 bool hpFault() const {return m_faults[8];}
 int flow() const;
 int manualFlow() const {return m_manualFlow;}
 double power() const;
 double averageTemperature() const;
 int peakCO2() const;
 int healthCount() const;
 QString healthLevel() const;
 QString toast() const {return m_toast;}
 QString clock() const {return m_clock;}
 Q_INVOKABLE QVariantMap room(int idx) const;
 Q_INVOKABLE QString roomName(int idx) const;
 Q_INVOKABLE bool fixtureEnabled(const QString& id) const;
 Q_INVOKABLE void showPage(int index);
 Q_INVOKABLE void selectRoom(int index);
 Q_INVOKABLE void closeRoom();
 Q_INVOKABLE void cycleRoom(int diff);
 Q_INVOKABLE void setLight(int idx, int percent);
 Q_INVOKABLE void setBlinds(int idx, int percent);
 Q_INVOKABLE void stepTarget(int idx, int direction);
 Q_INVOKABLE void setMode(int mode);
 Q_INVOKABLE void setManualFlow(int value);
 Q_INVOKABLE void applyScene(int scene);
 Q_INVOKABLE void setDevice(const QString& device, bool value);
 Q_INVOKABLE void toggleBoost();
 Q_INVOKABLE void toggleFixture(const QString& id);
 Q_INVOKABLE void setFault(int index, bool on);
 Q_INVOKABLE void clearFaults();
 Q_INVOKABLE void setMotion(bool on);
 Q_INVOKABLE void setEffects(bool on);
 Q_INVOKABLE void notify(const QString& text);
 Q_INVOKABLE void clearToast();
 signals: void changed();
 private:
 nordvent::Controller m_core;
 QElapsedTimer m_elapsed;
 QTimer m_tick;
 int m_page=0,m_room=-1,m_scene=0,m_mode=1,m_manualFlow=190,m_revision=0,m_iaqTestStep=0;
 bool m_motion=true,m_effects=true,m_locked=true,m_alarm=false,m_iaqAuto=true,m_waterValve=true,m_defrost=false;
 std::array<bool,10> m_faults{};
 std::array<bool,8> m_fixture{};
 std::array<int,4> m_light{},m_blinds{},m_target{};
 const std::array<double,4> m_measured{20.6,21.8,21.5,19.4};
 const std::array<int,4> m_co2{565,635,724,480};
 QString m_toast,m_clock;
 void syncCore();
 void touch(const QString& message=QString());
};
