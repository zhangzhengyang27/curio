import { test, expect } from '@playwright/test'
import { mockTianditu } from './helpers/tiles'

/**
 * 首页地球 · 双屏对比（回归 P2）。
 *
 * 旧行为：两块 EarthCanvas 都往同一份全局 store 写 earthGroup / layerChildren，
 * 后挂的赢，先卸载的又把幸存那块的引用清成 null；拾取从 store 取 Mesh，
 * 于是点左栏选中的是右栏那块的物体。而「联动」按钮只写 syncRotate 没人读，
 * 是个假开关。
 *
 * 现在两块画布都标成 primary=false 不写全局 store，拾取改用各自实例；
 * 「联动」开启时把左栏相机逐帧镜像到右栏。
 */

const IS_PREVIEW = process.env.E2E_TARGET === 'preview'

async function earthGroupInStore(page) {
  return page.evaluate(() => {
    const app = document.querySelector('#app')?.__vue_app__
    const provides = app?._context?.provides || {}
    const pinia = Object.getOwnPropertySymbols(provides).map((s) => provides[s]).find((v) => v && v._s)
    const store = pinia && [...pinia._s.values()].find((s) => s.$id === 'earth')
    return { found: !!store, hasGroup: !!(store && store.earthGroup) }
  })
}

/** 取某一栏画布的相机位置（经组件实例暴露的 getControls） */
async function camPos(page, idx: 0 | 1) {
  return page.evaluate((i) => {
    const hosts = [...document.querySelectorAll('.earth-container')]
    const el = hosts[i]?.querySelector('canvas')
    const inst = el && (el as any).__vueParentComponent
    const c = inst?.exposed?.getControls?.()
    return c ? { x: c.object.position.x, y: c.object.position.y, z: c.object.position.z } : null
  }, idx)
}

test.beforeEach(async ({ page }) => {
  await mockTianditu(page)
})

