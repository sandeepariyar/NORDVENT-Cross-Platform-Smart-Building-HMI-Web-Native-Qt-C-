'use strict';
// NORDVENT engineering showcase: HTML is the design reference; runtime diagnostics come from native C++.
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
const webFrame=$('#webApp'),qtFrame=$('#qtApp');
const webViewport=$('#webViewport'),qtViewport=$('#qtViewport');
let qtStarted=false,qtReady=false,nativeSnapshot=null;
let iconManifest=[];let toastTimeout=0;

function notify(message){const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('visible'),2100)}
function fitFrame(iframe,viewport){if(!iframe||!viewport)return;const scale=Math.min(viewport.clientWidth/800,viewport.clientHeight/480);iframe.style.transform=`scale(${scale})`;iframe.style.left=`${Math.max(0,(viewport.clientWidth-800*scale)/2)}px`;iframe.style.top=`${Math.max(0,(viewport.clientHeight-480*scale)/2)}px`}
function resizeApps(){fitFrame(webFrame,webViewport);fitFrame(qtFrame,qtViewport)}
if('ResizeObserver' in window){const observer=new ResizeObserver(resizeApps);observer.observe(webViewport);observer.observe(qtViewport)}
addEventListener('resize',resizeApps);resizeApps();

// Keep both independent runtime panels in this same page — no external navigation.
$$('[data-layout]').forEach(b=>b.addEventListener('click',()=>{const layout=b.dataset.layout;$('#labGrid').classList.toggle('web-only',layout==='web');$('#labGrid').classList.toggle('qt-only',layout==='qt');$$('[data-layout]').forEach(x=>{const selected=x===b;x.classList.toggle('is-selected',selected);x.setAttribute('aria-pressed',String(selected))});requestAnimationFrame(resizeApps)}));
$('#webRefresh').addEventListener('click',()=>{webFrame.src='web/index.html';notify('HTML simulation reset')});
$('#qtRefresh').addEventListener('click',()=>{if(!qtStarted){loadQt();return;}resetNativeDiagnostics();qtReady=false;$('#qtStatus').textContent='◌ RESTARTING';$('#qtStatus').className='runtime-status status-busy';qtFrame.src=`native/?embed=1&restart=${Date.now()}`});
// Two device inspection modes. Neither invokes the browser's fullscreen API.
let physicalCard=null;
let physicalMode='device';
const physicalMask=$('#physicalMask'),physicalTools=$('#physicalTools');
const physicalAdjust=$('#physicalAdjust'),physicalPercent=$('#physicalPercent');
const savedPhysicalScale=Number(localStorage.getItem('nordventPhysicalCalibration'))||100;
physicalAdjust.value=Math.min(180,Math.max(50,savedPhysicalScale));
function renderPhysical(){
  if(!physicalCard)return;
  const nominalWidthMm=5*25.4*800/Math.hypot(800,480);
  const nominalHeightMm=5*25.4*480/Math.hypot(800,480);
  const factor=Number(physicalAdjust.value)/100;
  const width=physicalMode==='pixels'?800:nominalWidthMm*96/25.4*factor;
  const height=physicalMode==='pixels'?480:nominalHeightMm*96/25.4*factor;
  const roomWidth=Math.max(100,innerWidth-30),roomHeight=Math.max(100,innerHeight-225);
  const safetyScale=Math.min(1,roomWidth/width,roomHeight/height);
  const scaledWidth=width*safetyScale,scaledHeight=height*safetyScale;
  physicalCard.style.setProperty('--physical-width',scaledWidth+'px');
  physicalCard.style.setProperty('--physical-height',scaledHeight+'px');
  physicalCard.style.setProperty('--physical-scale',scaledWidth/800);
  $('#physicalRuler').style.width=(100*96/25.4*factor)+'px';
  physicalPercent.textContent=physicalMode==='pixels'?'800 × 480 logical pixels at CSS 1:1'+(safetyScale<1?' · reduced to fit window':''):'5-inch screen · '+Number(physicalAdjust.value)+'% calibration'+(safetyScale<1?' · reduced to fit window':'');
  resizeApps();
}
function closePhysical(){
  if(!physicalCard)return;
  physicalCard.classList.remove('physical-active');
  physicalCard.style.removeProperty('--physical-width');
  physicalCard.style.removeProperty('--physical-height');
  physicalCard.style.removeProperty('--physical-scale');
  physicalCard=null;
  physicalMask.hidden=true;physicalTools.hidden=true;
  document.body.classList.remove('physical-open');
  resizeApps();
}
function openPhysical(card,mode){
  if(physicalCard)closePhysical();
  physicalCard=card;physicalMode=mode;
  physicalMask.hidden=false;physicalTools.hidden=false;
  document.body.classList.add('physical-open');
  card.classList.add('physical-active');
  $('#physicalLabel').textContent='NORDVENT · '+(mode==='pixels'?'800 × 480 PIXEL INSPECTION':'CALIBRATED PHYSICAL SCREEN');
  physicalTools.classList.toggle('pixel-mode',mode==='pixels');
  renderPhysical();
}
$$('[data-expand]').forEach(b=>b.addEventListener('click',()=>{
  const card=b.dataset.expand==='web'?$('#webCard'):$('#qtCard');
  openPhysical(card,'device');
}));
$('#closePhysical').addEventListener('click',closePhysical);
physicalMask.addEventListener('click',closePhysical);
addEventListener('keydown',event=>{if(event.key==='Escape'&&physicalCard)closePhysical()});
physicalAdjust.addEventListener('input',()=>{localStorage.setItem('nordventPhysicalCalibration',physicalAdjust.value);renderPhysical()});
$('#resetPhysical').addEventListener('click',()=>{physicalAdjust.value=100;localStorage.removeItem('nordventPhysicalCalibration');renderPhysical()});
$('#physicalModeToggle').addEventListener('click',()=>{
  physicalMode=physicalMode==='pixels'?'device':'pixels';
  $('#physicalModeToggle').textContent=physicalMode==='pixels'?'View at calibrated 5-inch size':'View at 800×480 pixels';
  $('#physicalLabel').textContent='NORDVENT · '+(physicalMode==='pixels'?'800 × 480 PIXEL INSPECTION':'CALIBRATED PHYSICAL SCREEN');
  physicalTools.classList.toggle('pixel-mode',physicalMode==='pixels');
  renderPhysical();
});
addEventListener('resize',()=>{if(physicalCard)renderPhysical()});

