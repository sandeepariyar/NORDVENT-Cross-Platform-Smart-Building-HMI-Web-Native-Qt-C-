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
assert 'window.__NORDVENT_DEV__' in (site/'web/index.html').read_text(), 'Missing read-only inspector bridge in live original application'
assert 'window.__NORDVENT_DEV__' not in (root/'web/NORDVENT_Standalone.html').read_text(), 'Do not mutate original authored HTML source'
# Only inspect actual tag attributes, not JavaScript template strings in the original HTML.
from html.parser import HTMLParser
class LinkChecker(HTMLParser):
    def __init__(self):
        super().__init__();self.refs=[]
    def handle_starttag(self,tag,attrs):
        self.refs.extend(v for k,v in attrs if k in ('src','href') and v)
for file in (site/'index.html',site/'web/index.html'):
    checker=LinkChecker();checker.feed(file.read_text(encoding='utf8'))
    for relative in checker.refs:
        if relative.startswith(('http://','https://','data:','blob:','#','mailto:','../')):continue
        assert (file.parent/relative).exists(),f'Missing relative link: {file}: {relative}'
print('NORDVENT repo integrity: PASS')
