import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const threeBuildDir = fileURLToPath(new URL('./src/examples/three-build-compat', import.meta.url))

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
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'goodrays': 'three-good-godrays',
      'three/examples/jsm': fileURLToPath(new URL('./src/examples/jsm-compat', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  build: {
    target: 'esnext'
  },
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    include: ['three-globe'],
    exclude: ['satellite.js', 'three', 'three/webgpu', 'three/tsl'],
  }
})
