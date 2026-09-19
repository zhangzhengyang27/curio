<template>
  <div class="graphics-root" ref="gContainer">
    <div id="container">
      <canvas width="600" height="600" id="bg"></canvas>
      <canvas width="600" height="600" id="fg"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'

const gContainer = ref<HTMLElement | null>(null)
const gfxLoadedScripts: any[] = []
const { runInit } = useGraphicsCleanup(gfxLoadedScripts)




async function initGraphicsExample() {
  const container = gContainer.value!.querySelector('#container')
  const bg = gContainer.value!.querySelector('#bg')
  const fg = gContainer.value!.querySelector('#fg')
  {
    function drawRandomTriangle(path: any, context: any) {
          const {width, height} = context.canvas;
          context.save();
          context.translate(Math.random() * width, Math.random() * height);
          context.fill(path);
          context.restore();
        }
    
        function drawBackground(context: any, count = 2000) {
          context.fillStyle = '#ed7';
          const d = 'M0,0L0,10L8.66, 5z';
          const p = new Path2D(d);
          for(let i = 0; i < count; i++) {
            drawRandomTriangle(p, context);
          }
        }
    
        function loadImage(src: any) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          return new Promise((resolve) => {
            img.onload = resolve(img) as any; // 保持原运行时行为（resolve 立即执行）；此处为存量语义问题，仅消除类型错误，详见报告
            img.src = src;
          });
        }
    
        async function drawForeground(context: any) {
          const img = await loadImage('/graphics/assets/external/t015b85b72445154fe0.png');
          const {width, height} = context.canvas;
          function update(t: any) {
            context.clearRect(0, 0, width, height);
            context.save();
            context.translate(0, 0.5 * height);
            const p = (t % 3000) / 3000;
            const x = width * p;
            const y = 0.1 * height * Math.sin(3 * Math.PI * p);
            context.drawImage(img, x, y);
            context.restore();
            requestAnimationFrame(update);
          }
          update(0);
        }
    
        const bgcanvas = gContainer.value!.querySelector('#bg') as HTMLCanvasElement;
        const fgcanvas = gContainer.value!.querySelector('#fg') as HTMLCanvasElement;
        drawBackground(bgcanvas.getContext('2d'));
        drawForeground(fgcanvas.getContext('2d'));
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

<style scoped>
#container canvas {
      position: absolute;
    }
    #bg {
      background-color: #000;
    }
</style>