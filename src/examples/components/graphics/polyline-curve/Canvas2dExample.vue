<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="512" height="512"></canvas>
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
    function drawPolyline(context, points, {lineWidth = 1, lineJoin = 'miter', lineCap = 'butt', miterLimit = 10} = {}) {
          context.lineWidth = lineWidth;
          context.lineJoin = lineJoin;
          context.lineCap = lineCap;
          context.miterLimit = miterLimit;
          context.beginPath();
          context.moveTo(...points[0]);
          for(let i = 1; i < points.length; i++) {
            context.lineTo(...points[i]);
          }
          context.stroke();
        }
    
        const canvas = gContainer.value.querySelector('canvas');
        const ctx = canvas.getContext('2d');
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