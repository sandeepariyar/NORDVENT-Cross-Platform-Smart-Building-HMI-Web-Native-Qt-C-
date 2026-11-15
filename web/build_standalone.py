"""Produce one no-network HTML preview with all images, SVG assets and frames embedded."""
from pathlib import Path
import base64, json, mimetypes, re
root=Path(__file__).resolve().parent
html=(root/'index.html').read_text()
for name in ('styles.css','minimal.css','v11.css','v13.css','v14.css','v15.css','v16.css','v17.css'):
    html=html.replace(f'<link rel="stylesheet" href="{name}">',f'<style>\n/* {name} */\n'+(root/name).read_text()+'\n</style>')
for src in sorted(set(re.findall(r'src="(assets/[^"\s]+)"',html))):
    data='data:'+ (mimetypes.guess_type(src)[0] or 'application/octet-stream')+';base64,'+base64.b64encode((root/src).read_bytes()).decode()
    html=html.replace(f'src="{src}"',f'src="{data}"')
    if src=='assets/house_off_800x352.webp':
        html=html.replace('id="buildingImage" ',f'id="buildingImage" data-original="{data}" ',1)
js=(root/'app.js').read_text()
js=js.replace("'assets/house_off_800x352.webp'", "document.getElementById('buildingImage').dataset.original")
room_data={r:'data:image/svg+xml;base64,'+base64.b64encode((root/'assets'/'room_icons'/f'{r}.svg').read_bytes()).decode() for r in ['bedroom','living','kitchen','utility']}
needle='const ROOM_IMAGE_URLS=Object.fromEntries(names.map(r=>[r,`assets/room_icons/${r}.svg`]));'
assert needle in js
js=js.replace(needle,'const ROOM_IMAGE_URLS='+json.dumps(room_data,separators=(',',':'))+';')
seq_data=['data:image/webp;base64,'+base64.b64encode((root/'assets'/'sequence_webp'/f'frame_{i:02d}.webp').read_bytes()).decode() for i in range(1,16)]
needle="const DEFAULT_SEQUENCE_ASSETS=Array.from({length:15},(_,i)=>`assets/sequence_webp/frame_${String(i+1).padStart(2,'0')}.webp`);"
assert needle in js
js=js.replace(needle,'const DEFAULT_SEQUENCE_ASSETS='+json.dumps(seq_data,separators=(',',':'))+';')
html=html.replace('<script src="app.js"></script>', '<script>\n'+js+'\n</script>')
assert 'src="assets/' not in html
assert 'href="v13.css"' not in html
out=root/'NORDVENT_Standalone.html'
out.write_text(html)
print(f'Standalone: {out.name} | {out.stat().st_size:,} bytes')
