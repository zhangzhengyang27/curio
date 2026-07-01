 
const fs = require('fs')
const path = require('path')

const TARGET_DIR = '/Users/zhangzhengyang/Desktop/Code/数据可视化/earth-app/src/examples/components/webgl'

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath)
    } else if (entry.isFile() && entry.name.endsWith('.vue')) {
      let content = fs.readFileSync(fullPath, 'utf-8')
      let modified = false

      // 修复 function { 为 function initEvent() {
      // 这类问题源于 convert-webgl-examples.cjs 移除了 initEvent() 调用时误伤了函数声明
      if (/function\s*\{/.test(content)) {
        content = content.replace(/function\s*\{/g, 'function initEvent() {')
        modified = true
      }

      // 修复 let let attribOutUV 为 let attribOutUV
      if (/let let attribOutUV/.test(content)) {
        content = content.replace(/let let attribOutUV/g, 'let attribOutUV')
        modified = true
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf-8')
        console.log(`Fixed: ${fullPath}`)
      }
    }
  }
}

walk(TARGET_DIR)
console.log('WebGL conversion bug fixes done.')
