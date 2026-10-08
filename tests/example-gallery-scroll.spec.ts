import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * 示例中心的滚动与窄窗口契约。
 *
 * 三条都源自同一件事：theme.css 给 html / body / #app 都设了 height:100% + overflow:auto，
 * 文档本身永远不溢出，真正滚动的是 #app。由此派生出两个静默缺陷
 * （window.scrollTo 空操作 → 翻页停在原处；原生后退滚动恢复不发生 → 返回时位置归零），
 * 以及一个 min-width:1280px 造成的横向溢出。
 * 这些都不会报错，所以断言打在「用户能感知的位置状态」上。
 */

const rootScrollTop = (page: Page) =>
  page.evaluate(() => document.getElementById('app')?.scrollTop ?? -1)

test.describe('示例中心滚动与窄窗口', () => {
  test('翻页后必须回到顶部（回归：window.scrollTo 对 #app 是空操作）', async ({ page }) => {
    await page.goto('/examples')
    await expect(page.locator('.example-card').first()).toBeVisible()
    await page.evaluate(() => {
      const root = document.getElementById('app')
      if (root) root.scrollTop = 900
    })
    await expect.poll(() => rootScrollTop(page)).toBeGreaterThan(300)

    await page.locator('.page-btn', { hasText: /^2$/ }).click()
    await expect(page.locator('.page-btn.active')).toContainText('2')

    // 平滑滚动要等动画落定，用 poll 而不是固定 sleep
    await expect.poll(() => rootScrollTop(page), { timeout: 5000 }).toBeLessThan(40)
    // 第一张卡片必须落在视口内，否则用户看到的是第 2 页的中段
    const top = await page.locator('.example-card').first().evaluate(el => el.getBoundingClientRect().top)
    expect(top, '翻页后首张卡片应出现在视口内').toBeGreaterThanOrEqual(0)
    expect(top).toBeLessThan(900)
  })

  test('从详情返回列表时恢复到离开前所在的位置', async ({ page }) => {
    await page.goto('/examples?page=2')  // 2026-10-08 四源迁出后 77 条共 2 页
    await expect(page.locator('.example-card').first()).toBeVisible()
    await page.evaluate(() => {
      const root = document.getElementById('app')
      if (root) root.scrollTop = 700
    })
    await expect.poll(() => rootScrollTop(page)).toBeGreaterThan(400)

    // 基准取「点击那一刻容器实际在哪」，而不是写死 700。
    // Playwright 在 click 前会把目标滚进视口（实测把 #app 从 700 挪到 75），
    // 那是测试工具的副作用、不是应用行为；而这条用例的契约只是
    // 「回来时还在离开时的位置」，用真值做基准两种情形都成立。
    const topAtClick = await rootScrollTop(page)
    expect(topAtClick, '点击前容器就没滚动，用例前提不成立').toBeGreaterThan(0)

    // 用 el.click() 而不是 locator.click()：后者会先做「滚进视口」的行动性处理，
    // 在 #app 这种嵌套滚动容器里会把位置从 700 挪到 75（实测），于是应用存下的
    // 就是测试工具造出来的位置。el.click() 派发同样的 click 事件（会走捕获阶段），
    // 但不带任何滚动副作用 —— 真实用户点一张看得见的卡片也正是这样。
    await page.locator('.example-card').nth(1).evaluate(el => (el as HTMLElement).click())
    await expect(page).toHaveURL(/\/examples\/[^/]+\//)
    await page.goBack()
    await expect(page).toHaveURL(/\/examples\?page=2/)
    await expect(page.locator('.example-card').first()).toBeVisible()

    let restored = -1
    for (let i = 0; i < 40; i++) {
      restored = await rootScrollTop(page)
      if (Math.abs(restored - topAtClick) <= 2) break
      await page.waitForTimeout(200)
    }
    expect(
      Math.abs(restored - topAtClick),
      `未回到离开前的位置：期望 ${topAtClick}，实际 ${restored}`,
    ).toBeLessThanOrEqual(2)
  })

  for (const width of [1280, 1100, 1024]) {
    test(`${width}px 宽下不出现整页横向滚动，顶栏导航不逐字竖排`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/examples')
      await expect(page.locator('.example-card').first()).toBeVisible()

      const m = await page.evaluate(() => {
        // 判「逐字竖排」要看文本实际换了几行：用 Range 数行盒，
        // 拿元素高度比阈值会被 padding 和 line-height:normal 骗过（实测在 1280 就误报）。
        const wrapped: string[] = []
        for (const el of Array.from(document.querySelectorAll('.nav-links a, .nav-links button, .nav-links span'))) {
          const text = el.textContent?.trim()
          if (!text || el.children.length > 0) continue
          const node = Array.from(el.childNodes).find(n => n.nodeType === 3 && (n.textContent || '').trim())
          if (!node) continue
          const range = document.createRange()
          range.selectNodeContents(node)
          const lines = new Set(Array.from(range.getClientRects()).map(r => Math.round(r.top))).size
          if (lines > 1) wrapped.push(text)
        }
        return {
          docW: document.documentElement.scrollWidth,
          innerW: window.innerWidth,
          wrapped,
        }
      })
      expect(m.docW, `视口 ${m.innerW} 但文档宽 ${m.docW}，出现横向滚动`).toBeLessThanOrEqual(m.innerW + 1)
      expect(m.wrapped, `这些导航项文字被挤成多行竖排：${m.wrapped.join('、')}`).toEqual([])
    })
  }
})
