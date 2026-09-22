import { test, expect } from '@playwright/test'
import { mockTianditu } from './helpers/tiles'

/**
 * 首页地球 · 图层构建次数（回归 P2）。
 *
 * LayerManager.switch 以前是 `layer.create()` 紧跟 `layer.update(data)`，
 * 而 create 里就调 _build、update 里又 _clear + _build —— 每次切层 _build 跑两遍。
 * 判 data 为空的图层只是空转，但 LandmarksLayer 的 _build 不判 data，
 * 于是 8 个圆柱 + 8 张画布纹理标签每切一次真的建两遍、中间还 dispose 一遍。
 *
 * 终态完全一致，所以只能计数：给 LandmarksLayer.prototype._build 挂一层计数，
 * 切一次「地标」应当只进 1 次。
 */

const IS_PREVIEW = process.env.E2E_TARGET === 'preview'

test.beforeEach(async ({ page }) => {
  await mockTianditu(page)
})

test('切换地标图层只构建一次', async ({ page }) => {
  test.skip(IS_PREVIEW, '依赖 dev 模式下可按 URL 二次 import 的源码模块')
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await expect
    .poll(() => page.evaluate(() => document.querySelector('.earth-canvas')?.__vueParentComponent?.exposed?.getRenderer()?.info?.render?.frame ?? 0), { timeout: 60_000 })
    .toBeGreaterThan(0)

  const armed = await page.evaluate(async () => {
    const m = await import('/src/three/layers/LandmarksLayer.ts')
    const proto = m.LandmarksLayer?.prototype
    if (!proto?._build) return false
    const orig = proto._build
    ;(window as any).__buildCalls = 0
    proto._build = function (...args: any[]) {
      ;(window as any).__buildCalls++
      return orig.apply(this, args)
    }
    return true
  })
  expect(armed, '需要能包住 LandmarksLayer.prototype._build').toBe(true)

  await page.locator('.viz-btn', { hasText: '地标' }).evaluate((el) => el.click())
  await expect(page.locator('.viz-btn', { hasText: '地标' })).toHaveClass(/active/, { timeout: 20_000 })
  await page.waitForTimeout(1500)

  // 计数本身即正向锚点：_build 没跑是 0、跑两遍是 2，两种都该红
  const calls = await page.evaluate(() => (window as any).__buildCalls)
  expect(calls, `_build 次数 = ${calls}`).toBe(1)
})
