import QtQuick

Rectangle {
    id: button
    property string label: ""
    property bool selected: false
    property bool primary: false
    property bool quiet: false
    property int labelSize: 12
    property color accent: "#59dddf"
    signal clicked()
    radius: 9
    color: primary ? "#58dbdd" : selected ? "#145460" : quiet ? "transparent" : "#143347"
    border.width: primary || quiet ? 0 : 1
    border.color: selected ? "#5ce5e6" : "#335c6d"
    Text {
        anchors.centerIn: parent
        text: button.label
        font.family: "Segoe UI"
        font.pixelSize: button.labelSize
        font.weight: Font.DemiBold
        color: button.primary ? "#062c3a" : button.selected ? "#b9ffff" : "#d6f4f8"
    }
    Rectangle { visible: button.selected && !button.primary; anchors.left: parent.left; anchors.right: parent.right; anchors.bottom: parent.bottom; height: 2; radius: 1; color: button.accent }
    MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: button.clicked() }
    Behavior on color { ColorAnimation { duration: 140 } }
}
