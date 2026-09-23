import { test, expect } from '@playwright/test'

/** 只有这条要 import 源码模块拿全量条目；其余走 DOM，dev / preview 都跑 */
const IS_PREVIEW = process.env.E2E_TARGET === 'preview'

/**
 * 「地理 / GIS」分面（techGroups 里的 geo）。
 *
 * 这个库按渲染技术组织，而产品定位是数字地球平台，导致散在 graphics / three-project
 * 里的地理章节没有任何入口可以按领域找到。geo 分面由 source + category 规则自动判定。
 *
 * 关键要守住的是「它不是 Cesium 标签的别名」：如果 geo 只等于两个 cesium 来源之和，
 * 这个分面就纯属重复，不如不加。所以断言它必须真的跨来源。
 */

const geoFacts = `
  (async () => {
    const F = await import('/src/examples/composables/useExampleFilters.ts')
    const R = await import('/src/examples/registry/index.ts')
    await R.loadAllRegistries()
    const all = R.getAllExamples().filter(e => !e.displayHidden)
    const geo = F.techGroups.find(t => t.key === 'geo')
    const cesium = F.techGroups.find(t => t.key === 'cesium')
    const hit = all.filter(geo.match)
    return {
      hasTab: !!geo,
      label: geo && geo.label,
      total: all.length,
      geoCount: hit.length,
      geoSources: [...new Set(hit.map(e => e.source))].sort(),
      outsideCesiumTab: hit.filter(e => !cesium.match(e)).length,
    }
  })()
`

test('geo 分面存在、按领域跨来源，且不是 Cesium 标签的别名', async ({ page }) => {
  test.skip(IS_PREVIEW, '依赖 dev 模式下可按 URL 二次 import 的源码模块')
  test.setTimeout(180_000)
  await page.goto('/examples')
  const f = await page.evaluate(geoFacts)

  expect(f.hasTab, 'techGroups 里应有 key 为 geo 的分面').toBe(true)
  expect(f.label).toContain('地理')
  expect(f.geoCount).toBeGreaterThan(350)
  // 至少覆盖 4 个来源，否则就等于「换个名字再列一遍 Cesium」
  expect(f.geoSources.length).toBeGreaterThanOrEqual(4)
  expect(f.geoSources).toContain('earth-lessons')
  // 必须有一批条目落在 Cesium 标签之外
  expect(f.outsideCesiumTab, 'geo 里应包含 Cesium 标签覆盖不到的地理章节').toBeGreaterThan(10)
})

test('点 geo 标签会过滤结果并写回 URL，且结果确实跨来源', async ({ page }) => {
  await page.goto('/examples')
  await expect(page.locator('.example-card').first()).toBeVisible()

  const tab = page.locator('.tech-tab', { hasText: '地理 / GIS' })
  await expect(tab).toBeVisible()
  const count = Number.parseInt((await tab.locator('.tech-tab-count').innerText()).replace(/\D/g, ''), 10)

  await tab.click()
  await expect.poll(() => new URL(page.url()).searchParams.get('tech')).toBe('geo')
  await expect
    .poll(async () => Number.parseInt((await page.locator('.result-count').innerText()).replace(/\D/g, ''), 10))
    .toBe(count)

  // 「不是 Cesium 别名」这条也要在 preview 下成立。刻意不去数首页卡片的来源分布 ——
  // geo 集合按 registry 顺序排，第一页几乎全是 three-cesium-examples，那样断言会假失败。
  // 标签计数就够：geo 严格大于 Cesium，说明它确实收进了 Cesium 之外的地理章节。
  const cesiumCount = Number.parseInt(
    (await page.locator('.tech-tab', { hasText: 'Cesium' }).locator('.tech-tab-count').innerText()).replace(/\D/g, ''),
    10,
  )
  expect(count, 'geo 应当严格多于 Cesium，否则这个分面没有新增信息').toBeGreaterThan(cesiumCount)
})

/**
 * 分面派生词进检索（techSearchTerms）。
 *
 * 修的是「地理内容不可检索」：此前搜「地图」6 条、「GIS」1 条。
 * 同时守住反面 —— 注入必须是**窄口径**：「地球」不在注入词里，
 * 它仍应只命中元数据里真写了「地球」的那 11 条（smoke 里也有这条断言）。
 */
test('搜「地图」能命中地理条目，而未被注入的词不受影响', async ({ page }) => {
  const countFor = async (kw: string) => {
    await page.goto(`/examples?search=${encodeURIComponent(kw)}`)
    // 必须先等卡片出现：注册表落地前 filteredExamples 是空数组，
    // .result-count 会先渲染成「共 0 个示例」，直接读会拿到竞态值
    await expect(page.locator('.example-card').first()).toBeVisible()
    return Number.parseInt((await page.locator('.result-count').innerText()).replace(/\D/g, ''), 10)
  }

  expect(await countFor('地图')).toBeGreaterThanOrEqual(380)
  expect(await countFor('GIS')).toBeGreaterThanOrEqual(380)
  expect(await countFor('地球')).toBe(11)
})
