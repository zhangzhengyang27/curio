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
    // 列表过滤后 v-for 会整行重建:fill 后须等渲染落定再点,否则 click 打在
    // 已脱离文档的旧节点上,change 丢失(C13 变体,force 也救不了)
    const checkCountry = async (name) => {
      await page.locator('[data-testid="country-search"]').fill(name)
      await page.waitForTimeout(300)
      await page.locator(`[data-testid="country-${name}"] .compare-toggle input`).check({ force: true })
      await expect(page.locator(`[data-testid="country-${name}"] .compare-toggle input`)).toBeChecked()
    }
    // 中国选为主选国,美国加入对比
    await checkCountry('中国')
    await checkCountry('美国')
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
    // 播放中页面持续重着色,actionability 采样会拿不到 rAF,须 force(见 KNOWN_PITFALLS C13)
    await page.locator('[data-testid="timeline-play"]').click({ force: true }) // 收尾暂停,避免计时器跨用例
  })

  test('时间轴暂停：年份停止演进（回归：暂停后 interval 未清理仍自走）', async ({ page }) => {
    await page.goto('/analysis')
    await page.locator('.timeline-bar').waitFor({ timeout: 30000 })
    const year = page.locator('[data-testid="timeline-year"]')

    // 拖到 2000 年再播放,给暂停后的观察留足年份空间
    await page.locator('[data-testid="timeline-range"]').fill('0')
    await expect(year).toHaveText('2000')

    await page.locator('[data-testid="timeline-play"]').click()
    await page.waitForTimeout(2200)
    const playing = Number(await year.textContent())
    expect(playing).toBeGreaterThan(2000)

    await page.locator('[data-testid="timeline-play"]').click() // 暂停
    await page.waitForTimeout(2200)
    const paused1 = Number(await year.textContent())
    await page.waitForTimeout(1500)
    const paused2 = Number(await year.textContent())
    expect(paused1).toBe(paused2) // 暂停后年份必须停住
  })
})
