<template>
  <div
    ref="containerRef"
    class="example-scene"
  >
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
import { ref, computed } from 'vue'
import { useSVGExampleStage } from '../composables/useSVGExampleStage.js'

const props = defineProps({
  camera: {
    type: String,
    default: 'perspective',
    validator: (v) => ['perspective', 'orthographic'].includes(v),
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
  enableControls: {
    type: Boolean,
    default: true,
  },
  controlOptions: {
    type: Object,
    default: () => ({}),
  },
  fitContainer: {
    type: Boolean,
    default: true,
  },
  autoStart: {
    type: Boolean,
    default: true,
  },
  colorManagement: {
    type: Boolean,
    default: false,
  },
  defaultLights: {
    type: [Boolean, Object],
    default: false,
  },
  grid: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['ready', 'resize', 'before-dispose'])

const containerRef = ref(null)
const overlayRef = ref(null)

function onReady(ctx) { emit('ready', ctx) }
function onResize(size) { emit('resize', size) }
function onBeforeDispose(ctx) { emit('before-dispose', ctx) }

const stage = useSVGExampleStage(containerRef, overlayRef, {
  camera: props.camera,
  cameraOptions: props.cameraOptions,
  cameraPosition: props.cameraPosition,
  cameraLookAt: props.cameraLookAt,
  enableControls: props.enableControls,
  controlOptions: props.controlOptions,
  fitContainer: props.fitContainer,
  autoStart: props.autoStart,
  colorManagement: props.colorManagement,
  defaultLights: props.defaultLights,
  grid: props.grid,
  onReady,
  onResize,
  onBeforeDispose,
})

const { isReady } = stage

const slotProps = computed(() => ({
  scene: stage.scene,
  camera: stage.camera,
  renderer: stage.renderer,
  rendererDomElement: stage.rendererDomElement,
  controls: stage.controls,
  container: stage.container,
  overlay: stage.overlay,
  renderLoop: stage.renderLoop,
  isReady: stage.isReady,
  size: stage.size,
  add: stage.add,
  remove: stage.remove,
  addUpdateCallback: stage.addUpdateCallback,
  removeUpdateCallback: stage.removeUpdateCallback,
  setCamera: stage.setCamera,
  renderOnce: stage.renderOnce,
  resize: stage.resize,
  dispose: stage.dispose,
}))

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

.example-scene-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 2;
}

.example-scene-overlay > * {
  pointer-events: auto;
}

:global(.example-scene-svg-renderer) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
