import { test, expect } from '@playwright/test'

const examples = [
  { category: '3d-model', id: 'axis-angle' },
  { category: 'animate_webgl', id: 'lerp' },
  { category: 'covid-vis', id: 'mercator' },
  { category: 'data-graph-css', id: 'areagraph' },
  { category: 'lights', id: 'phong' },
  { category: 'performance-basic', id: 'canvas-circles' },
  { category: 'qcharts', id: 'basic' },
  { category: 'sketch', id: 'index1-sketch' },
]

for (const { category, id } of examples) {
  test(`graphics/${category}/${id} renders without error`, async ({ page }) => {
    await page.goto(`/examples/graphics/${category}/${id}`)
    await page.waitForSelector('.demo-body', { timeout: 10000 })

    // 不应出现错误提示
    await expect(page.locator('.error-tip')).toHaveCount(0)

    // 等待组件挂载并渲染：容器内至少有一个子元素
    await page.waitForFunction(
      () => {
        const root = document.querySelector('.graphics-root')
        return root !== null && root.children.length > 0
      },
      null,
      { timeout: 10000 }
    )

    // 检查控制台没有严重错误
    const errors = []
    page.on('pageerror', err => errors.push(err.message))
    await page.waitForTimeout(500)
    expect(errors).toEqual([])
  })
}
