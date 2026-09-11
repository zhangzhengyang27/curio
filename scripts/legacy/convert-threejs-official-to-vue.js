import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parse } from '@babel/parser'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const sourceExamplesDir = '/Users/zhangzhengyang/Downloads/three.js-dev/examples'
const componentsDir = path.join(root, 'src/examples/components/threejs-official')
const registryPath = path.join(root, 'src/examples/registry/threejsOfficialExamples.js')

const CATEGORY_LABEL_MAP = {
  'webgl': 'WebGL',
  'webgl/animation': '动画',
  'webgl/buffergeometry': '缓冲几何体',
  'webgl/camera': '相机',
  'webgl/decals': '贴花',
  'webgl/effects': '特效',
  'webgl/geometries': '几何体',
  'webgl/geometry': '几何体',
  'webgl/interactive': '交互',
  'webgl/lights': '光照',
  'webgl/lines': '线条',
  'webgl/loader': '加载器',
  'webgl/loaders': '加载器',
  'webgl/materials': '材质',
  'webgl/math': '数学',
  'webgl/mirror': '镜面',
  'webgl/morphtargets': '变形目标',
  'webgl/multiple': '多视图',
  'webgl/nodes': '节点材质',
  'webgl/particles': '粒子',
  'webgl/points': '点云',
  'webgl/postprocessing': '后期处理',
  'webgl/raycaster': '射线检测',
  'webgl/shaders': '着色器',
  'webgl/shadowmap': '阴影',
  'webgl/skinning': '骨骼动画',
  'webgl/sprites': '精灵',
  'webgl/textures': '纹理',
  'webgl/tonemapping': '色调映射',
  'webgl/transparency': '透明',
  'webgl/video': '视频',
  'misc': '杂项',
  'misc/controls': '控制器',
  'misc/exporter': '导出器',
  'css2d': 'CSS2D',
  'css3d': 'CSS3D',
  'svg': 'SVG',
  'games': '游戏',
  'webaudio': 'Web Audio',
  'webgpu': 'WebGPU',
  'webxr': 'WebXR',
  'physics': '物理引擎',
}

const IFRAME_CATEGORIES = new Set([])

const SKIP_PATTERNS = []

function toPascalCase(str) {
  return str
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toUpperCase())
}

function parseCategory(filename) {
  const base = filename.replace(/\.html$/, '')
  const parts = base.split('_')
  const prefix = parts[0]

  if (prefix === 'games') return { category: 'games', sub: '' }
  if (prefix === 'svg') return { category: 'svg', sub: '' }
  if (['css2d', 'css3d'].includes(prefix)) {
    return { category: prefix, sub: parts.slice(1).join('_') }
  }

  const rest = parts.slice(1)
  const groupHead = rest[0]
  let category = prefix
  let sub = ''

  if (groupHead) {
    sub = rest.join('_')
    category = `${prefix}/${groupHead}`
  }

  return { category, sub }
}

