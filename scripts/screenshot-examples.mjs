// 用 Playwright(Chromium) 批量截取示例详情页的 canvas，作为列表封面。
// 用法:
//   NODE_OPTIONS="" node scripts/screenshot-examples.mjs [--concurrency 4]
//     —— 全量：仅截「空 thumbnail」的示例（首次批量用）
//   NODE_OPTIONS="" node scripts/screenshot-examples.mjs --only-failed [--concurrency 2]
//     —— 增量：只重截上次 _thumb_map.json 里 ok===false 的项（合并回 map，不丢其它条目）
// 依赖: dev server 已在 http://localhost:5180 运行
import { chromium } from 'playwright'
import { mkdir, writeFile, stat, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const BASE = process.env.SCREEN_BASE || 'http://localhost:5180'
const OUT_DIR = path.join(ROOT, 'public', 'example-thumbs')
const MAP_PATH = path.join(__dirname, '_thumb_map.json')

// ⚠️ 刻意的「不对称」设计，勿改：
//   thumbUrl —— 逐段 encodeURIComponent，写入 registry 的 URL 是编码串（如 .../%E7%82%B9.jpg）。
//   absPathFor —— 直接用原始中文名写磁盘（.../点线.jpg）。
// 二者不对称是正确且必要的：vite dev 下由 vite.config.js 的 serveUnicodePublic 插件
// 按解码后的中文路径读取；production 由静态服务器解码 URL 命中中文名文件。
// 若把 absPathFor 也改成编码名，dev 插件(先解码成中文再查盘)反而对不上 → 破图。
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

const onlyFailed = process.argv.includes('--only-failed')
const overwrite = process.argv.includes('--overwrite')
const concurrency = Number(process.argv.includes('--concurrency')
  ? process.argv[process.argv.indexOf('--concurrency') + 1]
  : 4)

async function main() {
  const { getAllExamples } = await import(
    path.join(ROOT, 'src/examples/registry/index.js')
  )
  const all = getAllExamples()

  let targets
  if (onlyFailed) {
    const prev = JSON.parse(await readFile(MAP_PATH, 'utf8'))
    targets = prev
      .filter(m => m.ok === false)
      .map(({ source, category, id }) => ({ source, category, id }))
    console.log(`--only-failed: 仅重截 ${targets.length} 个失败项`)
  } else if (overwrite) {
    // 覆盖所有 thumbnail 指向 /example-thumbs/ 的示例，不论文件是否已存在。
    targets = all
      .filter(e => e.thumbnail && e.thumbnail.startsWith('/example-thumbs/') && e.source)
      .map(e => ({ source: e.source, category: e.category, id: e.id }))
    console.log(`--overwrite: 重截所有 example-thumbs 示例，共 ${targets.length} 个`)
  } else {
    targets = all
      .filter(e => !e.thumbnail && e.source)
      .map(e => ({ source: e.source, category: e.category, id: e.id }))
    console.log(`目标示例(空 thumbnail): ${targets.length}`)
  }

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
    // CDP 会话：用 Page.captureScreenshot 直接抓当前合成帧，不等待「画面稳定」，
    // 因此对持续 rAF 动画的 canvas（如 graphics/random-shapes-*）也能稳定出图。
    const client = await page.context().newCDPSession(page)

    async function capture(abs, box) {
      let data
      if (box && box.width > 0 && box.height > 0) {
        const r = await client.send('Page.captureScreenshot', {
          clip: { x: box.x, y: box.y, width: box.width, height: box.height, scale: 1 },
          captureBeyondViewport: false,
          fromSurface: true
        })
        data = r.data
      } else {
        const r = await client.send('Page.captureScreenshot', {
          captureBeyondViewport: true,
          fromSurface: true
        })
        data = r.data
      }
      await writeFile(abs, Buffer.from(data, 'base64'))
    }

    for (;;) {
      const i = idx++
      if (i >= targets.length) break
      const t = targets[i]
      const abs = absPathFor(t.source, t.category, t.id)
      const url = thumbUrl(t.source, t.category, t.id)
      if (!overwrite && existsSync(abs) && (await stat(abs)).size > 0) {
        map.push({ ...t, thumbnail: url, ok: true, skipped: true })
        done++
        continue
      }
      try {
        await page.goto(exampleUrl(t.source, t.category, t.id), {
          waitUntil: 'domcontentloaded',
          timeout: 45000
        })
        // 隐藏页面 chrome：只保留示例本身，不要顶部导航栏、面包屑、标题、标签。
        await page.addStyleTag({
          content: `
            .app-nav { display: none !important; }
            .top-bar { display: none !important; }
            .demo-root { top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; }
          `
        })
        await page.waitForTimeout(300)
        const demoBody = page.locator('.demo-body').first()
        let box = null
        if (await demoBody.count()) {
          box = await demoBody.boundingBox().catch(() => null)
        }
        if (!box) {
          const canvas = page.locator('canvas').first()
          if (await canvas.count()) {
            await canvas.waitFor({ timeout: 10000 }).catch(() => {})
            box = await canvas.boundingBox().catch(() => null)
          }
        }
        await page.waitForTimeout(1500)
        await mkdir(path.dirname(abs), { recursive: true })
        await capture(abs, box)
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

  // 写回 map：--only-failed 模式合并回原 map（不丢其它条目）；否则整体覆盖。
  if (onlyFailed) {
    const prev = JSON.parse(await readFile(MAP_PATH, 'utf8'))
    const byKey = new Map(prev.map(m => [m.source + '/' + m.category + '/' + m.id, m]))
    for (const m of map) byKey.set(m.source + '/' + m.category + '/' + m.id, m)
    await writeFile(MAP_PATH, JSON.stringify([...byKey.values()], null, 2))
  } else {
    await writeFile(MAP_PATH, JSON.stringify(map, null, 2))
  }

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
