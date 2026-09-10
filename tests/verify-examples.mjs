import { chromium } from 'playwright'
import fs from 'fs'

const baseUrl = 'http://localhost:5183'
const outputDir = '/tmp/example-screenshots'
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

const examples = [
  { id: 'webgl/geometry/webgl_geometry_cube', name: 'webgl_geometry_cube' },
  { id: 'webgl/animation/webgl_animation_walk', name: 'webgl_animation_walk' },
  { id: 'webgpu/tsl/webgpu_tsl_earth', name: 'webgpu_tsl_earth' },
  { id: 'webgpu/multiple/webgpu_multiple_canvas', name: 'webgpu_multiple_canvas' },
  { id: 'css3d/css3d_molecules', name: 'css3d_molecules' },
  { id: 'svg/svg_sandbox', name: 'svg_sandbox' },
  { id: 'webgl/worker/webgl_worker_offscreencanvas', name: 'webgl_worker_offscreencanvas' },
]

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })

const results = []

for (const ex of examples) {
  const page = await context.newPage()
  const url = `${baseUrl}/examples/threejs-official/${ex.id}`
  console.log(`Testing ${ex.name}...`)
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    // Wait for scene to render
    await page.waitForTimeout(3000)

    // Check for error tips
    const errorTip = await page.$('.error-tip')
    const errorText = errorTip ? await errorTip.textContent() : null

    // Screenshot
    const screenshotPath = `${outputDir}/${ex.name}.png`
    await page.screenshot({ path: screenshotPath, fullPage: false })

    results.push({
      name: ex.name,
      url,
      screenshot: screenshotPath,
      error: errorText
    })
  } catch (err) {
    results.push({
      name: ex.name,
      url,
      error: err.message
    })
  } finally {
    await page.close()
  }
}

await browser.close()

console.log('\n=== Results ===')
results.forEach(r => {
  console.log(`${r.name}: ${r.error ? 'ERROR - ' + r.error : 'OK'} | ${r.screenshot || ''}`)
})
