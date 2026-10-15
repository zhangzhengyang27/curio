import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { compression } from 'vite-plugin-compression2'
import { fileURLToPath, URL } from 'node:url'

const threeBuildDir = fileURLToPath(new URL('./src/examples/three-build-compat', import.meta.url))
const nodeEmptyStub = fileURLToPath(new URL('./src/examples/jsm-compat/node-empty.js', import.meta.url))
const cesiumInterop = fileURLToPath(new URL('./src/map/cesium-interop.ts', import.meta.url))

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
// ⚠ 必须按 importer 限定作用域：其它裸导入 'cesium' 的三方包用的是完整包导出，
// shim 只导出了 @cesium-extends 用到的具名，全局重定向会构建期 Missing export（实测复现过）。
function cesiumInteropResolver() {
  return {
    name: 'cesium-interop-resolver',
    enforce: 'pre',
    resolveId(id, importer) {
      if (id === 'cesium' && importer && importer.includes('@cesium-extends')) return cesiumInterop
    }
  }
}

// dev 与 preview 共用的代理规则（server/ 后端，默认 127.0.0.1:8787）。
// 写 127.0.0.1 而非 localhost：后端默认只监听 IPv4 回环，
// 而某些环境下 localhost 会先解析到 ::1 导致代理打不通。
// 后端没起时：/api 返回 504 → 前端按设计降级到打包快照（quakeSource.ts）；
// /tiles 探测失败 → tileSource.ts 自动退回直连天地图。两条都不白屏。
const BACKEND_TARGET = 'http://127.0.0.1:8787'
const TILE_PROXY_RULES = {
  /** /monitor 的地震数据 API */
  '/api': { target: BACKEND_TARGET, changeOrigin: true },
  /**
   * 天地图瓦片同源反代（同一个 server/ 进程，见 server/src/tiles.ts）。
   * 只有 .env.local 配了 VITE_TILE_PROXY=/tiles 前端才会请求这个路径。
   */
  '/tiles': { target: BACKEND_TARGET, changeOrigin: true },
}

export default defineConfig({
  plugins: [
    threeCompatResolver(),
    cesiumInteropResolver(),
    vue(),
    compression({ algorithm: 'gzip', threshold: 10240 }),
    compression({ algorithm: 'brotliCompress', threshold: 10240 })
  ],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: 'three/examples/jsm', replacement: fileURLToPath(new URL('./src/examples/jsm-compat', import.meta.url)) },
      { find: 'three/addons', replacement: fileURLToPath(new URL('./src/examples/jsm-compat', import.meta.url)) },
      // vue-cesium 混用了 CJS 版 lodash（cesium-helpers.mjs）；它被 optimizeDeps
      // 排除后裸伺服，CJS 的 named export 失效，统一指到 ESM 版
      { find: /^lodash$/, replacement: 'lodash-es' },
      { find: /^node:(module|worker_threads)$/, replacement: nodeEmptyStub }
    ]
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: TILE_PROXY_RULES,
  },
  // preview 与 dev 走同一套代理规则：AGENTS.md 第 5 节要求「dev 与 preview 都要跑」，
  // 而 VITE_TILE_PROXY 是构建期注入的 —— 只在 dev 配代理的话，
  // 产物里开着反代、preview 却没有 /tiles 可打，等于这条路径从来没被测过。
  preview: { proxy: TILE_PROXY_RULES },
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
            // jsm-compat 的 CSS2DRenderer 被首页（useLabels）使用。
            // 实测（2026-09）：不设专属分组时，Rolldown 会把它与 three-globe 等模块搅进
            // 同一个 chunk，首页为拿两个 CSS2D 类被迫下载整个 three-globe（首屏 +155 KB）。
            // ⚠ 只圈这一个文件：jsm-compat 其余部分不要大粒度分组。
            { name: 'vendor-css2d', test: /[\\/]jsm-compat[\\/]renderers[\\/]CSS2DRenderer\.js/, priority: 90 },
            { name: 'vendor-three-globe',
              test: /node_modules[\\/]three-globe[\\/]/,
              priority: 80,
              // ⚠ 必须关闭递归捕获：three-globe 的依赖（@tweenjs/tween、d3-*）是首页
              // 自己也在用的库，被吞进本组后，首页为拿 Tween/d3-scale 被迫下载
              // 整个 three-globe（首屏 +155 KB，2026-09 实测）。
              // 关闭后 tween/d3 归各自分组或默认块，three-globe 仅在真正用到时加载。
              includeDependenciesRecursively: false },
            { name: 'vendor-echarts', test: /node_modules[\\/](echarts|zrender)[\\/]/, priority: 80 },
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
      // vue-cesium 必须走预打包：裸伺服（exclude）下其依赖链里的 CJS 包
      // （lodash、@zouyaoji/heatmap.js…）named export 失效，页面直接报错。
      // ⚠ 使用其量测/绘制组件时，:measurements 等必须传稳定数组引用——
      // 内联 .map() 会在父组件重渲染时使其内部 action 表 computed 失效重建，
      // 点击链路静默失效（曾误判为构建内核问题，见 CHANGELOG 2026-09-17 条）
    ],
  }
})
