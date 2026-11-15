from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
source=(root/'NORDVENT_Standalone.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-web-security'])
 page=b.new_page(viewport={'width':800,'height':480},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(source,wait_until='load')
 tests=0
 def ok(expr,msg):
  global tests
  assert expr,msg
  tests+=1
 # fixed viewport and no scrollability
 for pg in ['home','rooms','climate','energy','routines','more']:
  page.locator(f'.nav-item[data-page="{pg}"]').click()
  dimensions=page.evaluate('''() => ({bodyHeight:document.body.scrollHeight, documentHeight:document.documentElement.scrollHeight, deviceHeight:document.getElementById('app').getBoundingClientRect().height, workspaceHeight:document.getElementById('workspace').getBoundingClientRect().height, navTop:document.querySelector('nav').getBoundingClientRect().top})''')
  ok(dimensions['bodyHeight'] <= 480 and dimensions['documentHeight'] <= 480 and dimensions['deviceHeight']==480, f'overflow {pg} {dimensions}')
 # room isolation and kitchen unsupported blinds
 page.locator('.nav-item[data-page="rooms"]').click();page.locator('button.room-card[data-room="bedroom"]').click()
 ok(page.locator('.room-quick').count()==1,'room dock')
 before=page.locator('.room-quick').inner_text()
 page.locator('button[data-action="tempUp"][data-room="bedroom"]').click()
 ok('17.5°' in page.locator('.room-quick').inner_text(),'bedroom target updated')
 page.locator('button[data-action="blindOpen"][data-room="bedroom"]').click()
 ok('Blinds 0%' in page.locator('.room-quick').inner_text(),'bedroom blinds open')
 page.locator('button.rail-btn[data-room="living"]').click()
 ok('Blinds 100%' in page.locator('.room-quick').inner_text(),'living blinds isolated')
 page.locator('button.rail-btn[data-room="utility"]').click()
 ok('Not fitted' in page.locator('.room-quick').inner_text(),'utility has no blinds')
 page.locator('button[data-action="closeRoom"]').click()
 # boost must not change room lights (home scene intentionally does, boost does not)
 page.locator('button.room-tag[data-room="living"]').click()
 page.locator('button[data-action="lightsOn"][data-room="living"]').click()
 page.locator('button[data-action="closeRoom"]').click()
 page.locator('button[data-action="boost"]').click()
 page.locator('button.room-tag[data-room="living"]').click()
 ok(page.locator('.light-quick .quick-set button[data-action="lightsOn"]').get_attribute('class')=='active','boost keeps lights')
 page.locator('button[data-action="closeRoom"]').click();page.locator('button[data-action="boost"]').click()
 # scenes are header buttons with confirmation; not dropdown
 page.locator('.mode-choice[data-scene="Night"]').click()
 ok(page.locator('#dialogTitle').inner_text().startswith('Night mode'),'night mode preview')
 page.locator('button[data-action="applyScene"][data-scene="Night"]').click()
 ok(page.locator('.mode-choice[data-scene="Night"]').get_attribute('aria-pressed')=='true','night mode active')
 # lock and alarm confirmations
 page.locator('#headerLock').click()
 ok('Unlock' in page.locator('#dialogTitle').inner_text(),'lock confirmation')
 page.locator('#dialogFooter .btn.primary').click()
 ok('Unlocked' in page.locator('#headerLock').inner_text(),'lock state')
 page.locator('#headerAlarm').click()
 ok('Arm security' in page.locator('#dialogTitle').inner_text(),'alarm confirmation')
 page.locator('#dialogFooter .btn.primary').click()
 ok('Armed' in page.locator('#headerAlarm').inner_text(),'alarm state')
 # edit routine list without scrolling
 page.locator('.nav-item[data-page="routines"]').click()
 ok(page.locator('.routine-row').count()>=1,'routine list')
 page.locator('.routine-row .routine-edit').first.click()
 ok('Edit' in page.locator('#dialogTitle').inner_text(),'routine editor')
 page.locator('button[data-action="dismiss"]').first.click()
 ok(not page.locator('#modalBack').is_visible(),'modal dismissed')
 # all interactive buttons on pages remain within app rect, except non-visible modal buttons
 for pg in ['home','rooms','climate','energy','routines','more']:
  page.locator(f'.nav-item[data-page="{pg}"]').click()
  data=page.evaluate('''() => { let bad=[];for(let e of document.querySelectorAll('#view button')){let r=e.getBoundingClientRect();if(r.width>0&&r.height>0&&(r.left<0||r.right>800||r.top<46||r.bottom>421))bad.push({name:e.textContent.trim().slice(0,20),rect:[r.left,r.top,r.right,r.bottom]});}return bad}''')
  ok(not data,f'visible controls clipped on {pg}: {data}')
 ok(not errors,f'JS errors: {errors}')
 print(f'{tests} interactive/geometry checks passed; no uncaught page errors')
 b.close()
