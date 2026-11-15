import QtQuick
Item {
    id: slider
    property int value: 40
    property int minimum: 0
    property int maximum: 100
    property color fillColor: "#60dfdf"
    signal moved(int nextValue)
    height: 30
    Rectangle { x: 0; anchors.verticalCenter: parent.verticalCenter; width: parent.width; height: 6; radius: 3; color: "#254758" }
    Rectangle { x: 0; anchors.verticalCenter: parent.verticalCenter; width: Math.max(0, (parent.width - 11) * (slider.value - slider.minimum) / Math.max(1,slider.maximum-slider.minimum)); height: 6; radius: 3; color: slider.fillColor }
    Rectangle { width: 17; height: 17; radius: 9; y: (parent.height-height)/2; x: (parent.width-width) * (slider.value-slider.minimum)/Math.max(1,slider.maximum-slider.minimum); color: "#d5ffff"; border.color: "#48cacc"; border.width: 2 }
    MouseArea {
        anchors.fill: parent
        cursorShape: Qt.PointingHandCursor
        function updateValue(mouseX) {
            const t = Math.max(0, Math.min(1, mouseX/Math.max(1,width)))
            slider.moved(Math.round(slider.minimum+t*(slider.maximum-slider.minimum)))
        }
        onPressed: mouse => updateValue(mouse.x)
        onPositionChanged: mouse => { if(pressed) updateValue(mouse.x) }
    }
}
