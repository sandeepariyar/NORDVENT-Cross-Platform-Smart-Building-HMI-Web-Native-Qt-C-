from pathlib import Path
from playwright.sync_api import sync_playwright
import json
root=Path(__file__).resolve().parent.parent
html=(root/'NORDVENT_Standalone.html').read_text()
results=[]
def ck(value,label):
    results.append((label,bool(value)))
    if not value: print('FAIL',label)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':800,'height':480})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html,wait_until='domcontentloaded',timeout=120000)
    page.wait_for_timeout(500)
    ck(page.locator('.home-panel').is_visible(),'Home starts ready')
    ck(page.locator('.mode-choice.active').inner_text()=='Home','Default building mode is Home')
    # startup summary via rooms
    page.locator('[data-page="rooms"]').click()
    cards=page.locator('.room-pick').all()
    ck(len(cards)==4,'Four selectable rooms')
    ck('Lights on' in page.locator('.room-pick[data-room="living"]').inner_text(),'Living starts ON')
    ck('Lights on' in page.locator('.room-pick[data-room="kitchen"]').inner_text(),'Kitchen starts ON')
    ck('Lights off' in page.locator('.room-pick[data-room="bedroom"]').inner_text(),'Bedroom starts OFF')
    ck('Lights off' in page.locator('.room-pick[data-room="utility"]').inner_text(),'Utility starts OFF')
    # select bedroom
    page.locator('.room-pick[data-room="bedroom"]').click()
    page.wait_for_timeout(300)
    ck(page.locator('.room-side h2').inner_text()=='Bedroom','Bedroom opens')
    ck(page.locator('.room-mini-nav .room-switch-tile').count()==4,'Four in-room illustrated nav targets')
    ck(page.locator('.room-mini-nav .room-switch-tile.active').get_attribute('data-room')=='bedroom','Bedroom highlight in picker')
    ck(page.locator('button[data-action="blindOpen"]').get_attribute('class')=='active','Bedroom blinds open at start')
    ck(page.locator('button[data-action="lightsOff"]').get_attribute('class')=='active','Bedroom lights off at start')
    # save unique bedroom state, make cycling test
    page.locator('button[data-action="tempUp"]').click()
    ck('20.5' in page.locator('.room-action-top strong').first.inner_text(),'Bedroom temperature changed')
    page.locator('button[data-action="lightsOn"]').click()
    page.locator('button[data-action="blindClose"]').click()
    ck(page.locator('button[data-action="blindClose"]').get_attribute('class')=='active','Bedroom blinds changed to closed')
    page.locator('button[data-action="nextRoom"]').click()
    ck(page.locator('.room-side h2').inner_text()=='Living Room','Next switches to Living')
    ck(page.locator('.room-mini-nav .active').get_attribute('data-room')=='living','Highlight switches to Living')
    ck(page.locator('button[data-action="lightsOn"]').get_attribute('class')=='active','Living lights are ON')
    ck(page.locator('button[data-action="blindOpen"]').get_attribute('class')=='active','Living blinds OPEN')
    ck('22.0' in page.locator('.room-action-top strong').first.inner_text(),'Living temperature separate')
    # direct illustration click from nested img
    page.locator('.room-switch-tile[data-room="kitchen"] img').click()
    ck(page.locator('.room-side h2').inner_text()=='Kitchen','Illustrated Kitchen tile switches immediately')
    ck(page.locator('button[data-action="lightsOn"]').get_attribute('class')=='active','Kitchen lights ON')
    ck(page.locator('button[data-action="blindClose"]').get_attribute('class')=='active','Kitchen blinds CLOSED')
    # previous arrow
    page.locator('button[data-action="prevRoom"]').click()
    ck(page.locator('.room-side h2').inner_text()=='Living Room','Previous returns to Living')
    page.locator('.room-switch-tile[data-room="bedroom"]').click()
    ck('20.5' in page.locator('.room-action-top strong').first.inner_text(),'Bedroom target retained after switching')
    ck(page.locator('button[data-action="blindClose"]').get_attribute('class')=='active','Bedroom blinds retained after switching')
    page.locator('.room-switch-tile[data-room="utility"]').click()
    ck(page.locator('.room-side h2').inner_text()=='Utility','Utility selectable')
    ck(page.locator('.room-action-buttons.three').count()==0,'Utility correctly has no blind controls')
    page.locator('button[data-action="nextRoom"]').click()
    ck(page.locator('.room-side h2').inner_text()=='Bedroom','Next wraps from Utility to Bedroom')
    ck(page.locator('.room-side').is_visible(),'Room panel stays open')
    # no overflow and image on mini selectors
    ck(page.evaluate('''() => {const el=document.querySelector('.room-side');return el.scrollHeight<=el.clientHeight+2 && document.documentElement.scrollWidth<=800 && document.documentElement.scrollHeight<=480}'''),'Panel and screen have no overflow')
    ck(page.evaluate('''() => [...document.querySelectorAll('.room-switch-tile img')].every(e=>e.complete&&e.naturalWidth>0)'''),'Illustrations embedded and loaded')
    ck(page.evaluate('''() => [...document.querySelectorAll('.room-switch-tile')].every(e=>{let r=e.getBoundingClientRect();return r.width>=42 && r.height>=42})'''),'Room tiles have touch-friendly dimensions')
    page.screenshot(path=str(root/'v13.3-room-switch-preview.png'))
    # scene transition then home resets mixed defaults
    page.locator('.mode-choice[data-scene="Away"]').click()
    page.locator('#dialogYes').count() # scene preview confirmation may use applyScene
    if page.locator('[data-action="applyScene"]').count(): page.locator('[data-action="applyScene"]').click()
    page.locator('.mode-choice[data-scene="Home"]').click()
    if page.locator('[data-action="applyScene"]').count(): page.locator('[data-action="applyScene"]').click()
    page.locator('[data-page="rooms"]').click()
    ck('Lights on' in page.locator('.room-pick[data-room="living"]').inner_text(),'Home mode restores Living lights ON')
    ck('Lights on' in page.locator('.room-pick[data-room="kitchen"]').inner_text(),'Home mode restores Kitchen lights ON')
    ck(not errors,'No JavaScript runtime errors')
    browser.close()
print(json.dumps({'passed':sum(ok for _,ok in results),'total':len(results),'failures':[label for label,ok in results if not ok]},indent=2))
assert all(ok for _,ok in results)
