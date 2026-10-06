import { test, expect } from '@playwright/test'

/** dev 下才能按 URL 二次 import 源码模块；preview 是打包产物，没有 /src/ 这条路径。
 *  依赖数据层的两条只在 dev 跑，能走 DOM 的（下面那条 XR 纯度）两种模式都跑。 */
const IS_PREVIEW = process.env.E2E_TARGET === 'preview'

/**
 * 示例中心子分类（subCategoryDefinitions）的三条闭合不变量。
 *
 * 为什么单独成一个 spec：分类是用「对 category 字符串做松散正则」实现的，
 * 这类实现不会报错，只会静默误分。历史上出过两件事：
 *   ① /(xr|vr|ar|webxr)/i 无词边界，particle / parallax / clearcoat 全部落进
 *      「XR / VR / AR」，116 条里 87 条是误分；
 *   ② 16 条正则合起来漏掉 125 条（threeExamples/application 61 条整块不可达），
 *      这些条目在任何子分类 tab 下都筛不到。
 * 两者都是「数一眼侧栏」看不出来的，所以断言打在不变量上而不是打在某个具体条数上。
 *
 * 不变量：
 *   I1 无孤儿 —— 每条示例至少命中 1 个子分类（有兜底桶，永久成立）
 *   I2 XR 桶整词命中 —— 落进 xr-vr 的条目，category 的路径段必须真的是 xr/vr/ar/webxr
 *   I3 计数闭合 —— 侧栏各桶之和 - 重叠 = 总数（即并集覆盖全部）
 */

const SUBS_AND_DATA = `
  (async () => {
    const F = await import('/src/examples/composables/useExampleFilters.ts')
    const R = await import('/src/examples/registry/index.ts')
    await R.loadAllRegistries()
    const all = R.getAllExamples().filter(e => !e.displayHidden)
    const subs = F.subCategoryDefinitions.filter(s => s.key !== 'all')
    const hits = (ex) => subs.filter(s => { try { return !!s.match(ex) } catch { return false } }).map(s => s.key)
    return {
      total: all.length,
      orphans: all.filter(ex => hits(ex).length === 0)
        .map(ex => ({ source: ex.source, category: ex.category, title: ex.title })),
      xr: all.filter(ex => hits(ex).includes('xr-vr')).map(ex => ex.category),
      sumCounts: subs.reduce((a, s) => a + all.filter(ex => hits(ex).includes(s.key)).length, 0),
      union: all.filter(ex => hits(ex).length > 0).length,
      emptyBuckets: subs.filter(s => !all.some(ex => hits(ex).includes(s.key))).map(s => s.key),
    }
  })()
`

test.beforeEach(async ({ page }) => {
  test.setTimeout(180_000)
  await page.goto('/examples')
})

test('I1 没有任何示例落在全部子分类之外（兜底桶必须存在）', async ({ page }) => {
  test.skip(IS_PREVIEW, '依赖 dev 模式下可按 URL 二次 import 的源码模块')
  const r = await page.evaluate(SUBS_AND_DATA)
  expect(r.orphans, `有 ${r.orphans.length} 条示例任何子分类都筛不到`).toEqual([])
})

/**
 * 走 DOM 的 XR 纯度断言 —— dev / preview 都跑。
 *
 * 卡片本身就是 `<a class="example-card" href="/examples/{source}/{category}/{id}">`，
 * category 原样在 href 里，所以不 import 源码模块也能验「这个桶到底装了什么」。
 * 旧实现用 /(xr|vr|ar|webxr)/i 匹配整串 category，particle / parallax / clearcoat
 * 全被吞进来（116 条里 87 条只因含 "ar" 三个字母），这条就是拦这个。
 */
/** XR / VR / AR 子分类已随 three 侧 6 源迁出（2026-10-05）删除：剩余 403 条中无 xr/vr/ar
 *  分类内容，桶为空违反 I3；未来若接入含 XR 内容的新来源，随桶定义一起恢复本用例。
 */
test('I3 子分类并集覆盖全部条目，且不存在空桶', async ({ page }) => {
  test.skip(IS_PREVIEW, '依赖 dev 模式下可按 URL 二次 import 的源码模块')
  const r = await page.evaluate(SUBS_AND_DATA)
  expect(r.union).toBe(r.total)
  expect(r.emptyBuckets, `这些子分类当前 0 条，不该出现在侧栏定义里`).toEqual([])
  // 重叠是允许的（一条示例可以同时是「着色器」和「粒子」），但要能被解释：
  // 只允许小幅重叠，超过 1/4 说明分桶规则本身在互相吞。
  expect(r.sumCounts - r.total).toBeLessThan(r.total / 4)
})
