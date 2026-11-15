from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
out=root/'screenshots';out.mkdir(exist_ok=True)
html=(root/'NORDVENT_Standalone.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 c=b.new_context(viewport={'width':800,'height':480},device_scale_factor=1)
 for name,page_name,room in [('01_home','home',None),('02_rooms','rooms',None),('03_bedroom','rooms','bedroom'),('04_climate','climate',None),('05_energy','energy',None),('06_routines','routines',None),('07_more','more',None)]:
  page=c.new_page();page.set_content(html,wait_until='domcontentloaded');page.wait_for_timeout(220)
  if page_name!='home': page.locator(f'button[data-page="{page_name}"]').click()
  if room:page.locator(f'.room-pick[data-room="{room}"]').click()
  page.wait_for_timeout(300)
  page.screenshot(path=str(out/(name+'.png')))
  page.close()
 b.close()
print('captured 7 clean 800x480 screens')
