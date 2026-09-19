<template>
  <div class="graphics-root" ref="gContainer">
    <div id="app"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'

const gContainer = ref<HTMLElement | null>(null)
const gfxLoadedScripts: any[] = []
const { runInit } = useGraphicsCleanup(gfxLoadedScripts)

async function loadScript(src: string) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
    gfxLoadedScripts.push(s)
  })
}




async function initGraphicsExample() {
  const app = gContainer.value!.querySelector('#app')
  await loadScript("/graphics/assets/external/spritejs.min.js");
  await loadScript("/graphics/assets/external/index.js");
  {
    const { Chart, Gauge } = qcharts;
    
        const chart = new Chart({ container: '#app' });
    
        const gauge = new Gauge({
          min: 0,
          max: 100,
          percent:60,
          lineWidth: 20,
          tickStep: 10
        });
    
        gauge.style('title', { fontSize: 36 });
    
        chart.append(gauge);
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

<style scoped>
html, .graphics-root {
      padding: 0;
      margin: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    #app {
      width: 100%;
      height: 100%;
    }
</style>