// 用 Playwright(Chromium) 批量截取示例详情页的 canvas，作为列表封面。
// 用法:
//   NODE_OPTIONS="" node scripts/screenshot-examples.mjs [--concurrency 4]
//     —— 全量：仅截「空 thumbnail」的示例（首次批量用）
//   NODE_OPTIONS="" node scripts/screenshot-examples.mjs --only-blank [--concurrency 4]
//     —— 修复：只重截「封面与其它条目字节完全相同」的项（必然是截图失败的占位图）
//   NODE_OPTIONS="" node scripts/screenshot-examples.mjs --only-failed [--concurrency 2]
//     —— 增量：只重截上次 _thumb_map.json 里 ok===false 的项（合并回 map，不丢其它条目）
//   --overwrite  忽略「文件已存在即跳过」，重截全部 example-thumbs
//   --dry-run    只列出目标，不启动浏览器、不写文件
//   --limit N    只处理前 N 个（小样验证用）
//   --filter S   只处理 key（source/category/id）含子串 S 的目标（定点重截 / 小样验证用）
// 依赖: dev server 已在 SCREEN_BASE 运行（默认 http://localhost:5180）
//
// ⚠ 六个曾经导致「整批封面空白却全绿」的坑，勿改回去：
//   1. 就绪判据：不能用固定 waitForTimeout。重资产示例（Cesium 瓦片、大模型）在 1.5s 时
//      连 canvas 都还没创建。现在等 canvas 出现 + networkidle + 轮询画面内容。
//      也不能用 canvas.width 属性判据 —— Cesium expand 示例停在默认 300×150 也会通过。
//   2. 成功判据：不能用文件字节数。纯白 960×640 的 JPEG 也有 ~3.1KB，会被误判为成功。
//      现在用「全画幅方差 + 非主色占比」（纯色图两项都是 0）。见 hasContent。
//   3. 探针区域：必须覆盖整幅。只探左上角一小块会漏掉画在正中的内容
//      （实测 kaikeba「4-一个点」全画幅方差 117，左上角 320×240 却是 0）。
//   4. registry 必须用异步版 getAllExamplesAsync()：同步版在按 source 懒加载的
//      registry 上恒返回 []，脚本会静默「什么都没做」。
//   5. 构图修正只能用 transform 缩放，不能改 canvas 的 width/height —— 改布局尺寸会
//      触发「只绘制一次」的 demo 重分配缓冲区后不再重绘，画面整幅变全黑。
//   6. 交互驱动的示例要「补拍」：一批绘图 demo 初始帧本就是空的，内容只在 canvas 的
//      click / mousemove 里产生（kaikeba 的「绘制星空」stars 初始为 []；「鼠标绘制线条」
//      初始只有正中一个点）。方差判据会把它们误判成白屏。现在判为空白时先模拟
//      点击+拖拽再重测。只在空白时补拍，避免扰动本来正常的画面。
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
// 二者不对称是正确且必要的：vite dev 下由 vite.config.ts 的 serveUnicodePublic 插件
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
const onlyBlank = process.argv.includes('--only-blank')
const dryRun = process.argv.includes('--dry-run')
const limit = process.argv.includes('--limit')
  ? Number(process.argv[process.argv.indexOf('--limit') + 1])
  : 0
// --filter <子串>：只处理 key（source/category/id）含该子串的目标。小样验证 / 定点重截用。
const filter = process.argv.includes('--filter')
  ? process.argv[process.argv.indexOf('--filter') + 1]
  : ''
const concurrency = Number(process.argv.includes('--concurrency')
  ? process.argv[process.argv.indexOf('--concurrency') + 1]
  : 4)

