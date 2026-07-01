<template>
  <div class="iframe-runner">
    <iframe
      v-if="srcDoc"
      ref="iframeRef"
      title="three-example"
      :srcdoc="srcDoc"
      sandbox="allow-scripts allow-same-origin"
      class="example-iframe"
    />
    <div
      v-else
      class="loading"
    >
      正在准备示例...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  example: {
    type: Object,
    required: true,
  },
})

const iframeRef = ref(null)
const srcDoc = ref('')

const THREE_VERSION = '0.185.0'

const DEFAULT_IMPORT_MAP = {
  imports: {
    three: '/node_modules/three/build/three.module.js',
    'three/addons/': '/node_modules/three/examples/jsm/',
    'three/examples/jsm/': '/node_modules/three/examples/jsm/',
    gsap: '/node_modules/gsap/index.js',
    'gsap/': '/node_modules/gsap/',
    'dat.gui': '/node_modules/dat.gui/build/dat.gui.module.js',
    animejs: '/node_modules/animejs/dist/modules/index.js',
    '@tweenjs/tween.js': '/node_modules/@tweenjs/tween.js/dist/tween.esm.js',
    'three-mesh-bvh': '/node_modules/three-mesh-bvh/src/index.js',
    'three-mesh-bvh/': '/node_modules/three-mesh-bvh/src/',
    postprocessing: '/node_modules/postprocessing/build/index.js',
    'postprocessing/': '/node_modules/postprocessing/build/',
    d3: 'https://esm.sh/d3@7.9.0',
    cesium: '/external-examples/cesium-shim.js',
    'cesium-transform-controls': '/node_modules/cesium-transform-controls/dist/cesium-transform-controls.es.js',
    'cesium-transform-controls/': '/node_modules/cesium-transform-controls/dist/',
    '@mkkellogg/gaussian-splats-3d': '/node_modules/@mkkellogg/gaussian-splats-3d/build/gaussian-splats-3d.module.js',
    '@mkkellogg/gaussian-splats-3d/': '/node_modules/@mkkellogg/gaussian-splats-3d/build/',
    '@sparkjsdev/spark': '/node_modules/@sparkjsdev/spark/dist/spark.module.js',
    '@sparkjsdev/spark/': '/node_modules/@sparkjsdev/spark/dist/',
  },
}

function buildDoc() {
  const { entry, deps = {}, globals = {} } = props.example
  if (!entry) return ''

  const importMap = {
    imports: {
      ...DEFAULT_IMPORT_MAP.imports,
      ...deps,
    },
  }

  const globalScripts = Object.entries(globals)
    .map(([key, value]) => `window.${key} = ${JSON.stringify(value)};`)
    .join('\n')

  const fileHost = globals.FILE_HOST || '/external-examples/3d-file-server/'
  const globalConfigScript = `window.GLOBAL_CONFIG = {
  getLayerUrl: () => 'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer',
  getFileUrl: (url) => ${JSON.stringify(fileHost)} + url,
  ElMessage: (msg) => console.log('[ElMessage]', msg)
};`

  const isCesium = entry.includes('cesiumExamples')
  const cesiumScript = isCesium
    ? `<script src="/node_modules/cesium/Build/Cesium/Cesium.js"><\/script>`
    : ''

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Three.js Example</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #box { width: 100%; height: 100%; overflow: hidden; background: #000; }
    body { position: relative; }
  </style>
  <script type="importmap">${JSON.stringify(importMap)}<\/script>
  ${cesiumScript}
</head>
<body>
  <div id="box">
    <canvas id="canvas" style="width:100%;height:100%;display:block;"></canvas>
  </div>
  <script>
    ${globalScripts}
    ${globalConfigScript}
    window.box = document.getElementById('box');
    window.addEventListener('error', e => {
      console.error('[Example Error]', e.message, e.filename, e.lineno);
    });
  <\/script>
  <script type="module" src="${entry}"><\/script>
</body>
</html>`
}

onMounted(() => {
  srcDoc.value = buildDoc()
})

onUnmounted(() => {
  // 清空 srcDoc 使 iframe 从 DOM 中移除，释放 WebGL 上下文等资源
  srcDoc.value = ''
  iframeRef.value = null
})
</script>

<style scoped>
.iframe-runner {
  width: 100%;
  height: 100%;
  position: relative;
  background: #000;
}

.example-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.loading {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 14px;
  background: #0a0a1a;
}
</style>
