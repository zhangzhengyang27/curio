 
const fs = require('fs')
const http = require('http')
const https = require('https')
const path = require('path')

const SOURCE_DIR = '/Users/zhangzhengyang/Desktop/Code/数据可视化/data-visualization/MyGrapics'
const EARTH_APP_DIR = '/Users/zhangzhengyang/Desktop/Code/数据可视化/earth-app'
const VUE_OUT_DIR = path.join(EARTH_APP_DIR, 'src/examples/components/mygrapics')
const JSM_COMPAT_OUT = path.join(EARTH_APP_DIR, 'src/examples/jsm-compat/mygrapics')
const PUBLIC_OUT = path.join(EARTH_APP_DIR, 'public/mygrapics')
const EXTERNAL_ASSETS_DIR = path.join(PUBLIC_OUT, 'assets/external')
const REGISTRY_OUT = path.join(EARTH_APP_DIR, 'src/examples/registry/mygrapicsExamples.js')
const REGISTRY_INDEX = path.join(EARTH_APP_DIR, 'src/examples/registry/index.js')

const ASSET_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico',
  'mp4', 'webm', 'mp3', 'wav', 'ogg',
  'json', 'geojson',
  'glb', 'gltf', 'obj', 'mtl', 'drc', 'fbx', '3mf',
  'md2', 'pcd', 'ply', 'stl', 'vox', 'wrl',
  'hdr', 'exr', 'tga', 'ktx', 'ktx2', 'dds', 'tif', 'tiff',
  'bin', 'dat', 'wasm',
])

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function emptyDir(dir) {
  if (!fs.existsSync(dir)) return
  fs.rmSync(dir, { recursive: true, force: true })
}

