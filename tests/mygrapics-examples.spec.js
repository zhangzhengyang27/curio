import { test, expect } from '@playwright/test'

const examples = [
  { category: '3d-basic', id: 'cube' },
  { category: '3d-camera', id: 'cylinder-perspective' },
  { category: 'animate', id: 'lerp-animate' },
  { category: 'animate_webgl', id: 'vertex-move-easing' },
  { category: 'bezier', id: 'cubic' },
  { category: 'canvas', id: 'test' },
  { category: 'noise', id: 'clouds' },
  { category: 'webgl', id: 'hello-world', screenshot: true },
]

for (const { category, id, screenshot } of examples) {
  test(`mygrapics/${category}/${id} renders without error`, async ({ page }) => {
    await page.goto(`/examples/mygrapics/${category}/${id}`)
    await page.waitForSelector('.demo-body', { timeout: 10000 })

    // 不应出现错误提示
    await expect(page.locator('.error-tip')).toHaveCount(0)

    // 等待组件挂载并渲染：容器内至少有一个子元素
    await page.waitForFunction(
      () => {
        const root = document.querySelector('.mygrapics-root')
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

    // 对关键稳定示例进行截图像素级断言
    if (screenshot) {
      await expect(page).toHaveScreenshot(`mygrapics-${category}-${id}.png`, {
        threshold: 0.2,
        maxDiffPixels: 100,
      })
    }
  })
}
