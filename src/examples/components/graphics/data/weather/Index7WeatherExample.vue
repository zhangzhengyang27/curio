<template>
  <div class="graphics-root" ref="gContainer">
    <div id="app" style="width: 1200px; height: 600px"></div>
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
    ;(async function () {
            const rawData = await (await fetch('beijing_2014.csv')).text()
            const data = d3.csvParse(rawData)
            const dataset = data
              .map((d: any) => {
                return {
                  temperature: Number(d['Temperature(Celsius)(avg)']),
                  tdp: Number(d['Dew Point(Celsius)(avg)']),
                  category: '平均气温与露点'
                }
              })
              .sort((a: any, b: any) => a.tdp - b.tdp)
    
    
            let dataset2: any = [...dataset]
    
            dataset2 = dataset2.reduce((a: any, b: any) => {
              let curr = a[a.length - 1]
              if (curr && curr.tdp === b.tdp) {
                curr.temperature.push(b.temperature)
              } else {
                a.push({
                  temperature: [b.temperature],
                  tdp: b.tdp
                })
              }
              return a
            }, [])
            console.log('aa', dataset2)
    
            dataset2 = dataset2.map((d: any) => {
              d.category = '露点平均气温'
              d.temperature = Math.round(d.temperature.reduce((a: any, b: any) => a + b) / d.temperature.length)
              return d
            })
    
    
            const { Chart, Scatter, Line, Legend, Tooltip, Axis } = qcharts
            const chart = new Chart({
              container: '#app'
            })
            let clientRect = { bottom: 50 }
            chart.source([...dataset, ...dataset2], {
              row: 'category',
              value: 'temperature',
              text: 'tdp'
            })
    
            const ds = chart.dataset
            const d1 = ds.selectRows('平均气温与露点')
            const d2 = ds.selectRows('露点平均气温')
            const scatter = new Scatter({
              clientRect,
              showGuideLine: true
            }).source(d1)
            const line = new Line({ clientRect, layoutX: 'value' }).source(d2)
            line.style('line', function (attrs: any, data: any, i: any) {
              return { smooth: true, lineWidth: 3, strokeColor: '#0a0' }
            })
            line.style('point', function (attrs: any) {
              return { display: 'none' }
            })
    
            const toolTip = new Tooltip({
              title: (data: any) => '温度与露点：',
              formatter: (data: any) => {
                return `温度：${data.temperature}C  露点：${data.tdp}% `
              }
            })
            const legend = new Legend()
            const axisLeft = new Axis({ orient: 'left', name: 'letf-平均气温与露点', clientRect })
              .style('axis', false)
              .style('scale', false)
              .style('name', { translate: [-60, 0] })
            const axisBottom = new Axis({ name: 'tdp值', clientRect }).style('name', { translate: [20, 20], fillColor: '#f00' })
            const axisTop = new Axis({ orient: 'top', name: 'top-折线图坐标', type: 'category' }).source(d2).style('name', { translate: [-30, -30] })
    
            chart.append([scatter, line, axisBottom, axisLeft, toolTip, legend])
          })()
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