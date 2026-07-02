<template>
  <div class="mygrapics-root" ref="mgContainer">
    <div class="block"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup.js'

const mgContainer = ref(null)
const { runInit } = useGraphicsCleanup()

async function initMyGrapicsExample() {
  {
    const block = mgContainer.value.querySelector('.block');
      let rotation = 0;
      requestAnimationFrame(function update() {
        block.style.transform = `rotate(${rotation++}deg)`;
        requestAnimationFrame(update);
      });
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