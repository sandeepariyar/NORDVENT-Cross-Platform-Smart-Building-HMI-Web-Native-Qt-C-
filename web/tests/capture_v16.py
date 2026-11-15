from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parents[1]
screens=root/'screenshots';screens.mkdir(exist_ok=True)
html=(root/'NORDVENT_Standalone.html').read_text()
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':800,'height':480},device_scale_factor=1)
  page.set_content(html,wait_until='domcontentloaded',timeout=120000)
  page.wait_for_timeout(400)
  for key in ['home','rooms','climate','energy']:
    page.locator(f'nav [data-page="{key}"]').click()
    page.wait_for_timeout(300)
    page.evaluate("document.querySelector('#toast').classList.remove('show')")
    page.screenshot(path=str(screens/f'v16_clean_{key}.png'))
  page.close();browser.close()
images=[Image.open(screens/f'v16_clean_{n}.png').convert('RGB') for n in ['home','rooms','climate','energy']]
canvas=Image.new('RGB',(1600,1008),'#061927')
d=ImageDraw.Draw(canvas)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
for i,(img,label) in enumerate(zip(images,['HOME · TRANSLUCENT OVERVIEW','ROOMS · COMPACT SELECTOR','CLIMATE · ICON STATUS DOCK','ENERGY · UNOBSTRUCTED CONTROLS'])):
  x=(i%2)*800;y=(i//2)*504
  d.text((x+15,y+5),label,fill='#9adfe3',font=font)
  canvas.paste(img,(x,y+24))
canvas.save('/mnt/data/NORDVENT-v16-Overview.png',optimize=True)
print('overview ready')
