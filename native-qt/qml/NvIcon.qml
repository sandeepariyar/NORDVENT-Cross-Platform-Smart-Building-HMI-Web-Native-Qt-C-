import QtQuick
Image {
    property string name: "home"
    property bool active: false
    property bool useWhite: false
    source: Qt.resolvedUrl("../assets/icons/"+name+(useWhite?"_white":active?"_active":"_idle")+".png")
    fillMode: Image.PreserveAspectFit
    sourceSize.width: 48
    sourceSize.height: 48
    smooth: true
    asynchronous: false
}
