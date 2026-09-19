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
import {Animator} from '@/examples/jsm-compat/mygrapics/common/lib/animator/index.js'

const mgContainer = ref<HTMLElement | null>(null)
const { runInit } = useGraphicsCleanup()
async function loadScript(src: any) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

async function initMyGrapicsExample() {
  await loadScript("/mygrapics/assets/external/cd8674562cacba19.js");
  {
    const block = mgContainer.value!.querySelector('.block') as HTMLElement;
        const animator = new Animator({duration: 3000, easing: (globalThis as any).BezierEasing(0.5, -1.5, 0.5, 2.5)});
        document.addEventListener('click', () => {
          animator.animate({el: block, start: 100, end: 400}, ({target: {el, start, end}, timing: {p}}: any) => {
            const left = start * (1 - p) + end * p;
            el.style.left = `${left}px`;
          });
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
</style>