$('#menuToggle').addEventListener('click',()=>{const header=$('.site-header');const open=header.classList.toggle('menu-open');$('#menuToggle').setAttribute('aria-expanded',String(open))});
$$('.primary-nav a').forEach(a=>a.addEventListener('click',()=>{$('.site-header').classList.remove('menu-open');$('#menuToggle').setAttribute('aria-expanded','false')}));
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){$$('.primary-nav a').forEach(a=>a.classList.toggle('is-current',a.getAttribute('href')==='#'+e.target.id))}}),{rootMargin:'-20% 0px -65% 0px'});$$('main section[id]').forEach(s=>observer.observe(s))}

// Actual native Qt app status is reported by the Qt host page using a same-origin message.
function updateQtStatus(label,state){const el=$('#qtStatus');el.textContent=label;el.className=`runtime-status status-${state}`}
async function qtBinaryPresent(){try{const r=await fetch('native/NordventDesktop.wasm',{method:'HEAD',cache:'no-cache'});return r.ok}catch{return false}}
async function loadQt(){if(qtStarted)return;updateQtStatus('◌ CHECKING BUNDLE','busy');$('#qtHint').textContent='Checking for the published Qt WebAssembly build…';$('#loadQt').disabled=true;
  if(!(await qtBinaryPresent())){updateQtStatus('○ BUILD PENDING','error');$('#qtHint').textContent='The compiled Qt .wasm file has not been published at /native/ yet. Original source is preserved.';$('#qtFootStatus').textContent='WASM bundle missing · Not a screenshot claimed as live';$('#loadQt').textContent='Retry Qt build check ↻';$('#loadQt').disabled=false;return}
  qtStarted=true;updateQtStatus('◌ INITIALIZING','busy');$('#qtFootStatus').textContent='Loading real QML/C++ WebAssembly application';$('#wasmGate').hidden=true;qtFrame.src='native/?embed=1';resizeApps();}
