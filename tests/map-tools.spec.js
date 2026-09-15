import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'
import { mockTianditu } from './helpers/tiles.js'

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

test.beforeEach(async ({ page }) => {
  await mockTianditu(page)
})

test.describe('地图工具箱', () => {
  // 画布 mouse 事件在 2 worker 并行(CPU 竞争)时会偶发丢失,probe 单跑稳定、
  // CI 本就是 workers=1;本地串行消除该噪音(见 KNOWN_PITFALLS C13)
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    // 书签/标注存 localStorage，测试间互不污染。
    // ⚠ 不能裸用 addInitScript 清 key：它在每次导航都执行，会把测试中途
    // reload 后刚存的书签也清掉（实测踩过）；sessionStorage 标记保证只清一次
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('__tv-cleaned')) {
        localStorage.removeItem('tv-map-bookmarks')
        localStorage.removeItem('tv-map-annotations')
        sessionStorage.setItem('__tv-cleaned', '1')
      }
    })
  })

  test('页面打开：Cesium 初始化完成，工具面板就绪，无页面错误', async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/tools', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.panel-left')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('.cesium-viewer canvas').first()).toBeVisible()
    await expect(page.locator('[data-testid="status-coords"]')).toContainText('移动鼠标')
    expect(errors).toEqual([])
  })

  test('量距：两次采点后状态栏给出总距离', async ({ page }) => {
    await page.goto('/tools', { waitUntil: 'domcontentloaded' })
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
    await page.goto('/tools', { waitUntil: 'domcontentloaded' })
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
    await page.goto('/tools', { waitUntil: 'domcontentloaded' })
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
    await page.goto('/tools', { waitUntil: 'domcontentloaded' })
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
    await page.goto('/tools', { waitUntil: 'domcontentloaded' })
    await page.locator('.panel-right').waitFor()

    await page.locator('[data-testid="bookmark-add"]').click()
    await expect(page.locator('[data-testid="bookmark-list"] .bookmark-item')).toHaveCount(1)

    await page.reload()
    await page.locator('.panel-right').waitFor()
    await expect(page.locator('[data-testid="bookmark-list"] .bookmark-item')).toHaveCount(1)

    await page.locator('[data-testid="bookmark-list"] .bookmark-del[title="删除"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="bookmark-list"]')).toHaveCount(0)
  })

  test('工具结束后与 Esc 取消后,按钮高亮同步消除(回归:高亮与控制器状态脱钩)', async ({ page }) => {
    await page.goto('/tools', { waitUntil: 'domcontentloaded' })
    await page.locator('.panel-left').waitFor()
    const distanceBtn = page.locator('[data-tool="distance"]')

    // 量距采两点结束后,工具已退出 → 按钮不得仍高亮
    await distanceBtn.click()
    await expect(distanceBtn).toHaveClass(/active/)
    await page.mouse.move(700, 450)
    await page.mouse.click(640, 400)
    await page.mouse.click(780, 460)
    await page.mouse.dblclick(780, 460)
    await expect(page.locator('[data-testid="status-result"]')).toContainText('总距离', { timeout: 10_000 })
    await expect(distanceBtn).not.toHaveClass(/active/)

    // Esc 取消同样要消除高亮
    await distanceBtn.click()
    await expect(distanceBtn).toHaveClass(/active/)
    await page.keyboard.press('Escape')
    await expect(distanceBtn).not.toHaveClass(/active/)
  })

  test('debug HUD 反映真实相机状态(回归:曾在 1.142 上静默失效恒显 0)', async ({ page }) => {
    await page.goto('/tools?debug=1', { waitUntil: 'domcontentloaded' })
    await page.locator('.panel-left').waitFor({ timeout: 30_000 })
    const hud = page.locator('[data-testid="debug-hud"]')
    await expect(hud).toBeVisible()
    // HUD 定时器 500ms 一刷:真实相机在初始视角 35 万米,不得恒显 0
    await expect
      .poll(async () => hud.textContent(), { timeout: 5_000 })
      .toMatch(/相机高度 [1-9]\d*/m)
  })

  test('标绘持久化：刷新后标注恢复(M3)', async ({ page }) => {
    await page.goto('/tools', { waitUntil: 'domcontentloaded' })
    await page.locator('.panel-left').waitFor()

    // 标一个点 + 一条线
    await page.locator('[data-tool="point"]').evaluate((el) => el.click())
    await page.mouse.click(640, 400)
    await expect(page.locator('[data-testid="clear-btn"]')).toContainText('1')
    await page.locator('[data-tool="line"]').evaluate((el) => el.click())
    await page.mouse.move(700, 450)
    await page.mouse.click(700, 430)
    await page.mouse.click(800, 500)
    await page.mouse.dblclick(800, 500)
    await expect(page.locator('[data-testid="clear-btn"]')).toContainText('2')

    // 刷新:标注恢复
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator('.panel-left').waitFor({ timeout: 30_000 })
    await expect(page.locator('[data-testid="clear-btn"]')).toContainText('2')
    // 清空后刷新不再恢复
    await page.locator('[data-testid="clear-btn"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="clear-btn"]')).toContainText('0')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator('.panel-left').waitFor({ timeout: 30_000 })
    await expect(page.locator('[data-testid="clear-btn"]')).toContainText('0')
  })

  test('GeoJSON 导入：导出→清空→导入,标注与画面恢复(M3)', async ({ page }) => {
    await page.goto('/tools', { waitUntil: 'domcontentloaded' })
    await page.locator('.panel-left').waitFor()

    // 标点 + 标面并导出
    await page.locator('[data-tool="point"]').evaluate((el) => el.click())
    await page.mouse.click(640, 400)
    await page.locator('[data-tool="polygon"]').evaluate((el) => el.click())
    await page.mouse.move(700, 450)
    await page.mouse.click(620, 390)
    await page.mouse.click(810, 470)
    await page.mouse.click(690, 560)
    await page.mouse.dblclick(690, 560)
    await expect(page.locator('[data-testid="clear-btn"]')).toContainText('2')

    const dl = page.waitForEvent('download')
    await page.locator('[data-testid="export-geojson"]').evaluate((el) => el.click())
    const download = await dl
    const geojsonPath = await download.path()

    // 清空后导入同一文件:计数恢复,且 GeoJSON 再导出坐标一致
    await page.locator('[data-testid="clear-btn"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="clear-btn"]')).toContainText('0')
    await page.setInputFiles('[data-testid="import-geojson-input"]', geojsonPath)
    await expect(page.locator('[data-testid="clear-btn"]')).toContainText('2')

    const dl2 = page.waitForEvent('download')
    await page.locator('[data-testid="export-geojson"]').evaluate((el) => el.click())
    const download2 = await dl2
    const fs = await import('node:fs')
    const gj1 = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'))
    const gj2 = JSON.parse(fs.readFileSync(await download2.path(), 'utf8'))
    expect(gj2.features).toHaveLength(2)
    const sortFeat = (gj) =>
      [...gj.features].sort((a, b) =>
        a.geometry.type === b.geometry.type ? 0 : a.geometry.type < b.geometry.type ? -1 : 1
      )
    const f1 = sortFeat(gj1)
    const f2 = sortFeat(gj2)
    for (let i = 0; i < 2; i++) {
      expect(f2[i].geometry.type).toBe(f1[i].geometry.type)
      expect(JSON.stringify(f2[i].geometry.coordinates)).toBe(JSON.stringify(f1[i].geometry.coordinates))
    }
  })

  test('地名搜索:输入回车出候选,点击飞达(M1)', async ({ page }) => {
    await page.goto('/tools?debug=1', { waitUntil: 'domcontentloaded' })
    await page.locator('.panel-left').waitFor({ timeout: 30_000 })

    // 拦截天地图搜索 API,返回固定候选(不依赖外部服务)
    await page.route('**/api.tianditu.gov.cn/search*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          pois: [{ name: '黄鹤楼', lonlat: '114.3054,30.5428', phone: '', address: '' }],
        }),
      })
    })

    await page.locator('[data-testid="place-search"]').fill('黄鹤楼')
    await page.locator('[data-testid="place-search"]').press('Enter')
    await expect(page.locator('[data-testid="place-results"] .place-item').first()).toContainText('黄鹤楼', { timeout: 10_000 })

    const hBefore = await page.evaluate(() =>
      Math.round(window.__tvMapDebug.viewer.camera.positionCartographic.height)
    )
    await page.locator('[data-testid="place-item-0"]').click()
    await page.waitForTimeout(2200) // flyTo 1.6s
    const hAfter = await page.evaluate(() =>
      Math.round(window.__tvMapDebug.viewer.camera.positionCartographic.height)
    )
    expect(Math.abs(hAfter - 80_000)).toBeLessThan(5_000) // 飞达 8 万米视角
    expect(hBefore).not.toBe(hAfter)
  })

  test('地名搜索:天地图无权限时自动落高德兜底并纠偏坐标(M1 三通道)', async ({ page }) => {
    // 高德通道仅在 env 配了 key 时注册(构建期注入);未配时跳过,配 key 的环境可跑
    test.skip(!process.env.VITE_AMAP_KEY, '需 VITE_AMAP_KEY 环境变量(值任意)才能验证高德兜底通道')
    await page.goto('/tools?debug=1', { waitUntil: 'domcontentloaded' })
    await page.locator('.panel-left').waitFor({ timeout: 30_000 })

    // 天地图通道 404(个人认证无搜索权限的现状);高德返回 GCJ-02 坐标
    await page.route('**/api.tianditu.gov.cn/search*', (route) =>
      route.fulfill({ status: 404, contentType: 'text/html', body: '<html>not found</html>' })
    )
    await page.route('**/restapi.amap.com/v3/place/text*', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          status: '1',
          pois: [
            {
              name: '黄鹤楼',
              location: '114.301609,30.542941', // GCJ-02(武汉,偏差约数百米)
              pname: '湖北省',
              cityname: '武汉市',
              adname: '武昌区',
            },
          ],
        }),
      })
    )
    // Nominatim 断供(本机网络不可达),确保高德通道命中
    await page.route('**/nominatim.openstreetmap.org/search*', (route) => route.abort())

    await page.locator('[data-testid="place-search"]').fill('黄鹤楼')
    await page.locator('[data-testid="place-search"]').press('Enter')
    await expect(page.locator('[data-testid="place-results"] .place-item').first()).toContainText('黄鹤楼', { timeout: 10_000 })

    // 点击候选:纠偏后的 WGS-84 坐标应飞达 8 万米视角
    await page.locator('[data-testid="place-item-0"]').click()
    await page.waitForTimeout(2200) // flyTo 1.6s
    const h = await page.evaluate(() =>
      Math.round(window.__tvMapDebug.viewer.camera.positionCartographic.height)
    )
    expect(Math.abs(h - 80_000)).toBeLessThan(5_000)
  })

  test('地名搜索:全部服务不可用时输入框区提示降级(M1)', async ({ page }) => {
    await page.goto('/tools', { waitUntil: 'domcontentloaded' })
    await page.locator('.panel-left').waitFor({ timeout: 30_000 })
    // 三通道都断供才降级
    await page.route('**/api.tianditu.gov.cn/search*', (route) => route.abort())
    await page.route('**/restapi.amap.com/v3/place/text*', (route) => route.abort())
    await page.route('**/nominatim.openstreetmap.org/search*', (route) => route.abort())

    await page.locator('[data-testid="place-search"]').fill('武汉')
    await page.locator('[data-testid="place-search"]').press('Enter')
    await expect(page.locator('[data-testid="place-hint"]')).toContainText('不可用', { timeout: 10_000 })
  })

  test('标绘编辑:选中→改色→拖顶点→单删(M2)', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/tools?debug=1', { waitUntil: 'domcontentloaded' })
    await page.locator('.panel-left').waitFor({ timeout: 30_000 })

    // 标线(2 点)
    await page.locator('[data-tool="line"]').evaluate((el) => el.click())
    await page.mouse.move(700, 450)
    await page.mouse.click(640, 400)
    await page.mouse.click(820, 500)
    await page.mouse.dblclick(820, 500)
    await expect(page.locator('[data-testid="clear-btn"]')).toContainText('1')
    // ⚠ dblclick 后立即点击会被浏览器并入连击链,须等静止(探针实测 bestDist=0 却未选中)
    await page.waitForTimeout(2500)

    // 求线第一顶点的屏幕坐标(视口系),点击选中(几何匹配只认顶点,28px 阈值)
    const mid = await page.evaluate(() => {
      const { viewer, controller } = window.__tvMapDebug
      const entry = controller.registry[0]
      const rect = viewer.canvas.getBoundingClientRect()
      const px = viewer.scene.cartesianToCanvasCoordinates(entry.positions[0])
      return { x: Math.round(px.x + rect.left), y: Math.round(px.y + rect.top) }
    })
    await page.mouse.click(mid.x, mid.y)
    await expect(page.locator('[data-testid="edit-panel"]')).toBeVisible({ timeout: 10_000 })

    // 改色:controller 记录的 style 同步
    await page.locator('[data-testid="edit-color-#e57373"]').click({ force: true })
    const colorCss = await page.evaluate(() => window.__tvMapDebug.controller.selectedEntry.style.colorCss)
    expect(colorCss).toBe('#e57373')

    // 拖顶点:重新求第一顶点屏幕坐标(含视口偏移),按下-移动-抬起后位置应变化
    const v0 = await page.evaluate(() => {
      const { viewer, controller } = window.__tvMapDebug
      const rect = viewer.canvas.getBoundingClientRect()
      const px = viewer.scene.cartesianToCanvasCoordinates(controller.registry[0].positions[0])
      return { x: Math.round(px.x + rect.left), y: Math.round(px.y + rect.top) }
    })
    const before = await page.evaluate(() => JSON.stringify(window.__tvMapDebug.controller.registry[0].coords))
    await page.mouse.move(v0.x, v0.y)
    await page.mouse.down()
    await page.mouse.move(v0.x - 90, v0.y - 70, { steps: 8 })
    await page.mouse.up()
    await page.waitForTimeout(300)
    const after = await page.evaluate(() => JSON.stringify(window.__tvMapDebug.controller.registry[0].coords))
    expect(after).not.toBe(before)

    // 单删:计数归零
    await page.locator('[data-testid="edit-delete"]').click({ force: true })
    await expect(page.locator('[data-testid="clear-btn"]')).toContainText('0')
    await expect(page.locator('[data-testid="edit-panel"]')).toBeHidden()
  })

  test('书签增强:重命名持久化、导出再导入(M4)', async ({ page }) => {
    await page.goto('/tools', { waitUntil: 'domcontentloaded' })
    await page.locator('.panel-right').waitFor({ timeout: 30_000 })

    await page.locator('[data-testid="bookmark-add"]').click({ force: true })
    await expect(page.locator('[data-testid="bookmark-list"] .bookmark-item')).toHaveCount(1)

    // 重命名
    await page.locator('[data-testid="bookmark-rename"]').click({ force: true })
    const renameInput = page.locator('[data-testid^="rename-input-"]')
    await renameInput.fill('武汉老城')
    await renameInput.press('Enter')
    await expect(page.locator('[data-testid="bookmark-list"] .bookmark-goto')).toHaveText('武汉老城')

    // 导出
    const dl = page.waitForEvent('download')
    await page.locator('[data-testid="export-bookmarks"]').evaluate((el) => el.click())
    const d = await dl
    expect(d.suggestedFilename()).toMatch(/terra-bookmarks-.*\.json$/)

    // 删除后导入同一文件恢复
    await page.locator('[data-testid="bookmark-list"] .bookmark-del[title="删除"]').evaluate((el) => el.click())
    await expect(page.locator('[data-testid="bookmark-list"] .bookmark-item')).toHaveCount(0)
    await page.setInputFiles('[data-testid="import-bookmarks-input"]', await d.path())
    await expect(page.locator('[data-testid="bookmark-list"] .bookmark-goto')).toHaveText('武汉老城')

    // 刷新持久化
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator('.panel-right').waitFor({ timeout: 30_000 })
    await expect(page.locator('[data-testid="bookmark-list"] .bookmark-goto')).toHaveText('武汉老城')
  })

  test('量测记录:量距后记录入列,CSV 导出(M5)', async ({ page }) => {
    await page.goto('/tools', { waitUntil: 'domcontentloaded' })
    await page.locator('.panel-left').waitFor({ timeout: 30_000 })

    await page.locator('[data-tool="distance"]').evaluate((el) => el.click())
    await page.mouse.move(700, 450)
    await page.mouse.click(640, 400)
    await page.mouse.click(780, 460)
    await page.mouse.dblclick(780, 460)
    await expect(page.locator('[data-testid="status-result"]')).toContainText('总距离', { timeout: 10_000 })

    await expect(page.locator('[data-testid="measure-records"] .measure-item')).toHaveCount(1)
    await expect(page.locator('[data-testid="measure-records"]')).toContainText(/km|m/)

    const dl = page.waitForEvent('download')
    await page.locator('[data-testid="export-records"]').evaluate((el) => el.click())
    const d = await dl
    const fs = await import('node:fs')
    const buf = fs.readFileSync(await d.path())
    expect(buf[0]).toBe(0xef) // BOM
    const csv = buf.toString('utf8')
    expect(csv).toContain('类型,结果,时间')
    expect(csv).toMatch(/量距,总距离/)
  })
})
