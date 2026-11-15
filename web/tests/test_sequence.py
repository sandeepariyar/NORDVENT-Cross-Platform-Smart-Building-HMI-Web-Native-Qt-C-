from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw
import tempfile
root=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as tmp:
  tmp=Path(tmp)
  for n,col in [(1,'red'),(2,'blue'),(3,'green')]:
    img=Image.new('RGB',(800,352),col);ImageDraw.Draw(img).text((40,40),str(n),fill='white')
    img.save(tmp/f'frame_{n:03d}.png')
  with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-web-security'])
    page=b.new_page(viewport={'width':800,'height':480}); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content((root/'NORDVENT_Standalone.html').read_text(),wait_until='load',timeout=30000)
    page.locator('.nav-item[data-page="more"]').click()
    page.locator('button[data-action="moreTab"][data-tab="display"]').click()
    assert page.locator('button[data-action="importSequence"]').count()==1
    page.locator('#sequenceInput').set_input_files([str(tmp/f'frame_{n:03d}.png') for n in (1,2,3)])
    page.wait_for_timeout(400)
    assert page.locator('button[data-action="resetArt"]').count()==1
    r=page.evaluate("({image:document.getElementById('buildingImage').src, fx:document.getElementById('effectSvg').style.opacity, text:document.querySelector('.more-display').innerText})")
    assert r['image'].startswith('blob:'),r
    assert r['fx']=='0',r
    assert '3 frames' in r['text'],r
    page.locator('button[data-action="toggleMediaOverlay"]').click();page.wait_for_timeout(80)
    assert page.locator('#effectSvg').evaluate('(el)=>el.style.opacity')=='1'
    page.locator('button[data-action="toggleMotion"]').click()
    a=page.locator('#buildingImage').get_attribute('src');page.wait_for_timeout(300);c=page.locator('#buildingImage').get_attribute('src')
    assert a==c,(a,c)
    page.locator('button[data-action="resetArt"]').click();page.wait_for_timeout(70)
    assert page.locator('#buildingImage').get_attribute('src').startswith('data:image/webp')
    assert page.locator('#effectSvg').evaluate('(el)=>el.style.opacity')=='1'
    print('sequence import / pause / FX-on-media / reset passed; page errors:',errors)
    page.screenshot(path=str(root/'preview_sequence_import_v11.png'))
    assert not errors,errors
    b.close()
