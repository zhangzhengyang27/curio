import { test, expect } from '@playwright/test'
import { mockTianditu } from './helpers/tiles'

/**
 * 首页地球：GeoJSON 归一化不得污染搜索索引（回归 P0）。
 *
 * 历史缺陷：buildEarthFromData 会把 Polygon 的 coordinates 就地包一层（type 不变），
 * 而 buildSearchIndex 在它之后才跑，于是再包一层 → 质心算成 NaN。
 * 后果是 136/168 条搜索索引经纬度为 NaN：人口/碳排放图层缺 81% 的圆柱，
 * 且搜这些国家会让相机坐标变 NaN、整个 3D 场景消失且不可恢复（只能刷新）。
 *
 * 三条断言都带正向锚点（见 KNOWN_PITFALLS C18）：先确认「数据确实到位」，
 * 再断言「没有脏值」，避免空列表造成的假绿。
 */

/** 从页面里取活的 Pinia store（组件未暴露调试接口，只能走 __vue_app__） */
async function readEarthStore(page) {
  return page.evaluate(() => {
    const app = document.querySelector('#app')?.__vue_app__
    const provides = app?._context?.provides || {}
    const pinia = Object.getOwnPropertySymbols(provides)
      .map((s) => provides[s])
      .find((v) => v && v._s)
    const store = pinia && [...pinia._s.values()].find((s) => s.$id === 'earth')
    if (!store) return { ok: false }
    // NaN 过不了 JSON，序列化后会变 null —— 正好用来判「不是有效数字」
    const index = JSON.parse(JSON.stringify(store.searchIndex || {}))
    return { ok: true, index }
  })
}

/** 统计场景里圆柱散点组的顶点是否含非有限值 */
async function readScatterHealth(page) {
  return page.evaluate(() => {
    const app = document.querySelector('#app')?.__vue_app__
    const provides = app?._context?.provides || {}
    const pinia = Object.getOwnPropertySymbols(provides)
      .map((s) => provides[s])
      .find((v) => v && v._s)
    const store = pinia && [...pinia._s.values()].find((s) => s.$id === 'earth')
    const earth = store && store.earthGroup
    const scene = earth && earth.parent
    if (!scene) return { ok: false, groups: 0, badVerts: 0, radiusNaN: false }
    let groups = 0
    let badVerts = 0
    let radiusNaN = false
    scene.traverse((obj) => {
      if (!/CylinderScatter/.test(obj.name || '')) return
      groups++
      const pos = obj.geometry?.attributes?.position?.array
      if (pos) for (let i = 0; i < pos.length; i++) if (!Number.isFinite(pos[i])) badVerts++
      if (obj.geometry?.boundingSphere && !Number.isFinite(obj.geometry.boundingSphere.radius)) radiusNaN = true
    })
    return { ok: true, groups, badVerts, radiusNaN }
  })
}

/** 画布上「有内容」的像素占比：背景清屏色是 0x0a0a1a */
async function sceneInkRatio(page) {
  const b64 = (await page.screenshot({ type: 'png' })).toString('base64')
  return page.evaluate(async (s) => {
    const bin = atob(s)
    const buf = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
    const bmp = await createImageBitmap(new Blob([buf], { type: 'image/png' }))
    const cv = new OffscreenCanvas(bmp.width, bmp.height)
    const g = cv.getContext('2d')
    g.drawImage(bmp, 0, 0)
    const d = g.getImageData(0, 57, bmp.width, bmp.height - 57).data
    let fg = 0
    let tot = 0
    for (let i = 0; i < d.length; i += 28) {
      tot++
      if (!(d[i] < 30 && d[i + 1] < 30 && d[i + 2] < 46)) fg++
    }
    return fg / tot
  }, b64)
}

/**
 * 等地球真的可用。
 *
 * 判据用「画布上已有内容」而不是 __vueParentComponent 上的帧号：
 * 后者只有 dev 构建才有，本文件在 preview 下也要跑。
 * 单靠 networkidle 不够 —— 首屏少预取 gdp-timeline 之后，它比初始化更早触发。
 */
async function waitGlobeReady(page) {
  await expect.poll(() => sceneInkRatio(page), { timeout: 90_000 }).toBeGreaterThan(0.15)
}

test.beforeEach(async ({ page }) => {
  await mockTianditu(page)
})

test.describe('首页地球 · 搜索索引与相机', () => {
  test.describe.configure({ mode: 'serial' })

  test('搜索索引的经纬度全部有效（不含 NaN）', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await waitGlobeReady(page)

    const res = await readEarthStore(page)
    expect(res.ok).toBe(true)
    // 正向锚点：索引确实建起来了，不是空对象
    expect(Object.keys(res.index).length).toBeGreaterThan(150)

    const bad = Object.entries(res.index).filter(
      ([, v]) => !Number.isFinite(v.lon) || !Number.isFinite(v.lat)
    )
    expect(bad.slice(0, 3)).toEqual([])
    expect(bad.length).toBe(0)
  })

  test('搜索 Polygon 类国家定位后，3D 场景仍在渲染', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await waitGlobeReady(page)

    const before = await sceneInkRatio(page)
    expect(before).toBeGreaterThan(0.15)

    // 阿富汗是 Polygon 类型（历史缺陷里正是这一类算成 NaN）
    await page.locator('.search-wrapper .search-input').fill('阿富汗')
    await expect(page.locator('.suggestion-item').first()).toContainText('阿富汗')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(2500)

    const after = await sceneInkRatio(page)
    expect(after).toBeGreaterThan(0.15)
  })

  test('人口图层的圆柱几何不含非有限顶点', async ({ page }) => {
    const nanLogs = []
    page.on('console', (m) => {
      if (/NaN in lon2xyz/.test(m.text())) nanLogs.push(m.text())
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await waitGlobeReady(page)
    await page.locator('.viz-btn', { hasText: '人口' }).evaluate((el) => el.click())
    await expect(page.locator('.viz-btn', { hasText: '人口' })).toHaveClass(/active/, { timeout: 20_000 })
    await page.waitForTimeout(2000)

    const health = await readScatterHealth(page)
    expect(health.ok).toBe(true)
    // 正向锚点：散点组确实建出来了
    expect(health.groups).toBeGreaterThan(0)
    expect(health.badVerts).toBe(0)
    expect(health.radiusNaN).toBe(false)
    expect(nanLogs.length).toBe(0)
  })
})
