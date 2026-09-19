<template>
  <div class="mygrapics-root" ref="mgContainer">
    <div class="container">
      <div class="block"></div>
    </div>
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
        document.addEventListener('click', () => {
          block.className = 'block animate';
        }, {once: true});
  }
}

onMounted(() => {
  runInit(initMyGrapicsExample).catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})

</script>

<style scoped>
.container {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      width: 300px;
    }
    .block {
      width: 100px;
      height: 100px;
      position: absolute;
      top: 100px;
      left: 100px;
      background: blue;
      flex-shrink: 0;
      transform-origin: 50% 50%;
    }
    .animate {
      animation: mymove 3s cubic-bezier(0.5, -1.5, 0.5, 2.5) forwards;
    }
    @keyframes mymove {
      from {left: 100px}
      to {left: 400px}
    }
</style>