// 「画面是空的」判据。两个指标取「或」，任一超阈值即认为有内容：
//   variance —— 全画幅亮度方差。纯色图（白/黑/浅蓝天空）恒为 0。
//   nonModal —— 非主色像素占比。纯色图恒为 0；黑底 + 一个白点约 0.4%。
// ⚠ 历史 bug：成功判据曾是「文件字节数 > 500」，而纯白 960×640 的 JPEG 就有 ~3.1KB，
//   于是所有空白截图都被记为 ok:true，_thumb_map.json 里 509 条全绿、永不重试。
// ⚠ 只用 variance 会漏掉「暗且稀疏」的画面（暗色小图形方差可能低于阈值），
//   只用 nonModal 又会漏掉「同色系渐变」。两者取或更稳。
const BLANK_VARIANCE = 5
const BLANK_NONMODAL = 0.0001

/** 画面是否有内容（非纯色） */
function hasContent(variance, nonModal) {
  return variance > BLANK_VARIANCE || nonModal >= BLANK_NONMODAL
}

/** 找出「与其它条目字节完全相同」的封面 —— 这些必然是无效的占位图 */
async function findBlankTargets() {
  const { createHash } = await import('node:crypto')
  const { readFileSync, readdirSync } = await import('node:fs')
  const groups = new Map()
  const walk = dir => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith('.jpg')) {
        const h = createHash('md5').update(readFileSync(p)).digest('hex')
        if (!groups.has(h)) groups.set(h, [])
        groups.get(h).push(p)
      }
    }
  }
  if (existsSync(OUT_DIR)) walk(OUT_DIR)
  const dupFiles = new Set()
  for (const files of groups.values()) if (files.length > 1) files.forEach(f => dupFiles.add(f))
  return dupFiles
}

