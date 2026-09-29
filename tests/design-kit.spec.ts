import { test, expect } from '@playwright/test'

test.describe('设计套件自检页', () => {
  test('路由可达,渲染玻璃面板与标题', async ({ page }) => {
    await page.goto('/design-kit')
    await expect(page.getByRole('heading', { name: '设计套件' })).toBeVisible()
    await expect(page.locator('.cu-glass').first()).toBeVisible()
  })

  test('双主题下面板均可见(亮色回归防护)', async ({ page }) => {
    for (const theme of ['dark', 'light']) {
      await page.addInitScript(t => localStorage.setItem('tv-theme', t), theme)
      await page.goto('/design-kit')
      await expect(page.locator('.cu-glass').first()).toBeVisible()
    }
  })

  test('首访(无偏好)默认暗色,html 预置脚本生效', async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('tv-theme'))
    await page.goto('/design-kit')
    await expect(page.locator('html.dark')).toHaveCount(1)
  })
})
