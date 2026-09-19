<template>
  <div class="tools-example">
    <div
      v-if="loadError"
      class="state-panel tv-glass-panel"
      data-testid="example-error"
    >
      {{ loadError }}
    </div>
    <div
      v-else-if="!cesiumReady"
      class="state-panel tv-glass-panel"
      data-testid="example-loading"
    >
      Cesium 加载中…
    </div>
    <VcConfigProvider v-else>
      <VcViewer
        :camera="cameraProp"
        :base-layer="false"
        :animation="false"
        :base-layer-picker="false"
        :fullscreen-button="false"
        :geocoder="false"
        :home-button="false"
        :info-box="false"
        :scene-mode-picker="false"
        :selection-indicator="false"
        :timeline="false"
        :navigation-help-button="false"
        @ready="onViewerReady"
      >
        <slot />
      </VcViewer>
    </VcConfigProvider>

    <header class="example-header tv-glass-panel">
      <RouterLink
        class="back-link"
        to="/tools"
        data-testid="back-to-gallery"
      >
        ← 示例列表
      </RouterLink>
      <h2
        class="example-title"
        data-testid="example-title"
      >
        {{ title }}
      </h2>
      <p
        v-if="description"
        class="example-desc"
      >
        {{ description }}
      </p>
    </header>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { VcConfigProvider, VcViewer } from 'vue-cesium'
import 'vue-cesium/dist/index.css'
import { loadCesium } from '../../map/cesiumLoader'
import { applyTdtStack, applyViewerConstraints } from '../../map/createViewer'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  /** 初始相机 {lon,lat,height}；缺省用城市级视角（同综合工具箱，KNOWN_PITFALLS D3） */
  view: { type: Object, default: null },
})
const emit = defineEmits(['viewer-ready'])

const cesiumReady = ref(false)
const loadError = ref('')

/**
 * vc-viewer 在 viewer 创建后会无条件 setViewerCamera(props.camera)
 * （props.camera 有默认值"默认在中国"，105°E/30°N/1900 万米），必须显式传视角。
 */
const cameraProp = computed(() => ({
  position: {
    lng: props.view?.lon ?? 114.3,
    lat: props.view?.lat ?? 30.6,
    height: props.view?.height ?? 350_000,
  },
  heading: 360,
  pitch: -90,
  roll: 0,
}))

/**
 * 让 vc-viewer 用默认路径自建 viewer（viewerCreator 传入自建 viewer 时，
 * 其内部 VcCollectionPrimitive → 量测/绘制子组件的挂载协调会失效，
 * cmpRef 恒为 null，地图点击被静默吞掉——实测 3.2.12）。
 * 天地图底图与统一约束在 viewer 就绪后叠加：
 * baseLayer=false 避免闪官方 NaturalEarthII，ready 后由 applyTdtStack 补齐。
 */
function onViewerReady(readyObj: any) {
  const { Cesium, viewer } = readyObj
  Cesium.RequestScheduler.requestsPerServer = 1
  // 每个新 viewer 的 imageryLayers 都是空的（baseLayer=false），applyTdtStack 幂等
  applyTdtStack(viewer, 'vec')
  applyViewerConstraints(Cesium, viewer)
  emit('viewer-ready', viewer, Cesium)
}

onMounted(async () => {
  try {
    await loadCesium()
    // window.Cesium 就绪后，vue-cesium 的 getCesiumScript 直接复用，不重复注入脚本
    cesiumReady.value = true
  } catch (err: any) {
    loadError.value = err?.message || 'Cesium 加载失败'
  }
})
</script>

<style scoped>
.tools-example {
  position: fixed;
  top: var(--tv-top-nav-height);
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  background: #000;
}

.tools-example :deep(.vc-viewer) {
  width: 100%;
  height: 100%;
}

.state-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 16px 24px;
  border-radius: 12px;
  color: #eee;
  z-index: 5;
}

.example-header {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  width: 320px;
  padding: 12px 14px;
  border-radius: 14px;
}

.back-link {
  font-size: 12px;
  color: #8ec9ff;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.example-title {
  margin: 6px 0 4px;
  font-size: 17px;
  color: #fff;
}

.example-desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: #b9c6d4;
}

/* 示例功能面板：与 header 同列堆叠，风格对齐综合工具箱的左面板。
   slot 内容带的是父组件作用域 id，须用 :deep 穿透 */
.tools-example :deep(.tool-panel) {
  position: absolute;
  top: 150px;
  left: 16px;
  z-index: 10;
  width: 320px;
  padding: 14px;
  border-radius: 14px;
  max-height: calc(100% - 180px);
  overflow: auto;
}
</style>
