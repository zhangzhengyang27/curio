#!/usr/bin/env node
/**
 * three.js 本地兼容层守卫。
 *
 * 背景：项目把 three.js 官方示例仓库（three.js-dev，r186dev 预发布）的 build 文件
 * 手工拷贝到 src/examples/three-build-compat/，并在 vite.config.ts 中通过
 * threeCompatResolver 把 `three` / `three/webgpu` / `three/tsl` 重定向过去，
 * 目的是用上 npm 稳定版尚未发布的 WebGPU/TSL API（如 MeshBasicNodeMaterial）。
 *
 * 风险：这是一份脱离 npm 官方发布渠道的、带预发布标记的构建产物。
 * 一旦有人无意中改动了这些文件、或上游 r186 正式版行为发生变化，
 * 表现是「部分示例静默白屏/报错」，而且不会有任何构建期报错。
 *
 * 本脚本做两件事：
 *   1. 校验兼容层文件与 compat-manifest.json 中记录的哈希一致（防止静默漂移）
 *   2. 校验 vite.config.ts 仍然注册了 threeCompatResolver（防止兼容层变成死文件）
 *
 * 用法：
 *   node scripts/verify-three-compat.mjs            # 校验（CI 使用）
 *   node scripts/verify-three-compat.mjs --update   # 有意更新兼容层后，重新生成基线
 *
 * 退出条件（何时可以删除整个兼容层）见 docs/THREE_UPGRADE.md。
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '../..')
const COMPAT_DIR = join(ROOT, 'src/examples/three-build-compat')
const MANIFEST = join(COMPAT_DIR, 'compat-manifest.json')
const VITE_CONFIG = join(ROOT, 'vite.config.ts')

const EXPECTED_FILES = [
  'three.core.js',
  'three.module.js',
  'three.tsl.js',
  'three.webgpu.js',
  'three.webgpu.nodes.js',
]

const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')

/** 从 three.core.js 里读出 REVISION 常量 */
function readRevision() {
  const corePath = join(COMPAT_DIR, 'three.core.js')
  if (!existsSync(corePath)) return null
  const match = readFileSync(corePath, 'utf8').match(/REVISION = '([^']+)'/)
  return match ? match[1] : null
}

function buildManifest() {
  const files = {}
  for (const name of EXPECTED_FILES) {
    const full = join(COMPAT_DIR, name)
    if (!existsSync(full)) continue
    files[name] = { size: statSync(full).size, sha256: sha256(full) }
  }
  return {
    note: 'three.js 本地兼容层基线。由 scripts/verify-three-compat.mjs --update 生成，请勿手工编辑。',
    revision: readRevision(),
    files,
  }
}

const update = process.argv.includes('--update')

// ---- 校验项 1：兼容层文件存在 ----
const missing = EXPECTED_FILES.filter((name) => !existsSync(join(COMPAT_DIR, name)))
if (missing.length) {
  console.error(`[FAIL] 兼容层缺少文件：${missing.join(', ')}`)
  console.error('请按 docs/THREE_UPGRADE.md 从 three.js 官方示例仓库 build 目录补齐。')
  process.exit(1)
}

const actual = buildManifest()

// ---- --update：重新生成基线 ----
if (update) {
  writeFileSync(MANIFEST, `${JSON.stringify(actual, null, 2)}\n`, 'utf8')
  console.log(`[verify-three-compat] 已更新基线：${MANIFEST}`)
  console.log(`  上游版本（REVISION）: ${actual.revision}`)
  for (const [name, info] of Object.entries(actual.files)) {
    console.log(`  ${name}  ${info.size} bytes  ${info.sha256.slice(0, 12)}…`)
  }
  process.exit(0)
}

if (!existsSync(MANIFEST)) {
  console.error(`[FAIL] 缺少兼容层基线文件：${MANIFEST}`)
  console.error('请在确认当前兼容层内容无误后执行：node scripts/verify-three-compat.mjs --update')
  process.exit(1)
}

const baseline = JSON.parse(readFileSync(MANIFEST, 'utf8'))
const errors = []

// ---- 校验项 2：版本号一致 ----
if (baseline.revision !== actual.revision) {
  errors.push(`REVISION 与基线不一致：基线 ${baseline.revision}，当前 ${actual.revision}`)
}

// ---- 校验项 3：文件哈希一致（防静默漂移）----
for (const name of EXPECTED_FILES) {
  const b = baseline.files?.[name]
  const a = actual.files[name]
  if (!b) {
    errors.push(`基线中缺少 ${name} 的记录`)
    continue
  }
  if (b.sha256 !== a.sha256 || b.size !== a.size) {
    errors.push(
      `${name} 与基线不一致（基线 ${b.size}B/${b.sha256.slice(0, 12)}…，当前 ${a.size}B/${a.sha256.slice(0, 12)}…）`
    )
  }
}

// ---- 校验项 4：vite.config.ts 仍注册了解析器 ----
if (!readFileSync(VITE_CONFIG, 'utf8').includes('three-compat-resolver')) {
  errors.push('vite.config.ts 中未找到 three-compat-resolver 插件，兼容层已成为死文件')
}

console.log(`[verify-three-compat] 兼容层上游版本：${actual.revision}（npm 稳定版为 package.json 中的 three 依赖）`)
console.log('[verify-three-compat] 提示：这是预发布构建的本地兼容层，属于临时技术债，')
console.log('                      切回 npm 稳定版的步骤见 docs/THREE_UPGRADE.md。')

if (errors.length) {
  console.error(`\n[FAIL] 兼容层校验未通过（${errors.length} 项）：`)
  for (const e of errors) console.error(`  - ${e}`)
  console.error('\n若确认是「有意升级兼容层」，请在验证相关示例后执行：')
  console.error('  node scripts/verify-three-compat.mjs --update')
  process.exit(1)
}

console.log('\n[OK] 兼容层文件与基线一致，vite 解析器注册正常。')
process.exit(0)
