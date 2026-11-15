from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
screens=root/'screenshots';screens.mkdir(exist_ok=True)
html=(root/'NORDVENT_Standalone.html').read_text()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for name in ['climate','energy','manual','boost']:
        page=browser.new_page(viewport={'width':800,'height':480},device_scale_factor=1)
        page.set_content(html,wait_until='domcontentloaded',timeout=120000)
        page.wait_for_timeout(300)
        page.locator(f'nav [data-page="{"climate" if name in ("climate","manual","boost") else "energy"}"]').click()
        if name=='manual':
            page.locator('.v15-hud-modes [data-mode="Manual"]').click()
            page.locator('.v15-manual-control input').fill('280')
        elif name=='boost':
            page.locator('.v15-boost').click()
        page.evaluate("document.getElementById('toast').classList.remove('show')")
        page.wait_for_timeout(120)
        page.screenshot(path=str(screens/f'v15_{name}_clean.png'))
        page.close()
    browser.close()
imgs=[Image.open(screens/f'v15_{n}_clean.png').convert('RGB') for n in ['climate','energy','manual','boost']]
canvas=Image.new('RGB',(1600,1000),'#071925')
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
draw=ImageDraw.Draw(canvas)
for i,(img,label) in enumerate(zip(imgs,['CLIMATE · AIRFLOW ON HOUSE','ENERGY · POWER ON HOUSE','MANUAL · LIVE FLOW SLIDER','BOOST · STRONGER FX'])):
    x=(i%2)*800;y=(i//2)*500
    draw.text((x+15,y+8),label,fill='#9ed6d9',font=font)
    canvas.paste(img,(x,y+30))
canvas.save('/mnt/data/NORDVENT-v15-Overview.png',optimize=True)
print('clean overview complete')
