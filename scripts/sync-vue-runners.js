import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const componentsDir = path.join(root, 'src/examples/components')

function toPascalCase(id) {
  return id
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toUpperCase())
}

function componentExists(source, category, id) {
  const catDir = path.join(componentsDir, source, category)
  const pascal = toPascalCase(id)
  const candidates = [
    path.join(catDir, `${pascal}Example.vue`),
    path.join(catDir, `${id}.vue`),
    path.join(catDir, id, 'index.vue'),
  ]
  return candidates.some((p) => fs.existsSync(p))
}

async function syncRegistry(filePath) {
  const absPath = path.join(root, filePath)
  const mod = await import(`file://${absPath}?t=${Date.now()}`)
  const data = mod.default
  const items = Array.isArray(data) ? data : data.examples

  let changed = false
  items.forEach((item) => {
    const source = item.source ?? data.source
    const { category, id } = item
    if (!source || !category || !id) return
    if (componentExists(source, category, id)) {
      if (item.runner !== 'vue') {
        item.runner = 'vue'
        changed = true
      }
    } else if (item.runner === 'vue') {
      item.runner = 'iframe'
      changed = true
    }
  })

  if (changed) {
    const header = fs.readFileSync(absPath, 'utf-8').match(/^(\/\/[^\n]*\n)+/m)?.[0] || ''
    fs.writeFileSync(absPath, `${header}export default ${JSON.stringify(data, null, 2)}\n`)
    console.log(`[sync] updated ${filePath}`)
  } else {
    console.log(`[sync] no changes ${filePath}`)
  }
}

await syncRegistry('src/examples/registry/threejsLesson.js')
await syncRegistry('src/examples/registry/earthLessons.js')
await syncRegistry('src/examples/registry/cesiumExamples.js')
await syncRegistry('src/examples/registry/threeCesiumExamples.js')
await syncRegistry('src/examples/registry/threejsOfficialExamples.js')
