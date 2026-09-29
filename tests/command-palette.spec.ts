import { test, expect } from '@playwright/test'

test.describe('首页命令面板', () => {
  test('Ctrl/Cmd+K 唤起,搜索地点后回车执行并关闭', async ({ page }) => {
    await page.goto('/')
    // 快捷键监听器随 EarthView 挂载注册;不等到挂载就按键会被无声丢失
    await expect(page.locator('.earth-view')).toBeVisible()
    await page.keyboard.press('ControlOrMeta+k')
    const palette = page.getByTestId('command-palette')
    await expect(palette).toBeVisible()
    await palette.locator('input').fill('中国')
    await expect(palette.getByRole('button', { name: /中国/ })).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(palette).toBeHidden()
  })

  test('Escape 关闭;范围仅首页,/examples 上不响应(spec 决策点 2)', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.earth-view')).toBeVisible()
    await page.keyboard.press('ControlOrMeta+k')
    await expect(page.getByTestId('command-palette')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('command-palette')).toBeHidden()

    await page.goto('/examples')
    await page.keyboard.press('ControlOrMeta+k')
    await expect(page.getByTestId('command-palette')).toHaveCount(0)
  })
})
