<template>
  <div class="graphics-root" ref="gContainer">
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"></svg>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup.js'

const gContainer = ref(null)
const gfxLoadedScripts = []
const { runInit } = useGraphicsCleanup(gfxLoadedScripts)




async function initGraphicsExample() {
  {
    function randomColor() {
          return `hsl(${Math.random() * 360}, 100%, 50%)`;
        }
    
        const root = gContainer.value.querySelector('svg');
        const COUNT = 500;
        const WIDTH = 500;
        const HEIGHT = 500;
    
        function initCircles(count = COUNT) {
          for(let i = 0; i < count; i++) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            root.appendChild(circle);
          }
          return [...root.querySelectorAll('circle')];
        }
        const circles = initCircles();
    
        function drawCircle(circle, radius = 200) {
          const x = Math.random() * WIDTH;
          const y = Math.random() * HEIGHT;
          const fillColor = randomColor();
          circle.setAttribute('cx', x);
          circle.setAttribute('cy', y);
          circle.setAttribute('r', radius);
          circle.setAttribute('fill', fillColor);
        }
    
        function draw() {
          for(let i = 0; i < COUNT; i++) {
            drawCircle(circles[i]);
          }
          requestAnimationFrame(draw);
        }
    
        draw();
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
    }
</style>