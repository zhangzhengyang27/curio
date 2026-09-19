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
    
        function createPath(points: any) {
          const p = new Path2D();
          p.moveTo(...(points[0] as [number, number]));
          for(let i = 1; i < points.length; i++) {
            p.lineTo(...(points[i] as [number, number]));
          }
          p.closePath();
          return p;
        }
    
        const shapeTypes = [3, 4, 5, 6, -1];
        const TAU = Math.PI * 2;
    
        function createCache() {
          const ret = [];
          for(let i = 0; i < shapeTypes.length; i++) {
            let path;
            const type = shapeTypes[i];
            if(type > 0) {
              const points = regularShape(10, 10, 10, type);
              path = createPath(points);
            } else {
              path = new Path2D();
              path.arc(10, 10, 10, 0, TAU);
            }
            ret.push(path);
          }
          return ret;
        }
    
        const shapes = createCache();
        const COUNT = 1000;
        
        ctx.fillStyle = 'red';
        ctx.strokeStyle = 'black';
        
        function draw() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          for(let i = 0; i < COUNT; i++) {
            const shape = shapes[Math.floor(Math.random() * shapeTypes.length)];
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            ctx.save();
            ctx.translate(x, y);
            ctx.fill(shape);
            ctx.stroke(shape);
            ctx.restore();
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