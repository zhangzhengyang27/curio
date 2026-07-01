import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const sourceExamplesDir = '/Users/zhangzhengyang/Downloads/three.js-dev/examples'
const targetAssetsDir = path.join(root, 'public/threejs-official')

const ASSET_DIRS = ['models', 'textures', 'sounds', 'fonts', 'luts', 'materialx', 'files', 'screenshots']

const ASSET_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
  '.glb', '.gltf', '.obj', '.mtl', '.fbx', '.dae', '.drc',
  '.ply', '.stl', '.pcd', '.pdb', '.xyz', '.vox', '.3mf',
  '.mp3', '.ogg', '.wav', '.mp4', '.webm',
  '.json', '.cubemap', '.hdr', '.exr', '.rgbe',
  '.ttf', '.woff', '.woff2',
  '.cube', '.3dl', '.lut', '.mtlx',
  '.wasm', '.js', '.3dm',
])

const RESOURCE_PATTERNS = [
  // 'textures/crate.gif' or "textures/crate.gif"
  /['"]((?:models|textures|sounds|fonts|luts|materialx|files|screenshots)\/[^'"]+)['"]/g,
  // TextureLoader().load('textures/crate.gif')
  /\.load\(\s*['"]([^'"]+)['"]\s*\)/g,
  // load('models/...') generic
  /load\(\s*['"]([^'"]+)['"]\s*\)/g,
  // setPath('models/...')
  /setPath\(\s*['"]([^'"]+)['"]\s*\)/g,
]

function isAssetReference(ref) {
  const lower = ref.toLowerCase()
  if (ASSET_DIRS.some((dir) => lower.startsWith(dir + '/'))) return true
  const ext = path.extname(ref).toLowerCase()
  if (ASSET_EXTENSIONS.has(ext)) return true
  return false
}

function isExternalOrData(ref) {
  return /^https?:\/\//.test(ref) || /^data:/.test(ref) || ref.startsWith('/node_modules/')
}

function normalizeRef(ref) {
  return ref.replace(/^\.?\.?\//, '').replace(/^\//, '')
}

function extractScriptCode(html) {
  const match = html.match(/<script\s+type=["']module["']\s*>([\s\S]*?)<\/script>/)
  return match ? match[1] : ''
}

function collectAssetsFromExample(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf-8')
  const code = html + '\n' + extractScriptCode(html)
  const refs = new Set()

  for (const pattern of RESOURCE_PATTERNS) {
    let match
    const localPattern = new RegExp(pattern.source, pattern.flags)
    while ((match = localPattern.exec(code)) !== null) {
      const ref = match[1] || match[2] || match[0]
      if (!ref) continue
      const normalized = normalizeRef(ref)
      if (isExternalOrData(normalized)) continue
      if (isAssetReference(normalized)) {
        refs.add(normalized)
      }
    }
  }

  return Array.from(refs)
}

async function main() {
  const files = fs.readdirSync(sourceExamplesDir)
    .filter((f) => f.endsWith('.html') && f !== 'index.html')
    .sort()

  const allAssets = new Set()
  const perExample = {}

  for (const file of files) {
    const htmlPath = path.join(sourceExamplesDir, file)
    const assets = collectAssetsFromExample(htmlPath)
    if (assets.length) {
      perExample[file] = assets
      assets.forEach((a) => allAssets.add(a))
    }
  }

  console.log(`[scan] ${files.length} HTML examples scanned`)
  console.log(`[scan] ${allAssets.size} unique asset references found`)

  let copied = 0
  let missing = 0
  const copyLog = []

  function copyRecursive(src, dest) {
    const stat = fs.statSync(src)
    if (stat.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true })
      for (const entry of fs.readdirSync(src)) {
        copyRecursive(path.join(src, entry), path.join(dest, entry))
      }
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.copyFileSync(src, dest)
    }
  }

  for (const asset of Array.from(allAssets).sort()) {
    const src = path.join(sourceExamplesDir, asset)
    const dest = path.join(targetAssetsDir, asset)

    if (!fs.existsSync(src)) {
      console.warn(`[missing] ${asset}`)
      missing++
      copyLog.push({ asset, status: 'missing' })
      continue
    }

    copyRecursive(src, dest)
    copied++
    copyLog.push({ asset, status: 'copied' })
  }

  const manifest = {
    scanned: files.length,
    totalAssets: allAssets.size,
    copied,
    missing,
    perExample,
    copyLog,
  }

  const manifestPath = path.join(root, 'scripts/threejs-official-assets-manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

  console.log(`[copy] ${copied} copied, ${missing} missing`)
  console.log(`[manifest] written to ${manifestPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
