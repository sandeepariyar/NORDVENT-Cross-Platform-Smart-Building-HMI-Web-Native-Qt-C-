'use strict';
const $ = (sel,root=document)=>root.querySelector(sel);
const $$ = (sel,root=document)=>[...root.querySelectorAll(sel)];
const frame=$('#webApp'), viewport=$('#webViewport'), bridgeStatus=$('#bridgeStatus');
let history=[], previous=null, lastDiff={}, frameDoc=null, frameWin=null, actionSeq=0;
const limits={maxHistory:150};
function resizeIframe(){const s=viewport.clientWidth/800;frame.style.transform=`scale(${s})`;}
new ResizeObserver(resizeIframe).observe(viewport);addEventListener('resize',resizeIframe);
function snapshot(){try{return frameWin?.__NORDVENT_DEV__?.snapshot()||null;}catch{return null;}}
function equal(a,b){return JSON.stringify(a)===JSON.stringify(b)}
function changes(a,b,prefix='',out={}){
  if(equal(a,b))return out;
  if(a && b && typeof a==='object' && typeof b==='object' && !Array.isArray(a) && !Array.isArray(b)) {
    for(const k of new Set([...Object.keys(a),...Object.keys(b)])) changes(a[k],b[k],prefix?`${prefix}.${k}`:k,out);
  } else out[prefix]={before:a===undefined?null:a,after:b===undefined?null:b};
  return out;
}
function pushEvent(evt){history.unshift(evt);history=history.slice(0,limits.maxHistory);$('#eventCount').textContent=history.length;$('#lastEventTime').textContent=evt.time;renderEvents();}
function renderEvents(){const pane=$('#eventsPanel');pane.replaceChildren();if(!history.length){const x=document.createElement('div');x.className='empty-log';x.textContent='Interact with the live NORDVENT preview to begin tracing.';pane.append(x);return;}
  history.slice(0,70).forEach(e=>{const line=document.createElement('div');line.className='event-line';const time=document.createElement('span');time.className='event-time';time.textContent=e.time;const main=document.createElement('div');main.className='event-main';const h=document.createElement('strong');h.textContent=`#${e.id} ${e.type.toUpperCase()} · ${e.action}`;const detail=document.createElement('small');const c=Object.entries(e.changes);detail.textContent=c.length?c.map(([k,v])=>`${k}: ${JSON.stringify(v.before)} → ${JSON.stringify(v.after)}`).slice(0,5).join('  ·  '):'No tracked simulation-state change (may be navigation, dialog, or non-state interaction).';main.append(h,detail);line.append(time,main);pane.append(line);});}
function renderJson(){const s=snapshot();$('#statePanel').textContent=s?JSON.stringify(s,null,2):'State bridge unavailable';$('#diffPanel').textContent=Object.keys(lastDiff).length?JSON.stringify(lastDiff,null,2):'No tracked state changes yet.';}
function targetName(t){if(t.dataset.page)return `Navigate / ${t.dataset.page}`;if(t.dataset.range)return `Range / ${t.dataset.range}${t.dataset.room?' / '+t.dataset.room:''}`;if(t.dataset.action)return `${t.dataset.action}${t.dataset.room?' / '+t.dataset.room:''}`;if(t.dataset.room)return `Open room / ${t.dataset.room}`;return (t.getAttribute('aria-label')||t.textContent||t.tagName).trim().replace(/\s+/g,' ').slice(0,60)||'Interaction';}
function watch(evt){const t=evt.target?.closest?.('button,input,select');if(!t||t.disabled)return;if(evt.type==='input' && t.type!=='range')return;if(evt.type==='click' && t.type==='range')return;
  const current=snapshot();const action=targetName(t);const typ=evt.type;let val=t.value;
  setTimeout(()=>{const after=snapshot();const delta=changes(current,after);lastDiff=delta;previous=after;const time=new Date().toLocaleTimeString('en-GB',{hour12:false});pushEvent({id:++actionSeq,time,type:typ,action,inputValue:(typ==='input'?val:null),changes:delta,simulation:true});renderJson();},70);
}
function attach(){try{frameWin=frame.contentWindow;frameDoc=frameWin.document;const s=snapshot();if(!s)throw new Error('bridge missing');bridgeStatus.textContent='● WEB STATE CONNECTED';bridgeStatus.classList.add('ok');previous=s;history=[];lastDiff={};$('#eventCount').textContent='0';renderEvents();renderJson();frameDoc.addEventListener('click',watch,true);frameDoc.addEventListener('input',watch,true);frameDoc.addEventListener('change',e=>{if(e.target.tagName==='SELECT')watch(e)},true);}
catch(err){bridgeStatus.textContent='Web bridge unavailable: use http://';bridgeStatus.classList.remove('ok');console.warn('NORDVENT inspector:',err);}}
frame.addEventListener('load',()=>{resizeIframe();attach()});
// Sections
$$('[data-section]').forEach(b=>b.addEventListener('click',()=>{const name=b.dataset.section;$$('[data-section]').forEach(x=>x.classList.toggle('active',x===b));$$('.site-section').forEach(x=>x.classList.toggle('active',x.id==='section-'+name));if(name==='lab')resizeIframe();window.history.replaceState(null,'','#'+name);}));
$$('[data-layout]').forEach(b=>b.addEventListener('click',()=>{$$('[data-layout]').forEach(x=>x.classList.toggle('selected',x===b));const grid=$('#labGrid');grid.classList.remove('web-only','qt-only');if(b.dataset.layout==='web')grid.classList.add('web-only');if(b.dataset.layout==='qt')grid.classList.add('qt-only');resizeIframe()}));
$$('[data-inspect]').forEach(b=>b.addEventListener('click',()=>{$$('[data-inspect]').forEach(x=>x.classList.toggle('active',x===b));['events','state','diff'].forEach(k=>$('#'+k+'Panel').hidden=k!==b.dataset.inspect);renderJson()}));
$$('[data-nav]').forEach(b=>b.addEventListener('click',()=>{try{frameDoc.querySelector(`[data-page="${b.dataset.nav}"]`)?.click()}catch(err){console.warn(err)}}));
$('#webRefresh').addEventListener('click',()=>{frame.src='web/index.html';});
$('#clearEvents').addEventListener('click',()=>{history=[];lastDiff={};$('#eventCount').textContent='0';renderEvents();renderJson();});
$('#copyEvents').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(JSON.stringify(history,null,2));$('#copyEvents').textContent='Copied ✓';setTimeout(()=>$('#copyEvents').textContent='Copy JSON',1500)}catch{$('#copyEvents').textContent='Unavailable'}});
const screens={home:'v17_reference_home.png',rooms:'v17_reference_rooms.png',climate:'v17_reference_climate.png',energy:'v17_reference_energy.png'};
$$('[data-nav]').forEach(b=>b.addEventListener('click',()=>{if(screens[b.dataset.nav])$('#qtReference').src='assets/screens/'+screens[b.dataset.nav]}));
$('#sampleButton').addEventListener('click',e=>{const active=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',String(active));e.currentTarget.textContent=active?'Ventilation enabled':'Enable ventilation';$('#sampleState').textContent=active?'ON':'OFF';});
fetch('metrics.json').then(r=>r.json()).then(d=>{$('#frameMiB').textContent=`${d.framesPngCompressedMiB.toFixed(2)} MiB`}).catch(()=>{});
const hash=location.hash.replace('#','');if(['lab','system','architecture','study','performance'].includes(hash))document.querySelector(`[data-section="${hash}"]`)?.click();
