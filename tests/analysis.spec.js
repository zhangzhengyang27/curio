import { test, expect } from '@playwright/test'

/**
 * 全球数据分析页（/analysis）冒烟测试。
 *
 * 闭环：全球 GDP 着色 + 国家列表选国 → 指标卡联动 → 多国对比 → 时间轴播放演进。
 * 选择交互走左侧列表（画布点击拾取依赖 WebGL 命中，列表路径更稳定）。
 */

/**
 * 在 Cesium 繁忙页上点按钮并确认生效。CDP 鼠标通道在主线程满载时
 * (播放中每 700ms 全图重着色)会整包丢失点击事件,force 也救不了
 * (见 KNOWN_PITFALLS C13);页面内 DOM click 走同一 Vue 事件链且可靠,
 * 故用它驱动,并按按钮文本确认生效(未生效则像真实用户一样再点)。
 * @param expectText 点击成功后按钮应包含的文本(如播放后变「⏸ 暂停」)
 */
async function clickUntilAccepted(button, expectText) {
  for (let i = 0; i < 3; i++) {
    await button.evaluate((el) => el.click()).catch(() => {})
    try {
      await expect(button).toContainText(expectText, { timeout: 3_000 })
      return
    } catch {
      // 点击未生效,重试
    }
  }
  await expect(button).toContainText(expectText) // 最终失败时给出明确断言错误
}

/** 勾选复选框并确认生效:以对比表列数为准(toBeChecked 在忙页上会读到 undefined 误判,
 *  曾把已勾上的又点掉);勾选触发全图重着色,事件可能打在重渲窗口旧节点上,未生效则重试 */
async function checkCountryInList(page, name, expectCount) {
  await page.locator('[data-testid="country-search"]').evaluate((el, v) => {
    el.value = v
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, name)
  await page.waitForTimeout(300)
  const box = page.locator(`[data-testid="country-${name}"] .compare-toggle input`)
  for (let i = 0; i < 3; i++) {
    await box.evaluate((el) => el.click()).catch(() => {})
    try {
      await expect(page.locator('[data-testid="compare-table"] th')).toHaveCount(expectCount, { timeout: 2_000 })
      return
    } catch {
      // 未生效,重试
    }
  }
  await expect(page.locator('[data-testid="compare-table"] th')).toHaveCount(expectCount)
}

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
    // 中国选为主选国,美国加入对比(生效与否以对比表列数为准)
    await checkCountryInList(page, '中国', 2)
    await checkCountryInList(page, '美国', 3)
    await expect(page.locator('[data-testid="compare-table"]')).toBeVisible()
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
    const playBtn = page.locator('[data-testid="timeline-play"]')
    await expect(year).toHaveText('2020')
    await clickUntilAccepted(playBtn, '暂停')
    // 双 worker 并行时 CPU 竞争会让 interval 变慢,用轮询容忍(而非固定 sleep 后读一次)
    await expect
      .poll(async () => Number(await year.textContent()), { timeout: 15_000 })
      .toBeGreaterThan(2000)
    // 收尾暂停,避免计时器跨用例(播放中页面持续重着色,须 force,见 KNOWN_PITFALLS C13)
    await clickUntilAccepted(playBtn, '播放')
  })

  test('时间轴暂停：年份停止演进（回归：暂停后 interval 未清理仍自走）', async ({ page }) => {
    await page.goto('/analysis')
    await page.locator('.timeline-bar').waitFor({ timeout: 30000 })
    const year = page.locator('[data-testid="timeline-year"]')
    const playBtn = page.locator('[data-testid="timeline-play"]')

    // 拖到 2000 年再播放,给暂停后的观察留足年份空间
    await page.locator('[data-testid="timeline-range"]').fill('0')
    await expect(year).toHaveText('2000')

    await clickUntilAccepted(playBtn, '暂停')
    await expect
      .poll(async () => Number(await year.textContent()), { timeout: 15_000 })
      .toBeGreaterThan(2000)

    await clickUntilAccepted(playBtn, '播放') // 暂停
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
})
