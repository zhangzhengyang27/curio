import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const registryPath = path.join(root, 'src/examples/registry/threeCesiumExamples.js')
const publicDir = path.join(root, 'public')
const componentsDir = path.join(root, 'src/examples/components')

function toPascalCase(id) {
  return id
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toUpperCase())
}

/**
 * 移除 code 中指定前缀的函数调用（包括嵌套括号），并跳过后续可选分号/空白。
 */
function removeBalancedCall(code, prefix) {
  let output = ''
  let i = 0
  while (i < code.length) {
    const idx = code.indexOf(prefix, i)
    if (idx === -1) {
      output += code.slice(i)
      break
    }
    output += code.slice(i, idx)
    let depth = 1
    let j = idx + prefix.length
    while (j < code.length && depth > 0) {
      if (code[j] === '(') depth++
      else if (code[j] === ')') depth--
      j++
    }
    while (j < code.length && /[;\s]/.test(code[j])) j++
    i = j
  }
  return output
}

const FORBIDDEN_PATTERNS = [
  'CSS2DRenderer',
  'CSS3DRenderer',
  'TransformControls',
  'PhysX',
]

const CONTAINER_PATTERNS = [
  /(?:const|let|var)\s+box\s*=\s*document\.getElementById\s*\(\s*['"]box['"]\s*\)/,
  /(?:const|let|var)\s+DOM\s*=\s*document\.getElementById\s*\(\s*['"]box['"]\s*\)/,
  /(?:const|let|var)\s+container\s*=\s*document\.getElementById\s*\(\s*['"]box['"]\s*\)/,
]

function findContainerVar(code) {
  for (const pattern of CONTAINER_PATTERNS) {
    const match = code.match(pattern)
    if (match) {
      const varMatch = match[0].match(/(?:const|let|var)\s+(\w+)\s*=/)
      return varMatch ? varMatch[1] : 'box'
    }
  }
  return 'box'
}

function extractImportLines(code) {
  const lines = code.split('\n')
  const imports = []
  let inMultiline = false
  for (const line of lines) {
    const isImport = /^\s*import\s+/.test(line)
    if (!isImport && !inMultiline) continue

    if (/OrbitControls/.test(line)) {
      if (line.includes('{') && !line.includes('}')) inMultiline = true
      if (line.includes('}')) inMultiline = false
      continue
    }

    imports.push(line)

    if (line.includes('{') && !line.includes('}')) inMultiline = true
    if (line.includes('}')) inMultiline = false
  }
  return imports
    .map((line) =>
      line.replace(
        /from\s+(['"])three\/addons\/(.+?)\1/g,
        (_, quote, modulePath) => `from ${quote}three/examples/jsm/${modulePath.trim()}${quote}`
      )
    )
    .map((line) => line.trim())
}

function stripImports(code) {
  const lines = code.split('\n')
  const body = []
  let inMultiline = false
  for (const line of lines) {
    const isImport = /^\s*import\s+/.test(line)
    if (!isImport && !inMultiline) {
      body.push(line)
      continue
    }

    if (line.includes('{') && !line.includes('}')) inMultiline = true
    if (line.includes('}')) inMultiline = false
  }
  return body.join('\n')
}

function extractCameraMeta(code) {
  const positionMatch = code.match(/camera\.position\.set\s*\(\s*([^)]+?)\s*\)/)
  const lookAtMatch = code.match(/camera\.lookAt\s*\(\s*([^)]+?)\s*\)/)

  const parseNums = (str) =>
    str
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n))

  return {
    position: positionMatch ? parseNums(positionMatch[1]) : null,
    lookAt: lookAtMatch ? parseNums(lookAtMatch[1]) : null,
  }
}

function extractRendererOptions(code) {
  const match = code.match(/new\s+(?:THREE\.)?WebGLRenderer\s*\(\s*\{([^}]*)\}\s*\)/)
  const opts = {}
  if (!match) return opts

  for (const part of match[1].split(',')) {
    const [k, v] = part.split(':')
    if (!k || !v) continue
    const key = k.trim()
    const val = v.trim()
    if (key === 'antialias' || key === 'alpha' || key === 'logarithmicDepthBuffer') {
      opts[key] = val === 'true'
    } else if (key === 'preserveDrawingBuffer') {
      opts[key] = val === 'true'
    }
  }
  return opts
}

function extractClearColor(code) {
  const match = code.match(/renderer\.setClearColor\s*\(\s*/)
  if (!match) return null

  // 平衡括号提取参数
  let start = match.index + match[0].length
  let depth = 1
  let i = start
  while (i < code.length && depth > 0) {
    if (code[i] === '(') depth++
    else if (code[i] === ')') depth--
    i++
  }

  let arg = code.slice(start, i - 1).trim().replace(/^['"]|['"]$/g, '')

  // 将 new Color(0xffffff) / new THREE.Color(0xffffff) 简化为 0xffffff
  const hexMatch = arg.match(/(?:THREE\.)?Color\s*\(\s*(0x[0-9a-fA-F]+)\s*\)/)
  if (hexMatch) {
    arg = hexMatch[1]
  }

  return arg || null
}

function findBalancedBraceEnd(code, openBraceIndex) {
  let depth = 1
  let i = openBraceIndex + 1
  while (i < code.length && depth > 0) {
    if (code[i] === '{') depth++
    else if (code[i] === '}') depth--
    i++
  }
  return i
}

function transformAnimation(code) {
  const funcRegex = /function\s+(\w+)\s*\(\s*\)\s*\{/g
  const animatedNames = []
  const replacements = []

  let match
  while ((match = funcRegex.exec(code)) !== null) {
    const name = match[1]
    const start = match.index
    const bodyStart = match.index + match[0].length
    const end = findBalancedBraceEnd(code, bodyStart - 1)
    const body = code.slice(bodyStart, end - 1)

    if (!/requestAnimationFrame/.test(body)) continue

    animatedNames.push(name)

    const cleanedBody = body
      .split('\n')
      .filter((line) => {
        const trimmed = line.trim()
        if (!trimmed) return false
        if (/requestAnimationFrame\s*\(\s*\w+\s*\)/.test(trimmed)) return false
        if (/renderer\.render\s*\([^)]*\)/.test(trimmed)) return false
        if (/controls\.update\s*\(\s*\)/.test(trimmed)) return false
        return true
      })
      .join('\n')
      .trim()

    let replacement
    if (!cleanedBody) {
      replacement = ''
    } else {
      replacement = `ctx.addUpdateCallback(() => {\n${cleanedBody
        .split('\n')
        .map((l) => '  ' + l)
        .join('\n')}\n})`
    }
    replacements.push({ start, end, replacement })
  }

  // 从后往前替换，避免索引偏移
  let result = code
  for (let k = replacements.length - 1; k >= 0; k--) {
    const { start, end, replacement } = replacements[k]
    result = result.slice(0, start) + replacement + result.slice(end)
  }

  // 移除顶层的 animate() / render() 调用
  for (const name of animatedNames) {
    const callRegex = new RegExp(`^\\s*${name}\\s*\\(\\s*\\)\\s*;?\\s*$`, 'gm')
    result = result.replace(callRegex, '')
  }

  return result
}

function removeLines(code, patterns) {
  return code
    .split('\n')
    .filter((line) => !patterns.some((p) => p.test(line.trim())))
    .join('\n')
}

function transformClassBased(code) {
  // 检测类模式：代码中存在 this.scene = new THREE.Scene() 或 this.scene = new Scene()
  if (!/this\.scene\s*=\s*new\s+(?:THREE\.)?Scene\s*\(/.test(code)) {
    return code
  }

  let result = code
  // 替换 this 引用为注入的局部变量
  result = result.replace(/\bthis\.scene\b/g, 'scene')
  result = result.replace(/\bthis\.camera\b/g, 'camera')
  result = result.replace(/\bthis\.renderer\b/g, 'renderer')
  result = result.replace(/\bthis\.controls\b/g, 'controls')

  // 移除 scene/camera/renderer/controls 的创建赋值（this.scene = new THREE.Scene() 等）
  result = result.replace(/\bscene\s*=\s*new\s+(?:THREE\.)?Scene\s*\(\s*\)\s*;?/g, '')
  result = result.replace(/\bcamera\s*=\s*new\s+(?:THREE\.)?PerspectiveCamera\s*\([\s\S]*?\)\s*;?/g, '')
  result = result.replace(/\brenderer\s*=\s*new\s+(?:THREE\.)?WebGLRenderer\s*\([\s\S]*?\)\s*;?/g, '')
  result = result.replace(/\bcontrols\s*=\s*new\s+OrbitControls\s*\([\s\S]*?\)\s*;?/g, '')

  // 移除 renderer 设置、挂载与渲染调用
  result = result.replace(/renderer\.setPixelRatio\s*\([^)]*\)\s*;?/g, '')
  result = result.replace(/renderer\.setSize\s*\([^)]*\)\s*;?/g, '')
  result = result.replace(/renderer\.setClearColor\s*\([^)]*\)\s*;?/g, '')
  result = result.replace(/renderer\.setAnimationLoop\s*\([\s\S]*?\)\s*;?/g, '')
  result = result.replace(/document\.body\.appendChild\s*\(\s*renderer\.domElement\s*\)\s*;?/g, '')
  result = result.replace(/renderer\.render\s*\(\s*scene\s*,\s*camera\s*\)\s*;?/g, '')

  // 清理 animate() 方法体中的 controls.update / renderer.render（保留方法本身）
  result = result.replace(
    /(\banimate\s*\(\s*\)\s*\{)([\s\S]*?)(\n\s*\})/,
    (match, head, body, tail) => {
      const cleaned = body
        .replace(/controls\.update\s*\(\s*\)\s*;?/g, '')
        .replace(/renderer\.render\s*\(\s*scene\s*,\s*camera\s*\)\s*;?/g, '')
      return head + cleaned + tail
    }
  )

  // 捕获主类实例化并注册动画回调（仅匹配文件中定义的类名，如 new Base();）
  const classMatch = result.match(/class\s+(\w+)\s*\{/)
  if (classMatch) {
    const className = classMatch[1]
    const instanceRegex = new RegExp(`\\bnew\\s+${className}\\s*\\(\\s*\\)\\s*;?`, 'g')
    result = result.replace(
      instanceRegex,
      `const base = new ${className}();\nctx.addUpdateCallback(() => base.animate())`
    )
  }

  return result
}

function cleanupBody(code, containerVar) {
  const boxRef = containerVar === 'box' ? 'box' : containerVar

  const linePatterns = [
    new RegExp(`^(?:const|let|var)\\s+${boxRef}\\s*=\\s*document\\.getElementById\\s*\\(\\s*['"]box['"]\\s*\\)`),
    /^(?:const|let|var)\s+scene\s*=\s*new\s+(?:THREE\.)?Scene\s*\(\s*\)\s*;?/,
    /^(?:const|let|var)\s+camera\s*=\s*new\s+(?:THREE\.)?PerspectiveCamera\s*\([^)]*\)\s*;?/,
    /^(?:const|let|var)\s+renderer\s*=\s*new\s+(?:THREE\.)?WebGLRenderer\s*\([^)]*\)\s*;?/,
    /^(?:const|let|var)\s+controls\s*=\s*new\s+OrbitControls\s*\([^)]*\)\s*;?/,
    /^renderer\.setSize\s*\([^)]*\)\s*;?/,
    /^renderer\.setPixelRatio\s*\([^)]*\)\s*;?/,
    /^renderer\.render\s*\(\s*scene\s*,\s*camera\s*\)\s*;?/,
    new RegExp(`^${boxRef}\\.appendChild\\s*\\(\\s*renderer\\.domElement\\s*\\)\\s*;?`),
    /^camera\.position\.set\s*\([^)]*\)\s*;?/,
    /^camera\.lookAt\s*\([^)]*\)\s*;?/,
    /^renderer\.setClearColor\s*\([^)]*\)\s*;?/,
    /^composer\.setSize\s*\([^)]*\)\s*;?/,
    /^composer\.setPixelRatio\s*\([^)]*\)\s*;?/,
  ]

  let result = removeLines(code, linePatterns)

  // 处理内联 / 多行的 controls.addEventListener('change', ...)
  result = result.replace(
    /controls\.addEventListener\s*\(\s*['"]change['"]\s*,\s*function\s*\(\s*\)\s*\{[^}]*\}\s*\)\s*;?/g,
    ''
  )
  result = result.replace(
    /controls\.addEventListener\s*\(\s*['"]change['"]\s*,\s*\(\s*\)\s*=>\s*\{[^}]*\}\s*\)\s*;?/g,
    ''
  )

  // 处理 window.onresize / window.addEventListener('resize', ...) 多行代码块
  result = result.replace(
    /window\.onresize\s*=\s*function\s*\(\s*\)\s*\{[\s\S]*?\}\s*;?/g,
    ''
  )
  result = result.replace(
    /window\.onresize\s*=\s*\(\s*\)\s*=>\s*\{[\s\S]*?\}\s*;?/g,
    ''
  )
  result = result.replace(
    /window\.addEventListener\s*\(\s*['"]resize['"]\s*,\s*function\s*\(\s*\)\s*\{[\s\S]*?\}\s*\)\s*;?/g,
    ''
  )
  result = result.replace(
    /window\.addEventListener\s*\(\s*['"]resize['"]\s*,\s*\(\s*\)\s*=>\s*\{[\s\S]*?\}\s*\)\s*;?/g,
    ''
  )
  // 移除命名函数形式的 resize 监听（保留函数定义，避免误删）
  result = result.replace(
    /window\.addEventListener\s*\(\s*['"]resize['"]\s*,\s*\w+\s*(?:,\s*false\s*)?\)\s*;?/g,
    ''
  )

  // 处理 window.addEventListener('load', ...) / window.onload 启动代码
  result = result.replace(
    /window\.addEventListener\s*\(\s*['"]load['"]\s*,\s*function\s*\(\s*\)\s*\{[\s\S]*?\}\s*\)\s*;?/g,
    ''
  )
  result = result.replace(
    /window\.addEventListener\s*\(\s*['"]load['"]\s*,\s*\(\s*\)\s*=>\s*\{[\s\S]*?\}\s*\)\s*;?/g,
    ''
  )
  result = result.replace(
    /window\.onload\s*=\s*function\s*\(\s*\)\s*\{[\s\S]*?\}\s*;?/g,
    ''
  )
  result = result.replace(
    /window\.onload\s*=\s*\(\s*\)\s*=>\s*\{[\s\S]*?\}\s*;?/g,
    ''
  )

  // 处理多行 const/let/var renderer = new THREE.WebGLRenderer({ ... })
  result = result.replace(
    /(?:const|let|var)\s+renderer\s*=\s*new\s+(?:THREE\.)?WebGLRenderer\s*\(\s*\{[\s\S]*?\}\s*\)\s*;?/g,
    ''
  )

  // 处理多行 const/let/var scene/camera/renderer/controls 声明
  result = result.replace(
    /(?:const|let|var)\s+scene\s*=\s*new\s+(?:THREE\.)?Scene\s*\(\s*\)\s*;?/g,
    ''
  )
  result = result.replace(
    /(?:const|let|var)\s+camera\s*=\s*new\s+(?:THREE\.)?PerspectiveCamera\s*\([\s\S]*?\)\s*;?/g,
    ''
  )
  result = result.replace(
    /(?:const|let|var)\s+controls\s*=\s*new\s+OrbitControls\s*\([\s\S]*?\)\s*;?/g,
    ''
  )
  result = result.replace(
    /(?:const|let|var)\s+renderer\s*=\s*new\s+(?:THREE\.)?WebGLRenderer\s*\([\s\S]*?\)\s*;?/g,
    ''
  )

  // 处理已在顶层声明变量、后续再赋值的情况（如 let scene; scene = new THREE.Scene();）
  result = result.replace(/\bscene\s*=\s*new\s+(?:THREE\.)?Scene\s*\(\s*\)\s*;?/g, '')
  result = result.replace(/\bcamera\s*=\s*new\s+(?:THREE\.)?PerspectiveCamera\s*\([\s\S]*?\)\s*;?/g, '')
  result = result.replace(/\brenderer\s*=\s*new\s+(?:THREE\.)?WebGLRenderer\s*\([\s\S]*?\)\s*;?/g, '')
  result = result.replace(/\bcontrols\s*=\s*new\s+OrbitControls\s*\([\s\S]*?\)\s*;?/g, '')

  // 移除 document.body.appendChild(renderer.domElement / canvas) 等重复挂载
  result = result.replace(
    /document\.body\.appendChild\s*\(\s*(?:renderer\.domElement|canvas)\s*\)\s*;?/g,
    ''
  )

  // 移除 new OrbitControls(camera, renderer.domElement) 这种重复创建
  result = result.replace(
    /new\s+OrbitControls\s*\(\s*camera\s*,\s*renderer\.domElement\s*\)\s*;?/g,
    ''
  )

  // 移除 renderer.setAnimationLoop 调用（ExampleScene 已管理渲染循环）
  result = removeBalancedCall(result, 'renderer.setAnimationLoop(')

  // 移除对 document.body 的 ResizeObserver（ExampleScene 已处理容器 resize）
  result = result.replace(
    /new\s+ResizeObserver\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?\}\s*\)\s*\.observe\s*\(\s*document\.body\s*\)\s*;?/g,
    ''
  )
  result = result.replace(
    /new\s+ResizeObserver\s*\(\s*function\s*\(\s*\)\s*\{[\s\S]*?\}\s*\)\s*\.observe\s*\(\s*document\.body\s*\)\s*;?/g,
    ''
  )

  // 移除 document.body 尺寸读取（如果有）
  result = result.replace(/document\.body\.getBoundingClientRect\s*\(\s*\)/g, 'ctx.container?.getBoundingClientRect()')

  return result
}

function convertExample(example) {
  const { id, category, entry, globals = {} } = example
  const source = example.source ?? 'three-cesium-examples'
  const jsPath = path.join(publicDir, entry.replace(/^\//, ''))

  if (!fs.existsSync(jsPath)) {
    console.warn(`[skip] JS not found: ${jsPath}`)
    return null
  }

  const rawCode = fs.readFileSync(jsPath, 'utf-8')

  // 启发式判断是否可转换：支持 `import * as THREE from 'three'` 或 `import { ... } from 'three'`
  const hasNamespaceImport = /import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]/.test(rawCode)
  const hasNamedImport = /import\s*\{[^}]*\}\s*from\s+['"]three['"]/.test(rawCode)
  if (!hasNamespaceImport && !hasNamedImport) {
    console.warn(`[skip] ${id}: no 'import * as THREE from three' or named imports from three`)
    return null
  }

  const sceneCount = (rawCode.match(/new\s+(?:THREE\.)?Scene\s*\(\s*\)/g) || []).length
  const cameraCount = (rawCode.match(/new\s+(?:THREE\.)?PerspectiveCamera\s*\(/g) || []).length
  const rendererCount = (rawCode.match(/new\s+(?:THREE\.)?WebGLRenderer\s*\(/g) || []).length

  if (sceneCount !== 1 || cameraCount !== 1 || rendererCount !== 1) {
    console.warn(`[skip] ${id}: multiple scene/camera/renderer or missing (${sceneCount}, ${cameraCount}, ${rendererCount})`)
    return null
  }

  if (FORBIDDEN_PATTERNS.some((p) => rawCode.includes(p))) {
    console.warn(`[skip] ${id}: contains forbidden pattern`)
    return null
  }

  const containerVar = findContainerVar(rawCode)
  const importLines = extractImportLines(rawCode)
  let bodyCode = stripImports(rawCode)

  const { position, lookAt } = extractCameraMeta(bodyCode)
  const rendererOpts = extractRendererOptions(bodyCode)
  const clearColor = extractClearColor(bodyCode)

  bodyCode = transformClassBased(bodyCode)
  bodyCode = cleanupBody(bodyCode, containerVar)
  bodyCode = transformAnimation(bodyCode)

  // 替换资源全局变量
  bodyCode = bodyCode.replace(/\bHOST\b/g, 'props.example?.globals?.HOST')
  bodyCode = bodyCode.replace(/\bFILE_HOST\b/g, 'props.example?.globals?.FILE_HOST')
  bodyCode = bodyCode.replace(
    /GLOBAL_CONFIG\.getFileUrl\s*\(\s*([^)]+?)\s*\)/g,
    '(props.example?.globals?.FILE_HOST + $1)'
  )

  // 替换 container 尺寸引用（如果有残留）
  bodyCode = bodyCode.replace(
    new RegExp(`\\b${containerVar}\\.clientWidth\\b`, 'g'),
    'ctx.container?.clientWidth'
  )
  bodyCode = bodyCode.replace(
    new RegExp(`\\b${containerVar}\\.clientHeight\\b`, 'g'),
    'ctx.container?.clientHeight'
  )

  // 替换 box/DOM 的事件监听为 ctx.container
  bodyCode = bodyCode.replace(
    new RegExp(`\\b${containerVar}\\.addEventListener\\b`, 'g'),
    'ctx.container?.addEventListener'
  )

  // 将 Stats 面板挂载到 overlay 而不是 body
  bodyCode = bodyCode.replace(
    /document\.body\.appendChild\s*\(\s*stats\.dom\s*\)\s*;?/g,
    'ctx.overlay?.appendChild(stats.dom)'
  )

  // 清理连续空行
  bodyCode = bodyCode.replace(/\n{3,}/g, '\n\n').trim()

  if (!bodyCode) {
    console.warn(`[skip] ${id}: empty body after transformation`)
    return null
  }

  // 移除未初始化的保留变量声明（如 let scene, renderer, camera;）
  const reservedVars = ['scene', 'camera', 'renderer', 'controls', 'ctx']
  bodyCode = bodyCode.replace(
    new RegExp(`\\b(?:const|let|var)\\s+(?:${reservedVars.join('|')})(?:\\s*,\\s*\\w+)*\\s*;?`, 'g'),
    ''
  )

  // 检查变量名冲突（onReady 形参/注入变量与原始代码重复）
  const collisionPattern = new RegExp(`\\b(?:const|let|var)\\s+(?:${reservedVars.join('|')})\\s*=`)
  if (collisionPattern.test(bodyCode)) {
    console.warn(`[skip] ${id}: variable name collision with injected ctx aliases`)
    return null
  }

  // 检查是否还有未清理的 scene/camera/renderer 创建
  if (/new\s+(?:THREE\.)?(Scene|PerspectiveCamera|WebGLRenderer)\s*\(/.test(bodyCode)) {
    console.warn(`[skip] ${id}: leftover scene/camera/renderer creation`)
    return null
  }

  const sceneProps = []
  if (position && position.length === 3) {
    sceneProps.push(`:camera-position="[${position.join(', ')}]"`)
  }
  if (lookAt && lookAt.length === 3) {
    sceneProps.push(`:camera-look-at="[${lookAt.join(', ')}]"`)
  }
  if (clearColor) {
    sceneProps.push(`:clear-color="${clearColor}"`)
  } else if (rendererOpts.alpha) {
    sceneProps.push('alpha')
  }
  if (rendererOpts.antialias) {
    sceneProps.push('antialias')
  }
  if (/new\s+EffectComposer\s*\(/.test(bodyCode)) {
    sceneProps.push('custom-render')
  }

  const bodyWithCtx = `  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

${bodyCode
  .split('\n')
  .map((l) => '  ' + l)
  .join('\n')}`

  const vueContent = `<template>
  <ExampleScene
    camera="perspective"${sceneProps.length ? '\n    ' + sceneProps.join('\n    ') : ''}
    @ready="onReady"
  />
</template>

<script setup>
${importLines.join('\n')}
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

${/\bawait\b/.test(bodyCode) ? 'async ' : ''}function onReady(ctx) {
${bodyWithCtx}
}
</script>
`

  return { source, category, vueContent }
}

async function main() {
  const targetCategory = process.argv[2]
  if (!targetCategory) {
    console.error('Usage: node scripts/convert-three-cesium-examples-to-vue.js <category>')
    console.error('Example: node scripts/convert-three-cesium-examples-to-vue.js threeExamples/animation')
    process.exit(1)
  }

  const mod = await import(`file://${registryPath}?t=${Date.now()}`)
  const registry = mod.default
  const items = registry.examples.filter(
    (ex) => ex.category === targetCategory && ex.runner === 'iframe'
  )

  console.log(`[convert] ${items.length} ${targetCategory} iframe examples to inspect`)

  let success = 0
  for (const item of items) {
    const result = convertExample(item)
    if (!result) continue

    const { source, category, vueContent } = result
    const catDir = path.join(componentsDir, source, category)
    fs.mkdirSync(catDir, { recursive: true })
    const vuePath = path.join(catDir, `${toPascalCase(item.id)}Example.vue`)
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
