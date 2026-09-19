/**
 * /tools 示例列表 + vue-cesium 示例页冒烟。
 *
 * 与 map-tools.spec.js（综合工具箱 /tools/toolbox，27 条）互补：
 * 这里守护「列表→示例」的路由结构与 vue-cesium 组件的最小可用性。
 * 量测用例走 FAB 悬浮球路径（面板按钮走同一 toggleAction，不重复覆盖）。
 */
import { test, expect } from '@playwright/test'
import { TOOLS_EXAMPLES } from '../src/views/tools-examples/index.ts'

// 新增示例页的「页面可达 + 示例面板就绪」冒烟清单（每页断言自己的面板）。
// 交互链路（量测收线等）有独立用例，这里只守护页面骨架不白屏。
const NEW_PAGES = [
  { slug: 'overview-map', ready: '[data-testid="example-status"]:has-text("鹰眼图就绪")' },
  { slug: 'print', ready: '[data-testid="print-trigger"]' },
  { slug: 'selection-indicator', ready: '[data-testid="example-status"]:has-text("等待拾取")' },
  { slug: 'navigation-sm', ready: '[data-testid="example-status"]:has-text("小屏导航就绪")' },
  { slug: 'overlay-heatmap', ready: '[data-testid="example-status"]:has-text("热力点 360 个")' },
  { slug: 'overlay-html', ready: '[data-testid="example-status"]:has-text("5 张卡片显示中")' },
  { slug: 'overlay-echarts', ready: '[data-testid="example-status"]:has-text("8 节点 / 7 条航线")' },
  { slug: 'overlay-typhoon', ready: '[data-testid="example-status"]:has-text("9 个定位点")' },
  { slug: 'overlay-wind', ready: '[data-testid="example-status"]:has-text("粒子流动中")' },
  { slug: 'overlay-dynamic', ready: '[data-testid="example-status"]:has-text("巡飞中")' },
  { slug: 'post-process', ready: '[data-testid="example-status"]:has-text("扫描显示中")' },
]

test('示例列表:渲染全部卡片,点击进入对应示例', async ({ page }) => {
  await page.goto('/tools', { waitUntil: 'domcontentloaded' })
  await page.getByTestId('tools-gallery').waitFor({ timeout: 30_000 })

  const cards = page.getByTestId('tools-example-card')
  await expect(cards).toHaveCount(TOOLS_EXAMPLES.length)

  await page.locator('[data-slug="toolbox"]').click()
  await expect(page).toHaveURL(/\/tools\/toolbox$/)
  // 综合工具箱页挂载完成后才有工具面板(等 Cesium + viewer 就绪)
  await expect(page.locator('[data-testid="place-search"]')).toBeVisible({ timeout: 30_000 })
})

// 每页独立用例(共享超时会因个别页在无头软渲染下偏慢而耗尽总预算):
// 断言面板出现 + 就绪文案(ready 事件/状态面板,非仅容器可见)。
for (const p of NEW_PAGES) {
  test(`示例页冒烟:${p.slug}`, async ({ page }) => {
    await page.goto(`/tools/${p.slug}`, { waitUntil: 'domcontentloaded' })
    await expect(
      page.locator('[data-testid="example-panel"]'),
      `${p.slug} 面板未出现`,
    ).toBeVisible({ timeout: 45_000 })
    await expect(
      page.locator(p.ready),
      `${p.slug} 就绪状态未出现`,
    ).toBeVisible({ timeout: 45_000 })
  })
}

test('量测示例:激活距离量测,两点收线出结果', async ({ page }) => {
  await page.goto('/tools/measurements', { waitUntil: 'domcontentloaded' })
  const distanceBtn = page.locator('button:has(.vc-icons-measure-distance)')
  await distanceBtn.waitFor({ timeout: 30_000 })
  // 按钮出现 ≠ viewer 就绪:留出 Cesium 初始化余量(同 probe 基线)
  await page.waitForTimeout(2500)

  // C13 模式:locator.click 在 Cesium 页会偶发静默挂起,改用 DOM click
  await page.evaluate(() => {
    const btn = document.querySelector('button.vc-measure-distance') ||
      document.querySelector('button .vc-icons-measure-distance')?.closest('button')
    if (btn) btn.click()
  })
  // 激活会触发 activeEvt → 面板状态重渲染,留出稳定窗口再开始采点
  await expect(page.getByTestId('measure-status')).toContainText('量测中', { timeout: 10_000 })
  await page.mouse.click(620, 380)
  await page.mouse.click(800, 480)

  await expect(page.getByTestId('measure-status')).toContainText('量测完成', { timeout: 15_000 })
})

test('导航示例:vc-navigation 控件集合渲染', async ({ page }) => {
  await page.goto('/tools/navigation', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.vc-navigation')).toBeVisible({ timeout: 30_000 })
})

test('未知 slug:提示未找到并提供返回列表入口', async ({ page }) => {
  await page.goto('/tools/no-such-example', { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('example-not-found')).toBeVisible()
  await page.getByTestId('example-not-found').getByRole('link').click()
  await expect(page).toHaveURL(/\/tools$/)
})
