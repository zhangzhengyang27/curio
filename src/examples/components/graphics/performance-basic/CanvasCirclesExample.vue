<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="500" height="500"></canvas>
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
    const canvas = gContainer.value.querySelector('canvas');
        const ctx = canvas.getContext('2d');
    
        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;
    
        function randomColor() {
          return `hsl(${Math.random() * 360}, 100%, 50%)`;
        }
    
        function drawCircle(context, radius) {
          const x = Math.random() * WIDTH;
          const y = Math.random() * HEIGHT;
          const fillColor = randomColor();
          context.fillStyle = fillColor;
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fill();
        }
    
        function draw(context, count = 500, radius = 10) {
          for(let i = 0; i < count; i++) {
            drawCircle(context, radius);
          }
        }
    
        requestAnimationFrame(function update() {
          ctx.clearRect(0, 0, WIDTH, HEIGHT);
          draw(ctx, 1000, 10);
          requestAnimationFrame(update);
        });
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