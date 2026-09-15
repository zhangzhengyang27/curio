import { test, expect } from '@playwright/test'

/**
 * 业务监控页（/monitor·地震应急监测）冒烟测试。
 *
 * 闭环：事件流接收（模拟推送）→ 告警列表 → 选中定位 → 详情处置
 * （未处理→处理中→已处置，可重开）→ 统计大盘联动。
 * 「+ 模拟事件」按钮提供确定性的事件到达路径（不依赖 7s 定时器）。
 */

test.describe('业务监控', () => {
  test('页面打开：事件流与统计大盘就绪，无页面错误', async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/monitor?nostream=1')
    await expect(page.locator('.panel-left')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('[data-testid="feed-list"] .feed-item')).toHaveCount(10, { timeout: 15_000 })
    await expect(page.locator('[data-testid="stats-open"]')).toContainText('10')
    expect(errors).toEqual([])
  })

  test('点击事件流：详情面板展示震级与处置按钮', async ({ page }) => {
    await page.goto('/monitor?nostream=1')
    await page.locator('.panel-left').waitFor({ timeout: 30000 })
    await page.locator('[data-testid="feed-list"] .feed-item').first().click()
    const detail = page.locator('[data-testid="detail-mag"]')
    await expect(detail).toBeVisible()
    await expect(detail).toContainText(/M\d/)
    await expect(page.locator('[data-testid="act-processing"]')).toBeVisible()
  })

  test('处置流转：未处理→处理中→已处置，统计联动', async ({ page }) => {
    await page.goto('/monitor?nostream=1')
    await page.locator('.panel-left').waitFor({ timeout: 30000 })
    await page.locator('[data-testid="feed-list"] .feed-item').first().click()

    await page.locator('[data-testid="act-processing"]').click()
    await expect(page.locator('[data-testid="detail-status"]')).toHaveText('处理中')
    await expect(page.locator('[data-testid="stats-processing"]')).toContainText('1')

    await page.locator('[data-testid="act-resolve"]').click()
    await expect(page.locator('[data-testid="detail-status"]')).toHaveText('已处置')
    await expect(page.locator('[data-testid="stats-resolved"]')).toContainText('1')
    // 未处理数应从 10 降到 9
    const openText = await page.locator('[data-testid="stats-open"]').textContent()
    expect(Number(openText.replace(/[^0-9]/g, ''))).toBe(9)

    // 可重开
    await page.locator('[data-testid="act-reopen"]').click()
    await expect(page.locator('[data-testid="detail-status"]')).toHaveText('未处理')
  })

  test('模拟事件：流中新增一条未处理事件', async ({ page }) => {
    await page.goto('/monitor?nostream=1')
    await page.locator('.panel-left').waitFor({ timeout: 30000 })
    const before = await page.locator('[data-testid="feed-list"] .feed-item').count()
    await page.locator('[data-testid="simulate-btn"]').click()
    await expect(page.locator('[data-testid="feed-list"] .feed-item')).toHaveCount(before + 1)
  })

  test('处置持久化：刷新后状态与统计恢复；重置演练全部回到未处理', async ({ page }) => {
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
    await page.locator('[data-testid="feed-list"] .feed-item').first().click()
    await page.locator('[data-testid="act-processing"]').click()
    await page.locator('[data-testid="act-resolve"]').click()
    await expect(page.locator('[data-testid="stats-resolved"]')).toContainText('1')

    // 刷新:处置状态与统计保持(K1)
    await page.reload()
    await page.locator('.panel-left').waitFor({ timeout: 30000 })
    await expect(page.locator('[data-testid="stats-resolved"]')).toContainText('1')
    await page.locator('[data-testid="feed-list"] .feed-item').first().click()
    await expect(page.locator('[data-testid="detail-status"]')).toHaveText('已处置')

    // 重置演练:统计清零回初始
    await page.locator('[data-testid="reset-drill"]').click()
    await expect(page.locator('[data-testid="stats-resolved"]')).toContainText('0')
    await expect(page.locator('[data-testid="detail-status"]')).toHaveText('未处理')
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
      .poll(async () => page.locator('[data-testid="feed-list"] .feed-item').count(), { timeout: 15_000 })
      .toBe(count + 1)
    await toggle.evaluate((el) => el.click()) // 收尾停止,不干扰其它用例
    await expect(toggle).toContainText('开启')
  })
})
