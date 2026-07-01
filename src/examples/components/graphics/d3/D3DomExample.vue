<template>
  <div class="graphics-root" ref="gContainer"></div>
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
  await loadScript("/graphics/assets/external/d3.js");
  {
    const dataset = [125, 121, 127, 193, 309];
        const colors = ['#fe645b', '#feb050', '#c2af87', '#81b848', '#55abf8'];
    
        const chart = d3.select('body')
          .selectAll('div')
          .data(dataset)
          .enter()
          .append('div')
          .style('left', '450px')
          .style('top', (d, i) => {
            return `${200 + i * 45}px`;
          })
          .style('width', d => `${d}px`)
          .style('height', '40px')
          .style('background', (d, i) => colors[i]);
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
    .graphics-root > div {
      position: absolute;
      display: inline-block;
    }
</style>