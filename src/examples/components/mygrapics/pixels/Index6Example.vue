<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas id="paper" width="0" height="0"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup.js'
import {loadImage, getImageData, traverse, getPixelXY} from '@/examples/jsm-compat/mygrapics/pixels/lib/util.js'
import {transformColor, brightness, saturate} from '@/examples/jsm-compat/mygrapics/pixels/lib/color-matrix.js'

const mgContainer = ref(null)
const { runInit } = useGraphicsCleanup()

async function initMyGrapicsExample() {
  {
    const canvas = mgContainer.value.querySelector('#paper');
        const context = canvas.getContext('2d');
    
        (async function () {
          const img = await loadImage('assets/girl1.jpg');
          const textureImage = await loadImage('assets/explode.jpg');
    
          const imageData = getImageData(img);
          const texture = getImageData(textureImage);
    
          traverse(imageData, ({r, g, b, a, x, y}) => {
            const texColor = getPixelXY(texture, x, y);
            const e = 0.212 * texColor[0] + 0.714 * texColor[1] + 0.074 * texColor[2];
    
            return transformColor([r, g, b, a], brightness(0.3 + e), saturate(1.5));
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