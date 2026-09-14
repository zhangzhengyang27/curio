import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'

/**
 * 地图工具箱（/tools）冒烟测试。
 *
 * 验证页面②「地图工具箱」的最小闭环：Cesium 初始化、量距、标绘+导出、书签持久化。
 * Cesium 走预编译 Build 产物（dev 由 vite 服务 node_modules），headless 下可正常渲染。
 *
 * 交互坐标选在视口中部空白区（避开左右面板），保证 pickEllipsoid 命中椭球面。
 */

const CANVAS_CLICK_A = { x: 640, y: 400 }
const CANVAS_CLICK_B = { x: 780, y: 460 }

test.describe('地图工具箱', () => {
  test.beforeEach(async ({ page }) => {
    // 书签存 localStorage，测试间互不污染。
    // ⚠ 不能裸用 addInitScript 清 key：它在每次导航都执行，会把测试中途
    // reload 后刚存的书签也清掉（实测踩过）；sessionStorage 标记保证只清一次
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('__tv-cleaned')) {
        localStorage.removeItem('tv-map-bookmarks')
        sessionStorage.setItem('__tv-cleaned', '1')
      }
    })
  })

  test('页面打开：Cesium 初始化完成，工具面板就绪，无页面错误', async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/tools')
    await expect(page.locator('.panel-left')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('.cesium-viewer canvas').first()).toBeVisible()
    await expect(page.locator('[data-testid="status-coords"]')).toContainText('移动鼠标')
    expect(errors).toEqual([])
  })

  test('量距：两次采点后状态栏给出总距离', async ({ page }) => {
    await page.goto('/tools')
    await page.locator('.panel-left').waitFor()
    await page.locator('[data-tool="distance"]').click()
    await expect(page.locator('[data-testid="status-hint"]')).toContainText('左键')

    await page.mouse.click(CANVAS_CLICK_A.x, CANVAS_CLICK_A.y)
    await page.mouse.click(CANVAS_CLICK_B.x, CANVAS_CLICK_B.y)
    await page.mouse.click(CANVAS_CLICK_B.x, CANVAS_CLICK_B.y, { button: 'right' })

    // 数值必须有效：EllipsoidGeodesic 入参传错时会出现「总距离 NaN m」
    const result = page.locator('[data-testid="status-result"]')
    await expect(result).toContainText('总距离', { timeout: 10_000 })
    await expect(result).toContainText(/(\d+(\.\d+)? (km|m))/)
    await expect(result).not.toContainText('NaN')
    // 产物登记后撤销/清空可用
    await expect(page.locator('[data-testid="clear-btn"]')).toBeEnabled()
  })

  test('量面积：闭合多边形后给出面积且产物登记', async ({ page }) => {
    // 回归：_buildResult 曾缺 area 分支，量面积整条链路静默失效
    await page.goto('/tools')
    await page.locator('.panel-left').waitFor()
    await page.locator('[data-tool="area"]').click()
    await page.mouse.move(700, 450)
    await page.mouse.click(640, 400)
    await page.mouse.click(820, 500)
    await page.mouse.click(700, 580)
    await page.mouse.click(700, 450, { button: 'right' })

    const result = page.locator('[data-testid="status-result"]')
    await expect(result).toContainText('面积', { timeout: 10_000 })
    await expect(result).toContainText(/(\d+(\.\d+)? (km²|m²))/)
    await expect(result).not.toContainText('NaN')
    await expect(page.locator('[data-testid="clear-btn"]')).toContainText('1')
  })

  test('标点并导出 GeoJSON', async ({ page }) => {
    await page.goto('/tools')
    await page.locator('.panel-left').waitFor()
    await page.locator('[data-tool="point"]').click()
    await page.mouse.click(CANVAS_CLICK_A.x, CANVAS_CLICK_A.y)

    await expect(page.locator('[data-testid="status-result"]')).toContainText('标注点')
    await expect(page.locator('[data-testid="clear-btn"]')).toContainText('1')

    const downloadPromise = page.waitForEvent('download')
    await page.locator('[data-testid="export-geojson"]').click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.geojson$/)
  })

  test('标线导出的 GeoJSON 坐标有效（非 null）', async ({ page }) => {
    // 回归：line 分支曾把坐标数组误传给期望单点的 _addRegistry，
    // 每个坐标变成 NaN → JSON 序列化为 null
    await page.goto('/tools')
    await page.locator('.panel-left').waitFor()
    await page.locator('[data-tool="line"]').click()
    await page.mouse.move(700, 450)
    await page.mouse.click(640, 400)
    await page.mouse.click(820, 500)
    await page.mouse.click(820, 500, { button: 'right' })

    const downloadPromise = page.waitForEvent('download')
    await page.locator('[data-testid="export-geojson"]').click()
    const download = await downloadPromise
    const gj = JSON.parse(readFileSync(await download.path(), 'utf8'))
    expect(gj.features).toHaveLength(1)
    expect(gj.features[0].geometry.type).toBe('LineString')
    const coords = gj.features[0].geometry.coordinates
    expect(coords.length).toBe(2)
    for (const [lon, lat] of coords) {
      expect(Number.isFinite(lon)).toBe(true)
      expect(Number.isFinite(lat)).toBe(true)
    }
  })

  test('书签：保存、刷新持久化、删除', async ({ page }) => {
    await page.goto('/tools')
    await page.locator('.panel-right').waitFor()

    await page.locator('[data-testid="bookmark-add"]').click()
    await expect(page.locator('[data-testid="bookmark-list"] .bookmark-item')).toHaveCount(1)

    await page.reload()
    await page.locator('.panel-right').waitFor()
    await expect(page.locator('[data-testid="bookmark-list"] .bookmark-item')).toHaveCount(1)

    await page.locator('[data-testid="bookmark-list"] .bookmark-del').click()
    await expect(page.locator('[data-testid="bookmark-list"]')).toHaveCount(0)
  })
})
