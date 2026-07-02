import { test, expect } from '@playwright/test'

const examples = [
  { category: 'base', id: '1-Home' },
  { category: 'animation', id: '1-Animation' },
  { category: 'controls', id: '1-OrbitControlsAdvanced' },
  { category: 'light', id: '1-GsapAnimation' },
  { category: 'material', id: '1-MatcapMaterial' },
  { category: 'performance', id: '1-InstancedMesh' },
  { category: 'physics', id: '1-CannonWithFloor' },
  { category: 'postprocessing', id: '1-EffectComposer' },
  { category: 'texture', id: '1-TextureTransform' },
  { category: 'webgl', id: '1-BasicTriangle' },
  { category: 'examples', id: '1-HomeSceneEditor' }
]

for (const { category, id } of examples) {
  test(`three-project/${category}/${id} renders without error`, async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto(`/examples/three-project/${category}/${id}`)

    await page.waitForSelector('.page-container', { timeout: 15000 })

    await page.waitForFunction(
      () => document.querySelector('canvas') !== null,
      null,
      { timeout: 15000 }
    )

    await page.waitForTimeout(1000)

    expect(errors).toEqual([])
    await expect(page.locator('.back-link')).toHaveCount(1)
  })
}
