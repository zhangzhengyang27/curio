import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { compression } from 'vite-plugin-compression2'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'
import { existsSync, statSync, createReadStream } from 'node:fs'

const threeBuildDir = fileURLToPath(new URL('./src/examples/three-build-compat', import.meta.url))
const nodeEmptyStub = fileURLToPath(new URL('./src/examples/jsm-compat/node-empty.js', import.meta.url))
const lilGuiTracked = fileURLToPath(new URL('./src/examples/utils/lil-gui-tracked.js', import.meta.url))

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
        manualChunks(id) {
          if (id.includes('node_modules/three/') || id.includes('three-build-compat')) return 'vendor-three'
          if (id.includes('echarts')) return 'vendor-echarts'
          if (id.includes('three-globe')) return 'vendor-three-globe'
          if (id.includes('cesium')) return 'vendor-cesium'
          if (id.includes('cannon-es')) return 'vendor-cannon-es'
          if (id.includes('gsap')) return 'vendor-gsap'
          if (id.includes('lil-gui')) return 'vendor-lil-gui'
          if (id.includes('chart.js') || id.includes('chartjs')) return 'vendor-chart'
          if (id.includes('d3') || id.includes('d3-geo') || id.includes('d3-scale') || id.includes('d3-interpolate')) return 'vendor-d3'
          if (id.includes('postprocessing')) return 'vendor-postprocessing'
          if (id.includes('@sparkjsdev')) return 'vendor-spark'
          if (id.includes('@theatre')) return 'vendor-theatre'
          if (id.includes('web-ifc')) return 'vendor-web-ifc'
          if (id.includes('3d-tiles-renderer')) return 'vendor-3d-tiles'
          if (id.includes('three-mesh-bvh')) return 'vendor-three-mesh-bvh'
        }
      }
    }
  },
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    include: ['three-globe'],
    exclude: ['satellite.js', 'three', 'three/webgpu', 'three/tsl'],
  }
})
