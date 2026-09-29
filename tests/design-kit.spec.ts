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

  test('CuButton:loading 态禁用并显示 spinner,primary/ghost 样式类正确', async ({ page }) => {
    await page.goto('/design-kit')
    const loadingBtn = page.locator('.cu-btn--loading')
    await expect(loadingBtn).toBeDisabled()
    await expect(loadingBtn.locator('.cu-btn__spinner')).toBeVisible()
    await expect(page.locator('.cu-btn--primary').first()).toBeVisible()
    await expect(page.locator('.cu-btn--ghost').first()).toBeVisible()
  })

  test('状态三件套:空态带标题,错误态可触发 retry,骨架屏可见', async ({ page }) => {
    await page.goto('/design-kit')
    await expect(page.getByTestId('kit-empty').getByText('暂无数据')).toBeVisible()
    await page.getByTestId('kit-error').getByRole('button', { name: '重试' }).click()
    await expect(page.getByTestId('kit-retry-count')).toHaveText('重试次数:1')
    await expect(page.getByTestId('kit-skeleton').locator('.cu-skel__line').first()).toBeVisible()
  })

  test('CuTooltip:悬停出现气泡,支持快捷键标注', async ({ page }) => {
    await page.goto('/design-kit')
    const trigger = page.getByTestId('kit-tip-trigger')
    await trigger.hover()
    await expect(page.getByTestId('kit-tip-bubble')).toBeVisible()
    await expect(page.getByTestId('kit-tip-bubble').getByText('截图')).toBeVisible()
    await expect(page.getByTestId('kit-tip-bubble').locator('.cu-tip__kbd')).toHaveText('S')
  })

  test('PageHeader:渲染标题、描述、计数与 actions 插槽', async ({ page }) => {
    await page.goto('/design-kit')
    const header = page.getByTestId('kit-page-header')
    await expect(header.getByRole('heading', { name: '示例页头' })).toBeVisible()
    await expect(header.getByText('这是页头描述文案')).toBeVisible()
    await expect(header.locator('.cu-num')).toHaveText('27')
    await expect(header.getByRole('button', { name: '页头动作' })).toBeVisible()
  })
})
