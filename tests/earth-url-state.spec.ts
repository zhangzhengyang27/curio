import { test, expect } from '@playwright/test'
import { mockTianditu } from './helpers/tiles'

/**
 * 首页地球 · 快捷键与地址栏状态（回归 P2）。
 *
 * 1) 夜间模式有两个入口（快捷键 n 与工具栏按钮），但按钮另存了一份局部
 *    nightActive ref —— 按 n 之后按钮高亮和实际画面脱钩。
 * 2) 可视化模式以前直写 window.location.hash：每点一个模式就往历史里压一条，
 *    「后退」变成在 12 个模式之间来回走；且 gdp 作为默认值不写 hash，
 *    从 carbon 切回 gdp 后地址仍留着 #carbon，同一个链接再打开落在别的模式。
 */

const nightBtn = (page) => page.locator('.tool-btn[aria-label="夜间模式"]')

test.beforeEach(async ({ page }) => {
  await mockTianditu(page)
})

test.describe('首页地球 · 状态与地址', () => {
  test('快捷键 n 切换夜间模式，工具栏按钮高亮要跟着走', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(nightBtn(page)).not.toHaveClass(/active/)

    await page.keyboard.press('n')
    await expect(nightBtn(page), '按 n 后按钮应显示为开启').toHaveClass(/active/)

    await page.keyboard.press('n')
    await expect(nightBtn(page), '再按一次应显示为关闭').not.toHaveClass(/active/)
  })

  test('切换可视化模式不压历史，切回默认时清掉 hash', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const len0 = await page.evaluate(() => history.length)

    await page.locator('.viz-btn', { hasText: '人口' }).evaluate((el) => el.click())
    await expect(page.locator('.viz-btn', { hasText: '人口' })).toHaveClass(/active/, { timeout: 20_000 })
    await expect(page).toHaveURL(/#population$/)
    expect(await page.evaluate(() => history.length), '点模式不该往历史里压条目').toBe(len0)

    await page.locator('.viz-btn', { hasText: 'GDP' }).evaluate((el) => el.click())
    await expect(page.locator('.viz-btn', { hasText: 'GDP' })).toHaveClass(/active/, { timeout: 20_000 })
    // 正向锚点是上面那条 toHaveURL(/#population$/)：hash 确实被写过，
    // 这里的「为空」才是「被清掉」而不是「从没写过」
    const hashAfterDefault = await page.evaluate(() => window.location.hash)
    expect(hashAfterDefault, '切回默认模式应清掉 hash').toBe('')
    expect(await page.evaluate(() => history.length)).toBe(len0)
  })
})
