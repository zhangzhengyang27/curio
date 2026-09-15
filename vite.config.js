import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { compression } from 'vite-plugin-compression2'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'
import { statSync, createReadStream } from 'node:fs'

const threeBuildDir = fileURLToPath(new URL('./src/examples/three-build-compat', import.meta.url))
const nodeEmptyStub = fileURLToPath(new URL('./src/examples/jsm-compat/node-empty.js', import.meta.url))
const lilGuiTracked = fileURLToPath(new URL('./src/examples/utils/lil-gui-tracked.js', import.meta.url))
const cesiumInterop = fileURLToPath(new URL('./src/map/cesium-interop.js', import.meta.url))

// lil-gui 原始 ESM 入口：交给 Node 解析，避免在源码里硬编码 node_modules 物理路径。
// 解析失败（例如依赖尚未安装）时返回 null，仅跳过该别名，不影响其余配置加载。
const LIL_GUI_ORIGINAL_ID = 'lil-gui/original-internal'
function resolveLilGuiEntry() {
  try {
    return fileURLToPath(import.meta.resolve('lil-gui'))
  } catch {
    console.warn('[vite.config] 无法解析 lil-gui 入口，请先执行依赖安装（npm install / pnpm install）')
    return null
  }
}
const lilGuiOriginal = resolveLilGuiEntry()

function threeCompatResolver() {
  return {
    name: 'three-compat-resolver',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'three') return `${threeBuildDir}/three.module.js`
      if (id === 'three/webgpu') return `${threeBuildDir}/three.webgpu.js`
      if (id === 'three/tsl') return `${threeBuildDir}/three.tsl.js`
    }
  }
}

// Cesium 由 cesiumLoader.js 以动态 <script> 加载（window.Cesium），不经 npm 打包。
// @cesium-extends/* 的 `import 'cesium'`（peerDependency）指到互操作 shim，
// 复用全局实例，避免打进第二份 Cesium 引擎。
// ⚠ 必须按 importer 限定作用域：cesium-transform-controls（示例中心存量依赖）
// 也裸导入 'cesium' 且用的是完整包导出，shim 只导出了 @cesium-extends 用到的
// 21 个具名，全局重定向会让它构建期 Missing export（实测复现过）。
function cesiumInteropResolver() {
  return {
    name: 'cesium-interop-resolver',
    enforce: 'pre',
    resolveId(id, importer) {
      if (id === 'cesium' && importer && importer.includes('@cesium-extends')) return cesiumInterop
    }
  }
}

// dev 专用：vite 默认静态中间件在 macOS 上无法解析 Unicode(中文)文件名
// （NFC/NFD 规范化导致解码后的中文路径在磁盘上找不到 → 走 SPA 兜底返回 index.html）。
// 这里在 vite 之前用 Node fs 按解码后的中文路径直接读 public/ 下文件返回，
// 使中文名截图封面在 dev 下也能正常显示。production 由真实静态服务器解码命中，无需此插件。
function serveUnicodePublic() {
  return {
    name: 'serve-unicode-public',
    apply: 'serve',
    configureServer(server) {
      const publicDir = fileURLToPath(new URL('./public', import.meta.url))
      const extType = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
        '.avif': 'image/avif', '.ico': 'image/x-icon'
      }
      const mw = (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next()
        const pathname = (req.url || '').split('?')[0]
        if (!pathname.startsWith('/')) return next()
        // 只拦截受中文文件名 bug 影响的 public 子目录，避免对 vite 内部请求
        // (/@vite/client、/src/*、/node_modules/*、SPA 路由等) 做无谓的 stat 系统调用。
        if (!pathname.startsWith('/example-thumbs/') && !pathname.startsWith('/threejs-official/')) return next()
        let decoded
        try { decoded = decodeURIComponent(pathname) } catch { return next() }
        const full = path.resolve(publicDir, '.' + decoded)
        if (full !== publicDir && !full.startsWith(publicDir + path.sep)) return next()
        let st
        try { st = statSync(full) } catch { return next() }
        if (!st.isFile()) return next()
        const ext = path.extname(full).toLowerCase()
        res.setHeader('Content-Type', extType[ext] || 'application/octet-stream')
        res.setHeader('Cache-Control', 'no-cache')
        if (req.method === 'HEAD') { res.end(); return }
        createReadStream(full).pipe(res)
      }
      server.middlewares.use(mw)
      // 顶到中间件栈最前，先于 vite 静态/SPA 兜底执行
      server.middlewares.stack.unshift(server.middlewares.stack.pop())
    }
  }
}

