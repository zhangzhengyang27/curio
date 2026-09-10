// 校验所有示例的 thumbnail 是否健康，用于防回归 (Layer 3)。
// - 非空 thumbnail 必须对应 public/ 下真实存在的文件(否则线上会破图)
// - 统计空 thumbnail(走占位符，非错误但记录)
// 退出码: 发现"非空但文件缺失"则返回 1(CI 应拦截)，仅空 thumbnail 则返回 0。
//
// 用法: node scripts/verify-thumbnails.mjs
import { existsSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '../..')
const REG_DIR = join(ROOT, 'src/examples/registry')
const PUBLIC = join(ROOT, 'public')

const idx = await import(join(REG_DIR, 'index.js'))
// 注意：registry/index.js 已改为按 source 懒加载。必须用异步版本触发加载，
// 否则同步的 getAllExamples() 会返回空数组，校验静默「全部通过」（假阳性）。
const all = await idx.getAllExamplesAsync()

let empty = 0
const missing = []
for (const ex of all) {
  const t = ex.thumbnail || ''
  if (!t) {
    empty++
    continue
  }
  if (!t.startsWith('/')) {
    missing.push(`${ex.source}/${ex.category}/${ex.id} -> 非常规路径 "${t}"`)
    continue
  }
  // thumbnail 是 encodeURIComponent 后的 URL（如 /example-thumbs/.../%E7%82%B9.jpg），
  // 而磁盘文件是中文名，必须解码后再拼 public 路径，否则中文路径会被误判为缺失。
  const p = join(PUBLIC, decodeURIComponent(t))
  if (!existsSync(p) || statSync(p).size === 0) {
    missing.push(`${ex.source}/${ex.category}/${ex.id} -> ${t}`)
  }
}

console.log(`总示例: ${all.length}`)
console.log(`空 thumbnail(占位符): ${empty}`)
console.log(`非空但文件缺失/异常(破图风险): ${missing.length}`)
if (missing.length) {
  console.log('\n缺失列表:')
  console.log(missing.join('\n'))
}
if (missing.length > 0) {
  console.error(`\n[FAIL] 存在 ${missing.length} 个缩略图文件缺失，请运行 scripts/download-threejs-screenshots.mjs 或检查路径。`)
  process.exit(1)
} else {
  console.log('\n[OK] 所有非空 thumbnail 均有对应文件，无破图风险。')
  process.exit(0)
}
