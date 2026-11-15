import QtQuick
import QtQuick.Window
import "NvV17Routes.js" as Routes

Window {
    id: app
    width: 800; height: 480
    minimumWidth: 800; minimumHeight: 480
    maximumWidth: 800; maximumHeight: 480
    visible: true
    title: "NORDVENT v17 | Native Smart Building HMI"
    color: "#061624"
    property color cyan: "#5ce4e7"
    property color ice: "#eafaff"
    property color muted: "#9bbdca"
    property color panel: "#061d2d"
    property bool showDialog: false
    property string dialogName: ""
    property int moreTab: 0
    property int routineTab: 0
    property int currentFault: -1
    property var fixtureDetails: [
        {id:"bedroom_ceiling",name:"Ceiling light",room:0},
        {id:"bedroom_left_lamp",name:"Left bedside lamp",room:0},
        {id:"bedroom_right_lamp",name:"Right bedside lamp",room:0},
        {id:"living_ceiling",name:"Ceiling light",room:1},
        {id:"living_floor_lamp",name:"Floor lamp",room:1},
        {id:"kitchen_pendants",name:"Pendants",room:2},
        {id:"kitchen_cabinets",name:"Cabinet lights",room:2},
        {id:"utility_worklight",name:"Work light",room:3}
    ]
    property int frame: 0
    property var frameNames: ["01","02","03","04","05","06","07","08","09","10","11","12","13","14","15"]
    property var roomNames: ["Bedroom","Living Room","Kitchen","Utility"]
    property var roomIds: ["bedroom","living","kitchen","utility"]
    property var roomIcons: ["bedroom","living","kitchen","utility"]
    property var navNames: ["Home","Rooms","Climate","Energy","Routines","More"]
    property var navIcons: ["home","rooms","fan","energy","clock","more"]
    property var lighting: [
        {id:"bedroom_ceiling",room:0,x:398,y:62,w:318,h:92},
        {id:"bedroom_left_lamp",room:0,x:403,y:65,w:225,h:92},
        {id:"bedroom_right_lamp",room:0,x:469,y:65,w:239,h:91},
        {id:"living_ceiling",room:1,x:390,y:144,w:327,h:89},
        {id:"living_floor_lamp",room:1,x:417,y:146,w:296,h:91},
        {id:"kitchen_pendants",room:2,x:399,y:223,w:236,h:94},
        {id:"kitchen_cabinets",room:2,x:425,y:224,w:216,h:92},
        {id:"utility_worklight",room:3,x:623,y:223,w:113,h:94}
    ]
    function asset(path) { return Qt.resolvedUrl("../assets/"+path) }
    function sceneX() { return nv.selectedRoom===0?-26:nv.selectedRoom===1?-25:nv.selectedRoom===2?-25:nv.selectedRoom===3?-31:[0,-7,-6,-10,-1,-6][nv.page] }
    function sceneY() { return nv.selectedRoom===0?13:nv.selectedRoom===1?2:nv.selectedRoom===2?-12:nv.selectedRoom===3?-12:[0,1,7,-7,0,-3][nv.page] }
    function sceneScale() { return nv.selectedRoom===0?1.074:nv.selectedRoom===1?1.068:nv.selectedRoom===2?1.071:nv.selectedRoom===3?1.076:[1,1.014,1.025,1.025,1.006,1.010][nv.page] }
    function openDialog(name) { dialogName=name;showDialog=true }
    function closeDialog() { showDialog=false;dialogName="" }
    function roomValue(i,field) { return nv.rooms[i][field] }
    Timer { interval: 83; running: nv.motion; repeat: true; onTriggered: { app.frame=(app.frame+1)%15 } }
    Timer { interval: 2700; running: nv.toast!==""; repeat: false; onTriggered: nv.clearToast() }

    // Header: fixed outside camera and outside all effect layers.
    Rectangle { id: header; x:0;y:0;width:800;height:46;color:"#061a2a";z:30
        Rectangle { x:0;y:45;width:800;height:1;color:"#183c4d" }
        Image {x:13;y:10;width:23;height:25;source:app.asset("icons/nordvent_logo.png");fillMode:Image.PreserveAspectFit}
        NvLabel { x:40;y:13;text:"N O R D V E N T";font.pixelSize:12;font.weight:Font.Bold;color:app.ice }
        NvLabel { x:131;y:17;text:"/ CONTROL";font.pixelSize:8;color:"#4c8195" }
        Rectangle { x:197;y:6;width:1;height:33;color:"#17435a" }
        NvLabel { x:211;y:17;text:"MODE";font.pixelSize:9;color:"#739bac" }
        Repeater { model:3
            NvButton { x:246+index*59;y:6;width:55;height:33;radius:18
                label:["Home","Night","Away"][index];labelSize:11
                selected:nv.scene===index;quiet:nv.scene!==index
                onClicked: nv.applyScene(index)
            }
        }
        NvIcon { x:626;y:11;width:20;height:23;name:"snow";useWhite:true }
        NvLabel { x:647;y:14;text:"−12°";font.pixelSize:13;font.weight:Font.Bold;color:app.ice }
        NvLabel { x:680;y:18;text:"demo";font.pixelSize:9;color:"#90b3c3" }
        Rectangle { x:705;y:22;width:5;height:5;radius:3;color:"#ffbd71" }
        NvLabel { x:716;y:19;text:"DEMO";font.pixelSize:9;font.letterSpacing:1.7;color:"#7cbdca" }
        NvLabel { x:757;y:15;width:34;text:nv.clock;font.pixelSize:10;color:app.ice;horizontalAlignment:Text.AlignRight }
    }

    Item { id: workspace; x:0;y:46;width:800;height:375;clip:true
        Rectangle { anchors.fill: parent; color:"#071c2b" }
        // Every architectural object has this single unified 2D camera transform.
        Item {
            id: art
            x: nv.motion ? app.sceneX() : 0
            y: 12 + (nv.motion ? app.sceneY() : 0)
            width:800;height:352
            transform: Scale {
                id: cameraScale
                origin.x:528;origin.y:162
                xScale: nv.motion ? app.sceneScale() : 1
                yScale: xScale
                Behavior on xScale { NumberAnimation { duration: nv.motion?320:0; easing.type:Easing.OutCubic } }
                Behavior on yScale { NumberAnimation { duration: nv.motion?320:0; easing.type:Easing.OutCubic } }
            }
            Behavior on x { NumberAnimation { duration: nv.motion?320:0; easing.type:Easing.OutCubic } }
            Behavior on y { NumberAnimation { duration: nv.motion?320:0; easing.type:Easing.OutCubic } }
            Image {
                anchors.fill:parent
                source:app.asset("sequence/frame_"+app.frameNames[app.frame]+".png")
                fillMode:Image.Stretch
                smooth:true
            }
            // Night/Away architectural shade belongs in the same camera transform.
            Repeater { model: [
                    {x:423,y:77,w:288,h:68}, {x:423,y:154,w:290,h:68},
                    {x:421,y:235,w:218,h:75}, {x:640,y:235,w:74,h:75}
                ]
                Rectangle {x:modelData.x;y:modelData.y;width:modelData.w;height:modelData.h
                    color:"#041426";opacity:nv.scene===1?0.42:nv.scene===2?0.62:0
                    Behavior on opacity {NumberAnimation{duration:nv.motion?250:0}}
                }
            }
            // Independent accurate lighting layers, registered to the authored frame coordinates.
            Repeater { model:app.lighting
                Image {
                    x:modelData.x;y:modelData.y;width:modelData.w;height:modelData.h
                    source:app.asset("lighting/"+modelData.id+"_on.png")
                    property real luminance: nv.rooms[modelData.room].light/100
                    opacity: nv.fixtureEnabled(modelData.id) ? luminance : 0
                    fillMode:Image.Stretch
                    smooth:true
                    Behavior on opacity { NumberAnimation { duration:nv.motion?280:0 } }
                }
            }
            Image { x:0;y:0;width:800;height:352;source:app.asset("fx/airFx.png");opacity:nv.effects&&nv.ventilation ? (nv.boost ? 0.98 : 0.64) : 0
                Behavior on opacity { NumberAnimation {duration:250} } }
            Image { x:0;y:0;width:800;height:352;source:app.asset("fx/recoveryFx.png");opacity:nv.effects&&nv.ventilation&&nv.recovery ? 0.72 : 0 }
            Image { x:0;y:0;width:800;height:352;source:app.asset("fx/heatFx.png");opacity:nv.effects&&nv.heating&&!nv.hpDefrost ? 0.82 : 0 }
            Image { x:0;y:0;width:800;height:352;source:app.asset("fx/waterFx.png");opacity:nv.effects&&nv.hotWater&&nv.waterValve ? 0.9 : 0 }
            Image { x:0;y:0;width:800;height:352;source:app.asset("fx/defrostFx.png");opacity:nv.effects&&nv.hpDefrost ? 0.92 : 0 }
            Image { x:0;y:0;width:800;height:352;source:app.asset("fx/leaderLines.png");opacity:nv.page===0&&nv.selectedRoom<0 ? 0.85 : 0 }
            // Three v17 physical glazing banks. A SINGLE 4x72 raster slat is reused
            // throughout; the slats stack and spread as blinds fold/unfold.
            Repeater {
                model: [
                    {x:456,y:80,w:154,h:64,room:0,count:37},
                    {x:448,y:157,w:166,h:67,room:1,count:40},
                    {x:446,y:238,w:138,h:71,room:2,count:33}
                ]
                NvVerticalBlinds {
                    x:modelData.x; y:modelData.y
                    width:modelData.w; height:modelData.h
                    slatCount:modelData.count
                    closedPercent:nv.rooms[modelData.room].blinds
                    animated:nv.motion
                    slatSource:app.asset("fx/vertical_blind_slat.png")
                }
            }
            // Original v17 rooftop fan is now independent from the static duct image.
            // Its authored hub is (628, 37) in the 800x352 scene coordinates.
            Item {
                x:604; y:13; width:48; height:48
                visible: nv.effects && nv.ventilation
                Image { anchors.fill:parent;source:app.asset("fx/fan_ring.png");smooth:true }
                Image {
                    anchors.fill:parent
                    source:app.asset("fx/fan_blades.png")
                    smooth:true
                    RotationAnimation on rotation {
                        from:0; to:360
                        duration: nv.boost ? 1100 : nv.mode===1 ? 3600 : 2300
                        loops: Animation.Infinite
                        running: nv.motion && nv.effects && nv.ventilation
                    }
                }
            }
            // All dot routes are sampled from the ORIGINAL v17 SVG geometry,
            // not manually approximated paths. The dots move at uniform distance/s.
            NvFlowDots {
                flowing:nv.motion && nv.effects && nv.ventilation
                cycleMs:nv.boost?1400:nv.mode===1?3700:2700
                dotCount:9
                points:Routes.air1
                dotColor:"#a3ffff"
            }
            NvFlowDots {
                flowing:nv.motion && nv.effects && nv.ventilation
                cycleMs:nv.boost?1300:nv.mode===1?3600:2500
                dotCount:6
                points:Routes.air2
                dotColor:"#9df6f7"
            }
            NvFlowDots {
                flowing:nv.motion && nv.effects && nv.ventilation
                cycleMs:nv.boost?1300:nv.mode===1?3600:2500
                dotCount:6
                points:Routes.air3
                dotColor:"#9df6f7"
            }
            NvFlowDots {
                flowing:nv.motion && nv.effects && nv.recovery && nv.ventilation
                cycleMs:2600;dotCount:3;points:Routes.recoveryCool1
                dotColor:"#8bffff";dotDiameter:3
            }
            NvFlowDots {
                flowing:nv.motion && nv.effects && nv.recovery && nv.ventilation
                cycleMs:2600;dotCount:3;points:Routes.recoveryWarm1
                dotColor:"#ffc88a";dotDiameter:3
            }
            NvFlowDots {
                flowing:nv.motion && nv.effects && nv.heating && !nv.hpDefrost
                cycleMs:2600;dotCount:3;points:Routes.heat1
                dotColor:"#ffbf78";dotDiameter:3
            }
            NvFlowDots {
                flowing:nv.motion && nv.effects && nv.heating && !nv.hpDefrost
                cycleMs:2800;dotCount:3;points:Routes.heat2
                dotColor:"#ffbf78";dotDiameter:3
            }
            NvFlowDots {
                flowing:nv.motion && nv.effects && nv.heating && !nv.hpDefrost
                cycleMs:3300;dotCount:7;points:Routes.heat3
                dotColor:"#ffbf78";dotDiameter:3
            }
            NvFlowDots {
                flowing:nv.motion && nv.effects && nv.hotWater && nv.waterValve
                cycleMs:2600;dotCount:4;points:Routes.water1
                dotColor:"#71a9ff";dotDiameter:3
            }
            // Fault indicators follow the relevant equipment/room; these are simulations.
            Repeater { model: [
                    {idx:0,x:670,y:268,text:"!"},
                    {idx:2,x:542,y:270,text:"!"},
                    {idx:3,x:684,y:282,text:"!"},
                    {idx:4,x:522,y:193,text:"!"},
                    {idx:8,x:606,y:33,text:"!"}
                ]
                Rectangle { visible:nv.faultStates[modelData.idx];x:modelData.x;y:modelData.y
                    width:22;height:22;radius:11;color:"#9b2035";border.color:"#ffb0b0"
                    NvLabel {anchors.centerIn:parent;text:modelData.text;font.pixelSize:14;font.weight:Font.Bold;color:"#fff7f7"}
                }
            }
            // Selected room focus outline is part of the architectural transform.
            Rectangle {
                visible:nv.selectedRoom>=0
                x:nv.selectedRoom===3?641:nv.selectedRoom===2?421:423
                y:nv.selectedRoom===0?78:nv.selectedRoom===1?155:235
                width:nv.selectedRoom===3?74:nv.selectedRoom===2?218:290
                height:nv.selectedRoom===2||nv.selectedRoom===3?75:68
                color:"#1bcae4"
                opacity:.23
                border.width:2;border.color:"#74eff1"
            }
            // Room selection zones track the building's camera, not screen controls.
            Repeater { model:[{x:423,y:77,w:288,h:68},{x:423,y:154,w:290,h:68},{x:421,y:235,w:218,h:75},{x:640,y:235,w:74,h:75}]
                MouseArea { x:modelData.x;y:modelData.y;width:modelData.w;height:modelData.h
                    enabled:nv.page===0||nv.page===1
                    cursorShape:Qt.PointingHandCursor
                    onClicked:nv.selectRoom(index)
                }
            }
        }
        // Persistent security/status dock is screen-anchored and never camera-scaled.
        Row { x:643;y:12;width:145;height:44;spacing:5;z:18
            Repeater { model:3
                Rectangle { width:44;height:44;radius:12;color:"#d6071d2c"
                    NvIcon { anchors.centerIn:parent;width:22;height:22
                        name:index===0?(nv.locked?"nv-lock":"nv-unlock"):index===1?(nv.alarm?"nv-shield":"nv-shield-idle"):"nv-system"
                        active:index===0?nv.locked:index===1?nv.alarm:nv.healthLevel==="ok"
                    }
                    Rectangle { visible:index===2&&nv.healthCount>0;x:34;y:6;width:6;height:6;radius:3;color:nv.healthLevel==="critical"?"#ff8386":"#ffc274" }
                    MouseArea { anchors.fill:parent;onClicked:app.openDialog(index===0?"lock":index===1?"alarm":"health") }
                }
            }
        }
        // View-specific control surface. Re-instantiated on view change; shared state stays in C++.
        Loader {
            id:screenLoader
            anchors.fill:parent
            z:16
            sourceComponent: nv.selectedRoom>=0 ? focusComponent : nv.page===0?homeComponent:nv.page===1?roomsComponent:nv.page===2?climateComponent:nv.page===3?energyComponent:nv.page===4?routinesComponent:moreComponent
            onLoaded: {if(nv.motion) screenEnter.restart()}
            NumberAnimation {id:screenEnter;target:screenLoader;property:"opacity";from:0.68;to:1.0;duration:190;easing.type:Easing.OutCubic}
        }
        // Contextual toast is not part of the camera.
        Rectangle { visible:nv.toast!=="";z:24;width:Math.min(450,toastLabel.implicitWidth+28);height:32;radius:7;color:"#104654";border.color:"#4cb9c4";anchors.horizontalCenter:parent.horizontalCenter;y:336
            NvLabel { id:toastLabel;anchors.centerIn:parent;text:nv.toast;font.pixelSize:11 }
            MouseArea {anchors.fill:parent;onClicked:nv.clearToast()}
        }
    }

    // Original fixed 59px v17 navigation, with 6 44+ px touch surfaces.
    Rectangle { x:0;y:421;width:800;height:59;color:"#061825";z:30
        Rectangle { x:0;y:0;width:800;height:1;color:"#214659" }
        Repeater { model:6
            Item { x:13+index*131;y:1;width:121;height:57
                Rectangle {x:50;y:0;width:23;height:2;color:app.cyan;visible:nv.page===index&&nv.selectedRoom<0}
                NvIcon {x:51;y:12;width:19;height:19;name:app.navIcons[index];active:nv.page===index&&nv.selectedRoom<0}
                NvLabel { x:0;y:34;width:121;height:18;horizontalAlignment:Text.AlignHCenter;text:app.navNames[index];font.pixelSize:11;font.weight:nv.page===index&&nv.selectedRoom<0?Font.Bold:Font.Normal;color:nv.page===index&&nv.selectedRoom<0?"#effeff":"#9cbdce" }
                MouseArea { anchors.fill:parent;onClicked:nv.showPage(index) }
            }
        }
    }

    Component { id:homeComponent
        Item {
            Rectangle { x:0;y:0;width:214;height:364;color:"#de061c2d" }
            NvLabel { x:16;y:17;text:"B U I L D I N G   ·   D E M O";font.pixelSize:8;font.weight:Font.Bold;color:"#7acdd2" }
            NvLabel { x:16;y:40;text:"At a glance.";font.pixelSize:24;font.weight:Font.Bold;color:app.ice }
            Repeater {model:[{name:"Indoor",val:(nv.sensorOffline ? "—" : nv.averageTemperature.toFixed(1)+"°"),detail:"4 rooms"},{name:"CO₂ peak",val:(nv.sensorOffline ? "—" : nv.peakCO2+""),detail:"Good"},{name:"Power",val:nv.power.toFixed(1),detail:"Estimated"},{name:"Airflow",val:nv.flow+"",detail:nv.mode===1?"Eco":"Auto"}]
                Item { x:17+(index%2)*91;y:89+Math.floor(index/2)*76;width:87;height:68
                    NvLabel {x:0;y:0;text:modelData.name;font.pixelSize:10;color:app.muted}
                    NvLabel {x:0;y:17;text:modelData.val;font.pixelSize:21;font.weight:Font.Bold;color:app.ice}
                    NvLabel {x:0;y:42;text:modelData.detail;font.pixelSize:9;color:"#72c1b2"}
                    Rectangle {visible:index%2===0;x:83;y:0;height:48;width:1;color:"#355666"}
                    NvLabel {visible:index===1;x:45;y:25;text:"ppm";font.pixelSize:9;color:app.muted}
                    NvLabel {visible:index===2;x:36;y:25;text:"kW";font.pixelSize:9;color:app.muted}
                    NvLabel {visible:index===3;x:40;y:25;text:"m³/h";font.pixelSize:9;color:app.muted}
                }
            }
            NvButton { x:16;y:239;width:182;height:44;primary:true;label:nv.boost?"Stop fresh air boost":"≋   Fresh air · 30m";onClicked:nv.toggleBoost() }
            // Room pills float directly over windows; the art remains tappable.
            Repeater { model:[{name:"Bedroom",x:303,y:115},{name:"Living Room",x:302,y:194},{name:"Kitchen",x:303,y:273}]
                Rectangle {x:modelData.x;y:modelData.y;width:index===1?105:96;height:40;radius:20;color:"#dc082a3b";border.color:"#468396"
                    Rectangle{x:15;y:17;width:7;height:7;radius:4;color:"#69e6e2"}
                    NvLabel {x:29;y:0;height:40;text:modelData.name;font.pixelSize:11;font.weight:Font.Bold;color:app.ice}
                    MouseArea {anchors.fill:parent;onClicked:nv.selectRoom(index)}
                }
            }
            Rectangle {x:594;y:340;width:198;height:27;radius:13;color:"#d80a2737"
                Repeater {model:[{text:"Air",c:"#5aebec",x:10},{text:"Heat",c:"#ffb66c",x:59},{text:"Light",c:"#f8d681",x:113},{text:"Blinds",c:"#b3a5ff",x:164}]
                    Item {x:modelData.x;y:0;width:48;height:27
                        Rectangle {x:0;y:11;width:7;height:7;radius:4;color:modelData.c}
                        NvLabel {x:11;y:5;height:18;text:modelData.text;font.pixelSize:9;color:"#a8c6d2"}
                    }
                }
            }
        }
    }

    Component { id:roomsComponent
        Item {
            Rectangle {x:0;y:0;width:238;height:375;color:"#e8061e2f"}
            NvLabel {x:16;y:16;text:"S P A C E S";font.pixelSize:9;font.weight:Font.Bold;color:"#79cdd3"}
            NvLabel {x:16;y:35;text:"Rooms";font.pixelSize:25;font.weight:Font.Bold;color:app.ice}
            NvLabel {x:185;y:47;text:"4 zones";font.pixelSize:10;color:app.muted}
            Repeater {model:4
                Rectangle {x:16;y:82+index*65;width:208;height:59;radius:10;color:"#df0d2f40"
                    Image {x:5;y:5;width:50;height:49;source:app.asset("room_icons/"+app.roomIds[index]+".png");fillMode:Image.PreserveAspectFit}
                    NvLabel {x:60;y:12;text:app.roomNames[index];font.pixelSize:12;font.weight:Font.Bold;color:app.ice}
                    NvLabel {x:60;y:30;text:nv.rooms[index].co2+" ppm · Lights "+(nv.rooms[index].light>0?"on":"off");font.pixelSize:9;color:app.muted}
                    NvLabel {x:152;y:15;width:49;text:nv.rooms[index].sensorValid?nv.rooms[index].temperature.toFixed(1)+"°":"—";font.pixelSize:13;font.weight:Font.Bold;color:"#8df1e5";horizontalAlignment:Text.AlignRight}
                    NvLabel {x:202;y:18;text:"›";font.pixelSize:17;color:app.ice}
                    MouseArea {anchors.fill:parent;onClicked:nv.selectRoom(index)}
                }
            }
            NvLabel {x:16;y:338;text:"●  Select a room or tap the house";font.pixelSize:9;color:"#a1c8d2"}
        }
    }

    Component { id:focusComponent
        Item {
            property var r: nv.focusRoom
            property int rid: nv.selectedRoom
            Rectangle {x:0;y:0;width:228;height:375;color:"#ee061e2f"}
            NvLabel {x:14;y:13;text:"R O O M   C O N T R O L";font.pixelSize:8;color:"#82d5da";font.weight:Font.Bold}
            NvButton {x:182;y:8;width:31;height:28;label:"×";labelSize:19;onClicked:nv.closeRoom()}
            NvButton {x:14;y:37;width:29;height:32;label:"‹";labelSize:24;onClicked:nv.cycleRoom(-1)}
            NvLabel {x:49;y:39;width:132;text:r.name;font.pixelSize:19;font.weight:Font.Bold;color:app.ice;horizontalAlignment:Text.AlignHCenter}
            NvButton {x:185;y:37;width:29;height:32;label:"›";labelSize:24;onClicked:nv.cycleRoom(1)}
            NvLabel {x:14;y:70;text:r.sensorValid?r.temperature.toFixed(1)+"°":"—";font.pixelSize:20;font.weight:Font.Bold;color:app.ice}
            NvLabel {x:174;y:75;width:39;text:r.co2+" ppm";font.pixelSize:9;color:app.muted;horizontalAlignment:Text.AlignRight}
            Repeater {model:4
                Rectangle {x:14+index*51;y:105;width:46;height:47;radius:8;color:rid===index?"#14545d":"#0b293a";border.color:rid===index?"#63f1ee":"#265265";border.width:1
                    Image {x:9;y:5;width:28;height:24;source:app.asset("room_icons/"+app.roomIds[index]+".png");fillMode:Image.PreserveAspectFit}
                    NvLabel {x:0;y:32;width:46;text:["Bed","Living","Kitchen","Utility"][index];font.pixelSize:8;horizontalAlignment:Text.AlignHCenter;color:rid===index?"#c4ffff":app.muted}
                    MouseArea {anchors.fill:parent;onClicked:nv.selectRoom(index)}
                }
            }
            Rectangle {x:14;y:156;width:200;height:1;color:"#2b5061"}
            NvLabel {x:14;y:165;text:"Target";font.pixelSize:11;color:"#c5e8ef"}
            NvLabel {x:171;y:164;width:43;text:r.target.toFixed(1)+"°";horizontalAlignment:Text.AlignRight;font.pixelSize:13;font.weight:Font.Bold;color:app.ice}
            NvButton {x:14;y:188;width:98;height:31;label:"−";labelSize:20;onClicked:nv.stepTarget(rid,-1)}
            NvButton {x:117;y:188;width:97;height:31;label:"+";labelSize:20;onClicked:nv.stepTarget(rid,1)}
            Rectangle {x:14;y:226;width:200;height:1;color:"#29495b"}
            NvLabel {x:14;y:232;text:"♧  Lights";font.pixelSize:11;color:app.ice}
            NvLabel {x:128;y:232;width:30;text:r.light+"%";horizontalAlignment:Text.AlignRight;font.pixelSize:10;color:"#8ae9df"}
            NvLabel {x:167;y:231;width:47;text:"Details ›";horizontalAlignment:Text.AlignRight;font.pixelSize:9;color:"#85dfe1"
                MouseArea { anchors.fill:parent;onClicked:app.openDialog("fixtures") }
            }
            NvButton {x:14;y:253;width:34;height:27;label:"Off";labelSize:10;selected:r.light===0;onClicked:nv.setLight(rid,0)}
            NvSlider {x:55;y:253;width:119;height:27;value:r.light;onMoved:v=>nv.setLight(rid,v)}
            NvButton {x:181;y:253;width:34;height:27;label:"On";labelSize:10;selected:r.light>0;onClicked:nv.setLight(rid,100)}
            Rectangle {x:14;y:289;width:200;height:1;color:"#29495b"}
            NvLabel {x:14;y:297;text:"▤  Blinds";font.pixelSize:11;color:app.ice}
            NvLabel {x:171;y:297;width:43;text:r.hasBlinds?(r.blinds===0?"Open":r.blinds+"%"):"—";horizontalAlignment:Text.AlignRight;font.pixelSize:10;color:app.muted}
            Repeater {model:3
                NvButton { x:14+index*68;y:319;width:63;height:29;label:["Open","50%","Close"][index];labelSize:10
                    selected:r.hasBlinds&&r.blinds===[0,50,100][index]
                    onClicked: {if(r.hasBlinds)nv.setBlinds(rid,[0,50,100][index])}
                }
            }
        }
    }

    Component { id:climateComponent
        Item {
            Rectangle {x:0;y:0;width:252;height:375;color:"#f5071f2f"}
            NvLabel {x:17;y:19;text:"V E N T I L A T I O N  /  C O N T R O L S";font.pixelSize:8;color:"#83dbe0";font.weight:Font.Bold}
            NvLabel {x:17;y:37;text:"Climate";font.pixelSize:26;font.weight:Font.Bold;color:app.ice}
            NvLabel {x:196;y:52;text:nv.ventilation?"Running":"Stopped";font.pixelSize:10;color:app.muted}
            Repeater {model:[{icon:"fan",name:"Fan",device:"ventilation",status:nv.ventilation},{icon:"air",name:"Heat recovery",device:"recovery",status:nv.recovery},{icon:"air",name:"Air quality auto",device:"iaq",status:nv.iaqAuto}]
                Item {x:17;y:95+index*60;width:218;height:57
                    NvIcon {x:0;y:18;width:18;height:18;name:modelData.icon;active:true}
                    NvLabel {x:26;y:8;height:40;text:modelData.name;font.pixelSize:12;font.weight:Font.DemiBold;color:app.ice}
                    NvButton {x:133;y:8;width:85;height:42;label:modelData.status?"On":"Off";selected:modelData.status
                        onClicked:nv.setDevice(modelData.device,!modelData.status)}
                    Rectangle {x:0;y:56;width:218;height:1;color:"#27485a"}
                }
            }
            NvButton {x:17;y:288;width:218;height:51;primary:true;label:nv.boost?"Stop boost":"♧   Boost ventilation     30 min";labelSize:11;onClicked:nv.toggleBoost()}
            // On the building-side HUD, mode selection mirrors v17 spatial control.
            Rectangle {x:282;y:105;width:228;height:nv.mode===2?175:130;radius:9;color:"#c7071f2b"}
            Rectangle {x:295;y:119;width:6;height:6;radius:3;color:app.cyan}
            NvLabel {x:307;y:115;text:"A I R F L O W";font.pixelSize:9;font.weight:Font.Bold;color:"#b1f4f0"}
            NvLabel {x:480;y:115;text:["AUTO","ECO","MANUAL"][nv.mode];font.pixelSize:8;color:app.muted;horizontalAlignment:Text.AlignRight;width:28}
            NvLabel {x:295;y:134;text:String(nv.flow);font.pixelSize:44;font.weight:Font.Bold;color:app.ice}
            NvLabel {x:382;y:154;text:"m³/h";font.pixelSize:14;font.weight:Font.Bold;color:app.cyan}
            Repeater {model:3
                NvButton {x:294+index*69;y:189;width:65;height:43;label:["Eco","Auto","Manual"][index];labelSize:10;selected:nv.mode===[1,0,2][index]
                    onClicked:nv.setMode([1,0,2][index])}
            }
            NvSlider {visible:nv.mode===2;x:297;y:245;width:202;height:28;value:nv.manualFlow;minimum:100;maximum:300;onMoved:v=>nv.setManualFlow(v)}
            NvLabel {visible:nv.mode===2;x:298;y:268;text:"Manual airflow " + nv.manualFlow + " m³/h";font.pixelSize:9;color:app.ice}
            NvLabel {visible:nv.sensorOffline;x:294;y:284;text:"Sensor unavailable · simulated";font.pixelSize:9;color:"#ffb776"}
        }
    }

    Component { id:energyComponent
        Item {
            Rectangle {x:0;y:0;width:252;height:375;color:"#f5071f2f"}
            NvLabel {x:17;y:19;text:"E N E R G Y  /  C O N T R O L S";font.pixelSize:8;color:"#8bd3d9";font.weight:Font.Bold}
            NvLabel {x:17;y:37;text:"Energy";font.pixelSize:26;font.weight:Font.Bold;color:app.ice}
            NvLabel {x:189;y:52;text:"Estimated";font.pixelSize:10;color:app.muted}
            Repeater {model:[{icon:"temp",name:"Heating",device:"heating",on:nv.heating},{icon:"water",name:"Hot water",device:"water",on:nv.hotWater},{icon:"water",name:"Water valve",device:"valve",on:nv.waterValve}]
                Item {x:17;y:95+index*60;width:218;height:57
                    NvIcon {x:0;y:18;width:19;height:19;name:modelData.icon;active:true}
                    NvLabel {x:26;y:8;height:40;text:modelData.name;font.pixelSize:12;font.weight:Font.DemiBold;color:app.ice}
                    NvButton {x:133;y:8;width:85;height:42;label:index===2?(modelData.on?"Open":"Closed"):(modelData.on?"On":"Off");selected:modelData.on
                        onClicked:{ if(modelData.device==="valve")app.openDialog("valve");else nv.setDevice(modelData.device,!modelData.on) }}
                    Rectangle {x:0;y:56;width:218;height:1;color:"#27485a"}
                }
            }
            NvLabel {x:17;y:289;text:"♧  Heat pump";font.pixelSize:11;color:app.muted}
            NvLabel {x:171;y:289;text:nv.hpFault?"Fault":nv.hpDefrost?"Defrost":"Running";font.pixelSize:11;font.weight:Font.Bold;color:nv.hpFault?"#ff9292":app.ice}
            Rectangle {x:17;y:325;width:218;height:40;radius:9;color:"#092b3c";border.color:"#275268"
                NvLabel {anchors.centerIn:parent;text:"ⓘ  System health  ›";font.pixelSize:11;color:"#a8d8df"}
                MouseArea {anchors.fill:parent;onClicked:app.openDialog("health")}
            }
            Rectangle {x:282;y:117;width:229;height:148;radius:9;color:"#bd081e2d"}
            Rectangle {x:295;y:132;width:6;height:6;radius:3;color:"#ffb969"}
            NvLabel {x:307;y:127;text:"P O W E R  N O W";font.pixelSize:9;font.weight:Font.Bold;color:"#cfe5e9"}
            NvLabel {x:426;y:128;text:"DEMO ESTIMATE";font.pixelSize:8;color:app.muted}
            NvLabel {x:294;y:143;text:nv.power.toFixed(1);font.pixelSize:43;font.weight:Font.Bold;color:app.ice}
            NvLabel {x:383;y:169;text:"kW";font.pixelSize:14;font.weight:Font.Bold;color:"#ffc17f"}
            Rectangle {x:294;y:202;width:98;height:25;radius:5;color:"#d9173649"}
            NvLabel {x:302;y:203;text:"♧ Heat";font.pixelSize:10;color:app.muted}
            NvLabel {x:371;y:203;text:nv.heating?"On":"Off";font.pixelSize:10;font.weight:Font.Bold;color:app.ice}
            Rectangle {x:397;y:202;width:107;height:25;radius:5;color:"#d9173649"}
            NvLabel {x:403;y:203;text:"♢ Water";font.pixelSize:10;color:app.muted}
            NvLabel {x:473;y:203;text:nv.hotWater&&nv.waterValve?"On":"Off";font.pixelSize:10;font.weight:Font.Bold;color:app.ice}
            Rectangle {x:295;y:240;width:207;height:5;radius:2;color:"#244250"}
            Rectangle {x:295;y:240;width:nv.heating?102:10;height:5;radius:2;color:"#f6b16a"}
            Rectangle {x:399;y:240;width:nv.hotWater?70:0;height:5;radius:2;color:"#8baefa"}
        }
    }

    Component { id:routinesComponent
        Item {
            Rectangle {x:0;y:0;width:415;height:375;color:"#e8071e2d"}
            NvLabel {x:19;y:19;text:"S C H E D U L E  /  S C E N E S";font.pixelSize:9;font.weight:Font.Bold;color:"#81d4d8"}
            NvLabel {x:19;y:38;text:"Routines";font.pixelSize:25;font.weight:Font.Bold;color:app.ice}
            NvLabel {x:19;y:82;text:"Building scenes";font.pixelSize:12;font.weight:Font.Bold;color:app.ice}
            Repeater {model:[{name:"Home",caption:"Comfort in occupied spaces",scene:0},{name:"Night",caption:"Quiet sleep environment",scene:1},{name:"Away",caption:"Lower energy when empty",scene:2}]
                Rectangle {x:18;y:105+index*72;width:378;height:64;radius:10;color:nv.scene===index?"#ed104553":"#df0e293a";border.color:nv.scene===index?"#5bdcda":"#29485b"
                    NvIcon {x:14;y:14;width:34;height:34;name:["home","moon","nv-lock"][index];active:nv.scene===index}
                    NvLabel {x:58;y:11;text:modelData.name;font.pixelSize:15;font.weight:Font.Bold;color:app.ice}
                    NvLabel {x:58;y:33;text:modelData.caption;font.pixelSize:10;color:app.muted}
                    NvLabel {x:320;y:14;text:nv.scene===index?"ACTIVE":"APPLY";font.pixelSize:9;color:nv.scene===index?"#9cfff5":"#acd4dd"}
                    MouseArea {anchors.fill:parent;onClicked:nv.applyScene(index)}
                }
            }
            NvLabel {x:18;y:331;text:"All schedules and values are simulated.";font.pixelSize:10;color:app.muted}
        }
    }

    Component { id:moreComponent
        Item {
            Rectangle {x:0;y:0;width:451;height:375;color:"#f2071e2d"}
            NvLabel {x:18;y:15;text:"B U I L D I N G   /   S Y S T E M";font.pixelSize:9;color:"#8fdee0"}
            NvLabel {x:18;y:34;text:"More";font.pixelSize:25;font.weight:Font.Bold;color:app.ice}
            Repeater {model:["Status","FX","Health","Tests"]
                NvButton {x:16+index*105;y:76;width:100;height:35;label:modelData;labelSize:11;selected:app.moreTab===index;onClicked:app.moreTab=index}
            }
            Item {x:18;y:125;width:415;height:231;visible:app.moreTab===2
                NvLabel {x:0;y:0;text:"System health";font.pixelSize:16;font.weight:Font.Bold;color:app.ice}
                NvLabel {x:0;y:29;text:nv.healthCount===0?"All systems nominal · simulated":nv.healthCount+" active simulated alert(s)";font.pixelSize:12;color:nv.healthCount===0?"#92edce":"#ffc27c"}
                NvLabel {x:0;y:67;text:"Sensors     "+(nv.sensorOffline?"Unavailable":"Demo values")+"\nCO₂ peak     "+(nv.sensorOffline?"—":nv.peakCO2+" ppm")+" · PM2.5 "+nv.pm25+" · VOC "+nv.voc+"\nHeating     "+(nv.hpDefrost?"Defrost":nv.hpFault?"Service required":"Nominal")+"\nWater valve     "+(nv.waterValve?"Open":"Closed");font.pixelSize:12;lineHeight:1.8;color:app.muted}
                NvButton {x:0;y:184;width:165;height:37;label:"Clear demo faults";onClicked:nv.clearFaults()}
            }
            Item {x:18;y:125;width:415;height:231;visible:app.moreTab===3
                NvLabel {text:"SIMULATED FAULTS · Test safely";font.pixelSize:11;color:app.muted}
                Repeater {model:["Water leak","High CO₂","Smoke / CO","Frost","Open window","Sensor offline","Dirty filter","Heat-pump defrost","Heat-pump fault","Peak tariff"]
                    NvButton {x:(index%2)*202;y:27+Math.floor(index/2)*38;width:194;height:34;label:modelData;labelSize:10
                        selected:nv.faultStates[index]
                        onClicked: nv.setFault(index,!nv.faultStates[index])
                    }
                }
            }
            Item {x:18;y:125;width:415;height:231;visible:app.moreTab===1
                NvLabel {text:"DISPLAY & EFFECTS";font.pixelSize:11;color:app.muted}
                NvButton {x:0;y:41;width:178;height:44;label:nv.motion?"Motion · On":"Motion · Off";selected:nv.motion;onClicked:nv.setMotion(!nv.motion)}
                NvButton {x:191;y:41;width:178;height:44;label:nv.effects?"Building FX · On":"Building FX · Off";selected:nv.effects;onClicked:nv.setEffects(!nv.effects)}
                NvLabel {x:0;y:105;width:398;wrapMode:Text.WordWrap;text:"15-frame original building image sequence, aligned light/heat/water overlays, camera presets and simple non-particle airflow dots.";font.pixelSize:12;color:app.muted}
            }
            Item {x:18;y:125;width:415;height:231;visible:app.moreTab===0
                NvLabel {text:"NORDVENT v17 · NATIVE QML";font.pixelSize:15;font.weight:Font.Bold;color:app.ice}
                NvLabel {y:43;width:385;wrapMode:Text.WordWrap;text:"Qt Quick / C++17 desktop engineering preview. The UI currently uses simulated telemetry; it has no connected actuators or sensors. Intended for eventual MCU adaptation after target hardware validation.";font.pixelSize:12;color:app.muted}
                NvLabel {y:145;text:"Door: "+(nv.locked?"Locked":"Unlocked")+" · Alarm: "+(nv.alarm?"Armed":"Disarmed");font.pixelSize:11;color:"#98dedd"}
                NvLabel {y:176;text:"Fixed canvas 800 × 480 · All assets offline";font.pixelSize:11;color:app.muted}
            }
        }
    }

    // One modal system for security confirmations, health and valve actions.
    Rectangle {id:dialogOverlay;anchors.fill:parent;color:"#de020b13";visible:app.showDialog;z:80
        Rectangle {x:185;y:84;width:430;height:312;radius:13;color:"#0b2a3b";border.color:"#3d8291";border.width:1
            NvLabel {x:20;y:16;text:app.dialogName==="lock"?"Door security":app.dialogName==="alarm"?"Alarm system":app.dialogName==="valve"?"Water valve":app.dialogName==="health"?"System health":app.dialogName==="fixtures"?"Individual room lights":"NORDVENT";font.pixelSize:20;font.weight:Font.Bold;color:app.ice}
            NvButton {x:379;y:12;width:33;height:33;label:"×";labelSize:20;onClicked:app.closeDialog()}
            NvLabel {x:21;y:68;width:387;height:90;wrapMode:Text.WordWrap;font.pixelSize:13;color:"#b5d6e0";visible:app.dialogName!=="fixtures";text:
                app.dialogName==="lock"?(nv.locked?"The door is currently locked. Unlock the simulated door?":"The door is unlocked. Lock the simulated door?"):
                app.dialogName==="alarm"?(nv.alarm?"The simulated alarm is armed. Disarm it?":"Arm the simulated security system?"):
                app.dialogName==="valve"?(nv.waterValve?"Close the simulated domestic water valve?":"Open the simulated domestic water valve?"):
                "Health level: "+nv.healthLevel+"\n"+nv.healthCount+" active simulated fault(s).\nNo physical equipment is connected."
            }
            Repeater { model:app.dialogName==="fixtures"?app.fixtureDetails.filter(item=>item.room===nv.selectedRoom):[]
                NvButton {x:21;y:59+index*43;width:386;height:38;label:modelData.name+"    "+(nv.fixtureEnabled(modelData.id)?"ON":"OFF");labelSize:12
                    selected: {const rev=nv.revision;return nv.fixtureEnabled(modelData.id)}
                    onClicked:nv.toggleFixture(modelData.id)
                }
            }
            NvLabel {x:21;y:180;text:"DEMO ONLY · No physical device commands";font.pixelSize:10;color:"#ffbd88";visible:app.dialogName!=="fixtures"}
            NvButton {x:192;y:251;width:99;height:42;label:"Cancel";onClicked:app.closeDialog()}
            NvButton {x:304;y:251;width:104;height:42;primary:true;label:app.dialogName==="health"||app.dialogName==="fixtures"?"Done":"Confirm";onClicked:{
                if(app.dialogName==="lock")nv.setDevice("lock",!nv.locked)
                else if(app.dialogName==="alarm")nv.setDevice("alarm",!nv.alarm)
                else if(app.dialogName==="valve")nv.setDevice("valve",!nv.waterValve)
                app.closeDialog()
            }}
        }
    }
}
