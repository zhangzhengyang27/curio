from playwright.sync_api import sync_playwright
import time
import os

BASE_URL = 'http://localhost:4173'
SCREENSHOT_DIR = '/tmp/three-cesium-animation'

EXAMPLES = [
    'three-cesium-examples/threeExamples/animation/animejsBasic',
    'three-cesium-examples/threeExamples/animation/gsapBasic',
    'three-cesium-examples/threeExamples/animation/clipAnimation',
    'three-cesium-examples/threeExamples/animation/personAnimation',
    'three-cesium-examples/threeExamples/animation/personThirdMove',
    'three-cesium-examples/threeExamples/animation/downRotate',
    'three-cesium-examples/threeExamples/animation/curlAnimate',
]

os.makedirs(SCREENSHOT_DIR, exist_ok=True)


def test_example(browser, path):
    name = path.split('/')[-1]
    url = f'{BASE_URL}/examples/{path}'
    print(f'\n[Testing] {name}: {url}')

    page_errors = []
    console_errors = []

    page = browser.new_page()
    page.on('console', lambda msg: console_errors.append((msg.type, msg.text)))
    page.on('pageerror', lambda err: page_errors.append(str(err)))

    try:
        page.goto(url)
        page.wait_for_load_state('networkidle')
        time.sleep(5)
    except Exception as e:
        print(f'[Navigation error] {e}')
        page.close()
        return name, False

    screenshot_path = os.path.join(SCREENSHOT_DIR, f'{name}.png')
    page.screenshot(path=screenshot_path, full_page=True)
    print(f'[Screenshot] {screenshot_path}')

    canvas = page.locator('canvas')
    count = canvas.count()
    visible = canvas.first.is_visible() if count > 0 else False
    print(f'[Canvas count] {count}, visible: {visible}')

    has_errors = False
    if page_errors:
        print(f'[Page errors] {page_errors}')
        has_errors = True
    if console_errors:
        severe = [e for e in console_errors if 'error' in e[0].lower()]
        if severe:
            print(f'[Console errors] {severe}')
            has_errors = True

    ok = count > 0 and visible and not has_errors
    page.close()
    return name, ok


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    results = []
    for path in EXAMPLES:
        name, ok = test_example(browser, path)
        results.append((name, ok))
    browser.close()

    print('\n========== Animation Examples Test Summary ==========')
    for name, ok in results:
        print(f'{"PASS" if ok else "FAIL"}: {name}')
    passed = sum(1 for _, ok in results if ok)
    print(f'\nTotal: {passed}/{len(results)} passed')
