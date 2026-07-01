const fs = require('fs')
const path = require('path')

const SOURCE_DIR = '/Users/zhangzhengyang/Desktop/Code/数据可视化/data-visualization/webgl'
const PUBLIC_DIR = '/Users/zhangzhengyang/Desktop/Code/数据可视化/earth-app/public/webgl'
const VUE_OUT_DIR = '/Users/zhangzhengyang/Desktop/Code/数据可视化/earth-app/src/examples/components/webgl'
const JSM_COMPAT_OUT = '/Users/zhangzhengyang/Desktop/Code/数据可视化/earth-app/src/examples/jsm-compat/webgl'
const REGISTRY_OUT = '/Users/zhangzhengyang/Desktop/Code/数据可视化/earth-app/src/examples/registry/webglExamples.js'

const SUB_SOURCES = ['kaikeba-webgl', 'study-webgl']
const ASSET_DIRS = ['images', 'audio', 'video']

function toPascalCase(str) {
  return str
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')
    .split('-')
    .filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

function toKebabCase(str) {
  return str
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')
    .split('-')
    .filter(Boolean)
    .join('-')
    .toLowerCase()
}

function sanitizeId(name) {
  return toKebabCase(name).replace(/^-+|-+$/g, '')
}

function sanitizeCategory(name) {
  return toKebabCase(name).replace(/^-+|-+$/g, '')
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function copyJsmFiles() {
  ensureDir(JSM_COMPAT_OUT)

  for (const subSource of SUB_SOURCES) {
    const subDir = path.join(SOURCE_DIR, subSource)
    if (!fs.existsSync(subDir)) continue

    function walk(dir, relDir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        const relPath = path.posix.join(relDir, entry.name)
        if (entry.isDirectory()) {
          walk(fullPath, relPath)
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          const outPath = path.join(JSM_COMPAT_OUT, relPath)
          ensureDir(path.dirname(outPath))
          let content = fs.readFileSync(fullPath, 'utf-8')
          // 让 jsm 工具文件使用项目本地 three，避免从 unpkg 网络加载
          content = content.replace(
            /from\s+['"]https:\/\/unpkg\.com\/three\/build\/three\.module\.js['"]/g,
            "from 'three'"
          )
          fs.writeFileSync(outPath, content, 'utf-8')
        }
      }
    }

    walk(subDir, subSource)
  }
}

function parseHtml(content) {
  const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/i)
  const rawTitle = titleMatch ? titleMatch[1].trim() : ''

  const styles = []
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
  let m
  while ((m = styleRegex.exec(content)) !== null) {
    styles.push(m[1].trim())
  }

  const shaders = {}
  const shaderRegex = /<script[^>]*id=["']([^"']+)["'][^>]*type=["']x-shader\/x-(vertex|fragment)["'][^>]*>([\s\S]*?)<\/script>/gi
  while ((m = shaderRegex.exec(content)) !== null) {
    shaders[m[1]] = { type: m[2], source: m[3].trim() }
  }

  const scripts = []
  const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi
  while ((m = scriptRegex.exec(content)) !== null) {
    const attrs = m[1]
    const body = m[2]
    if (/type=["']x-shader\/x-/.test(attrs)) continue
    const isModule = /type=["']module["']/.test(attrs)
    const srcMatch = attrs.match(/src=["']([^"']+)["']/)
    scripts.push({
      isModule,
      src: srcMatch ? srcMatch[1] : null,
      body: body.trim(),
      attrs,
    })
  }

  return { rawTitle, styles, shaders, scripts }
}

function resolvePublicPath(importPath, htmlRelDir) {
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) return importPath
  if (importPath.startsWith('/')) return importPath
  const resolved = path.posix.join('/webgl', htmlRelDir, importPath)
  return path.posix.normalize(resolved).replace(/\/+/g, '/')
}

function rewriteRelativeImport(importPath, htmlRelDir) {
  return resolvePublicPath(importPath, htmlRelDir)
}

function resolveJsmImport(importPath, htmlPath) {
  if (importPath.startsWith('https://unpkg.com/three/build/three.module.js')) return 'three'
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) return importPath
  if (importPath.startsWith('/')) return importPath

  const htmlDir = path.dirname(htmlPath)
  const candidate = path.resolve(htmlDir, importPath)
  let actual = candidate

  // 源文件里的相对路径经常有误（如放在同级目录的 jsm 被写成 ../jsm）
  if (!fs.existsSync(actual) && /jsm[\\/]/.test(importPath)) {
    const fileName = path.basename(importPath)
    const sameDirJsm = path.join(htmlDir, 'jsm', fileName)
    if (fs.existsSync(sameDirJsm)) {
      actual = sameDirJsm
    } else {
      // 向上查找最近的 jsm 目录
      let dir = htmlDir
      let found = false
      while (true) {
        const up = path.join(dir, '..', 'jsm', fileName)
        if (fs.existsSync(up)) {
          actual = up
          found = true
          break
        }
        const parent = path.dirname(dir)
        if (parent === dir || !parent.startsWith(SOURCE_DIR)) break
        dir = parent
      }

      // 若仍未找到，在整个子源目录下搜索同名文件
      if (!found) {
        const subSourceRoot = htmlDir.split(path.sep).slice(0, SOURCE_DIR.split(path.sep).length + 1).join(path.sep)
        if (fs.existsSync(subSourceRoot)) {
          function search(dir) {
            const entries = fs.readdirSync(dir, { withFileTypes: true })
            for (const entry of entries) {
              const full = path.join(dir, entry.name)
              if (entry.isDirectory()) {
                const result = search(full)
                if (result) return result
              } else if (entry.name === fileName) {
                return full
              }
            }
            return null
          }
          const result = search(subSourceRoot)
          if (result) actual = result
        }
      }
    }
  }

  if (!fs.existsSync(actual)) {
    console.warn(`Module import not found: ${importPath} in ${htmlPath}`)
    return resolvePublicPath(importPath, path.posix.relative(SOURCE_DIR, htmlDir).replace(/\\/g, '/'))
  }

  const rel = path.relative(SOURCE_DIR, actual).replace(/\\/g, '/')
  return '@/examples/jsm-compat/webgl/' + rel
}

function rewriteAssetPaths(text, htmlRelDir) {
  const assetPattern = `((?:\\.\\.?\\/)+(?:${ASSET_DIRS.join('|')})\\/[^"'\`\\)]+)`

  // 字符串中的相对资源路径
  text = text.replace(
    new RegExp(`(["'\`])${assetPattern}\\1`, 'g'),
    (match, quote, relPath) => {
      const resolved = path.posix.join('/webgl', htmlRelDir, relPath)
      return quote + path.posix.normalize(resolved).replace(/\/+/g, '/') + quote
    }
  )

  // CSS url() 中的相对资源路径
  text = text.replace(
    new RegExp(`url\\(\\s*(["']?)${assetPattern}\\1\\s*\\)`, 'gi'),
    (match, quote, relPath) => {
      const resolved = path.posix.join('/webgl', htmlRelDir, relPath)
      return `url(${quote}${path.posix.normalize(resolved).replace(/\/+/g, '/')}${quote})`
    }
  )

  return text
}

function extractImports(body) {
  const imports = []
  const cleaned = body.replace(
    /import\s+([^"']*?)\s+from\s+(["'])([^"']+)\2\s*;?/g,
    (match, importsDecl, quote, importPath) => {
      imports.push({ importsDecl, importPath })
      return ''
    }
  )
  return { imports, cleaned }
}

function cleanScriptBody(body) {
  // 移除 debugger 语句
  body = body.replace(/debugger\s*;?/g, '')

  // 移除不规则空白（如全角不间断空格）
  body = body.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')

  // 将 !(function xxx() { ... })() 改为 ;(function xxx() { ... })()
  // 前置分号避免 ASI 导致 no-unexpected-multiline 报错
  body = body.replace(/!\s*\(\s*function\s+(\w+)\s*\(/g, ';(function $1(')

  // 把重复声明的 var err 改成 const err（它们通常在独立的 if 块内）
  body = body.replace(/\bvar\s+err\s*=/g, 'const err =')

  return body
}

function rewriteScriptBody(body, { htmlRelDir, shaders, canvasIds }) {
  body = rewriteAssetPaths(body, htmlRelDir)
  body = cleanScriptBody(body)

  // Replace shader DOM queries with string constants
  Object.keys(shaders).forEach(id => {
    body = body.replace(
      new RegExp(`document\\.querySelector\\(["']#${id}["']\\)\\.innerText`, 'g'),
      id
    )
    body = body.replace(
      new RegExp(`document\\.querySelector\\(["']#${id}["']\\)\\.textContent`, 'g'),
      id
    )
    body = body.replace(
      new RegExp(`document\\.getElementById\\(["']${id}["']\\)\\.innerText`, 'g'),
      id
    )
    body = body.replace(
      new RegExp(`document\\.getElementById\\(["']${id}["']\\)\\.textContent`, 'g'),
      id
    )
  })

  // Replace canvas DOM queries with the canvas parameter
  canvasIds.forEach(id => {
    body = body.replace(
      new RegExp(`document\\.querySelector\\(["']#${id}["']\\)`, 'g'),
      'canvas'
    )
    body = body.replace(
      new RegExp(`document\\.getElementById\\(["']${id}["']\\)`, 'g'),
      'canvas'
    )
  })

  // Remove redundant canvas re-declarations (const canvas = canvas; etc.)
  body = body.replace(/\b(const|let|var)\s+canvas\s*=\s*canvas\s*;?/g, '')

  return body
}

function extractCanvasIds(content) {
  const ids = new Set()
  const regex = /<canvas[^>]*id=["']([^"']+)["']/gi
  let m
  while ((m = regex.exec(content)) !== null) {
    ids.add(m[1])
  }
  return Array.from(ids)
}

function loadGlobalScript(url) {
  return `await new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = ${JSON.stringify(url)}
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })`
}

function transformStyles(styles, htmlRelDir) {
  if (!styles.length) return ''
  const joined = styles.join('\n')
  let transformed = rewriteAssetPaths(joined, htmlRelDir)
  // Scoped styles don't apply to body, and the actual canvas uses a class
  // instead of #canvas.
  transformed = transformed.replace(/\bbody\b/g, '.webgl-example-scene')
  transformed = transformed.replace(/#canvas\b/g, '.webgl-example-canvas')
  return transformed
}

function resolveTitle(rawTitle, fileName) {
  const genericTitles = ['', 'document', '未命名', 'undefined']
  const cleanTitle = rawTitle.trim()
  if (cleanTitle && !genericTitles.includes(cleanTitle.toLowerCase())) {
    return cleanTitle
  }
  return fileName.replace(/\.html$/i, '')
}

function isGlMatrixLegacy(src) {
  return /glMatrix-0\.9\.6\.min\.js/.test(src)
}

function isGlMatrixModern(src) {
  return /gl-matrix\.js/.test(src) && !/glMatrix-0\.9\.6/.test(src)
}

function generateVue(htmlPath, htmlRelDir) {
  const content = fs.readFileSync(htmlPath, 'utf-8')
  const parsed = parseHtml(content)
  const canvasIds = extractCanvasIds(content)

  const fileName = path.basename(htmlPath)
  const id = sanitizeId(path.basename(htmlPath, '.html'))
  const componentName = toPascalCase(id) + 'Example'

  const shaderDecls = Object.entries(parsed.shaders)
    .map(([name, { source }]) => {
      const constName = name.replace(/[-.]/g, '_')
      return `const ${constName} = \`${source.replace(/`/g, '\\`')}\``
    })
    .join('\n\n')

  const externalScripts = parsed.scripts.filter(s => s.src && !s.body)
  const inlineScripts = parsed.scripts.filter(s => s.body)

  const glMatrixLegacyCalls = []
  const glMatrixModernCalls = []
  const otherLoaderCalls = []

  externalScripts.forEach(s => {
    const rewritten = rewriteRelativeImport(s.src, htmlRelDir)
    if (isGlMatrixLegacy(s.src)) {
      glMatrixLegacyCalls.push(`await loadGlMatrixLegacy(${JSON.stringify(rewritten)})`)
    } else if (isGlMatrixModern(s.src)) {
      glMatrixModernCalls.push(`await loadGlMatrixModern(${JSON.stringify(rewritten)})`)
    } else {
      otherLoaderCalls.push(loadGlobalScript(rewritten))
    }
  })

  const moduleScripts = inlineScripts.filter(s => s.isModule)
  const plainScripts = inlineScripts.filter(s => !s.isModule)

  const topLevelImports = []
  let mainBody = ''

  if (moduleScripts.length > 0) {
    const bodies = moduleScripts.map(s => {
      const { imports, cleaned } = extractImports(s.body)
      imports.forEach(({ importsDecl, importPath }) => {
        const rewritten = resolveJsmImport(importPath, htmlPath)
        topLevelImports.push(`import ${importsDecl} from '${rewritten}'`)
      })
      return rewriteScriptBody(cleaned, { htmlRelDir, shaders: parsed.shaders, canvasIds })
    })
    mainBody = bodies.join('\n\n')
  } else if (plainScripts.length > 0) {
    const combined = plainScripts
      .map(s => rewriteScriptBody(s.body, { htmlRelDir, shaders: parsed.shaders, canvasIds }))
      .join('\n\n')
    mainBody = `${combined}\n\nif (typeof init === 'function') {\n  init()\n}`
  }

  const styleBlock = parsed.styles.length
    ? `<style scoped>\n${transformStyles(parsed.styles, htmlRelDir)}\n</style>`
    : ''

  const importBlock = topLevelImports.length
    ? topLevelImports.join('\n') + '\n'
    : ''

  const glMatrixImports = []
  const glMatrixCalls = []
  if (glMatrixLegacyCalls.length) {
    glMatrixImports.push("import { loadGlMatrixLegacy } from '@/examples/utils/loadGlMatrix.js'")
    glMatrixCalls.push(...glMatrixLegacyCalls)
  }
  if (glMatrixModernCalls.length) {
    glMatrixImports.push("import { loadGlMatrixModern } from '@/examples/utils/loadGlMatrix.js'")
    glMatrixCalls.push(...glMatrixModernCalls)
  }

  const allImports = [
    "import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'",
    ...glMatrixImports,
    ...importBlock.split('\n').filter(Boolean),
  ]
  const importSection = allImports.join('\n')

  const loaderCalls = [...glMatrixCalls, ...otherLoaderCalls]
  const loaderBlock = loaderCalls.length
    ? loaderCalls.map(c => `  ${c};`).join('\n') + '\n'
    : ''

  const vue = `<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
${importSection}${shaderDecls ? '\n' + shaderDecls + '\n' : ''}
async function onReady({ canvas, container, addUpdateCallback, resize }) {
${loaderBlock}  ${mainBody.split('\n').join('\n  ')}
}
</script>
${styleBlock ? '\n' + styleBlock : ''}
`

  const title = resolveTitle(parsed.rawTitle, fileName)
  return { id, componentName, title, vue }
}

function walkHtmlFiles(dir, relDir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relPath = path.posix.join(relDir, entry.name)
    if (entry.isDirectory()) {
      walkHtmlFiles(fullPath, relPath, files)
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push({ fullPath, relPath })
    }
  }
  return files
}

function generateRegistry(examples) {
  const registryExamples = examples.map(ex => ({
    id: ex.id,
    category: ex.category,
    categoryLabel: ex.categoryLabel,
    title: ex.title,
    description: ex.title,
    tags: ['webgl', ex.subSource, ex.category],
    runner: 'vue',
  }))

  return `// 由 scripts/convert-webgl-examples.cjs 自动生成，请勿手动修改

export default {
  source: 'webgl',
  label: 'WebGL 基础',
  examples: ${JSON.stringify(registryExamples, null, 2)},
}
`
}

function main() {
  ensureDir(VUE_OUT_DIR)
  copyJsmFiles()

  const examples = []

  for (const subSource of SUB_SOURCES) {
    const subDir = path.join(SOURCE_DIR, subSource)
    if (!fs.existsSync(subDir)) continue

    const htmlFiles = walkHtmlFiles(subDir, subSource)
    for (const { fullPath, relPath } of htmlFiles) {
      const htmlRelDir = path.posix.dirname(relPath)
      const categoryDir = sanitizeCategory(path.posix.relative(subSource, htmlRelDir))
      const category = `${subSource}/${categoryDir}`
      const categoryLabel = path.basename(path.posix.dirname(relPath))

      const { id, componentName, title, vue } = generateVue(fullPath, htmlRelDir)

      const outDir = path.join(VUE_OUT_DIR, category)
      ensureDir(outDir)
      const outPath = path.join(outDir, `${componentName}.vue`)
      fs.writeFileSync(outPath, vue, 'utf-8')

      examples.push({
        subSource,
        category,
        categoryLabel,
        id,
        title,
        componentName,
        outPath,
      })

      console.log(`Generated: ${outPath}`)
    }
  }

  fs.writeFileSync(REGISTRY_OUT, generateRegistry(examples), 'utf-8')
  console.log(`Registry: ${REGISTRY_OUT}`)
  console.log(`Total examples: ${examples.length}`)
}

main()
