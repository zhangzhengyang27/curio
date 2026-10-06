import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  loadExistingExamples,
  parseWriteFlags,
  preserveCuratedFields,
  writeRegistry,
} from './lib/registry-guard.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const examplesRoot = path.join(projectRoot, 'public', 'external-examples', 'earth-lessons')
const componentsDir = path.join(projectRoot, 'src', 'examples', 'components', 'earth-lessons', 'earth-lessons')

function toPascalCase(id) {
  return id
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toUpperCase())
}

function hasVueComponent(id) {
  const pascal = toPascalCase(id)
  return fs.existsSync(path.join(componentsDir, `${pascal}Example.vue`))
}

const titleMap = {
  '05-country-borders': '球面国家边界线',
  '09-railway-lines': '铁路线数据可视化',
  '11-airports': '全球机场标注',
  '13-hotnews': '新闻热点标注',
  '22-gdp-color': '国家 GDP 颜色可视化',
  '23-land-grid': '地球陆地网格点阵特效',
}

function collectExamples() {
  const examples = []
  const entries = fs.readdirSync(examplesRoot).filter((name) => {
    const fullPath = path.join(examplesRoot, name)
    return fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'index.js'))
  })

  for (const entry of entries.sort()) {
    const entryPath = path.join(examplesRoot, entry, 'index.js')
    const relativeEntry = '/' + path.relative(path.join(projectRoot, 'public'), entryPath).replace(/\\/g, '/')
    examples.push({
      id: entry,
      category: 'earth-lessons',
      categoryLabel: '地球可视化教程',
      title: titleMap[entry] || entry,
      description: titleMap[entry] || entry,
      entry: relativeEntry,
      runner: hasVueComponent(entry) ? 'vue' : 'iframe',
      tags: ['earth-lessons', entry],
    })
  }

  return examples
}

const data = {
  source: 'earth-lessons',
  label: '地球可视化教程',
  examples: collectExamples(),
}

const outputPath = path.join(projectRoot, 'src', 'examples', 'registry', 'earthLessons.ts')

// 保留人工/流水线产出的字段（title/description/tags/thumbnail/runner），避免覆盖丢失
const { preserved } = preserveCuratedFields(data.examples, await loadExistingExamples(outputPath))
if (Object.keys(preserved).length) {
  console.log(
    `[registry-guard] 已保留已有字段：${Object.entries(preserved)
      .map(([k, v]) => `${k}×${v}`)
      .join(', ')}`
  )
}

const content = `// 由 scripts/generate-earth-lessons-registry.js 自动生成，请勿手动修改

export default ${JSON.stringify(data, null, 2)}
`

const { written } = writeRegistry(outputPath, content, parseWriteFlags(), 'generate-earth-lessons-registry.js')
if (written) {
  console.log(`已生成注册表: ${outputPath}，共 ${data.examples.length} 个示例`)
}
