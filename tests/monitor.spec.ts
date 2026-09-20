import { test, expect } from '@playwright/test'
import { mockTianditu } from './helpers/tiles'

/**
 * 业务监控页（/monitor·地震应急监测）冒烟测试。
 *
 * 闭环：事件流接收（模拟推送）→ 告警列表 → 选中定位 → 详情处置
 * （未处理→处理中→已处置，可重开）→ 统计大盘联动。
 * 「+ 模拟事件」按钮提供确定性的事件到达路径（不依赖 7s 定时器）。
 */

test.beforeEach(async ({ page }) => {
  await mockTianditu(page)
})

test.describe('业务监控', () => {
  test('页面打开：事件流与统计大盘就绪，无页面错误', async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/monitor?nostream=1')
    await expect(page.locator('.panel-left')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('[data-testid="feed-list"] .feed-item')).toHaveCount(10)
    await expect(page.locator('[data-testid="stats-open"]')).toContainText('10')
    expect(errors).toEqual([])
  })

  test('点击事件流：详情面板展示震级与处置按钮', async ({ page }) => {
    await page.goto('/monitor?nostream=1')
    await page.locator('.panel-left').waitFor({ timeout: 30000 })
    await page.locator('[data-testid="feed-list"] .feed-item').first().evaluate((el) => el.click())
    const detail = page.locator('[data-testid="detail-mag"]')
    await expect(detail).toBeVisible()
    await expect(detail).toContainText(/M\d/)
    await expect(page.locator('[data-testid="act-processing"]')).toBeVisible()
  })

  test('处置流转：未处理→处理中→已处置，统计联动', async ({ page }) => {
    await page.goto('/monitor?nostream=1')
    await page.locator('.panel-left').waitFor({ timeout: 30000 })
    await page.locator('[data-testid="feed-list"] .feed-item').first().evaluate((el) => el.click())

    await page.locator('[data-testid="act-processing"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="detail-status"]')).toHaveText('处理中')
    await expect(page.locator('[data-testid="stats-processing"]')).toContainText('1')

    await page.locator('[data-testid="act-resolve"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="detail-status"]')).toHaveText('已处置')
    await expect(page.locator('[data-testid="stats-resolved"]')).toContainText('1')
    // 未处理数应从 10 降到 9
    const openText = await page.locator('[data-testid="stats-open"]').textContent()
    expect(Number(openText.replace(/[^0-9]/g, ''))).toBe(9)

    // 可重开
    await page.locator('[data-testid="act-reopen"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="detail-status"]')).toHaveText('未处理')
  })

  test('模拟事件：流中新增一条未处理事件', async ({ page }) => {
    await page.goto('/monitor?nostream=1')
    await page.locator('.panel-left').waitFor({ timeout: 30000 })
    const before = await page.locator('[data-testid="feed-list"] .feed-item').count()
    await page.locator('[data-testid="simulate-btn"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="feed-list"] .feed-item')).toHaveCount(before + 1)
  })

  test('处置持久化：刷新后状态与统计恢复；重置演练全部回到未处理', async ({ page }) => {
    // 本用例含 2 次整页加载（每次都是 Cesium 底座冷启动），60s 的用例预算不够。
    // 定点放宽而非文件级 test.slow()：满载机器上后者会让一条卡死的用例烧 3 分钟
    // 而不是快速失败。与 M4/M10/W2 既有做法同口径（KNOWN_PITFALLS A5）。
    test.setTimeout(120_000)
    // 处置状态存 localStorage,测试间互不污染;⚠ addInitScript 每次导航都执行,
    // 裸清会把 reload 后刚存的状态也清掉(map-tools 书签用例同款坑),须只清一次
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('__tv-cleaned')) {
        localStorage.removeItem('tv-monitor-status')
        sessionStorage.setItem('__tv-cleaned', '1')
      }
    })
    await page.goto('/monitor?nostream=1')
    await page.locator('.panel-left').waitFor({ timeout: 30000 })

    // 第一条:处置到「已处置」
    await page.locator('[data-testid="feed-list"] .feed-item').first().evaluate((el) => el.click())
    await page.locator('[data-testid="act-processing"]').evaluate((el) => el.click())
    await page.locator('[data-testid="act-resolve"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="stats-resolved"]')).toContainText('1')

    // 刷新:处置状态与统计保持(K1)
    await page.reload()
    await page.locator('.panel-left').waitFor({ timeout: 30000 })
    await expect(page.locator('[data-testid="stats-resolved"]')).toContainText('1')
    await page.locator('[data-testid="feed-list"] .feed-item').first().evaluate((el) => el.click())
    await expect(page.locator('[data-testid="detail-status"]')).toHaveText('已处置')

    // 重置演练:统计清零回初始
    await page.locator('[data-testid="reset-drill"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="stats-resolved"]')).toContainText('0')
    await expect(page.locator('[data-testid="detail-status"]')).toHaveText('未处理')
  })

  // 回归：读侧有 try/catch，写侧原先没有。隐私模式/配额满时
  // persistStatus 的 setItem 抛错会让「状态已改」但后续刷新地图标记被中断；
  // resetDrill 的 removeItem 抛错更狠——它后面的 revealAt 循环整段不执行，
  // 事件已全部重置、列表却被清空，「重置演练」把页面清成空白。
  test('localStorage 不可用时处置与重置演练仍然生效(回归:写侧未包 try/catch)', async ({ page }) => {
    await page.addInitScript(() => {
      // 只废这一个键：直接替换 Storage.prototype 会连 sessionStorage 一起打死，
      // 页面初始化阶段就抛错，测的就不是「写侧没包」而是「整页起不来」了
      const origSet = Storage.prototype.setItem
      const origRm = Storage.prototype.removeItem
      const boom = () => { throw new DOMException('quota', 'QuotaExceededError') }
      Storage.prototype.setItem = function (k, v) {
        if (k === 'tv-monitor-status') boom()
        return origSet.call(this, k, v)
      }
      Storage.prototype.removeItem = function (k) {
        if (k === 'tv-monitor-status') boom()
        return origRm.call(this, k)
      }
    })
    await page.goto('/monitor?nostream=1')
    await page.locator('.panel-left').waitFor({ timeout: 30000 })

    await page.locator('[data-testid="feed-list"] .feed-item').first().evaluate((el) => el.click())
    await page.locator('[data-testid="act-processing"]').evaluate((el) => el.click())
    await page.locator('[data-testid="act-resolve"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="stats-resolved"]')).toContainText('1')

    await page.locator('[data-testid="reset-drill"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="stats-resolved"]')).toContainText('0')
    // 关键断言：重置后初始事件必须照常回到列表里，而不是留下一片空白
    await expect(page.locator('[data-testid="feed-list"] .feed-item')).toHaveCount(10)
  })

  test('流开关：nostream 进入后可手动开启自动推送', async ({ page }) => {
    await page.goto('/monitor?nostream=1')
    await page.locator('.panel-left').waitFor({ timeout: 30000 })
    const count = await page.locator('[data-testid="feed-list"] .feed-item').count()

    // Cesium 页上 CDP 点击会偶发丢失(KNOWN_PITFALLS C13),统一走 DOM click
    const toggle = page.locator('[data-testid="stream-toggle"]')
    await expect(toggle).toContainText('开启')
    await toggle.evaluate((el) => el.click())
    await expect(toggle).toContainText('停止')
    // 开启后 7s 定时器应推送一条(最长等到 15s)
    await expect
      .poll(async () => page.locator('[data-testid="feed-list"] .feed-item').count())
      .toBe(count + 1)
    await toggle.evaluate((el) => el.click()) // 收尾停止,不干扰其它用例
    await expect(toggle).toContainText('开启')
  })

  test('阈值告警:调低阈值后「重大」数与置顶即时重排(K2)', async ({ page }) => {
    await page.goto('/monitor?nostream=1')
    await page.locator('.stats-bar').waitFor({ timeout: 30000 })
    await expect(page.locator('[data-testid="feed-list"] .feed-item')).toHaveCount(10)

    // 读取数据文件计算期望:arrived 前 10 条(按日期降序)中 mag ≥ 阈值的数量
    const fs = await import('node:fs')
    const raw = JSON.parse(fs.readFileSync('public/data/mock/earthquakes.json', 'utf8'))
    const arrived = [...raw].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 10)

    const criticalCount = async () =>
      Number((await page.locator('[data-testid="stats-critical"]').textContent()).replace(/[^0-9]/g, ''))

    await page.locator('[data-testid="threshold-input"]').evaluate((el) => {
      el.value = '8'
      el.dispatchEvent(new Event('change', { bubbles: true }))
    })
    const expectAt8 = arrived.filter((r) => r.mag >= 8).length
    await expect
      .poll(criticalCount, { timeout: 5_000 })
      .toBe(expectAt8)

    await page.locator('[data-testid="threshold-input"]').evaluate((el) => {
      el.value = '4'
      el.dispatchEvent(new Event('change', { bubbles: true }))
    })
    const expectAt4 = arrived.filter((r) => r.mag >= 4).length
    await expect
      .poll(criticalCount, { timeout: 5_000 })
      .toBe(expectAt4)
    // 有重大事件时列表首位必须是重大
    if (expectAt4 > 0) {
      await expect(page.locator('[data-testid="feed-list"] .feed-item').first()).toContainText('重大')
    }
  })

  test('巡游大屏:自动轮播未处置事件,步进可用(K3)', async ({ page }) => {
    await page.goto('/monitor?nostream=1')
    await page.locator('.stats-bar').waitFor({ timeout: 30000 })

    // 步进:详情切换到某事件
    await page.locator('[data-testid="tour-step"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="detail-mag"]')).toBeVisible({ timeout: 10_000 })

    // 自动巡游:开启后 5s 内详情应自动切换
    await page.locator('[data-testid="tour-btn"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="tour-btn"]')).toContainText('停止巡游', { timeout: 5_000 })
    await page.waitForTimeout(5000)
    await expect(page.locator('[data-testid="detail-mag"]')).toBeVisible()

    // 停止
    await page.locator('[data-testid="tour-btn"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="tour-btn"]')).toContainText('巡游大屏')
  })

  test('时间回放:按发震时间升序重放事件到达(K4)', async ({ page }) => {
    await page.goto('/monitor?nostream=1')
    await page.locator('.stats-bar').waitFor({ timeout: 30000 })

    const fs = await import('node:fs')
    const raw = JSON.parse(fs.readFileSync('public/data/mock/earthquakes.json', 'utf8'))
    // 升序 = 最早的先到达;feed「新的在前」,放行到第 7 条时首位 = 升序第 7 条
    const ascending = [...raw].sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0))
    const seventh = ascending[6]

    await page.locator('[data-testid="replay-btn"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="replay-btn"]')).toContainText('停止回放', { timeout: 5_000 })
    await expect
      .poll(async () => page.locator('[data-testid="feed-list"] .feed-item').first().textContent())
      .toContain(seventh.date.slice(0, 10))

    await page.locator('[data-testid="replay-btn"]').evaluate((el) => el.click()) // 收尾停止
  })
})
