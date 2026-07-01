<template>
  <div
    ref="containerRef"
    class="webgl-example-scene"
  >
    <canvas
      ref="canvasRef"
      class="webgl-example-canvas"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  /** 是否自动将 canvas 尺寸设为容器大小 */
  fitContainer: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['ready', 'resize'])

const containerRef = ref(null)
const canvasRef = ref(null)

let resizeObserver = null
let rafId = null

function resizeCanvas() {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  const rect = container.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  if (props.fitContainer) {
    canvas.width = Math.floor(rect.width * dpr)
    canvas.height = Math.floor(rect.height * dpr)
  }

  emitResize(rect, dpr)
}

function emitResize(rect, dpr) {
  const canvas = canvasRef.value
  if (!canvas) return
  emit('resize', {
    width: canvas.width,
    height: canvas.height,
    clientWidth: rect.width,
    clientHeight: rect.height,
    dpr,
  })
}

function addUpdateCallback(callback) {
  if (rafId) cancelAnimationFrame(rafId)

  function loop(time) {
    callback(time)
    rafId = requestAnimationFrame(loop)
  }

  rafId = requestAnimationFrame(loop)
}

function removeUpdateCallback() {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

onMounted(() => {
  resizeCanvas()

  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return
    const rect = entry.contentRect
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    emitResize(rect, dpr)
  })
  resizeObserver.observe(containerRef.value)

  emit('ready', {
    canvas: canvasRef.value,
    container: containerRef.value,
    resize: resizeCanvas,
    addUpdateCallback,
    removeUpdateCallback,
  })
})

onUnmounted(() => {
  removeUpdateCallback()
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<style scoped>
.webgl-example-scene {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
}

.webgl-example-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
