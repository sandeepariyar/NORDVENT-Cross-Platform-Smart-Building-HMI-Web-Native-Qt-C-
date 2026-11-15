"""Checks that the static native dot paths overlap the authored original raster lines."""
from pathlib import Path
import json
import re
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
JS=(ROOT/'qml/NvV17Routes.js').read_text(encoding='utf8')
MAPPING={
    'air1':'airFx','air2':'airFx','air3':'airFx',
    'heat1':'heatFx','heat2':'heatFx','heat3':'heatFx',
    'water1':'waterFx','recoveryCool1':'recoveryFx','recoveryWarm1':'recoveryFx'
}
for route, fx in MAPPING.items():
    m=re.search(r'var '+re.escape(route)+r'\s*=\s*(\[.*?\]);',JS)
    assert m, f'Missing authored path: {route}'
    points=json.loads(m.group(1))
    image=Image.open(ROOT/f'assets/fx/{fx}.png').convert('RGBA')
    hits=0
    for p in points:
        x,y=round(p['x']),round(p['y'])
        assert 0<=x<800 and 0<=y<352, (route,x,y)
        if any(image.getpixel((x+dx,y+dy))[3]>15
               for dx in range(-4,5) for dy in range(-4,5)
               if 0<=x+dx<800 and 0<=y+dy<352):
            hits+=1
    ratio=hits/len(points)
    assert ratio>=.95, f'{route} misaligned: {hits}/{len(points)}'
    print(f'PASS {route}: {hits}/{len(points)} samples on original {fx} line')
for img, size in [('vertical_blind_slat.png',(4,72)),('fan_ring.png',(48,48)),('fan_blades.png',(48,48))]:
    assert Image.open(ROOT/'assets/fx'/img).size==size
    print(f'PASS image {img}')

main=(ROOT/'qml/Main.qml').read_text(encoding='utf8')
assert 'NvVerticalBlinds' in main
assert 'RotationAnimation on rotation' in main
assert 'Routes.air1' in main and 'Routes.water1' in main
assert 'nv.rooms[modelData.room].blinds' in main
print('ANIMATION-FIDELITY STATIC TESTS PASSED')
