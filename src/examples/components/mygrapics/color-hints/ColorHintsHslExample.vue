<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas width="512px" height="512px"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup.js'

const mgContainer = ref(null)
const { runInit } = useGraphicsCleanup()

async function initMyGrapicsExample() {
  await import('@/examples/jsm-compat/mygrapics/color-hints/app-hsl.js');
}

onMounted(() => {
  runInit(initMyGrapicsExample).catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})

</script>

<style scoped>
canvas {
      background: #eee;
    }
</style>