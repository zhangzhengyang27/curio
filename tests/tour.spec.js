import { test, expect } from '@playwright/test'

/**
 * 数据巡游冒烟测试（docs/TOUR_ROUTES.md）。
 *
 * 覆盖：入口 → 选线 → 播放器出现与 URL 状态 → 步进与 URL 同步 →
 * 暂停/播放切换 → Esc 退出清理 → 分享链接直达续播。
 *
 * 选择器取自真实组件：
 *   [title="数据巡游"]                        → src/components/Toolbar.vue
 *   [data-testid="tour-picker|tour-bar|…"]    → src/components/TourOverlay.vue
 *
 * 断言聚焦「字幕与 URL 状态机」，不依赖 WebGL 场景内容
 * （headless + swiftshader 下场景内容不稳定，字幕/URL 才是巡游的骨架）。
 */

const TOUR_BTN = '[title="数据巡游"]'
const PICKER = '[data-testid="tour-picker"]'
const BAR = '[data-testid="tour-bar"]'
const CAPTION = '[data-testid="tour-caption"]'

test.describe('数据巡游', () => {
  test('工具栏入口打开路线选择，四条路线可见', async ({ page }) => {
    await page.goto('/')
    await page.locator(TOUR_BTN).click()
    await expect(page.locator(PICKER)).toBeVisible()
    await expect(page.locator('.tour-route-card')).toHaveCount(4)
    // 默认路线置顶（routes 数组顺序）
    await expect(page.locator('.tour-route-card').first()).toContainText('全球数据全览')
  })

  test('选择路线后播放器出现，URL 带 ?tour=，字幕显示第一步', async ({ page }) => {
    await page.goto('/')
    await page.locator(TOUR_BTN).click()
    await page.locator('[data-tour-id="global-overview"]').click()
    await expect(page.locator(BAR)).toBeVisible()
    await expect(page.locator(CAPTION)).toContainText('一颗数据地球')
    await expect(page.locator(CAPTION)).toContainText('1 / 8')
    await expect(page).toHaveURL(/tour=global-overview/)
    await expect(page).toHaveURL(/step=1/)
  })

  test('下一站推进分镜并与 URL step 同步', async ({ page }) => {
    await page.goto('/')
    await page.locator(TOUR_BTN).click()
    await page.locator('[data-tour-id="global-overview"]').click()
    await expect(page.locator(BAR)).toBeVisible()

    // 先暂停再步进：暂停态下手动导航不会重新挂自动前进的定时器，断言才稳定
    await page.locator('[data-testid="tour-toggle"]').click()
    await expect(page.locator('[data-testid="tour-toggle"]')).toContainText('播放')

    await page.locator('[data-testid="tour-next"]').click()
    await expect(page.locator(CAPTION)).toContainText('80 亿人的分布')
    await expect(page.locator(CAPTION)).toContainText('2 / 8')
    await expect(page).toHaveURL(/step=2/)

    await page.locator('[data-testid="tour-prev"]').click()
    await expect(page.locator(CAPTION)).toContainText('一颗数据地球')
    await expect(page).toHaveURL(/step=1/)
  })

  test('播放中可暂停，暂停后可续播', async ({ page }) => {
    await page.goto('/')
    await page.locator(TOUR_BTN).click()
    await page.locator('[data-tour-id="global-overview"]').click()
    await expect(page.locator(BAR)).toBeVisible()

    // 选择路线后自动播放：按钮应显示「暂停」；点击后回到「播放」
    const toggle = page.locator('[data-testid="tour-toggle"]')
    await expect(toggle).toContainText('暂停')
    await toggle.click()
    await expect(toggle).toContainText('播放')
    await toggle.click()
    await expect(toggle).toContainText('暂停')
  })

  test('Esc 退出巡游并清理 URL 状态', async ({ page }) => {
    await page.goto('/')
    await page.locator(TOUR_BTN).click()
    await page.locator('[data-tour-id="global-overview"]').click()
    await expect(page.locator(BAR)).toBeVisible()
    await expect(page).toHaveURL(/tour=global-overview/)

    await page.keyboard.press('Escape')
    await expect(page.locator(BAR)).toBeHidden()
    await expect(page).not.toHaveURL(/tour=/)
  })

  test('分享链接直达：定位到指定步骤但保持暂停', async ({ page }) => {
    await page.goto('/?tour=global-overview&step=3')
    await expect(page.locator(BAR)).toBeVisible()
    await expect(page.locator(CAPTION)).toContainText('3 / 8')
    await expect(page.locator(CAPTION)).toContainText('经济的心跳')
    // 未自动播放：按钮显示「播放」
    await expect(page.locator('[data-testid="tour-toggle"]')).toContainText('播放')
  })
})
