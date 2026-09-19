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
    const { Chart, RadialBar, Legend, Tooltip } = qcharts;
    
        const chart = new Chart({
          container: '#app'
        });
    
        const data = [
          {
            type: '政法干部',
            count: 6654
          },{
            type: '平安志愿者',
            count: 5341
          },{
            type: '人民调解员',
            count: 3546
          },{
            type: '心理咨询师',
            count: 4321
          },{
            type: '法律工作者',
            count: 3923
          },{
            type: '网格员',
            count: 5345
          }
        ].sort((a, b) => a.count - b.count);
    
        chart.source(data, {
          row: 'type',
          text: 'type',
          value: 'count'
        });
    
        const radialBar = new RadialBar({
          min: 0,
          max: 10000,
          radius: 0.6,
          innerRadius: 0.1,
          lineWidth: 10
        });
    
        radialBar.style('arc', { lineCap: 'round' });
    
        const legend = new Legend({
          orient: 'vertical',
          align: ['right', 'center'],
        });
    
        chart.append([radialBar, legend, new Tooltip()]);
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