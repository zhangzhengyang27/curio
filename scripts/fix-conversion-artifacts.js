import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const baseDir = path.join(root, 'src/examples/components/three-cesium-examples')

function walk(dir, suffix) {
  const result = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) result.push(...walk(p, suffix))
    else if (entry.name.endsWith(suffix)) result.push(p)
  }
  return result
}

const files = walk(baseDir, '.vue')

for (const file of files) {
  let text = fs.readFileSync(file, 'utf-8')
  let changed = false

  // Fix canvas 2d context variable colliding with injected ctx.
  // Only act when the original declaration was stripped (e.g. `= canvas.getContext('2d')`).
  if (/^\s*=\s*\w+\.getContext\(['"]2d['"]\)\s*;?/m.test(text)) {
    // rename injected onReady parameter so original `ctx` can stay as canvas context
    text = text.replace(/function onReady\(ctx\)/g, 'function onReady(stageCtx)')
    // rename known injected ctx property accesses
    text = text.replace(
      /\bctx\.(scene|camera|renderer|controls|container|size|setCamera|addUpdateCallback|removeUpdateCallback|dispose|onResize|onBeforeDispose)\b/g,
      'stageCtx.$1'
    )
    // restore the stripped canvas context declaration
    text = text.replace(/^\s*=\s*(\w+)\.getContext\(['"]2d['"]\)\s*;?/gm, 'const ctx = $1.getContext("2d");')
    changed = true
  }

  // Fix FirstPersonControls variable colliding with injected controls
  // (only when the converter stripped the declaration, leaving a leading `=`)
  if (/^\s*=\s*new\s+FirstPersonControls\s*\(/m.test(text)) {
    text = text.replace(
      /^\s*=\s*new\s+FirstPersonControls\s*\(([^)]+)\)\s*;?/gm,
      'const fpControls = new FirstPersonControls($1);'
    )
    text = text.replace(/\bcontrols\./g, 'fpControls.')
    changed = true
  }

  // Fix PointerLockControls variable colliding with injected controls
  if (/^\s*=\s*new\s+PointerLockControls\s*\(/m.test(text)) {
    text = text.replace(
      /^\s*=\s*new\s+PointerLockControls\s*\(([^)]+)\)\s*;?/gm,
      'const pointLockControls = new PointerLockControls($1);'
    )
    text = text.replace(/\bcontrols\./g, 'pointLockControls.')
    changed = true
  }

  // Fix leftover DOM `box` references (container variable removed by converter)
  if (/\bbox\.(style|append|appendChild)\b/.test(text)) {
    text = text.replace(/\bbox\.(style\s*=)/g, 'stageCtx.container.$1')
    text = text.replace(/\bbox\.append\(/g, 'stageCtx.container.append(')
    text = text.replace(/\bbox\.appendChild\(/g, 'stageCtx.container.appendChild(')
    changed = true
  }

  // Fix clear-color string hex values
  if (/:clear-color="#/.test(text)) {
    text = text.replace(/:clear-color="#([0-9a-fA-F]+)"/g, (_, hex) => `:clear-color="0x${hex}"`)
    changed = true
  }

  if (changed) {
    fs.writeFileSync(file, text)
    console.log('[fixed]', path.relative(root, file))
  }
}

console.log('[done]')
