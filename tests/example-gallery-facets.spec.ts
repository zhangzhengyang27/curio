import { test, expect } from '@playwright/test'

/**
 * 示例中心的专题分面 + 排序 / 视图控制 + 已选条件 + 空态。
 *
 * 2026-09-27 裁剪：侧栏只保留「专题分类」一个维度，技术栈 / 数据源两个维度
 * （含 ?tech= / ?src= URL 参数与它们的分面用例）已从界面与状态机中整体移除。
 *
 * 这组用例守住三件事：
 *   ① 专题分面的计数是**分面**的（选中某项后其它项的计数不归零，用户才换得动）；
 *   ② 筛选状态同样可分享（写回 URL，刷新可还原）；
 *   ③ 已选条件可视、可逐个移除、可一键清空。
 */

const parseCount = async (locator: import('@playwright/test').Locator) =>
  Number.parseInt((await locator.innerText()).replace(/\D/g, ''), 10)

/** 注册表是懒加载的，任何计数都必须等卡片先落地，否则读到的是 0 */
async function openGallery(page: import('@playwright/test').Page, query = '') {
  await page.goto(`/examples${query}`)
  await expect(page.locator('.example-card').first()).toBeVisible({ timeout: 30_000 })
}

test.describe('示例中心专题分面', () => {
  test('点击专题分类过滤并写回 URL，结果数与计数一致', async ({ page }) => {
    await openGallery(page)

    const items = page.locator('.category-item')
    await expect(items.first()).toBeVisible()
    // 第 1 项是「全部」，跳过它，取第一个真实子分类
    const target = items.nth(1)
    const label = (await target.locator('.item-label').innerText()).trim()
    const count = await parseCount(target.locator('.item-count'))
    expect(count, `专题「${label}」应有计数`).toBeGreaterThan(0)

    await target.click()

    await expect(page.locator('.category-item.active')).toContainText(label)
    await expect.poll(() => new URL(page.url()).searchParams.get('sub')).not.toBeNull()
    await expect
      .poll(async () => parseCount(page.locator('.result-count')))
      .toBe(count)
  })

  test('?sub= 可从分享链接还原，且换一个专题仍可选（分面计数排除自身）', async ({ page }) => {
    await openGallery(page, '?sub=shader')
    await expect(page.locator('.category-item.active')).toContainText('着色器')
    const total = await parseCount(page.locator('.result-count'))
    expect(total).toBeGreaterThan(0)
    expect(await page.locator('.example-card').count()).toBeLessThanOrEqual(48)

    // 选中「着色器」之后，其它专题的计数不应归零 ——
    // 归零说明分面计数忘了排除自身，用户就换不动了
    const other = page.locator('.category-item', { hasText: '动画 / 粒子' })
    const otherCount = await parseCount(other.locator('.item-count'))
    expect(otherCount, '其它专题的计数应保留').toBeGreaterThan(0)

    await other.click()
    await expect.poll(() => new URL(page.url()).searchParams.get('sub')).toBe('animation')
    await expect
      .poll(async () => parseCount(page.locator('.result-count')))
      .toBe(otherCount)
  })
})

