import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const nodeModules = path.join(projectRoot, 'node_modules')
// 支持与 `vite build --outDir X` 配套使用：node scripts/copy-example-deps.js --outDir X
// （--outDir=X 与 --outDir X 两种写法皆可）
// 否则产物（dist/node_modules 下的 cesium/three 运行时资源）缺失，/tools 与示例会 404
const eqArg = process.argv.find((a) => a.startsWith('--outDir='))
const eqIdx = process.argv.indexOf('--outDir')
const outDirArg = eqArg ? eqArg.split('=')[1] : eqIdx > -1 ? process.argv[eqIdx + 1] : null
const dist = outDirArg ? path.resolve(outDirArg) : path.join(projectRoot, 'dist')
const distNodeModules = path.join(dist, 'node_modules')

/**
 * 复制单个文件或目录
 * @param {string} src
 * @param {string} dest
 */
function copy(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`[copy-example-deps] 源不存在: ${src}`)
    return
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    fs.cpSync(src, dest, { recursive: true, force: true })
  } else {
    fs.copyFileSync(src, dest)
  }
}

/**
 * 依赖列表：从 node_modules 复制到 dist/node_modules
 * 格式：[源相对 node_modules 路径, 目标相对 dist/node_modules 路径]
 */
const deps = [
  ['three/build/three.core.js', 'three/build/three.core.js'],
  ['three/build/three.module.js', 'three/build/three.module.js'],
  ['three/examples/jsm', 'three/examples/jsm'],
  ['lil-gui/dist/lil-gui.esm.js', 'lil-gui/dist/lil-gui.esm.js'],
  ['gsap/index.js', 'gsap/index.js'],
  ['gsap/gsap-core.js', 'gsap/gsap-core.js'],
  ['gsap/CSSPlugin.js', 'gsap/CSSPlugin.js'],
  ['gsap/package.json', 'gsap/package.json'],
  ['animejs/dist/modules', 'animejs/dist/modules'],
  ['@tweenjs/tween.js/dist/tween.esm.js', '@tweenjs/tween.js/dist/tween.esm.js'],
  ['three-mesh-bvh/src', 'three-mesh-bvh/src'],
  ['postprocessing/build', 'postprocessing/build'],
  ['postprocessing/package.json', 'postprocessing/package.json'],
  ['cesium/Source', 'cesium/Source'],
  ['cesium/Build/Cesium', 'cesium/Build/Cesium'],
  ['cesium/package.json', 'cesium/package.json'],
  ['cesium-transform-controls/dist', 'cesium-transform-controls/dist'],
  ['cesium-transform-controls/package.json', 'cesium-transform-controls/package.json'],
  ['@mkkellogg/gaussian-splats-3d/build', '@mkkellogg/gaussian-splats-3d/build'],
  ['@mkkellogg/gaussian-splats-3d/package.json', '@mkkellogg/gaussian-splats-3d/package.json'],
  ['@sparkjsdev/spark/dist', '@sparkjsdev/spark/dist'],
  ['@sparkjsdev/spark/package.json', '@sparkjsdev/spark/package.json'],
]

if (!fs.existsSync(dist)) {
  console.error('[copy-example-deps] dist 目录不存在，请先运行 vite build')
  process.exit(1)
}

deps.forEach(([srcRel, destRel]) => {
  const src = path.join(nodeModules, srcRel)
  const dest = path.join(distNodeModules, destRel)
  copy(src, dest)
})

console.log(`[copy-example-deps] 已将示例依赖复制到 ${distNodeModules}`)
