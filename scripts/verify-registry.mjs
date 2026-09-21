#!/usr/bin/env node
/**
 * 示例注册表一致性校验。
 *
 * 示例中心由 11 个 registry 文件聚合而成，组件按命名约定动态解析：
 *   src/examples/components/{source}/{category}/{PascalCase(id)}Example.vue
 *   src/examples/components/{source}/{category}/{id}.vue
 *   src/examples/components/{source}/{category}/{id}/index.vue
 * 这套「约定优于配置」的机制没有类型系统保护，一旦 registry 与磁盘文件不一致，
 * 用户侧表现为卡片点进去白屏/报「未找到 Vue 组件」，且不会有任何构建报错。
 * 因此需要本脚本作为 CI 闸门。
 *
 * 校验项：
 *   1. 主键 (source/category/id) 唯一
 *   2. 必填字段完整（source/category/id/title/runner）
 *   3. runner 合法（vue | iframe）
 *   4. runner=vue 的示例必须能在约定路径找到对应组件
 *   5. 每个 source 至少有一条示例
 *
 * 用法：node scripts/verify-registry.mjs   （有问题则退出码 1）
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { exampleComponentCandidates } from './lib/example-component.mjs'

const ROOT = resolve(fileURLToPath(import.meta.url), '../..')
const REG_DIR = join(ROOT, 'src/examples/registry')

const REQUIRED_FIELDS = ['source', 'category', 'id', 'title', 'runner']
const VALID_RUNNERS = new Set(['vue', 'iframe'])

const idx = await import(pathToFileURL(join(REG_DIR, 'index.ts')).href)
const all = await idx.getAllExamplesAsync()
const sources = idx.getSources()

// ---- 0. 展示层覆盖不得削减校验覆盖面 ----
// registry/index.ts 在写 _registryCache 处套了 src/examples/metadata 的展示元数据覆盖层。
// 字段覆盖（title / description / tags）无所谓，但 hidden 绝不能在缓存处**删条目** ——
// 那样本脚本的全部检查、以及 R3「id ↔ 组件文件按命名约定命中」都会静默跳过被隐藏的示例，
// 而被隐藏示例的组件文件一旦被人删掉，CI 不会再报警。
// 正确做法：只打 displayHidden 标记，由展示层（useGalleryFilters / ExampleDemo）过滤。
// 这里用「分片文件里 "title": 的出现次数」做独立参照，条目被删就当场失败。
const rawEntryCount = readdirSync(REG_DIR)
  .filter(f => f.endsWith('.ts') && f !== 'index.ts')
  .reduce((sum, f) => {
    const text = readFileSync(join(REG_DIR, f), 'utf8')
    return sum + (text.match(/"title":/g) || []).length
  }, 0)

const errors = []
const warnings = []

if (all.length !== rawEntryCount) {
  errors.push(
    `校验覆盖面被削减：getAllExamplesAsync() 返回 ${all.length} 条，` +
    `但 registry 分片里实际有 ${rawEntryCount} 条。` +
    `展示层的 hidden 只能打 displayHidden 标记、由展示层过滤，` +
    `不要在 metadata/index.ts 的 applyDisplayOverrides 里删条目。`
  )
}

// ---- 1. 主键唯一 ----
const seen = new Map()
for (const ex of all) {
  const key = `${ex.source}/${ex.category}/${ex.id}`
  if (seen.has(key)) {
    errors.push(`主键冲突（同 source+category+id 重复注册）: ${key}`)
  } else {
    seen.set(key, ex)
  }
}

// ---- 2. 必填字段 ----
for (const ex of all) {
  const key = `${ex.source}/${ex.category}/${ex.id}`
  for (const field of REQUIRED_FIELDS) {
    if (ex[field] === undefined || ex[field] === null || ex[field] === '') {
      errors.push(`缺少必填字段 ${field}: ${key}`)
    }
  }
}

// ---- 3. runner 合法 ----
for (const ex of all) {
  if (!VALID_RUNNERS.has(ex.runner)) {
    errors.push(`非法 runner "${ex.runner}": ${ex.source}/${ex.category}/${ex.id}`)
  }
}

// ---- 4. runner=vue 的组件文件必须存在 ----
for (const ex of all) {
  if (ex.runner !== 'vue') continue
  if (!exampleComponentCandidates(ex.source, ex.category, ex.id).some((p) => existsSync(p))) {
    errors.push(`组件文件缺失: ${ex.source}/${ex.category}/${ex.id}（已尝试约定路径 3 个候选）`)
  }
}

// ---- 5. 每个 source 至少有一条示例 ----
const perSource = new Map()
for (const ex of all) {
  perSource.set(ex.source, (perSource.get(ex.source) || 0) + 1)
}
for (const { source } of sources) {
  if (!perSource.get(source)) {
    errors.push(`source "${source}" 未注册任何示例（registry 为空或加载失败）`)
  }
}

// ---- 6. 兜底：总量不为 0（防止 registry 加载失败被误判为通过）----
if (all.length === 0) {
  errors.push('聚合后的示例总数为 0，疑似 registry 加载失败（请检查懒加载是否已 await）')
}

// ---- 报告 ----
console.log('[verify-registry] 各数据源示例数：')
for (const [source, count] of [...perSource.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(count).padStart(5)}  ${source}`)
}
console.log(`\n[verify-registry] 合计 ${all.length} 条示例，来自 ${perSource.size} 个数据源。`)

const iframeCount = all.filter((ex) => ex.runner === 'iframe').length
if (iframeCount > 0) {
  warnings.push(`存在 ${iframeCount} 条 runner=iframe 的示例（当前项目约定为全部 vue，请确认是否符合预期）`)
}

if (warnings.length) {
  console.log('\n[verify-registry] 提示：')
  for (const w of warnings) console.log(`  - ${w}`)
}

if (errors.length) {
  console.error(`\n[FAIL] 发现 ${errors.length} 个注册表一致性问题：`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

console.log('\n[OK] 注册表主键唯一、字段完整、组件文件全部命中。')
process.exit(0)
