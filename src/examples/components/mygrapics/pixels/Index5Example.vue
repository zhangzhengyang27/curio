<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas id="paper" width="0" height="0"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'
import {loadImage, getImageData, traverse, getPixel} from '@/examples/jsm-compat/mygrapics/pixels/lib/util.js'
import {transformColor, brightness, saturate} from '@/examples/jsm-compat/mygrapics/pixels/lib/color-matrix.js'

const mgContainer = ref<HTMLElement | null>(null)
const { runInit } = useGraphicsCleanup()

async function initMyGrapicsExample() {
  {
    const canvas = mgContainer.value!.querySelector('#paper') as HTMLCanvasElement;
        const context = canvas.getContext('2d')!;
    
        (async function () {
          const img = await loadImage('assets/girl1.jpg');
          const sunlight = await loadImage('assets/sunlight.png');
    
          const imageData = getImageData(img);
          const texture = getImageData(sunlight);
    
          traverse(imageData, ({r, g, b, a, index}: any) => {
            const texColor = getPixel(texture, index);
            return transformColor([r, g, b, a], brightness(1 + 0.7 * texColor[3]), saturate(2 - texColor[3]));
          });
    
          canvas.width = imageData.width;
          canvas.height = imageData.height;
          context.putImageData(imageData, 0, 0);
        }());
  }
}

onMounted(() => {
  runInit(initMyGrapicsExample).catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})

</script>