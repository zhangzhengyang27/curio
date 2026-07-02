<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas width="512" height="512"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup.js'

const mgContainer = ref(null)
const { runInit } = useGraphicsCleanup()

onMounted(() => {
  runInit(async () => {
    await import('@/examples/jsm-compat/mygrapics/bezier/app.js')
  }).catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})
</script>