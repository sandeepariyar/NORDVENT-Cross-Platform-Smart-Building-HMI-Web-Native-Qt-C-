'use strict';
// NORDVENT Engineering Lab — original source inspection and UI workbench.
// The inspector observes the REAL HTML application; it does not simulate hardware or Qt telemetry.
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
const webFrame=$('#webApp'),qtFrame=$('#qtApp');
const webViewport=$('#webViewport'),qtViewport=$('#qtViewport');
let webDoc=null,webWin=null,events=[],lastDiff={},sequence=0,qtStarted=false,qtReady=false;
let iconManifest=[];let toastTimeout=0;
const metrics={eventLimit:150};

function notify(message){const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('visible'),2100)}
function fitFrame(iframe,viewport){if(!iframe||!viewport)return;const scale=Math.min(viewport.clientWidth/800,viewport.clientHeight/480);iframe.style.transform=`scale(${scale})`;iframe.style.left=`${Math.max(0,(viewport.clientWidth-800*scale)/2)}px`;iframe.style.top=`${Math.max(0,(viewport.clientHeight-480*scale)/2)}px`}
function resizeApps(){fitFrame(webFrame,webViewport);fitFrame(qtFrame,qtViewport)}
if('ResizeObserver' in window){const observer=new ResizeObserver(resizeApps);observer.observe(webViewport);observer.observe(qtViewport)}
addEventListener('resize',resizeApps);resizeApps();

// Keep both independent runtime panels in this same page — no external navigation.
$$('[data-layout]').forEach(b=>b.addEventListener('click',()=>{const layout=b.dataset.layout;$('#labGrid').classList.toggle('web-only',layout==='web');$('#labGrid').classList.toggle('qt-only',layout==='qt');$$('[data-layout]').forEach(x=>{const selected=x===b;x.classList.toggle('is-selected',selected);x.setAttribute('aria-pressed',String(selected))});requestAnimationFrame(resizeApps)}));
$('#webRefresh').addEventListener('click',()=>{webFrame.src='web/index.html';notify('HTML simulation reset')});
$('#qtRefresh').addEventListener('click',()=>{if(!qtStarted){loadQt();return;}qtReady=false;$('#qtStatus').textContent='◌ RESTARTING';$('#qtStatus').className='runtime-status status-busy';qtFrame.src=`native/?embed=1&restart=${Date.now()}`});
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
$('[data-expand]').forEach(b=>b.addEventListener('click',()=>{
  const card=b.dataset.expand==='web'?$('#webCard'):$('#qtCard');
  openPhysical(card,'device');
}));
$('#closePhysical').addEventListener('click',closePhysical);
physicalMask.addEventListener('click',closePhysical);
addEventListener('keydown',event=>{if(event.key==='Escape'&&physicalCard)closePhysical()});
physicalAdjust.addEventListener('input',()=>{localStorage.setItem('nordventPhysicalCalibration',physicalAdjust.value);renderPhysical()});
$('#resetPhysical').addEventListener('click',()=>{physicalAdjust.value=100;localStorage.removeItem('nordventPhysicalCalibration');renderPhysical()});
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
addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==qtFrame.contentWindow)return;const value=event.data||{};
  if(value.type==='NORDVENT_WASM_READY'){qtReady=true;updateQtStatus('● QT RUNTIME ACTIVE','on');$('#qtFootStatus').textContent='Real compiled Qt Quick / QML / C++17 · browser simulation'}
  if(value.type==='NORDVENT_WASM_ERROR'||value.type==='NORDVENT_WASM_EXIT'){qtReady=false;updateQtStatus('● QT RUNTIME ERROR','error');$('#qtFootStatus').textContent=String(value.message||'Qt runtime failed; inspect browser console').slice(0,130)}});
// The live Qt/WebAssembly port auto-starts when deployed. A missing binary is never represented by a screenshot labelled live.
qtBinaryPresent().then(ok=>{if(ok){loadQt()}else if(!qtStarted){updateQtStatus('○ BUILD NOT DEPLOYED','idle');$('#qtFootStatus').textContent='QML/C++ source exists · Generated WebAssembly not yet published';$('#qtHint').textContent='Deploy the GitHub Actions Qt build to activate this panel.'}});

