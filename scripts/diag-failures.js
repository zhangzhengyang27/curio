import { chromium } from 'playwright'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const ids = ['skyAndEnv', 'changeMaterial', 'cameraAnimate', 'renderFrame']

function startServer() {
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
      output += data.toString()
      const clean = stripAnsi(output)
      const m = clean.match(/http:\/\/localhost:(\d+)/)
      if (m && !port) {
        port = parseInt(m[1], 10)
        resolve({ proc, port })
      }
    }

    proc.stdout.on('data', checkReady)
    proc.stderr.on('data', checkReady)

    setTimeout(() => {
      const clean = stripAnsi(output)
      const m = clean.match(/http:\/\/localhost:(\d+)/)
      if (m) {
        resolve({ proc, port: parseInt(m[1], 10) })
      } else {
        reject(new Error('preview server did not start in time'))
      }
    }, 30000)
  })
}

async function main() {
  const { proc, port } = await startServer()
  const browser = await chromium.launch({ headless: true })

  for (const id of ids) {
    const context = await browser.newContext()
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
    })

    try {
      await page.goto(`http://localhost:${port}/examples/three-cesium-examples/threeExamples/basic/${encodeURIComponent(id)}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      })
      await page.waitForTimeout(5000)
      const canvas = await page.$('canvas')
      const visible = await page.isVisible('canvas').catch(() => false)
      const box = await canvas?.boundingBox()
      console.log(`[${id}] canvas exists: ${!!canvas}`)
      console.log(`[${id}] canvas visible: ${visible}`)
      console.log(`[${id}] canvas box:`, box)
      console.log(`[${id}] errors:`, errors)
      const screenshotPath = path.join(root, 'tmp', 'diag-screenshots', `${id}.png`)
      fs.mkdirSync(path.dirname(screenshotPath), { recursive: true })
      await page.screenshot({ path: screenshotPath, fullPage: false })
      console.log(`[${id}] screenshot: ${screenshotPath}`)
    } catch (e) {
      console.log(`[${id}] navigation error: ${e.message}`)
      console.log(`[${id}] errors:`, errors)
    }

    await context.close()
  }

  await browser.close()
  proc.kill()
}

main().catch(console.error)