$('#loadQt').addEventListener('click',loadQt);
const nativeMetricIds=['nativeRevision','nativeUptime','nativePage','nativeFlow','nativeFaults','nativeMotion'];
function resetNativeDiagnostics(){
  nativeSnapshot=null;
  $('#nativeDiagStatus').textContent='AWAITING NATIVE RUNTIME';
  nativeMetricIds.forEach(id=>$('#'+id).textContent='—');
  $('#nativeStateOutput').textContent='Native controller data appears after the Qt/WebAssembly application starts. No physical sensor, actuator or MCU telemetry is connected.';
  $('#copyNativeState').disabled=true;
}
function updateNativeDiagnostics(value){
  if(value.schema!==1||value.runtime!=='qt-wasm'||typeof value.revision!=='number')return;
  nativeSnapshot=value;
  const pages=['Home','Rooms','Climate','Energy','Routines','More'];
  const currentRoom=Number.isInteger(value.selectedRoom)&&value.selectedRoom>=0?value.rooms?.[value.selectedRoom]?.name:null;
  $('#nativeDiagStatus').textContent='● C++ BACKEND CONNECTED';
  $('#nativeRevision').textContent=String(value.revision);
  $('#nativeUptime').textContent=(Number(value.uptimeMs)/1000).toFixed(1)+' s';
  $('#nativePage').textContent=currentRoom||pages[value.page]||'View '+value.page;
  $('#nativeFlow').textContent=String(value.flow);
  $('#nativeFaults').textContent=String(value.faultCount);
  $('#nativeMotion').textContent=(value.motion?'On':'Off')+' / '+(value.effects?'On':'Off');
  $('#nativeStateOutput').textContent=JSON.stringify(value,null,2);
  $('#copyNativeState').disabled=false;
}
$('#copyNativeState').addEventListener('click',()=>{
  if(nativeSnapshot)copyText(JSON.stringify(nativeSnapshot,null,2),'Native controller JSON copied');
});
addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==qtFrame.contentWindow)return;
  const value=event.data||{};
  if(value.type==='NORDVENT_NATIVE_STATE'){updateNativeDiagnostics(value);return;}
  if(value.type==='NORDVENT_WASM_READY'){
    qtReady=true;
    updateQtStatus('● QT RUNTIME ACTIVE','on');
    $('#qtFootStatus').textContent='Real compiled Qt Quick / QML / C++17 · simulated control states';
  }
  if(value.type==='NORDVENT_WASM_ERROR'||value.type==='NORDVENT_WASM_EXIT'){
    qtReady=false;
    resetNativeDiagnostics();
    $('#nativeDiagStatus').textContent='QT RUNTIME UNAVAILABLE';
    updateQtStatus('● QT RUNTIME ERROR','error');
    $('#qtFootStatus').textContent=String(value.message||'Qt runtime failed; inspect browser console').slice(0,130);
  }
});
// The live Qt/WebAssembly port auto-starts when deployed. A missing binary is never represented by a screenshot labelled live.
qtBinaryPresent().then(ok=>{if(ok){loadQt()}else if(!qtStarted){updateQtStatus('○ BUILD NOT DEPLOYED','idle');$('#qtFootStatus').textContent='QML/C++ source exists · Generated WebAssembly not yet published';$('#qtHint').textContent='Deploy the GitHub Actions Qt build to activate this panel.'}});

// The embedded HTML prototype is a comparison surface, not an engineering inspector.
webFrame.addEventListener('load',resizeApps);
async function copyText(value,message){
  try { await navigator.clipboard.writeText(value); notify(message); }
  catch { notify('Clipboard unavailable on this page'); }
}

