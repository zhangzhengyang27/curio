from playwright.sync_api import sync_playwright
import sys

EXAMPLES = [
    '/examples/earth-lessons/earth-lessons/05-country-borders',
    '/examples/earth-lessons/earth-lessons/09-railway-lines',
    '/examples/earth-lessons/earth-lessons/11-airports',
    '/examples/earth-lessons/earth-lessons/13-hotnews',
    '/examples/earth-lessons/earth-lessons/22-gdp-color',
    '/examples/earth-lessons/earth-lessons/23-land-grid',
]

base_url = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:4173'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 800})

    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)

    for path in EXAMPLES:
        url = base_url + path
        print(f'Checking {url}')
        page.goto(url)
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(5000)
        screenshot_path = f'/tmp/earth-lesson-{path.replace("/", "_")}.png'
        page.screenshot(path=screenshot_path, full_page=True)
        print(f'  Screenshot: {screenshot_path}')
        if errors:
            print(f'  Errors ({len(errors)}):')
            for e in errors[-10:]:
                print(f'    {e}')
            errors.clear()
        else:
            print('  No errors')

    browser.close()
