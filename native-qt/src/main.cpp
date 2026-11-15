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
    const QString installed = QCoreApplication::applicationDirPath()+"/qml/Main.qml";
    // The QML and image assets are deployed beside the executable by CMake.
    // Avoid compile-time Windows paths: quoted -D macros can break under MinGW.
    const QString source = installed;
    if (!QFileInfo::exists(source)) {
        qCritical().noquote() << "NORDVENT: QML entry point was not deployed:" << source;
        qCritical().noquote() << "Rebuild the NordventDesktop target to copy qml/ and assets/ beside the executable.";
        return 1;
    }
    QObject::connect(&engine, &QQmlApplicationEngine::objectCreationFailed, &app, [] { QCoreApplication::exit(1); }, Qt::QueuedConnection);
    engine.load(QUrl::fromLocalFile(source));
    if (engine.rootObjects().isEmpty()) qCritical() << "Unable to load root QML:" << source;
    return engine.rootObjects().isEmpty()?1:app.exec();
}
