import { test, expect } from '@playwright/test'
import { mockTianditu } from './helpers/tiles'

/**
 * 主题分析工作台（/workbench）冒烟测试。
 *
 * 闭环：选主题（GDP/碳排放）→ 着色图与 Top10 排行/图表联动 → 生成并导出 HTML 分析报告。
 */

test.beforeEach(async ({ page }) => {
  await mockTianditu(page)
})

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

    await page.locator('[data-testid="theme-carbon"]').evaluate((el) => el.click())
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
    await page.locator('[data-testid="theme-population"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="rank-item-0"]')).toContainText(/亿/, { timeout: 10_000 })
    await expect(page.locator('[data-testid="summary"]')).toContainText('人口总量')

    // 人口密度:单位人/km²,且首位应是密度字段最大的国家(与数据一致)
    await page.locator('[data-testid="theme-density"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="rank-item-0"]')).toContainText('人/km²', { timeout: 10_000 })
    await expect(page.locator('[data-testid="summary"]')).toContainText('人/km²')
  })

  test('碳排放演示数据与人口同源:Top1 出现在人口前五（数据重造回归）', async ({ page }) => {
    await page.goto('/workbench')
    await expect(page.locator('[data-testid="ranking-list"] .rank-row')).toHaveCount(10, { timeout: 15_000 })
    await page.locator('[data-testid="theme-carbon"]').evaluate((el) => el.click())
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
    // Cesium 页上 CDP 点击偶发丢事件致 download 事件迟迟不达(KNOWN_PITFALLS C13),走 DOM click
    await page.locator('[data-testid="export-report"]').evaluate((el) => el.click())
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

  test('选国下钻:点排行出该国 GDP 趋势小图(W3)', async ({ page }) => {
    await page.goto('/workbench')
    await expect(page.locator('[data-testid="chart"] canvas')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-testid="drill-chart"]')).toHaveCount(0)

    const firstName = (await page.locator('[data-testid="rank-item-0"] .rank-name').innerText()).trim()
    await page.locator('[data-testid="rank-item-0"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="drill-chart"] canvas')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('.panel-right')).toContainText(`${firstName} · GDP 走势`)
  })

  test('报告模板:摘要版无指纹段,完整版含指纹(W2)', async ({ page }) => {
    // 双报告导出(两次完整 HTML 下载),实测 53~57s,贴着默认 60s 超时线
    test.setTimeout(120_000)
    await page.goto('/workbench')
    await expect(page.locator('[data-testid="chart"] canvas')).toBeVisible({ timeout: 15_000 })
    const fs = await import('node:fs')

    // 摘要版
    await page.locator('[data-testid="mode-brief"]').evaluate((el) => el.click())
    let dl = page.waitForEvent('download')
    await page.locator('[data-testid="export-report"]').evaluate((el) => el.click())
    const brief = await dl
    expect(brief.suggestedFilename()).toMatch(/terra-report-gdp-brief-.*\.html$/)
    const briefHtml = fs.readFileSync(await brief.path(), 'utf8')
    expect(briefHtml).toContain('（摘要版）')
    expect(briefHtml).toContain('data:image/png') // 地图快照仍在
    expect(briefHtml).not.toContain('生成参数指纹') // 无指纹段
    expect(briefHtml).toContain('<table>')

    // 完整版含指纹(连续下载间留缓冲,并行负载下第二个 download 事件偶发丢失)
    await page.waitForTimeout(600)
    await page.locator('[data-testid="mode-full"]').evaluate((el) => el.click())
    dl = page.waitForEvent('download')
    await page.locator('[data-testid="export-report"]').evaluate((el) => el.click())
    const full = await dl
    const fullHtml = fs.readFileSync(await full.path(), 'utf8')
    expect(fullHtml).toContain('生成参数指纹')
    expect(fullHtml).toMatch(/TV-GDP-\d+N-[0-9A-Z]+/)
  })

  test('报告支持打印导出 PDF:含 @media print 与打印按钮(W4)', async ({ page }) => {
    await page.goto('/workbench')
    await expect(page.locator('[data-testid="chart"] canvas')).toBeVisible({ timeout: 15_000 })
    const dl = page.waitForEvent('download')
    await page.locator('[data-testid="export-report"]').evaluate((el) => el.click())
    const d = await dl
    const fs = await import('node:fs')
    const html = fs.readFileSync(await d.path(), 'utf8')
    expect(html).toContain('@media print')
    expect(html).toContain('window.print()')
    expect(html).toContain('保存为 PDF')
  })

  test('URL 状态:?theme= 还原主题;切换主题地址同步(X2)', async ({ page }) => {
    await page.goto('/workbench?theme=carbon')
    await expect(page.locator('[data-testid="rank-item-0"]')).toContainText('MtCO₂', { timeout: 15_000 })
    await expect(page.locator('[data-testid="theme-carbon"]')).toHaveClass(/active/)

    // 切换主题驱动地址同步;回 gdp 时清掉参数
    await page.locator('[data-testid="theme-population"]').evaluate((el) => el.click())
    await expect(page).toHaveURL(/theme=population/, { timeout: 5_000 })
    await page.locator('[data-testid="theme-gdp"]').evaluate((el) => el.click())
    await expect(page).not.toHaveURL(/theme=/, { timeout: 5_000 })

    // 无效参数静默回默认
    await page.goto('/workbench?theme=不存在的主题')
    await expect(page.locator('[data-testid="theme-gdp"]')).toHaveClass(/active/, { timeout: 15_000 })
  })

  test('数据加载失败：显示错误提示而非静默空白(回归:错误分支曾是死代码)', async ({ page }) => {
    await page.route('**/data/mock/gdp-timeline.json', (route) => route.abort())
    await page.goto('/workbench')
    await expect(page.locator('.load-error')).toContainText('数据加载失败', { timeout: 15_000 })
  })
})
