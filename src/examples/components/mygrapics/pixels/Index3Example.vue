<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas id="paper" width="0" height="0"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'
import {loadImage, getImageData, traverse} from '@/examples/jsm-compat/mygrapics/pixels/lib/util.js'
import {transformColor, grayscale} from '@/examples/jsm-compat/mygrapics/pixels/lib/color-matrix.js'

const mgContainer = ref<HTMLElement | null>(null)
const { runInit } = useGraphicsCleanup()

async function initMyGrapicsExample() {
  {
    const canvas = mgContainer.value!.querySelector('#paper') as HTMLCanvasElement;
        const context = canvas.getContext('2d')!;
    
        (async function () {
          const img = await loadImage('/mygrapics/pixels/assets/girl1.jpg');
          const imageData = getImageData(img);
          canvas.width = imageData.width;
          canvas.height = imageData.height;
          context.putImageData(imageData, 0, 0);
    
          let percent = 0;
          function update() {
            traverse(imageData, ({r, g, b, a}: any) => {
              return transformColor([r, g, b, a], grayscale(percent));
            });
            context.putImageData(imageData, 0, 0);
            percent += 0.1;
            if(percent <= 1) requestAnimationFrame(update);
          }
          update();
        }());
  }
}

onMounted(() => {
  runInit(initMyGrapicsExample).catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})

</script>