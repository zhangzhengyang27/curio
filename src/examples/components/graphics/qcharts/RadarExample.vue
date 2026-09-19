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
    const { Chart, Radar, Legend, Tooltip, Axis } = qcharts;
        const chart = new Chart({
          container: '#app'
        });
    
        const data = [
          { date: '体力', category: '诸葛亮', sales: 100 },
          { date: '武力', category: '诸葛亮', sales: 69 },
          { date: '智力', category: '诸葛亮', sales: 100 },
          { date: '统帅', category: '诸葛亮', sales: 95 },
          { date: '魅力', category: '诸葛亮', sales: 95 },
          { date: '忠诚', category: '诸葛亮', sales: 100 },
        ];
    
        chart.source(data, {
          row: 'category',
          value: 'sales',
          text: 'date'
        });
    
        const radar = new Radar().style('scale', false);
        radar.style('section', (d: any) => ({ opacity: 0.3 }));
    
        const legend = new Legend({ align: ['center', '90%'] });
        const tooltip = new Tooltip();
        chart.append([radar, legend, tooltip]);
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