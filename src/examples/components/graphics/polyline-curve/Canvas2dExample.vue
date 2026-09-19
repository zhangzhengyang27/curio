<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="512" height="512"></canvas>
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
    function drawPolyline(context: CanvasRenderingContext2D, points: any[], {lineWidth = 1, lineJoin = 'miter' as CanvasLineJoin, lineCap = 'butt' as CanvasLineCap, miterLimit = 10} = {}) {
          context.lineWidth = lineWidth;
          context.lineJoin = lineJoin;
          context.lineCap = lineCap;
          context.miterLimit = miterLimit;
          context.beginPath();
          context.moveTo(points[0][0], points[0][1]);
          for(let i = 1; i < points.length; i++) {
            context.lineTo(points[i][0], points[i][1]);
          }
          context.stroke();
        }
    
        const canvas = gContainer.value!.querySelector('canvas') as HTMLCanvasElement;
        const ctx = canvas.getContext("2d")!;
        const points = [
          [100, 100],
          [100, 200],
          [200, 150],
          [300, 200],
          [300, 100],
        ];
        ctx.strokeStyle = 'red';
        drawPolyline(ctx, points, {lineWidth: 10, lineCap: 'round', lineJoin: 'miter', miterLimit: 1.5});
        ctx.strokeStyle = 'blue';
        drawPolyline(ctx, points);
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