test.describe('首页地球 · 双屏对比', () => {
  test.skip(IS_PREVIEW, '依赖 dev 模式下的 __vueParentComponent 句柄')
  test.describe.configure({ mode: 'serial' })

  test('两块画布不抢全局 store，联动真的联动相机', async ({ page }) => {
    // 两条用例都要同时挂两颗完整地球（各自 177 个国家 Mesh），
    // 与其余地球用例并行时 60s 默认预算不够（实测拖拽那一步会先超时）
    test.slow()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect
      .poll(() => page.evaluate(() => document.querySelector('.earth-canvas')?.__vueParentComponent?.exposed?.getRenderer()?.info?.render?.frame ?? 0), { timeout: 60_000 })
      .toBeGreaterThan(0)

    await page.locator('.tool-btn[aria-label="分屏对比"]').evaluate((el) => el.click())
    await expect(page.locator('.earth-container')).toHaveCount(2)
    await expect
      .poll(() => page.evaluate(() => document.querySelectorAll('.earth-container canvas').length), { timeout: 60_000 })
      .toBe(2)

    // 主画布已随 v-else 卸载，两块分屏都不该再往全局 store 写 earthGroup
    const inSplit = await earthGroupInStore(page)
    expect(inSplit.found).toBe(true)
    expect(inSplit.hasGroup, '分屏的两块画布不应写全局 earthGroup').toBe(false)

    // 打开联动，拖左栏 → 右栏相机应跟过来
    await page.locator('.ctrl-btn').filter({ hasText: '联动' }).evaluate((el) => el.click())
    const rightBefore = await camPos(page, 1)
    const box = await page.locator('.earth-container').first().boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 60, { steps: 12 })
    await page.mouse.up()
    await page.waitForTimeout(600)

    const left = await camPos(page, 0)
    const right = await camPos(page, 1)
    expect(left).not.toBeNull()
    expect(right).not.toBeNull()
    expect(rightBefore).not.toBeNull()
    // 相机在半径 250 的球面上：未联动时 120px 拖拽会拉开上百单位，
    // 联动后只剩 OrbitControls 阻尼的一帧滞后（实测 ~6）
    expect(Math.hypot(right.x - rightBefore.x, right.y - rightBefore.y, right.z - rightBefore.z), '右栏相机应被带动')
      .toBeGreaterThan(20)
    expect(Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z), '两栏相机应基本重合')
      .toBeLessThan(15)
  })

  test('分屏里左键出详情面板、右键出菜单，退出后不留残面板', async ({ page }) => {
    test.slow()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('.tool-btn[aria-label="分屏对比"]').evaluate((el) => el.click())
    await expect(page.locator('.earth-container')).toHaveCount(2)
    await expect
      .poll(() => page.evaluate(() => document.querySelectorAll('.earth-container canvas').length), { timeout: 60_000 })
      .toBe(2)

    const pane = await page.locator('.earth-container').first().boundingBox()
    const cx = pane.x + pane.width / 2
    const cy = pane.y + pane.height / 2
    const r = Math.min(pane.width, pane.height) * 0.28
    const offsets = [[0, 0], [0, -r], [0, r], [-r, 0], [r, 0], [-r * 0.7, r * 0.7]]

    // 左键：详情面板（原先只挂在 EarthView 的 v-else 分支里，分屏下点了没反馈）
    let panel = false
    for (const [dx, dy] of offsets) {
      await page.mouse.click(cx + dx, cy + dy)
      await page.waitForTimeout(300)
      if (await page.locator('.info-panel').isVisible()) { panel = true; break }
    }
    expect(panel, '分屏里左键应能看到详情面板').toBe(true)

    // 右键：菜单（原先 preventDefault 之后什么都不弹，等于死路）
    let menu = false
    let menuName = ''
    for (const [dx, dy] of offsets) {
      await page.mouse.click(cx + dx, cy + dy, { button: 'right' })
      await page.waitForTimeout(300)
      if (await page.locator('.context-menu').isVisible()) {
        menu = true
        menuName = (await page.locator('.context-menu .menu-header').innerText()).trim()
        break
      }
    }
    expect(menu, '分屏里右键应弹出上下文菜单').toBe(true)
    expect(menuName.length).toBeGreaterThan(0)

    await page.locator('.ctrl-btn').filter({ hasText: '返回' }).evaluate((el) => el.click())
    await expect(page.locator('.earth-container')).toHaveCount(1)
    // 两块分屏画布都不是 primary，不会清全局交互状态 —— CompareView 自己清
    await expect(page.locator('.info-panel')).toHaveCount(0)
    await expect(page.locator('.context-menu')).toHaveCount(0)
  })

  test('退出分屏后主地球仍可拾取', async ({ page }) => {
    test.slow()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('.tool-btn[aria-label="分屏对比"]').evaluate((el) => el.click())
    await expect(page.locator('.earth-container')).toHaveCount(2)

    await page.locator('.ctrl-btn').filter({ hasText: '返回' }).evaluate((el) => el.click())
    await expect(page.locator('.earth-container')).toHaveCount(1)
    await expect
      .poll(() => page.evaluate(() => document.querySelector('.earth-canvas')?.__vueParentComponent?.exposed?.getRenderer()?.info?.render?.frame ?? 0), { timeout: 60_000 })
      .toBeGreaterThan(0)

    // 正向锚点：回到主视图后点得到国家（拾取走的是本实例的 earth）
    const box = await page.locator('.earth-canvas').boundingBox()
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    const r = Math.min(box.width, box.height) * 0.3
    let hit = false
    for (const [dx, dy] of [[0, 0], [0, -r], [0, r], [-r, 0], [r, 0]]) {
      await page.mouse.click(cx + dx, cy + dy)
      await page.waitForTimeout(300)
      if (await page.locator('.info-panel').isVisible()) { hit = true; break }
    }
    expect(hit, '退出分屏后主地球应可拾取').toBe(true)
  })
})