function parseHtml(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf-8')

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/)
  const title = titleMatch ? titleMatch[1].replace(/\n/g, ' ').trim() : ''

  const infoMatch = html.match(/<div\s+id=["']info["'][^>]*>([\s\S]*?)<\/div>/)
  const infoHtml = infoMatch ? infoMatch[1].trim() : ''

  const scriptMatch = html.match(/<script\s+type=["']module["']\s*>([\s\S]*?)<\/script>/)
  const scriptCode = scriptMatch ? scriptMatch[1] : ''

  const importmapMatch = html.match(/<script\s+type=["']importmap["']\s*>([\s\S]*?)<\/script>/)
  let importmap = { imports: {} }
  if (importmapMatch) {
    try {
      importmap = JSON.parse(importmapMatch[1])
    } catch {
      importmap = { imports: {} }
    }
  }

  // Extract inline shader scripts so document.getElementById(id).textContent references can be replaced.
  const shaders = []
  const shaderRegex = /<script\s+type=["']x-shader\/x-(fragment|vertex)["']\s+id=["']([^"']+)["']\s*>([\s\S]*?)<\/script>/g
  let shaderMatch
  while ((shaderMatch = shaderRegex.exec(html)) !== null) {
    shaders.push({
      type: shaderMatch[1],
      id: shaderMatch[2],
      source: shaderMatch[3],
    })
  }

  return { title, infoHtml, scriptCode, importmap, shaders }
}

function extractImports(code, category = '', importmap = { imports: {} }) {
  const lines = code.split('\n')
  const imports = []
  let inMultiline = false

  for (const line of lines) {
    const isImport = /^\s*import\s+/.test(line)
    if (!isImport && !inMultiline) continue

    imports.push(line)

    if (line.includes('{') && !line.includes('}')) inMultiline = true
    if (line.includes('}')) inMultiline = false
  }

  return imports
    .map((line) => {
      if (/from\s+(['"])three\/webgpu\1/.test(line)) return line.trim()
      if (/from\s+(['"])three\/tsl\1/.test(line)) return line.trim()

      // Resolve bare specifiers via the HTML importmap first.
      // Keep the core three package specifiers so they resolve through npm.
      const fromMatch = line.match(/from\s+(['"])([^'"]+)\1/)
      if (fromMatch) {
        const specifier = fromMatch[2]
        if (!/^three(\/|$)/.test(specifier)) {
          let resolved = resolveImportmapSpecifier(specifier, importmap)
          // If the importmap points to an external URL, keep the bare specifier
          // so project aliases / npm dependencies can resolve it.
          if (resolved && /^https?:\/\//.test(resolved)) {
            resolved = specifier
          }
          if (resolved && resolved !== specifier) {
            line = line.replace(
              /from\s+(['"])[^'"]+\1/,
              `from ${fromMatch[1]}${resolved}${fromMatch[1]}`
            )
          }
        }

        // WebGPU examples expect `import * as THREE from 'three'` to resolve to
        // the WebGPU build, which exports node materials and CanvasTarget.
        if (category.startsWith('webgpu') && specifier === 'three') {
          line = line.replace(/from\s+(['"])three\1/, `from $1three/webgpu$1`)
        }
      }

      return line
        .replace(
          /from\s+(['"])three\/addons\/(.+?)\1/g,
          (_, quote, modulePath) => `from ${quote}three/examples/jsm/${modulePath.trim()}${quote}`
        )
        .replace(
          /from\s+(['"])\.\/jsm\/(.+?)\1/g,
          (_, quote, modulePath) => `from ${quote}three/examples/jsm/${modulePath.trim()}${quote}`
        )
    })
    .map((line) => line.trim())
}

function resolveImportmapSpecifier(specifier, importmap) {
  if (!importmap || !importmap.imports) return specifier
  const mappings = importmap.imports

  // Exact match
  if (mappings[specifier]) return mappings[specifier]

  // Prefix match (importmap supports trailing-slash prefixes)
  for (const [key, value] of Object.entries(mappings)) {
    if (key.endsWith('/') && specifier.startsWith(key)) {
      return value + specifier.slice(key.length)
    }
  }

  return specifier
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

function splitTopLevelCommas(text) {
  const parts = []
  let depth = 0
  let current = ''
  let inString = false
  let stringChar = ''

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const prev = text[i - 1]

    if (inString) {
      current += ch
      if (ch === stringChar && prev !== '\\') inString = false
      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true
      stringChar = ch
      current += ch
      continue
    }

    if (ch === '(' || ch === '[' || ch === '{') {
      depth++
    } else if (ch === ')' || ch === ']' || ch === '}') {
      depth--
    }

    if (ch === ',' && depth === 0) {
      parts.push(current)
      current = ''
    } else {
      current += ch
    }
  }

  if (current !== '') parts.push(current)
  return parts
}

function extractIdentifier(entry) {
  const trimmed = entry.trim()
  const m = trimmed.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/)
  return m ? m[0] : ''
}

function extractAllDeclaredNames(code) {
  const names = new Set()
  const lines = code.split('\n')
  let buffer = ''
  let inDecl = false

  for (const line of lines) {
    const declStartMatch = line.match(/^\s*(?:const|let|var)\s+/)
    if (declStartMatch && !inDecl) {
      inDecl = true
      buffer = line
    } else if (inDecl) {
      buffer += '\n' + line
    }

    if (inDecl) {
      // Track brace/paren/bracket balance while ignoring strings.
      let depth = 0
      let inString = false
      let stringChar = ''
      for (let i = 0; i < buffer.length; i++) {
        const ch = buffer[i]
        const prev = buffer[i - 1]
        if (inString) {
          if (ch === stringChar && prev !== '\\') inString = false
          continue
        }
        if (ch === "'" || ch === '"' || ch === '`') {
          inString = true
          stringChar = ch
          continue
        }
        if (ch === '(' || ch === '[' || ch === '{') depth++
        else if (ch === ')' || ch === ']' || ch === '}') depth--
      }

      const trimmedLine = line.trim()
      if (trimmedLine.endsWith(';') && depth === 0) {
        const declPart = buffer.replace(/^\s*(?:const|let|var)\s+/, '').replace(/;\s*$/, '')
        splitTopLevelCommas(declPart).forEach((part) => {
          const name = extractIdentifier(part)
          if (name) names.add(name)
        })
        inDecl = false
        buffer = ''
      }
    }
  }

  return names
}

function findTopLevelSemicolon(code, start) {
  let depth = 0
  let inString = false
  let stringChar = ''

  for (let i = start; i < code.length; i++) {
    const ch = code[i]
    const prev = code[i - 1]

    if (inString) {
      if (ch === stringChar && prev !== '\\') inString = false
      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true
      stringChar = ch
      continue
    }

    if (ch === '(' || ch === '[' || ch === '{') {
      depth++
    } else if (ch === ')' || ch === ']' || ch === '}') {
      depth--
    }

    if (ch === ';' && depth === 0) return i
  }

  return code.length
}

function removeBaseVarDeclarations(code, features = {}) {
  const baseVars = new Set(['camera', 'scene', 'renderer'])
  if (!features.customControls && !features.controlsObject) {
    baseVars.add('controls')
  }
  // Only OrbitControls is provided by the base scene. Other control types
  // (TrackballControls, FlyControls, etc.) are created by the example itself
  // when customControls is true, so they must not be treated as base constructors.
  const baseControlsCtor = features.customControls ? '' : '|OrbitControls'
  const baseConstructors = new RegExp('new\\s+(?:(?:THREE\\.)?(?:PerspectiveCamera|OrthographicCamera|WebGLRenderer|WebGPURenderer|CSS3DRenderer|SVGRenderer|Scene)' + baseControlsCtor + ')\\s*\\(')

  const declRegex = /(^|\n)(\s*)(?:const|let|var)\s+/g
  let result = code
  const replacements = []

  let match
  while ((match = declRegex.exec(code)) !== null) {
    const declStart = match.index + match[1].length
    const indent = match[2]
    const varStart = match.index + match[0].length
    const semi = findTopLevelSemicolon(code, varStart)
    const declEnd = semi + 1
    const fullDecl = code.slice(declStart, declEnd)
    const listText = code.slice(varStart, semi)

    const entries = splitTopLevelCommas(listText)
    const kept = []
    let hasBaseVar = false

    for (const entry of entries) {
      const id = extractIdentifier(entry)
      if (baseVars.has(id)) {
        hasBaseVar = true
        // Drop base-var declarations that either declare without an initializer
        // (the base scene provides them) or create base objects the base scene already owns.
        // Keep base vars with other initializers (e.g. controls = { ... }) so user data is preserved.
        const hasInitializer = /=\s*/.test(entry)
        if (!hasInitializer || baseConstructors.test(entry)) continue
      }
      kept.push(entry.trim())
    }

    if (!hasBaseVar) continue

    if (kept.length === 0) {
      replacements.push({ start: declStart, end: declEnd, text: '' })
    } else {
      replacements.push({ start: declStart, end: declEnd, text: `${indent}let ${kept.join(', ')};` })
    }
  }

  for (let k = replacements.length - 1; k >= 0; k--) {
    const { start, end, text } = replacements[k]
    result = result.slice(0, start) + text + result.slice(end)
  }

  return result
}

function removeBaseVarsFromDeclaration(line) {
  // Kept for backward compatibility; multi-line declarations are handled by removeBaseVarDeclarations.
  const match = line.match(/^(\s*)(?:const|let|var)\s+([^;]+)\s*;?\s*$/)
  if (!match) return line

  const baseVars = new Set(['camera', 'scene', 'renderer', 'controls'])
  const vars = splitTopLevelCommas(match[2]).map((s) => s.trim()).filter(Boolean)
  const hasBaseVar = vars.some((v) => baseVars.has(extractIdentifier(v)))
  if (!hasBaseVar) return line

  const filtered = vars.filter((v) => !baseVars.has(extractIdentifier(v)))
  if (filtered.length === 0) return ''
  return `${match[1]}let ${filtered.map((s) => s.trim()).join(', ')};`
}

function cleanupBody(code, features = {}) {
  const linePatterns = [
    /^(?:const|let|var)\s+scene\s*=\s*new\s+(?:THREE\.)?Scene\s*\(\s*\)\s*;?/,
    /^(?:const|let|var)\s+camera\s*=\s*new\s+(?:THREE\.)?PerspectiveCamera\s*\([^)]*\)\s*;?/,
    /^(?:const|let|var)\s+camera\s*=\s*new\s+(?:THREE\.)?OrthographicCamera\s*\([^)]*\)\s*;?/,
    /^(?:const|let|var)\s+renderer\s*=\s*new\s+(?:THREE\.)?WebGLRenderer\s*\(\s*\{[^}]*\}\s*\)\s*;?/,
    /^(?:const|let|var)\s+renderer\s*=\s*new\s+(?:THREE\.)?WebGLRenderer\s*\(\s*\)\s*;?/,
    /^(?:const|let|var)\s+renderer\s*=\s*new\s+(?:THREE\.)?WebGPURenderer\s*\(\s*\{[^}]*\}\s*\)\s*;?/,
    /^(?:const|let|var)\s+renderer\s*=\s*new\s+(?:THREE\.)?WebGPURenderer\s*\(\s*\)\s*;?/,
    /^(?:const|let|var)\s+renderer\s*=\s*new\s+(?:THREE\.)?CSS3DRenderer\s*\(\s*\)\s*;?/,
    /^(?:const|let|var)\s+renderer\s*=\s*new\s+(?:THREE\.)?SVGRenderer\s*\(\s*\)\s*;?/,
    /^(?:const|let|var)\s+controls\s*=\s*new\s+(?:OrbitControls)\s*\([^)]*\)\s*;?/,
    /^renderer\.setSize\s*\([^)]*\)\s*;?/,
    /^renderer\.setPixelRatio\s*\([^)]*\)\s*;?/,
    /^renderer\.setQuality\s*\([^)]*\)\s*;?/,
    /^renderer\.render\s*\(\s*scene\s*,\s*camera\s*\)\s*;?/,
    /^document\.body\.appendChild\s*\(\s*(?:renderer\.domElement|canvas)\s*\)\s*;?/,
    /^document\.getElementById\s*\(\s*['"][^'"]+['"]\s*\)\.appendChild\s*\(\s*renderer\.domElement\s*\)\s*;?/,
    /^(?:\w+)\.appendChild\s*\(\s*renderer\.domElement\s*\)\s*;?/,
    /^camera\.position\.set\s*\([^)]*\)\s*;?/,
    /^camera\.lookAt\s*\([^)]*\)\s*;?/,
    /^composer\.setSize\s*\([^)]*\)\s*;?/,
    /^composer\.setPixelRatio\s*\([^)]*\)\s*;?/,
  ]

  // Remove module-level export keywords that become invalid when code is moved
  // inside the onReady function body.
  let result = code.replace(/\bexport\s+(const|let|var|function|async\s+function|class)\b/g, '$1')

  result = result
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      if (linePatterns.some((p) => p.test(trimmed))) return ''
      return line
    })
    .join('\n')

  // Remove multi-line and expression-safe base variable declarations.
  result = removeBaseVarDeclarations(result)

  // Remove multi-line WebGLRenderer / WebGPURenderer / CSS3DRenderer / SVGRenderer creation
  result = result.replace(
    /(?:const|let|var)\s+renderer\s*=\s*new\s+(?:THREE\.)?WebGLRenderer\s*\(\s*\{[\s\S]*?\}\s*\)\s*;?/g,
    ''
  )
  result = result.replace(
    /(?:const|let|var)\s+renderer\s*=\s*new\s+(?:THREE\.)?WebGPURenderer\s*\(\s*\{[\s\S]*?\}\s*\)\s*;?/g,
    ''
  )

  // Remove scene/camera/renderer/controls creation with separate assignment
  result = result.replace(/(?<![\w.])scene\s*=\s*new\s+(?:THREE\.)?Scene\s*\(\s*\)\s*;?/g, '')
  result = result.replace(/(?<![\w.])camera\s*=\s*new\s+(?:THREE\.)?PerspectiveCamera\s*\([^)]*\)\s*;?/g, '')
  result = result.replace(/(?<![\w.])camera\s*=\s*new\s+(?:THREE\.)?OrthographicCamera\s*\([^)]*\)\s*;?/g, '')
  result = result.replace(/(?<![\w.])renderer\s*=\s*new\s+(?:THREE\.)?WebGLRenderer\s*\([^)]*\)\s*;?/g, '')
  result = result.replace(/(?<![\w.])renderer\s*=\s*new\s+(?:THREE\.)?WebGPURenderer\s*\([^)]*\)\s*;?/g, '')
  result = result.replace(/(?<![\w.])renderer\s*=\s*new\s+(?:THREE\.)?CSS3DRenderer\s*\(\s*\)\s*;?/g, '')
  result = result.replace(/(?<![\w.])renderer\s*=\s*new\s+(?:THREE\.)?SVGRenderer\s*\(\s*\)\s*;?/g, '')
  result = result.replace(/(?<![\w.])controls\s*=\s*new\s+(?:OrbitControls)\s*\([^)]*\)\s*;?/g, '')

  // Remove renderer.setAnimationLoop calls
  result = removeBalancedCall(result, 'renderer.setAnimationLoop(')

  // Remove window resize listeners
  result = result.replace(/window\.addEventListener\s*\(\s*['"]resize['"]\s*,\s*onWindowResize\s*\)\s*;?/g, '')
  result = result.replace(/window\.addEventListener\s*\(\s*['"]resize['"]\s*,\s*\w+\s*\)\s*;?/g, '')
  result = result.replace(/window\.onresize\s*=\s*function\s*\(\s*\)\s*\{[\s\S]*?\}\s*;?/g, '')
  result = result.replace(/window\.onresize\s*=\s*\(\s*\)\s*=>\s*\{[\s\S]*?\}\s*;?/g, '')

  // Remove window load listeners
  result = result.replace(/window\.addEventListener\s*\(\s*['"]load['"]\s*,\s*function\s*\(\s*\)\s*\{[\s\S]*?\}\s*\)\s*;?/g, '')
  result = result.replace(/window\.addEventListener\s*\(\s*['"]load['"]\s*,\s*\(\s*\)\s*=>\s*\{[\s\S]*?\}\s*\)\s*;?/g, '')
  result = result.replace(/window\.onload\s*=\s*function\s*\(\s*\)\s*\{[\s\S]*?\}\s*;?/g, '')
  result = result.replace(/window\.onload\s*=\s*\(\s*\)\s*=>\s*\{[\s\S]*?\}\s*;?/g, '')

  // Replace container/body stats mount
  result = result.replace(
    /(?:document\.body|container|\w+)\.appendChild\s*\(\s*stats\.dom\s*\)\s*;?/g,
    '__stage.overlay?.appendChild(stats.dom)'
  )

  // Replace window inner dimensions
  result = result.replace(/\bwindow\.innerWidth\b/g, '(__stage.container?.clientWidth || window.innerWidth)')
  result = result.replace(/\bwindow\.innerHeight\b/g, '(__stage.container?.clientHeight || window.innerHeight)')

  // Replace resource paths (support both `fonts/...` and `./fonts/...`)
  result = result.replace(
    /(['"])\.?\/?((?:models|textures|sounds|fonts|luts|materialx|files|screenshots)\/[^'"]+)\1/g,
    "ASSET_HOST + '$2'"
  )

  // Replace document.body.getBoundingClientRect
  result = result.replace(/document\.body\.getBoundingClientRect\s*\(\s*\)/g, '__stage.container?.getBoundingClientRect()')

  // Remove container creation + body append that conflicts with ExampleScene base
  result = result.replace(
    /(?:const|let|var)?\s*\bcontainer\s*=\s*document\.createElement\s*\(\s*['"]div['"]\s*\)\s*;?\s*\n?\s*document\.body\.appendChild\s*\(\s*container\s*\)\s*;?/g,
    ''
  )

  return result
}

function addImplicitGlobalDeclarations(code, features = {}) {
  const reservedGlobals = new Set([
    'window', 'document', 'console', 'navigator', 'screen', 'location',
    'THREE', 'Math', 'Date', 'setTimeout', 'setInterval', 'requestAnimationFrame',
    '__stage', 'ctx', 'scene', 'camera', 'renderer', 'props',
  ])
  // When the example creates its own custom controls (e.g. TrackballControls),
  // controls is not provided by the base scene and must be declared locally.
  if (!features.customControls && !features.controlsObject) {
    reservedGlobals.add('controls')
  }

  // Match assignments like "foo = ...", "foo += ..." at statement start
  const assignmentRegex = /(?:^|;)\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:\+|-)?\s*=(?!=)\s*/gm
  const assigned = new Set()

  let match
  while ((match = assignmentRegex.exec(code)) !== null) {
    const name = match[1]
    if (reservedGlobals.has(name)) continue
    assigned.add(name)
  }

  // Remove names that are already declared (supports multi-var and initializers)
  const declaredNames = extractAllDeclaredNames(code)

  // Collect function parameters so they are not re-declared
  const funcParamRegex = /function\s+\w+\s*\(\s*([^)]*)\s*\)/g
  let paramMatch
  while ((paramMatch = funcParamRegex.exec(code)) !== null) {
    paramMatch[1].split(',').forEach((p) => {
      const name = p.trim().match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/)?.[0]
      if (name) declaredNames.add(name)
    })
  }

  for (const name of declaredNames) {
    assigned.delete(name)
  }

  if (assigned.size === 0) return code

  const declarations = Array.from(assigned)
    .sort()
    .map((name) => `let ${name};`)
    .join('\n')

  return declarations + '\n' + code
}

function removeDuplicateDeclarations(code) {
  // Remove isolated `let name;` declarations when the same name is declared again later
  // with an initializer or in a multi-variable declaration.
  const lines = code.split('\n')
  const otherDeclRegexCache = new Map()

  function hasOtherDeclaration(name, targetLine) {
    const regex = otherDeclRegexCache.get(name) || new RegExp(`\\b(?:const|let|var)\\s+[^;]*\\b${name}\\b[^;]*=[^;]*;`, 'g')
    otherDeclRegexCache.set(name, regex)
    regex.lastIndex = 0
    const matches = Array.from(code.matchAll(regex))
    return matches.some((m) => m[0].trim() !== targetLine.trim())
  }

  return lines
    .map((line) => {
      const isolatedMatch = line.match(/^(\s*)let\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*;\s*$/)
      if (!isolatedMatch) return line
      const name = isolatedMatch[2]
      if (hasOtherDeclaration(name, line)) return ''
      return line
    })
    .join('\n')
}

function flattenInitFunction(code) {
  // Keep the init() function as a nested function instead of flattening its body.
  // Flattening pollutes the onReady scope and causes duplicate declarations when
  // the same name is declared both outside and inside init (e.g. const color, geometry).
  // The original init(); call is preserved so the setup still runs.
  console.log('[flattenInitFunction] keeping init(), code length', code.length, 'has init():', /function init\(\)/.test(code))
  return code
}

function removeBalancedBlock(code, prefix) {
  const start = code.indexOf(prefix)
  if (start === -1) return code

  let brace = code.indexOf('{', start + prefix.length)
  if (brace === -1) return code

  let depth = 1
  let end = brace + 1
  while (end < code.length && depth > 0) {
    if (code[end] === '{') depth++
    else if (code[end] === '}') depth--
    end++
  }

  return code.slice(0, start) + code.slice(end)
}

function removeUnusedResizeFunction(code) {
  // Remove onWindowResize function definition if no listener remains
  if (/window\.addEventListener\s*\(\s*['"]resize['"]/.test(code)) return code

  return removeBalancedBlock(code, 'function onWindowResize()')
}

function extractAnimationFunctionNames(code) {
  const names = new Set()

  // renderer.setAnimationLoop(animate)
  const setLoopMatch = code.match(/renderer\.setAnimationLoop\s*\(\s*(\w+)\s*\)/)
  if (setLoopMatch) names.add(setLoopMatch[1])

  // requestAnimationFrame(animate)
  const rafMatches = code.matchAll(/requestAnimationFrame\s*\(\s*(\w+)\s*\)/g)
  for (const m of rafMatches) names.add(m[1])

  return Array.from(names)
}

function extractFunctionMap(code) {
  const map = new Map()

  let ast
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['topLevelAwait'],
    })
  } catch {
    return map
  }

  for (const node of ast.program.body) {
    if (node.type !== 'FunctionDeclaration') continue
    const name = node.id?.name
    if (!name) continue

    const start = node.start
    const end = node.end
    const bodyStart = node.body.start
    const bodyEnd = node.body.end
    const body = code.slice(bodyStart + 1, bodyEnd - 1)

    map.set(name, { start, end, body, isAsync: node.async })
  }

  return map
}

function findCalledFunctions(body, functionMap) {
  const called = new Set()
  const callRegex = /\b(\w+)\s*\(\s*\)\s*;?/g
  let m
  while ((m = callRegex.exec(body)) !== null) {
    if (functionMap.has(m[1])) called.add(m[1])
  }
  return called
}

function isStatementLevelCall(body, callStart, callEnd) {
  // Call is at statement level if it is preceded by start of body, ';', or '{'.
  // This avoids inlining helpers whose return value is used inside expressions/if conditions.
  let prev = callStart - 1
  while (prev >= 0 && /\s/.test(body[prev])) prev--
  if (prev < 0) return true
  const prevCh = body[prev]
  return prevCh === ';' || prevCh === '{' || prevCh === '}'
}

function inlineFunctionCalls(body, functionMap, visited = new Set()) {
  let result = body
  const calls = []
  const callRegex = /\b(\w+)\s*\(\s*\)\s*;/g
  let m
  while ((m = callRegex.exec(body)) !== null) {
    const name = m[1]
    if (functionMap.has(name) && !visited.has(name)) {
      const callStart = m.index
      const callEnd = m.index + m[0].length
      if (isStatementLevelCall(body, callStart, callEnd)) {
        calls.push({ name, index: callStart, match: m[0] })
      }
    }
  }

  for (let i = calls.length - 1; i >= 0; i--) {
    const { name, index, match } = calls[i]
    const func = functionMap.get(name)
    const inlined = inlineFunctionCalls(func.body, functionMap, new Set([...visited, name]))
    result = result.slice(0, index) + '\n{\n' + inlined.trim() + '\n}\n' + result.slice(index + match.length)
  }

  return result
}

function transformAnimation(code, knownAnimatedNames = [], keepRenderCalls = false) {
  const functionMap = extractFunctionMap(code)
  // A real loop signal is requestAnimationFrame or stats.update; renderer.render is just a render call
  const hasLoopSignal = (body) => /requestAnimationFrame|stats\.update/.test(body)

  // Identify top-level animation functions (driven by setAnimationLoop / requestAnimationFrame)
  const topLevelAnimated = new Set(knownAnimatedNames)

  // Fallback: if no explicit loop driver was found, auto-detect by loop signal
  if (topLevelAnimated.size === 0) {
    for (const [name, { body }] of functionMap.entries()) {
      if (hasLoopSignal(body)) {
        topLevelAnimated.add(name)
      }
    }
  }

  // Helpers are functions called by top-level animation functions (including render-only helpers)
  const helpers = new Set()
  let changed = true
  while (changed) {
    changed = false
    for (const [name, { body }] of functionMap.entries()) {
      if (topLevelAnimated.has(name)) continue
      for (const topName of topLevelAnimated) {
        if (!functionMap.has(topName)) continue
        const topBody = functionMap.get(topName).body
        if (findCalledFunctions(topBody, functionMap).has(name) && !helpers.has(name)) {
          helpers.add(name)
          changed = true
        }
      }
      for (const helperName of helpers) {
        if (!functionMap.has(helperName)) continue
        const helperBody = functionMap.get(helperName).body
        if (findCalledFunctions(helperBody, functionMap).has(name) && !helpers.has(name)) {
          helpers.add(name)
          changed = true
        }
      }
    }
  }

  // Convert only top-level animation functions, inlining helpers
  const replacements = []
  for (const [name, { start, end, body, isAsync }] of functionMap.entries()) {
    if (!topLevelAnimated.has(name)) continue

    const visited = new Set([name])
    // Skip inlining helper calls for now; it can produce mismatched braces when
    // helpers are called inside control-flow blocks. Helper functions remain in
    // the generated component and are called from the update callback.
    let newBody = body

    const cleanedBody = newBody
      .split('\n')
      .filter((line) => {
        const trimmed = line.trim()
        if (!trimmed) return false
        if (/requestAnimationFrame\s*\(\s*\w+\s*\)/.test(trimmed)) return false
        if (!keepRenderCalls && /renderer\.render\s*\([^)]*\)/.test(trimmed)) return false
        if (/(?<![\w.])controls\.update\s*\(\s*\)/.test(trimmed)) return false
        return true
      })
      .join('\n')
      .trim()

    if (!cleanedBody) continue

    const replacement = `__stage.addUpdateCallback(${isAsync ? 'async ' : ''}(_delta, _elapsed) => {\n${cleanedBody
      .split('\n')
      .map((l) => '  ' + l)
      .join('\n')}\n})`

    replacements.push({ start, end, replacement })
  }

  let result = code
  for (let k = replacements.length - 1; k >= 0; k--) {
    const { start, end, replacement } = replacements[k]
    result = result.slice(0, start) + replacement + result.slice(end)
  }

  for (const name of topLevelAnimated) {
    const callRegex = new RegExp(`^\\s*${name}\\s*\\(\\s*\\)\\s*;?\\s*$`, 'gm')
    result = result.replace(callRegex, '')
  }

  return result
}

function detectRendererOptions(code) {
  const opts = { antialias: false, alpha: false, preserveDrawingBuffer: false }
  const match = code.match(/new\s+(?:THREE\.)?(WebGLRenderer|WebGPURenderer)\s*\(\s*\{([^}]*)\}\s*\)/)
  if (!match) return opts

  const src = match[2]
  if (/antialias\s*:\s*true/.test(src)) opts.antialias = true
  if (/alpha\s*:\s*true/.test(src)) opts.alpha = true
  if (/preserveDrawingBuffer\s*:\s*true/.test(src)) opts.preserveDrawingBuffer = true
  return opts
}

function extractCameraPosition(code) {
  const setMatch = code.match(/camera\.position\.set\s*\(\s*([^)]+?)\s*\)/)
  if (setMatch) {
    const nums = setMatch[1]
      .split(',')
      .map((s) => Number(s.replace(/\s+/g, '').trim()))
      .filter((n) => !Number.isNaN(n))
    if (nums.length === 3) return nums
  }

  const axisMap = { x: null, y: null, z: null }
  const axisRegex = /camera\.position\.(x|y|z)\s*=\s*([+-]?\d+(?:\.\d+)?)\s*;?/g
  let m
  while ((m = axisRegex.exec(code)) !== null) {
    axisMap[m[1]] = Number(m[2])
  }
  const vals = [axisMap.x, axisMap.y, axisMap.z]
  if (vals.every((v) => v !== null)) return vals
  return null
}

function extractCameraLookAt(code) {
  const match = code.match(/camera\.lookAt\s*\(\s*([^)]+?)\s*\)/)
  if (!match) return null
  const nums = match[1].split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n))
  return nums.length === 3 ? nums : null
}

function extractCameraOptions(code) {
  const opts = {}
  const match = code.match(/new\s+(?:THREE\.)?PerspectiveCamera\s*\(\s*([^)]*)\s*\)/)
  if (!match) return opts

  const parts = match[1].split(',').map((s) => s.trim())
  const fov = Number(parts[0])
  const near = parts.length >= 3 ? Number(parts[2]) : NaN
  const far = parts.length >= 4 ? Number(parts[3]) : NaN

  if (!Number.isNaN(fov)) opts.fov = fov
  if (!Number.isNaN(near)) opts.near = near
  if (!Number.isNaN(far)) opts.far = far
  return opts
}

function extractClearColor(code) {
  const match = code.match(/renderer\.setClearColor\s*\(\s*([^)]+?)\s*\)/)
  if (!match) return null
  const arg = match[1].trim()
  const hexMatch = arg.match(/(0x[0-9a-fA-F]+)/)
  if (hexMatch) return hexMatch[1]
  if (/^['"]/.test(arg)) return arg
  return null
}

function detectSpecialFeatures(code) {
  const customControls = /new\s+(?:TrackballControls|FirstPersonControls|FlyControls|ArcballControls|MapControls|DragControls|TransformControls|PointerLockControls)\s*\(/.test(code)
  const controlsObject = /(?:const|let|var)\s+controls\s*=\s*\{/.test(code)
  return {
    customRender: /new\s+EffectComposer\s*\(/.test(code) || /renderer\.setScissorTest\s*\(\s*true\s*\)/.test(code),
    css2d: /CSS2DRenderer|CSS2DObject/.test(code),
    css3d: /CSS3DRenderer|CSS3DObject/.test(code),
    needsOrbitControls: /OrbitControls/.test(code) && !controlsObject,
    customControls: customControls,
    controlsObject: controlsObject,
    controlsFunction: /function\s+controls\s*\(/.test(code),
    needsStats: /new\s+Stats\s*\(/.test(code),
    needsGui: /new\s+(?:dat\.)?GUI\s*\(/.test(code) || /new\s+GUI\s*\(/.test(code),
    customCamera: /new\s+(?:THREE\.)?(?:ArrayCamera|CubeCamera|StereoCamera)\s*\(/.test(code),
    cameraReassigned: /(^|;)\s*camera\s*(?:\+|-)?\s*=\s*(?!=)/m.test(code),
    sceneReassigned: /(^|;)\s*scene\s*(?:\+|-)?\s*=\s*(?!=)/m.test(code),
    rendererReassigned: /(^|;)\s*renderer\s*(?:\+|-)?\s*=\s*(?!=)/m.test(code),
    controlsReassigned: /(^|;)\s*controls\s*(?:\+|-)?\s*=\s*(?!=)/m.test(code),
  }
}

function buildVueTemplate(props, baseScene = 'ExampleScene') {
  const isWebGL = baseScene === 'ExampleScene'
  const isWebGPU = baseScene === 'WebGPUExampleScene'
  const isWebXR = baseScene === 'WebXRExampleScene'
  const supportsRenderer = isWebGL || isWebGPU || isWebXR

  const lines = [`<${baseScene}`, '    camera="perspective"']

  if (supportsRenderer && props.antialias) lines.push('    antialias')
  if (supportsRenderer && props.alpha) lines.push('    alpha')
  if (supportsRenderer && props.preserveDrawingBuffer) lines.push('    preserve-drawing-buffer')
  if (supportsRenderer && props.clearColor) lines.push(`    :clear-color="${props.clearColor}"`)
  if (props.cameraPosition) lines.push(`    :camera-position="[${props.cameraPosition.join(', ')}]"`)
  if (props.cameraLookAt) lines.push(`    :camera-look-at="[${props.cameraLookAt.join(', ')}]"`)
  if (props.cameraOptions && Object.keys(props.cameraOptions).length) {
    const optStr = Object.entries(props.cameraOptions)
      .map(([k, v]) => `${k}: ${typeof v === 'string' ? `'${v}'` : v}`)
      .join(', ')
    lines.push(`    :camera-options="{ ${optStr} }"`)
  }
  if (supportsRenderer && props.customRender) lines.push('    custom-render')
  if (isWebGL && props.cssRenderer) lines.push(`    css-renderer="${props.cssRenderer}"`)
  if (props.enableControls === false) lines.push('    :enable-controls="false"')

  lines.push('    @ready="onReady"')
  if (props.handleResize) lines.push('    @resize="onResize"')
  lines.push('  />')

  return lines.join('\n')
}

function generateVueComponent(id, title, scriptCode, infoHtml, category = '', shaders = [], importmap = { imports: {} }) {
  const baseScene = detectBaseScene(category, scriptCode)
const baseSceneImport = baseScene === 'WebGPUExampleScene'
  ? "import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'"
  : baseScene === 'WebXRExampleScene'
  ? "import WebXRExampleScene from '@/examples/components/WebXRExampleScene.vue'"
  : baseScene === 'CSS3DExampleScene'
  ? "import CSS3DExampleScene from '@/examples/components/CSS3DExampleScene.vue'"
  : baseScene === 'SVGExampleScene'
  ? "import SVGExampleScene from '@/examples/components/SVGExampleScene.vue'"
  : "import ExampleScene from '@/examples/components/ExampleScene.vue'"
  const importLines = extractImports(scriptCode, category, importmap)
  let bodyCode = stripImports(scriptCode)

  const animatedNames = extractAnimationFunctionNames(bodyCode)
  const features = detectSpecialFeatures(scriptCode)
  bodyCode = cleanupBody(bodyCode, features)
  bodyCode = flattenInitFunction(bodyCode)
  bodyCode = removeUnusedResizeFunction(bodyCode)
  bodyCode = transformAnimation(bodyCode, animatedNames, features.customRender)

  // Embed inline shader sources and replace DOM lookups with const references.
  const shaderDeclarations = []
  for (const shader of shaders) {
    const safeId = shader.id.replace(/[^a-zA-Z0-9_$]/g, '_')
    shaderDeclarations.push(`const ${safeId} = ${JSON.stringify(shader.source)};`)
    const domRegex = new RegExp(
      "document\\.getElementById\\(\\s*['\"`]" + shader.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "['\"`]\\s*\\)\\.textContent",
      'g'
    )
    bodyCode = bodyCode.replace(domRegex, safeId)
  }
  if (shaderDeclarations.length) {
    bodyCode = shaderDeclarations.join('\n') + '\n' + bodyCode
  }

  bodyCode = addImplicitGlobalDeclarations(bodyCode, features)
  bodyCode = removeDuplicateDeclarations(bodyCode)

  // WebGPU 基座已调用 renderer.init()，移除示例中的重复调用
  if (baseScene === 'WebGPUExampleScene') {
    bodyCode = bodyCode.replace(/await\s+renderer\.init\s*\(\s*\)\s*;?\s*/g, '')
  }

  // WebXR 基座已启用 xr 并添加 VR 按钮，移除示例中的重复代码
  if (baseScene === 'WebXRExampleScene') {
    bodyCode = bodyCode.replace(/renderer\.xr\.enabled\s*=\s*true\s*;?\s*/g, '')
    bodyCode = bodyCode.replace(/document\.body\.appendChild\s*\(\s*VRButton\.createButton\s*\(\s*renderer\s*\)\s*\)\s*;?\s*/g, '')
  }


  const rendererOpts = detectRendererOptions(scriptCode)
  const cameraPosition = extractCameraPosition(scriptCode)
  const cameraLookAt = extractCameraLookAt(scriptCode)
  const cameraOptions = extractCameraOptions(scriptCode)
  const clearColor = extractClearColor(scriptCode)

  // Auto-import common modules if used but not imported
  const allCode = scriptCode + '\n' + bodyCode
  const autoImports = []
  if (features.needsOrbitControls && !allCode.includes('OrbitControls')) {
    autoImports.push("import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'")
  }
  if (features.needsStats && !importLines.some((l) => /Stats/.test(l))) {
    autoImports.push("import Stats from 'three/examples/jsm/libs/stats.module.js'")
  }
  if (features.needsGui && !importLines.some((l) => /GUI|dat\.gui|lil-gui/.test(l))) {
    autoImports.push("import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'")
  }

  const cssRenderer = features.css2d && features.css3d ? 'both' : features.css2d ? 'css2d' : features.css3d ? 'css3d' : ''

  const sceneProps = {
    antialias: rendererOpts.antialias,
    alpha: rendererOpts.alpha,
    preserveDrawingBuffer: rendererOpts.preserveDrawingBuffer,
    clearColor,
    cameraPosition,
    cameraLookAt,
    cameraOptions,
    customRender: features.customRender,
    cssRenderer,
    enableControls: !features.customControls && !features.controlsObject,
  }

  const templateProps = buildVueTemplate(sceneProps, baseScene)

  const infoSlot = infoHtml
    ? `\n    <template #default>\n      <div class="example-info" v-html="infoHtml" />\n    </template>\n  </${baseScene}>`
    : ''

  const hasAwait = /\bawait\b/.test(bodyCode)

  let templateBlock
  if (infoHtml) {
    templateBlock = `<template>
  ${templateProps.replace(/\s*\/>\s*$/, '>')}${infoSlot}
</template>`
  } else {
    templateBlock = `<template>
  ${templateProps}
</template>`
  }

  const templateStr = templateBlock
  const vueContent = `${templateStr}

<script setup>
${baseSceneImport}
${importLines.join('\n')}${importLines.length && autoImports.length ? '\n' : ''}${autoImports.join('\n')}${importLines.length || autoImports.length ? '\n' : ''}
const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

${infoHtml ? `const infoHtml = ${JSON.stringify(infoHtml)}\n` : ''}${hasAwait ? 'async ' : ''}function onReady(__stage) {
  ${bodyCode.includes('ASSET_HOST') ? "const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'\n  " : ''}${features.sceneReassigned ? 'let' : 'const'} scene = __stage.scene
  ${features.cameraReassigned || features.customCamera ? 'let' : 'const'} camera = __stage.camera
  ${features.rendererReassigned ? 'let' : 'const'} renderer = __stage.renderer
  ${features.customControls || features.controlsObject || features.controlsFunction ? '' : 'const controls = __stage.controls'}

${bodyCode
  .split('\n')
  .map((l) => '  ' + l)
  .join('\n')}${features.customCamera ? "\n  __stage.setCamera(camera)" : ''}
}
</script>
`

  return vueContent
}


function detectBaseScene(category, scriptCode) {
  if (category.startsWith('webgpu')) return 'WebGPUExampleScene'
  if (category.startsWith('webxr')) return 'WebXRExampleScene'
  if (category.startsWith('css3d')) return 'CSS3DExampleScene'
  if (category.startsWith('svg')) return 'SVGExampleScene'
  return 'ExampleScene'
}

function isManualReviewNeeded(id, category, scriptCode) {
  if (SKIP_PATTERNS.some((p) => scriptCode.includes(p))) {
    const matched = SKIP_PATTERNS.find((p) => scriptCode.includes(p))
    return { reason: 'forbidden-pattern', note: `uses ${matched}` }
  }
  const hasWebGLRenderer = /new\s+(?:THREE\.)?WebGLRenderer\s*\(/.test(scriptCode)
  const hasWebGPURenderer = /new\s+(?:THREE\.)?WebGPURenderer\s*\(/.test(scriptCode)
  const hasCSS3DRenderer = /new\s+(?:THREE\.)?CSS3DRenderer\s*\(/.test(scriptCode)
  const hasSVGRenderer = /new\s+(?:THREE\.)?SVGRenderer\s*\(/.test(scriptCode)
  if (!hasWebGLRenderer && !hasWebGPURenderer && !hasCSS3DRenderer && !hasSVGRenderer) {
    return { reason: 'no-renderer', note: 'no WebGLRenderer/WebGPURenderer/CSS3DRenderer/SVGRenderer found' }
  }
  if (/new\s+(?:THREE\.)?Scene\s*\(/.test(scriptCode) === false) {
    return { reason: 'no-scene', note: 'no Scene found' }
  }
  return null
}

function convertExample(htmlPath) {
  const filename = path.basename(htmlPath)
  const id = filename.replace(/\.html$/, '')
  const { category, sub } = parseCategory(filename)
  const { title, infoHtml, scriptCode, importmap, shaders } = parseHtml(htmlPath)

  const manual = isManualReviewNeeded(id, category, scriptCode)
  if (manual) {
    return { id, category, title, status: 'manual', manual }
  }

  const vueContent = generateVueComponent(id, title, scriptCode, infoHtml, category, shaders, importmap)
  const componentName = `${toPascalCase(id)}Example.vue`

  return {
    id,
    category,
    title,
    titleEn: title,
    description: title,
    status: 'created',
    componentName,
    vueContent,
  }
}

const PILOT_PATTERNS = [
  { prefix: 'webgl_camera', categoryHint: 'webgl/camera' },
  { prefix: 'webgl_materials', categoryHint: 'webgl/materials' },
  { prefix: 'webgl_loader', categoryHint: 'webgl/loader' },
  { prefix: 'webgl_lights', categoryHint: 'webgl/lights' },
  { prefix: 'webgl_animation', categoryHint: 'webgl/animation' },
  { prefix: 'webgl_buffergeometry', categoryHint: 'webgl/buffergeometry' },
  { prefix: 'webgl_interactive', categoryHint: 'webgl/interactive' },
  { prefix: 'webgl_points', categoryHint: 'webgl/points' },
  { prefix: 'webgl_shadowmap', categoryHint: 'webgl/shadowmap' },
  { prefix: 'webgl_postprocessing', categoryHint: 'webgl/postprocessing' },
]

function isPilotMode() {
  return process.argv.includes('--pilot')
}

function parseIdsArg(args) {
  const prefix = '--ids='
  const found = args.find((arg) => arg.startsWith(prefix))
  if (!found) return null
  return found.slice(prefix.length).split(',').map((s) => s.trim()).filter(Boolean)
}

function pickPilotFiles(allFiles) {
  const picked = []
  for (const pattern of PILOT_PATTERNS) {
    const match = allFiles
      .filter((f) => f.startsWith(pattern.prefix) && f.endsWith('.html'))
      .sort()[0]
    if (match) picked.push(match)
  }
  return picked
}

function vueComponentPath(category, id) {
  const catDir = path.join(componentsDir, category)
  return path.join(catDir, `${toPascalCase(id)}Example.vue`)
}

async function main() {
  const args = process.argv.slice(2)

  // 加载已有注册表，避免覆盖现有组件
  let existingIds = new Set()
  let existingMap = new Map()
  try {
    const mod = await import(`file://${registryPath}?t=${Date.now()}`)
    existingMap = new Map(mod.default.examples.map((ex) => [ex.id, ex]))
    existingIds = new Set(existingMap.keys())
  } catch (e) {
    // ignore
  }
  const targetCategory = args.find((arg) => !arg.startsWith('--'))
  const pilotMode = isPilotMode()
  const ids = parseIdsArg(args)
  const forceMode = args.includes('--force')

  let allFiles = fs.readdirSync(sourceExamplesDir)
    .filter((f) => f.endsWith('.html') && f !== 'index.html')
    .filter((f) => {
      if (ids) return ids.includes(f.replace(/\.html$/, ''))
      if (!targetCategory || targetCategory === '--pilot') return true
      const { category } = parseCategory(f)
      return category === targetCategory || category.startsWith(targetCategory + '/')
    })
    .sort()

  const files = pilotMode ? pickPilotFiles(allFiles) : allFiles

  if (!files.length) {
    console.error(`[error] no examples found for category: ${targetCategory || 'all'}`)
    process.exit(1)
  }

  const manualReviews = []
  const registryExamples = []

  for (const file of files) {
    const id = file.replace(/\.html$/, '')
    const existing = existingMap.get(id)
    if (!forceMode && existing && fs.existsSync(vueComponentPath(existing.category, id))) {
      console.log(`[skip] ${id} vue component already exists`)
      continue
    }
    const htmlPath = path.join(sourceExamplesDir, file)
    const result = convertExample(htmlPath)

    if (result.status === 'manual') {
      console.log(`[manual] ${result.id} → ${result.manual.reason} (${result.manual.note})`)
      manualReviews.push({
        id: result.id,
        category: result.category,
        title: result.title,
        reason: result.manual.reason,
        note: result.manual.note,
      })

      const categoryLabel = CATEGORY_LABEL_MAP[result.category] || CATEGORY_LABEL_MAP[result.category.split('/')[0]] || result.category
      registryExamples.push({
        id: result.id,
        category: result.category,
        categoryLabel,
        title: result.title,
        titleEn: result.title,
        description: result.title,
        thumbnail: `/threejs-official/screenshots/${result.id}.jpg`,
        entry: '',
        runner: 'iframe',
        tags: ['threejs-official', ...result.category.split('/')],
        globals: {
          ASSET_HOST: '/threejs-official/',
        },
      })
      continue
    }

    const catDir = path.join(componentsDir, result.category)
    fs.mkdirSync(catDir, { recursive: true })
    const vuePath = path.join(catDir, result.componentName)
    fs.writeFileSync(vuePath, result.vueContent)
    console.log(`[created] ${vuePath}`)

    const categoryLabel = CATEGORY_LABEL_MAP[result.category] || CATEGORY_LABEL_MAP[result.category.split('/')[0]] || result.category

    registryExamples.push({
      id: result.id,
      category: result.category,
      categoryLabel,
      title: result.title,
      titleEn: result.titleEn,
      description: result.description,
      thumbnail: `/threejs-official/screenshots/${result.id}.jpg`,
      entry: '',
      runner: 'vue',
      tags: ['threejs-official', ...result.category.split('/')],
      globals: {
        ASSET_HOST: '/threejs-official/',
      },
    })
  }

  // Merge registry examples
  if (registryExamples.length) {
    const mod = await import(`file://${registryPath}?t=${Date.now()}`)
    const registry = mod.default

    const existingMap = new Map(registry.examples.map((ex) => [`${ex.category}/${ex.id}`, ex]))
    for (const ex of registryExamples) {
      existingMap.set(`${ex.category}/${ex.id}`, ex)
    }

    registry.examples = Array.from(existingMap.values()).sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category)
      return a.id.localeCompare(b.id)
    })

    fs.writeFileSync(registryPath, `// 由 scripts/convert-threejs-official-to-vue.js 自动生成，请勿手动修改\n\nexport default ${JSON.stringify(registry, null, 2)}\n`)
    console.log(`[registry] updated ${registryPath} with ${registryExamples.length} examples`)
  }

  // Write manual review list
  if (manualReviews.length) {
    const manualPath = path.join(root, 'scripts/legacy/threejs-official-manual-review.json')
    let existing = []
    if (fs.existsSync(manualPath)) {
      existing = JSON.parse(fs.readFileSync(manualPath, 'utf-8'))
    }
    const map = new Map(existing.map((m) => [m.id, m]))
    for (const m of manualReviews) map.set(m.id, m)
    fs.writeFileSync(manualPath, JSON.stringify(Array.from(map.values()), null, 2))
    console.log(`[manual] ${manualReviews.length} examples need review → ${manualPath}`)
  }

  console.log(`[done] ${files.length} inspected, ${registryExamples.length} converted, ${manualReviews.length} manual`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
