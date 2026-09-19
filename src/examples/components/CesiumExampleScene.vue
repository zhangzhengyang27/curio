<template>
  <div
    ref="containerRef"
    class="cesium-example-scene"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from 'vue'

const props = defineProps({
  /** Cesium Viewer 构造选项（对象或接收 Cesium 的函数） */
  viewerOptions: {
    type: [Object, Function],
    default: () => ({}),
  },
})

const emit = defineEmits(['ready', 'before-dispose'])

const containerRef = ref<HTMLElement | null>(null)
let viewer: any = null

function loadCesiumScript() {
  return new Promise((resolve, reject) => {
    if (window.Cesium) {
      resolve(window.Cesium)
      return
    }
    const script = document.createElement('script')
    script.src = '/node_modules/cesium/Build/Cesium/Cesium.js'
    script.onload = () => resolve(window.Cesium)
    script.onerror = () => reject(new Error('[CesiumExampleScene] failed to load Cesium.js'))
    document.head.appendChild(script)
  })
}

async function init() {
  if (!containerRef.value) return
  const Cesium: any = await loadCesiumScript()
  if (!Cesium) {
    console.warn('[CesiumExampleScene] window.Cesium is not available')
    return
  }

  const resolvedOptions = typeof props.viewerOptions === 'function'
    ? props.viewerOptions(Cesium)
    : props.viewerOptions

  viewer = new Cesium.Viewer(containerRef.value!, {
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    navigationHelpButton: false,
    ...resolvedOptions,
  })

  const ctx = {
    get viewer() {
      return viewer
    },
    get scene() {
      return viewer?.scene
    },
    get camera() {
      return viewer?.camera
    },
    get entities() {
      return viewer?.entities
    },
    get dataSources() {
      return viewer?.dataSources
    },
    get cesium() {
      return Cesium
    },
    dispose,
  }

  provide('cesiumExampleScene', ctx)
  emit('ready', ctx)
}

function dispose() {
  emit('before-dispose', { viewer })
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy()
    viewer = null
  }
}

onMounted(() => {
  init().catch((err) => {
    console.warn('[CesiumExampleScene] init error:', err)
  })
})
onUnmounted(dispose)

defineExpose({
  get viewer() {
    return viewer
  },
})
</script>

<style scoped>
.cesium-example-scene {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
}

.cesium-example-scene :deep(.cesium-viewer) {
  width: 100%;
  height: 100%;
}

.cesium-example-scene :deep(.cesium-viewer-bottom) {
  display: none;
}

.cesium-example-scene :deep(.cesium-viewer-toolbar) {
  display: none;
}
</style>
