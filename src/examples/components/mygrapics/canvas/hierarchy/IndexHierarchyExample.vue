<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas width="1600" height="1600"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'

const mgContainer = ref<HTMLElement | null>(null)
const { runInit } = useGraphicsCleanup()
async function loadScript(src: any) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

async function initMyGrapicsExample() {
  await loadScript("/mygrapics/assets/external/d3-hierarchy.v1.min.js");
  await loadScript("/mygrapics/canvas/hierarchy/app.js");
}

onMounted(() => {
  runInit(initMyGrapicsExample).catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})

</script>

<style scoped>
canvas {
            width: 800px;
            height: 800px;
        }
</style>