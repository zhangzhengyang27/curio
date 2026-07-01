from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 720})
    page = context.new_page()
    errors = []
    page.on('console', lambda msg: errors.append((msg.type, msg.text)) if msg.type == 'error' else None)
    page.on('pageerror', lambda err: errors.append(('pageerror', str(err) + ' ' + str(getattr(err, 'stack', '')))))
    try:
        page.goto('http://localhost:5180/examples/threejs-official/webgl/morphtargets/webgl_morphtargets_webcam', wait_until='domcontentloaded', timeout=10000)
    except Exception as e:
        print(f'goto timeout: {e}')
    page.wait_for_timeout(8000)
    page.screenshot(path='/tmp/example-screenshots/webcam.png', full_page=False)
    print('screenshot: /tmp/example-screenshots/webcam.png')
    if errors:
        print('ERRORS:')
        for t, txt in errors[:15]:
            print(f'  [{t}] {txt[:200]}')
    else:
        print('No errors')
    browser.close()
