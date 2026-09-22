import { test, expect } from '@playwright/test'
import { mockTianditu } from './helpers/tiles'

/**
 * 首页地球 · WebGL 上下文不跨路由累积（回归 P1）。
 *
 * renderer.dispose() 只释放 three 自己登记的资源，**不会归还 WebGL 上下文**。
 * 实测修复前：20 次进出首页 → 创建 21 个、仍存活 16 个（撞 Chrome 上限），
 * 并打出 5 次「Too many active WebGL contexts. Oldest context will be lost.」
 * —— 被强制回收的最老那个，可能是用户此刻还在看的别的画布。
 * 现在卸载时显式 loseContext()。
 */

test('反复进出首页不累积 WebGL 上下文', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as any).__gl = { created: 0, alive: 0 }
    const orig = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: any[]) {
      const c = (orig as any).call(this, type, ...rest)
      if (c && /webgl/i.test(String(type))) {
        ;(window as any).__gl.created++
        ;(window as any).__gl.alive++
        this.addEventListener('webglcontextlost', () => { (window as any).__gl.alive-- })
      }
      return c
    }
  })
  await mockTianditu(page)

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  for (let i = 0; i < 4; i++) {
    await page.locator('.shell-switch').evaluate((el) => el.click())
    await expect(page.locator('.example-card').first()).toBeVisible({ timeout: 30_000 })
    await page.locator('.shell-switch').evaluate((el) => el.click())
    await expect(page.locator('.earth-canvas')).toBeVisible({ timeout: 30_000 })
  }
  // loseContext 的 webglcontextlost 是异步派发的，给它一次落定的机会
  await page.waitForTimeout(1500)

  const gl = await page.evaluate(() => (window as any).__gl)
  // 正向锚点：确实建了 5 次（每次进 / 一个），否则「存活数很小」毫无意义
  expect(gl.created).toBeGreaterThanOrEqual(5)
  expect(gl.alive, `存活 WebGL 上下文 ${gl.alive} 个 / 共创建 ${gl.created} 个`).toBeLessThanOrEqual(2)
})
