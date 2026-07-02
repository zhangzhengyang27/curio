<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas width="512" height="512"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup.js'

const mgContainer = ref(null)
const { runInit } = useGraphicsCleanup()

async function initMyGrapicsExample() {
  {
    const canvas = mgContainer.value.querySelector('canvas');
        const context = canvas.getContext('2d');
        const rectSize = [100, 100];
    
        let angle = 0;
        function draw() {
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.save();
          context.fillStyle = 'red';
          context.translate(0.5 * canvas.width, 0.5 * canvas.height);
          context.rotate(angle += 0.01);
          context.translate(-0.5 * rectSize[0], -0.5 * rectSize[1]);
          context.beginPath();
          context.rect(0, 0, ...rectSize);
          context.fill();
          context.restore();
          requestAnimationFrame(draw);
        }
    
        draw();
    
    
        // context.fillStyle = 'blue';
        // context.beginPath();
        // context.moveTo(100, 100);
        // context.lineTo(100, 200);
        // context.lineTo(200, 200);
        // context.closePath();
        // context.fill();
        // context.fillStyle = 'green';
        // context.beginPath();
        // context.moveTo(100, 100);
        // context.lineTo(200, 100);
        // context.lineTo(200, 200);
        // context.closePath();
        // context.fill();
  }
}

onMounted(() => {
  runInit(initMyGrapicsExample).catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})

</script>

<style scoped>
canvas {
      background: #eee;
    }
</style>