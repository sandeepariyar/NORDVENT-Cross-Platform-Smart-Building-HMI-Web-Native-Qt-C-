from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parent.parent
F=ROOT/'NORDVENT_Standalone.html'
OUT=ROOT/'screenshots'
OUT.mkdir(exist_ok=True)
results=[]
def check(cond,msg):
    results.append((msg, bool(cond)))
    if not cond:print('FAIL',msg)

def buttons(page,selector):
    return page.locator(selector).all()

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':800,'height':480},device_scale_factor=1)
    page_errors=[]; console_errors=[]
    page.on('pageerror',lambda e: page_errors.append(str(e)))
    page.on('console',lambda m: console_errors.append(m.text) if m.type=='error' else None)
    page.set_content(F.read_text(),wait_until='domcontentloaded',timeout=120000)
    page.wait_for_timeout(500)
    def viewport_check(label):
        page.wait_for_timeout(260)  # allow the 220 ms side-panel entrance animation to settle
        results.append((label+' fixed viewport', page.evaluate('''() => {let d=document.querySelector('.device');let r=d.getBoundingClientRect();return Math.round(r.width)==800&&Math.round(r.height)==480}''')))
        results.append((label+' no document scroll', page.evaluate('''() => document.documentElement.scrollWidth <= 800 && document.documentElement.scrollHeight <=480 && document.body.scrollWidth <= 800 && document.body.scrollHeight<=480''')))
        results.append((label+' active content no vertical overflow', page.evaluate('''() => {let els=[...document.querySelectorAll('.side-panel, .room-side, .page-shell, .routines-minimal')].filter(e=>getComputedStyle(e).display!=='none' && e.offsetWidth > 0);return els.every(e=>e.scrollHeight<=e.clientHeight+2)}''')))
        visible_test=page.evaluate('''() => {let root=document.querySelector('.workspace').getBoundingClientRect();let panels=[...document.querySelectorAll('.side-panel, .room-side')].filter(e=>e.offsetWidth>0);return panels.every(e=>{let r=e.getBoundingClientRect();return r.left>=root.left-1 && r.right <= root.right+1 && r.top>=root.top-1 && r.bottom<=root.bottom+1})}''')
        if not visible_test: print('BOUND DEBUG', label, page.evaluate('''() => {let w=document.querySelector('.workspace').getBoundingClientRect();return {scroll:{workspace:[document.querySelector('.workspace').scrollLeft,document.querySelector('.workspace').scrollTop],view:[document.querySelector('.view').scrollLeft,document.querySelector('.view').scrollTop],roomView:[document.querySelector('.room-view').scrollLeft,document.querySelector('.room-view').scrollTop]}, w:[w.left,w.top,w.right,w.bottom],panels:[...document.querySelectorAll('.side-panel,.room-side')].filter(e=>e.offsetWidth>0).map(e=>{let r=e.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]})}}'''))
        results.append((label+' visible controls in logical viewport',visible_test))
    viewport_check('Home')
    check(page.locator('.home-panel').is_visible(),'Home overview present')
    check(page.locator('.mode-choice').count()==3,'Header has Home/Night/Away modes')
    check(page.locator('#headerLock').is_visible() and page.locator('#headerAlarm').is_visible(),'Lock and Alarm stay in header')
    check(page.locator('.room-side').count()==0,'Home is overview before room selection')
    check(page.evaluate("() => document.getElementById('buildingImage').getAttribute('src').startsWith('data:image/webp')"),'Uploaded frames are displayed as default')
    before=page.locator('#buildingImage').get_attribute('src')
    page.wait_for_timeout(250)
    after=page.locator('#buildingImage').get_attribute('src')
    check(before!=after,'15 frame loop advances automatically')
    page.screenshot(path=str(OUT/'01_home.png'))

    # Rooms: one column and 4 illustration assets
    page.locator('[data-page="rooms"]').click()
    viewport_check('Rooms')
    check(page.locator('.room-pick').count()==4,'Rooms contains four selectors')
    check(page.evaluate('''() => {let cards=[...document.querySelectorAll('.room-pick')].map(e=>e.getBoundingClientRect());return cards.every(c=>Math.abs(c.x-cards[0].x)<2)&&cards.every((c,i)=>i===0||c.y>cards[i-1].y)}'''),'Four cards in one vertical column')
    check(page.evaluate('''() => [...document.querySelectorAll('.room-pick-icon')].every(img=>img.complete && img.naturalWidth>0 && img.naturalHeight>0)'''),'Four SVG room illustrations load offline')
    page.screenshot(path=str(OUT/'02_rooms.png'))

    # Bedroom selected from Rooms: controls on LEFT where Home was, no bottom dock, room-specific
    page.locator('.room-pick[data-room="bedroom"]').click()
    page.wait_for_timeout(300)
    viewport_check('Bedroom')
    check(page.locator('.room-side').is_visible(),'Bedroom controls appear')
    check(page.evaluate('''() => {let a=document.querySelector('.room-side').getBoundingClientRect();let h=document.querySelector('.home-panel');return a.left < 3 && a.width <=245 && a.right < 245}'''),'Room controls anchored to left area')
    check(page.locator('.room-quick').count()==0,'Old bottom dock removed from DOM')
    check(page.locator('.room-action-block').count()==3,'Room panel has Temp, Lights, Blinds')
    check(page.locator('.room-action-buttons.three button').count()==3,'Bedroom blinds have 3 positions')
    page.screenshot(path=str(OUT/'03_bedroom.png'))
    # change bedroom temp and verify others independent
    old_target=page.locator('.room-action-top strong').first.inner_text()
    page.locator('button[data-action="tempUp"]').click()
    check(page.locator('.room-action-top strong').first.inner_text()!=old_target,'Bedroom target temperature increments')
    page.locator('button[data-action="blindOpen"]').click()
    check(page.locator('button[data-action="blindOpen"]').get_attribute('class')=='active','Bedroom blind open state selected')
    page.locator('button[data-action="lightsOn"]').click()
    check(page.locator('button[data-action="lightsOn"]').get_attribute('class')=='active','Bedroom light on state selected')
    # select Living using tabs; should keep separate state
    page.locator('.room-mini-nav button[data-room="living"]').click()
    check(page.locator('.room-side h2').inner_text()=='Living Room','Room mini-nav switches to Living')
    check(page.locator('button[data-action="blindClose"]').get_attribute('class')=='active','Living blinds unchanged after bedroom action')
    check(page.locator('button[data-action="lightsOff"]').get_attribute('class')=='active','Living lights unchanged after bedroom action')
    # Utility no blinds
    page.locator('.room-mini-nav button[data-room="utility"]').click()
    check(page.locator('.room-action-buttons.three').count()==0,'Utility correctly has no motorized blinds')
    check(page.locator('.room-side').is_visible(),'Utility controls remain same left panel')
    page.screenshot(path=str(OUT/'04_utility.png'))

    # Climate, Energy, Routines, More controls and layout
    page.locator('[data-page="climate"]').click()
    viewport_check('Climate')
    check(page.locator('.vent-modes button').count()==3,'Climate has Auto/Eco/Manual')
    page.locator('[data-action="toggleVent"]').click()
    check('Off' in page.locator('.side-titleline').inner_text(),'Ventilation toggle works')
    page.locator('[data-action="toggleVent"]').click()
    page.locator('button[data-mode="Manual"]').click()
    check(page.locator('input[data-range="manual"]').is_visible(),'Manual fan slider appears')
    page.screenshot(path=str(OUT/'05_climate.png'))

    page.locator('[data-page="energy"]').click()
    viewport_check('Energy')
    check(page.locator('.energy-strips').count()==1,'Energy includes visual load distribution')
    check(page.locator('.energy-strips>span').count()==4,'Four estimated energy components')
    page.locator('button[data-action="toggleHeat"]').click()
    check(page.locator('button[data-action="toggleHeat"]').inner_text()=='Off','Heating toggle works')
    page.screenshot(path=str(OUT/'06_energy.png'))

    page.locator('[data-page="routines"]').click()
    viewport_check('Routines')
    check(page.locator('.routine-item').count()==2,'Default routines are visible')
    page.locator('.routine-toggle-v13').first.click()
    check('Off' in page.locator('.routine-toggle-v13').first.inner_text(),'Routine toggle updates')
    page.locator('button[data-action="newRoutine"]').click()
    check(page.locator('#modalBack').is_visible(),'Add routine opens modal')
    page.locator('[data-action="dismiss"]').first.click()
    page.screenshot(path=str(OUT/'07_routines.png'))

    page.locator('[data-page="more"]').click()
    viewport_check('More')
    page.locator('button[data-tab="display"]').click()
    viewport_check('More > Display')
    check('15 frames' in page.locator('.more-status-row').inner_text(),'Display reports 15 built-in frames')
    page.locator('button[data-action="toggleMotion"]').click()
    paused1=page.locator('#buildingImage').get_attribute('src')
    page.wait_for_timeout(220)
    paused2=page.locator('#buildingImage').get_attribute('src')
    check(paused1==paused2,'Motion Off pauses actual sequence')
    page.locator('button[data-action="toggleMotion"]').click()
    page.wait_for_timeout(200)
    check(page.locator('#buildingImage').get_attribute('src')!=paused2,'Motion On resumes sequence')
    page.screenshot(path=str(OUT/'08_display.png'))

    # Header lock/alarm confirmation independent of current page
    page.locator('#headerLock').click()
    check(page.locator('#modalBack').is_visible(),'Door action requires confirmation')
    page.locator('#dialogYes').click()
    check('Unlocked' in page.locator('#headerLock').inner_text(),'Door state reflects confirmation')
    page.locator('#headerAlarm').click()
    check(page.locator('#modalBack').is_visible(),'Alarm action requires confirmation')
    page.locator('#dialogYes').click()
    check('Armed' in page.locator('#headerAlarm').inner_text(),'Alarm state reflects confirmation')
    # Mode confirm from header
    page.locator('.mode-choice[data-scene="Home"]').click()
    check(page.locator('#modalBack').is_visible(),'Mode button opens confirmation')
    page.locator('button[data-action="applyScene"]').click()
    check(page.locator('.mode-choice[data-scene="Home"]').get_attribute('class').find('active')!=-1,'Home mode is activated')
    check(page.locator('.room-side').count()==0,'Mode change does not open a room')
    check(not page_errors,'No uncaught JavaScript errors')
    check(not console_errors,'No console errors')
    browser.close()

summary={'passed':sum(v for _,v in results),'total':len(results),'failed':[name for name,passed in results if not passed],'page_errors':page_errors,'console_errors':console_errors}
(ROOT/'test_results.json').write_text(json.dumps(summary,indent=2))
print(json.dumps(summary,indent=2))
assert not summary['failed'], 'Some checks failed'
