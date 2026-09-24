// 校验所有示例的 thumbnail 是否健康，用于防回归 (Layer 3)。
// - 非空 thumbnail 必须对应 public/ 下真实存在的文件(否则线上会破图)
// - 统计空 thumbnail(走占位符，非错误但记录)
// - 【内容检查】同一张图被过多条目共用 → 必然是「截图失败留下的占位图」
// 退出码: 发现"非空但文件缺失"则返回 1(CI 应拦截)，仅空 thumbnail 则返回 0。
//
// ⚠ 为什么要做内容检查：本脚本原先只查「字段空 / 文件不存在 / size===0」，
//   查不出「有路径、有字节，但图是纯白/纯黑的截图失败产物」。
//   实测：120 条无效封面全部通过旧闸门，脚本还输出「[OK] 无破图风险」。
//   详见 docs/DEDUP_RESEARCH.md §6。
//
// ⚠ 判据必须用「同图字节哈希被 >N 条共用」，不能用「字节数 < 阈值」：
//   实测假阳性 —— webgl/kaikeba-webgl/03-绘制三角形/3-线 (4095 B) 是合法封面，
//   画面就是黑底 + 一个黄色平行四边形轮廓，压缩后天然只有 4 KB。
//   用字节阈值当硬失败会逼出「把正确封面改成错误封面」的改动。
//
// 用法: node scripts/verify-thumbnails.mjs [--strict]
//   --strict: 同图共用超限时也返回 1（修完存量后应在 CI 里开启）
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '../..')
const REG_DIR = join(ROOT, 'src/examples/registry')
const PUBLIC = join(ROOT, 'public')

// 一张图被多少条示例共用就算「占位图」。真实截图不可能让几十个互不相关的示例完全同字节。
// 阈值 5 留了余量：确实存在「同一 demo 的多个变体复用同一张截图」的合法情形（如双后端）。
const SHARED_LIMIT = 5
const STRICT = process.argv.includes('--strict')

const idx = await import(join(REG_DIR, 'index.ts'))
// 注意：registry/index.js 已改为按 source 懒加载。必须用异步版本触发加载，
// 否则同步的 getAllExamples() 会返回空数组，校验静默「全部通过」（假阳性）。
const all = await idx.getAllExamplesAsync()

let empty = 0
const missing = []
const byHash = new Map()
for (const ex of all) {
  const t = ex.thumbnail || ''
  const key = `${ex.source}/${ex.category}/${ex.id}`
  if (!t) {
    empty++
    continue
  }
  if (!t.startsWith('/')) {
    missing.push(`${key} -> 非常规路径 "${t}"`)
    continue
  }
  // thumbnail 是 encodeURIComponent 后的 URL（如 /example-thumbs/.../%E7%82%B9.jpg），
  // 而磁盘文件是中文名，必须解码后再拼 public 路径，否则中文路径会被误判为缺失。
  const p = join(PUBLIC, decodeURIComponent(t))
  if (!existsSync(p) || statSync(p).size === 0) {
    missing.push(`${key} -> ${t}`)
    continue
  }
  const hash = createHash('md5').update(readFileSync(p)).digest('hex')
  if (!byHash.has(hash)) byHash.set(hash, { path: p, size: statSync(p).size, keys: [] })
  byHash.get(hash).keys.push(key)
}

const shared = [...byHash.values()]
  .filter(g => g.keys.length > SHARED_LIMIT)
  .sort((a, b) => b.keys.length - a.keys.length)
const sharedEntries = shared.reduce((n, g) => n + g.keys.length, 0)

// 2..SHARED_LIMIT 条的组：只提示，不失败。
// ⚠ 不要把这些升级为失败、也不要用「字节数 < 阈值」来筛：
//   实测它们大量是**合法**的 —— 教学课程序列里相邻两讲画面本来就完全一样
//   （如 kaikeba「06-颜色与纹理/07-纹理」与「13-纹理模块化」，重截后两张都是有效画面，
//     nonModal=0.246 且字节完全相同）。
//   而用字节阈值会误伤合法的稀疏封面（实测 webgl/.../03-绘制三角形/3-线 只有 4095 B，
//   画面就是黑底 + 黄色平行四边形轮廓）。
const pairs = [...byHash.values()]
  .filter(g => g.keys.length >= 2 && g.keys.length <= SHARED_LIMIT)
  .sort((a, b) => b.keys.length - a.keys.length)
const pairEntries = pairs.reduce((n, g) => n + g.keys.length, 0)

console.log(`总示例: ${all.length}`)
console.log(`空 thumbnail(占位符): ${empty}`)
console.log(`非空但文件缺失/异常(破图风险): ${missing.length}`)
console.log(`同图共用 > ${SHARED_LIMIT} 条的图: ${shared.length} 组 / ${sharedEntries} 条`)
console.log(`同图共用 2~${SHARED_LIMIT} 条的图: ${pairs.length} 组 / ${pairEntries} 条（需人工复核，多为课程序列合法同图）`)
if (shared.length) {
  console.log('\n疑似占位图(截图失败产物，需重截):')
  for (const g of shared.slice(0, 20)) {
    console.log(`  ${String(g.keys.length).padStart(3)} 条  ${(g.size / 1024).toFixed(1)} KB  ${g.keys[0]}`)
    if (g.keys.length > 1) console.log(`           例: ${g.keys.slice(1, 4).join(', ')}`)
  }
  if (shared.length > 20) console.log(`  … 其余 ${shared.length - 20} 组见上方统计`)
  console.log('\n  修复: NODE_OPTIONS="" node scripts/screenshot-examples.mjs --only-blank')
  console.log('  说明: threejs-official 用的是上游官方截图，本地重跑修不了（见 docs/DEDUP_RESEARCH.md §6.3）')
}
if (pairs.length) {
  console.log(`\n需人工复核的 2~${SHARED_LIMIT} 条同图组（前 10）:`)
  for (const g of pairs.slice(0, 10)) {
    console.log(`  ${String(g.keys.length).padStart(3)} 条  ${(g.size / 1024).toFixed(1)} KB  ${g.keys.join(' | ')}`)
  }
  if (pairs.length > 10) console.log(`  … 其余 ${pairs.length - 10} 组`)
  console.log('  ⚠ 不拦截：课程序列里相邻两讲画面完全一致是正常的（见脚本注释）。')
}
if (missing.length) {
  console.log('\n缺失列表:')
  console.log(missing.join('\n'))
}

if (missing.length > 0) {
  console.error(`\n[FAIL] 存在 ${missing.length} 个缩略图文件缺失，请运行 scripts/download-threejs-screenshots.mjs 或检查路径。`)
  process.exit(1)
}
if (STRICT && shared.length > 0) {
  console.error(`\n[FAIL] 存在 ${shared.length} 组共用占位图，请先运行 scripts/screenshot-examples.mjs --only-blank。`)
  process.exit(1)
}
if (shared.length > 0) {
  console.log('\n[WARN] 非空 thumbnail 均有对应文件，但有共用占位图（未启用 --strict，不拦截）。')
  process.exit(0)
}
console.log('\n[OK] 所有非空 thumbnail 均有对应文件，且未发现共用占位图。')
process.exit(0)
