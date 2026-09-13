from playwright.sync_api import sync_playwright
import time
import os

BASE_URL = 'http://localhost:4173'
SCREENSHOT_DIR = '/tmp/cesium-examples'

EXAMPLES = [
    ('cesium-examples/cesiumExamples/tools/test', 'test'),
    ('cesium-examples/cesiumExamples/tools/computerNewPoint', 'computerNewPoint'),
    ('cesium-examples/cesiumExamples/layer/defaultLayer', 'defaultLayer'),
    ('cesium-examples/cesiumExamples/layer/coordLayer', 'coordLayer'),
    ('cesium-examples/cesiumExamples/basic/cameraView', 'cameraView'),
    ('cesium-examples/cesiumExamples/basic/autoRotate', 'autoRotate'),
    ('cesium-examples/cesiumExamples/basic/clickEvent', 'clickEvent'),
    ('cesium-examples/cesiumExamples/basic/multPoint', 'multPoint'),
    ('cesium-examples/cesiumExamples/basic/drawLine', 'drawLine'),
    ('cesium-examples/cesiumExamples/effect/radar', 'radar'),
]

os.makedirs(SCREENSHOT_DIR, exist_ok=True)


def test_example(browser, path, name):
    url = f'{BASE_URL}/examples/{path}'
    print(f'\n[Testing] {name}: {url}')

    console_errors = []
    page_errors = []

    page = browser.new_page()
    page.on('console', lambda msg: console_errors.append(msg.text))
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

    container = page.locator('.cesium-example-scene .cesium-viewer')
    count = container.count()
    print(f'[Viewer count] {count}')

    has_errors = False
    if page_errors:
        print(f'[Page errors] {page_errors}')
        has_errors = True
    if console_errors:
        # 忽略 Cesium 常见的 imagery provider 网络/断言警告，只统计 error 级别
        severe = [e for e in console_errors if 'error' in e.lower()]
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

    print('\n========== Cesium Vue Examples Test Summary ==========')
    for name, ok in results:
        status = 'PASS' if ok else 'FAIL'
        print(f'  [{status}] {name}')
    passed = sum(1 for _, ok in results if ok)
    print(f'  Total: {passed}/{len(results)} passed')
    print('=====================================================')

    if passed != len(results):
        raise SystemExit(1)
