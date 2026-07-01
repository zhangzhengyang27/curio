from playwright.sync_api import sync_playwright
import os

BASE = 'http://localhost:5180'
URLS = [
    ('3dtiles', f'{BASE}/examples/threejs-official/webgl/loader/webgl_loader_3dtiles'),
    ('webcam', f'{BASE}/examples/threejs-official/webgl/morphtargets/webgl_morphtargets_webcam'),
    ('godrays', f'{BASE}/examples/threejs-official/webgl/postprocessing/webgl_postprocessing_godrays'),
    ('watch', f'{BASE}/examples/threejs-official/webgl/watch/webgl_watch'),
]
OUT_DIR = '/tmp/example-screenshots'
os.makedirs(OUT_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 720})

    for name, url in URLS:
        page = context.new_page()
        errors = []
        page.on('console', lambda msg: errors.append((msg.type, msg.text)) if msg.type == 'error' else None)
        page.on('pageerror', lambda err: errors.append(('pageerror', str(err))))
        print(f'\n=== {name} ===')
        try:
            page.goto(url, wait_until='domcontentloaded', timeout=10000)
        except Exception as e:
            print(f'goto timeout/abort: {e}')
        page.wait_for_timeout(6000)
        path = os.path.join(OUT_DIR, f'{name}.png')
        page.screenshot(path=path, full_page=False)
        print(f'screenshot: {path}')
        if errors:
            print('ERRORS:')
            for t, txt in errors[:10]:
                print(f'  [{t}] {txt[:200]}')
        else:
            print('No errors')
        page.close()

    browser.close()