test.describe('示例中心排序与视图', () => {
  test('切换排序会改变首条卡片并写回 URL', async ({ page }) => {
    await openGallery(page)
    const firstDefault = await page.locator('.example-card').first().innerText()

    await page.getByLabel('排序方式').selectOption('title')
    await expect.poll(() => new URL(page.url()).searchParams.get('sort')).toBe('title')
    const firstSorted = await page.locator('.example-card').first().innerText()
    expect(firstSorted, '按标题排序后首条应当换人').not.toBe(firstDefault)
    expect(await page.locator('.example-card').count()).toBe(48)
  })

  test('列表视图：同一批条目换成横向卡片，且可分享', async ({ page }) => {
    await openGallery(page)
    await expect(page.locator('.card-grid.is-grid')).toBeVisible()

    await page.getByLabel('列表视图').click()
    await expect.poll(() => new URL(page.url()).searchParams.get('view')).toBe('list')
    await expect(page.locator('.card-grid.is-list')).toBeVisible()
    await expect(page.locator('.example-card.is-list')).toHaveCount(48)

    // 列表卡片必须是横向排布，否则只是换了个名字的网格
    const horizontal = await page.locator('.example-card').first().evaluate(el => {
      const media = el.querySelector('.card-media')
      const body = el.querySelector('.card-body')
      if (!media || !body) return false
      const m = media.getBoundingClientRect()
      const b = body.getBoundingClientRect()
      return b.left >= m.right - 1 && Math.abs(m.top - b.top) < 4
    })
    expect(horizontal, '列表视图下缩略图与文本应左右并排').toBe(true)
  })

  test('紧凑密度收掉描述，同屏条目变多', async ({ page }) => {
    await openGallery(page)
    await page.getByLabel('紧凑密度').click()
    await expect(page.locator('.card-grid.is-grid.is-dense')).toBeVisible()
    // 紧凑模式下卡片不再渲染描述段
    await expect(page.locator('.example-card').first().locator('.card-desc')).toBeHidden()
    expect(await page.locator('.example-card').count()).toBe(48)
  })

  test('每页条数可切换，且刷新后保持', async ({ page }) => {
    await openGallery(page)
    await page.getByLabel('每页条数').selectOption('24')
    await expect.poll(() => new URL(page.url()).searchParams.get('size')).toBe('24')
    await expect(page.locator('.example-card')).toHaveCount(24)

    // 默认 48 不写进 URL，链接才干净
    await page.goto('/examples')
    await expect(page.locator('.example-card')).toHaveCount(48)
    expect(new URL(page.url()).searchParams.has('size')).toBe(false)
  })
})

test.describe('已选条件与空态', () => {
  test('每个生效条件生成一个 chip，可逐个移除', async ({ page }) => {
    await openGallery(page)
    await expect(page.locator('.af-chip')).toHaveCount(0)

    await page.locator('.category-item', { hasText: '着色器 / GLSL' }).click()
    await page.locator('.nav-search .search-input').fill('shader')
    await expect.poll(() => new URL(page.url()).searchParams.get('search')).toBe('shader')

    const chips = page.locator('.af-chip')
    await expect(chips).toHaveCount(2)
    await expect(chips.first()).toContainText('着色器')

    // 移除专题条件，关键词应当留下
    await chips.first().click()
    await expect.poll(() => new URL(page.url()).searchParams.get('sub')).toBeNull()
    expect(new URL(page.url()).searchParams.get('search')).toBe('shader')
    await expect(page.locator('.af-chip')).toHaveCount(1)
  })

  test('清除全部把两个条件一次归位', async ({ page }) => {
    await openGallery(page, '?sub=shader&search=地球')
    await expect(page.locator('.af-chip')).toHaveCount(2)

    await page.getByRole('button', { name: '清除全部' }).click()

    await expect(page.locator('.af-chip')).toHaveCount(0)
    await expect.poll(() => new URL(page.url()).search).toBe('')
    const total = await parseCount(page.locator('.result-count'))
    expect(total, '清空后应回到全库').toBeGreaterThan(1000)
  })

  test('搜不到时给出可读空态，并给出退出路径', async ({ page }) => {
    await page.goto('/examples?search=zzzznotexist')
    await expect(page.locator('.empty-state')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('.example-card')).toHaveCount(0)
    // 空态必须复述「为什么空」，只写「暂无匹配示例」等于把用户晾着
    await expect(page.locator('.empty-desc')).toContainText('zzzznotexist')

    await page.getByRole('button', { name: '清除全部条件' }).click()
    await expect.poll(() => new URL(page.url()).search).toBe('')
    await expect(page.locator('.example-card').first()).toBeVisible()
  })
})
