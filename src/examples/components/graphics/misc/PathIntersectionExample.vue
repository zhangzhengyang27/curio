<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="600" height="600"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {subtract, cross} from '@/examples/jsm-compat/graphics/common/lib/math/functions/Vec2Func.js'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'

const gContainer = ref<HTMLElement | null>(null)
const gfxLoadedScripts: any[] = []
const { runInit } = useGraphicsCleanup(gfxLoadedScripts)




async function initGraphicsExample() {
  {
    function isCross(p1: any, p2: any, p3: any, p4: any) {
          const v1 = subtract([], p4, p3);
          const v2 = subtract([], p1, p3);
          const v3 = subtract([], p2, p3);
    
          const z1 = cross(v1, v2);
          const z2 = cross(v1, v3);
    
          return z1 * z2 <= 0;
        }
    
        function isPathIntersection(points: any) {
          const len = points.length;
    
          for(let i = 0; i < len - 1; i++) {
            const point = points[i];
            const nextPoint = points[i + 1];
    
            for(let j = 0; j < len - 1; j++) {
              const p1 = points[j],
                p2 = points[j + 1];
    
              if(p1 !== point && p2 !== point && p1 !== nextPoint && p2 !== nextPoint
                && isCross(p1, p2, point, nextPoint) && isCross(point, nextPoint, p1, p2)) {
                return true;
              }
            }
          }
          return false;
        }
    
        function draw(context: any, points: any) {
          context.clearRect(0, 0, context.canvas.width, context.canvas.height);
          const d = `M${points.join('L')}`;
          const color = isPathIntersection(points) ? 'red' : 'blue';
          context.strokeStyle = color;
          const path = new Path2D(d);
          context.stroke(path);
        }
    
        const canvas = gContainer.value!.querySelector('canvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d')!;
        ctx.lineWidth = 5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        const points: any[] = [];
    
        canvas.addEventListener('click', (evt) => {
          const {x, y} = evt;
          const {x: x0, y: y0} = (evt.target as HTMLElement).getBoundingClientRect();
          points.push([x - x0, y - y0]);
          draw(ctx, points);
        });
    
        canvas.addEventListener('dblclick', (evt) => {
          points.length = 0;
          draw(ctx, points);
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
canvas {
      background: #eee;
    }
</style>