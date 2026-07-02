const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const TARGET_DIR = path.resolve(ROOT, 'src/examples/components/mygrapics')

function walk(dir) {
  const result = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      result.push(...walk(full))
    } else if (entry.isFile() && entry.name.endsWith('.vue')) {
      result.push(full)
    }
  }
  return result
}

function removeInstallCleanupHooks(script) {
  const startMarker = 'function installCleanupHooks() {'
  const startIdx = script.indexOf(startMarker)
  if (startIdx === -1) return script

  let braceCount = 0
  let i = startIdx + startMarker.length
  let foundFirstBrace = false

  while (i < script.length) {
    const ch = script[i]
    if (ch === '{') {
      braceCount++
      foundFirstBrace = true
    } else if (ch === '}') {
      if (braceCount === 0 && foundFirstBrace) {
        // 找到 installCleanupHooks 的闭合大括号
        return script.slice(0, startIdx) + script.slice(i + 1)
      }
      braceCount--
    }
    i++
  }

  return script
}

function transformScript(script) {
  // 替换 import
  script = script.replace(
    /import \{ ref, onMounted, onUnmounted \} from 'vue'/,
    "import { ref, onMounted } from 'vue'\nimport { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup.js'"
  )

  // 移除 cleanupFns 声明
  script = script.replace(/const cleanupFns = \[\]\n\n?/g, '')

  // 移除 installCleanupHooks 函数
  script = removeInstallCleanupHooks(script)

  // 添加 useGraphicsCleanup 解构
  script = script.replace(
    /const mgContainer = ref\(null\)\n/,
    "const mgContainer = ref(null)\nconst { runInit } = useGraphicsCleanup()\n"
  )

  // 替换 onMounted 块（两种模式）
  script = script.replace(
    /onMounted\(\(\) => \{\n\s*installCleanupHooks\(\)\n\s*initMyGrapicsExample\(\)\.catch\(err => \{\n\s*console\.error\(['"]MyGrapics example init failed:['"], err\)\n\s*\}\)\n\s*\}\)/,
    `onMounted(() => {\n  runInit(initMyGrapicsExample).catch(err => {\n    console.error('MyGrapics example init failed:', err)\n  })\n})`
  )

  // 替换无 catch 的 onMounted 块
  script = script.replace(
    /onMounted\(\(\) => \{\n\s*installCleanupHooks\(\)\n\s*initMyGrapicsExample\(\)\n\s*\}\)/,
    `onMounted(() => {\n  runInit(initMyGrapicsExample).catch(err => {\n    console.error('MyGrapics example init failed:', err)\n  })\n})`
  )

  // 移除 onUnmounted 块
  script = script.replace(
    /\n?onUnmounted\(\(\) => \{\n\s*cleanupFns\.forEach\(fn => fn\(\)\)\n\s*cleanupFns\.length = 0\n\s*\}\)/,
    ''
  )

  // 清理多余空行
  script = script.replace(/\n{3,}/g, '\n\n')

  return script
}

const files = walk(TARGET_DIR)
let migrated = 0
let skipped = 0
let errors = []

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf-8')

  if (!content.includes('function installCleanupHooks')) {
    return
  }

  const scriptMatch = content.match(/<script setup>([\s\S]*?)<\/script>/)
  if (!scriptMatch) {
    errors.push(`No script tag: ${path.relative(ROOT, file)}`)
    skipped++
    return
  }

  const originalScript = scriptMatch[1]
  const newScript = transformScript(originalScript)

  if (newScript === originalScript) {
    errors.push(`No changes: ${path.relative(ROOT, file)}`)
    skipped++
    return
  }

  if (newScript.includes('installCleanupHooks')) {
    errors.push(`installCleanupHooks remains: ${path.relative(ROOT, file)}`)
    skipped++
    return
  }
  if (newScript.includes('cleanupFns')) {
    errors.push(`cleanupFns remains: ${path.relative(ROOT, file)}`)
    skipped++
    return
  }
  if (newScript.includes('onUnmounted')) {
    errors.push(`onUnmounted remains: ${path.relative(ROOT, file)}`)
    skipped++
    return
  }
  if (!newScript.includes('useGraphicsCleanup')) {
    errors.push(`useGraphicsCleanup missing: ${path.relative(ROOT, file)}`)
    skipped++
    return
  }

  const newContent = content.replace(scriptMatch[0], `<script setup>${newScript}</script>`)
  fs.writeFileSync(file, newContent, 'utf-8')
  console.log('Migrated:', path.relative(ROOT, file))
  migrated++
})

console.log(`\nDone. Migrated: ${migrated}, Skipped: ${skipped}`)
if (errors.length) {
  console.log('\nErrors:')
  errors.forEach((e) => console.log('  -', e))
}
