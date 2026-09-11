import fs from 'fs'

const text = fs.readFileSync('node_modules/cesium/Source/Cesium.js', 'utf-8')
const named = [...text.matchAll(/export\s+\{([^}]+)\}\s+from\s+['"][^'"]+['"]/g)]
  .flatMap(m => m[1].split(',').map(s => s.trim()).filter(Boolean))
const unique = [...new Set(named)]

console.log('export count:', unique.length, 'has Viewer:', unique.includes('Viewer'))

const lines = unique.map(n => `export const ${n} = window.Cesium.${n};`)
lines.push('export default window.Cesium;')

fs.writeFileSync('public/external-examples/cesium-shim.js', lines.join('\n'))
console.log('generated public/external-examples/cesium-shim.js')
