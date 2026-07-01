<template>
  <div class="graphics-root" ref="gContainer">
    <div id="app"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup.js'

const gContainer = ref(null)
const gfxLoadedScripts = []
const { runInit } = useGraphicsCleanup(gfxLoadedScripts)

async function loadScript(src) {
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
  const app = gContainer.value.querySelector('#app')
  await loadScript("/graphics/assets/external/spritejs.min.js");
  await loadScript("/graphics/assets/external/index.js");
  {
    const { Chart, Area, Legend, Tooltip, Axis } = qcharts;
        const chart = new Chart({
          container: '#app'
        });
    
        const data = [
          { date: '05-01', catgory: '图例一', sales: 15.2 },
          { date: '05-02', catgory: '图例一', sales: 39.2 },
          { date: '05-03', catgory: '图例一', sales: 31.2 },
          { date: '05-04', catgory: '图例一', sales: 65.2 },
          { date: '05-05', catgory: '图例一', sales: 55.2 },
          { date: '05-06', catgory: '图例一', sales: 75.2 },
          { date: '05-07', catgory: '图例一', sales: 95.2 },
          { date: '05-08', catgory: '图例一', sales: 100 }
        ];
    
        chart.source(data, {
          row: 'catgory',
          value: 'sales',
          text: 'date'
        });
    
        const area = new Area();
    
        const axisBottom = new Axis().style("grid", false);
        const axisLeft = new Axis({ orient: "left" })
          .style("axis", false);
        const legend = new Legend();
        const tooltip = new Tooltip();
        chart.append([area, axisBottom, axisLeft, legend, tooltip]);
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