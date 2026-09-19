<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas width="512" height="512"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'

const mgContainer = ref<HTMLElement | null>(null)
const { runInit } = useGraphicsCleanup()

async function initMyGrapicsExample() {
  await import('@/examples/jsm-compat/mygrapics/bezier/app2.js');
}

onMounted(() => {
  runInit(initMyGrapicsExample).catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})

</script>