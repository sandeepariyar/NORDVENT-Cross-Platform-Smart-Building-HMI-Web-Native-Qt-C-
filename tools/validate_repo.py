"""Static check for NORDVENT Pages artifacts and project integrity (stdlib only)."""
from pathlib import Path
import re
root=Path(__file__).resolve().parent.parent
site=root/'docs'
for name in ('index.html','styles.css','lab.js','web/index.html','web/app.js','metrics.json'):
    assert (site/name).is_file(),f'Page is missing {name}'
for name in ('CMakeLists.txt','src/main.cpp','qml/Main.qml'):
    assert (root/'native-qt'/name).is_file(),f'Qt project missing {name}'
for name in ('LICENSE.md','README.md'):
    assert (root/name).is_file(),f'Missing {name}'
assert 'All rights reserved' in (root/'LICENSE.md').read_text(), 'Missing proprietary notice'
assert len(list((site/'web/assets/sequence_webp').glob('frame_*.webp'))) == 15, 'Web sequence incomplete'
assert len(list((root/'native-qt/assets/sequence').glob('frame_*.png'))) == 15, 'Qt sequence incomplete'
assert len(list((root/'native-qt/assets/lighting').glob('*.png'))) == 8, 'Lighting overlays incomplete'
assert 'window.__NORDVENT_DEV__' in (site/'web/app.js').read_text(), 'Missing read-only inspector bridge'
assert 'window.__NORDVENT_DEV__' not in (root/'web/app.js').read_text(), 'Do not mutate original HTML source'
for file in (site/'index.html',site/'web/index.html'):
    html=file.read_text(encoding='utf8')
    for relative in re.findall(r'(?:src|href)="([^"]+)"',html):
        if not relative or relative.startswith(('http://','https://','data:','blob:','#','mailto:','../')): continue
        # Screenshots are generated during Pages build from the actual HTML runtime.
        # Source-only CI validates the authored code before those captures exist.
        if relative.startswith('assets/screens/') and not (file.parent/relative).exists():
            continue
        assert (file.parent/relative).exists(),f'Missing relative link: {file}: {relative}'
print('NORDVENT repo integrity: PASS')
