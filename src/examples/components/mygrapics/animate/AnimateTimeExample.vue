<template>
  <div class="mygrapics-root" ref="mgContainer">
    <div class="block"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'

const mgContainer = ref<HTMLElement | null>(null)
const { runInit } = useGraphicsCleanup()

async function initMyGrapicsExample() {
  {
    const block = mgContainer.value!.querySelector('.block') as HTMLElement;
      const startAngle = 0;
      const T = 2000;
      let startTime: number | null = null;
      function update() {
        startTime = startTime == null ? Date.now() : startTime;
        const p = (Date.now() - startTime) / T;
        const angle = startAngle + p * 360;
        block.style.transform = `rotate(${angle}deg)`;
        requestAnimationFrame(update);
      }
      update();
  }
}

onMounted(() => {
  runInit(initMyGrapicsExample).catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})

</script>

<style scoped>
.block {
      width: 100px;
      height: 100px;
      top: 100px;
      left: 100px;
      transform-origin: 50% 50%;
      position: absolute;
      background: blue;
    }
</style>