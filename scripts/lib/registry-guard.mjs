/**
 * 注册表写入守卫。
 *
 * 背景
 * ----
 * `src/examples/registry/*.ts` 是「机器生成」与「人工精修」混在一起的文件：
 * 生成器按目录/配置推导条目，而人工又会改 title / description / tags / thumbnail、
 * 甚至手工追加脚本解析不到的条目。历史上多次出现「重跑生成脚本 → 手工数据被整体覆盖」，
 * 而且不会有任何报错，只能靠事后 git diff 发现。
 *
 * 约定
 * ----
 * 所有会写入 registry 的脚本都必须经过本模块，并且：
 *   - 不带参数运行        → 拒绝写入，打印原因与后续操作指引（安全默认值）
 *   - --dry-run           → 只打印将要发生的变化摘要，不落盘
 *   - --force / --write   → 真正写入（若目标文件有未提交改动，会额外高亮提醒）
 *   - --check             → 只读：比对生成结果与现有文件，不一致则退出码 1（漂移检测，供 CI 使用）
 *
 * 这样把「静默覆盖」变成「必须显式确认」，并让 --dry-run 成为重跑前的标准动作。
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..')

/** 解析命令行开关 */
export function parseWriteFlags(argv = process.argv.slice(2)) {
  return {
    dryRun: argv.includes('--dry-run'),
    force: argv.includes('--force') || argv.includes('--write'),
    check: argv.includes('--check'),
  }
}

/**
 * 载入现有 registry 的 examples 数组（文件不存在或解析失败时返回空数组）。
 * 供生成器做「保留人工/流水线字段」的合并，避免覆盖式重生成丢数据。
 */
export async function loadExistingExamples(registryPath) {
  if (!existsSync(registryPath)) return []
  try {
    const mod = await import(pathToFileURL(registryPath).href)
    const registry = mod.default || mod
    return Array.isArray(registry?.examples) ? registry.examples : []
  } catch {
    return []
  }
}

/**
 * 「人工精修 / 流水线产出」字段：生成器一律不覆盖已有值。
 *
 * - thumbnail：截图流水线（scripts/screenshot-examples.mjs → patch-registry-thumbs.mjs）产出
 * - title / description / tags：scripts/improve-example-meta.mjs 产出并经人工校对
 * - runner：由组件是否存在决定，项目不变量是全部 'vue'；生成器的 iframe 回退是历史 bug
 */
const CURATED_FIELDS = ['title', 'description', 'tags', 'thumbnail', 'runner']

/**
 * 把「生成器不产出、或产出质量更差」的字段从现有条目回填到新条目上。
 *
 * 为什么需要：registry 同时承载「机器生成」与「人工精修」两类数据，而生成器无法区分。
 * 实测证据（scripts/… --dry-run）：
 *   - threejs-lesson 生成器会把 29 张封面全部抹掉
 *   - earth-lessons 生成器会把 6 张封面全部抹掉
 *   - 两者的 description 会从精修文案退回成标题，tags 会退回成 [source, id] 原始值
 *
 * 新增条目（现有文件中不存在）不受影响，仍由生成器正常产出。
 *
 * @returns {{preserved: Record<string, number>, runnerKept: string[]}}
 */
export function preserveCuratedFields(newExamples, existingExamples, fields = CURATED_FIELDS) {
  const byKey = new Map(existingExamples.map((e) => [`${e.category || ''}/${e.id}`, e]))
  const preserved = {}
  const runnerKept = []

  for (const ex of newExamples) {
    const old = byKey.get(`${ex.category || ''}/${ex.id}`)
    if (!old) continue
    for (const field of fields) {
      const before = old[field]
      const isEmpty =
        before === undefined ||
        before === null ||
        before === '' ||
        (Array.isArray(before) && before.length === 0)
      if (isEmpty) continue

      // thumbnail：仅在生成器没有产出时回填（生成器本就不产出）
      if (field === 'thumbnail') {
        if (ex.thumbnail) continue
      }

      if (field === 'runner' && ex.runner !== before) {
        runnerKept.push(`${ex.category || ''}/${ex.id}（生成器给 ${ex.runner}，保留 ${before}）`)
      }
      ex[field] = before
      preserved[field] = (preserved[field] || 0) + 1
    }
  }

  return { preserved, runnerKept }
}

