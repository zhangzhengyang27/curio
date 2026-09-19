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
  await loadScript("/graphics/assets/external/d3.js");
  await loadScript("/graphics/assets/external/spritejs.js");
  const d3: any = (globalThis as any).d3 // d3 由上方 loadScript 注入为全局，env.d.ts 未声明（不许改），此处局部断言
  {
    const {Scene, Sprite} = spritejs;
        const container = gContainer.value!.querySelector('#container');
        const scene = new Scene({
          container,
          width: 800,
          height: 800,
        });
    
        const dataset = [125, 121, 127, 193, 309];
        const colors = ['#fe645b', '#feb050', '#c2af87', '#81b848', '#55abf8'];
    
        const fglayer = scene.layer('fglayer');
    
        const chart = d3.select(fglayer)
          .selectAll('sprite')
          .data(dataset)
          .enter()
          .append('sprite')
          .attr('x', 450)
          .attr('y', (d: any, i: any) => {
            return 200 + i * 45;
          })
          .attr('width', (d: any) => d)
          .attr('height', 40)
          .attr('bgcolor', (d: any, i: any) => colors[i]);
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
      width: 800px;
      height: 800px;
    }
</style>