from pathlib import Path
from playwright.sync_api import sync_playwright
source=Path(__file__).resolve().parents[1]/'NORDVENT_Standalone.html'
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-web-security'])
 page=b.new_page(viewport={'width':800,'height':480},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(source.read_text(),wait_until='load',timeout=30000)
 print('loaded',page.title(), 'errors', errors[:4]);print('header',page.locator('header').inner_text()[:170])
 page.screenshot(path=str(source.parent/'preview_home_v11.png'))
 for pg in ['rooms','climate','energy','routines','more']:
  page.locator(f'.nav-item[data-page="{pg}"]').click()
  page.wait_for_timeout(60)
  page.screenshot(path=str(source.parent/f'preview_{pg}_v11.png'))
  print(pg,'screen',page.locator('#workspace').evaluate('(e)=>({scrollHeight:e.scrollHeight,clientHeight:e.clientHeight})'))
 page.locator('.nav-item[data-page="rooms"]').click()
 page.locator('.room-card[data-room="bedroom"]').click()
 page.screenshot(path=str(source.parent/'preview_room_v11.png'))
 print('room',page.locator('.room-quick').inner_text()[:250], 'errors',errors[:6])
 b.close()
