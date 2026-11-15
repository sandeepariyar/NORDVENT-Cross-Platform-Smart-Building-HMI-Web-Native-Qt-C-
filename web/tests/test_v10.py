"""Check NORDVENT v10 standalone at the exact fixed 800x480 logical target."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'NORDVENT_Standalone.html').read_text()
checks=[]
errors=[]

def check(cond,msg):
    if not cond: raise AssertionError(msg)
    checks.append(msg)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':800,'height':480},device_scale_factor=1)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html,wait_until='load')
    page.wait_for_timeout(300)
    check(page.locator('main.device').count()==1, 'Main fixed device')
    geom=page.locator('#app').bounding_box()
    check(round(geom['width'])==800 and round(geom['height'])==480,'Fixed 800x480 canvas')
    check(not page.evaluate('document.documentElement.scrollHeight>innerHeight'), 'No page scrolling')
    check(page.locator('#sceneName').inner_text() in ('Away','Home','Night','Custom'), 'Scene visible')
    page.screenshot(path=str(root/'preview_home.png'))

    for panel in ['rooms','climate','energy','routines','more']:
        page.locator(f'button.nav-item[data-page="{panel}"]').click()
        page.wait_for_timeout(100)
        check(page.locator('#workspace').get_attribute('data-page')==panel, panel+' navigation')
        check(page.evaluate('document.documentElement.scrollHeight<=innerHeight'),panel+' no scrolling')
        if panel!='rooms':
            selector='.page-shell'
            check(page.locator(selector).count()==1,panel+' main panel present')
            vals=page.locator(selector).evaluate('(e)=>({ch:e.clientHeight,sh:e.scrollHeight,bb:e.getBoundingClientRect().bottom})')
            check(vals['sh']<=vals['ch']+2,panel+f' panel content fits: {vals}')
    page.locator('button.nav-item[data-page="rooms"]').click()
    page.wait_for_timeout(350)
    check(page.locator('.room-card').count()==4,'Four photographic room cards')
    check(page.locator('.room-card .room-thumb').count()==4,'Four independent images')
    check(page.evaluate("[...document.querySelectorAll('.room-thumb')].every(x=>x.complete&&x.naturalWidth>0)"),'Images decoded')
    check(page.locator('.rooms-panel').evaluate('(e)=>e.scrollHeight<=e.clientHeight+2'),'Rooms panel fits without scroll')
    check(page.locator('#thermalFx').get_attribute('class')=='active', 'Temperature target overlays active in Rooms')
    page.screenshot(path=str(root/'preview_rooms.png'))
    # room-specific changes must not affect any other room
    page.locator('button.room-card[data-room="bedroom"]').click()
    check('Bedroom' in page.locator('.room-head h2').inner_text(),'Bedroom focused')
    check(page.locator('output').first.inner_text()=='17.0°C','Original bedroom target 17°C')
    init_living_fill=page.locator('#temp-living').evaluate('(e)=>getComputedStyle(e).fill')
    for _ in range(14): page.locator('button[data-action="tempUp"][data-room="bedroom"]').click()
    check(page.locator('output').first.inner_text()=='24.0°C','Bedroom target adjusted to 24°C')
    page.wait_for_timeout(650)
    bed_fill=page.locator('#temp-bedroom').evaluate('(e)=>getComputedStyle(e).fill')
    check(bed_fill=='rgb(255, 188, 115)', f'Bedroom thermal overlay shifts to warm amber ({bed_fill})')
    check(page.locator('#temp-living').evaluate('(e)=>getComputedStyle(e).fill')==init_living_fill,'Other room thermal tint unchanged')
    page.locator('button[data-action="lightsOn"][data-room="bedroom"]').click()
    check('100%' in page.locator('#roomView').inner_text(),'Bedroom lights on')
    page.locator('button[data-action="blindOpen"][data-room="bedroom"]').click()
    check('0% closed' in page.locator('#roomView').inner_text(),'Bedroom blinds open')
    page.screenshot(path=str(root/'preview_bedroom.png'))
    page.locator('button[data-room="living"].rail-btn').click()
    check(page.locator('output').first.inner_text()=='17.0°C','Living room target unaffected')
    check('100% closed' in page.locator('#roomView').inner_text(),'Living blinds unaffected')
    page.locator('button[data-action="closeRoom"]').click()
    page.locator('button.nav-item[data-page="rooms"]').click()
    check('Target 24.0°' in page.locator('.room-card[data-room="bedroom"]').inner_text(),'Card target reflects bedroom setting')
    page.screenshot(path=str(root/'preview_temperature.png'))

    # scene dialog redesigned as borderless list, and scene actions remain gated by confirmation.
    page.locator('#sceneTop').click()
    check(page.locator('button.scene-opt').count()==3,'Three scene choices')
    page.screenshot(path=str(root/'preview_scenes.png'))
    page.locator('button[data-action="scenePreview"][data-scene="Night"]').click()
    check('No alarm or door-lock commands' in page.locator('#dialogBody').inner_text(),'Scene preview warns about scope')
    page.locator('button[data-action="applyScene"][data-scene="Night"]').click()
    check(page.locator('#sceneName').inner_text()=='Night','Night scene applied')
    check(len(errors)==0,f'No JS errors: {errors}')
    browser.close()

print('PASS',len(checks),'checks, JavaScript errors',len(errors))
for c in checks: print('✓',c)
