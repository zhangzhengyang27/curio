import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { spawn } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const registryPath = path.join(root, 'src/examples/registry/threeCesiumExamples.js')
const screenshotDir = path.join(root, 'tmp/verify-screenshots')

function toPascalCase(id) {
  return id
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toUpperCase())
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function loadRegistry() {
  const mod = await import(`file://${registryPath}?t=${Date.now()}`)
  const registry = mod.default
  return registry.examples.filter(
    (ex) => ex.category === 'threeExamples/basic' && ex.runner === 'vue'
  )
}

function startPreviewServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn('pnpm', ['exec', 'vite', 'preview', '--port', '0', '--host'], {
      cwd: root,
      stdio: 'pipe',
    })

    let output = ''
    let port = null

    // eslint-disable-next-line no-control-regex
    const stripAnsi = (str) => str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')

    const checkReady = (data) => {
      const s = data.toString()
      output += s
      console.log('[preview]', s.trim())
      const clean = stripAnsi(output)
      const match = clean.match(/http:\/\/localhost:(\d+)/)
      if (match && !port) {
        port = parseInt(match[1], 10)
        resolve({ proc, port })
      }
    }

    proc.stdout.on('data', checkReady)
    proc.stderr.on('data', checkReady)

    setTimeout(() => {
      const clean = stripAnsi(output)
      const match = clean.match(/http:\/\/localhost:(\d+)/)
      if (match) {
        resolve({ proc, port: parseInt(match[1], 10) })
      } else {
        reject(new Error('preview server did not start in time'))
      }
    }, 30000)

    proc.on('error', reject)
  })
}

async function verifyExample(browser, example, port) {
  const { id } = example
  const url = `http://localhost:${port}/examples/three-cesium-examples/threeExamples/basic/${encodeURIComponent(id)}`
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })

    // 轮询等待 canvas 出现且尺寸非零（资源重的示例在顺序跑时 waitForSelector 可能偶发超时）
    const canvas = await page.waitForFunction(
      () => {
        const c = document.querySelector('canvas')
        if (!c) return null
        const rect = c.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0 ? c : null
      },
      { timeout: 30000, polling: 500 }
    )
    const box = await canvas.asElement().boundingBox()
    if (!box || box.width === 0 || box.height === 0) {
      throw new Error('canvas has zero size')
    }

    // 等待一帧渲染
    await wait(500)

    const screenshotPath = path.join(screenshotDir, `${toPascalCase(id)}Example.png`)
    await page.screenshot({ path: screenshotPath, fullPage: false })

    return { id, status: 'pass', screenshot: screenshotPath }
  } catch (err) {
    const screenshotPath = path.join(screenshotDir, `${toPascalCase(id)}Example-fail.png`)
    try {
      await page.screenshot({ path: screenshotPath, fullPage: false })
    } catch {}
    return { id, status: 'fail', error: err.message, screenshot: screenshotPath }
  } finally {
    await context.close()
  }
}

async function main() {
  fs.mkdirSync(screenshotDir, { recursive: true })

  const examples = await loadRegistry()
  console.log(`[verify] ${examples.length} vue examples to verify`)

  const { proc: server, port } = await startPreviewServer()
  console.log(`[verify] preview server started on http://localhost:${port}`)

  const results = []
  let browser = await chromium.launch({ headless: true })
  let exampleCount = 0

  for (const example of examples) {
    // 每 5 个示例重启一次浏览器，避免 WebGL/GPU 资源累积导致重资源示例挂起
    if (exampleCount > 0 && exampleCount % 5 === 0) {
      await browser.close()
      browser = await chromium.launch({ headless: true })
      console.log('[verify] browser restarted')
    }

    let result = await verifyExample(browser, example, port)

    // 失败时用一个全新浏览器实例重试一次
    if (result.status === 'fail') {
      console.log(`[retry] ${result.id}`)
      await browser.close()
      browser = await chromium.launch({ headless: true })
      result = await verifyExample(browser, example, port)
      if (result.status === 'pass') result.retried = true
    }

    results.push(result)
    exampleCount++
    console.log(`[${result.status}] ${result.id}${result.error ? ' - ' + result.error : ''}`)
  }

  await browser.close()
  server.kill('SIGTERM')

  const passed = results.filter((r) => r.status === 'pass').length
  console.log(`\n[done] ${passed}/${results.length} passed`)

  if (passed < results.length) {
    const failed = results.filter((r) => r.status === 'fail').map((r) => r.id)
    console.log('[failed]', failed.join(', '))
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
