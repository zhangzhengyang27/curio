<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas id="paper" width="0" height="0"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup.js'
import {loadImage, getImageData, traverse} from '@/examples/jsm-compat/mygrapics/pixels/lib/util.js'

const mgContainer = ref(null)
const { runInit } = useGraphicsCleanup()

async function initMyGrapicsExample() {
  {
    const canvas = mgContainer.value.querySelector('#paper');
        const context = canvas.getContext('2d');
    
        (async function () {
          const img = await loadImage('assets/girl1.jpg');
          const imageData = getImageData(img);
    
          traverse(imageData, ({r, g, b, a}) => {
            const v = 0.212 * r + 0.714 * g + 0.074 * b;
            return [v, v, v, a];
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