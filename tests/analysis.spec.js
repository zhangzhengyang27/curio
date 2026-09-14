import { test, expect } from '@playwright/test'

/**
 * 全球数据分析页（/analysis）冒烟测试。
 *
 * 闭环：全球 GDP 着色 + 国家列表选国 → 指标卡联动 → 多国对比 → 时间轴播放演进。
 * 选择交互走左侧列表（画布点击拾取依赖 WebGL 命中，列表路径更稳定）。
 */

test.describe('全球数据分析', () => {
  test('页面打开：国家列表就绪（166 国），无页面错误', async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/analysis')
    await expect(page.locator('.panel-left')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('[data-testid="country-list"] .country-row')).toHaveCount(166, { timeout: 15_000 })
    expect(errors).toEqual([])
  })

  test('搜索并选择国家：指标卡联动展示 GDP 与人口', async ({ page }) => {
    await page.goto('/analysis')
    await page.locator('.panel-left').waitFor({ timeout: 30000 })
    await page.locator('[data-testid="country-search"]').fill('中国')
    await page.locator('[data-testid="country-中国"]').click()
    await expect(page.locator('.panel-right .panel-title')).toContainText('中国')
    const gdp = page.locator('[data-testid="metric-gdp"]')
    await expect(gdp).toContainText(/万亿|亿/)
    await expect(gdp).not.toContainText('NaN')
    await expect(page.locator('[data-testid="metric-population"]')).toContainText(/亿|万/)
  })

  test('多国对比：勾选后对比表按列展示', async ({ page }) => {
    await page.goto('/analysis')
    await page.locator('.panel-left').waitFor({ timeout: 30000 })
    // 中国选为主选国
    await page.locator('[data-testid="country-search"]').fill('中国')
    await page.locator('[data-testid="country-中国"] .compare-toggle input').check()
    // 美国加入对比
    await page.locator('[data-testid="country-search"]').fill('美国')
    await page.locator('[data-testid="country-美国"] .compare-toggle input').check()
    await expect(page.locator('[data-testid="compare-table"]')).toBeVisible()
    await expect(page.locator('[data-testid="compare-table"] th')).toHaveCount(3) // 指标列 + 2 国
    await expect(page.locator('[data-testid="compare-table"]')).toContainText('美国')
  })

  test('时间轴播放：年份自动演进', async ({ page }) => {
    await page.goto('/analysis')
    await page.locator('.timeline-bar').waitFor({ timeout: 30000 })
    const year = page.locator('[data-testid="timeline-year"]')
    await expect(year).toHaveText('2020')
    await page.locator('[data-testid="timeline-play"]').click()
    await page.waitForTimeout(1600)
    const after = (await year.textContent()).trim()
    expect(Number(after)).toBeGreaterThan(2000)
    await expect(year).not.toHaveText('2020')
  })
})
