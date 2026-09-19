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

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useWebGPUExampleStage } from '../composables/useWebGPUExampleStage'

const props = defineProps({
  camera: {
    type: String,
    default: 'perspective',
    validator: (v: any) => ['perspective', 'orthographic'].includes(v),
  },
  cameraOptions: {
    type: Object,
    default: () => ({}),
  },
  cameraPosition: {
    type: [Array, Object],
    default: null,
  },
  cameraLookAt: {
    type: [Array, Object],
    default: null,
  },
  clearColor: {
    type: [Number, String],
    default: 0x0a0a1a,
  },
  clearAlpha: {
    type: Number,
    default: null,
  },
  alpha: {
    type: Boolean,
    default: false,
  },
  antialias: {
    type: Boolean,
    default: true,
  },
  preserveDrawingBuffer: {
    type: Boolean,
    default: false,
  },
  enableControls: {
    type: Boolean,
    default: true,
  },
  controlOptions: {
    type: Object,
    default: () => ({}),
  },
  shadowMap: {
    type: [Boolean, Object],
    default: false,
  },
  defaultLights: {
    type: [Boolean, Object],
    default: false,
  },
  fitContainer: {
    type: Boolean,
    default: true,
  },
  autoStart: {
    type: Boolean,
    default: true,
  },
  maxPixelRatio: {
    type: Number,
    default: 2,
  },
  grid: {
    type: Boolean,
    default: false,
  },
  customRender: {
    type: Boolean,
    default: false,
  },
  rendererOptions: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['ready', 'resize', 'before-dispose'])

const containerRef = ref(null)
const canvasRef = ref(null)
const overlayRef = ref(null)

function onReady(ctx: any) {
  emit('ready', ctx)
}

function onResize(size: any) {
  emit('resize', size)
}

function onBeforeDispose(ctx: any) {
  emit('before-dispose', ctx)
}

const stage = useWebGPUExampleStage(canvasRef, containerRef, overlayRef, {
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
</style>
