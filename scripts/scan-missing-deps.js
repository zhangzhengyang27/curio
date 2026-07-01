import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const componentsDir = path.join(root, 'src/examples/components/threejs-official')
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'))

const installedDeps = new Set([
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.devDependencies || {}),
])

const vueFiles = []
function collect(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collect(full)
    else if (entry.name.endsWith('.vue')) vueFiles.push(full)
  }
}
collect(componentsDir)

const missingMap = new Map()
const importRegex = /import\s+[^'"]*from\s+['"]([^'"]+)['"]/g
const bareRegex = /^(?:@[^/]+\/[^/]+|[^./][^/]*)(?:\/.*)?$/

for (const file of vueFiles) {
  const content = fs.readFileSync(file, 'utf-8')
  const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/)
  if (!scriptMatch) continue
  const script = scriptMatch[1]
  let m
  while ((m = importRegex.exec(script)) !== null) {
    const mod = m[1]
    if (!bareRegex.test(mod)) continue
    if (mod.startsWith('@/')) continue
    const pkg = mod.startsWith('@') ? mod.split('/').slice(0, 2).join('/') : mod.split('/')[0]
    if (pkg === 'three') continue
    if (!installedDeps.has(pkg)) {
      if (!missingMap.has(pkg)) missingMap.set(pkg, [])
      missingMap.get(pkg).push(path.relative(root, file))
    }
  }
}

if (missingMap.size === 0) {
  console.log('No missing external dependencies found.')
  process.exit(0)
}

console.log('Missing external dependencies (not in package.json):')
for (const [pkg, files] of missingMap.entries()) {
  console.log(`\n${pkg}:`)
  for (const f of files) console.log(`  - ${f}`)
}
