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
          return new Promise<any>((resolve, reject) => {
            img.onload = () => {
              resolve(img);
            };
            // ⚠ 必须显式 reject：图片 404 时若只有 onload，Promise 永不 settle，
            //   canvas 尺寸永不赋值 → 组件静默白屏（这正是本目录 9 个示例曾经的故障）
            img.onerror = () => reject(new Error('图片加载失败: ' + src));
            img.src = src;
          });
        }
    
        const canvas = mgContainer.value!.querySelector('#paper') as HTMLCanvasElement;
        const context = canvas.getContext('2d')!;
    
        (async function () {
          const img = await loadImage('/mygrapics/pixels/assets/girl1.jpg');
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