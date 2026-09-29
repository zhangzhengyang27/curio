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

  test('巡游界面打开期间 ⌘K 不唤起命令面板(快捷键让位播放器)', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.earth-view')).toBeVisible()
    await page.locator('[aria-label="数据巡游"]').click()
    await expect(page.locator('[data-testid="tour-picker"]')).toBeVisible()
    await page.keyboard.press('ControlOrMeta+k')
    await expect(page.getByTestId('command-palette')).toHaveCount(0)
  })

  test('焦点移出输入框后 Esc 仍能关闭,dialog 为 aria-modal', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.earth-view')).toBeVisible()
    await page.keyboard.press('ControlOrMeta+k')
    const palette = page.getByTestId('command-palette')
    await expect(palette).toBeVisible()
    await expect(palette.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    // Tab 把焦点移到结果项上,Escape 必须仍能关窗(mask 层兜底,终审 Minor #2)
    await page.keyboard.press('Tab')
    await page.keyboard.press('Escape')
    await expect(palette).toBeHidden()
  })

  test('回车执行的命令真实生效(以分屏对比为探针)', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.earth-view')).toBeVisible()
    await page.keyboard.press('ControlOrMeta+k')
    const palette = page.getByTestId('command-palette')
    await expect(palette).toBeVisible()
    await palette.locator('input').fill('分屏')
    await page.keyboard.press('Enter')
    // run() 真跑了:分屏视图替换首页,双画布出现(回归钉,终审 Minor #8)
    await expect(page.locator('.earth-container')).toHaveCount(2)
  })
})
