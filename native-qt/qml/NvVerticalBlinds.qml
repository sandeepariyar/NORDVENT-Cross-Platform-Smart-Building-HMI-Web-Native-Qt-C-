import QtQuick
// Repeated raster vertical slats. In v17 0% means fully retracted/open,
// and 100% means slats spread across the authored glazing region.
Item {
    id: blinds
    property real closedPercent: 0
    property int slatCount: 37
    property real slatPitch: 4.2
    property int motionDuration: 470
    property bool animated: true
    property url slatSource: ""
    property real spread: Math.max(0, Math.min(1, closedPercent / 100))
    property real visibleSpread: spread
    Behavior on visibleSpread {
        enabled: blinds.animated
        NumberAnimation { duration: blinds.motionDuration; easing.type: Easing.InOutCubic }
    }
    clip: true
    // The translucent cloth closes with the sliding slat bank, rather than fading all at once.
    Rectangle {
        x: 0; y: 0
        width: Math.min(blinds.width, 3.0 + (blinds.slatCount-1)*blinds.slatPitch*blinds.visibleSpread)
        height: blinds.height
        color: "#506378"
        opacity: 0.44 * blinds.visibleSpread
    }
    Repeater {
        model: blinds.slatCount
        Image {
            x: index * blinds.slatPitch * blinds.visibleSpread
            y: 0
            width: 4
            height: blinds.height
            source: blinds.slatSource
            fillMode: Image.Stretch
            smooth: false
        }
    }
    Rectangle {
        // Moving leading edge makes the progressive fold visually readable.
        x: Math.min(blinds.width - 1, (blinds.slatCount-1)*blinds.slatPitch*blinds.visibleSpread + 2)
        y: 0
        width: 1.0; height: blinds.height
        color: "#d9d4ff"; opacity: .55 * blinds.visibleSpread
    }
}
