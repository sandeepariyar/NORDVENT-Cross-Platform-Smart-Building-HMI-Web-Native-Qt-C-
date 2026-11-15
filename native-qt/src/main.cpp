#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QDir>
#include <QFileInfo>
#include <QUrl>
#include <QDebug>
#include "NordventBackend.hpp"
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
    if (engine.rootObjects().isEmpty()) qCritical() << "Unable to load NORDVENT root QML";
    return engine.rootObjects().isEmpty()?1:app.exec();
}
