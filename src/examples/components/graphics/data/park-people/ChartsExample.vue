<template>
  <div class="graphics-root" ref="gContainer">
    <div id="container"></div>
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
  const container = gContainer.value!.querySelector('#container')
  await loadScript("/graphics/assets/external/d3.v6.js");
  const d3: any = (globalThis as any).d3 // d3 由上方 loadScript 注入为全局；用局部 any 别名屏蔽 UMD 全局类型，保持脚本加载通道不变
  await loadScript("/graphics/data/park-people/spritejs.js");
  {
    const  {Scene, Sprite, Polyline, SpriteSvg} = spritejs;
        (async function() {
          const data = await (await fetch('/graphics/data/park-people/data.json')).json();
          const dataset = d3.rollups(data, (v: any) => v.length, (d: any) => d.time).sort(([a]: any, [b]: any) => a - b);
          dataset.unshift([6, 0]);
          dataset.push([22, 0]);
    
          const scene = new Scene({
            container,
            width: 600,
            height: 600,
            displayRatio: 2,
          });
          const fglayer = scene.layer('fglayer');
    
          const points: any[] = [];
          dataset.forEach((d: any, i: any) => {
            const x = 20 + 20 * d[0];
            const y = 300 - d[1];
            points.push(x, y);
          });
    
          const p = new Polyline();
          p.attr({
            points,
            lineWidth: 4,
            strokeColor: 'green',
            smooth: true,
          });
    
          fglayer.append(p);
          
          const scale = d3.scaleLinear()
            .domain([0, 24])
            .range([0, 480]);
      
          const axis = d3.axisBottom(scale)
            .tickValues(dataset.map((d: any) => d[0]));
    
          const axisNode = new SpriteSvg({
            x: 20,
            y: 300,
            flexible: true,
          });
    
          d3.select(axisNode.svg)
            .attr('width', 600)
            .attr('height', 60)
            .append('g')
            .call(axis);
    
          axisNode.svg.children[0].setAttribute('font-size', 20);
          fglayer.append(axisNode);
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

<style scoped>
html, .graphics-root {
      width: 100%;
      height: 100%;
    }
    #container {
      width: 600px;
      height: 600px;
    }
</style>