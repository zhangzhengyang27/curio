import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const registryPath = path.join(root, 'src/examples/registry/cesiumExamples.js')
const publicDir = path.join(root, 'public')
const componentsDir = path.join(root, 'src/examples/components')

function toPascalCase(id) {
  return id
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toUpperCase())
}

const CONTAINER_PATTERNS = [
  /const\s+box\s*=\s*document\.getElementById\s*\(\s*['"]box['"]\s*\)/,
  /const\s+DOM\s*=\s*document\.getElementById\s*\(\s*['"]box['"]\s*\)/,
  /const\s+cesiumBox\s*=\s*document\.getElementById\s*\(\s*['"]box['"]\s*\)/,
  /const\s+container\s*=\s*document\.getElementById\s*\(\s*['"]box['"]\s*\)/,
]

function findContainerVar(code) {
  for (const pattern of CONTAINER_PATTERNS) {
    const match = code.match(pattern)
    if (match) {
      const varMatch = match[0].match(/const\s+(\w+)\s*=/)
      return varMatch ? varMatch[1] : 'box'
    }
  }
  return 'box'
}

function extractViewerOptions(code, containerVar) {
  const regex = new RegExp(`new\\s+Cesium\\.Viewer\\s*\\(\\s*${containerVar}\\s*,\\s*\\{`)
  const startMatch = code.match(regex)
  if (!startMatch) return { optionsCode: '{}', endIndex: -1 }

  const startIndex = startMatch.index + startMatch[0].length - 1
  let braceCount = 1
  let i = startIndex + 1
  while (i < code.length && braceCount > 0) {
    if (code[i] === '{') braceCount++
    else if (code[i] === '}') braceCount--
    i++
  }

  const optionsCode = code.slice(startIndex, i).trim()
  let stmtEnd = i
  while (stmtEnd < code.length && /[^;\n]/.test(code[stmtEnd])) stmtEnd++
  return { optionsCode, endIndex: stmtEnd }
}

function isCesiumImport(line) {
  return /import\s+.*\s+from\s+['"]cesium['"]/.test(line)
}

function convertExample(example) {
  const { id, category, entry, globals = {} } = example
  const source = example.source ?? 'cesium-examples'
  const jsPath = path.join(publicDir, entry.replace(/^\//, ''))
  if (!fs.existsSync(jsPath)) {
    console.warn(`[skip] JS not found: ${jsPath}`)
    return null
  }

  const code = fs.readFileSync(jsPath, 'utf-8')
  const containerVar = findContainerVar(code)
  const { optionsCode, endIndex } = extractViewerOptions(code, containerVar)
  if (endIndex === -1) {
    console.warn(`[skip] Cannot find Viewer creation in ${id}`)
    return null
  }

  // 提取导入（保留非 Cesium 导入）
  const lines = code.split('\n')
  const importLines = lines.filter((line) => /^\s*import\s+/.test(line) && !isCesiumImport(line))

  // 移除 box/DOM 容器获取行、Cesium import、Viewer 创建语句后的剩余代码
  const bodyCode = code.slice(endIndex).trim()

  // 判断是否包含顶层 await
  const hasTopLevelAwait = /\bawait\b/.test(bodyCode)

  // 处理 FILE_HOST / HOST / GLOBAL_CONFIG 全局变量
  const fileHost = globals.FILE_HOST || '/external-examples/3d-file-server/'
  const host = globals.HOST || '/external-examples/three-cesium-examples/'

  const globalsSetup = `  const FILE_HOST = props.example?.globals?.FILE_HOST || ${JSON.stringify(fileHost)}
  const HOST = props.example?.globals?.HOST || ${JSON.stringify(host)}
  const GLOBAL_CONFIG = {
    getLayerUrl: () => 'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer',
    getFileUrl: (url) => FILE_HOST + url,
    ElMessage: (msg) => console.log('[ElMessage]', msg)
  }`

  // 将 viewerOptions 中的 GLOBAL_CONFIG.getLayerUrl() 替换为具体 URL
  const resolvedOptionsCode = optionsCode.replace(
    /GLOBAL_CONFIG\.getLayerUrl\s*\(\s*\)/g,
    "'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer'"
  )

  // viewerOptions 是否引用 Cesium
  const viewerOptionsNeedsCesium = /\bCesium\b/.test(resolvedOptionsCode)
  const viewerOptionsDecl = viewerOptionsNeedsCesium
    ? `function viewerOptions(Cesium) {
  return ${resolvedOptionsCode}
}`
    : `const viewerOptions = ${resolvedOptionsCode}`

  const vueContent = `<template>
  <CesiumExampleScene
    :viewer-options="viewerOptions"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup>
import CesiumExampleScene from '@/examples/components/CesiumExampleScene.vue'
${importLines.join('\n')}

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

let Cesium = null
let viewer = null

${viewerOptionsDecl}

${hasTopLevelAwait ? 'async ' : ''}function onReady(ctx) {
  Cesium = ctx.cesium
  viewer = ctx.viewer

${globalsSetup}

${bodyCode.split('\n').map(l => '  ' + l).join('\n')}
}

function onBeforeDispose() {
  if (viewer && !viewer.isDestroyed()) {
    try {
      viewer.entities.removeAll()
    } catch (e) {}
  }
  Cesium = null
  viewer = null
}
</script>
`

  return vueContent
}

async function main() {
  const mod = await import(`file://${registryPath}?t=${Date.now()}`)
  const registry = mod.default
  const items = registry.examples.filter((ex) => ex.runner === 'iframe')

  console.log(`[convert] ${items.length} cesium iframe examples to convert`)

  let success = 0
  for (const item of items) {
    const source = item.source ?? registry.source
    const category = item.category
    const id = item.id
    const vueContent = convertExample(item)
    if (!vueContent) continue

    const catDir = path.join(componentsDir, source, category)
    fs.mkdirSync(catDir, { recursive: true })
    const vuePath = path.join(catDir, `${toPascalCase(id)}Example.vue`)
    fs.writeFileSync(vuePath, vueContent)
    console.log(`[created] ${vuePath}`)
    success++
  }

  console.log(`[done] ${success}/${items.length} converted`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
