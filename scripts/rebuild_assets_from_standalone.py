#!/usr/bin/env python3
"""Rebuild Qt browser raster assets from the project's self-contained authored v17 HTML.

The source HTML carries original WebP architecture frames, real lighting passes,
room artwork SVGs, and the original custom icon symbols. Generated PNGs are
build products, never substitute for the creator's original raster masters.
"""
from __future__ import annotations
import argparse
import base64
import io
import re
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import cairosvg
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'web'/'NORDVENT_Standalone.html'
DST=ROOT/'native-qt'/'assets'
DOC_DST=ROOT/'docs'/'assets'/'icons'


def decode_uri(encoded):
    return base64.b64decode(encoded)


def png_from_svg(svg, path, w, h):
    path.parent.mkdir(parents=True, exist_ok=True)
    cairosvg.svg2png(bytestring=svg.encode('utf-8'), write_to=str(path), output_width=w,output_height=h)


def write_image(img, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, 'PNG', optimize=True)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--force',action='store_true',help='regenerate even when original PNGs are present')
    parser.add_argument('--with-doc-icons',action='store_true',help='copy icon assets into docs for the design system gallery')
    args=parser.parse_args()
    html=SOURCE.read_text(encoding='utf-8')
    created=0
    def output_image(img,relative):
        nonlocal created
        p=DST/relative
        if args.force or not p.exists():
            write_image(img,p)
            created+=1
    def output_svg(svg,relative,w,h):
        nonlocal created
        p=DST/relative
        if args.force or not p.exists():
            png_from_svg(svg,p,w,h)
            created+=1

    # 15 originally authored photographic animation frames, now encoded as WebP
    # in the v17 self-contained source. Preserve sequence order from its JS array.
    m=re.search(r'DEFAULT_SEQUENCE_ASSETS\s*=\s*\[(.*?)\]\s*;',html,re.S)
    if not m: raise RuntimeError('Original v17 frame sequence is missing')
    frames=re.findall(r'data:image/webp;base64,([A-Za-z0-9+/=]+)',m.group(1))
    if len(frames)!=15: raise RuntimeError(f'Expected 15 original frames; got {len(frames)}')
    for i,v in enumerate(frames,1):
        frame=Image.open(io.BytesIO(decode_uri(v))).convert('RGBA')
        if frame.size!=(800,352):raise RuntimeError(f'Unexpected architecture frame size {frame.size}')
        output_image(frame,f'sequence/frame_{i:02d}.png')
        # Preserve the original compressed sequence for the web implementation.
        target=ROOT/'docs/web/assets/sequence_webp'/f'frame_{i:02d}.webp'
        target.parent.mkdir(parents=True,exist_ok=True)
        if args.force or not target.exists(): target.write_bytes(decode_uri(v))

    # Original lighting passes are embedded as data URIs on the actual fixtures.
    fixtures=re.findall(r'<img\b[^>]*data-fixture="([^"]+)"[^>]*src="data:image/png;base64,([A-Za-z0-9+/=]+)"',html,re.S)
    if len(fixtures)!=8:raise RuntimeError(f'Expected 8 fixture overlays, got {len(fixtures)}')
    for name,encoded in fixtures:
        img=Image.open(io.BytesIO(decode_uri(encoded))).convert('RGBA')
        output_image(img,f'lighting/{name}_on.png')

    # Original bespoke room pictograms encoded in ROOM_IMAGE_URLS.
    m=re.search(r'ROOM_IMAGE_URLS\s*=\s*\{(.*?)\}\s*;',html,re.S)
    if not m:raise RuntimeError('Room art is missing')
    rooms=re.findall(r'"([a-z]+)"\s*:\s*"data:image/svg\+xml;base64,([A-Za-z0-9+/=]+)"',m.group(1))
    if len(rooms)!=4:raise RuntimeError(f'Expected 4 room illustrations, got {len(rooms)}')
    for name,encoded in rooms:
        svg=decode_uri(encoded).decode('utf-8')
        output_svg(svg,f'room_icons/{name}.png',96,96)

    # Native icon variants come straight from authored inline SVG symbols.
    symbols={name:body for name,body in re.findall(r'<symbol\s+id="i-([^"]+)"[^>]*>(.*?)</symbol>',html,re.S)}
    if len(symbols)<26:raise RuntimeError(f'Icon symbol set incomplete: {len(symbols)}')
    variants={'active':'#42e6ee','idle':'#85aab9','white':'#eaf5ff'}
    for name,body in symbols.items():
        for state,stroke in variants.items():
            svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="{stroke}" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.85">{body}</svg>'
            output_svg(svg,f'icons/{name}_{state}.png',48,48)
    # Distinct logo image comes from the same authored word-mark motif.
    logo='<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M3 33 13 14l10 13 9-19 13 25-13-12-9 19-10-13Z" fill="#42e6ee"/></svg>'
    output_svg(logo,'icons/nordvent_logo.png',48,48)

    # FX overlays: rendered from the actual SVG circuits in the source HTML.
    fxstyles={
        'airFx':'.duct-casing{fill:none;stroke:#03141b;stroke-width:8;opacity:.8}.air-pipe{fill:none;stroke:#42dfea;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round}',
        'heatFx':'.heat-base,.heat-running{fill:none;stroke:#f8aa4f;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.heat-base{opacity:.5}.heat-pump-dot{fill:#e9a05d}',
        'waterFx':'.water-base,.water-moving{fill:none;stroke:#79c5f4;stroke-width:3;stroke-linecap:round}.water-base{opacity:.5}.water-indicator{fill:#a0eaff}',
        'recoveryFx':'.recovery-cyan{stroke:#42e6ee;stroke-width:4;fill:none}.recovery-amber{stroke:#ffad72;stroke-width:4;fill:none}',
        'defrostFx':'.defrost-ring{stroke:#81ccef;stroke-width:2;fill:none}.defrost-snow{stroke:#9fdfff;stroke-width:2.2;fill:none}',
        'leaderLines':'path{stroke:#98dfea;stroke-width:1.5;fill:none}circle{fill:#7af7e6}',
    }
    soup=BeautifulSoup(html,'html.parser')
    for id,css in fxstyles.items():
        group=soup.find(id=id)
        if not group: raise RuntimeError('FX path missing: '+id)
        svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="352" viewBox="0 0 800 352"><style>{css}</style>{str(group)}</svg>'
        output_svg(svg,f'fx/{id}.png',800,352)

    # Static slats and fan parts support the actual QML rotor/slat animations.
    img=Image.new('RGBA',(4,72),(0,0,0,0))
    d=ImageDraw.Draw(img)
    d.rectangle([0,0,3,71],fill=(90,168,189,200));d.line([(1,0),(1,71)],fill=(193,236,237,180))
    output_image(img,'fx/vertical_blind_slat.png')
    for room,w,h in [('bedroom',266,64),('living',266,67),('kitchen',194,71)]:
        output_image(Image.new('RGBA',(w,h),(46,111,126,85)),f'fx/blinds_{room}.png')
    for name in ('ring','blades'):
        svg=('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">'
             +( '<circle cx="24" cy="24" r="20" fill="none" stroke="#55c6dc" stroke-width="4" opacity=".78"/>' if name=='ring'
                 else '<g fill="#74e4ea" opacity=".88"><path d="M24 23C8 22 8 6 19 8c7 2 8 9 5 15Z"/><path d="M25 24C32 10 47 18 41 27c-4 6-11 4-16-3Z"/><path d="M23 25C28 40 11 47 7 36c-3-8 5-10 16-11Z"/><circle cx="24" cy="24" r="4" fill="#d9fafe"/></g>' )
             +'</svg>')
        output_svg(svg,'fx/fan_'+name+'.png',48,48)

    # Cropped architectural backgrounds for the focus cards: same original house.
    original=Image.open(io.BytesIO(decode_uri(frames[0]))).convert('RGBA')
    for name,area in {'bedroom':(322,34,750,230),'living':(275,92,703,288),'kitchen':(284,148,712,344),'utility':(366,118,794,314)}.items():
        output_image(original.crop(area),f'rooms/{name}.png')

    if args.with_doc_icons:
        for p in (DST/'icons').glob('*.png'):
            d=DOC_DST/p.name
            d.parent.mkdir(parents=True,exist_ok=True)
            if args.force or not d.exists():d.write_bytes(p.read_bytes())
    # The browser comparison uses the exact self-contained original v17 application.
    # Expose its internal state only for the same-origin read-only engineering inspector.
    bridge="\nwindow.__NORDVENT_DEV__ = Object.freeze({snapshot: () => JSON.parse(JSON.stringify(state))});\n"
    anchor="})();\n\n</script>"
    if html.count(anchor) != 1: raise RuntimeError('Cannot instrument original v17 IIFE')
    web_out=ROOT/'docs/web/index.html'
    web_out.parent.mkdir(parents=True,exist_ok=True)
    web_out.write_text(html.replace(anchor,bridge+anchor),encoding='utf-8')
    # The website icon and motion galleries use the original SVG symbols and FX exports.
    for p in (DST/'icons').glob('*.png'):
        d=DOC_DST/p.name
        d.parent.mkdir(parents=True,exist_ok=True)
        if args.force or not d.exists(): d.write_bytes(p.read_bytes())
    for name in ('fan_ring.png','fan_blades.png'):
        src=DST/'fx'/name
        dest=ROOT/'docs/assets/motion'/name
        dest.parent.mkdir(parents=True,exist_ok=True)
        if args.force or not dest.exists(): dest.write_bytes(src.read_bytes())
    paths=[p for p in DST.rglob('*.png')]
    print(f'Recovered original v17 source media and vector icon derivatives: {created} new PNGs, {len(paths)} total')
    if len(paths)<125:raise RuntimeError(f'Expected 125 native raster files, found {len(paths)}')

if __name__=='__main__':main()
