/**
 * 加载项目预编译版 Cesium（Build 产物）。
 *
 * 与示例共享壳 CesiumExampleScene 同款模式：动态 script 引入 window.Cesium，
 * 而非 npm 打包——Build 目录自带 Workers/Assets，脚本会基于自身 src 推导
 * 静态资源基址，免去 CESIUM_BASE_URL 配置。
 * dev 由 vite 直接服务 node_modules；prod 由 scripts/copy-example-deps.js
 * 把 cesium/Build/Cesium 拷进 dist/node_modules，路径不变。
 */
const CESIUM_BASE = '/node_modules/cesium/Build/Cesium'

let cesiumPromise = null

export function loadCesium() {
  if (window.Cesium) return Promise.resolve(window.Cesium)
  if (cesiumPromise) return cesiumPromise

  cesiumPromise = new Promise((resolve, reject) => {
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = `${CESIUM_BASE}/Widgets/widgets.css`
    document.head.appendChild(css)

    const script = document.createElement('script')
    script.src = `${CESIUM_BASE}/Cesium.js`
    script.onload = () => resolve(window.Cesium)
    script.onerror = () => {
      cesiumPromise = null
      reject(new Error('[map] Cesium.js 加载失败'))
    }
    document.head.appendChild(script)
  })
  return cesiumPromise
}
