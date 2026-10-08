import { test, expect } from '@playwright/test'

/**
 * 示例中心的翻页可用性。
 *
 * 1415 条按 16 一页要 89 页，而页码窗口只显示 ±2 且省略号是 disabled，
 * 想去第 20 页只能反复点下一页。这里守住两件事：每页数量、以及能直接跳页。
 */

test.describe('示例中心分页', () => {
  test('每页渲染 48 条，末位页码与总页数一致', async ({ page }) => {
    // 2026-10-08 四源迁出后全库 78 条，size=48 共 2 页（原 1415 条为 30 页）
    await page.goto('/examples')
    await expect(page.locator('.example-card')).toHaveCount(48)
    await expect(page.locator('.page-btn', { hasText: /^2$/ })).toBeVisible()
  })

  test('末页经 URL 直达且内容同步；跳页控件仅在 >7 页时渲染', async ({ page }) => {
    // 2026-10-08 四源迁出后全库 77 条：48/页共 2 页，页数 ≤ 7 时跳页控件
    // （GalleryPagination v-if="totalPages > 7"）结构性不渲染——锁住这个条件渲染，
    // 防止阈值被误改让小库也露出跳页；「直达末页」改由 URL 深链承担。
    await page.goto('/examples')
    const firstOnPage1 = await page.locator('.example-card').first().innerText()
    await expect(page.locator('.page-jump')).toHaveCount(0)

    await page.goto('/examples?page=2')
    await expect(page).toHaveURL(/page=2/)
    await expect(page.locator('.page-btn.active')).toContainText('2')
    const firstOnPage2 = await page.locator('.example-card').first().innerText()
    expect(firstOnPage2).not.toBe(firstOnPage1)
  })

  test('越界页码经 URL 直达时钳制到末页', async ({ page }) => {
    // 原用例驱动跳页输入框（页数 >7 才渲染，当前 2 页不可达）；
    // 越界钳制语义改由 URL 承担：page=999 钳到末页且内容非空。
    await page.goto('/examples?page=999')
    await expect(page.locator('.page-btn.active')).toContainText('2')
    await expect(page.locator('.example-card').first()).toBeVisible()
  })
})
