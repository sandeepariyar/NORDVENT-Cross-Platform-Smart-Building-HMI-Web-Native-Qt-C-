from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 pg=b.new_page(viewport={'width':800,'height':480})
 pg.set_content((root/'NORDVENT_Standalone.html').read_text(),wait_until='domcontentloaded',timeout=120000)
 pg.wait_for_timeout(250)
 def check(label):
  val=pg.evaluate('''() => {const h=document.documentElement,b=document.body,a=document.getElementById('app'),w=document.getElementById('workspace');const P=[...document.querySelectorAll('.room-side,.side-panel')].filter(e=>e.offsetWidth>0);return {scroll:h.scrollHeight<=480&&h.scrollWidth<=800&&b.scrollHeight<=480&&b.scrollWidth<=800,app:a.getBoundingClientRect().width<=800.3&&a.getBoundingClientRect().height<=480.3,panels:P.every(el=>el.getBoundingClientRect().top>=w.getBoundingClientRect().top-1&&el.getBoundingClientRect().bottom<=w.getBoundingClientRect().bottom+1)}}''')
  assert all(val.values()),(label,val)
  print(label,val)
 for tab in ['home','rooms','climate','energy','routines','more']:
  pg.locator(f'.nav-item[data-page="{tab}"]').click()
  pg.wait_for_timeout(300)
  check(tab)
 pg.locator('.nav-item[data-page="rooms"]').click()
 pg.locator('.room-pick[data-room="living"]').click()
 pg.wait_for_timeout(300)
 check('living focus')
 assert pg.locator('#headerLock').is_visible() and pg.locator('#headerAlarm').is_visible()
 assert pg.locator('#headerLock').evaluate('e=>e.getBoundingClientRect().left')>228
 pg.locator('.mode-choice[data-scene="Night"]').click()
 pg.locator('button[data-action="applyScene"]').click()
 assert pg.locator('.room-side').is_visible()
 check('night in room focus')
 before=pg.locator('#buildingImage').get_attribute('src');pg.wait_for_timeout(230);after=pg.locator('#buildingImage').get_attribute('src')
 assert before!=after,'Default loop should remain animated'
 print('Animation remains active during Night mode')
 b.close()