export default defineConfig({
  plugins: [
    serveUnicodePublic(),
    threeCompatResolver(),
    cesiumInteropResolver(),
    vue(),
    compression({ algorithm: 'gzip', threshold: 10240 }),
    compression({ algorithm: 'brotliCompress', threshold: 10240 })
  ],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: 'goodrays', replacement: 'three-good-godrays' },
      // lil-gui 自动追踪：所有 `import ... from 'lil-gui'` 指向包装层；
      // 包装层内部通过 LIL_GUI_ORIGINAL_ID 再指回真实入口，从而不产生自引用死循环。
      { find: /^lil-gui$/, replacement: lilGuiTracked },
      ...(lilGuiOriginal ? [{ find: LIL_GUI_ORIGINAL_ID, replacement: lilGuiOriginal }] : []),
      { find: 'three/examples/jsm', replacement: fileURLToPath(new URL('./src/examples/jsm-compat', import.meta.url)) },
      { find: 'three/addons', replacement: fileURLToPath(new URL('./src/examples/jsm-compat', import.meta.url)) },
      { find: /^\/graphics\/assets\/external\/(.+)$/, replacement: path.resolve(fileURLToPath(new URL('./public/graphics/assets/external', import.meta.url)), '$1') },
      { find: /^node:(module|worker_threads)$/, replacement: nodeEmptyStub }
    ]
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: ['node:module', 'node:worker_threads'],
      output: {
        /**
         * 分包策略。
         *
         * 这里刻意不使用 `manualChunks`：Vite 8 的打包内核是 Rolldown，Rolldown 中
         * `manualChunks` 已被废弃（会转译成 codeSplitting.groups[].name()），并且需要
         * 显式控制 group 语义。之前用 manualChunks 的实测后果是：
         *   - 产物里出现 `vendor-cesium / vendor-spark / vendor-web-ifc / vendor-3d-tiles /
         *     vendor-postprocessing / vendor-three-globe / ...`，
         *     但**没有** `vendor-three / vendor-echarts / vendor-gsap / vendor-lil-gui / vendor-theatre`；
         *   - three.js 代码被打进了 `vendor-3d-tiles` 与 `vendor-postprocessing`（重复打包）。
         * 原因是 group 的 `includeDependenciesRecursively` 默认为 true：捕获 3d-tiles-renderer /
         * postprocessing 时会把它们的依赖（three）一并吞进那个组。
         *
         * 因此：改用 codeSplitting.groups，并给 three 最高 priority ——
         * Rolldown 会先处理高优先级 group，被捕获的模块会从其它 group 中移除，
         * 从而避免 three.js 被重复打包。
         *
         * 注意：正则里用 `[\\/]` 匹配路径分隔符（Windows 兼容）。
         */
        codeSplitting: {
          groups: [
            {
              // three.js 核心 + 本地兼容层（three-build-compat），优先级最高
              name: 'vendor-three',
              test: /three-build-compat|node_modules[\\/]three[\\/]/,
              priority: 100,
            },
            { name: 'vendor-cesium', test: /node_modules[\\/](@cesium|cesium)[\\/]/, priority: 90 },
            // jsm-compat 的 CSS2DRenderer 被首页（useLabels）与海量示例共享。
            // 实测（2026-09）：不设专属分组时，Rolldown 会把它与 three-globe 等模块搅进
            // 同一个 chunk，首页为拿两个 CSS2D 类被迫下载整个 three-globe（首屏 +155 KB）。
            // ⚠ 只圈这一个文件：jsm-compat 其余部分混有顶层就访问 DOM 的示例应用
            //（mygrapics/bezier 等的 document.querySelector('canvas').getContext），
            // 大粒度分组会让首页连带执行它们而白屏（实测复现过）。
            { name: 'vendor-css2d', test: /[\\/]jsm-compat[\\/]renderers[\\/]CSS2DRenderer\.js/, priority: 90 },
            // ⚠ 刻意不为 @sparkjsdev/spark 建分组。
            // 实测（tests/perf.spec.js）：它只被单个示例动态 import，
            // 但一旦分组就变成共享 chunk，会被 Vite 提升进首页的 modulepreload
            // —— 首页首屏 2246 KB JS 里有 1714 KB（76%）是它，而首页根本不用。
            // 不分组后由打包器放回按需加载的懒加载块。
            { name: 'vendor-web-ifc', test: /node_modules[\\/]web-ifc[\\/]/, priority: 80 },
            { name: 'vendor-postprocessing', test: /node_modules[\\/]postprocessing[\\/]/, priority: 80 },
            { name: 'vendor-3d-tiles', test: /node_modules[\\/]3d-tiles-renderer[\\/]/, priority: 80 },
            { name: 'vendor-three-globe',
              test: /node_modules[\\/]three-globe[\\/]/,
              priority: 80,
              // ⚠ 必须关闭递归捕获：three-globe 的依赖（@tweenjs/tween、d3-*）是首页
              // 自己也在用的库，被吞进本组后，首页为拿 Tween/d3-scale 被迫下载
              // 整个 three-globe（首屏 +155 KB，2026-09 实测）。
              // 关闭后 tween/d3 归各自分组或默认块，three-globe 仅在真正用到时加载。
              includeDependenciesRecursively: false },
            { name: 'vendor-three-mesh-bvh', test: /node_modules[\\/]three-mesh-bvh[\\/]/, priority: 80 },
            { name: 'vendor-echarts', test: /node_modules[\\/](echarts|zrender)[\\/]/, priority: 80 },
            { name: 'vendor-gsap', test: /node_modules[\\/]gsap[\\/]/, priority: 80 },
            { name: 'vendor-lil-gui', test: /node_modules[\\/]lil-gui[\\/]/, priority: 80 },
            { name: 'vendor-theatre', test: /node_modules[\\/]@theatre[\\/]/, priority: 80 },
            { name: 'vendor-cannon-es', test: /node_modules[\\/]cannon-es[\\/]/, priority: 80 },
            { name: 'vendor-chart', test: /node_modules[\\/](chart\.js|chartjs)[\\/]/, priority: 80 },
            { name: 'vendor-d3', test: /node_modules[\\/]d3(-[a-z-]+)?[\\/]/, priority: 80 },
          ],
        },
      },
    },
  },
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    include: ['three-globe'],
    exclude: [
      'satellite.js', 'three', 'three/webgpu', 'three/tsl',
      // 这些包 import 'cesium'：一旦被预打包，优化器会把真实 cesium 源码打进去
      // （预打包不经过 resolveId 插件），dev 下出现双引擎。排除后按源码逐文件
      // 请求，'cesium' 导入走 cesiumInteropResolver。
      // ⚠ 不可再排除 @cesium-extends/measure 之类带 CJS 依赖链（turf→
      // polygon-clipping UMD）的包：裸伺服没有 ESM 互转，页面直接报错（实测）。
      '@cesium-extends/drawer', '@cesium-extends/common', '@cesium-extends/subscriber', '@cesium-extends/tooltip',
    ],
  }
})
