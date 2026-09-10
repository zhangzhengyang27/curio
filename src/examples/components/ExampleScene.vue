<template>
  <div
    ref="containerRef"
    class="example-scene"
  >
    <canvas
      ref="canvasRef"
      class="example-scene-canvas"
    />
    <div
      ref="overlayRef"
      class="example-scene-overlay"
    />
    <slot
      v-if="isReady"
      v-bind="slotProps"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useExampleStage } from '../../composables/useExampleStage.js'

const props = defineProps({
  /** 相机类型 */
  camera: {
    type: String,
    default: 'perspective',
    validator: (v) => ['perspective', 'orthographic'].includes(v),
  },
  /** 相机专属参数 */
  cameraOptions: {
    type: Object,
    default: () => ({}),
  },
  /** 相机初始位置，支持 [x,y,z] 或 {x,y,z} */
  cameraPosition: {
    type: [Array, Object],
    default: null,
  },
  /** 相机注视点，支持 [x,y,z] 或 {x,y,z} */
  cameraLookAt: {
    type: [Array, Object],
    default: null,
  },
  /** 背景清除颜色 */
  clearColor: {
    type: [Number, String],
    default: 0x0a0a1a,
  },
  /** 背景清除透明度，未指定时 alpha=true 自动为 0 */
  clearAlpha: {
    type: Number,
    default: null,
  },
  /** 是否开启渲染器 alpha 通道 */
  alpha: {
    type: Boolean,
    default: false,
  },
  /** 是否开启抗锯齿 */
  antialias: {
    type: Boolean,
    default: true,
  },
  /** 是否保留绘图缓冲 */
  preserveDrawingBuffer: {
    type: Boolean,
    default: false,
  },
  /** 是否启用轨道控制器 */
  enableControls: {
    type: Boolean,
    default: true,
  },
  /** 轨道控制器额外配置 */
  controlOptions: {
    type: Object,
    default: () => ({}),
  },
  /** 是否开启阴影映射，可传 { type: THREE.PCFSoftShadowMap } */
  shadowMap: {
    type: [Boolean, Object],
    default: false,
  },
  /** 是否添加默认灯光，可传 { ambientColor, ambientIntensity, dirColor, dirIntensity, dirPosition } */
  defaultLights: {
    type: [Boolean, Object],
    default: false,
  },
  /** 是否按容器大小自适应（否则按 window） */
  fitContainer: {
    type: Boolean,
    default: true,
  },
  /** 挂载后是否自动启动渲染循环 */
  autoStart: {
    type: Boolean,
    default: true,
  },
  /** 最大设备像素比 */
  maxPixelRatio: {
    type: Number,
    default: 2,
  },
  /** 是否显示网格辅助线 */
  grid: {
    type: Boolean,
    default: false,
  },
  /** 是否使用自定义渲染（关闭默认 renderer.render，由 updateCallback 自行调用如 composer.render） */
  customRender: {
    type: Boolean,
    default: false,
  },
  /** 是否启用 CSS 渲染器，可选 'css2d' | 'css3d' | 'both' */
  cssRenderer: {
    type: String,
    default: '',
    validator: (v) => ['', 'css2d', 'css3d', 'both'].includes(v),
  },
  /** 渲染器额外构造参数，如 { outputBufferType: THREE.HalfFloatType } */
  rendererOptions: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['ready', 'resize', 'before-dispose'])

const containerRef = ref(null)
const canvasRef = ref(null)
const overlayRef = ref(null)

function onReady(ctx) {
  emit('ready', ctx)
}

function onResize(size) {
  emit('resize', size)
}

function onBeforeDispose(ctx) {
  emit('before-dispose', ctx)
}

const stage = useExampleStage(canvasRef, containerRef, overlayRef, {
  camera: props.camera,
  cameraOptions: props.cameraOptions,
  cameraPosition: props.cameraPosition,
  cameraLookAt: props.cameraLookAt,
  clearColor: props.clearColor,
  clearAlpha: props.clearAlpha,
  alpha: props.alpha,
  antialias: props.antialias,
  preserveDrawingBuffer: props.preserveDrawingBuffer,
  enableControls: props.enableControls,
  controlOptions: props.controlOptions,
  shadowMap: props.shadowMap,
  defaultLights: props.defaultLights,
  fitContainer: props.fitContainer,
  autoStart: props.autoStart,
  maxPixelRatio: props.maxPixelRatio,
  grid: props.grid,
  customRender: props.customRender,
  cssRenderer: props.cssRenderer,
  rendererOptions: props.rendererOptions,
  onReady,
  onResize,
  onBeforeDispose,
})

const { isReady } = stage

const slotProps = computed(() => ({
  scene: stage.scene,
  camera: stage.camera,
  renderer: stage.renderer,
  controls: stage.controls,
  renderLoop: stage.renderLoop,
  isReady: stage.isReady,
  size: stage.size,
  canvas: stage.canvas,
  container: stage.container,
  overlay: stage.overlay,
  add: stage.add,
  remove: stage.remove,
  addUpdateCallback: stage.addUpdateCallback,
  removeUpdateCallback: stage.removeUpdateCallback,
  setCamera: stage.setCamera,
  renderOnce: stage.renderOnce,
  resize: stage.resize,
  listen: stage.listen,
  dispose: stage.dispose,
}))

watch(
  () => props.clearColor,
  (color) => {
    if (stage.renderer) stage.renderer.setClearColor(color)
  }
)

defineExpose(stage)
</script>

<style scoped>
.example-scene {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
}

.example-scene-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.example-scene-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.example-scene-overlay > * {
  pointer-events: auto;
}

:global(.example-scene-css-renderer) {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  pointer-events: none !important;
  overflow: hidden !important;
}

:global(.example-scene-css2d) {
  z-index: 2;
}

:global(.example-scene-css3d) {
  z-index: 1;
}
</style>
