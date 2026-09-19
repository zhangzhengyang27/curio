<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas width="600" height="600"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'

const mgContainer = ref<HTMLElement | null>(null)
const { runInit } = useGraphicsCleanup()

onMounted(() => {
  runInit(async () => {
    await import('@/examples/jsm-compat/mygrapics/webgl_particles/app.js')
  }).catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})
</script>