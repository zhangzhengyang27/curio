import { test, expect } from '@playwright/test'

/** 交叉比对来源清单要 import 源码模块；页面上那行快照说明两种模式都验 */
const IS_PREVIEW = process.env.E2E_TARGET === 'preview'

/**
 * 来源溯源登记。
 *
 * 示例中心是只读归档，而归档品唯一能自证可信度的信息就是「封存的是哪一版」。
 * 此前 1417 条里没有任何时间/版本字段，也没有登记过上游出处。
 *
 * 这条用例的作用是**闸门**：接入新来源时如果没在 provenance.ts 里登记，它会红。
 * 允许 upstream 为 null（仓库里确实查不到出处的来源有 10 个），
 * 但 null 必须是「查过、没有」，不能是「压根没登记过」。
 */

const facts = `
  (async () => {
    const P = await import('/src/examples/registry/provenance.ts')
    const R = await import('/src/examples/registry/index.ts')
    await R.loadAllRegistries()
    const sources = R.getSources().map(s => s.source)
    return {
      sources,
      registered: Object.keys(P.sourceProvenance),
      summary: P.snapshotSummary(),
      assets: P.snapshotProvenance.assets,
    }
  })()
`

test('每个来源都在 provenance 里登记过，且快照日期可核实', async ({ page }) => {
  test.skip(IS_PREVIEW, '依赖 dev 模式下可按 URL 二次 import 的源码模块')
  test.setTimeout(180_000)
  await page.goto('/examples')
  const f = await page.evaluate(facts)

  const missing = f.sources.filter(s => !f.registered.includes(s))
  expect(missing, `这些来源没有溯源登记：${missing.join(', ')}`).toEqual([])

  // 快照日期必须是真实提交日期格式，且带 commit（可回查）
  expect(f.assets.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  expect(f.assets.capturedCommit).toMatch(/^[0-9a-f]{6,40}$/)
})

test('快照说明会显示在画廊页头，用户能看到这批内容是啥时候封存的', async ({ page }) => {
  await page.goto('/examples')
  const line = page.locator('.content-snapshot')
  await expect(line).toBeVisible()
  await expect(line).toContainText('资源快照')
  await expect(line).toContainText('three')
})
