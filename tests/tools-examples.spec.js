/**
 * /tools 示例列表 + vue-cesium 示例页冒烟。
 *
 * 与 map-tools.spec.js（综合工具箱 /tools/toolbox，27 条）互补：
 * 这里守护「列表→示例」的路由结构与 vue-cesium 组件的最小可用性。
 * 量测用例走 FAB 悬浮球路径（面板按钮走同一 toggleAction，不重复覆盖）。
 */
import { test, expect } from '@playwright/test'

test('示例列表:渲染全部卡片,点击进入对应示例', async ({ page }) => {
  await page.goto('/tools', { waitUntil: 'domcontentloaded' })
  await page.getByTestId('tools-gallery').waitFor({ timeout: 30_000 })

  const cards = page.getByTestId('tools-example-card')
  await expect(cards).toHaveCount(6)

  await page.locator('[data-slug="toolbox"]').click()
  await expect(page).toHaveURL(/\/tools\/toolbox$/)
  // 综合工具箱页挂载完成后才有工具面板(等 Cesium + viewer 就绪)
  await expect(page.locator('[data-testid="place-search"]')).toBeVisible({ timeout: 30_000 })
})

test('量测示例:激活距离量测,两点收线出结果', async ({ page }) => {
  await page.goto('/tools/measurements', { waitUntil: 'domcontentloaded' })
  const distanceBtn = page.locator('button:has(.vc-icons-measure-distance)')
  await distanceBtn.waitFor({ timeout: 30_000 })
  // 按钮出现 ≠ viewer 就绪:留出 Cesium 初始化余量(同 probe 基线)
  await page.waitForTimeout(2500)

  // C13 模式:locator.click 在 Cesium 页会偶发静默挂起,改用 DOM click
  await page.evaluate(() => {
    const btn = document.querySelector('button.vc-measure-distance') ||
      document.querySelector('button .vc-icons-measure-distance')?.closest('button')
    if (btn) btn.click()
  })
  // 激活会触发 activeEvt → 面板状态重渲染,留出稳定窗口再开始采点
  await expect(page.getByTestId('measure-status')).toContainText('量测中', { timeout: 10_000 })
  await page.mouse.click(620, 380)
  await page.mouse.click(800, 480)

  await expect(page.getByTestId('measure-status')).toContainText('量测完成', { timeout: 15_000 })
})

test('导航示例:vc-navigation 控件集合渲染', async ({ page }) => {
  await page.goto('/tools/navigation', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.vc-navigation')).toBeVisible({ timeout: 30_000 })
})

test('未知 slug:提示未找到并提供返回列表入口', async ({ page }) => {
  await page.goto('/tools/no-such-example', { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('example-not-found')).toBeVisible()
  await page.getByTestId('example-not-found').getByRole('link').click()
  await expect(page).toHaveURL(/\/tools$/)
})
