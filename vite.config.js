import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'

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

export default defineConfig({
  plugins: [threeCompatResolver(), vue()],
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
