<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas id="paper" width="0" height="0"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup.js'
import {loadImage, getImageData, traverse, gaussianBlur} from '@/examples/jsm-compat/mygrapics/pixels/lib/util.js'
import {transformColor, grayscale, brightness, contrast, saturate} from '@/examples/jsm-compat/mygrapics/pixels/lib/color-matrix.js'

const mgContainer = ref(null)
const { runInit } = useGraphicsCleanup()

async function initMyGrapicsExample() {
  {
    const canvas = mgContainer.value.querySelector('#paper');
        const context = canvas.getContext('2d');
    
        (async function () {
          const img = await loadImage('assets/girl2.jpg');
    
          const imageData = getImageData(img);
    
          gaussianBlur(imageData.data, imageData.width, imageData.height, 4);
          traverse(imageData, ({r, g, b, a}) => {
            return transformColor([r, g, b, a], grayscale(0.5), saturate(1.2), contrast(1.1), brightness(1.2));
          });
    
          canvas.width = imageData.width;
          canvas.height = imageData.height;
          context.putImageData(imageData, 0, 0);
          // const bitmap = transferToImageBitmap(imageData);
          // canvas.width = bitmap.width;
          // canvas.height = bitmap.height;
          // context.drawImage(bitmap, 0, 0);
        }());
  }
}

onMounted(() => {
  runInit(initMyGrapicsExample).catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})

</script>