import { test, expect } from '@playwright/test'

/**
 * 示例中心的三维度分面 + 视图控制（2026-09-23 改版）。
 *
 * 改版前只有「技术栈」和「专题分类」两个维度，11 个数据源在界面上完全没有入口，
 * 也没有排序 / 视图 / 每页条数，已选条件只能靠侧栏里各高亮一行来表达 ——
 * 滚到网格中段就完全看不出「我现在筛了什么」。
 *
 * 这组用例守住三件事：
 *   ① 三个维度的计数是**分面**的（某个维度的计数排除它自己，否则选中后
 *      同维度其它项会全部变 0，用户就换不动了）；
 *   ② 新增的筛选状态同样可分享（写回 URL，刷新可还原）；
 *   ③ 已选条件可视、可逐个移除、可一键清空。
 */

const parseCount = async (locator: import('@playwright/test').Locator) =>
  Number.parseInt((await locator.innerText()).replace(/\D/g, ''), 10)

/** 注册表是懒加载的，任何计数都必须等卡片先落地，否则读到的是 0 */
async function openGallery(page: import('@playwright/test').Page, query = '') {
  await page.goto(`/examples${query}`)
  await expect(page.locator('.example-card').first()).toBeVisible({ timeout: 30_000 })
}

/** 数据源默认只展开条目最多的 6 个，点非头部来源前先把列表摊开 */
async function expandSources(page: import('@playwright/test').Page) {
  const toggle = page.locator('.source-toggle')
  if (await toggle.isVisible()) await toggle.click()
}

test.describe('示例中心分面筛选', () => {
  test('数据源分面存在，点击后过滤并写回 URL', async ({ page }) => {
    await openGallery(page)

    const items = page.locator('.source-item')
    await expect(items.first()).toBeVisible()
    // 第 1 项是「全部来源」，跳过它，取条目数最多的那个源
    const target = items.nth(1)
    const label = (await target.locator('.item-label').innerText()).trim()
    const count = await parseCount(target.locator('.item-count'))
    expect(count, `数据源「${label}」应有计数`).toBeGreaterThan(0)

    await target.click()

    await expect(page.locator('.source-item.active')).toContainText(label)
    await expect.poll(() => new URL(page.url()).searchParams.get('src')).not.toBeNull()
    await expect
      .poll(async () => parseCount(page.locator('.result-count')))
      .toBe(count)
  })

  test('选中数据源后，技术栈计数随之收窄（分面计数排除自身维度）', async ({ page }) => {
    await openGallery(page)

    const threeBefore = await parseCount(
      page.locator('.tech-tab', { hasText: 'Three.js' }).locator('.tech-tab-count'),
    )
    const allBefore = await parseCount(page.locator('.result-count'))
    expect(threeBefore).toBeGreaterThan(0)

    // 选一个「本身属于 Three.js 栈但只覆盖一部分」的源：
    // 选中后 threejs 计数应变小而不是归零 —— 归零说明同维度计数忘了排除自己
    await expandSources(page)
    await page.locator('.source-item', { hasText: 'Three.js 官方示例' }).click()

    await expect.poll(() => new URL(page.url()).searchParams.get('src')).toBe('threejs-official')
    const threeAfter = await parseCount(
      page.locator('.tech-tab', { hasText: 'Three.js' }).locator('.tech-tab-count'),
    )
    const allAfter = await parseCount(page.locator('.result-count'))

    expect(allAfter, '选中单一来源后结果集应小于全库').toBeLessThan(allBefore)
    expect(threeAfter, '该来源本身属于 Three.js 栈，计数应保留').toBeGreaterThan(0)
    expect(threeAfter, '但应小于全库的 Three.js 计数').toBeLessThan(threeBefore)
    expect(await parseCount(page.locator('.source-item.active .item-count'))).toBe(allAfter)
  })

  test('?src= 可从分享链接还原', async ({ page }) => {
    await openGallery(page, '?src=webgl')
    const count = await parseCount(page.locator('.result-count'))
    expect(count).toBeGreaterThan(0)
    // 被折叠进尾部的来源也要保住选中项的可见性，否则用户以为条件丢了
    await expect(page.locator('.source-item.active')).toContainText('WebGL 基础')
    expect(await page.locator('.example-card').count()).toBeLessThanOrEqual(48)
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

    await page.locator('.tech-tab', { hasText: 'Three.js' }).click()
    await page.locator('.nav-search .search-input').fill('shader')
    await expect.poll(() => new URL(page.url()).searchParams.get('search')).toBe('shader')

    const chips = page.locator('.af-chip')
    await expect(chips).toHaveCount(2)
    await expect(chips.first()).toContainText('Three.js')

    // 移除技术条件，关键词应当留下
    await chips.first().click()
    await expect.poll(() => new URL(page.url()).searchParams.get('tech')).toBeNull()
    expect(new URL(page.url()).searchParams.get('search')).toBe('shader')
    await expect(page.locator('.af-chip')).toHaveCount(1)
  })

  test('清除全部把四个维度一次归位', async ({ page }) => {
    await openGallery(page, '?tech=threejs&src=threejs-official&sub=shader&search=地球')
    await expect(page.locator('.af-chip')).toHaveCount(4)

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
