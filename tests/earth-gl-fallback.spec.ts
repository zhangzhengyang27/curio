import { test, expect } from '@playwright/test'
import { mockTianditu } from './helpers/tiles'

/**
 * 首页地球 · WebGL 不可用与上下文丢失的可观测性（回归 P2）。
 *
 * 旧行为：useScene 里 new WebGLRenderer 抛错后被 EarthCanvas 的 catch 吞掉，
 * 只留一行 console.error —— 面板都在、画布一片黑，用户无从判断是渲染层坏了
 * 还是数据没到。上下文丢失同理：useScene 拦下了默认行为，但没人订阅，
 * 渲染循环继续对着已死的上下文出帧，表现为「冻住的地球」。
 */

const IS_PREVIEW = process.env.E2E_TARGET === 'preview'
const TIP = '[data-testid="gl-error"]'

test.beforeEach(async ({ page }) => {
  await mockTianditu(page)
})

test.describe('首页地球 · WebGL 兜底', () => {
  test('拿不到 WebGL 上下文时给出可读提示，而不是安静的黑屏', async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: any[]) {
        if (/webgl/i.test(String(type))) return null
        return (orig as any).call(this, type, ...rest)
      }
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const tip = page.locator(TIP)
    await expect(tip).toBeVisible()
    await expect(tip).toContainText('WebGL')
    // 正向对照：顶栏与图层面板照常可用，说明只是渲染层降级而非整页崩掉
    await expect(page.locator('.app-nav')).toBeVisible()
    await expect(page.locator('.left-panel')).toBeVisible()
  })

  test('上下文丢失时提示并停帧，恢复后提示消失', async ({ page }) => {
    test.skip(IS_PREVIEW, '依赖 dev 模式下的 __vueParentComponent 句柄')
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.locator(TIP)).toHaveCount(0)

    // 必须等到真的出帧：订阅 onContextLostOnce 排在渲染循环启动之后，
    // 而初始化要跑好几秒（worldZh 2.4MB + 177 个国家 Mesh），
    // 在 networkidle 就丢上下文会赶在订阅之前，事件没人接。
    await expect
      .poll(() => page.evaluate(() => document.querySelector('.earth-canvas')?.__vueParentComponent?.exposed?.getRenderer()?.info?.render?.frame ?? 0), { timeout: 60_000 })
      .toBeGreaterThan(0)

    // 扩展句柄要留在页面上：上下文丢失之后再 getExtension 拿到的是死上下文，
    // restoreContext() 会静默失效
    const lost = await page.evaluate(() => {
      const inst = document.querySelector('.earth-canvas')?.__vueParentComponent
      const gl = inst?.exposed?.getRenderer()?.getContext()
      const ext = gl?.getExtension('WEBGL_lose_context')
      if (!ext) return false
      window.__loseExt = ext
      ext.loseContext()
      return true
    })
    expect(lost, '需要能拿到 WEBGL_lose_context 扩展').toBe(true)

    await expect(page.locator(TIP)).toBeVisible()

    await page.evaluate(() => window.__loseExt?.restoreContext())
    await expect(page.locator(TIP)).toHaveCount(0)
  })
})