async function main() {
  // ⚠ registry 已改为按 source 懒加载：同步的 getAllExamples() 在未加载时返回 []，
  //   会让 target 恒为空、脚本静默「什么都没做」（verify-thumbnails.mjs 里同样警告过）。
  //   必须用异步版本触发加载。
  const { getAllExamplesAsync } = await import(
    path.join(ROOT, 'src/examples/registry/index.ts')
  )
  const all = await getAllExamplesAsync()

  let targets
  if (onlyBlank) {
    // 只重截「封面与其它条目字节完全相同」的项 —— 这些必然是截图失败留下的占位图。
    // 判据来自调研（docs/DEDUP_RESEARCH.md §6）：34 组 / 120 条，零假阳性。
    const dupFiles = await findBlankTargets()
    targets = all
      .filter(e => e.thumbnail && e.thumbnail.startsWith('/example-thumbs/') && e.source)
      .filter(e => dupFiles.has(absPathFor(e.source, e.category, e.id)))
      .map(e => ({ source: e.source, category: e.category, id: e.id }))
    console.log(`--only-blank: 命中 ${dupFiles.size} 个重复封面文件，待重截 ${targets.length} 个`)
  } else if (onlyFailed) {
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

  if (dryRun) {
    console.log('[dry-run] 仅列出目标，不启动浏览器、不写任何文件。')
    for (const t of targets) console.log(`  ${t.source}/${t.category}/${t.id}`)
    console.log(`共 ${targets.length} 个`)
    return
  }
  if (filter) {
    const before = targets.length
    targets = targets.filter(t => `${t.source}/${t.category}/${t.id}`.includes(filter))
    console.log(`[--filter ${filter}] ${before} → ${targets.length} 个`)
  }
  if (limit > 0 && targets.length > limit) {
    console.log(`[--limit ${limit}] 只处理前 ${limit} 个（用于小样验证）`)
    targets = targets.slice(0, limit)
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
        // 裁成卡片实际使用的 16:10（ExampleCard 的 .card-media 就是 aspect-ratio 16/10
        // + object-fit:cover）。截图时就裁好，卡片端就不会再发生二次裁切、丢内容。
        const ratio = 16 / 10
        let w = box.width
        let h = w / ratio
        if (h > box.height) {
          h = box.height
          w = h * ratio
        }
        const clip = {
          x: box.x + (box.width - w) / 2,
          y: box.y + (box.height - h) / 2,
          width: w,
          height: h,
          scale: 1
        }
        const r = await client.send('Page.captureScreenshot', {
          clip,
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

    // 抓 CDP 合成帧并算「画面是否有内容」。
    // ⚠ 不能用页内 drawImage(canvas) 读 WebGL 画布：示例多为 preserveDrawingBuffer:false，
    //   读出来恒为全 0（实测），会把有画面的示例误判成空白。
    //   必须抓合成帧（fromSurface），再在页内解码成位图统计。
    // 判据是「有内容」而不是「亮」：黑底 + 一个白点也是有效画面（kaikeba 的「4-一个点」实测
    // 全画幅方差 117、非主色占比 0.4%），纯白/纯黑/纯色的方差与非主色占比都是 0。
    async function shotContent(clip) {
      const r = await client.send('Page.captureScreenshot', {
        clip: clip && clip.width > 0 && clip.height > 0 ? { ...clip, scale: 1 } : undefined,
        captureBeyondViewport: false,
        fromSurface: true
      })
      return page.evaluate(async b64 => {
        const img = new Image()
        img.src = 'data:image/png;base64,' + b64
        await img.decode()
        const c = document.createElement('canvas')
        c.width = img.width
        c.height = img.height
        const ctx = c.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const d = ctx.getImageData(0, 0, c.width, c.height).data
        let s = 0
        let s2 = 0
        let n = 0
        const bins = new Map()
        for (let i = 0; i < d.length; i += 4) {
          const R = d[i]
          const G = d[i + 1]
          const B = d[i + 2]
          const v = (R + G + B) / 3
          s += v
          s2 += v * v
          n++
          // 每通道 5 bit 量化：纯色图只剩 1 个桶，有画面则有 ≥2 个
          const k = (R >> 3) * 1024 + (G >> 3) * 32 + (B >> 3)
          bins.set(k, (bins.get(k) || 0) + 1)
        }
        const mean = s / n
        let maxCount = 0
        for (const v of bins.values()) if (v > maxCount) maxCount = v
        return {
          mean,
          variance: s2 / n - mean * mean,
          distinctColors: bins.size,
          nonModal: 1 - maxCount / n
        }
      }, r.data)
    }

    for (;;) {
      const i = idx++
      if (i >= targets.length) break
      const t = targets[i]
      const abs = absPathFor(t.source, t.category, t.id)
      const url = thumbUrl(t.source, t.category, t.id)
      // ⚠ --only-blank / --only-failed / --overwrite 必须绕过「已存在即跳过」，
      //   否则要修的那些空白文件因为「存在且非空」会被永久跳过（历史 bug 的一部分）。
      // ⚠ 实测踩过：--only-failed 漏了这层绕过时，21 个待重截项全被 skipped，
      //   还被标成 ok:true 且 variance 被抹掉 → 映射表**假绿**，失败项凭空消失。
      if (!overwrite && !onlyBlank && !onlyFailed && existsSync(abs) && (await stat(abs)).size > 0) {
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
        // ⚠ .demo-float-meta 才是当前的面包屑/标题条（且被 Teleport 到 body，
        //   不是 .demo-root 的子节点，所以必须按类名全局隐藏）。
        //   .app-nav / .top-bar 是旧外壳的类名，已不存在，保留仅为向后兼容。
        await page.addStyleTag({
          content: `
            .app-nav { display: none !important; }
            .top-bar { display: none !important; }
            .demo-float-meta { display: none !important; }
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
        // 等画面真的有内容。
        // ⚠ 历史 bug：这里曾是固定 waitForTimeout(1500)，而重资产示例在 1.5s 时
        //   连 canvas 都还没创建（实测 Cesium 的 autoRotate：t=1.5s 时 canvas 数=0）。
        // ⚠ 判据必须看「渲染尺寸」而不是 canvas.width 属性：
        //   属性判据（c.width > 50）太弱 —— Cesium 的 expand 示例画布停在 HTML 默认的
        //   300×150（属性判据通过），mygrapics/pixels/index1 更是 0×0，都会被当成「已就绪」。
        await page
          .waitForFunction(
            () => {
              const body = document.querySelector('.demo-body')
              const br = body ? body.getBoundingClientRect() : null
              return [...document.querySelectorAll('canvas')].some(c => {
                const r = c.getBoundingClientRect()
                if (r.width < 60 || r.height < 60) return false
                if (!br || br.width < 10 || br.height < 10) return true
                return (r.width * r.height) / (br.width * br.height) >= 0.05
              })
            },
            null,
            { timeout: 25000 }
          )
          .catch(() => {})
        // 瓦片 / 模型 / 贴图基本都走网络，等网络静默能覆盖「加载慢」这一类。
        // 动画类示例会持续请求，networkidle 可能等不到 —— 超时即可，不视为失败。
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})

        // 构图修正：把「明显没铺满容器」的画布用 transform 放大到 contain 居中。
        // ⚠ 只能用 transform，绝不能改 width/height：
        //   实测改布局尺寸会让「只绘制一次」的 WebGL demo 触发 resize 重分配绘制缓冲区后
        //   不再重绘 → 整幅变全黑（graphics/animate_webgl/* 这一类全中招）。
        //   transform 不产生 resize 事件，画面保持原样，只是显示得更大。
        // ⚠ 只放大「画布即主体」的（面积占比 ≥ 5%）：占比过小的多半是装饰性小图。
        const filled = await page
          .evaluate(() => {
            const body = document.querySelector('.demo-body')
            if (!body) return null
            const br = body.getBoundingClientRect()
            if (br.width < 10 || br.height < 10) return null
            const applied = []
            for (const c of document.querySelectorAll('canvas')) {
              const r = c.getBoundingClientRect()
              if (r.width < 60 || r.height < 60) continue
              const areaRatio = (r.width * r.height) / (br.width * br.height)
              if (areaRatio < 0.05) continue
              if (r.width >= br.width * 0.9 && r.height >= br.height * 0.9) continue
              const s = Math.min(br.width / r.width, br.height / r.height)
              if (s <= 1.02) continue
              const dx = br.left + br.width / 2 - (r.left + r.width / 2)
              const dy = br.top + br.height / 2 - (r.top + r.height / 2)
              c.style.setProperty('transform-origin', 'center center', 'important')
              c.style.setProperty(
                'transform',
                `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${s.toFixed(4)})`,
                'important'
              )
              applied.push(`${Math.round(r.width)}x${Math.round(r.height)}*${s.toFixed(2)}`)
            }
            return applied.length ? applied.join(',') : null
          })
          .catch(() => null)
        if (filled) await page.waitForTimeout(400)

        // ⚠ 探针必须覆盖「整幅」而不是左上角一小块：
        //   实测 kaikeba 的「4-一个点」把唯一的白点画在画布正中，只探左上角 320×240
        //   会得到方差 0，把有效画面误判成空白。全画幅同一帧的方差是 117。
        const probe = box && box.width > 0 && box.height > 0 ? box : { x: 0, y: 0, width: 960, height: 640 }
        // 轮询：画面出来了就提前结束，没出来就等到超时。
        let variance = 0
        let nonModal = 0
        for (let attempt = 0; attempt < 10; attempt++) {
          const v = await shotContent(probe).catch(() => null)
          if (v) {
            if (v.variance > variance) variance = v.variance
            if (v.nonModal > nonModal) nonModal = v.nonModal
          }
          if (hasContent(variance, nonModal)) break
          await page.waitForTimeout(1000)
        }

        // ---- 交互补拍（仅当已判为空白时）----
        // 一批示例是「点击 / 拖拽驱动」的绘图 demo：初始帧本就是空的，内容只在 canvas 的
        // click / mousemove 事件里产生。它们**渲染正常**，只是截图时没人操作 —— 用方差判据
        // 会把它们误判成「白屏」。
        //   实测：webgl/kaikeba-webgl/03-绘制三角形/12-鼠标绘制线条 → 初始只有画布正中一个黄点；
        //   11-绘制星空 的 `stars` 初始为 []，星星只在 click 里 push；
        //   webgl/study-webgl/1-base/3-动态绘制点并改变颜色 → 交互后方差 56 → 163。
        // ⚠ 只在「判为空白」时补拍：否则会给本来正常的画面叠上无关笔迹，把封面改坏。
        // ⚠ 用固定种子的伪随机：同一示例每次补拍得到相同构图，封面可复现（不会每次重跑都变）。
        let interacted = null
        if (!hasContent(variance, nonModal)) {
          const cbox = await page
            .evaluate(() => {
              const cs = [...document.querySelectorAll('canvas')].filter(c => {
                const r = c.getBoundingClientRect()
                return r.width > 60 && r.height > 60
              })
              if (!cs.length) return null
              let best = null
              let ba = 0
              for (const c of cs) {
                const r = c.getBoundingClientRect()
                const a = r.width * r.height
                if (a > ba) {
                  ba = a
                  best = r
                }
              }
              const vw = window.innerWidth
              const vh = window.innerHeight
              const x = Math.max(0, best.x)
              const y = Math.max(0, best.y)
              const w = Math.min(best.width, vw - x)
              const h = Math.min(best.height, vh - y)
              return w > 60 && h > 60 ? { x, y, width: w, height: h } : null
            })
            .catch(() => null)
          if (cbox) {
            let seed = 20260924
            const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
            try {
              // 散布点击：让「点击生成」类示例累积出足够多的图元
              for (let i = 0; i < 24; i++) {
                const px = cbox.x + cbox.width * (0.08 + 0.84 * rnd())
                const py = cbox.y + cbox.height * (0.08 + 0.84 * rnd())
                await page.mouse.click(px, py)
                await page.waitForTimeout(60)
              }
              // 再来一次拖拽：覆盖「鼠标绘制线条 / 画多线 / 绘制面」这类
              await page.mouse.move(cbox.x + cbox.width * 0.15, cbox.y + cbox.height * 0.25)
              await page.mouse.down()
              for (let i = 0; i <= 20; i++) {
                await page.mouse.move(
                  cbox.x + cbox.width * (0.15 + 0.7 * (i / 20)),
                  cbox.y + cbox.height * (0.25 + 0.5 * Math.sin(i / 3)),
                  { steps: 2 }
                )
                await page.waitForTimeout(40)
              }
              await page.mouse.up()
              interacted = 'clicks+drag'
            } catch {
              interacted = 'failed'
            }
            if (interacted === 'clicks+drag') {
              for (let attempt = 0; attempt < 6; attempt++) {
                const v = await shotContent(probe).catch(() => null)
                if (v) {
                  if (v.variance > variance) variance = v.variance
                  if (v.nonModal > nonModal) nonModal = v.nonModal
                }
                if (hasContent(variance, nonModal)) break
                await page.waitForTimeout(800)
              }
            }
          }
        }

        await mkdir(path.dirname(abs), { recursive: true })
        await capture(abs, box)
        const sz = (await stat(abs)).size
        // ⚠ 成功判据用「画面是否有内容」而不是文件字节数（见 hasContent 注释）。
        const ok = hasContent(variance, nonModal)
        map.push({
          ...t,
          thumbnail: url,
          ok,
          skipped: false,
          variance: Math.round(variance),
          nonModal: Number(nonModal.toFixed(5)),
          ...(filled ? { filled } : {}),
          ...(interacted ? { interacted } : {})
        })
        if (!ok) {
          failures.push({
            ...t,
            reason: `blank (variance=${Math.round(variance)}, nonModal=${nonModal.toFixed(5)}, ${sz}B)`
          })
        }
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

  // 写回 map：--only-failed / --only-blank 模式合并回原 map（不丢其它条目）；否则整体覆盖。
  if (onlyFailed || onlyBlank) {
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
