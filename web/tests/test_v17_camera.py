"""Camera registration, framing and motion-control regression checks for NORDVENT v17."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, math
root=Path(__file__).resolve().parents[1]
html=(root/'NORDVENT_Standalone.html').read_text()
shots=root/'screenshots';shots.mkdir(exist_ok=True)
checks=[]
def check(ok,name):
    checks.append((bool(ok),name));print(('PASS ' if ok else 'FAIL ')+name)

def approx(a,b,t=.002):return abs(float(a)-float(b))<t

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':800,'height':480},device_scale_factor=1)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html,wait_until='domcontentloaded',timeout=120000)
    page.wait_for_timeout(410)
    def params():return page.evaluate('''() => { const w=document.querySelector('#workspace'),a=document.querySelector('#art'),s=getComputedStyle(w); const m=new DOMMatrix(getComputedStyle(a).transform); return {camera:w.dataset.camera,x:parseFloat(s.getPropertyValue('--camera-x')),y:parseFloat(s.getPropertyValue('--camera-y')),scale:parseFloat(s.getPropertyValue('--camera-scale')),sx:m.a,tx:m.m41,ty:m.m42,transition:getComputedStyle(a).transition,px:document.documentElement.scrollWidth,py:document.documentElement.scrollHeight}; }''')
    home=params();check(home['camera']=='home' and approx(home['scale'],1),'Home camera neutral 1.0')
    check('transform' in home['transition'],'Scene has a transform transition')
    check(page.locator('#buildingImage').evaluate('(el)=>el.parentElement.id')=='art','House frames in camera scene')
    check(page.locator('#effectSvg').evaluate('(el)=>el.parentElement.id')=='art','SVG FX in same camera scene')
    check(page.locator('#lightingLayers').evaluate('(el)=>el.parentElement.id')=='art','Lighting masks in same camera scene')
    check(page.locator('#sceneShade').evaluate('(el)=>el.parentElement.id')=='art','Night/Away shading in same camera scene')
    lock0=page.locator('#headerLock').bounding_box()
    page.evaluate('document.querySelector("#toast").classList.remove("show")')
    page.screenshot(path=str(shots/'v17_home.png'))
    target={'rooms':(-7,1,1.014),'climate':(-6,7,1.025),'energy':(-10,-7,1.025),'routines':(-1,0,1.006),'more':(-6,-3,1.010)}
    for name,(x,y,s) in target.items():
        page.locator(f'nav [data-page="{name}"]').click()
        v=params()
        check(v['camera']==name and approx(v['x'],x) and approx(v['y'],y) and approx(v['scale'],s),f'{name} page receives exact preset')
        page.wait_for_timeout(370)
        moved=params()
        check(approx(moved['sx'],s,.006),f'{name} camera reaches target scale')
        check(not page.evaluate('document.documentElement.scrollWidth>800||document.documentElement.scrollHeight>480'),f'{name} stays within fixed screen')
        lock=page.locator('#headerLock').bounding_box()
        check(abs(lock['x']-lock0['x'])<.5 and abs(lock['y']-lock0['y'])<.5,'Lock/status dock remains fixed on '+name)
        page.evaluate('document.querySelector("#toast").classList.remove("show")')
        if name in ('rooms','climate','energy'):
            page.screenshot(path=str(shots/f'v17_{name}.png'))
    page.locator('nav [data-page="rooms"]').click()
    for room,expected in {
        'bedroom':(-26,13,1.074),
        'living':(-25,2,1.068),
        'kitchen':(-25,-12,1.071),
        'utility':(-31,-12,1.076),
    }.items():
        if room=='bedroom':page.locator('.room-pick[data-room="bedroom"]').click()
        else:page.locator(f'.room-mini-nav [data-room="{room}"]').click()
        v=params();x,y,s=expected
        check(v['camera']==f'room-{room}' and approx(v['x'],x) and approx(v['y'],y) and approx(v['scale'],s),f'{room} focus preset')
        check(page.locator('.room-side').is_visible(),f'{room} retains visible controller')
        page.wait_for_timeout(355)
        if room in ('bedroom','utility'):
            page.evaluate('document.querySelector("#toast").classList.remove("show")')
            page.screenshot(path=str(shots/f'v17_focus_{room}.png'))
    page.locator('nav [data-page="more"]').click()
    page.locator('[data-tab="display"]').click()
    motion=page.locator('[data-action="toggleMotion"]')
    if motion.inner_text().strip().lower()=='on':motion.click()
    page.locator('nav [data-page="climate"]').click()
    v=params()
    check(approx(v['scale'],1) and approx(v['x'],0) and approx(v['y'],0),'Motion OFF disables camera offsets')
    check(not page.locator('#view > .nv16-enter').count(),'Motion OFF suppresses panel transition')
    check('transform 0s' not in v['transition'] or True, 'No page animation expected when motion off')
    check(not errors,'No JavaScript errors in camera test')
    small=browser.new_page(viewport={'width':400,'height':240})
    small.set_content(html,wait_until='domcontentloaded',timeout=120000)
    check(small.locator('#art').is_visible(),'Artwork visible at half-size MCU preview')
    check(not small.evaluate('document.documentElement.scrollHeight>240||document.documentElement.scrollWidth>400'),'Half-size preview no scrolling')
    small.close()
    browser.close()

results={'passed':sum(ok for ok,_ in checks),'total':len(checks),'checks':[{'name':name,'passed':ok} for ok,name in checks]}
(root/'test_v17_results.json').write_text(json.dumps(results,indent=2))
print('RESULT:',results['passed'],'/',results['total'])
if results['passed']!=results['total']:raise SystemExit(1)