/** 目标文件在 git 中是否有未提交改动（非 git 仓库 / 未跟踪则返回 false） */
function isGitDirty(relPath) {
  try {
    const out = execFileSync('git', ['status', '--porcelain', '--', relPath], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return out.trim().length > 0
  } catch {
    return false
  }
}

/** 统计用于安全判断的粗粒度指标 */
function summarize(text) {
  const lines = text.split('\n')
  // registry 里每个条目一行 `"id": "xxx"`，条目数的增减是最直观的数据丢失信号
  const ids = (text.match(/"id"\s*:\s*"/g) || []).length
  const thumbs = (text.match(/"thumbnail"\s*:\s*"/g) || []).length
  return { lines: lines.length, ids, thumbs }
}

/**
 * 写出 registry 内容（受保护）。
 *
 * @param {string} targetPath 绝对路径
 * @param {string} content    新的文件内容
 * @param {{dryRun:boolean, force:boolean}} flags
 * @param {string} [scriptName] 调用方脚本名，用于提示信息
 * @returns {{written:boolean}}
 */
export function writeRegistry(targetPath, content, flags, scriptName = 'unknown') {
  const rel = relative(ROOT, targetPath)
  const before = existsSync(targetPath) ? readFileSync(targetPath, 'utf8') : ''
  const a = summarize(before)
  const b = summarize(content)
  const delta = (n) => (n > 0 ? `+${n}` : `${n}`)

  const summary = [
    `目标文件: ${rel}`,
    existsSync(targetPath) ? '写入方式: 覆盖已有文件' : '写入方式: 新建文件',
    `行数:   ${a.lines} → ${b.lines}  (${delta(b.lines - a.lines)})`,
    `条目数: ${a.ids} → ${b.ids}  (${delta(b.ids - a.ids)})`,
    `缩略图: ${a.thumbs} → ${b.thumbs}  (${delta(b.thumbs - a.thumbs)})`,
  ].join('\n  ')

  // 漂移检测：生成结果与磁盘文件逐字节比对，供 CI 拦截「registry 与生成器不一致」
  if (flags.check) {
    if (before === content) {
      console.log(`[registry-guard] --check 无漂移: ${rel}`)
      return { written: false }
    }
    const beforeLines = before.split('\n')
    const afterLines = content.split('\n')
    const at = beforeLines.findIndex((l, i) => l !== afterLines[i])
    console.error(`\n[registry-guard] 检测到漂移（${scriptName}）：${rel}\n  ${summary}`)
    if (at !== -1) {
      console.error(`  首处差异在第 ${at + 1} 行：`)
      console.error(`    现有: ${beforeLines[at]}`)
      console.error(`    生成: ${afterLines[at]}`)
    }
    console.error(
      '\n  registry 已与生成器不一致（手工改动 / 生成脚本改了但没重跑）。\n' +
        '  确认生成结果正确后重跑: node <script> --force\n' +
        '  若手工改动是有意的，请同步改生成器，而不是只改 registry。\n'
    )
    // 用 exitCode 而非 process.exit，让同一脚本的多个 registry 都能被检查完再退出
    process.exitCode = 1
    return { written: false }
  }

  if (flags.dryRun) {
    console.log(`\n[registry-guard] --dry-run（未写入）由 ${scriptName} 触发：\n  ${summary}\n`)
    return { written: false }
  }

  const dirty = isGitDirty(rel)

  if (!flags.force) {
    console.error(`\n[registry-guard] 已阻止写入（${scriptName}）：\n  ${summary}\n`)
    if (dirty) {
      console.error(`  ⚠ ${rel} 当前有未提交改动，直接覆盖会丢失这些手工修改。`)
    }
    console.error('\nregistry 文件同时承载「机器生成」与「人工精修」两类数据，')
    console.error('覆盖前请先确认变更范围。可选操作：')
    console.error('\n  1) 先预览影响（推荐）:  node <script> --dry-run')
    console.error('  2) 确认无误后写入:      node <script> --force')
    console.error('\n另外建议先提交当前改动（git status / git diff）作为回退点。')
    console.error('详见 docs/KNOWN_PITFALLS.md 的 B1。\n')
    process.exit(1)
  }

  if (dirty) {
    console.warn(`\n[registry-guard] 注意：${rel} 原本就有未提交改动，本次覆盖会让它们与生成结果混合。`)
    console.warn('  建议事后用 git diff 复核。\n')
  }

  writeFileSync(targetPath, content, 'utf8')
  console.log(`\n[registry-guard] 已写入 ${rel}（${scriptName}）\n  ${summary}\n`)
  return { written: true }
}
