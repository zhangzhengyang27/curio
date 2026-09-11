import { test, expect } from '@playwright/test'

/**
 * 核心链路冒烟测试。
 *
 * 目标：用最低成本守住「页面能打开、示例能被解析到、查看代码能打开」这三条主干，
 * 避免再次出现「配置看起来存在、实际跑不出用例」的假阀门（见 CI 与 CONTRIBUTING）。
 *
 * 选择器均取自真实组件：
 *   .app-nav / .nav-brand / .search-input   → src/App.vue
 *   .example-card / .error-tip             → src/examples/views/ExampleGallery.vue
 *   .demo-root / .code-btn                 → src/examples/views/ExampleDemo.vue
 *   .example-host                          → src/examples/views/ExampleHost.vue
 *   .code-modal / .code-pre                → src/components/CodeDrawer.vue
 *   .bmap-page                             → src/views/BMap/index.vue
 */

// 结构简单、依赖少的示例：css2d 的 label 示例（含共享壳 ExampleScene，可覆盖多节代码）
const DEMO_PATH = '/examples/threejs-official/css2d/css2d_label'

/** 收集页面级未捕获异常，用于断言框架层没有崩溃 */
function collectPageErrors(page) {
  const errors = []
  page.on('pageerror', (err) => errors.push(err.message))
  return errors
}

test.describe('冒烟测试：核心链路', () => {
  test('首页可加载且顶栏完整', async ({ page }) => {
    const pageErrors = collectPageErrors(page)

    await page.goto('/')

    await expect(page.locator('.app-nav')).toBeVisible()
    await expect(page.locator('.nav-brand')).toBeVisible()
    await expect(page.locator('.search-input')).toBeVisible()

    expect(pageErrors, `首页出现未捕获异常：\n${pageErrors.join('\n')}`).toEqual([])
  })

  test('示例中心可加载、搜索框常驻且卡片渲染', async ({ page }) => {
    const pageErrors = collectPageErrors(page)

    await page.goto('/examples')

    await expect(page.locator('.search-input')).toBeVisible()
    await expect(page.locator('.example-gallery-page')).toBeVisible()

    const cards = page.locator('.example-card')
    await expect(cards.first()).toBeVisible()
    expect(await cards.count()).toBeGreaterThan(0)

    expect(pageErrors, `示例中心出现未捕获异常：\n${pageErrors.join('\n')}`).toEqual([])
  })

  test('示例详情页能按命名约定解析到 Vue 组件', async ({ page }) => {
    await page.goto(DEMO_PATH)

    await expect(page.locator('.demo-root')).toBeVisible()
    // .example-host 存在 == loadExampleComponent 按约定路径命中，而非回落到「未找到组件」
    await expect(page.locator('.example-host')).toBeVisible()
    await expect(page.locator('.error-tip')).toHaveCount(0)
  })

  test('「查看代码」弹窗可打开并渲染源码', async ({ page }) => {
    await page.goto(DEMO_PATH)

    const codeBtn = page.locator('.code-btn')
    await expect(codeBtn).toBeVisible()

    // 示例内部的 GUI 面板/覆盖层可能盖住按钮，直接派发 DOM click 绕过命中测试
    await codeBtn.evaluate((el) => el.click())

    await expect(page.locator('.code-modal')).toBeVisible()
    const code = page.locator('.code-pre').first()
    await expect(code).toBeVisible()
    expect((await code.innerText()).length).toBeGreaterThan(100)
  })

  test('百度地图页可加载，且最终进入「就绪」或「降级」而非卡在加载态', async ({ page }) => {
    await page.goto('/bmap')

    await expect(page.locator('.bmap-page')).toBeVisible()
    await expect(page.locator('.bmap-header h1')).toContainText('百度地图')

    // 配置了 VITE_BMAP_AK → 出现示例 tab；未配置 → 出现可读的降级提示。
    // 两者都必须出现其一，否则说明页面卡在「正在加载百度地图 SDK…」。
    await expect(page.locator('.bmap-warning, .bmap-nav').first()).toBeVisible({ timeout: 20000 })
  })
})
