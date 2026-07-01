/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')
const http = require('http')
const https = require('https')
const path = require('path')

const SOURCE_DIR = '/Users/zhangzhengyang/Desktop/Code/数据可视化/data-visualization/graphics'
const EARTH_APP_DIR = '/Users/zhangzhengyang/Desktop/Code/数据可视化/earth-app'
const VUE_OUT_DIR = path.join(EARTH_APP_DIR, 'src/examples/components/graphics')
const JSM_COMPAT_OUT = path.join(EARTH_APP_DIR, 'src/examples/jsm-compat/graphics')
const PUBLIC_OUT = path.join(EARTH_APP_DIR, 'public/graphics')
const EXTERNAL_ASSETS_DIR = path.join(PUBLIC_OUT, 'assets/external')
const REGISTRY_OUT = path.join(EARTH_APP_DIR, 'src/examples/registry/graphicsExamples.js')
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

function normalizeUrl(src) {
  if (src.startsWith('//')) return 'https:' + src
  return src
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
  /tc39\.github\.io\/ecma262/i,
  /tc39\.github\.io\/proposal-setmap-offrom/i,
  /code\.visualstudio\.com/i,
  /wiki\.whatwg\.org/i,
  /bugzilla\.mozilla\.org/i,
  /ietf\.org\/rfc/i,
  /tools\.ietf\.org\/html/i,
  /drafts\.csswg\.org/i,
  /\.spec\.whatwg\.org/i,
  /www\.bing\.com\/webmaster/i,
  /go\.microsoft\.com\/fwlink/i,
  /support\.google\.com/i,
  /developers\.google\.com/i,
  /www\.iana\.org/i,
  /en\.wikipedia\.org/i,
  /math\.stackexchange\.com/i,
  /git\.corp\.qihoo\.net/i,
  /github\.com\/[\w-]+\/[\w-]+\/?$/i,
  /github\.com\/.*\/commit\//i,
  /bugs\.chromium\.org/i,
  /jsperf\.lnkit\.com/i,
  /jsperf\.com/i,
  /codeandweb\.com\/texturepacker/i,
  /\.html(?:[?#]|$)/i,
  /[^a-zA-Z0-9]$/,
  /^https?:\/\/$/,
]

function shouldSkipExternalUrl(url) {
  return EXTERNAL_URL_SKIP_LIST.some(pattern => pattern.test(url))
}

// 匹配真正的 URL：要求 // 后至少有一个点的合法主机名，避免把 //word 注释当 URL
const URL_REGEX = /(?:https?:)?\/\/(?:(?:[a-zA-Z0-9][-a-zA-Z0-9.]*\.[a-zA-Z][-a-zA-Z0-9]*)|localhost)(?::\d+)?(?:[/?#][^"'\s`)+]*)?/g

const VALID_EXTENSIONS = new Set([
  'js', 'mjs', 'css', 'json', 'xml',
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp', 'tif', 'tiff',
  'mp4', 'webm', 'ogg', 'ogv', 'mp3', 'wav',
  'glb', 'gltf', 'obj', 'mtl', 'drc', 'fbx', 'bin', 'dat', 'wasm',
  'hdr', 'exr', 'tga', 'ktx', 'ktx2', 'dds',
])

function urlToFileName(url) {
  const urlObj = new URL(url)
  let name = path.basename(urlObj.pathname) || 'resource'
  // 去掉 query/hash，保留干净文件名
  name = name.split(/[?#]/)[0]
  const ext = path.extname(name).toLowerCase().replace(/^\./, '')
  // 没有合法扩展名时根据 URL 特征补一个
  if (!ext || !VALID_EXTENSIONS.has(ext)) {
    if (/\.(js|mjs)(\?|$)/i.test(url)) name += '.js'
    else if (/\.(jpg|jpeg)(\?|$)/i.test(url)) name += '.jpg'
    else if (/\.(png)(\?|$)/i.test(url)) name += '.png'
    else if (/\.(json)(\?|$)/i.test(url)) name += '.json'
    else name += '.bin'
  }
  return name
}

function safeUnlink(filePath) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch {
    // ignore
  }
}

function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

function downloadExternal(inputUrl) {
  inputUrl = normalizeUrl(inputUrl)
  if (downloadPromises.has(inputUrl)) return downloadPromises.get(inputUrl)

  const fileName = urlToFileName(inputUrl)
  const outPath = path.join(EXTERNAL_ASSETS_DIR, fileName)
  const tmpPath = outPath + '.' + simpleHash(inputUrl) + '.tmp'
  ensureDir(path.dirname(outPath))
  const localUrl = '/graphics/assets/external/' + fileName
  const fetchUrl = encodeUrlForFetch(inputUrl)

  const promise = new Promise((resolve, reject) => {
    const file = fs.createWriteStream(tmpPath)
    const client = fetchUrl.startsWith('https:') ? https : http
    const req = client.get(fetchUrl, { timeout: 30000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // 跟随重定向（支持相对路径）
        file.close()
        safeUnlink(tmpPath)
        const redirectUrl = new URL(res.headers.location, inputUrl).href
        downloadExternal(redirectUrl).then((redirectLocalUrl) => {
          localUrlMap.set(inputUrl, redirectLocalUrl)
          resolve(redirectLocalUrl)
        }).catch(reject)
        return
      }
      if (res.statusCode !== 200) {
        file.close()
        safeUnlink(tmpPath)
        reject(new Error(`Download failed: ${inputUrl} status ${res.statusCode}`))
        return
      }
      res.pipe(file)
      file.on('finish', () => {
        file.close()
        try {
          fs.renameSync(tmpPath, outPath)
        } catch (err) {
          safeUnlink(tmpPath)
          reject(err)
          return
        }
        localUrlMap.set(inputUrl, localUrl)
        resolve(localUrl)
      })
    })
    req.on('error', (err) => {
      file.close()
      safeUnlink(tmpPath)
      reject(err)
    })
    req.on('timeout', () => {
      file.close()
      safeUnlink(tmpPath)
      req.destroy()
      reject(new Error(`Download timeout: ${inputUrl}`))
    })
  })

  downloadPromises.set(inputUrl, promise)
  return promise
}

function encodeUrlForFetch(url) {
  // 对 URL 中的非 ASCII 字符（如中文）进行编码，同时保留合法 ASCII 字符
  try {
    return encodeURI(decodeURI(url))
  } catch {
    return encodeURI(url)
  }
}

function isValidUrl(url) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function isLikelyBundledJs(fileName) {
  const lower = fileName.toLowerCase()
  return (
    lower.endsWith('.min.js') ||
    lower.includes('.bundle.') ||
    lower.includes('-vendors') ||
    lower.startsWith('chunk-') ||
    /^\d+\.[a-f0-9]+\.chunk\.js$/.test(fileName)
  )
}

function isSketchyResourceName(name) {
  // 过滤掉明显是从代码/注释里误抓的伪 URL（如 commit hash、issue id、代码片段）
  const base = path.basename(name).split(/[?#]/)[0]
  if (!base || base.length < 2) return true
  if (/^\d+\.bin$/.test(base)) return false // 允许纯数字 .bin
  if (/^[a-f0-9]{7,}$/i.test(base)) return true // commit hash
  if (/[;<>{}()[\]|`~]/.test(base)) return true // 代码符号
  if (/\.(prototype|of|from)/.test(base)) return true
  if (/^(detail|editor|monaco-editor|texturepacker|workbench-colors)$/.test(base)) return true
  return false
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
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        const content = fs.readFileSync(fullPath, 'utf-8')
        const matches = content.match(URL_REGEX) || []
        matches.forEach(url => {
          const normalized = normalizeUrl(url)
          if (!isValidUrl(normalized)) return
          if (!shouldSkipExternalUrl(normalized)) urls.add(normalized)
        })
      } else if (entry.isFile() && entry.name.endsWith('.js') && !isLikelyBundledJs(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf-8')
        const matches = content.match(URL_REGEX) || []
        matches.forEach(url => {
          const normalized = normalizeUrl(url)
          if (!isValidUrl(normalized)) return
          if (shouldSkipExternalUrl(normalized)) return
          if (isSketchyResourceName(urlToFileName(normalized))) return
          urls.add(normalized)
        })
      }
    }
  }
  walk(dir)
  return Array.from(urls)
}

function localizeExternalUrls(text) {
  return text.replace(URL_REGEX, (url) => {
    if (shouldSkipExternalUrl(url)) return url
    const normalized = normalizeUrl(url)
    if (!isValidUrl(normalized)) return url
    const mapped = localUrlMap.get(normalized)
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
  return `@/examples/jsm-compat/graphics/${rel}`
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
        return `${prefix}${quote}@/examples/jsm-compat/graphics/${normalized}${quote}`
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
      const resolved = path.posix.join('/graphics', htmlRelDir, relPath)
      return `${quote}${path.posix.normalize(resolved).replace(/\/+/g, '/')}${quote}`
    }
  )
  // CSS url() 中的相对资源路径
  text = text.replace(
    /url\(\s*(["']?)(\.\.?\/[^"'\)]+?)\1\s*\)/gi,
    (match, quote, relPath) => {
      const resolved = path.posix.join('/graphics', htmlRelDir, relPath)
      return `url(${quote}${path.posix.normalize(resolved).replace(/\/+/g, '/')}${quote})`
    }
  )
  return text
}

function rewriteDomQueries(text) {
  // 将 DOM 查询限制在组件容器内
  text = text.replace(/document\.querySelector\(['"`]canvas['"`]\)/g, 'gContainer.value.querySelector(\'canvas\')')
  text = text.replace(/document\.querySelectorAll\(['"`]canvas['"`]\)/g, 'gContainer.value.querySelectorAll(\'canvas\')')
  text = text.replace(/document\.querySelector\(['"`]svg['"`]\)/g, 'gContainer.value.querySelector(\'svg\')')
  text = text.replace(/document\.querySelectorAll\(['"`]svg['"`]\)/g, 'gContainer.value.querySelectorAll(\'svg\')')
  text = text.replace(/document\.getElementById\(['"`]([^'"`]+)['"`]\)/g, "gContainer.value.querySelector('#$1')")
  text = text.replace(/document\.querySelector\(['"`]#([^'"`]+)['"`]\)/g, "gContainer.value.querySelector('#$1')")
  text = text.replace(/document\.querySelectorAll\(/g, 'gContainer.value.querySelectorAll(')
  text = text.replace(/document\.querySelector\(/g, 'gContainer.value.querySelector(')
  // 将动态创建的元素挂载到组件容器，避免脱离 Vue 渲染树
  text = text.replace(/document\.body\.appendChild\(/g, 'gContainer.value.appendChild(')
  return text
}

function extractElementIds(bodyHtml) {
  const ids = new Set()
  const regex = /\bid=["']([^"']+)["']/g
  let m
  while ((m = regex.exec(bodyHtml)) !== null) {
    ids.add(m[1])
  }
  return Array.from(ids)
}

function generateIdElementVars(bodyHtml) {
  const ids = extractElementIds(bodyHtml)
  if (!ids.length) return ''
  return ids.map(id => `  const ${id} = gContainer.value.querySelector('#${id}')`).join('\n') + '\n'
}

function rewriteWorkerUrls(text, htmlRelDir) {
  return text.replace(
    /new\s+Worker\(\s*(["'])(\.\.?\/[^"']*)\1\s*\)/g,
    (match, quote, relPath) => {
      const resolved = path.posix.normalize(path.posix.join('/graphics', htmlRelDir, relPath))
      return `new Worker(${quote}${resolved}${quote})`
    }
  )
}

function copyWorkerFiles(text, htmlDir, htmlRelDir) {
  const matches = text.matchAll(/new\s+Worker\(\s*["'](\.\.?\/[^"']*)["']\s*\)/g)
  for (const m of matches) {
    const relPath = m[1]
    const absPath = path.resolve(htmlDir, relPath)
    if (!fs.existsSync(absPath)) continue
    const rel = posixRel(SOURCE_DIR, absPath)
    const outPath = path.join(PUBLIC_OUT, rel)
    ensureDir(path.dirname(outPath))
    fs.copyFileSync(absPath, outPath)
  }
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
  // 将模块级 export 声明转为普通声明，因为代码已被移入函数内部
  const stripped = cleaned.replace(/\bexport\s+(const|let|var|function|class)\b/g, '$1')
  return { imports, cleaned: stripped.trim() }
}

function parseHtml(content) {
  // 修复浏览器可容忍但 Vue 模板无法解析的非法标签（如 <div id="container"></>）
  content = content.replace(/<([a-zA-Z][a-zA-Z0-9-]*)[^>]*><\/>/g, '<$1></$1>')

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
  transformed = transformed.replace(/\bbody\b/g, '.graphics-root')
  return transformed
}

function getLocalScriptPublicUrl(src, htmlRelDir) {
  const rel = path.posix.normalize(path.posix.join(htmlRelDir, src)).replace(/\/+/g, '/')
  return `/graphics/${rel}`
}

function getLocalScriptJsmPath(src, htmlRelDir) {
  const rel = path.posix.normalize(path.posix.join(htmlRelDir, src)).replace(/\/+/g, '/')
  return `@/examples/jsm-compat/graphics/${rel}`
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

  const bodyLines = parsed.bodyHtml.trim().split('\n').filter(Boolean)
  // 去除 body 里原有的公共缩进，再统一缩进到 4 空格
  const minIndent = bodyLines.length
    ? Math.min(...bodyLines.filter(l => l.trim()).map(l => l.match(/^(\s*)/)[1].length))
    : 0
  const bodyContent = bodyLines.length
    ? '\n' + bodyLines.map(line => '    ' + line.slice(minIndent)).join('\n') + '\n  '
    : ''
  const template = `<template>
  <div class="graphics-root" ref="gContainer">${bodyContent}</div>
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
        try {
          const localUrl = await downloadExternal(script.src)
          needsLoadScript = true
          initLines.push(`  await loadScript(${JSON.stringify(localUrl)});`)
        } catch (err) {
          initLines.push(`  // TODO: failed to localize external script ${script.src}: ${err.message}`)
        }
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
      copyWorkerFiles(script.body, htmlDir, htmlRelDir)
      let body = cleanScriptBody(script.body)
      body = rewriteWorkerUrls(body, htmlRelDir)
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
            topLevelImports.add(`import ${importsDecl} from '@/examples/jsm-compat/graphics/${normalized}'`)
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

  const idElementVars = generateIdElementVars(parsed.bodyHtml)
  if (idElementVars) {
    initLines.unshift(idElementVars.trimEnd())
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
    gfxLoadedScripts.push(s)
  })
}
`
    : ''

  const scriptBlock = `<script setup>
${importLines.join('\n')}

const gContainer = ref(null)
const cleanupFns = []
const gfxLoadedScripts = []
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

  const timeouts = []
  const origSetTimeout = window.setTimeout
  const origSetInterval = window.setInterval
  const origClearTimeout = window.clearTimeout
  const origClearInterval = window.clearInterval
  window.setTimeout = (fn, delay, ...args) => {
    const id = origSetTimeout(fn, delay, ...args)
    timeouts.push(['timeout', id])
    return id
  }
  window.setInterval = (fn, delay, ...args) => {
    const id = origSetInterval(fn, delay, ...args)
    timeouts.push(['interval', id])
    return id
  }
  cleanupFns.push(() => {
    timeouts.forEach(([kind, id]) => {
      if (kind === 'timeout') origClearTimeout(id)
      else origClearInterval(id)
    })
    window.setTimeout = origSetTimeout
    window.setInterval = origSetInterval
    window.clearTimeout = origClearTimeout
    window.clearInterval = origClearInterval
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
    gfxLoadedScripts.forEach(s => s.remove())
  })
}

async function initGraphicsExample() {
${initLines.join('\n')}
}

onMounted(() => {
  installCleanupHooks()
  initGraphicsExample().catch(err => {
    console.error('Graphics example init failed:', err)
  })
})

onUnmounted(() => {
  cleanupFns.forEach(fn => fn())
  cleanupFns.length = 0
})
<\/script>`

  let vue = template
  vue += '\n\n' + scriptBlock
  if (styleBlock) vue += '\n\n' + styleBlock

  fs.writeFileSync(outPath, vue, 'utf-8')
  return { componentName, id, category: htmlRelDir, title: parsed.rawTitle || id, outPath }
}

function generateRegistry(examples) {
  const items = examples.map(ex => {
    const categoryLabel = ex.category.split('/').pop() || ex.category || 'graphics'
    return {
      id: ex.id,
      category: ex.category,
      categoryLabel,
      title: ex.title,
      description: ex.title,
      tags: ['graphics', categoryLabel, ex.category].filter(Boolean),
      runner: 'vue',
    }
  })

  const lines = [
    '// 由 scripts/convert-graphics-examples.cjs 自动生成，请勿手动修改',
    '',
    'export default {',
    "  source: 'graphics',",
    "  label: 'Graphics',",
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
  if (content.includes('graphicsExamples')) return
  content = content.replace(
    /import mygrapicsExamples from '\.\/mygrapicsExamples\.js'/,
    "import mygrapicsExamples from './mygrapicsExamples.js'\nimport graphicsExamples from './graphicsExamples.js'"
  )
  content = content.replace(
    /const registries = \[threeCesiumExamples, cesiumExamples, threejsLesson, earthLessons, threejsOfficialExamples, granary3dExamples, webglExamples, mygrapicsExamples\]/,
    'const registries = [threeCesiumExamples, cesiumExamples, threejsLesson, earthLessons, threejsOfficialExamples, granary3dExamples, webglExamples, mygrapicsExamples, graphicsExamples]'
  )
  fs.writeFileSync(REGISTRY_INDEX, content, 'utf-8')
}

async function main() {
  console.log('Converting Graphics examples...')

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
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
