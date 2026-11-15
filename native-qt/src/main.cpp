#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QDir>
#include <QFileInfo>
#include <QUrl>
#include <QDebug>
#include "NordventBackend.hpp"
#ifdef __EMSCRIPTEN__
#include <QJsonArray>
#include <QJsonDocument>
#include <QJsonObject>
#include <emscripten.h>
#endif
int main(int argc,char**argv) {
    QGuiApplication app(argc,argv);
    QGuiApplication::setApplicationName("NORDVENT v17 — Native Qt Quick");
    NordventBackend backend;
    QQmlApplicationEngine engine;
    engine.rootContext()->setContextProperty("nv", &backend);
    QObject::connect(&engine, &QQmlApplicationEngine::objectCreationFailed, &app,
                     [] { QCoreApplication::exit(1); }, Qt::QueuedConnection);
#ifdef __EMSCRIPTEN__
    // Static Qt/QML modules load from the bundled Qt resource system.
    // This is the identical C++ controller and QML display, not HTML recreation.
    engine.loadFromModule("Nordvent", "Main");
#else
    // Preserve the working Windows desktop CMake deployment and editable QML.
    const QString source = QCoreApplication::applicationDirPath()+"/qml/Main.qml";
    if (!QFileInfo::exists(source)) {
        qCritical().noquote() << "NORDVENT: QML entry point was not deployed:" << source;
        qCritical().noquote() << "Rebuild NordventDesktop to copy qml/ and assets/ beside the executable.";
        return 1;
    }
    engine.load(QUrl::fromLocalFile(source));
#endif
#ifdef __EMSCRIPTEN__
    // Read-only diagnostics from the real C++ model. Nothing is routed back
    // into the controller; the browser cannot send commands via this bridge.
    QElapsedTimer diagnosticsUptime;
    diagnosticsUptime.start();
    const auto publishDiagnostics = [&backend, &diagnosticsUptime]() {
        const QJsonObject state{
            {"type", "NORDVENT_NATIVE_STATE"},
            {"schema", 1},
            {"runtime", "qt-wasm"},
            {"revision", backend.revision()},
            {"uptimeMs", static_cast<double>(diagnosticsUptime.elapsed())},
            {"page", backend.page()},
            {"selectedRoom", backend.selectedRoom()},
            {"scene", backend.scene()},
            {"mode", backend.mode()},
            {"flow", backend.flow()},
            {"manualFlow", backend.manualFlow()},
            {"motion", backend.motion()},
            {"effects", backend.effects()},
            {"ventilation", backend.ventilation()},
            {"recovery", backend.recovery()},
            {"heating", backend.heating()},
            {"hotWater", backend.hotWater()},
            {"boost", backend.boost()},
            {"sensorOffline", backend.sensorOffline()},
            {"healthLevel", backend.healthLevel()},
            {"faultCount", backend.healthCount()},
            {"faults", QJsonArray::fromVariantList(backend.faultStates())},
            {"rooms", QJsonArray::fromVariantList(backend.rooms())},
            {"hardwareConnected", false}
        };
        const QByteArray message = QJsonDocument(state).toJson(QJsonDocument::Compact);
        EM_ASM({
            try {
                if (window.parent !== window)
                    window.parent.postMessage(JSON.parse(UTF8ToString($0)), window.location.origin);
            } catch (error) {
                console.warn("NORDVENT native diagnostics bridge:", error);
            }
        }, message.constData());
    };
    QObject::connect(&backend, &NordventBackend::changed, &app, publishDiagnostics);
    QTimer::singleShot(0, &app, publishDiagnostics);
#endif
    if (engine.rootObjects().isEmpty()) qCritical() << "Unable to load NORDVENT root QML";
    return engine.rootObjects().isEmpty()?1:app.exec();
}
