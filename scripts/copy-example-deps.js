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
 *
 * 2026-10-15 示例中心移除后收敛为仅 Cesium：/tools 与 vue-cesium 的运行时
 * 由 src/map/cesiumLoader.ts 以 CESIUM_BASE='/node_modules/cesium/Build/Cesium'
 * 动态 <script> 加载，dev 下 vite 直接服务 node_modules，生产必须由本脚本
 * 把 Build 产物拷进 dist/node_modules（ Workers/Assets/ThirdParty 与 Cesium.js
 * 相对自身 URL 加载，整目录拷贝）。原先的 three/gsap/lil-gui 等十余项只服务
 * 已删除的示例 iframe 运行器，随示例中心一并移除。
 */
const deps = [
  ['cesium/Build/Cesium', 'cesium/Build/Cesium'],
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

console.log(`[copy-example-deps] 已将 Cesium 运行时复制到 ${distNodeModules}`)
