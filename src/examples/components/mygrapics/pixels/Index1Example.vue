<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas id="paper" width="0" height="0"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'

const mgContainer = ref<HTMLElement | null>(null)
const { runInit } = useGraphicsCleanup()

async function initMyGrapicsExample() {
  {
    function loadImage(src: any) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          return new Promise<any>((resolve) => {
            img.onload = () => {
              resolve(img);
            };
            img.src = src;
          });
        }
    
        const canvas = mgContainer.value!.querySelector('#paper') as HTMLCanvasElement;
        const context = canvas.getContext('2d')!;
    
        (async function () {
          const img = await loadImage('assets/girl1.jpg');
          const {width, height} = img;
    
          canvas.width = width;
          canvas.height = height;
          context.drawImage(img, 0, 0);
    
          const imgData = context.getImageData(0, 0, width, height);
          const data = imgData.data;
          for(let i = 0; i < width * height * 4; i += 4) {
            const r = data[i],
              g = data[i + 1],
              b = data[i + 2],
              a = data[i + 3];
    
            const v = 0.212 * r + 0.714 * g + 0.074 * b;
            data[i] = v;
            data[i + 1] = v;
            data[i + 2] = v;
            data[i + 3] = a;
          }
          context.putImageData(imgData, 0, 0);
        }());
  }
}

onMounted(() => {
  runInit(initMyGrapicsExample).catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})

</script>