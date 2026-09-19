<template>
  <div class="graphics-root" ref="gContainer">
    <div>
      <button id="updateBtn">
        抽奖
      </button><span id="user"></span>
    </div>
    <canvas id="glDoodle" width="512" height="512"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import GLRenderer from '@/examples/jsm-compat/graphics/gl-raffle/lib/gl-renderer.js'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'

const gContainer = ref<HTMLElement | null>(null)
const gfxLoadedScripts: any[] = []
const { runInit } = useGraphicsCleanup(gfxLoadedScripts)




async function initGraphicsExample() {
  const updateBtn = gContainer.value!.querySelector('#updateBtn')
  const user = gContainer.value!.querySelector('#user')
  const glDoodle = gContainer.value!.querySelector('#glDoodle')
  {
    const container = gContainer.value!.querySelector('#glDoodle');
        const doodle = new GLRenderer(container, {autoUpdate: false});
        const width = 512,
          height = 512;
        const button = gContainer.value!.querySelector('#updateBtn');
        (async function() {
          const textureCanvas = new OffscreenCanvas(width, height);
          const ctx = textureCanvas.getContext('2d');
          const program = await doodle.load('./lib/fragment.glsl');
          doodle.useProgram(program);
    
          button!.addEventListener('click', () => {
            const texture = doodle.createTexture(textureCanvas.transferToImageBitmap());
            doodle.uniforms.resolution = [width, height];
            doodle.uniforms.rate = 0.2; // 30% 中奖概率
            doodle.uniforms.seed = Math.random(); // 随机种子
            doodle.uniforms.texture = texture;
            doodle.render();
            doodle.deleteTexture(texture);
            ctx!.drawImage(doodle.canvas, 0, 0, width, height);
          });
        }());
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
div, button {
      font-size: 3rem;
    }
    canvas {
      background: #000;
    }
    span {
      margin-left: 20px;
    }
</style>