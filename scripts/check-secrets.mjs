#!/usr/bin/env node
/**
 * 仓库凭据泄漏扫描。
 *
 * 用途：拦截「API Key / Token / 私钥等凭据被明文写进仓库」这一类问题。
 * 背景：本项目曾把百度地图 AK 明文写进 index.html、把天地图令牌写进
 *      src/examples/components/cesium-examples/cesiumConstants.js。两者都已改为
 *      通过 .env 环境变量注入（见 .env.example）。
 *
 * 用法：
 *   node scripts/check-secrets.mjs        # 有命中则退出码 1
 *
 * 在 CI 与本地 pre-commit 中执行（见 .github/workflows/ci.yml 与 .githooks/pre-commit）。
 * 误报可通过下方 ALLOWLIST 精确豁免，并请在注释中写明原因。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

/** 不扫描的目录名 */
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'dist-ssr',
  '.vite',
  'public', // 静态素材/构建产物拷贝，体量大且非源码
  '.workbuddy',
  'test-results',
  'playwright-report',
])

/** 不扫描的路径前缀（相对仓库根，POSIX 风格） */
const SKIP_PREFIXES = [
  'src/examples/jsm-compat/', // 第三方 three.js addons 原样拷贝
  'src/examples/three-build-compat/', // three.js 官方预发布 build
  'src/examples/components/webgl/', // 由 HTML 直接转换的示例，含外部库内联
  'src/examples/components/graphics/',
  'src/examples/components/mygrapics/',
  'package-lock.json',
  'pnpm-lock.yaml',
  '.env.local', // 本机真实凭据，已被 .gitignore 忽略，不应参与扫描
]

/** 只扫描文本类文件，避免读入巨量二进制 */
const TEXT_EXT = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.vue', '.html', '.json',
  '.css', '.md', '.yml', '.yaml', '.env', '.example', '.txt', '.sh',
])

const RULES = [
  {
    id: 'baidu-ak',
    label: '百度地图 AK 明文',
    re: /api\.map\.baidu\.com\/api\?[^\s"'`]*\bak=([A-Za-z0-9]{16,})/,
  },
  {
    id: 'tianditu-tk',
    label: '天地图令牌明文',
    re: /\btk=([a-f0-9]{20,})\b/,
  },
  {
    id: 'private-key',
    label: '私钥内容',
    re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/,
  },
  {
    id: 'generic-credential',
    label: '疑似硬编码凭据',
    re: /(?:secret|passwd|password|api[_-]?key|apikey|access[_-]?key|client[_-]?secret|(?:[a-z0-9]+[_-])?token)\s*[:=]\s*['"`]([A-Za-z0-9/+=_-]{16,})['"`]/i,
  },
]

/** 精确豁免：[相对路径, 规则id, 说明] */
const ALLOWLIST = [
  // 示例：['src/foo/bar.js', 'generic-credential', '演示用假值，非真实凭据']
]

function isSkipped(relPath) {
  return SKIP_PREFIXES.some((p) => relPath === p || relPath.startsWith(p))
}

function hasTextExt(name) {
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return name === '.env.example' || !name.includes('.')
  return TEXT_EXT.has(name.slice(dot))
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    let st
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) {
      yield* walk(full)
    } else {
      yield full
    }
  }
}

const findings = []

for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).split('\\').join('/')
  if (isSkipped(rel)) continue
  if (!hasTextExt(rel.split('/').pop())) continue
  if (statSync(file).size > 2 * 1024 * 1024) continue

  let content
  try {
    content = readFileSync(file, 'utf8')
  } catch {
    continue
  }
  if (!/ak=|tk=|PRIVATE KEY|secret|password|api[_-]?key|token/i.test(content)) continue

  const lines = content.split('\n')
  for (const rule of RULES) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!rule.re.test(line)) continue
      if (ALLOWLIST.some(([p, id]) => p === rel && id === rule.id)) continue
      findings.push({ rel, line: i + 1, rule: rule.id, label: rule.label, snippet: line.trim().slice(0, 160) })
    }
  }
}

if (findings.length === 0) {
  console.log('[check-secrets] 通过：未发现明文凭据。')
  process.exit(0)
}

console.error(`[check-secrets] 发现 ${findings.length} 处疑似明文凭据：\n`)
for (const f of findings) {
  console.error(`  ${f.rel}:${f.line}  [${f.label}]`)
  console.error(`    ${f.snippet}\n`)
}
console.error('处理方式：把凭据移到 .env.local（已被 .gitignore 忽略），')
console.error('在 .env.example 中登记变量名，并通过 import.meta.env 读取。')
console.error('确属误报时，请在 scripts/check-secrets.mjs 的 ALLOWLIST 中登记并说明原因。')
process.exit(1)
