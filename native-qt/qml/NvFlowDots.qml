import QtQuick
// Fixed-count dots on authored scene routes. No particles, Canvas or runtime SVG.
Item {
    id: flow
    property var points: [{x:0,y:0},{x:100,y:0}]
    property int dotCount: 8
    property int cycleMs: 2800
    property bool flowing: true
    property color dotColor: "#72eefa"
    property real progress: 0
    property real dotDiameter: 3.5
    property var distances: pathDistances()
    visible: flowing
    NumberAnimation on progress {
        from: 0; to: 1; duration: flow.cycleMs
        loops: Animation.Infinite; running: flow.flowing
    }
    function pathDistances() {
        let cumulative = [0];
        if (!points || points.length < 2) return cumulative;
        for (let i=1; i<points.length; ++i) {
            const dx=points[i].x-points[i-1].x;
            const dy=points[i].y-points[i-1].y;
            cumulative.push(cumulative[i-1]+Math.sqrt(dx*dx+dy*dy));
        }
        return cumulative;
    }
    function pointAt(t) {
        if (!points || points.length < 2 || distances.length < 2) return Qt.point(0,0);
        const length = distances[distances.length-1];
        if (length <= 0) return Qt.point(points[0].x,points[0].y);
        const desired = Math.max(0, Math.min(.999999, t)) * length;
        let j=1;
        while (j<distances.length-1 && distances[j]<desired) ++j;
        const first=points[j-1],second=points[j];
        const segment=distances[j]-distances[j-1];
        const u = segment>0 ? (desired-distances[j-1])/segment : 0;
        return Qt.point(first.x+(second.x-first.x)*u,first.y+(second.y-first.y)*u);
    }
    Repeater {
        model: flow.dotCount
        Rectangle {
            width: flow.dotDiameter
            height: flow.dotDiameter
            radius: flow.dotDiameter/2
            color: flow.dotColor
            opacity: .85
            property real t: (flow.progress + index/Math.max(1,flow.dotCount)) % 1
            property point pt: flow.pointAt(t)
            x: pt.x - width/2; y: pt.y - height/2
        }
    }
}
