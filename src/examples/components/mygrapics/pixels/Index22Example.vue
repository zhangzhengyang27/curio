<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas id="paper" width="0" height="0"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'
import {loadImage, getImageData, traverse} from '@/examples/jsm-compat/mygrapics/pixels/lib/util.js'
import {transformColor} from '@/examples/jsm-compat/mygrapics/pixels/lib/color-matrix.js'

const mgContainer = ref<HTMLElement | null>(null)
const { runInit } = useGraphicsCleanup()

async function initMyGrapicsExample() {
  {
    function brightness(p: any) {
          return [
            p, 0, 0, 0, 0,
            0, p, 0, 0, 0,
            0, 0, p, 0, 0,
            0, 0, 0, 1, 0,
          ];
        }
    
        function saturate(p: any) {
          const r = 0.212 * (1 - p);
          const g = 0.714 * (1 - p);
          const b = 0.074 * (1 - p);
          return [
            r + p, g, b, 0, 0,
            r, g + p, b, 0, 0,
            r, g, b + p, 0, 0,
            0, 0, 0, 1, 0,
          ];
        }
    
        function grayscale(p: any) {
          const r = 0.212 * p;
          const g = 0.714 * p;
          const b = 0.074 * p;
    
          return [
            r + 1 - p, g, b, 0, 0,
            r, g + 1 - p, b, 0, 0,
            r, g, b + 1 - p, 0, 0,
            0, 0, 0, 1, 0,
          ];
        }
    
        function channel({r = 1, g = 1, b = 1}: any) {
          return [
            r, 0, 0, 0, 0,
            0, g, 0, 0, 0,
            0, 0, b, 0, 0,
            0, 0, 0, 1, 0,
          ];
        }
    
        const canvas = mgContainer.value!.querySelector('#paper') as HTMLCanvasElement;
        const context = canvas.getContext('2d')!;
    
        (async function () {
          const img = await loadImage('/mygrapics/pixels/assets/girl1.jpg');
          const imageData = getImageData(img);
    
          traverse(imageData, ({r, g, b, a}: any) => {
            return transformColor(
              [r, g, b, a],
              channel({r: 1.2}),
              brightness(1.2),
              saturate(1.2),
            );
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