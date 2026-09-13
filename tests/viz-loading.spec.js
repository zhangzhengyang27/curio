import { test, expect } from '@playwright/test'

/**
 * 异步图层加载反馈（EarthCanvas switchVisualization → earthStore.vizLoading）。
 *
 * 通过路由拦截给 population.json 加延迟，确定性验证：
 *   - 异步模式：底部出现非阻塞加载 chip + 按钮转 spinner，完成后消失
 *   - 即时模式（gdp/default/landmarks 同步路径）：不出现提示（同 tick 清除，零闪烁）
 */

const CHIP = '[data-testid="viz-loading"]'

test.describe('图层加载反馈', () => {
  test('切换异步图层显示加载提示，完成后消失并激活按钮', async ({ page }) => {
    await page.route('**/data/mock/population.json', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      await route.continue()
    })
    await page.goto('/')
    // 等启动期的纹理/数据请求全部落定，确保地球画布初始化完成后再点击，
    // 否则点击会落在 visualizationLayer 就绪前的空窗（静默 no-op）
    await page.waitForLoadState('networkidle')

    await page.locator('.viz-btn', { hasText: '人口' }).click()
    const chip = page.locator(CHIP)
    await expect(chip).toBeVisible()
    await expect(chip).toContainText('人口')

    await expect(chip).toBeHidden({ timeout: 15_000 })
    await expect(page.locator('.viz-btn', { hasText: '人口' })).toHaveClass(/active/)
  })

  test('快速连切时提示跟随最后一次请求，不提前消失', async ({ page }) => {
    // 人口慢（1.2s）；切回默认（同步路径）不应清掉仍在加载中的人口提示
    await page.route('**/data/mock/population.json', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200))
      await route.continue()
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.locator('.viz-btn', { hasText: '人口' }).click()
    const chip = page.locator(CHIP)
    await expect(chip).toBeVisible()

    await page.locator('.viz-btn', { hasText: '默认' }).click()
    await expect(chip).toBeVisible()

    await expect(chip).toBeHidden({ timeout: 15_000 })
  })

  test('即时模式不出现加载提示', async ({ page }) => {
    await page.goto('/')
    // gdp 走同步回落路径（restoreGdpColors），同 tick 内设置并清除 loading
    await page.locator('.viz-btn', { hasText: 'GDP' }).click()
    await expect(page.locator(CHIP)).toHaveCount(0)
    await expect(page.locator('.viz-btn', { hasText: 'GDP' })).toHaveClass(/active/)
  })
})
