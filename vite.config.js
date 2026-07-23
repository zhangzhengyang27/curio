import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'
import { existsSync, statSync, readFileSync } from 'node:fs'

const threeBuildDir = fileURLToPath(new URL('./src/examples/three-build-compat', import.meta.url))
const nodeEmptyStub = fileURLToPath(new URL('./src/examples/jsm-compat/node-empty.js', import.meta.url))

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
        let decoded
        try { decoded = decodeURIComponent(pathname) } catch { return next() }
        const full = path.resolve(publicDir, '.' + decoded)
        if (full !== publicDir && !full.startsWith(publicDir + path.sep)) return next()
        let st
        try { st = statSync(full) } catch { return next() }
        if (!st.isFile()) return next()
        const ext = path.extname(full).toLowerCase()
        res.setHeader('Content-Type', extType[ext] || 'application/octet-stream')
        res.setHeader('Cache-Control', 'public, max-age=0')
        const buf = readFileSync(full)
        res.end(req.method === 'HEAD' ? undefined : buf)
      }
      server.middlewares.use(mw)
      // 顶到中间件栈最前，先于 vite 静态/SPA 兜底执行
      server.middlewares.stack.unshift(server.middlewares.stack.pop())
    }
  }
}

export default defineConfig({
  plugins: [serveUnicodePublic(), threeCompatResolver(), vue()],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: 'goodrays', replacement: 'three-good-godrays' },
      { find: 'three/examples/jsm', replacement: fileURLToPath(new URL('./src/examples/jsm-compat', import.meta.url)) },
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
          if (id.includes('echarts')) return 'vendor-echarts'
          if (id.includes('three-globe')) return 'vendor-three-globe'
          if (id.includes('cannon-es')) return 'vendor-cannon-es'
          if (id.includes('gsap') && !id.includes('node_modules')) return
          if (id.includes('gsap')) return 'vendor-gsap'
          if (id.includes('lil-gui')) return 'vendor-lil-gui'
          if (id.includes('chart.js') || id.includes('chartjs')) return 'vendor-chart'
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
