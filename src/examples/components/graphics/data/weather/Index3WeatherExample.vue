<template>
  <div class="graphics-root" ref="gContainer">
    <div id="app" style="width:1200px;height:600px;"></div>
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
  await loadScript("/graphics/assets/external/d3.v6.js");
  await loadScript("/graphics/assets/external/spritejs.min.js");
  await loadScript("/graphics/assets/external/index.js");
  {
    (async function() {
          const rawData = await (await fetch('beijing_2014.csv')).text();
          const data = d3.csvParse(rawData);
          console.log(data);
          const dataset = data
            .map(d => {
              return {
                temperature: Number(d['Temperature(Celsius)(avg)']),
                humdity: Number(d['Humidity(%)(avg)']),
                category: '平均气温与湿度'}
              });
    
          const { Chart, Scatter, Legend, Tooltip, Axis } = qcharts;
          const chart = new Chart({
            container: '#app'
          });
          let clientRect={bottom:50};
          chart.source(dataset, {
            row: 'category',
            value: 'temperature',
            text: 'humdity'
          });
    
          const scatter = new Scatter({
            clientRect,
            showGuideLine: true,
          });
          const toolTip = new Tooltip({
            title: (data) => '温度与湿度：',
            formatter: (data) => {
              return `温度：${data.temperature}C  湿度：${data.humdity}% `
            }
          });
          const legend = new Legend();
          const axisLeft = new Axis({ orient: 'left',clientRect }).style('axis', false).style('scale', false);
          const axisBottom = new Axis();
    
          chart.append([scatter, axisBottom, axisLeft, toolTip, legend]);
        }());
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