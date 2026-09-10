from playwright.sync_api import sync_playwright
import time
import os

BASE_URL = 'http://localhost:4173'
SCREENSHOT_DIR = '/tmp/fixed-cesium-examples'

EXAMPLES = [
    ('cesium-examples/cesiumExamples/expand/snow', 'snow'),
    ('cesium-examples/cesiumExamples/expand/rain', 'rain'),
    ('cesium-examples/cesiumExamples/expand/lensFlare', 'lensFlare'),
    ('cesium-examples/cesiumExamples/expand/volumetricCloud', 'volumetricCloud'),
    ('cesium-examples/cesiumExamples/expand/dynamicWater', 'dynamicWater'),
    ('cesium-examples/cesiumExamples/expand/cesiumShadertoy', 'cesiumShadertoy'),
    ('cesium-examples/cesiumExamples/expand/gradienGeojsonFace', 'gradienGeojsonFace'),
    ('cesium-examples/cesiumExamples/expand/cesiumSwitch', 'cesiumSwitch'),
]

os.makedirs(SCREENSHOT_DIR, exist_ok=True)


def test_example(browser, path, name):
    url = f'{BASE_URL}/examples/{path}'
    print(f'\n[Testing] {name}: {url}')

    console_errors = []
    page_errors = []

    page = browser.new_page()
    page.on('console', lambda msg: console_errors.append((msg.type, msg.text)))
    page.on('pageerror', lambda err: page_errors.append(str(err)))

    try:
        page.goto(url)
        page.wait_for_load_state('networkidle')
        time.sleep(6)
    except Exception as e:
        print(f'[Navigation error] {e}')
        page.close()
        return name, False

    screenshot_path = os.path.join(SCREENSHOT_DIR, f'{name}.png')
    page.screenshot(path=screenshot_path, full_page=True)
    print(f'[Screenshot] {screenshot_path}')

    container = page.locator('.cesium-example-scene .cesium-viewer')
    count = container.count()
    print(f'[Viewer count] {count}')

    has_errors = False
    if page_errors:
        print(f'[Page errors] {page_errors}')
        has_errors = True
    if console_errors:
        severe = [e for e in console_errors if 'error' in e[0].lower() or ('error' in e[1].lower() and ' CESIUM' not in e[1])]
        if severe:
            print(f'[Console errors] {severe}')
            has_errors = True

    ok = count > 0 and not has_errors
    page.close()
    return name, ok


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    results = []
    for path, name in EXAMPLES:
        name, ok = test_example(browser, path, name)
        results.append((name, ok))

    browser.close()

    print('\n========== Fixed Cesium Examples Test Summary ==========')
    for name, ok in results:
        status = 'PASS' if ok else 'FAIL'
        print(f'{status}: {name}')

    passed = sum(1 for _, ok in results if ok)
    print(f'\nTotal: {passed}/{len(results)} passed')
