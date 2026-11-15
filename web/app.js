/* NORDVENT v13.1 — repaired offline MCU prototype. No QML and no connected devices. */
(()=>{'use strict';
const $=id=>document.getElementById(id), $$=q=>[...document.querySelectorAll(q)];
const ico=n=>`<svg class="ico" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const FIXTURE_DEFS=[{"id":"bedroom_ceiling","room":"bedroom","name":"Ceiling spotlights"},{"id":"bedroom_left_lamp","room":"bedroom","name":"Left bedside lamp"},{"id":"bedroom_right_lamp","room":"bedroom","name":"Right bedside lamp"},{"id":"living_ceiling","room":"living","name":"Ceiling spots"},{"id":"living_floor_lamp","room":"living","name":"Reading floor lamp"},{"id":"kitchen_pendants","room":"kitchen","name":"Dining pendants"},{"id":"kitchen_cabinets","room":"kitchen","name":"Counter lights"},{"id":"utility_worklight","room":"utility","name":"Utility room light"}];
const rooms={bedroom:{label:'Bedroom',blinds:true},living:{label:'Living Room',blinds:true},kitchen:{label:'Kitchen',blinds:true},utility:{label:'Utility',blinds:false}};
const names=Object.keys(rooms), clamp=(n,a,b)=>Math.min(b,Math.max(a,Number(n)||0)), fmt=v=>Number(v).toFixed(1);
const ROOM_IMAGE_URLS=Object.fromEntries(names.map(r=>[r,`assets/room_icons/${r}.svg`]));
const DEFAULT_SEQUENCE_ASSETS=Array.from({length:15},(_,i)=>`assets/sequence_webp/frame_${String(i+1).padStart(2,'0')}.webp`);
const defaults=()=>({page:'home',room:null,scene:'Home',motion:true,effects:true,moreTab:'system',ventilation:true,ventMode:'Eco',manualFlow:190,recovery:true,heating:true,water:true,mediaOverlay:false,alarm:false,locked:true,leak:false,waterValveOpen:true,smoke:false,windowOpen:false,frostRisk:false,filterDirty:false,sensorOffline:false,heatPumpFault:false,hpDefrost:false,pm25:8,voc:120,iaqAuto:true,tariffPeak:false,boostUntil:0,preBoost:'Auto',preBoostVentilation:true,lights:{bedroom:0,living:100,kitchen:100,utility:0},blinds:{bedroom:0,living:0,kitchen:100},targets:{bedroom:20,living:22,kitchen:21,utility:19},temps:{bedroom:20.6,living:21.8,kitchen:21.5,utility:19.4},co2:{bedroom:565,living:635,kitchen:724,utility:480},humidity:{bedroom:41,living:43,kitchen:45,utility:37},occupied:{bedroom:false,living:true,kitchen:false,utility:false},fixtures:Object.fromEntries(FIXTURE_DEFS.map(f=>[f.id,true])),routines:[{id:'a',time:'22:30',room:'bedroom',action:'blindsClose',enabled:true},{id:'b',time:'23:15',room:'kitchen',action:'lightsOff',enabled:false}],outdoorTemp:null,outdoorSource:'demo'});
let state=defaults(), artworkUrl=null, timerToast=0, lastMinute='', modal=null, undoSnapshot=null, undoTimer=0;
let sequenceUrls=[...DEFAULT_SEQUENCE_ASSETS], sequenceTimer=null, sequenceIndex=0, sequenceMode='frames';
let preloadedFrames=[];
const storage='nordvent-v14-system-intelligence';
try{const cache=JSON.parse(localStorage.getItem(storage)||'null');if(cache&&typeof cache==='object'){
const d=defaults(); state={...d,...cache,page:'home',room:null,moreTab:'system',lights:{...d.lights,...cache.lights},blinds:{...d.blinds,...cache.blinds},targets:{...d.targets,...cache.targets},temps:{...d.temps,...cache.temps},co2:{...d.co2,...cache.co2},humidity:{...d.humidity,...cache.humidity},occupied:{...d.occupied,...cache.occupied},fixtures:{...d.fixtures,...cache.fixtures},routines:Array.isArray(cache.routines)?cache.routines:d.routines};
}}catch(_){state=defaults()}
for(const r of names){state.lights[r]=clamp(state.lights[r],0,100);if(rooms[r].blinds)state.blinds[r]=clamp(state.blinds[r],0,100);state.targets[r]=clamp(state.targets[r],16,28)}
state.routines=state.routines.filter(v=>rooms[v.room]&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v.time)&&['lightsOn','lightsOff','blindsOpen','blindsClose'].includes(v.action)&&(!v.action.startsWith('blinds')||rooms[v.room].blinds)).slice(0,3);
if(!['Auto','Eco','Manual'].includes(state.ventMode))state.ventMode='Auto';
function save(){try{localStorage.setItem(storage,JSON.stringify({...state,page:'home',room:null,moreTab:'system'}))}catch(_) {}}
function fit(){const s=Math.min(innerWidth/800,innerHeight/480);$('app').style.transform=`scale(${s})`;}
addEventListener('resize',fit);fit();
function iaqHigh(){return !state.sensorOffline&&(maxCO2()>=1100||state.pm25>=35||state.voc>=450)}
function iaqOverride(){return Boolean(state.iaqAuto&&state.ventilation&&state.ventMode!=='Manual'&&!boostActive()&&iaqHigh())}
function airflowProfile(){return !state.ventilation?'off':boostActive()?'boost':iaqOverride()?'iaq':state.ventMode.toLowerCase()}
function flow(){if(!state.ventilation)return 0;if(boostActive())return 350;if(iaqOverride())return 280;return state.ventMode==='Eco'?110:state.ventMode==='Manual'?state.manualFlow:215}
function healthAlerts(){const a=[];
 if(state.smoke)a.push({level:'critical',code:'smoke',title:'Smoke / CO alert',detail:'Kitchen · simulated alarm',room:'kitchen'});
 if(state.leak)a.push({level:'critical',code:'leak',title:'Water leak detected',detail:'Utility · '+(state.waterValveOpen?'Shutoff available':'Water valve closed'),room:'utility'});
 if(state.sensorOffline)a.push({level:'warning',code:'sensor',title:'Sensor offline',detail:'No fresh sensor readings',room:null});
 if(state.frostRisk)a.push({level:'warning',code:'frost',title:'Frost risk',detail:'Utility · frost protection check',room:'utility'});
 if(iaqHigh())a.push({level:'warning',code:'air',title:'Air quality elevated',detail:'Kitchen · '+(iaqOverride()?'Auto airflow increased': 'Check ventilation'),room:'kitchen'});
 if(state.heatPumpFault)a.push({level:'warning',code:'heatpump',title:'Heat pump fault',detail:'Service required · simulated',room:'utility'});
 if(state.filterDirty)a.push({level:'notice',code:'filter',title:'Replace air filter',detail:'Ventilation service',room:null});
 if(state.windowOpen)a.push({level:'notice',code:'window',title:'Window open',detail:'Living Room · avoid heat loss',room:'living'});
 return a;
}
function healthSummary(){const a=healthAlerts();return a.length?`${a.length} ${a.length===1?'alert':'alerts'}`:'Systems OK'}
function renderAlertUI(){const list=healthAlerts(),chip=$('healthChip'),title=$('healthChipText');if(!chip||!title)return;chip.dataset.level=list[0]?.level||'ok';title.textContent=list[0]?(list[0].level==='critical'?list[0].title:healthSummary()):'Systems OK';chip.setAttribute('aria-label',list.length?`${healthSummary()}. Open system health`:'Systems OK. Open system health');chip.title=list[0]?.title||'Systems OK';for(const name of ['leak','smoke','window','frost','air','sensor','filter','heatpump']){const e=$('fault-'+name);if(e)e.classList.toggle('active',list.some(a=>a.code===name))}}

function boostActive(){return state.boostUntil>Date.now()}
function boostLeft(){return Math.max(1,Math.ceil((state.boostUntil-Date.now())/60000))}
function avgTemp(){return names.reduce((s,r)=>s+state.temps[r],0)/4}
function maxCO2(){return Math.max(...names.map(r=>state.co2[r]))}
function power(){const l=names.reduce((s,r)=>s+state.lights[r],0)/100;return .15+(state.ventilation?flow()*.0012:0)+(state.heating?.75:0)+(state.water?.2:0)+l*.07}
function toast(msg,undo){const el=$('toast');el.replaceChildren(document.createTextNode(msg));if(undo){const b=document.createElement('button');b.textContent='UNDO';b.onclick=()=>{undo();render();toast('Previous settings restored')};el.appendChild(b)}el.classList.add('show');clearTimeout(timerToast);timerToast=setTimeout(()=>el.classList.remove('show'),3500)}
function modeName(){return boostActive()?'Boost':iaqOverride()?'Air quality':state.ventMode}
function animateControllerEntry(){
 if(!state.motion||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 for(const el of document.querySelectorAll('#view > *, #roomView > *')){
   el.classList.remove('nv16-enter');void el.offsetWidth;el.classList.add('nv16-enter');
 }
}
function selectPage(page){if(!['home','rooms','climate','energy','routines','more'].includes(page))return;
 const changed=page!==state.page||Boolean(state.room);state.page=page;state.room=null;render();if(changed)animateControllerEntry();}
function openRoom(room){if(!rooms[room])return;const changed=state.room!==room;state.page='home';state.room=room;render();if(changed)animateControllerEntry()}
function closeRoom(){state.room=null;render()}
function cycleRoom(delta){const i=names.indexOf(state.room);if(i<0)return;openRoom(names[(i+delta+names.length)%names.length])}
function setRoomNumber(type,room,val){if(!rooms[room])return;const ranges={lights:[0,100],blinds:[0,100],targets:[16,28]};if(!ranges[type]||(type==='blinds'&&!rooms[room].blinds))return;state[type][room]=clamp(val,...ranges[type]);if(type==='targets')state[type][room]=Math.round(state[type][room]*2)/2;state.scene='Custom';save();updateEffects()}
function changeRoomNumber(type,room,val){setRoomNumber(type,room,val);render()}
// Cinematic 2D framing presets. Every architectural overlay lives in #art,
// so the photograph, lighting, blinds, temperature zones, and ducts share a transform.
// Values are [translation X px, translation Y px, scale]; there is no perspective warp.
const CAMERA_PRESETS=Object.freeze({
 home:[0,0,1],rooms:[-7,1,1.014],climate:[-6,7,1.025],
 energy:[-10,-7,1.025],routines:[-1,0,1.006],more:[-6,-3,1.010],
 'room-bedroom':[-26,13,1.074],'room-living':[-25,2,1.068],
 'room-kitchen':[-25,-12,1.071],'room-utility':[-31,-12,1.076]
});
function updateCameraFrame(){
 const w=$('workspace'),key=state.room?`room-${state.room}`:state.page;
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const frame=state.motion&&!reduce?(CAMERA_PRESETS[key]||CAMERA_PRESETS.home):CAMERA_PRESETS.home;
 w.dataset.camera=key;
 w.style.setProperty('--camera-x',`${frame[0]}px`);
 w.style.setProperty('--camera-y',`${frame[1]}px`);
 w.style.setProperty('--camera-scale',String(frame[2]));
}
function updateEffects(){const w=$('workspace');updateCameraFrame();w.dataset.page=state.page;w.dataset.mode=state.scene;w.classList.toggle('focused',Boolean(state.room));w.style.setProperty('--zoom-y',({bedroom:'18px',living:'0px',kitchen:'-14px',utility:'-14px'})[state.room]||'0px');
$('app').classList.toggle('reduce-motion',!state.motion);const fx=Boolean(state.effects), alignedMedia=!artworkUrl||Boolean(state.mediaOverlay);
const profile=airflowProfile(),intensity=profile==='boost'?1:profile==='iaq'?.87:profile==='auto'?.64:profile==='manual'?.24+clamp((state.manualFlow-100)/200,0,1)*.72:.26;
w.dataset.flow=profile;w.style.setProperty('--air-strength',String(intensity));w.style.setProperty('--air-hue',profile==='boost'?'#dcfcff':profile==='iaq'?'#87f8ed':'#42E6EE');
$('airFx').classList.toggle('on',state.ventilation&&fx);$('recoveryFx').classList.toggle('on',state.recovery&&state.ventilation&&fx);$('heatFx').classList.toggle('on',state.heating&&!state.hpDefrost&&fx);
$('waterFx').classList.toggle('on',state.water&&state.waterValveOpen&&fx);
$('defrostFx').classList.toggle('on',state.hpDefrost&&fx);
const airDash=$('airFx').querySelector('.air-moving');if(airDash){const gap=profile==='boost'?5:profile==='iaq'?9:profile==='auto'?13:profile==='manual'?Math.round(23-16*intensity):27;airDash.style.strokeDasharray=`${Math.round(3+7*intensity)} ${gap}`;airDash.style.strokeWidth=String(1.3+2.3*intensity)}

$('effectSvg').style.opacity=fx&&alignedMedia?'1':'0';
const lightLayers=$('lightingLayers');if(lightLayers)lightLayers.style.display=alignedMedia?'block':'none';
for(const def of FIXTURE_DEFS){const img=$('fixture-'+def.id);if(img)img.style.opacity=(state.fixtures[def.id] && alignedMedia)?String(Math.pow(state.lights[def.room]/100,0.85)):'0'}
// Window-local shadow masks ensure OFF/Away does not look like dimly illuminated stock artwork.
// Night keeps visibly warmer bedroom + living-room lamps; Away keeps all three floors dark.
for(const r of names){const mask=$('shade-'+r);if(!mask)continue;const lit=state.lights[r]/100;const isAway=state.scene==='Away';const base=(isAway?0.73:state.scene==='Night'?0.54:0.41)*(1-lit)+((isAway&&lit===0)?0.04:0);mask.style.opacity=alignedMedia?String(Math.max(0,Math.min(.81,base)).toFixed(3)):'0';}
const hint=$('modeSceneHint');if(hint){hint.textContent=state.scene==='Night'?'NIGHT · SOFT LIGHTING':state.scene==='Away'?'AWAY · LIGHTS OFF':'';hint.classList.toggle('show',state.scene==='Night'||state.scene==='Away');}


$('roomFocusFx').classList.toggle('on',Boolean(state.room)&&fx);
// Thermal overlays visualize *targets*, never pretend measured room temperature changed.
const showThermal=fx&&alignedMedia&&(state.page==='rooms'||Boolean(state.room));
$('thermalFx').classList.toggle('active',Boolean(showThermal));
for(const room of names){const e=$('temp-'+room),t=targetStyle(state.targets[room]);if(!e)continue;e.style.fill=t.color;e.style.opacity=showThermal?String(t.opacity*(state.room&&state.room!==room?.24:1)):'0';}

const bounds={bedroom:[379,76,345,72],living:[379,153,345,78],kitchen:[379,234,265,80],utility:[647,235,79,79]};
if(state.room){const [x,y,width,height]=bounds[state.room];for(const id of ['focusFill','focusStroke'])for(const [k,v] of Object.entries({x,y,width,height}))$(id).setAttribute(k,v);$('focusTop').setAttribute('d',`M${x+1} ${y+17}V${y+1}h42M${x+width-43} ${y+1}h42v17M${x+1} ${y+height-17}v17h42M${x+width-43} ${y+height}h42v-17`)}
const shades={bedroom:[456,80,154,144],living:[448,157,166,224],kitchen:[446,238,138,309]};
for(const r of ['bedroom','living','kitchen']){
  const [x,y,w,bottom]=shades[r],percent=clamp(state.blinds[r],0,100),mask=$('blind-'+r);
  const span=Math.max(0,w*percent/100);
  mask.setAttribute('width',span.toFixed(2));mask.style.width=span.toFixed(2)+'px';
  const edge=$('blind-edge-'+r);
  edge.setAttribute('d',`M${(x+span).toFixed(2)} ${y}V${bottom}`);
  edge.style.opacity=state.effects&&percent>1?'0.7':'0';
}
const fanDuration=profile==='boost'?'.55s':profile==='iaq'?'1.5s':profile==='eco'?'5.6s':profile==='manual'?`${(5.8-state.manualFlow/75).toFixed(2)}s`:'2.6s';$('turbine').style.setProperty('--fan-duration',fanDuration);$('airFx').style.setProperty('--air-duration',profile==='boost'?'0.62s':profile==='iaq'?'1.25s':profile==='eco'?'6.2s':profile==='manual'?`${(6.3-state.manualFlow/65).toFixed(2)}s`:'2.4s');}
function render(){updateEffects();$$('.nav-item').forEach(b=>{const active=b.dataset.page===state.page;b.classList.toggle('selected',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});$$('.mode-choice').forEach(b=>{b.classList.toggle('active',b.dataset.scene===state.scene);b.setAttribute('aria-pressed',String(b.dataset.scene===state.scene))});const mc=$('modeCustom'); if(mc) mc.textContent=state.scene==='Custom'?'Custom':'';const hl=$('headerLock');const hlt=$('headerLockText'); if(hl){hl.classList.toggle('unlocked',!state.locked);hl.classList.toggle('locked',state.locked);hl.setAttribute('aria-label',`Door ${state.locked?'locked':'unlocked'}. Change lock`);hl.title=`Door ${state.locked?'locked':'unlocked'}`;hl.querySelector('use')?.setAttribute('href',state.locked?'#i-nv-lock':'#i-nv-unlock')} if(hlt){hlt.textContent=state.locked?'Locked':'Unlocked'} const ha=$('headerAlarm');const hat=$('headerAlarmText'); if(ha){ha.classList.toggle('armed',state.alarm);ha.setAttribute('aria-label',`Alarm ${state.alarm?'armed':'disarmed'}. Change alarm`);ha.title=`Alarm ${state.alarm?'armed':'disarmed'}`;ha.querySelector('use')?.setAttribute('href',state.alarm?'#i-nv-shield':'#i-nv-shield-idle')} if(hat){hat.textContent=state.alarm?'Armed':'Alarm off'} $('outdoorValue').textContent=(state.outdoorTemp===null?'−12':String(Math.round(state.outdoorTemp)).replace('-', '−'))+'°';$('outdoorSource').textContent=state.outdoorSource;$('view').innerHTML=state.room?'':views[state.page]();$('roomView').innerHTML=state.room?roomHTML(state.room):'';renderAlertUI();save();clock()}
function clock(){const d=new Date();$('clock').textContent=d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});}
const views={home:homeHTML,rooms:roomsHTML,climate:climateHTML,energy:energyHTML,routines:routinesHTML,more:moreHTML};
function homeHTML(){return `<div class="panel home-panel"><div class="eyebrow">BUILDING · DEMO</div><h1 class="h1">At a glance.</h1><div class="home-stats"><div class="home-stat"><small>Indoor</small><strong>${state.sensorOffline?'—':fmt(avgTemp())+'°'}</strong><em>${state.sensorOffline?'Sensor stale':'4 rooms'}</em></div><div class="home-stat"><small>CO₂ peak</small><strong>${state.sensorOffline?'—':maxCO2()} <span class="unit">ppm</span></strong><em>${state.sensorOffline?'Sensor stale':maxCO2()>=1000?'High':'Good'}</em></div><div class="home-stat"><small>Power</small><strong>${fmt(power())} <span class="unit">kW</span></strong><em>Estimated</em></div><div class="home-stat"><small>Airflow</small><strong>${flow()} <span class="unit">m³/h</span></strong><em>${state.ventilation?modeName():'Off'}</em></div></div><div class="home-buttons"><button class="btn primary" data-action="boost">${ico('air')}${boostActive()?`Stop boost · ${boostLeft()}m`:'Fresh air · 30m'}</button></div></div><div class="home-legend"><span><i class="dot"></i>Air</span><span><i class="dot heat"></i>Heat</span><span><i class="dot lights"></i>Light</span><span><i class="dot blinds"></i>Blinds</span></div>`}
function targetStyle(temp){
  const t=Number(temp);
  if(t<=18.5)return {color:'#69c6ff',name:'Cooling',opacity:.20};
  if(t<20)return {color:'#7edfec',name:'Cool',opacity:.12};
  if(t<=22)return {color:'#91e6bf',name:'Comfort',opacity:.065};
  if(t<25)return {color:'#ffbc73',name:'Warm',opacity:.16};
  return {color:'#ff8c69',name:'Hot',opacity:.22};
}
function roomsHTML(){return `<section class="side-panel rooms-v13" aria-label="Rooms"><div class="side-kicker">SPACES</div><div class="side-titleline"><h2>Rooms</h2><small>4 zones</small></div><div class="rooms-v13-list">${names.map(r=>{const t=targetStyle(state.targets[r]);return `<button class="room-pick" data-room="${r}" aria-label="Control ${rooms[r].label}"><img class="room-pick-icon" src="${ROOM_IMAGE_URLS[r]}" alt="" draggable="false"><span class="room-pick-copy"><b>${rooms[r].label}</b><small>${state.sensorOffline?'Sensor stale':state.co2[r]+' ppm'} · ${state.lights[r]>0?'Lights on':'Lights off'}</small></span><strong style="color:${t.color}">${state.sensorOffline?'—':fmt(state.temps[r])+'°'}</strong><span class="room-pick-chevron">›</span></button>`}).join('')}</div><div class="rooms-v13-foot"><span class="foot-pulse"></span> Select a room or tap the house</div></section>`}
function climateHTML(){
 const profile=airflowProfile(),active=state.ventMode;
 const modeLabel=profile==='iaq'?'AIR QUALITY AUTO':profile==='boost'?'BOOST ACTIVE':profile==='off'?'FAN OFF':active.toUpperCase();
 return `<section class="side-panel climate-v15" aria-label="Climate controls">
  <div class="side-kicker">VENTILATION / CONTROLS</div>
  <div class="side-titleline"><h2>Climate</h2><small>${state.ventilation?'Running':'Stopped'}</small></div>
  <div class="v15-command-rows">
   <div class="v15-command-row"><span>${ico('fan')}<b>Fan</b></span><button class="v15-control-switch ${state.ventilation?'is-on':''}" data-action="toggleVent" aria-pressed="${state.ventilation}">${state.ventilation?'On':'Off'}</button></div>
   <div class="v15-command-row"><span>${ico('air')}<b>Heat recovery</b></span><button class="v15-control-switch ${state.recovery?'is-on':''}" data-action="toggleRecovery" aria-pressed="${state.recovery}">${state.recovery?'On':'Off'}</button></div>
   <div class="v15-command-row"><span>${ico('air')}<b>Air quality auto</b></span><button class="v15-control-switch ${state.iaqAuto?'is-on':''}" data-action="toggleIaq" aria-pressed="${state.iaqAuto}">${state.iaqAuto?'On':'Off'}</button></div>
  </div>
  ${active==='Manual'&&!boostActive()?`<div class="v15-manual-control"><label for="manualFlow">Supply airflow</label><output id="manualReadout">${state.manualFlow} m³/h</output><input id="manualFlow" class="range" data-range="manual" type="range" min="100" max="300" step="10" value="${state.manualFlow}" aria-label="Manual supply airflow"/></div>`:''}
  <button class="v15-boost ${boostActive()?'is-active':''}" data-action="boost">${ico('fan')}<span>${boostActive()?'Stop Boost':'Boost ventilation'}</span><small>${boostActive()?boostLeft()+' min left':'30 min'}</small></button>
 </section>
 <div class="v15-hud v15-climate-hud" aria-label="Live ventilation and airflow mode">
  <div class="v15-hud-kicker"><span class="v15-dot"></span>AIRFLOW <em>${modeLabel}</em></div>
  <div class="v15-hud-value"><strong id="overlayFlowReadout">${flow()}</strong><span>m³/h</span></div>
  <div class="v15-hud-modes" role="group" aria-label="Ventilation operating mode">${['Eco','Auto','Manual'].map(m=>`<button class="${active===m&&!boostActive()?'active':''}" data-action="ventMode" data-mode="${m}" aria-pressed="${active===m&&!boostActive()}">${m}</button>`).join('')}</div>
  ${profile==='iaq'?'<div class="v15-hud-message">Air quality override active</div>':profile==='boost'?'<div class="v15-hud-message">Maximum ventilation</div>':''}
 </div>`;
}
function energyHTML(){
 const fan=state.ventilation?flow()*.0012:0,heat=state.heating?.75:0,water=state.water&&state.waterValveOpen?.20:0,other=.15+names.reduce((s,r)=>s+state.lights[r],0)*.0007,total=Math.max(.01,fan+heat+water+other);
 const parts=[{name:'Heat',val:heat,color:'#FFB15C'},{name:'Air',val:fan,color:'#42E6EE'},{name:'Water',val:water,color:'#71A9FF'},{name:'Other',val:other,color:'#8395AA'}];
 const hp=state.heatPumpFault?'Service':state.hpDefrost?'Defrost':state.heating||state.water?'Running':'Standby';
 return `<section class="side-panel energy-v15" aria-label="Energy controls">
  <div class="side-kicker">ENERGY / CONTROLS</div>
  <div class="side-titleline"><h2>Energy</h2><small>${state.tariffPeak?'Peak tariff':'Estimated'}</small></div>
  <div class="v15-command-rows">
   <div class="v15-command-row"><span>${ico('temp')}<b>Heating</b></span><button class="v15-control-switch ${state.heating?'is-on':''}" data-action="toggleHeat" aria-pressed="${state.heating}">${state.heating?'On':'Off'}</button></div>
   <div class="v15-command-row"><span>${ico('water')}<b>Hot water</b></span><button class="v15-control-switch ${state.water?'is-on':''}" data-action="toggleWater" aria-pressed="${state.water}">${state.water?'On':'Off'}</button></div>
   <div class="v15-command-row"><span>${ico('water')}<b>Water valve</b></span><button class="v15-control-switch ${state.waterValveOpen?'is-on':'is-warning'}" data-action="waterValveConfirm" aria-label="${state.waterValveOpen?'Shut main water valve':'Open main water valve'}">${state.waterValveOpen?'Open':'Shut'}</button></div>
  </div>
  <div class="v15-pump-status"><span>${ico('fan')} Heat pump</span><strong class="${state.heatPumpFault?'is-warning':''}">${hp}</strong></div>
  <button class="v15-health-link" data-action="viewHealth">${ico('info')} System health <span>›</span></button>
 </section>
 <div class="v15-hud v15-energy-hud" aria-label="Estimated power and system status">
  <div class="v15-hud-kicker"><span class="v15-dot"></span>POWER NOW <em>DEMO ESTIMATE</em></div>
  <div class="v15-hud-value"><strong>${fmt(power())}</strong><span>kW</span></div>
  <div class="v15-energy-status"><span class="v15-heat">${ico('temp')} Heat <b>${state.heating?'On':'Off'}</b></span><span class="v15-water">${ico('water')} Water <b>${state.water&&state.waterValveOpen?'On':'Off'}</b></span></div>
  <div class="v15-energy-distribution" aria-label="Estimated load distribution">${parts.map(p=>`<i style="width:${(p.val/total*100).toFixed(1)}%;background:${p.color}" title="${p.name} ${fmt(p.val)} kW"></i>`).join('')}</div>
 </div>`;
}
const actionLabels={lightsOn:'Lights on',lightsOff:'Lights off',blindsOpen:'Open blinds',blindsClose:'Close blinds'};
function routinesHTML(){return `<section class="side-panel routines-v13" aria-label="Scheduled routines"><div class="side-kicker">AUTOMATION</div><div class="side-titleline"><h2>Routines</h2><button class="routine-add" data-action="newRoutine" ${state.routines.length>=3?'disabled':''}>${ico('plus')} Add</button></div><div class="routine-list-v13">${state.routines.length?state.routines.map(rt=>`<div class="routine-item"><span class="routine-time">${rt.time}</span><span class="routine-label"><b>${rooms[rt.room].label}</b><small>${actionLabels[rt.action]}</small></span><button class="routine-toggle-v13 ${rt.enabled?'on':''}" data-action="toggleRoutine" data-id="${rt.id}" aria-label="${rt.enabled?'Pause':'Enable'} ${rooms[rt.room].label} routine">${rt.enabled?'On':'Off'}</button><button class="routine-edit-v13" data-action="editRoutine" data-id="${rt.id}" aria-label="Edit ${rooms[rt.room].label} routine">···</button></div>`).join(''):'<div class="routines-empty">No routines yet</div>'}</div><div class="routines-foot">Daily · runs while app is open</div></section>`}
function moreHTML(){const t=state.moreTab,alerts=healthAlerts();const rows=t==='system'?`<div class="more-status-row"><span>${ico('shield')} Alarm</span><strong>${state.alarm?'Armed':'Disarmed'}</strong></div><div class="more-status-row"><span>${ico('check')} Door</span><strong>${state.locked?'Locked':'Unlocked'}</strong></div><div class="more-status-row"><span>System health</span><button class="btn" data-action="viewHealth">${healthSummary()}</button></div><p class="inline-note">Tap the status icons on the house for details.</p>`:t==='display'?`<div class="thin-switch"><span>Motion</span><button class="switch ${state.motion?'on':''}" data-action="toggleMotion">${state.motion?'On':'Off'}</button></div><div class="thin-switch"><span>Building FX</span><button class="switch ${state.effects?'on':''}" data-action="toggleEffects">${state.effects?'On':'Off'}</button></div><div class="more-status-row"><span>Background</span><strong>${sequenceMode==='frames'?`${sequenceUrls.length} frames`:sequenceMode==='video'?'Video':'Image'}</strong></div><div class="mini-asset-actions"><button class="btn" data-action="replaceArt">Image</button><button class="btn" data-action="importSequence">Frames</button><button class="btn" data-action="resetArt">Reset</button></div><div class="thin-switch"><span>FX on imports</span><button class="switch ${state.mediaOverlay?'on':''}" data-action="toggleMediaOverlay" ${artworkUrl?'':'disabled'}>${state.mediaOverlay?'On':'Off'}</button></div>`:t==='health'?`<div class="health-headline ${alerts.length?'has-alerts':''}"><b>${healthSummary()}</b><small>${alerts.length?'Simulated system events':'No active demo faults'}</small></div><div class="health-list">${alerts.length?alerts.slice(0,3).map(a=>`<div class="health-item ${a.level}"><b>${a.title}</b><small>${a.detail}</small></div>`).join(''):'<div class="health-item ok"><b>All systems normal</b><small>Demo sensors reporting</small></div>'}</div><div class="health-data"><span>Air: ${state.sensorOffline?'Stale':`${maxCO2()} ppm CO₂`}</span><span>PM2.5: ${state.pm25} µg/m³</span><span>VOC: ${state.voc} ppb</span><span>Filter: ${state.filterDirty?'Service':'OK'}</span><span>Water: ${state.waterValveOpen?'Open':'Shut'}</span><span>HP: ${state.heatPumpFault?'Fault':state.hpDefrost?'Defrost':'Normal'}</span></div><button class="btn primary health-action" data-action="viewHealth">Alerts & actions ›</button>`:`<div class="demo-grid">${[['leakTest','Leak'],['airTest','Air quality'],['smokeTest','Smoke / CO'],['frostTest','Frost'],['windowTest','Window'],['filterTest','Filter'],['sensorTest','Sensor'],['defrostTest','Defrost'],['hpFaultTest','Heat pump'],['tariffTest','Peak tariff']].map(([act,label])=>`<button class="demo-chip" data-action="${act}">${label}</button>`).join('')}</div><button class="btn demo-reset" data-action="clearFaults">Clear test faults</button><p class="inline-note">Faults are simulated; no equipment connected.</p>`;return `<section class="side-panel more-v13" aria-label="More settings"><div class="side-kicker">CONTROLLER</div><div class="side-titleline"><h2>${t==='health'?'Health':'More'}</h2><small>Demo</small></div><div class="more-tabs-v13">${[['system','Status'],['display','FX'],['health','Health'],['demo','Tests']].map(([k,l])=>`<button class="${t===k?'active':''}" data-action="moreTab" data-tab="${k}">${l}</button>`).join('')}</div>${rows}</section>`}
function openHealthDialog(){const a=healthAlerts();dialogOpen('System health · Demo',`<div class="health-dialog-list">${a.length?a.slice(0,4).map(v=>`<div class="health-dialog-row ${v.level}"><b>${v.title}</b><small>${v.detail}</small></div>`).join('')+(a.length>4?`<div class="health-dialog-row"><b>+${a.length-4} more alerts</b><small>Clear individual tests from More</small></div>`:''):'<div class="health-dialog-row ok"><b>Systems normal</b><small>No active simulated fault</small></div>'}</div><div class="health-dialog-buttons">${state.leak?`<button class="btn primary" data-action="waterValveConfirm">${state.waterValveOpen?'Shut water valve':'Open water valve'}</button>`:''}<button class="btn" data-action="clearFaults">Clear faults</button></div><p class="inline-note">Not a certified safety alarm, sensor feed or water controller.</p>`,`<button class="btn primary" data-action="dismiss">Close</button>`)}
function roomHTML(r){const {label,blinds}=rooms[r],t=state.targets[r],v=state.lights[r],b=state.blinds[r]||0;const btext=b===100?'Closed':b===0?'Open':`${b}% closed`;return `<aside class="room-side" aria-label="${label} controls"><div class="room-side-header"><span class="side-kicker">ROOM CONTROL</span><button class="room-exit" data-action="closeRoom" aria-label="Whole building">${ico('close')}</button></div><div class="room-heading-row"><button class="room-cycle" data-action="prevRoom" aria-label="Previous room" title="Previous room">‹</button><h2>${label}</h2><button class="room-cycle" data-action="nextRoom" aria-label="Next room" title="Next room">›</button></div><div class="room-data"><strong>${state.sensorOffline?'—':fmt(state.temps[r])+'°'}</strong><span>${state.sensorOffline?'Sensor stale':state.co2[r]+' ppm'}<br>${state.occupied[r]?'Occupied':'Vacant'}</span></div><div class="room-mini-nav" role="group" aria-label="Switch room">${names.map(k=>`<button class="room-switch-tile ${r===k?'active':''}" data-room="${k}" aria-label="Switch to ${rooms[k].label}" aria-pressed="${r===k}" title="${rooms[k].label}"><img src="${ROOM_IMAGE_URLS[k]}" alt="" draggable="false"/><span>${({bedroom:'Bed',living:'Living',kitchen:'Kitchen',utility:'Utility'})[k]}</span></button>`).join('')}</div><div class="room-action-block"><div class="room-action-top"><span>Target</span><strong>${fmt(t)}°</strong></div><div class="room-action-buttons two"><button data-action="tempDown" data-room="${r}" aria-label="Decrease ${label} temperature">${ico('minus')}</button><button data-action="tempUp" data-room="${r}" aria-label="Increase ${label} temperature">${ico('plus')}</button></div></div><div class="room-action-block"><div class="room-action-top"><span>${ico('light')} Lights</span><button data-action="fixtureDialog" data-room="${r}" aria-label="Choose ${label} light fixtures">Details ›</button></div><div class="room-action-buttons room-light-buttons"><button data-action="lightsOff" data-room="${r}" class="${v===0?'active':''}">Off</button><input type="range" class="range" min="0" max="100" step="5" data-range="lights" data-room="${r}" value="${v}" aria-label="${label} light brightness"><button data-action="lightsOn" data-room="${r}" class="${v>0?'active':''}">On</button></div></div><div class="room-action-block last"><div class="room-action-top"><span>${ico('blinds')} Blinds</span><small>${blinds?btext:'Not fitted'}</small></div>${blinds?`<div class="room-action-buttons three"><button data-action="blindOpen" data-room="${r}" class="${b===0?'active':''}">Open</button><button data-action="blindHalf" data-room="${r}" class="${b===50?'active':''}">50%</button><button data-action="blindClose" data-room="${r}" class="${b===100?'active':''}">Close</button></div>`:''}</div></aside>`}
function fixtureDialog(room){if(!rooms[room])return;
const options=FIXTURE_DEFS.filter(f=>f.room===room);dialogOpen(rooms[room].label+' · Lights',
`<p>Choose individual lights.</p>${options.map(f=>`<div class="fixture-row"><div><strong>${f.name}</strong><small>${state.fixtures[f.id]?'Illuminated':'Off'} · ${state.lights[room]}% room dimmer</small></div><button class="switch ${state.fixtures[f.id]?'on':''}" data-action="toggleFixture" data-id="${f.id}" data-room="${room}">${state.fixtures[f.id]?'ON':'OFF'}</button></div>`).join('')}`,
`<button class="btn primary" data-action="dismiss">Done</button>`)}
function dialogOpen(title,body,actions){modal={title};$('dialogTitle').textContent=title;$('dialogBody').innerHTML=body;$('dialogFooter').innerHTML=actions;$('modalBack').classList.remove('hidden')}
function dialogClose(){modal=null;$('modalBack').classList.add('hidden')}
function confirmDialog(title,body,onYes,yes='Confirm'){dialogOpen(title,`<p>${body}</p>`,`<button class="btn" data-action="dismiss">Cancel</button><button class="btn primary" id="dialogYes">${yes}</button>`);$('dialogYes').onclick=()=>{dialogClose();onYes()}}
function scenes(){dialogOpen('Building mode',`<p>Mode affects multiple rooms. Choose and confirm.</p>${[['Home','Everyday comfort settings'],['Night','Soft bedroom and living lights · partial blinds'],['Away','Lights off · blinds closed · Eco ventilation']].map(([n,d])=>`<button class="scene-opt" data-action="scenePreview" data-scene="${n}"><span><strong>${n}</strong><small>${d}</small></span>${ico(n==='Night'?'moon':n==='Home'?'home':'shield')}</button>`).join('')}`,`<button class="btn" data-action="dismiss">Cancel</button>`)}
function scenePreview(name){if(name===state.scene){toast(name+' mode already active');return}const what={Home:'Living and kitchen lights on; bedroom and living blinds open; comfortable setpoints; Auto fan.',Night:'Bedroom 70%, living 35%, other lights off; bedroom and kitchen blinds closed, living partially open; Eco fan.',Away:'All lights off and blinds closed; target 17°C everywhere; Eco fan.'}[name];dialogOpen(`${name} mode`,`<div class="eyebrow">THESE CHANGES WILL BE APPLIED</div><p>${what}</p><p>Lock and alarm stay as they are. Undo is available.</p>`,`<button class="btn" data-action="scenes">Back</button><button class="btn primary" data-action="applyScene" data-scene="${name}">Apply ${name}</button>`)}
function applyScene(scene){const snapshot=structuredClone(state);if(scene==='Home'){state.lights={bedroom:0,living:100,kitchen:100,utility:0};state.blinds={bedroom:0,living:0,kitchen:100};state.targets={bedroom:20,living:22,kitchen:21,utility:19};state.ventMode='Auto'}if(scene==='Night'){state.lights={bedroom:70,living:35,kitchen:0,utility:0};state.blinds={bedroom:100,living:55,kitchen:100};state.targets={bedroom:19,living:20,kitchen:19,utility:18};state.ventMode='Eco'}if(scene==='Away'){state.lights={bedroom:0,living:0,kitchen:0,utility:0};state.blinds={bedroom:100,living:100,kitchen:100};state.targets={bedroom:17,living:17,kitchen:17,utility:17};state.ventMode='Eco'}state.scene=scene;state.boostUntil=0;state.preBoost='Auto';state.preBoostVentilation=true;state.ventilation=true;dialogClose();render();toast(`${scene} mode applied`,()=>{state=snapshot})}
function boostToggle(){if(boostActive()){state.boostUntil=0;state.ventMode=state.preBoost||'Auto';state.ventilation=state.preBoostVentilation;state.preBoost='Auto';toast('Boost stopped · previous fan state restored')}else{state.preBoost=state.ventMode;state.preBoostVentilation=state.ventilation;state.boostUntil=Date.now()+30*60*1000;state.ventilation=true;toast('Ventilation boosted for 30 minutes · rooms unchanged')}render()}
function scheduleRun(rt,source){if(rt.action==='lightsOn')state.lights[rt.room]=100;if(rt.action==='lightsOff')state.lights[rt.room]=0;if(rt.action==='blindsOpen')state.blinds[rt.room]=0;if(rt.action==='blindsClose')state.blinds[rt.room]=100;state.scene='Custom';render();toast(`${source}: ${actionLabels[rt.action]} · ${rooms[rt.room].label}`)}
function routineEdit(id){const rt=state.routines.find(r=>r.id===id)||{id:null,time:'07:30',room:'living',action:'lightsOn',enabled:true};const roomOptions=names.map(r=>`<option value="${r}" ${rt.room===r?'selected':''}>${rooms[r].label}</option>`).join('');const actionOptions=Object.entries(actionLabels).map(([k,v])=>`<option value="${k}" ${rt.action===k?'selected':''}>${v}</option>`).join('');dialogOpen(id?'Edit routine':'New room routine',`<div class="dialog-fields"><div><label for="rtTime">Time (local)</label><input id="rtTime" type="time" value="${rt.time}" /></div><div><label for="rtRoom">Room</label><select id="rtRoom">${roomOptions}</select></div></div><label for="rtAction">Action</label><select id="rtAction">${actionOptions}</select><p class="small muted">Runs daily while the application remains open. If the selected room has no blinds, only lighting actions can be saved.</p>`,`<button class="btn ${id?'negative':''}" data-action="${id?'deleteRoutine':'dismiss'}" ${id?`data-id="${id}"`:''}>${id?'Delete':'Cancel'}</button><button class="btn primary" data-action="saveRoutine" ${id?`data-id="${id}"`:''}>Save routine</button>`)}
function validRoutine(room,action,time){return rooms[room]&&/^([01]\d|2[0-3]):[0-5]\d$/.test(time)&&actionLabels[action]&&(!action.startsWith('blinds')||rooms[room].blinds)}
function action(el){const a=el.dataset.action,r=el.dataset.room,mode=el.dataset.mode,id=el.dataset.id;
switch(a){case 'prevRoom':cycleRoom(-1);return;case 'nextRoom':cycleRoom(1);return;case 'closeRoom':closeRoom();return;case 'dismiss':dialogClose();return;case 'scenes':scenes();return;case 'scenePreview':scenePreview(el.dataset.scene);return;case 'applyScene':applyScene(el.dataset.scene);return;
case 'boost':boostToggle();if(boostActive()&&state.motion){const a=$('airFx');a.classList.remove('boost-surge');void a.getBoundingClientRect();a.classList.add('boost-surge')}return;case 'ventMode':state.ventMode=mode;state.scene='Custom';if(boostActive()){state.boostUntil=0;state.preBoost='Auto'}render();toast(`${mode} ventilation mode`);return;
case 'toggleVent':state.ventilation=!state.ventilation;if(!state.ventilation&&boostActive()){state.boostUntil=0;state.ventMode=state.preBoost||'Auto'}render();toast(`Central ventilation ${state.ventilation?'on':'off'} (demo)`);return;
case 'toggleRecovery':state.recovery=!state.recovery;render();toast(`Heat recovery ${state.recovery?'on':'off'} (demo)`);return;
case 'toggleIaq':state.iaqAuto=!state.iaqAuto;render();toast('Air quality automation '+(state.iaqAuto?'enabled':'disabled'));return;
case 'toggleHeat':state.heating=!state.heating;render();toast(`Central heating ${state.heating?'on':'off'} (demo)`);return;
case 'toggleWater':state.water=!state.water;render();toast(`Domestic hot water ${state.water?'on':'off'} (demo)`);return;
case 'waterValveConfirm':confirmDialog(state.waterValveOpen?'Shut off water?':'Open water valve?',state.waterValveOpen?'Simulate closing the main water valve. Hot-water delivery FX will stop.':'Simulate reopening the water valve. Check that the leak has been cleared first.',()=>{state.waterValveOpen=!state.waterValveOpen;render();if(state.moreTab==='health')openHealthDialog();toast('Water valve '+(state.waterValveOpen?'opened':'shut')+' · demo')},state.waterValveOpen?'Shut water':'Open valve');return;
case 'tempDown':changeRoomNumber('targets',r,state.targets[r]-.5);return;case 'tempUp':changeRoomNumber('targets',r,state.targets[r]+.5);return;
case 'fixtureDialog':fixtureDialog(r);return;case 'toggleFixture':if(Object.prototype.hasOwnProperty.call(state.fixtures,id)){state.fixtures[id]=!state.fixtures[id];state.scene='Custom';render();fixtureDialog(r)}return;
case 'lightsOff':changeRoomNumber('lights',r,0);return;case 'lightsOn':changeRoomNumber('lights',r,100);return;
case 'blindOpen':changeRoomNumber('blinds',r,0);return;case 'blindHalf':changeRoomNumber('blinds',r,50);return;case 'blindClose':changeRoomNumber('blinds',r,100);return;
case 'moreTab':state.moreTab=el.dataset.tab;render();return;case 'viewHealth':state.moreTab='health';state.page='more';state.room=null;render();openHealthDialog();return;
case 'alarmConfirm':confirmDialog(state.alarm?'Disarm security?':'Arm security?',`This will ${state.alarm?'disarm':'arm'} the simulated building security alarm. It does not operate any real alarm.`,()=>{state.alarm=!state.alarm;render();const a=$('headerAlarm');a.classList.remove('state-confirm');void a.offsetWidth;a.classList.add('state-confirm');toast(`Alarm ${state.alarm?'armed':'disarmed'} · demo`)},state.alarm?'Disarm':'Arm');return;
case 'lockConfirm':confirmDialog(state.locked?'Unlock exterior doors?':'Lock exterior doors?',`This will ${state.locked?'unlock':'lock'} the simulated exterior doors. Real door security requires a separate authorized controller.`,()=>{state.locked=!state.locked;render();const a=$('headerLock');a.classList.remove('state-confirm');void a.offsetWidth;a.classList.add('state-confirm');toast(`Door ${state.locked?'locked':'unlocked'} · demo`)},state.locked?'Unlock':'Lock');return;
case 'toggleMotion':state.motion=!state.motion;setBackgroundMotion();render();return;case 'toggleMediaOverlay':state.mediaOverlay=!state.mediaOverlay;render();return;case 'importSequence':$('sequenceInput').click();return;case 'toggleEffects':state.effects=!state.effects;render();return;
case 'replaceArt':$('artInput').click();return;case 'resetArt':clearBackgroundMedia();state.mediaOverlay=false;$('buildingImage').style.display='block';$('buildingVideo').style.display='none';$('buildingImage').src=sequenceUrls[0];startBackgroundSequence();setBackgroundMotion();$('artInput').value='';$('sequenceInput').value='';render();toast('Animated background restored');return;
case 'co2Demo':case 'airTest':{let msg='Air quality restored';if(state.co2.kitchen<1100&&state.pm25<35&&state.voc<450){state.co2.kitchen=1450;msg='High CO₂ · automatic airflow adjusted'}else if(state.co2.kitchen>=1100){state.co2.kitchen=724;state.pm25=48;msg='High PM2.5 · automatic airflow adjusted'}else if(state.pm25>=35){state.pm25=8;state.voc=600;msg='High VOC · automatic airflow adjusted'}else{state.voc=120;}render();toast(msg);return;}
case 'leakTest':state.leak=!state.leak;render();toast(state.leak?'Water leak · Utility · demo':'Water leak cleared');return;
case 'smokeTest':state.smoke=!state.smoke;render();toast(state.smoke?'Smoke/CO · Kitchen · demo only':'Smoke/CO fault cleared');return;
case 'windowTest':state.windowOpen=!state.windowOpen;render();toast(state.windowOpen?'Living Room window open · demo':'Window closed');return;
case 'frostTest':state.frostRisk=!state.frostRisk;render();toast(state.frostRisk?'Frost risk · Utility · demo':'Frost fault cleared');return;
case 'filterTest':state.filterDirty=!state.filterDirty;render();toast(state.filterDirty?'Filter service needed':'Filter state cleared');return;
case 'sensorTest':state.sensorOffline=!state.sensorOffline;render();toast(state.sensorOffline?'Sensor stale · simulated':'Sensor online');return;
case 'defrostTest':state.hpDefrost=!state.hpDefrost;render();toast(state.hpDefrost?'Heat pump defrost cycle':'Defrost ended');return;
case 'hpFaultTest':state.heatPumpFault=!state.heatPumpFault;render();toast(state.heatPumpFault?'Heat pump service warning':'Heat pump normal');return;
case 'tariffTest':state.tariffPeak=!state.tariffPeak;render();toast(state.tariffPeak?'Peak tariff simulation':'Normal tariff');return;
case 'clearFaults':Object.assign(state,{leak:false,smoke:false,windowOpen:false,frostRisk:false,filterDirty:false,sensorOffline:false,heatPumpFault:false,hpDefrost:false,pm25:8,voc:120,waterValveOpen:true});state.co2.kitchen=724;dialogClose();render();toast('Test faults cleared');return;
case 'weather':refreshWeather();return;
case 'resetConfirm':confirmDialog('Reset all demo settings?','Restore all room, mode and routine settings to defaults. The current artwork is kept.',()=>{const keepTab=state.moreTab;state=defaults();state.page='more';state.moreTab=keepTab;render();toast('All demo settings reset')},'Reset demo');return;
case 'newRoutine':if(state.routines.length<3)routineEdit(null);return;case 'editRoutine':routineEdit(id);return;
case 'toggleRoutine':{const rt=state.routines.find(x=>x.id===id);if(rt){rt.enabled=!rt.enabled;render()}return}
case 'saveRoutine':{const room=$('rtRoom').value,time=$('rtTime').value,act=$('rtAction').value;if(!validRoutine(room,act,time)){toast('Choose a valid time and room/device combination');return}if(id){const rt=state.routines.find(x=>x.id===id);if(rt)Object.assign(rt,{room,time,action:act})}else if(state.routines.length<3){state.routines.push({id:'r'+Date.now(),room,time,action:act,enabled:true})}dialogClose();render();toast('Routine saved');return}
case 'deleteRoutine':state.routines=state.routines.filter(x=>x.id!==id);dialogClose();render();toast('Routine deleted');return;
}}
$('app').addEventListener('click',ev=>{const el=ev.target.closest('button');if(!el||el.disabled)return;if(el.dataset.page){selectPage(el.dataset.page);return}if(el.dataset.room&&!el.dataset.action){openRoom(el.dataset.room);return}if(el.dataset.action)action(el)});
$('app').addEventListener('input',ev=>{const el=ev.target;if(!el.dataset.range)return;if(el.dataset.range==='lights'){setRoomNumber('lights',el.dataset.room,el.value);const out=$('roomLightReadout');if(out)out.textContent=el.value+'%'}else if(el.dataset.range==='manual'){state.manualFlow=clamp(el.value,100,300);state.scene='Custom';save();updateEffects();const out=$('manualReadout');if(out)out.textContent=state.manualFlow+' m³/h';const houseFlow=$('overlayFlowReadout');if(houseFlow)houseFlow.textContent=String(flow())}});
$('app').addEventListener('change',ev=>{if(ev.target.dataset.range==='lights'||ev.target.dataset.range==='manual')render()});
$('modalBack').addEventListener('click',ev=>{if(ev.target===$('modalBack'))dialogClose()});
addEventListener('keydown',ev=>{if(ev.key==='Escape'){if(modal)dialogClose();else if(state.room)closeRoom()}});
$('artInput').addEventListener('change',ev=>{const file=ev.target.files?.[0];if(!file)return;if(file.size>8*1024*1024||!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(file.type)){toast('Use PNG, JPG, WebP or SVG under 8 MB');return}installBackgroundImage(file)});
$('sequenceInput').addEventListener('change',ev=>{if(ev.target.files?.length)installBackgroundSequence(ev.target.files)});
function clearBackgroundMedia(){
  if(sequenceTimer){clearInterval(sequenceTimer);sequenceTimer=null;}
  preloadedFrames=[];
  const v=$('buildingVideo');v.pause();v.removeAttribute('src');v.style.display='none';
  $('buildingImage').style.display='block';
  if(artworkUrl && artworkUrl.startsWith('blob:') && !sequenceUrls.includes(artworkUrl))URL.revokeObjectURL(artworkUrl);
  sequenceUrls.filter(u=>u.startsWith('blob:')).forEach(u=>URL.revokeObjectURL(u));
  artworkUrl=null;sequenceUrls=[...DEFAULT_SEQUENCE_ASSETS];sequenceIndex=0;sequenceMode='frames';
}
function installBackgroundImage(file){
  clearBackgroundMedia();state.mediaOverlay=false;
  artworkUrl=URL.createObjectURL(file);sequenceMode='image';sequenceUrls=[];$('buildingImage').src=artworkUrl;
  updateEffects();render();toast('Background image imported · check overlay alignment');
}
function installBackgroundSequence(files){
  const items=[...files].sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
  if(!items.length)return;
  const maxBytes=70*1024*1024;
  if(items.length>160||items.reduce((s,f)=>s+f.size,0)>maxBytes){toast('Limit: 160 frames / 70 MB');return;}
  const videoFiles=items.filter(f=>/^video\/(mp4|webm)$/.test(f.type));
  const imageFiles=items.filter(f=>/^image\/(png|jpeg|webp|gif)$/.test(f.type));
  if((videoFiles.length && items.length!==1)||videoFiles.length+imageFiles.length!==items.length){toast('Choose numbered images or one MP4/WebM');return;}
  clearBackgroundMedia();state.mediaOverlay=false;
  sequenceUrls=items.map(f=>URL.createObjectURL(f));artworkUrl=sequenceUrls[0];
  if(videoFiles.length){
    sequenceMode='video';const v=$('buildingVideo');v.style.display='block';$('buildingImage').style.display='none';v.src=artworkUrl;
    if(state.motion)v.play().catch(()=>toast('Tap Motion ON to play video'));
  }else{
    sequenceMode=items.length>1?'frames':'image';
    $('buildingImage').src=artworkUrl;
    if(items.length>1){
      startBackgroundSequence();
    }
  }
  render();toast(items.length>1?`${items.length} frames imported · 12 fps`:'Background animation imported');
}
function startBackgroundSequence(){
  if(sequenceTimer){clearInterval(sequenceTimer);sequenceTimer=null;}
  preloadedFrames=[];
  if(sequenceMode!=='frames'||sequenceUrls.length<2)return;
  // Preload and decode optimized source frames to avoid blank/flickering frame switches.
  preloadedFrames=sequenceUrls.map(src=>{const im=new Image();im.src=src;return im;});
  sequenceTimer=setInterval(()=>{
    if(!state.motion||document.hidden)return;
    const next=(sequenceIndex+1)%sequenceUrls.length;
    if(preloadedFrames[next]&&!preloadedFrames[next].complete)return;
    sequenceIndex=next;
    $('buildingImage').src=sequenceUrls[next];
  },1000/12);
}
function setBackgroundMotion(){const v=$('buildingVideo');if(sequenceMode==='video'){if(state.motion)v.play().catch(()=>{});else v.pause();}}

async function refreshWeather(){const btn=document.querySelector('[data-action="weather"]');if(btn)btn.disabled=true;try{const url='https://api.open-meteo.com/v1/forecast?latitude=65.0121&longitude=25.4651&current=temperature_2m&timezone=Europe%2FHelsinki';const resp=await fetch(url,{signal:AbortSignal.timeout(7000)});if(!resp.ok)throw new Error('HTTP '+resp.status);const data=await resp.json();const t=data?.current?.temperature_2m;if(!Number.isFinite(t))throw Error('missing temperature');state.outdoorTemp=t;state.outdoorSource='Open-Meteo';render();toast('Outdoor weather updated · Oulu')}catch(e){render();toast('Weather unavailable · demo value retained')}}
function scheduledTick(){const d=new Date();const key=`${d.getFullYear()}-${d.getMonth()}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;if(lastMinute===key)return;lastMinute=key;const hm=d.toTimeString().slice(0,5);for(const rt of state.routines)if(rt.enabled&&rt.time===hm)scheduleRun(rt,'Routine')}
function updateClockAndBoost(){clock();if(state.boostUntil&&Date.now()>=state.boostUntil){state.boostUntil=0;state.ventMode=state.preBoost||'Auto';state.ventilation=state.preBoostVentilation;state.preBoost='Auto';render();toast('Boost finished · previous ventilation settings restored')}scheduledTick();}
$('buildingImage').src=sequenceUrls[0];startBackgroundSequence();setInterval(updateClockAndBoost,1000);render();
})();
