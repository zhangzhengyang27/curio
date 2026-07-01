const fs = require('fs')
const path = require('path')

const COMPONENTS_DIR = path.join(__dirname, '../src/examples/components/graphics')

function findVueFiles(dir) {
  const result = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      result.push(...findVueFiles(fullPath))
    } else if (entry.name.endsWith('.vue')) {
      result.push(fullPath)
    }
  }
  return result
}

function extractBlock(content, startIdx) {
  let depth = 0
  for (let i = startIdx; i < content.length; i++) {
    if (content[i] === '{') depth++
    else if (content[i] === '}') {
      depth--
      if (depth === 0) return content.slice(startIdx, i + 1)
    }
  }
  return null
}

function removeInstallCleanupHooks(content) {
  const fnStart = content.indexOf('function installCleanupHooks()')
  if (fnStart === -1) return content

  const blockStart = content.indexOf('{', fnStart)
  if (blockStart === -1) return content

  const block = extractBlock(content, blockStart)
  if (!block) return content

  const endIdx = blockStart + block.length
  return content.slice(0, fnStart) + content.slice(endIdx)
}

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8')
  if (!content.includes('function installCleanupHooks()')) return false

  // 1. 添加 useGraphicsCleanup 导入
  if (!content.includes('useGraphicsCleanup')) {
    const importMatch = content.match(/import\s+.*?from\s+['"][^'"]+['"]/g)
    const lastImport = importMatch ? importMatch[importMatch.length - 1] : null
    if (lastImport) {
      const insertIdx = content.lastIndexOf(lastImport) + lastImport.length
      content = content.slice(0, insertIdx) + "\nimport { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup.js'" + content.slice(insertIdx)
    }
  }

  // 2. 移除 cleanupFns 声明
  content = content.replace(/const cleanupFns = \[\]\n?/g, '')

  // 3. 在 gfxLoadedScripts 声明后注册 cleanup hook
  if (!content.includes('useGraphicsCleanup(gfxLoadedScripts)')) {
    content = content.replace(
      /(const gfxLoadedScripts = \[\]\n?)/,
      '$1const { runInit } = useGraphicsCleanup(gfxLoadedScripts)\n'
    )
  }

  // 4. 移除 installCleanupHooks 函数体
  content = removeInstallCleanupHooks(content)

  // 5. 改写 onMounted
  content = content.replace(
    /onMounted\(\(\) => \{\n\s*installCleanupHooks\(\)\n\s*initGraphicsExample\(\)\.catch\(err => \{\n\s*console\.error\('Graphics example init failed:', err\)\n\s*\}\)\n\s*\}\)/g,
    "onMounted(() => {\n  runInit(initGraphicsExample).catch(err => {\n    console.error('Graphics example init failed:', err)\n  })\n})"
  )

  // 6. 改写 onUnmounted
  content = content.replace(
    /onUnmounted\(\(\) => \{\n\s*cleanupFns\.forEach\(fn => fn\(\)\)\n\s*cleanupFns\.length = 0\n\s*\}\)/g,
    '// cleanup is handled by useGraphicsCleanup\n// onUnmounted not needed'
  )

  fs.writeFileSync(filePath, content, 'utf-8')
  return true
}

function main() {
  const files = findVueFiles(COMPONENTS_DIR)
  let patched = 0
  for (const file of files) {
    try {
      if (patchFile(file)) {
        patched++
        console.log('Patched:', path.relative(COMPONENTS_DIR, file))
      }
    } catch (err) {
      console.error('Failed to patch:', file, err.message)
    }
  }
  console.log(`\nPatched ${patched} files.`)
}

main()
