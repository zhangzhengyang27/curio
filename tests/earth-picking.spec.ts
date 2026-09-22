import { test, expect } from '@playwright/test'
import { mockTianditu } from './helpers/tiles'

/**
 * 首页地球：射线拾取必须以画布自己的盒子为参考系（回归 P1）。
 *
 * 历史缺陷：useRaycaster 用 window.innerWidth/innerHeight 归一化 NDC，
 * 而画布挂在顶栏下方（top = 56px），于是每次点击命中的都是「光标下方 56px」
 * 的那个物体 —— 点地球上方的空白背景也会选中一个国家。
 *
 * 断言写法（见 KNOWN_PITFALLS C18）：先做正向锚点 —— 在地球圆盘内扫若干点，
 * 必须至少命中一次（否则是场景坏了，不是拾取对了）；再断言圆盘上方的背景不命中。
 */

/** 在画布圆盘内扫点，返回第一个命中的国家名 */
async function firstHitInsideGlobe(page, box) {
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const r = Math.min(box.width, box.height) * 0.3
  const offsets = [[0, 0], [0, -r], [0, r], [-r, 0], [r, 0], [-r * 0.6, -r * 0.6], [r * 0.6, r * 0.6]]
  for (const [dx, dy] of offsets) {
    await page.mouse.click(cx + dx, cy + dy)
    await page.waitForTimeout(250)
    const panel = page.locator('.info-panel')
    if (await panel.isVisible()) return { hit: true, at: [cx + dx, cy + dy], text: await panel.innerText() }
  }
  return { hit: false, at: null, text: null }
}

/** 命中后 CSS2D 主标签在页面上的中心点（标签就挂在命中点投影处） */
async function labelCenter(page) {
  return page.evaluate(() => {
    const box = document.querySelector('.label-container')
    const el = box && [...box.querySelectorAll('div')].find((d) => d.style.visibility === 'visible')
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  })
}

test.beforeEach(async ({ page }) => {
  await mockTianditu(page)
})

test.describe('首页地球 · 射线拾取', () => {
  test('命中标签应落在光标处（拾取与标签投影同一参考系）', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const box = await page.locator('.earth-canvas').boundingBox()
    expect(box).not.toBeNull()

    // 正向锚点：圆盘内确实点得到国家，否则下面的距离断言是假绿
    const inside = await firstHitInsideGlobe(page, box)
    expect(inside.hit, '地球圆盘内应至少命中一个国家').toBe(true)
    await expect(page.locator('.info-panel')).toBeVisible()

    const label = await labelCenter(page)
    expect(label, '命中后应出现定位标签').not.toBeNull()
    // 历史缺陷：射线按 window 尺寸归一化而画布在顶栏下方（top 56px），
    // 标签又由按 window 尺寸构建的 CSS2DRenderer 投影 —— 点击点会整体下偏 56px。
    // 容差 30px：留给标签本身 -16px 的抬高量，远小于缺陷的 56px。
    expect(Math.abs(label.y - inside.at[1])).toBeLessThan(30)
    expect(Math.abs(label.x - inside.at[0])).toBeLessThan(30)

    // 顶栏正下方、地球轮廓之上：这里只有背景
    await page.mouse.click(box.x + box.width / 2, box.y + 20)
    await expect(page.locator('.info-panel')).toBeHidden()
  })

  test('画布不得溢出顶栏下方预留的高度', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const geo = await page.evaluate(() => {
      const c = document.querySelector('.earth-canvas')
      const nav = document.querySelector('.app-nav')
      const r = c.getBoundingClientRect()
      return {
        top: r.top,
        bottom: r.bottom,
        h: r.height,
        inner: window.innerHeight,
        navBottom: nav.getBoundingClientRect().bottom,
      }
    })
    // 画布顶边贴住顶栏下沿，底边贴住视口下沿（曾经 100vh 直落，底部 56px 出屏）
    expect(Math.round(geo.top)).toBe(Math.round(geo.navBottom))
    expect(Math.round(geo.bottom)).toBeLessThanOrEqual(geo.inner)
    expect(geo.h).toBeGreaterThan(geo.inner * 0.7)
  })
})