// Source-linked instrumentation, not a synthetic second simulation.
function snapshot(){try{return webWin?.__NORDVENT_DEV__?.snapshot()||null}catch{return null}}
function eq(a,b){return JSON.stringify(a)===JSON.stringify(b)}
function diff(a,b,prefix='',result={}){if(eq(a,b))return result;if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){for(const key of new Set([...Object.keys(a),...Object.keys(b)]))diff(a[key],b[key],prefix?`${prefix}.${key}`:key,result)}else result[prefix||'value']={before:a===undefined?null:a,after:b===undefined?null:b};return result}
function eventTargetName(target){if(target.dataset.page)return`Page / ${target.dataset.page}`;if(target.dataset.range)return`Range / ${target.dataset.range}`;if(target.dataset.action)return`${target.dataset.action}${target.dataset.room?' / '+target.dataset.room:''}`;if(target.dataset.room)return`Room / ${target.dataset.room}`;return(target.getAttribute('aria-label')||target.textContent||target.tagName||'Interaction').trim().replace(/\s+/g,' ').slice(0,55)}
function pushEvent(e){events.unshift(e);events=events.slice(0,metrics.eventLimit);$('#eventCount').textContent=String(events.length);$('#lastEventTime').textContent=e.time;renderEvents()}
function renderEvents(){const container=$('#eventsPanel');container.replaceChildren();if(!events.length){const p=document.createElement('p');p.className='empty-log';p.textContent='Events will appear here as you use the HTML application.';container.append(p);return}
  events.slice(0,65).forEach(e=>{const row=document.createElement('div');row.className='event-line';const time=document.createElement('span');time.className='event-time';time.textContent=e.time;const detail=document.createElement('div');detail.className='event-main';const h=document.createElement('strong');h.textContent=`#${e.id} · ${e.type.toUpperCase()} · ${e.action}`;const sm=document.createElement('small');const changes=Object.entries(e.changes);sm.textContent=changes.length?changes.slice(0,4).map(([key,val])=>`${key}: ${JSON.stringify(val.before)} → ${JSON.stringify(val.after)}`).join(' · '):'No tracked state change (possibly navigation, focus or dialog).';detail.append(h,sm);row.append(time,detail);container.append(row)})}
function renderJSON(){const snap=snapshot();$('#statePanel').textContent=snap?JSON.stringify(snap,null,2):'Source state bridge is unavailable';$('#diffPanel').textContent=Object.keys(lastDiff).length?JSON.stringify(lastDiff,null,2):'No tracked state changes yet'}
function watch(event){const target=event.target?.closest?.('button,input,select');if(!target||target.disabled)return;if(event.type==='input'&&target.type!=='range')return;if(event.type==='click'&&target.type==='range')return;const before=snapshot();const name=eventTargetName(target);const type=event.type;
  setTimeout(()=>{const after=snapshot();lastDiff=diff(before,after);pushEvent({id:++sequence,time:new Date().toLocaleTimeString('en-GB',{hour12:false}),type,action:name,changes:lastDiff,simulation:true});renderJSON()},70)}
function attachWeb(){try{webWin=webFrame.contentWindow;webDoc=webWin.document;const initial=snapshot();if(!initial)throw Error('Original state contract not available');$('#bridgeStatus').textContent='● HTML STATE CONNECTED';$('#bridgeStatus').classList.add('ok');$('#webStatus').textContent='● LIVE WEB';webDoc.addEventListener('click',watch,true);webDoc.addEventListener('input',watch,true);webDoc.addEventListener('change',e=>{if(e.target.tagName==='SELECT')watch(e)},true);events=[];lastDiff={};$('#eventCount').textContent='0';renderEvents();renderJSON()}
  catch(error){$('#bridgeStatus').textContent='SOURCE BRIDGE UNAVAILABLE';$('#bridgeStatus').classList.remove('ok');$('#webStatus').textContent='○ SOURCE UNAVAILABLE';console.warn('NORDVENT inspector:',error)}}
webFrame.addEventListener('load',()=>{resizeApps();attachWeb()});
$$('[data-inspect]').forEach(button=>button.addEventListener('click',()=>{$$('[data-inspect]').forEach(b=>b.classList.toggle('is-selected',b===button));for(const id of ['events','state','diff'])$('#'+id+'Panel').hidden=id!==button.dataset.inspect;renderJSON()}));
$$('[data-page]').forEach(button=>button.addEventListener('click',()=>{try{const nav=webDoc?.querySelector(`[data-page="${button.dataset.page}"]`);if(nav){nav.click();notify(`Opened ${button.dataset.page} in HTML application`)}else notify('Original HTML preview is not ready')}catch{notify('Original web preview unavailable')}}));
$('#clearEvents').addEventListener('click',()=>{events=[];lastDiff={};$('#eventCount').textContent='0';renderEvents();renderJSON();notify('Inspector history cleared')});
$('#copyEvents').addEventListener('click',()=>copyText(JSON.stringify(events,null,2),'Event JSON copied'));
async function copyText(text,message){try{await navigator.clipboard.writeText(text);notify(message)}catch{notify('Clipboard unavailable on this page')}}

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
