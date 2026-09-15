import { test, expect } from '@playwright/test'

/**
 * 全球数据分析页（/analysis）冒烟测试。
 *
 * 闭环：全球 GDP 着色 + 国家列表选国 → 指标卡联动 → 多国对比 → 时间轴播放演进。
 * 选择交互走左侧列表（画布点击拾取依赖 WebGL 命中，列表路径更稳定）。
 * 交互通道纪律（KNOWN_PITFALLS C13）：本页 choropleth 重着色让主线程长期满载,
 * CDP fill/click 的往返不可靠——搜索/勾选/播放暂停等全部走页面内脚本(页内重试),
 * Playwright 侧只做读取与轮询断言。
 */

test.describe('全球数据分析', () => {
  // 重着色让主线程持续满载,文件内并行用例互抢 CPU 时连 evaluate 都进不去
  // (本地实测);serial 消除该噪音,CI 本就 workers=1(见 KNOWN_PITFALLS C13)
  test.describe.configure({ mode: 'serial' })
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
    // Cesium 页上 CDP fill/click 会偶发卡死或丢事件(C13),走 DOM 设值/点击
    await page.locator('[data-testid="country-search"]').evaluate((el) => {
      el.value = '中国'
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await page.waitForTimeout(300)
    await page.locator('[data-testid="country-中国"]').evaluate((el) => el.click())
    await expect(page.locator('.panel-right .panel-title')).toContainText('中国', { timeout: 15_000 })
    const gdp = page.locator('[data-testid="metric-gdp"]')
    await expect(gdp).toContainText(/万亿|亿/)
    await expect(gdp).not.toContainText('NaN')
    await expect(page.locator('[data-testid="metric-population"]')).toContainText(/亿|万/)
  })

  test('多国对比：勾选后对比表按列展示', async ({ page }) => {
    await page.goto('/analysis')
    await page.locator('.panel-left').waitFor({ timeout: 30000 })
    // 中国选为主选国,美国加入对比。勾选触发全图重着色、页面满载,
    // CDP 往返会被堵死,整段交互放进单次页面内脚本(同「对比满 4 国」用例)
    await page.evaluate(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
      const search = async (v) => {
        const el = document.querySelector('[data-testid="country-search"]')
        el.value = v
        el.dispatchEvent(new Event('input', { bubbles: true }))
        await sleep(150)
      }
      for (const n of ['中国', '美国']) {
        await search(n)
        document.querySelector(`[data-testid="country-${n}"] .compare-toggle input`).click()
        await sleep(150)
      }
    })
    await expect(page.locator('[data-testid="compare-table"]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-testid="compare-table"] th')).toHaveCount(3) // 指标列 + 2 国
    await expect(page.locator('[data-testid="compare-table"]')).toContainText('美国')
  })

  test('对比满 4 国后其余复选框禁用(回归:曾静默丢弃第 5 国勾选)', async ({ page }) => {
    await page.goto('/analysis')
    await page.locator('.panel-left').waitFor({ timeout: 30000 })

    // 每次勾选都触发全图重着色,页面长期满载,CDP 往返(逐国 fill/click)会被堵死
    // (本地实测连 waitForTimeout 都超时)。整段交互放进单次页面内脚本执行,
    // 每次搜索后等 Vue 渲染落定再点击。
    await page.evaluate(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
      const search = async (v) => {
        const el = document.querySelector('[data-testid="country-search"]')
        el.value = v
        el.dispatchEvent(new Event('input', { bubbles: true }))
        await sleep(150)
      }
      for (const n of ['中国', '美国', '日本', '德国']) {
        await search(n)
        document.querySelector(`[data-testid="country-${n}"] .compare-toggle input`).click()
        await sleep(150)
      }
    })
    await expect(page.locator('[data-testid="compare-table"] th')).toHaveCount(5, { timeout: 15_000 }) // 指标列 + 4 国

    // 满员后第 5 国复选框禁用(悬停有说明),勾选不再静默丢弃
    await page.locator('[data-testid="country-search"]').evaluate((el) => {
      el.value = '印度'
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await page.waitForTimeout(300)
    await expect(page.locator('[data-testid="country-印度"] .compare-toggle input')).toBeDisabled()
    await expect(page.locator('[data-testid="compare-table"] th')).toHaveCount(5)
  })

  test('时间轴播放：年份自动演进', async ({ page }) => {
    await page.goto('/analysis')
    await page.locator('.timeline-bar').waitFor({ timeout: 30000 })
    const year = page.locator('[data-testid="timeline-year"]')
    await expect(year).toHaveText('2020')
    // 播放(页内点+验证,重试在页面内完成——CDP 往返在满载页不可靠,见 C13)
    await page.evaluate(async () => {
      const btn = document.querySelector('[data-testid="timeline-play"]')
      for (let i = 0; i < 3; i++) {
        btn.click()
        await new Promise((r) => setTimeout(r, 400))
        if (btn.textContent.includes('暂停')) return
      }
    })
    // 双 worker 并行时 CPU 竞争会让 interval 变慢,用轮询容忍(而非固定 sleep 后读一次)
    await expect
      .poll(async () => Number(await year.textContent()), { timeout: 15_000 })
      .toBeGreaterThan(2000)
    // 收尾暂停,避免计时器跨用例
    await page.evaluate(async () => {
      const btn = document.querySelector('[data-testid="timeline-play"]')
      for (let i = 0; i < 3; i++) {
        btn.click()
        await new Promise((r) => setTimeout(r, 400))
        if (btn.textContent.includes('播放')) return
      }
    })
  })

  test('时间轴暂停：年份停止演进（回归：暂停后 interval 未清理仍自走）', async ({ page }) => {
    await page.goto('/analysis')
    await page.locator('.timeline-bar').waitFor({ timeout: 30000 })
    const year = page.locator('[data-testid="timeline-year"]')

    // 拖到 2000 年再播放,给暂停后的观察留足年份空间
    await page.locator('[data-testid="timeline-range"]').fill('0')
    await expect(year).toHaveText('2000')

    await page.evaluate(async () => {
      const btn = document.querySelector('[data-testid="timeline-play"]')
      for (let i = 0; i < 3; i++) {
        btn.click()
        await new Promise((r) => setTimeout(r, 400))
        if (btn.textContent.includes('暂停')) return
      }
    })
    await expect
      .poll(async () => Number(await year.textContent()), { timeout: 15_000 })
      .toBeGreaterThan(2000)

    // 暂停(页内点+验证)
    await page.evaluate(async () => {
      const btn = document.querySelector('[data-testid="timeline-play"]')
      for (let i = 0; i < 3; i++) {
        btn.click()
        await new Promise((r) => setTimeout(r, 400))
        if (btn.textContent.includes('播放')) return
      }
    })
    // 暂停后年份必须停住(取两次间隔 1.5s;容忍 interval 慢,但不允许继续演进)
    const paused1 = Number(await year.textContent())
    await page.waitForTimeout(2200)
    const paused1b = Number(await year.textContent())
    expect(paused1b).toBeLessThanOrEqual(paused1 + 1) // 至多允许已在途的一步
    await page.waitForTimeout(1500)
    const paused2 = Number(await year.textContent())
    expect(paused2).toBe(paused1b) // 停稳后不得再走
  })

  test('指标着色切换：GDP/人口/碳排放,图例随指标更新', async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/analysis')
    await page.locator('.timeline-bar').waitFor({ timeout: 30000 })
    const legend = page.locator('.legend')

    await expect(legend).toContainText('GDP 低 → 高')

    // 切人口:全图重着色 + 图例文案更新(1s 内)
    await page.locator('[data-testid="metric-tab-population"]').click({ force: true })
    await expect(legend).toContainText('人口 低 → 高', { timeout: 5_000 })
    await expect(page.locator('[data-testid="metric-tab-population"]')).toHaveClass(/active/)

    // 切碳排放
    await page.locator('[data-testid="metric-tab-carbon"]').click({ force: true })
    await expect(legend).toContainText('碳排放 低 → 高', { timeout: 5_000 })

    // 切回 GDP,与时间轴联动仍正常
    await page.locator('[data-testid="metric-tab-gdp"]').click({ force: true })
    await expect(legend).toContainText('GDP 低 → 高', { timeout: 5_000 })
    expect(errors).toEqual([])
  })

  test('URL 状态分享:?country=&year= 还原选国与年份;操作后地址同步(A3)', async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/analysis?country=中国&year=2010')
    await page.locator('.panel-right .panel-title', { hasText: '中国' }).waitFor({ timeout: 30_000 })
    await expect(page.locator('[data-testid="timeline-year"]')).toHaveText('2010')
    await expect(page.locator('.panel-right .panel-title')).toContainText('中国')

    // 无效参数静默忽略
    await page.goto('/analysis?country=不存在的国家&year=1999')
    await page.locator('.panel-right').waitFor({ timeout: 30_000 })
    await expect(page.locator('.panel-right .empty-tip')).toBeVisible()

    // 操作驱动地址同步
    await page.locator('[data-testid="timeline-range"]').fill('5')
    await expect(page).toHaveURL(/year=2005/, { timeout: 5_000 })
    expect(errors).toEqual([])
  })

  test('国家趋势图:选中国后折线出现(A2)', async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/analysis')
    await page.locator('.panel-left').waitFor({ timeout: 30000 })
    await expect(page.locator('[data-testid="trend-chart"]')).toBeHidden()

    // 搜索+点击整段页内执行(C13:满载页 CDP 往返不可靠)
    await page.evaluate(async () => {
      const search = document.querySelector('[data-testid="country-search"]')
      search.value = '中国'
      search.dispatchEvent(new Event('input', { bubbles: true }))
      await new Promise((r) => setTimeout(r, 300))
      document.querySelector('[data-testid="country-中国"]').click()
    })
    await expect(page.locator('[data-testid="trend-chart"] canvas')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('.panel-right')).toContainText('GDP 走势(2000~2020)')
    expect(errors).toEqual([])
  })

  test('CSV 导出:UTF-8 BOM、表头与行数据(A4)', async ({ page }) => {
    await page.goto('/analysis')
    await page.locator('.panel-left').waitFor({ timeout: 30000 })
    await page.waitForTimeout(2500) // 等初始着色/瓦片高峰过去,evaluate 才能挤进主线程

    const dl = page.waitForEvent('download')
    await page.locator('[data-testid="export-csv"]').evaluate((el) => el.click())
    const d = await dl
    expect(d.suggestedFilename()).toMatch(/terra-analysis-\d{4}\.csv$/)
    const fs = await import('node:fs')
    const buf = fs.readFileSync(await d.path())
    expect(buf[0]).toBe(0xef) // UTF-8 BOM
    expect(buf[1]).toBe(0xbb)
    expect(buf[2]).toBe(0xbf)
    const csv = buf.toString('utf8')
    expect(csv).toContain('国家/地区')
    expect(csv).toContain('中国')
    const chinaRow = csv.split('\n').find((l) => l.startsWith('中国,'))
    expect(chinaRow).toBeTruthy()
    expect(chinaRow.split(',').length).toBe(7)
  })

  test('人均 GDP 着色:图例与着色联动(A5)', async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/analysis')
    await page.locator('.timeline-bar').waitFor({ timeout: 30000 })
    await page.locator('[data-testid="metric-tab-percapita"]').click({ force: true })
    await expect(page.locator('.legend')).toContainText('人均 GDP 低 → 高', { timeout: 5_000 })
    expect(errors).toEqual([])
  })
})
