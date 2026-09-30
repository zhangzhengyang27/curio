import { test, expect } from '@playwright/test'
import { mockTianditu } from './helpers/tiles'
import { mockQuakes, expectedOrder, FIXTURE, T0 } from './helpers/quakes'
import type { QuakeMock } from './helpers/quakes'

/**
 * 业务监控页（/monitor·地震应急监测）冒烟测试。
 *
 * 数据链路：server/ 后端（USGS 缓存）→ 前端轮询；用例统一用 route 拦截
 * /api/quakes 喂固定夹具，因此**与后端是否启动完全解耦**，也不受真实
 * 地震活动影响。夹具见 tests/helpers/quakes.ts。
 *
 * 闭环：事件流接收 → 告警列表 → 选中定位 → 详情处置 → 统计大盘联动。
 */

const items = (page: import('@playwright/test').Page) =>
  page.locator('[data-testid="feed-list"] .feed-item')

/** 统一进入：拦截数据源 + nostream（避免 30s 轮询干扰）+ 等首屏就绪 */
async function openMonitor(page: import('@playwright/test').Page, mockOpts = {}): Promise<QuakeMock> {
  const mock = await mockQuakes(page, mockOpts)
  await page.goto('/monitor?nostream=1')
  await page.locator('.panel-left').waitFor({ timeout: 30000 })
  return mock
}

test.beforeEach(async ({ page }) => {
  await mockTianditu(page)
})

