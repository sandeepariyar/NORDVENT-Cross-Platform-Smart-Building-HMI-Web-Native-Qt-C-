"""Offline source/asset checks; do not confuse with native Qt runtime tests."""
from pathlib import Path
from PIL import Image
import json
import re
ROOT=Path(__file__).resolve().parents[1]
MAIN=(ROOT/'qml/Main.qml').read_text(encoding='utf-8')
BACKEND=(ROOT/'src/NordventBackend.hpp').read_text(encoding='utf-8')

def check(label, expr):
    if not expr:
        raise AssertionError(label)
    print('PASS',label)

def lexical_balance(path):
    src=path.read_text(encoding='utf-8')
    # Neutralize quotes and // comments before delimiter balance checks.
    out=[]; mode=None; esc=False; i=0
    while i<len(src):
        c=src[i]
        if mode in ('"',"'"):
            if esc:esc=False
            elif c=='\\':esc=True
            elif c==mode:mode=None
            out.append(' ')
        elif mode=='line':
            if c=='\n':mode=None
            out.append(' ')
        elif c in ('"',"'"):
            mode=c;out.append(' ')
        elif src[i:i+2]=='//':
            mode='line';out.extend([' ',' ']);i+=1
        else:out.append(c)
        i+=1
    text=''.join(out)
    for a,b in [('{','}'),('(',')'),('[',']')]:
        assert text.count(a)==text.count(b), (path,a,b,text.count(a),text.count(b))

files=list((ROOT/'qml').glob('*.qml'))
check('native Qt Quick components exist',len(files)>=6)
for f in files:lexical_balance(f)
check('balanced QML grouping',True)
check('no WebEngine',not any('WebEngine' in f.read_text() for f in files))
check('no Qt particle systems',not any('ParticleSystem' in f.read_text() for f in files))
check('all six page components',all(x in MAIN for x in ['homeComponent','roomsComponent','climateComponent','energyComponent','routinesComponent','moreComponent']))
check('focused room layout', 'focusComponent' in MAIN)
check('10 source camera presets',all(x in MAIN for x in ['-26','-25','-31','1.074','1.068','1.071','1.076','1.025','1.014','1.010']))
check('15 exact 800x352 frame PNGs',all((ROOT/f'assets/sequence/frame_{n:02d}.png').is_file() and Image.open(ROOT/f'assets/sequence/frame_{n:02d}.png').size==(800,352) for n in range(1,16)))
check('8 separate lighting overlays', len(list((ROOT/'assets/lighting').glob('*_on.png')))==8)
check('4 separate room photos',len(list((ROOT/'assets/rooms').glob('*.png')))==4)
check('has custom icon system', len(list((ROOT/'assets/icons').glob('*.png')))>=75)
check('has original HTML source for side-by-side', (ROOT/'docs/NORDVENT_v17_HTML_REFERENCE.html').exists())
check('C++ controller & native view adapter', (ROOT/'core/include/NordventCore.hpp').exists() and 'Q_PROPERTY' in BACKEND)
check('no absolute local runtime image sources', '/mnt/data' not in MAIN and '/mnt/data' not in (ROOT/'src/main.cpp').read_text())
for word in ['airFx.png','heatFx.png','waterFx.png','recoveryFx.png','defrostFx.png','leaderLines.png']:
    check(word,(ROOT/'assets/fx'/word).is_file())
# Check all of the declared fixture and room files.
for q in re.findall(r'\bid:"([a-z_]+)"\s*,room:',MAIN):
    check('fixture '+q,(ROOT/'assets/lighting'/f'{q}_on.png').exists())
for name in ['bedroom','living','kitchen','utility']:
    check('room icon '+name,(ROOT/'assets/room_icons'/f'{name}.png').exists())
check('all QML sibling imports versionless',all('import QtQuick 2.' not in f.read_text() for f in files))
print('STATIC CHECKS PASSED — GUI runtime not verified')
