import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { parseWriteFlags, writeRegistry as writeRegistryGuarded } from './lib/registry-guard.mjs'
import { hasExampleComponent } from './lib/example-component.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const examplesRoot = path.join(projectRoot, 'public', 'external-examples', 'three-cesium-examples')

/**
 * 从 config 文本中提取所有案例元数据
 * @param {string} configText
 * @param {string} sourceName - 'threeExamples' | 'cesiumExamples'
 */
function parseConfig(configText, sourceName) {
  const examples = []
  const idRegex = /id\s*:\s*['"]([^'"]+)['"]/g

  let match
  while ((match = idRegex.exec(configText)) !== null) {
    const id = match[1]
    const start = match.index
    const end = configText.indexOf('}', start)
    const block = configText.slice(start, end === -1 ? start + 600 : end + 1)

    // 必须有 codeUrl 才视为可运行示例
    const codeUrlMatch = block.match(/codeUrl\s*:\s*HOST\s*\+\s*['"]([^'"]+)['"]/)
    if (!codeUrlMatch) continue

    const codeUrl = codeUrlMatch[1]
    const category = path.dirname(codeUrl)

    // 标题：优先 name，其次 id
    const nameMatch = block.match(/name\s*:\s*['"]([^'"]+)['"]/)
    const nameEnMatch = block.match(/name_en\s*:\s*['"]([^'"]+)['"]/)
    const title = nameMatch ? nameMatch[1] : id
    const titleEn = nameEnMatch ? nameEnMatch[1] : id

    // 缩略图
    const imageMatch = block.match(/image\s*:\s*(?:HOST|FILE_HOST)\s*\+\s*['"]([^'"]+)['"]/)
    const image = imageMatch ? imageMatch[1] : ''

    // 标签
    const tagMatch = block.match(/tag\s*:\s*(?:TEXTS\[[^\]]+\]\s*\+\s*['"]?[^'"]*['"]?|['"]([^'"]*)['"])/)
    const tag = tagMatch ? (tagMatch[1] || tagMatch[0]) : ''

    examples.push({
      id,
      category,
      title,
      titleEn,
      description: title,
      thumbnail: image,
      tag,
    })
  }

  return examples
}

function findLocalThumbnail(category, id) {
  const baseDir = path.join(examplesRoot, category)
  const exts = ['.jpg', '.webp', '.png']
  for (const ext of exts) {
    const filePath = path.join(baseDir, id + ext)
    if (fs.existsSync(filePath)) {
      return `/${path.relative(path.join(projectRoot, 'public'), filePath).replace(/\\/g, '/')}`
    }
  }
  return ''
}

/**
 * 读取已存在的 registry 文件，解析其中的 examples（用于「合并保护」，避免重跑时丢失手工编辑）。
 * 用动态 import() 解析，兼容 `export default {...}` 的纯 JSON 写法与 JS 对象字面量写法
 * （如 webglExamples / graphicsExamples 等含单引号 / 无引号 key 的文件），避免 JSON.parse 抛错。
 */
async function loadExistingExamples(name) {
  const p = path.join(projectRoot, 'src', 'examples', 'registry', `${name}.ts`)
  if (!fs.existsSync(p)) return null
  try {
    const mod = await import(pathToFileURL(p).href)
    const data = mod.default
    return Array.isArray(data?.examples) ? data.examples : []
  } catch {
    return null
  }
}

