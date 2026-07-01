import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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

function buildRegistry(sourceName, label, sourceKey) {
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
    ex.runner = 'iframe'
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

  return {
    source: sourceKey,
    label,
    examples: Array.from(groups.values()).flatMap(g => g.examples),
  }
}

function writeRegistry(name, data) {
  const outputPath = path.join(projectRoot, 'src', 'examples', 'registry', `${name}.js`)
  const content = `// 由 scripts/generate-registry.js 自动生成，请勿手动修改

export default ${JSON.stringify(data, null, 2)}
`
  fs.writeFileSync(outputPath, content, 'utf-8')
  console.log(`已生成注册表: ${outputPath}，共 ${data.examples.length} 个示例`)
}

const threeRegistry = buildRegistry('threeExamples', 'Three.js 案例', 'three-cesium-examples')
writeRegistry('threeCesiumExamples', threeRegistry)

const cesiumRegistry = buildRegistry('cesiumExamples', 'Cesium 案例', 'cesium-examples')
writeRegistry('cesiumExamples', cesiumRegistry)