test.describe('业务监控', () => {
  test('页面打开：事件流与统计大盘就绪，数据源为实时，无页面错误', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await openMonitor(page)
    await expect(items(page)).toHaveCount(10)
    await expect(page.locator('[data-testid="stats-open"]')).toContainText('10')
    await expect(page.locator('[data-testid="source-badge"]')).toHaveText('USGS 实时')
    expect(errors).toEqual([])
  })

  test('首屏顺序：重大置顶，其余按发震时间降序（新的在前）', async ({ page }) => {
    await openMonitor(page)
    // 夹具 12 条 > initialCount 10，已到达的是最新的 10 条
    const arrived = [...FIXTURE].sort((a, b) => b.time - a.time).slice(0, 10)
    const ids = await items(page).evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')))
    expect(ids).toEqual(expectedOrder(arrived).map((id) => `feed-item-${id}`))
  })

  test('点击事件流：详情面板展示震级、时刻、位置与处置按钮', async ({ page }) => {
    await openMonitor(page)
    await items(page).first().evaluate((el) => el.click())
    const detail = page.locator('[data-testid="detail-mag"]')
    await expect(detail).toBeVisible()
    await expect(detail).toContainText(/M\d/)
    await expect(page.locator('.place-line')).toContainText('演练地点')
    await expect(page.locator('[data-testid="act-processing"]')).toBeVisible()
  })

  test('处置流转：未处理→处理中→已处置，统计联动，可重开', async ({ page }) => {
    await openMonitor(page)
    await items(page).first().evaluate((el) => el.click())

    await page.locator('[data-testid="act-processing"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="detail-status"]')).toHaveText('处理中')
    await expect(page.locator('[data-testid="stats-processing"]')).toContainText('1')

    await page.locator('[data-testid="act-resolve"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="detail-status"]')).toHaveText('已处置')
    await expect(page.locator('[data-testid="stats-resolved"]')).toContainText('1')
    const openText = await page.locator('[data-testid="stats-open"]').textContent()
    expect(Number(openText.replace(/[^0-9]/g, ''))).toBe(9)

    await page.locator('[data-testid="act-reopen"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="detail-status"]')).toHaveText('未处理')
  })

  test('演练事件：注入一条合成事件并计入事件流', async ({ page }) => {
    await openMonitor(page)
    const before = await items(page).count()
    await page.locator('[data-testid="simulate-btn"]').evaluate((el) => el.click())
    await expect(items(page)).toHaveCount(before + 1)
    const sim = page.locator('[data-testid="feed-item-sim-1"]')
    await expect(sim).toBeVisible()
    await expect(sim).toContainText('未处理')
  })

  test('处置持久化：刷新后按事件 id 恢复；重置处置清零', async ({ page }) => {
    // 含 2 次整页加载（每次 Cesium 底座冷启动），定点放宽而非文件级 slow()（KNOWN_PITFALLS A5）
    test.setTimeout(120_000)
    // ⚠ addInitScript 每次导航都执行，裸清会把 reload 后刚存的状态也清掉，须只清一次
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('__tv-cleaned')) {
        localStorage.removeItem('cu-monitor-status-v2')
        sessionStorage.setItem('__tv-cleaned', '1')
      }
    })
    await openMonitor(page)

    await items(page).first().evaluate((el) => el.click())
    await page.locator('[data-testid="act-processing"]').evaluate((el) => el.click())
    await page.locator('[data-testid="act-resolve"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="stats-resolved"]')).toContainText('1')

    await page.reload()
    await page.locator('.panel-left').waitFor({ timeout: 30000 })
    await expect(page.locator('[data-testid="stats-resolved"]')).toContainText('1')
    await items(page).first().evaluate((el) => el.click())
    await expect(page.locator('[data-testid="detail-status"]')).toHaveText('已处置')

    await page.locator('[data-testid="reset-drill"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="stats-resolved"]')).toContainText('0')
    await expect(page.locator('[data-testid="detail-status"]')).toHaveText('未处理')
  })

  // 回归：读侧有 try/catch，写侧原先没有。隐私模式/配额满时 setItem 抛错会让
  // 「状态已改」但「刷新地图标记」被中断；removeItem 抛错更会把列表清成空白。
  test('localStorage 不可用时处置与重置仍生效(回归:写侧未包 try/catch)', async ({ page }) => {
    await page.addInitScript(() => {
      // 只废这一个键：替换 Storage.prototype 会连 sessionStorage 一起打死，
      // 页面初始化就抛错，测的就不是「写侧没包」而是「整页起不来」
      const origSet = Storage.prototype.setItem
      const origRm = Storage.prototype.removeItem
      const boom = () => {
        throw new DOMException('quota', 'QuotaExceededError')
      }
      Storage.prototype.setItem = function (k, v) {
        if (k === 'cu-monitor-status-v2') boom()
        return origSet.call(this, k, v)
      }
      Storage.prototype.removeItem = function (k) {
        if (k === 'cu-monitor-status-v2') boom()
        return origRm.call(this, k)
      }
    })
    await openMonitor(page)

    await items(page).first().evaluate((el) => el.click())
    await page.locator('[data-testid="act-processing"]').evaluate((el) => el.click())
    await page.locator('[data-testid="act-resolve"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="stats-resolved"]')).toContainText('1')

    await page.locator('[data-testid="reset-drill"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="stats-resolved"]')).toContainText('0')
    await expect(items(page)).toHaveCount(10)
  })

  test('轮询增量：轮询期间新到达的事件进入事件流', async ({ page }) => {
    const mock = await mockQuakes(page)
    // 不写 nostream：让 onMounted 自动开轮询；?poll=1000 把 30s 压到 1s
    await page.goto('/monitor?poll=1000')
    await page.locator('.panel-left').waitFor({ timeout: 30000 })
    const before = await items(page).count()

    // 注入一条比当前最新还新的「刚发生」事件，下一次轮询应带回来
    const fresh = {
      id: 'q99',
      mag: 5.3,
      place: '刚发生的事件',
      time: T0 + 40 * 3_600_000,
      depth: 25,
      lon: 120,
      lat: 30,
      alert: null,
      url: '',
    }
    mock.events.push(fresh)
    await expect(items(page)).toHaveCount(before + 1, { timeout: 15_000 })
    await expect(page.locator('[data-testid="feed-item-q99"]')).toBeVisible()
    // 新到达不改变「重大置顶 + 其余降序」的排序契约
    const arrived = [...FIXTURE, fresh].sort((a, b) => b.time - a.time).slice(0, 11)
    const ids = await items(page).evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')))
    expect(ids).toEqual(expectedOrder(arrived).map((id) => `feed-item-${id}`))
  })

  test('流开关：nostream 进入后可手动开启增量轮询', async ({ page }) => {
    const mock = await mockQuakes(page)
    await page.goto('/monitor?nostream=1&poll=1000')
    await page.locator('.panel-left').waitFor({ timeout: 30000 })
    const count = await items(page).count()

    // Cesium 页上 CDP 点击会偶发丢失(KNOWN_PITFALLS C13),统一走 DOM click
    const toggle = page.locator('[data-testid="stream-toggle"]')
    await expect(toggle).toHaveAttribute('aria-label', '开启增量轮询')
    await toggle.evaluate((el) => el.click())
    await expect(toggle).toHaveAttribute('aria-label', '停止增量轮询')
    mock.events.push({
      id: 'q98',
      mag: 4.9,
      place: '轮询带回来的事件',
      time: T0 + 30 * 3_600_000,
      depth: 30,
      lon: 110,
      lat: 25,
      alert: null,
      url: '',
    })
    await expect(items(page)).toHaveCount(count + 1, { timeout: 15_000 })
    await toggle.evaluate((el) => el.click()) // 收尾停止,不干扰其它用例
    await expect(toggle).toHaveAttribute('aria-label', '开启增量轮询')
  })

  test('阈值告警:调低阈值后「重大」数与置顶即时重排(K2)', async ({ page }) => {
    await openMonitor(page)
    await page.locator('.stats-bar').waitFor({ timeout: 30000 })
    await expect(items(page)).toHaveCount(10)

    const arrived = [...FIXTURE].sort((a, b) => b.time - a.time).slice(0, 10)
    const criticalCount = async () =>
      Number((await page.locator('[data-testid="stats-critical"]').textContent()).replace(/[^0-9]/g, ''))
    const setThreshold = async (v: string) => {
      await page.locator('[data-testid="threshold-input"]').evaluate((el, val) => {
        ;(el as HTMLInputElement).value = val
        el.dispatchEvent(new Event('change', { bubbles: true }))
      }, v)
    }

    await setThreshold('8')
    await expect.poll(criticalCount, { timeout: 5_000 }).toBe(arrived.filter((r) => r.mag >= 8).length)

    await setThreshold('4.5')
    const expectAt45 = arrived.filter((r) => r.mag >= 4.5).length
    await expect.poll(criticalCount, { timeout: 5_000 }).toBe(expectAt45)
    if (expectAt45 > 0) {
      await expect(items(page).first()).toContainText('重大')
    }

    // 0.5 档必须真实生效(回归:setThreshold 曾取整,输入框 step=0.5 是假的)
    await setThreshold('6.5')
    await expect(page.locator('[data-testid="threshold-input"]')).toHaveValue('6.5')
    await expect
      .poll(criticalCount, { timeout: 5_000 })
      .toBe(arrived.filter((r) => r.mag >= 6.5).length)
  })

  test('巡游大屏:自动轮播未处置事件,字幕随分镜上屏(K3)', async ({ page }) => {
    await openMonitor(page)
    await page.locator('.stats-bar').waitFor({ timeout: 30000 })

    await page.locator('[data-testid="tour-step"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="detail-mag"]')).toBeVisible({ timeout: 10_000 })
    // 分镜字幕必须上屏(回归:caption 曾只产出从不渲染)
    await expect(page.locator('[data-testid="tour-caption"]')).toContainText(/M\d/)

    await page.locator('[data-testid="tour-btn"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="tour-btn"]')).toContainText('停止巡游', { timeout: 5_000 })
    await page.waitForTimeout(5000)
    await expect(page.locator('[data-testid="detail-mag"]')).toBeVisible()

    await page.locator('[data-testid="tour-btn"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="tour-btn"]')).toContainText('巡游大屏')
  })

  test('轮询开关文案以数据层为准(回归:回放停掉轮询后标签仍显示推送中)', async ({ page }) => {
    await openMonitor(page)
    const toggle = page.locator('[data-testid="stream-toggle"]')
    await toggle.evaluate((el) => el.click())
    await expect(toggle).toHaveAttribute('aria-label', '停止增量轮询')
    // 回放进入即停轮询,标签必须立刻跟着回退,而不是等轮询纠偏
    await page.locator('[data-testid="replay-btn"]').evaluate((el) => el.click())
    await expect(toggle).toHaveAttribute('aria-label', '开启增量轮询', { timeout: 5_000 })
    await page.locator('[data-testid="replay-btn"]').evaluate((el) => el.click())
  })

  test('全部处置后巡游按钮禁用(回归:空路线静默无反应)', async ({ page }) => {
    // 本用例要连点 10 条事件，每次选中都会触发 1.4s 相机飞行，是全站最重的一条。
    // 定点放宽（与 K1 持久化用例同口径，KNOWN_PITFALLS A5）：满载机器上 60s 预算不够。
    test.setTimeout(150_000)
    await openMonitor(page)
    const n = await items(page).count()
    for (let i = 0; i < n; i++) {
      await items(page).nth(i).evaluate((el) => el.click())
      await page.locator('[data-testid="act-resolve"]').evaluate((el) => el.click())
    }
    await expect(page.locator('[data-testid="tour-btn"]')).toBeDisabled()
    await expect(page.locator('[data-testid="tour-step"]')).toBeDisabled()
  })

  test('时间回放:升序重放,退出恢复回放前的事件流,详情与列表自洽(K4)', async ({ page }) => {
    await openMonitor(page)
    await page.locator('.stats-bar').waitFor({ timeout: 30000 })

    // 升序 = 最早事件先「到达」；feed 新的在前，放行第 7 条时首位 = 升序第 7 条。
    // 重大置顶会改写首位，故与实现同口径地算出期望项
    const ascending = [...FIXTURE].sort((a, b) => a.time - b.time)
    const revealed7 = ascending.slice(0, 7)
    const expectedFirst = expectedOrder(revealed7)[0]

    await page.locator('[data-testid="replay-btn"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="replay-btn"]')).toContainText('停止回放', { timeout: 5_000 })
    await expect
      .poll(() => items(page).first().getAttribute('data-testid'), { timeout: 15_000 })
      .toBe(`feed-item-${expectedFirst}`)

    await page.locator('[data-testid="replay-btn"]').evaluate((el) => el.click()) // 收尾停止
    // 退出回放必须恢复回放前的事件流(回归:中途停止曾把事件流清成回放前缀)
    await expect(items(page)).toHaveCount(10)
    // 详情卡与列表自洽：要么选中项在流里（有 active 行），要么整张卡已清空
    const detailVisible = await page.locator('[data-testid="detail-mag"]').isVisible()
    await expect(page.locator('[data-testid="feed-list"] .feed-item.active')).toHaveCount(detailVisible ? 1 : 0)
  })

  test('后端不可达时降级到打包快照,不白屏', async ({ page }) => {
    await mockQuakes(page, { failApi: true })
    await page.goto('/monitor?nostream=1')
    await page.locator('.panel-left').waitFor({ timeout: 30000 })
    await expect(page.locator('[data-testid="source-badge"]')).toHaveText('打包快照')
    await expect(items(page)).toHaveCount(10)
  })
})
