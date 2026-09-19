<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="600" height="600"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'

const gContainer = ref<HTMLElement | null>(null)
const gfxLoadedScripts: any[] = []
const { runInit } = useGraphicsCleanup(gfxLoadedScripts)




async function initGraphicsExample() {
  {
    const canvas = gContainer.value!.querySelector('canvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d')!;
    
        function regularShape(x: any, y: any, r: any, edges = 3) {
          const points = [];
          const delta = 2 * Math.PI / edges;
          for(let i = 0; i < edges; i++) {
            const theta = i * delta;
            points.push([x + r * Math.sin(theta), y + r * Math.cos(theta)]);
          }
          return points;
        }
    
        function drawShape(context: any, points: any) {
          context.fillStyle = 'red';
          context.strokeStyle = 'black';
          context.lineWidth = 2;
          context.beginPath();
          context.moveTo(...points[0]);
          for(let i = 1; i < points.length; i++) {
            context.lineTo(...points[i]);
          }
          context.closePath();
          context.stroke();
          context.fill();
        }
    
        const shapeTypes = [3, 4, 5, 6, -1];
        const COUNT = 1000;
        const TAU = Math.PI * 2;
    
        function draw() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          for(let i = 0; i < COUNT; i++) {
            const type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            if(type > 0) {
              const points = regularShape(x, y, 10, type);
              drawShape(ctx, points);
            } else {
              ctx.beginPath();
              ctx.arc(x, y, 10, 0, TAU);
              ctx.stroke();
              ctx.fill();
            }
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