async function buildRegistry(name, sourceName, label, sourceKey) {
  const configFile = path.join(examplesRoot, 'config', `${sourceName.replace('Examples', '-examples')}.js`)
  // threeExamples -> three-examples.js
  // cesiumExamples -> cesium-examples.js
  const configText = fs.readFileSync(configFile, 'utf-8')
  const parsed = parseConfig(configText, sourceName)

  // 按 category 分组
  const groups = new Map()
  parsed.forEach(ex => {
    const jsPath = path.join(examplesRoot, ex.category, `${ex.id}.js`)
    if (!fs.existsSync(jsPath)) {
      console.warn(`[${sourceName}] 本地未找到 JS: ${jsPath}`)
      return
    }

    ex.entry = `/${path.relative(path.join(projectRoot, 'public'), jsPath).replace(/\\/g, '/')}`
    ex.thumbnail = findLocalThumbnail(ex.category, ex.id)
    ex.tags = [sourceName, ...ex.category.split('/').filter(Boolean).slice(1), ex.tag].filter(Boolean)
    ex.runner = 'vue'
    ex.globals = {
      HOST: '/external-examples/three-cesium-examples/',
      FILE_HOST: '/external-examples/3d-file-server/'
    }

    if (!groups.has(ex.category)) {
      groups.set(ex.category, {
        key: ex.category,
        label: ex.category,
        examples: []
      })
    }
    groups.get(ex.category).examples.push(ex)
  })

  let examples = Array.from(groups.values()).flatMap(g => g.examples)

  // 只登记「已转换为 Vue 组件」的示例。
  //
  // 背景：config 里有的条目在磁盘上有 .js 源文件，但从未被转成 Vue 组件
  // （例如 threeExamples/application/thanksBibi，在 1218670 基线快照中被移除后
  //  一直未转换）。本脚本把 runner 固定为 'vue'，而 verify-registry 会拦截
  // runner=vue 但组件缺失的条目 —— 若生成器照单全收，每次重跑都会往 registry
  // 里塞回一个「点进去白屏」的条目，并把一致性校验搞红。
  //
  // 这里与校验闸门共用 lib/example-component.mjs 的约定，保证两处判断一致。
  // 被跳过的条目会显式列出，信息不会静默丢失；转换出组件后重跑即自动纳入。
  const skipped = []
  examples = examples.filter((ex) => {
    if (hasExampleComponent(sourceKey, ex.category, ex.id)) return true
    skipped.push(`${ex.category}/${ex.id}`)
    return false
  })
  if (skipped.length) {
    console.warn(
      `[${sourceName}] 以下 ${skipped.length} 个示例有源文件但未转换为 Vue 组件，已跳过登记：`
    )
    for (const s of skipped) console.warn(`  - ${s}（待转换后重跑本脚本即自动纳入）`)
  }

  // 合并保护：重跑时尽量保留手工编辑过的字段，避免覆盖丢失
  const existing = await loadExistingExamples(name)
  if (existing && existing.length) {
    const genKeys = new Set(examples.map(e => `${e.category}::${e.id}`))
    const byKey = new Map()
    existing.forEach(e => byKey.set(`${e.category}::${e.id}`, e))
    examples = examples.map(ex => {
      const prev = byKey.get(`${ex.category}::${ex.id}`)
      if (!prev) return ex
      return {
        ...ex,
        title: prev.title ?? ex.title,
        description: prev.description ?? ex.description,
        thumbnail: prev.thumbnail ?? ex.thumbnail,
        tags: prev.tags ?? ex.tags,
      }
    })
    // 保留脚本未解析到、但旧 registry 中手动存在的示例（如手加项 / 暂未接入 config 的示例）
    existing.forEach(e => {
      if (!genKeys.has(`${e.category}::${e.id}`)) examples.push(e)
    })
  }

  return {
    source: sourceKey,
    label,
    examples,
  }
}

function writeRegistry(name, data) {
  const outputPath = path.join(projectRoot, 'src', 'examples', 'registry', `${name}.ts`)
  const content = `// 由 scripts/generate-registry.js 生成（仅覆盖 three-cesium-examples 与 cesium-examples 两个源；其余 registry 需手动维护）。
// 合并保护：重跑本脚本会从 public/external-examples 重新解析并覆盖本文件，title/description/thumbnail/tags 等手工改动会被尽量保留，但结构性改动仍可能丢失，建议重跑前先 git diff 确认。

export default ${JSON.stringify(data, null, 2)}
`
  const { written } = writeRegistryGuarded(outputPath, content, parseWriteFlags(), 'generate-registry.js')
  if (written) {
    console.log(`已生成注册表: ${outputPath}，共 ${data.examples.length} 个示例`)
  }
}

console.warn('[generate-registry] 即将覆盖并重新生成 registry 文件（仅 threeCesiumExamples.js 与 cesiumExamples.js）。重跑前请先 git diff/commit 确认，手工改动的条目会被「合并保护」尽量保留。')

;(async () => {
  const threeRegistry = await buildRegistry('threeCesiumExamples', 'threeExamples', 'Three.js 案例', 'three-cesium-examples')
  writeRegistry('threeCesiumExamples', threeRegistry)

  const cesiumRegistry = await buildRegistry('cesiumExamples', 'cesiumExamples', 'Cesium 案例', 'cesium-examples')
  writeRegistry('cesiumExamples', cesiumRegistry)
})()
