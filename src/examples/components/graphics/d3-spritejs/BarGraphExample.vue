<template>
  <div class="graphics-root" ref="gContainer">
    <div id="stage"></div>
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
  const stage = gContainer.value!.querySelector('#stage')
  await loadScript("/graphics/assets/external/spritejs.min.js");
  await loadScript("/graphics/assets/external/d3.v6.js");
  const d3: any = (globalThis as any).d3 // d3 由上方 loadScript 注入为全局；用局部 any 别名屏蔽 UMD 全局类型，保持脚本加载通道不变
  {
    const {Scene, SpriteSvg} = spritejs;
        const container = gContainer.value!.querySelector('#stage');
        const scene = new Scene({
          container,
          width: 1200,
          height: 1200,
        });
    
        const dataset = [125, 121, 127, 193, 309];
    
        const scale = d3.scaleLinear()
          .domain([100, d3.max(dataset)])
          .range([0, 500]);
    
        const fglayer = scene.layer('fglayer');
        const s = d3.select(fglayer);
    
        const colors = ['#fe645b', '#feb050', '#c2af87', '#81b848', '#55abf8'];
        const chart = s.selectAll('sprite')
          .data(dataset)
          .enter()
          .append('sprite')
          .attr('x', 450)
          .attr('y', (d: any, i: any) => {
            return 200 + i * 95;
          })
          .attr('width', scale)
          .attr('height', 80)
          .attr('bgcolor', (d: any, i: any) => {
            return colors[i];
          });
        
        const axis = d3.axisBottom(scale).tickValues([100, 200, 300]);
        const axisNode = new SpriteSvg({
          x: 420,
          y: 680,
        });
        d3.select(axisNode.svg)
          .attr('width', 600)
          .attr('height', 60)
          .append('g')
          .attr('transform', 'translate(30, 0)')
          .call(axis);
    
        axisNode.svg.children[0].setAttribute('font-size', 20);
        fglayer.append(axisNode);
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
      overflow: hidden;
      padding: 0;
      margin: 0;
    }
    #stage {
      display: inline-block;
      width: 100%;
      height: 0;
      padding-bottom: 100%;
    }
</style>