// Authored from NORDVENT's original web :root palette and 48x48 Qt PNG exports.
async function initDesignSystem(){try{const [tokenResp,iconResp]=await Promise.all([fetch('design-system/tokens.json'),fetch('design-system/icons.json')]);if(!tokenResp.ok||!iconResp.ok)throw Error('Design system manifest missing');const tokens=await tokenResp.json();iconManifest=await iconResp.json();
    const palette=$('#colorGrid');for(const [name,hex] of Object.entries(tokens.colors)){const b=document.createElement('button');b.type='button';b.className='color-card';b.setAttribute('aria-label',`Copy ${name} ${hex}`);const swatch=document.createElement('span');swatch.className='color-swatch';swatch.style.background=hex;const heading=document.createElement('strong');heading.textContent=name.replace(/-/g,' ');const code=document.createElement('small');code.textContent=hex.toUpperCase();b.append(swatch,heading,code);b.addEventListener('click',()=>copyText(hex.toUpperCase(),`${name} · ${hex.toUpperCase()} copied`));palette.append(b)}
    $('#assetCount').textContent=String(iconManifest.length);renderIcons();}catch(err){$('#colorGrid').textContent='The source-token manifest could not be loaded.';$('#iconGrid').textContent='Native icon manifest unavailable.';$('#iconCount').textContent=String(err.message)}}
function renderIcons(){const query=$('#iconSearch').value.trim().toLowerCase(),variant=$('#iconVariant').value;const items=iconManifest.filter(item=>(variant==='all'||item.variant===variant)&&(!query||item.name.toLowerCase().includes(query)));const grid=$('#iconGrid');grid.replaceChildren();const fragment=document.createDocumentFragment();
  for(const item of items){const button=document.createElement('button');button.type='button';button.className='icon-card';button.title=`${item.name} — original native Qt export`;const img=document.createElement('img');img.loading='lazy';img.src=item.path;img.width=48;img.height=48;img.alt='';const label=document.createElement('span');label.textContent=item.name.replace(/_/g,' / ');button.append(img,label);button.addEventListener('click',()=>copyText(`native-qt/assets/icons/${item.name}.png`,'Native asset path copied'));fragment.append(button)}grid.append(fragment);$('#iconCount').textContent=`Showing ${items.length} of ${iconManifest.length} real icon files`}
$('#iconSearch').addEventListener('input',renderIcons);$('#iconVariant').addEventListener('change',renderIcons);initDesignSystem();

// The specimen playground is a separate controlled preview, not a live hardware connection.
let clicks=0;function feedback(message){clicks++;$('#sampleFeedback').textContent=`LOCAL / ${String(clicks).padStart(2,'0')} · ${message}`;}
$$('[data-theme]').forEach(button=>button.addEventListener('click',()=>{$$('[data-theme]').forEach(b=>b.classList.toggle('is-selected',b===button));$('#componentSurface').dataset.themeMode=button.dataset.theme;feedback(button.dataset.theme==='day'?'Light concept (exploration only)':'Original dark tokens')}));
$$('[data-demo-action]').forEach(button=>button.addEventListener('click',()=>feedback(button.dataset.demoAction)));
$$('[data-demo-mode]').forEach(button=>button.addEventListener('click',()=>{$$('[data-demo-mode]').forEach(b=>{const on=b===button;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});$('#modeValue').textContent=button.dataset.demoMode.toUpperCase();feedback(`Mode: ${button.dataset.demoMode}`)}));
$('#setpointDemo').addEventListener('input',event=>{$('#setpointValue').textContent=Number(event.target.value).toFixed(1);feedback(`Setpoint: ${event.target.value} °C`)});
$('#fanSwitch').addEventListener('click',()=>{const sw=$('#fanSwitch'),on=sw.getAttribute('aria-checked')!=='true';sw.setAttribute('aria-checked',String(on));sw.classList.toggle('on',on);$('#fanLabel').textContent=on?'ON':'OFF';feedback(`Ventilation: ${on?'ON':'OFF'}`)});
$('#blindToggle').addEventListener('click',()=>{$('#blindStudy').classList.toggle('is-closed');feedback('Blinds sample toggled')});
$('#motionEnabled').addEventListener('change',event=>{$('#motionGallery').classList.toggle('is-paused',!event.target.checked);feedback(event.target.checked?'Motion enabled':'Motion paused')});
fetch('metrics.json').then(r=>r.ok?r.json():null).then(data=>{if(data&&typeof data.framesPngCompressedMiB==='number')$('#frameMiB').textContent=`${data.framesPngCompressedMiB.toFixed(2)} MiB`}).catch(()=>{});
