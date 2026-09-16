/**
 * /tools 示例列表 + 示例页冒烟。
 *
 * 与 map-tools.spec.js（综合工具箱 /tools/toolbox，27 条）互补：
 * 这里只守护「列表→示例」的路由结构。vue-cesium 的量测/绘制/分析组件
 * 在本项目环境点击链路静默失效（dev/preview 双形态复现），当前示例
 * 仅保留综合工具箱与导航控件，详见 docs/CHANGELOG.md 2026-09-16 条。
 */
import { test, expect } from '@playwright/test'

test('示例列表:渲染全部卡片,点击进入对应示例', async ({ page }) => {
  await page.goto('/tools', { waitUntil: 'domcontentloaded' })
  await page.getByTestId('tools-gallery').waitFor({ timeout: 30_000 })

  const cards = page.getByTestId('tools-example-card')
  await expect(cards).toHaveCount(2)

  await page.locator('[data-slug="toolbox"]').click()
  await expect(page).toHaveURL(/\/tools\/toolbox$/)
  // 综合工具箱页挂载完成后才有工具面板(等 Cesium + viewer 就绪)
  await expect(page.locator('[data-testid="place-search"]')).toBeVisible({ timeout: 30_000 })
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
