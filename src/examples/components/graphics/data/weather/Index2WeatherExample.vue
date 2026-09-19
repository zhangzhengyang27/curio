<template>
  <div class="graphics-root" ref="gContainer">
    <div id="app" style="width:1200px;height:600px;"></div>
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
  await loadScript("/graphics/assets/external/d3.v6.js");
  const d3: any = (globalThis as any).d3 // d3 由上方 loadScript 注入为全局；用局部 any 别名屏蔽 UMD 全局类型，保持脚本加载通道不变
  await loadScript("/graphics/assets/external/spritejs.min.js");
  await loadScript("/graphics/assets/external/index.js");
  {
    (async function() {
          const rawData = await (await fetch('beijing_2014.csv')).text();
          const data = d3.csvParse(rawData).filter((d: any) => new Date(d.Date).getMonth() < 3);
          const dataset1 = data
            .map((d: any) => {
              return {
                value: Number(d['Temperature(Celsius)(avg)']),
                date: d.Date,
                category: '平均气温'}
              });
          const dataset2 = data
            .map((d: any) => {
                return {
                  value: Number(d['Humidity(%)(avg)']),
                  date: d.Date,
                  category: '平均湿度'}
                });
          const { Chart, Line, Legend, Tooltip, Axis } = qcharts;
          const chart = new Chart({
            container: '#app'
          });
          let clientRect={bottom:50};
          chart.source([...dataset1, ...dataset2], {
            row: 'category',
            value: 'value',
            text: 'date'
          });
    
          const line = new Line({clientRect});
          const axisBottom = new Axis({ clientRect, layer: 'default' })
          .style('grid', false)
          .style('scale', function (attr: any, data: any, i: any) {
            if (i % 10 !== 0) {
              return false
            }
          })
          .style('label', function (attr: any, data: any, i: any) {
            if (i % 10 !== 0) {
              return false
            }
          });
          const toolTip = new Tooltip({
            title: (arr: any) => {
              return arr.category
            }
          });
          const legend = new Legend();
          const axisLeft = new Axis({ orient: 'left',clientRect }).style('axis', false).style('scale', false);
    
          chart.append([line, axisBottom, axisLeft, toolTip, legend]);
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