// 下载 three.js 官方示例截图，补齐 registry 中 threejs-official 缺失的 thumbnail。
// 官方截图目录: https://threejs.org/examples/screenshots/{id}.jpg
// 其 {id} 与本项目 registry 中 threejs-official 的 id 完全一致（即 thumbnail 路径去掉前缀）。
//
// 用法: node scripts/download-threejs-screenshots.mjs [--source threejs-official] [--concurrency 10]
// 特性: 并发下载、已存在则跳过(可续传)、失败记录、结束打印汇总。
import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '../..')
const REG_DIR = join(ROOT, 'src/examples/registry')
const PUBLIC = join(ROOT, 'public')

const args = process.argv.slice(2)
const getArg = (name, def) => {
  const i = args.indexOf('--' + name)
  return i >= 0 ? args[i + 1] : def
}
const sourceFilter = getArg('source', 'threejs-official')
const CONCURRENCY = Number(getArg('concurrency', '10'))

const BASE = 'https://threejs.org'

// 动态读取 registry 索引，拿到所有示例
const idx = await import(join(REG_DIR, 'index.js'))
const all = idx.getAllExamples()

// 仅处理 source 匹配 且 thumbnail 指向 /threejs-official/screenshots/ 的条目
const targets = all.filter(
  e => e.source === sourceFilter && typeof e.thumbnail === 'string' && e.thumbnail.startsWith('/threejs-official/screenshots/')
)

console.log(`目标: source=${sourceFilter}  待下载=${targets.length}  并发=${CONCURRENCY}`)

let done = 0, ok = 0, skipped = 0, failed = 0
const failures = []

async function downloadOne(ex) {
  const rel = ex.thumbnail // 例如 /threejs-official/screenshots/webgl_xxx.jpg (项目本地挂载路径)
  const localPath = join(PUBLIC, rel)
  // 官方站点路径前缀是 /examples/screenshots/ 而非 /threejs-official/screenshots/
  const id = rel.replace(/^\/threejs-official\/screenshots\//, '').replace(/\.jpg$/i, '')
  const url = `https://threejs.org/examples/screenshots/${id}.jpg`
  if (existsSync(localPath) && statSync(localPath).size > 0) {
    skipped++
    return
  }
  mkdirSync(dirname(localPath), { recursive: true })
  const res = await fetch(url)
  if (!res.ok) {
    failed++
    failures.push(`${ex.id} => HTTP ${res.status}`)
    return
  }
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.byteLength < 200) {
    failed++
    failures.push(`${ex.id} => 文件过小 ${buf.byteLength}B`)
    return
  }
  writeFileSync(localPath, buf)
  ok++
}

// 并发池
let cursor = 0
async function worker() {
  while (cursor < targets.length) {
    const i = cursor++
    const ex = targets[i]
    try {
      await downloadOne(ex)
    } catch (err) {
      failed++
      failures.push(`${ex.id} => ERR ${err.message}`)
    }
    done++
    if (done % 50 === 0 || done === targets.length) {
      process.stdout.write(`\r进度 ${done}/${targets.length}  成功=${ok} 跳过=${skipped} 失败=${failed}`)
    }
  }
}

const workers = Array.from({ length: Math.min(CONCURRENCY, targets.length) }, () => worker())
await Promise.all(workers)
console.log('\n=== 完成 ===')
console.log(`成功下载=${ok}  已存在跳过=${skipped}  失败=${failed}  总计=${targets.length}`)
if (failures.length) {
  console.log('失败列表(前30):')
  console.log(failures.slice(0, 30).join('\n'))
}
console.log(`输出目录: ${join(PUBLIC, '/threejs-official/screenshots')}`)