function toPascalCase(str) {
  return String(str)
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')
    .split('-')
    .filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

function toKebabCase(str) {
  return String(str)
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')
    .split('-')
    .filter(Boolean)
    .join('-')
    .toLowerCase()
}

function sanitizeId(name) {
  return toKebabCase(name.replace(/\.html$/i, '')).replace(/^-+|-+$/g, '') || 'index'
}

function resolveUniqueIds(htmlFiles) {
  // 先统计每个 rawId 出现的次数
  const rawIdCounts = new Map()
  const rawIds = htmlFiles.map(({ fullPath }) =>
    sanitizeId(path.basename(fullPath).replace(/\.html$/i, ''))
  )
  for (const rawId of rawIds) {
    rawIdCounts.set(rawId, (rawIdCounts.get(rawId) || 0) + 1)
  }

  const used = new Set()
  const uniqueIdMap = new Map()
  for (const { fullPath, relDir } of htmlFiles) {
    const rawId = sanitizeId(path.basename(fullPath).replace(/\.html$/i, ''))
    let id = rawId
    if (rawIdCounts.get(rawId) > 1) {
      const categorySuffix = (relDir.split('/').pop() || relDir || 'default')
        .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')
        .replace(/^-+|-+$/g, '')
      id = `${rawId}-${categorySuffix}`
      let counter = 2
      while (used.has(id)) {
        id = `${rawId}-${categorySuffix}-${counter}`
        counter++
      }
    }
    used.add(id)
    uniqueIdMap.set(fullPath, id)
  }
  return uniqueIdMap
}

function isUrl(src) {
  return /^https?:\/\//.test(src) || /^\/\//.test(src)
}

function isAsset(fileName) {
  const ext = path.extname(fileName).toLowerCase().replace(/^\./, '')
  return ASSET_EXTENSIONS.has(ext)
}

const downloadPromises = new Map()
const localUrlMap = new Map()

// 这些域名/路径明显是注释、文档、命名空间或示例引用，不需要下载
const EXTERNAL_URL_SKIP_LIST = [
  /w3\.org/i,
  /github\.com\/.*\/issues?\//i,
  /github\.com\/.*\/blob\//i,
  /github\.com\/.*#L\d+/i,
  /shadertoy\.com\/view\//i,
  /people\.mozilla\.org/i,
  /jsperf\.com/i,
  /khronos\.org\/webgl\/wiki/i,
  /code\.google\.com/i,
  /apache\.org\/licenses/i,
  /flong\.com\/texts/i,
  /greenend\.org\.uk/i,
  /community\.khronos\.org/i,
  /stackoverflow\.com/i,
  /developer\.mozilla\.org/i,
  /github\.com\/[\w-]+\/[\w-]+\/?$/i,
  /\.html(?:[?#]|$)/i,
  /[^a-zA-Z0-9]$/,
  /^https?:\/\/$/,
]

function shouldSkipExternalUrl(url) {
  return EXTERNAL_URL_SKIP_LIST.some(pattern => pattern.test(url))
}

function urlToFileName(url) {
  const urlObj = new URL(url)
  let name = path.basename(urlObj.pathname) || 'resource'
  // 去掉 query/hash，保留干净文件名
  name = name.split(/[?#]/)[0]
  // 没有扩展名时根据 URL 特征补一个
  if (!path.extname(name)) {
    if (/\.(js|mjs)(\?|$)/i.test(url)) name += '.js'
    else if (/\.(jpg|jpeg)(\?|$)/i.test(url)) name += '.jpg'
    else if (/\.(png)(\?|$)/i.test(url)) name += '.png'
    else if (/\.(json)(\?|$)/i.test(url)) name += '.json'
    else name += '.bin'
  }
  return name
}

function downloadExternal(inputUrl) {
  if (downloadPromises.has(inputUrl)) return downloadPromises.get(inputUrl)

  const fileName = urlToFileName(inputUrl)
  const outPath = path.join(EXTERNAL_ASSETS_DIR, fileName)
  ensureDir(path.dirname(outPath))
  const localUrl = '/mygrapics/assets/external/' + fileName

  const promise = new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outPath)
    const client = inputUrl.startsWith('https:') ? https : http
    const req = client.get(inputUrl, { timeout: 30000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // 跟随重定向（支持相对路径）
        file.close()
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath)
        const redirectUrl = new URL(res.headers.location, inputUrl).href
        downloadExternal(redirectUrl).then((redirectLocalUrl) => {
          localUrlMap.set(inputUrl, redirectLocalUrl)
          resolve(redirectLocalUrl)
        }).catch(reject)
        return
      }
      if (res.statusCode !== 200) {
        file.close()
        reject(new Error(`Download failed: ${inputUrl} status ${res.statusCode}`))
        return
      }
      res.pipe(file)
      file.on('finish', () => {
        file.close()
        localUrlMap.set(inputUrl, localUrl)
        resolve(localUrl)
      })
    })
    req.on('error', (err) => {
      file.close()
      reject(err)
    })
    req.on('timeout', () => {
      file.close()
      req.destroy()
      reject(new Error(`Download timeout: ${inputUrl}`))
    })
  })

  downloadPromises.set(inputUrl, promise)
  return promise
}

function findExternalUrls(dir) {
  const urls = new Set()
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.js'))) {
        const content = fs.readFileSync(fullPath, 'utf-8')
        const matches = content.match(/https?:\/\/[^"'\s`)+]+/g) || []
        matches.forEach(url => {
          if (!shouldSkipExternalUrl(url)) urls.add(url)
        })
      }
    }
  }
  walk(dir)
  return Array.from(urls)
}

function localizeExternalUrls(text) {
  return text.replace(/https?:\/\/[^"'\s`)+]+/g, (url) => {
    if (shouldSkipExternalUrl(url)) return url
    const mapped = localUrlMap.get(url)
    return mapped || url
  })
}

function posixRel(from, to) {
  return path.relative(from, to).replace(/\\/g, '/')
}

function isEsModule(content) {
  // 简单启发式：非注释的 import/export 关键字
  const cleaned = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
  return /(^|[;\s])(import|export)\s/.test(cleaned)
}

function resolveLocalImport(importPath, fromFile) {
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) return null
  const baseDir = path.dirname(fromFile)
  let resolved = path.resolve(baseDir, importPath)
  if (!fs.existsSync(resolved)) {
    const withJs = resolved + '.js'
    if (fs.existsSync(withJs)) resolved = withJs
  }
  if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) return null
  return resolved
}

function toJsmImport(absPath) {
  const rel = posixRel(SOURCE_DIR, absPath)
  return `@/examples/jsm-compat/mygrapics/${rel}`
}

