<template>
  <div class="worker-offscreen-container">
    <div class="info">
      <a
        href="https://threejs.org"
        target="_blank"
        rel="noopener noreferrer"
      >three.js</a>
      - offscreen canvas (
      <a
        href="https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas"
        target="_blank"
        rel="noopener noreferrer"
      >about</a>
      )
      <p
        v-if="!offscreenSupported"
        class="message"
      >
        Your browser does not support OffscreenCanvas with a WebGL Context.
      </p>
    </div>

    <div
      ref="containerRef"
      class="canvas-container"
    >
      <canvas
        ref="canvas1Ref"
        class="onscreen-canvas"
      />
      <canvas
        ref="canvas2Ref"
        class="offscreen-canvas"
      />
    </div>
    <div class="ui">
      <button
        ref="buttonRef"
        @click="toggleJank"
      >
        START JANK
      </button>
      <span
        ref="resultRef"
        class="result"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import OffscreenWorker from './offscreen.worker.js?worker'
import { init } from './offscreen-scene.js'

const containerRef = ref(null)
const canvas1Ref = ref(null)
const canvas2Ref = ref(null)
const buttonRef = ref(null)
const resultRef = ref(null)

const offscreenSupported = ref(true)

let worker = null
let interval = null

function toggleJank() {
  if (interval === null) {
    interval = setInterval(jank, 1000 / 60)
    if (buttonRef.value) buttonRef.value.textContent = 'STOP JANK'
  } else {
    clearInterval(interval)
    interval = null
    if (buttonRef.value) buttonRef.value.textContent = 'START JANK'
    if (resultRef.value) resultRef.value.textContent = ''
  }
}

function jank() {
  let number = 0
  for (let i = 0; i < 10000000; i++) {
    number += Math.random()
  }
  if (resultRef.value) resultRef.value.textContent = number
}

onMounted(() => {
  if (!canvas1Ref.value || !canvas2Ref.value) return

  const pixelRatio = window.devicePixelRatio
  const width = canvas1Ref.value.clientWidth
  const height = canvas1Ref.value.clientHeight

  // onscreen
  init(canvas1Ref.value, width, height, pixelRatio, '/threejs-official/')

  // offscreen
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  let supportOffScreenWebGL = 'transferControlToOffscreen' in canvas2Ref.value

  // Safari < 17 doesn't support OffscreenCanvas with a WebGL context.
  if (isSafari) {
    const versionMatch = navigator.userAgent.match(/version\/(\d+)/i)
    const safariVersion = versionMatch ? parseInt(versionMatch[1]) : 0
    supportOffScreenWebGL = safariVersion >= 17
  }

  if (supportOffScreenWebGL) {
    const offscreen = canvas2Ref.value.transferControlToOffscreen()
    worker = new OffscreenWorker()
    worker.postMessage(
      {
        drawingSurface: offscreen,
        width: canvas2Ref.value.clientWidth,
        height: canvas2Ref.value.clientHeight,
        pixelRatio,
        path: '/threejs-official/'
      },
      [offscreen]
    )
  } else {
    offscreenSupported.value = false
  }
})

onUnmounted(() => {
  onBeforeDispose()
  if (worker) worker.terminate()
})

function onBeforeDispose() { if (interval) { clearInterval(interval); interval = null } }

defineExpose({ onBeforeDispose })
</script>

<style scoped>
.worker-offscreen-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.info {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 10px;
  text-align: center;
  z-index: 1;
  pointer-events: none;
}

.info a {
  pointer-events: auto;
}

.message {
  color: #ff0000;
}

.canvas-container {
  position: absolute;
  top: 50px;
  bottom: 70px;
  width: 100%;
}

.onscreen-canvas,
.offscreen-canvas {
  display: inline-block;
  width: 50%;
  height: 100%;
}

.ui {
  position: absolute;
  bottom: 20px;
  width: 100%;
  text-align: center;
}

button {
  border: 0;
  padding: 4px 6px;
  background: #dddddd;
  outline: none;
}

.result {
  margin-left: 10px;
}
</style>
