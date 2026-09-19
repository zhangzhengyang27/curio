<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="600" height="600"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'

const gContainer = ref<HTMLElement | null>(null)
const gfxLoadedScripts: any[] = []
const { runInit } = useGraphicsCleanup(gfxLoadedScripts)




async function initGraphicsExample() {
  {
    const canvas = gContainer.value!.querySelector('canvas') as HTMLCanvasElement;
    
        const worker = new Worker('/graphics/performance_canvas/random_shapes_worker.js');
        const ofc = canvas.transferControlToOffscreen();
        worker.postMessage({
          canvas: ofc,
          type: 'init',
        }, [ofc]);
  }
}

onMounted(() => {
  runInit(initGraphicsExample).catch(err => {
    console.error('Graphics example init failed:', err)
  })
})

// cleanup is handled by useGraphicsCleanup
// onUnmounted not needed
</script>