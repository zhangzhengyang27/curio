from playwright.sync_api import sync_playwright
import sys

BASE = 'http://localhost:5180'
URLS = [
    f'{BASE}/examples/threejs-official/webgl/loader/webgl_loader_3dtiles',
    f'{BASE}/examples/threejs-official/webgl/morphtargets/webgl_morphtargets_webcam',
    f'{BASE}/examples/threejs-official/webgl/postprocessing/webgl_postprocessing_godrays',
    f'{BASE}/examples/threejs-official/webgl/watch/webgl_watch',
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    errors = []
    page.on('console', lambda msg: errors.append((msg.type, msg.text)) if msg.type == 'error' else None)
    page.on('pageerror', lambda err: errors.append(('pageerror', str(err))))

    for url in URLS:
        print(f'\n=== {url} ===')
        try:
            page.goto(url, wait_until='domcontentloaded', timeout=20000)
        except Exception as e:
            print(f'navigation timeout/abort: {e}')
        page.wait_for_timeout(5000)
        if errors:
            print('CONSOLE ERRORS:')
            for t, txt in errors[:15]:
                print(f'  [{t}] {txt[:200]}')
        else:
            print('No console errors')
        errors.clear()

    browser.close()
