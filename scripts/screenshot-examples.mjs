// 用 Playwright(Chromium) 批量截取示例详情页的 canvas，作为列表封面。
// 用法: NODE_OPTIONS="" node scripts/screenshot-examples.mjs [--concurrency 4]
// 依赖: dev server 已在 http://localhost:5180 运行
import { chromium } from 'playwright'
import { mkdir, writeFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const BASE = process.env.SCREEN_BASE || 'http://localhost:5180'
const OUT_DIR = path.join(ROOT, 'public', 'example-thumbs')

function thumbUrl(source, category, id) {
  const segs = ['example-thumbs', source, ...category.split('/'), id + '.jpg'].map(s =>
    encodeURIComponent(s)
  )
  return '/' + segs.join('/')
}
function absPathFor(source, category, id) {
  const dir = path.join(OUT_DIR, source, ...category.split('/'))
  return path.join(dir, id + '.jpg')
}
function exampleUrl(source, category, id) {
  const segs = ['examples', source, ...category.split('/'), id].map(s =>
    encodeURIComponent(s)
  )
  return BASE + '/' + segs.join('/')
}

const concurrency = Number(process.argv.includes('--concurrency')
  ? process.argv[process.argv.indexOf('--concurrency') + 1]
  : 4)

async function main() {
  const { getAllExamples } = await import(
    path.join(ROOT, 'src/examples/registry/index.js')
  )
  const all = getAllExamples()
  const targets = all
    .filter(e => !e.thumbnail && e.source)
    .map(e => ({ source: e.source, category: e.category, id: e.id }))

  console.log(`目标示例(空 thumbnail): ${targets.length}`)

  const browser = await chromium.launch({
    // 复用系统已安装的 Chrome（沙箱拦截了 Playwright 浏览器下载 CDN，无需再下载）
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: [
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=swiftshader'
    ]
  })
  await mkdir(OUT_DIR, { recursive: true })

  const map = [] // {source,category,id,thumbnail,ok}
  const failures = []
  let done = 0

  // 简单的并发池
  let idx = 0
  async function worker() {
    const page = await browser.newPage({ viewport: { width: 960, height: 640 } })
    for (;;) {
      const i = idx++
      if (i >= targets.length) break
      const t = targets[i]
      const abs = absPathFor(t.source, t.category, t.id)
      const url = thumbUrl(t.source, t.category, t.id)
      if (existsSync(abs) && (await stat(abs)).size > 0) {
        map.push({ ...t, thumbnail: url, ok: true, skipped: true })
        done++
        continue
      }
      try {
        await page.goto(exampleUrl(t.source, t.category, t.id), {
          waitUntil: 'domcontentloaded',
          timeout: 45000
        })
        const canvas = page.locator('canvas').first()
        if (await canvas.count()) {
          await canvas.waitFor({ timeout: 10000 }).catch(() => {})
          await page.waitForTimeout(1500)
          await mkdir(path.dirname(abs), { recursive: true })
          // 用整页截图+裁切，避免动画 canvas 导致的"等待稳定"超时
          const box = await canvas.boundingBox().catch(() => null)
          if (box && box.width > 0 && box.height > 0) {
            await page.screenshot({ path: abs, clip: box })
          } else {
            await page.screenshot({ path: abs })
          }
        } else {
          await page.waitForTimeout(1500)
          await mkdir(path.dirname(abs), { recursive: true })
          await page.screenshot({ path: abs })
        }
        const sz = (await stat(abs)).size
        map.push({ ...t, thumbnail: url, ok: sz > 500, skipped: false })
        if (sz <= 500) failures.push({ ...t, reason: 'too small (' + sz + ')' })
      } catch (err) {
        failures.push({ ...t, reason: String(err && err.message || err).slice(0, 120) })
        map.push({ ...t, thumbnail: url, ok: false, skipped: false })
      }
      done++
      if (done % 25 === 0) console.log(`进度 ${done}/${targets.length} 失败 ${failures.length}`)
    }
    await page.close()
  }

  const workers = []
  for (let i = 0; i < concurrency; i++) workers.push(worker())
  await Promise.all(workers)

  await browser.close()

  await writeFile(
    path.join(__dirname, '_thumb_map.json'),
    JSON.stringify(map, null, 2)
  )

  const ok = map.filter(m => m.ok).length
  console.log(`完成: 成功 ${ok}/${targets.length}, 失败 ${failures.length}`)
  if (failures.length) {
    console.log('失败样例(前20):')
    for (const f of failures.slice(0, 20)) {
      console.log(`  ${f.source}/${f.category}/${f.id} => ${f.reason}`)
    }
  }
  console.log('映射已写入 scripts/_thumb_map.json')
}

main().catch(e => {
  console.error('FATAL', e)
  process.exit(1)
})
