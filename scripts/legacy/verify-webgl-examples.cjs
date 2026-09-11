 
const { chromium } = require('playwright')

const BASE_URL = 'http://localhost:5187'

const SAMPLES = [
  // study-webgl 变换综合（验证 glMatrix.mat4.rotateZ）
  '/examples/webgl/study-webgl/1-base/transform-composite',
  // study-webgl 键盘动态改变视点（验证 initEvent 修复）
  '/examples/webgl/study-webgl/3-三维世界与光照/3-键盘动态改变视点',
  // study-webgl 穿衣服的正方体（验证 attribOutUV 修复）
  '/examples/webgl/study-webgl/3-三维世界与光照/13-绘制穿衣服的正方体',
  // kaikeba-webgl 颜色与纹理（验证 worldPos 移除 Three.js 依赖）
  '/examples/webgl/kaikeba-webgl/06-颜色与纹理/07-纹理',
  // kaikeba-webgl GLSL ES 语言（验证 worldPos 移除 Three.js 依赖）
  '/examples/webgl/kaikeba-webgl/08-glsl-es语言/04-变量',
  // study-webgl 使用时钟框架（验证 scale/rotate 旧 API 修复）
  '/examples/webgl/study-webgl/1-base/15-使用框架实现时钟',
]

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  let failed = false

  for (const route of SAMPLES) {
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
    })

    const url = `${BASE_URL}${route}`
    console.log(`Testing: ${url}`)
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)

    const canvas = await page.$('canvas')
    if (!canvas) {
      errors.push('canvas not found')
    }

    if (errors.length) {
      failed = true
      console.error(`FAILED: ${route}`)
      errors.forEach((e) => console.error(`  - ${e}`))
    } else {
      console.log(`PASSED: ${route}`)
    }

    await page.close()
  }

  await browser.close()
  process.exit(failed ? 1 : 0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
