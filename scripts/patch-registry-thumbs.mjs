// 把截图脚本生成的 scripts/_thumb_map.json 回填进各 registry 文件：
// 在每条示例的 "id" 行后插入 "thumbnail": "<url>"。保留原格式与头部注释。
import { readFile, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const REG = path.join(ROOT, 'src/examples/registry')

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function main() {
  const mapPath = path.join(__dirname, '_thumb_map.json')
  const map = JSON.parse(await readFile(mapPath, 'utf8'))
  // 全部回填：截图失败的项文件不存在，画廊 <img> 的 @error 会优雅降级为占位符
  if (!map.length) {
    console.log('映射为空，跳过')
    return
  }

  const bySource = {}
  for (const m of map) (bySource[m.source] ||= []).push(m)

  const files = (await readdir(REG)).filter(f => f.endsWith('.js'))
  let patched = 0
  let skipped = 0

  for (const f of files) {
    const mod = await import(path.join(REG, f))
    const src = mod.default && mod.default.source
    const entries = src && bySource[src]
    if (!entries || !entries.length) continue

    let text = await readFile(path.join(REG, f), 'utf8')
    // 预清理：删除已有的空 thumbnail 行。
    // threeCesium/cesium 等源原本就带 "thumbnail": ""，若不先删，插入新 thumbnail 后
    // 会出现重复键，JS 对象字面量后键覆盖前键导致 thumbnail 仍解析为空。
    text = text.replace(/\n[ \t]*"thumbnail":\s*"",?/g, '')
    for (const e of entries) {
      const idRe = escapeRegExp(e.id)
      const catRe = escapeRegExp(e.category)
      // 顺序 A: "id": ... \n "category": ...
      let re = new RegExp(
        `((\\s*)"id":\\s*"${idRe}",)\\s*\\n(\\s*"category":\\s*"${catRe}")`
      )
      let replaced = false
      if (re.test(text)) {
        text = text.replace(re, (_m, g1, g2, g3) =>
          `${g1}\n${g2}"thumbnail": ${JSON.stringify(e.thumbnail)},\n${g3}`
        )
        replaced = true
      } else {
        // 顺序 B: "category": ... \n "id": ...
        re = new RegExp(
          `((\\s*)"category":\\s*"${catRe}",)\\s*\\n(\\s*"id":\\s*"${idRe}")`
        )
        if (re.test(text)) {
          text = text.replace(re, (_m, g1, g2, g3) =>
            `${g1}\n${g2}"thumbnail": ${JSON.stringify(e.thumbnail)},\n${g3}`
          )
          replaced = true
        }
      }
      if (replaced) patched++
      else {
        skipped++
        console.log(`SKIP 未匹配: ${src} / ${e.category} / ${e.id}`)
      }
    }
    await writeFile(path.join(REG, f), text)
    console.log(`patched ${f} (${entries.length} 条)`)
  }

  console.log(`回填完成: 成功 ${patched}, 跳过 ${skipped}`)
}

main().catch(e => {
  console.error('FATAL', e)
  process.exit(1)
})