function rewriteJsImports(content, fromFile) {
  // 重写 JS 模块中的相对 import/export
  return content.replace(
    /(\b(?:import|export)\s+(?:[^'"]*?)\s+from\s+)(["'])([^"']+)\2/g,
    (match, prefix, quote, importPath) => {
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) return match
      const resolved = resolveLocalImport(importPath, fromFile)
      if (!resolved) {
        // 未找到时仍尝试生成合理路径
        const relDir = posixRel(SOURCE_DIR, path.dirname(fromFile))
        const normalized = path.posix.normalize(path.posix.join(relDir, importPath))
        return `${prefix}${quote}@/examples/jsm-compat/mygrapics/${normalized}${quote}`
      }
      return `${prefix}${quote}${toJsmImport(resolved)}${quote}`
    }
  )
}

const copiedModules = new Set()

function copyLocalModule(absPath) {
  if (!fs.existsSync(absPath)) return null
  const rel = posixRel(SOURCE_DIR, absPath)
  const outPath = path.join(JSM_COMPAT_OUT, rel)
  if (copiedModules.has(outPath)) return outPath
  ensureDir(path.dirname(outPath))
  let content = fs.readFileSync(absPath, 'utf-8')
  const isModule = isEsModule(content) || absPath.endsWith('.mjs')

  // 递归复制 ES 模块中引用的本地文件（在重写 import 之前解析原始相对路径）
  if (isModule) {
    const importMatches = content.matchAll(/\b(?:import|export)\s+(?:[^'"]*?)\s+from\s+["']([^"']+)["']/g)
    for (const m of importMatches) {
      const dep = resolveLocalImport(m[1], absPath)
      if (dep) copyLocalModule(dep)
    }
    content = rewriteJsImports(content, absPath)
  }

  content = localizeExternalUrls(content)
  fs.writeFileSync(outPath, content, 'utf-8')
  copiedModules.add(outPath)
  return outPath
}

function copyPerDirAppJs() {
  // 仅预拷贝 ES Module 类型的 app.js，避免将经典脚本冗余放入 jsm-compat
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (/^app\d*\.js$/i.test(entry.name)) {
        if (isEsModule(fs.readFileSync(fullPath, 'utf-8'))) {
          copyLocalModule(fullPath)
        }
      }
    }
  }
  walk(SOURCE_DIR)
}

function copyAssets() {
  function walk(dir, relDir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
      const fullPath = path.join(dir, entry.name)
      const relPath = path.posix.join(relDir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath, relPath)
      } else if (isAsset(entry.name)) {
        const outPath = path.join(PUBLIC_OUT, relPath)
        ensureDir(path.dirname(outPath))
        fs.copyFileSync(fullPath, outPath)
      }
    }
  }
  walk(SOURCE_DIR, '')
}

function rewriteAssetPaths(text, htmlRelDir) {
  // 字符串中的相对资源路径
  text = text.replace(
    /(["'\`])(\.\.?\/[^"'\`]+?\.(?:png|jpg|jpeg|gif|svg|webp|mp4|webm|mp3|wav|json|glb|gltf|obj|mtl|drc|fbx|bin|dat|wasm))\1/gi,
    (match, quote, relPath) => {
      const resolved = path.posix.join('/mygrapics', htmlRelDir, relPath)
      return `${quote}${path.posix.normalize(resolved).replace(/\/+/g, '/')}${quote}`
    }
  )
  // CSS url() 中的相对资源路径
  text = text.replace(
    /url\(\s*(["']?)(\.\.?\/[^"'\)]+?)\1\s*\)/gi,
    (match, quote, relPath) => {
      const resolved = path.posix.join('/mygrapics', htmlRelDir, relPath)
      return `url(${quote}${path.posix.normalize(resolved).replace(/\/+/g, '/')}${quote})`
    }
  )
  return text
}

function rewriteDomQueries(text) {
  // 将 DOM 查询限制在组件容器内
  text = text.replace(/document\.querySelector\(['"`]canvas['"`]\)/g, 'mgContainer.value.querySelector(\'canvas\')')
  text = text.replace(/document\.querySelectorAll\(['"`]canvas['"`]\)/g, 'mgContainer.value.querySelectorAll(\'canvas\')')
  text = text.replace(/document\.querySelector\(['"`]svg['"`]\)/g, 'mgContainer.value.querySelector(\'svg\')')
  text = text.replace(/document\.querySelectorAll\(['"`]svg['"`]\)/g, 'mgContainer.value.querySelectorAll(\'svg\')')
  text = text.replace(/document\.getElementById\(['"`]([^'"`]+)['"`]\)/g, "mgContainer.value.querySelector('#$1')")
  text = text.replace(/document\.querySelector\(['"`]#([^'"`]+)['"`]\)/g, "mgContainer.value.querySelector('#$1')")
  text = text.replace(/document\.querySelectorAll\(/g, 'mgContainer.value.querySelectorAll(')
  text = text.replace(/document\.querySelector\(/g, 'mgContainer.value.querySelector(')
  return text
}

function cleanScriptBody(body) {
  body = body.replace(/debugger\s*;?/g, '')
  body = body.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
  body = body.replace(/!\s*\(\s*function\s+(\w+)\s*\(/g, ';(function $1(')
  body = body.replace(/\brequestAnimFrame\b/g, 'requestAnimationFrame')
  // 移除已有的 eslint/global 注释，避免与 Vue 单文件冲突或重复声明
  body = body.replace(/\/\*\s*globals?\b[^*]*\*\//gi, '')
  return body
}

function extractImportNames(importStatement) {
  const m = importStatement.match(/^import\s+(.*?)\s+from\s/)
  if (!m) return []
  const spec = m[1].replace(/[{}]/g, ',').split(',').map(s => s.trim()).filter(Boolean)
  const names = []
  for (const s of spec) {
    if (/^\*\s+as\s+/.test(s)) {
      names.push(s.replace(/^\*\s+as\s+/, ''))
    } else if (s.includes(' as ')) {
      names.push(s.split(' as ').pop().trim())
    } else {
      names.push(s)
    }
  }
  return names
}

function filterUnusedImports(importStatements, initText) {
  return importStatements.filter(stmt => {
    const names = extractImportNames(stmt)
    if (!names.length) return true // 保留无法解析的导入
    return names.some(name => new RegExp(`\\b${name}\\b`).test(initText))
  })
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
  return { imports, cleaned: cleaned.trim() }
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

  const scripts = []
  const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi
  while ((m = scriptRegex.exec(content)) !== null) {
    const attrs = m[1]
    const body = m[2]
    if (/type=["']x-shader\/x-/.test(attrs)) continue
    const isModule = /type=["']module["']/.test(attrs)
    const srcMatch = attrs.match(/src=["']([^"']+)["']/)
    scripts.push({ isModule, src: srcMatch ? srcMatch[1] : null, body: body.trim(), attrs })
  }

  const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  let bodyHtml = bodyMatch ? bodyMatch[1].trim() : ''
  // 移除 body 中的 script 标签
  bodyHtml = bodyHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').trim()

  return { rawTitle, styles, scripts, bodyHtml }
}

function transformStyles(styles, htmlRelDir) {
  if (!styles.length) return ''
  const joined = styles.join('\n')
  let transformed = rewriteAssetPaths(joined, htmlRelDir)
  transformed = localizeExternalUrls(transformed)
  transformed = transformed.replace(/\bbody\b/g, '.mygrapics-root')
  return transformed
}

function getLocalScriptPublicUrl(src, htmlRelDir) {
  const rel = path.posix.normalize(path.posix.join(htmlRelDir, src)).replace(/\/+/g, '/')
  return `/mygrapics/${rel}`
}

function getLocalScriptJsmPath(src, htmlRelDir) {
  const rel = path.posix.normalize(path.posix.join(htmlRelDir, src)).replace(/\/+/g, '/')
  return `@/examples/jsm-compat/mygrapics/${rel}`
}

function resolveLocalScript(src, htmlDir) {
  if (path.isAbsolute(src)) {
    return path.join(SOURCE_DIR, src)
  }
  return path.resolve(htmlDir, src)
}

function copyLocalScriptToPublic(absPath, htmlRelDir, src) {
  const rel = posixRel(SOURCE_DIR, absPath)
  const outPath = path.join(PUBLIC_OUT, rel)
  ensureDir(path.dirname(outPath))
  fs.copyFileSync(absPath, outPath)
  return getLocalScriptPublicUrl(src, htmlRelDir)
}

async function generateVue(htmlPath, htmlRelDir, uniqueId) {
  const content = fs.readFileSync(htmlPath, 'utf-8')
  const parsed = parseHtml(content)
  parsed.bodyHtml = localizeExternalUrls(parsed.bodyHtml)
  const id = uniqueId || sanitizeId(path.basename(htmlPath).replace(/\.html$/i, ''))
  const componentName = toPascalCase(id) + 'Example'
  const htmlDir = path.dirname(htmlPath)

  const outDir = path.join(VUE_OUT_DIR, htmlRelDir)
  ensureDir(outDir)
  const outPath = path.join(outDir, `${componentName}.vue`)

  const template = `<template>
  <div class="mygrapics-root" ref="mgContainer">
${parsed.bodyHtml.split('\n').map(line => '    ' + line).join('\n')}
  </div>
</template>`

  const styleBlock = parsed.styles.length
    ? `<style scoped>\n${transformStyles(parsed.styles, htmlRelDir)}\n</style>`
    : ''

  const topLevelImports = new Set()
  const initLines = []
  let needsLoadScript = false

  for (const script of parsed.scripts) {
    if (script.src) {
      if (isUrl(script.src)) {
        // 外部脚本：下载到本地后通过 loadScript 动态加载
        const localUrl = await downloadExternal(script.src)
        needsLoadScript = true
        initLines.push(`  await loadScript(${JSON.stringify(localUrl)});`)
      } else {
        const absPath = resolveLocalScript(script.src, htmlDir)
        if (!fs.existsSync(absPath)) {
          initLines.push(`  // TODO: missing local script ${script.src}`)
          continue
        }
        if (script.isModule || isEsModule(fs.readFileSync(absPath, 'utf-8'))) {
          // ES 模块：拷贝到 jsm-compat 并动态导入
          copyLocalModule(absPath)
          const jsmPath = getLocalScriptJsmPath(script.src, htmlRelDir)
          initLines.push(`  await import('${jsmPath}');`)
        } else {
          // 经典脚本：拷贝到 public 并通过 loadScript 加载
          needsLoadScript = true
          const publicUrl = copyLocalScriptToPublic(absPath, htmlRelDir, script.src)
          initLines.push(`  await loadScript(${JSON.stringify(publicUrl)});`)
        }
      }
    } else if (script.body) {
      let body = cleanScriptBody(script.body)
      body = rewriteAssetPaths(body, htmlRelDir)
      body = rewriteDomQueries(body)
      body = localizeExternalUrls(body)
      if (script.isModule) {
        const { imports, cleaned } = extractImports(body)
        for (const { importsDecl, importPath } of imports) {
          const resolved = resolveLocalImport(importPath, htmlPath)
          if (resolved) {
            copyLocalModule(resolved)
            topLevelImports.add(`import ${importsDecl} from '${toJsmImport(resolved)}'`)
          } else if (importPath.startsWith('.') || importPath.startsWith('/')) {
            // 未解析到时仍生成路径
            const relDir = posixRel(SOURCE_DIR, htmlDir)
            const normalized = path.posix.normalize(path.posix.join(relDir, importPath))
            topLevelImports.add(`import ${importsDecl} from '@/examples/jsm-compat/mygrapics/${normalized}'`)
          } else {
            topLevelImports.add(`import ${importsDecl} from '${importPath}'`)
          }
        }
        initLines.push('  {')
        initLines.push(...cleaned.split('\n').map(line => '    ' + line))
        initLines.push('  }')
      } else {
        initLines.push('  {')
        initLines.push(...body.split('\n').map(line => '    ' + line))
        initLines.push('  }')
      }
    }
  }

  const initText = initLines.join('\n')
  const usedImports = filterUnusedImports(Array.from(topLevelImports), initText)

  const importLines = [
    "import { ref, onMounted, onUnmounted } from 'vue'",
    ...usedImports,
  ]

  const loadScriptDef = needsLoadScript
    ? `
async function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}
`
    : ''

  const scriptBlock = `<script setup>
${importLines.join('\n')}

const mgContainer = ref(null)
const cleanupFns = []
${loadScriptDef}

function installCleanupHooks() {
  const origRaf = window.requestAnimationFrame
  const origCancelRaf = window.cancelAnimationFrame
  const rafIds = []
  window.requestAnimationFrame = (cb) => {
    const id = origRaf((time) => {
      const idx = rafIds.indexOf(id)
      if (idx !== -1) rafIds.splice(idx, 1)
      cb(time)
    })
    rafIds.push(id)
    return id
  }
  window.cancelAnimationFrame = (id) => {
    const idx = rafIds.indexOf(id)
    if (idx !== -1) rafIds.splice(idx, 1)
    return origCancelRaf(id)
  }
  cleanupFns.push(() => {
    rafIds.forEach(id => origCancelRaf(id))
    window.requestAnimationFrame = origRaf
    window.cancelAnimationFrame = origCancelRaf
  })

  const listeners = []
  const origWindowAdd = window.addEventListener
  const origDocAdd = document.addEventListener
  window.addEventListener = (type, fn, opts) => {
    listeners.push(['window', type, fn, opts])
    return origWindowAdd.call(window, type, fn, opts)
  }
  document.addEventListener = (type, fn, opts) => {
    listeners.push(['document', type, fn, opts])
    return origDocAdd.call(document, type, fn, opts)
  }
  cleanupFns.push(() => {
    listeners.forEach(([target, type, fn, opts]) => {
      if (target === 'window') window.removeEventListener(type, fn, opts)
      else if (target === 'document') document.removeEventListener(type, fn, opts)
    })
    window.addEventListener = origWindowAdd
    document.addEventListener = origDocAdd
  })

  const glContexts = []
  const origGetContext = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function(type, attrs) {
    const ctx = origGetContext.call(this, type, attrs)
    if (ctx && /^(webgl|webgl2|experimental-webgl)$/.test(type)) {
      glContexts.push(ctx)
    }
    return ctx
  }
  cleanupFns.push(() => {
    glContexts.forEach((ctx) => {
      const ext = ctx.getExtension('WEBGL_lose_context')
      if (ext) ext.loseContext()
    })
    HTMLCanvasElement.prototype.getContext = origGetContext
  })
}

async function initMyGrapicsExample() {
${initLines.join('\n')}
}

onMounted(() => {
  installCleanupHooks()
  initMyGrapicsExample().catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})

onUnmounted(() => {
  cleanupFns.forEach(fn => fn())
  cleanupFns.length = 0
})
<\/script>`

  let vue = template
  if (styleBlock) vue += '\n\n' + styleBlock
  vue += '\n\n' + scriptBlock

  fs.writeFileSync(outPath, vue, 'utf-8')
  return { componentName, id, category: htmlRelDir, title: parsed.rawTitle || id, outPath }
}

function generateRegistry(examples) {
  const items = examples.map(ex => {
    const categoryLabel = ex.category.split('/').pop() || ex.category || 'mygrapics'
    return {
      id: ex.id,
      category: ex.category,
      categoryLabel,
      title: ex.title,
      description: ex.title,
      tags: ['mygrapics', categoryLabel, ex.category].filter(Boolean),
      runner: 'vue',
    }
  })

  const lines = [
    '// 由 scripts/convert-mygrapics-examples.cjs 自动生成，请勿手动修改',
    '',
    'export default {',
    "  source: 'mygrapics',",
    "  label: 'MyGrapics',",
    '  examples: [',
  ]
  for (const item of items) {
    lines.push('  {')
    for (const [key, value] of Object.entries(item)) {
      lines.push(`    "${key}": ${JSON.stringify(value)},`)
    }
    lines.push('  },')
  }
  lines.push('  ],')
  lines.push('}')
  lines.push('')

  fs.writeFileSync(REGISTRY_OUT, lines.join('\n'), 'utf-8')
}

function updateRegistryIndex() {
  let content = fs.readFileSync(REGISTRY_INDEX, 'utf-8')
  if (content.includes('mygrapicsExamples')) return
  content = content.replace(
    /import webglExamples from '\.\/webglExamples\.js'/,
    "import webglExamples from './webglExamples.js'\nimport mygrapicsExamples from './mygrapicsExamples.js'"
  )
  content = content.replace(
    /const registries = \[threeCesiumExamples, cesiumExamples, threejsLesson, earthLessons, threejsOfficialExamples, granary3dExamples, webglExamples\]/,
    'const registries = [threeCesiumExamples, cesiumExamples, threejsLesson, earthLessons, threejsOfficialExamples, granary3dExamples, webglExamples, mygrapicsExamples]'
  )
  fs.writeFileSync(REGISTRY_INDEX, content, 'utf-8')
}

async function main() {
  console.log('Converting MyGrapics examples...')

  emptyDir(VUE_OUT_DIR)
  emptyDir(JSM_COMPAT_OUT)
  emptyDir(PUBLIC_OUT)
  emptyDir(EXTERNAL_ASSETS_DIR)

  ensureDir(VUE_OUT_DIR)
  ensureDir(JSM_COMPAT_OUT)
  ensureDir(PUBLIC_OUT)
  ensureDir(EXTERNAL_ASSETS_DIR)

  // 预扫描并下载所有外部资源（CDN 脚本、图床图片、JSON 数据）
  const externalUrls = findExternalUrls(SOURCE_DIR)
  if (externalUrls.length) {
    console.log(`Downloading ${externalUrls.length} external resources...`)
    const results = await Promise.allSettled(externalUrls.map(url => downloadExternal(url)))
    for (let i = 0; i < externalUrls.length; i++) {
      const url = externalUrls[i]
      const result = results[i]
      if (result.status === 'fulfilled') {
        console.log(`  ✓ ${url} -> ${result.value}`)
      } else {
        console.error(`  ✗ ${url}: ${result.reason.message}`)
      }
    }
  }

  copyPerDirAppJs()
  copyAssets()

  const htmlFiles = []
  function walk(dir, relDir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
      const fullPath = path.join(dir, entry.name)
      const relPath = path.posix.join(relDir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath, relPath)
      } else if (entry.name.endsWith('.html')) {
        htmlFiles.push({ fullPath, relDir: relDir })
      }
    }
  }
  walk(SOURCE_DIR, '')

  // 预计算唯一 ID，避免不同分类下同名文件冲突
  const uniqueIdMap = resolveUniqueIds(htmlFiles)

  const examples = []
  const failures = []
  for (const { fullPath, relDir } of htmlFiles) {
    try {
      const ex = await generateVue(fullPath, relDir, uniqueIdMap.get(fullPath))
      examples.push(ex)
      console.log(`  ✓ ${path.posix.join(relDir, path.basename(fullPath))} -> ${path.relative(EARTH_APP_DIR, ex.outPath)}`)
    } catch (err) {
      failures.push({ file: path.posix.join(relDir, path.basename(fullPath)), error: err.message })
      console.error(`  ✗ ${path.posix.join(relDir, path.basename(fullPath))}: ${err.message}`)
    }
  }

  generateRegistry(examples)
  updateRegistryIndex()

  // 统计
  const vueCount = examples.length
  const jsmCount = copiedModules.size
  const publicCount = (function countDir(dir) {
    if (!fs.existsSync(dir)) return 0
    return fs.readdirSync(dir, { withFileTypes: true }).reduce((acc, e) => {
      const p = path.join(dir, e.name)
      return acc + (e.isDirectory() ? countDir(p) : 1)
    }, 0)
  })(PUBLIC_OUT)
  const externalCount = fs.existsSync(EXTERNAL_ASSETS_DIR) ? fs.readdirSync(EXTERNAL_ASSETS_DIR).length : 0

  console.log('\nConversion summary:')
  console.log(`  Vue components generated: ${vueCount}`)
  console.log(`  JS module files copied to jsm-compat: ${jsmCount}`)
  console.log(`  Asset/classic-script files copied to public: ${publicCount}`)
  console.log(`  External resources localized: ${externalCount}`)
  if (failures.length) {
    console.log(`  Failures: ${failures.length}`)
    for (const f of failures) console.log(`    - ${f.file}: ${f.error}`)
  }

  fs.writeFileSync(
    path.join(EARTH_APP_DIR, 'scripts/convert-mygrapics-summary.json'),
    JSON.stringify({ vueCount, jsmCount, publicCount, externalCount, failures }, null, 2),
    'utf-8'
  )
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
