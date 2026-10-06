import { test, expect } from '@playwright/test'

/**
 * 示例中心的翻页可用性。
 *
 * 1415 条按 16 一页要 89 页，而页码窗口只显示 ±2 且省略号是 disabled，
 * 想去第 20 页只能反复点下一页。这里守住两件事：每页数量、以及能直接跳页。
 */

test.describe('示例中心分页', () => {
  test('每页渲染 48 条，末位页码与总页数一致', async ({ page }) => {
    // 2026-10-05 three 侧 6 源迁出后全库 403 条，size=48 共 9 页（原 1415 条为 30 页）
    await page.goto('/examples')
    await expect(page.locator('.example-card')).toHaveCount(48)
    await expect(page.locator('.page-btn', { hasText: /^9$/ })).toBeVisible()
  })

  test('可以直接跳到最后一页，URL 与内容同步', async ({ page }) => {
    await page.goto('/examples')
    const firstOnPage1 = await page.locator('.example-card').first().innerText()

    await page.getByLabel('跳转到指定页码').fill('9')
    await page.locator('.page-jump-btn').click()

    await expect(page).toHaveURL(/page=9/)
    await expect(page.locator('.page-btn.active')).toContainText('9')
    const firstOnPage9 = await page.locator('.example-card').first().innerText()
    expect(firstOnPage9).not.toBe(firstOnPage1)
  })

  test('越界或重复的页码不会触发跳转', async ({ page }) => {
    await page.goto('/examples')
    const input = page.getByLabel('跳转到指定页码')
    const btn = page.locator('.page-jump-btn')

    await input.fill('999')
    await expect(btn).toBeDisabled()

    await input.fill('1')
    await expect(btn, '当前就在第 1 页，跳过去没有意义').toBeDisabled()

    await input.fill('7')
    await expect(btn).toBeEnabled()
  })
})
