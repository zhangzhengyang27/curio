import { test, expect } from '@playwright/test'

/**
 * 主题分析工作台（/workbench）冒烟测试。
 *
 * 闭环：选主题（GDP/碳排放）→ 着色图与 Top10 排行/图表联动 → 生成并导出 HTML 分析报告。
 */

test.describe('主题分析工作台', () => {
  test('页面打开：Top10 排行与图表就绪，无页面错误', async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/workbench')
    await expect(page.locator('.panel-left')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('[data-testid="ranking-list"] .rank-row')).toHaveCount(10, { timeout: 15_000 })
    await expect(page.locator('[data-testid="chart"] canvas')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-testid="summary"]')).toContainText('合计')
    expect(errors).toEqual([])
  })

  test('切换主题：排行与摘要随指标联动', async ({ page }) => {
    await page.goto('/workbench')
    await expect(page.locator('.panel-left')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('[data-testid="rank-item-0"]')).toContainText('万亿美元')

    await page.locator('[data-testid="theme-carbon"]').click()
    await expect(page.locator('[data-testid="rank-item-0"]')).toContainText('MtCO₂', { timeout: 10_000 })
    await expect(page.locator('[data-testid="summary"]')).toContainText('碳排放')
  })

  test('GDP 排行不含聚合项：首位是真实经济体（回归：曾把「世界」排第一）', async ({ page }) => {
    await page.goto('/workbench')
    await expect(page.locator('[data-testid="ranking-list"] .rank-row')).toHaveCount(10, { timeout: 15_000 })

    // 2020 年 GDP 第一的国家是美国（timeline 原始数据里美国 30.8 万亿居国家首位）
    await expect(page.locator('[data-testid="rank-item-0"]')).toContainText('美国', { timeout: 10_000 })
    const allRanks = await page.locator('[data-testid="ranking-list"]').innerText()
    for (const agg of ['世界', '高收入', '经合组织', '中等收入', '低收入', 'IBRD', '人口紅利']) {
      expect(allRanks, `排行不得包含聚合项「${agg}」`).not.toContain(agg)
    }
    // 摘要同样不得把聚合项当经济体
    await expect(page.locator('[data-testid="summary"]')).not.toContainText('世界 以')
  })

  test('新主题：人口规模与人口密度排行、摘要、图表联动（W1）', async ({ page }) => {
    await page.goto('/workbench')
    await expect(page.locator('[data-testid="ranking-list"] .rank-row')).toHaveCount(10, { timeout: 15_000 })

    // 人口规模:排行/摘要带人口单位
    await page.locator('[data-testid="theme-population"]').click({ force: true })
    await expect(page.locator('[data-testid="rank-item-0"]')).toContainText(/亿/, { timeout: 10_000 })
    await expect(page.locator('[data-testid="summary"]')).toContainText('人口总量')

    // 人口密度:单位人/km²,且首位应是密度字段最大的国家(与数据一致)
    await page.locator('[data-testid="theme-density"]').click({ force: true })
    await expect(page.locator('[data-testid="rank-item-0"]')).toContainText('人/km²', { timeout: 10_000 })
    await expect(page.locator('[data-testid="summary"]')).toContainText('人/km²')
  })

  test('碳排放演示数据与人口同源:Top1 出现在人口前五（数据重造回归）', async ({ page }) => {
    await page.goto('/workbench')
    await expect(page.locator('[data-testid="ranking-list"] .rank-row')).toHaveCount(10, { timeout: 15_000 })
    await page.locator('[data-testid="theme-carbon"]').click({ force: true })
    await expect(page.locator('[data-testid="rank-item-0"]')).toContainText('MtCO₂', { timeout: 10_000 })

    const carbonFirst = (await page.locator('[data-testid="rank-item-0"] .rank-name').innerText()).trim()
    // 人口前五(静态演示数据):碳排放榜首应在大体量国家内,而非随机小国
    const populationTop5 = ['马达加斯加', '南苏丹', '美国', '塞内加尔', '斯威士兰']
    expect(
      populationTop5,
      `碳排放 Top1「${carbonFirst}」应在人口前五集合内(数据与人口同源自洽)`
    ).toContain(carbonFirst)
  })

  test('导出报告：下载自包含 HTML 报告', async ({ page }) => {
    await page.goto('/workbench')
    await expect(page.locator('.panel-left')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('[data-testid="chart"] canvas')).toBeVisible({ timeout: 15_000 })

    const downloadPromise = page.waitForEvent('download')
    await page.locator('[data-testid="export-report"]').click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/terra-report-gdp-.*\.html$/)
    const path = await download.path()
    const fs = await import('node:fs')
    const html = fs.readFileSync(path, 'utf8')
    expect(html).toContain('<!doctype html>')
    expect(html).toContain('分析报告')
    expect(html).toContain('data:image/png') // 地图快照与图表已内嵌
    expect(html).toContain('<table>')
  })
})
