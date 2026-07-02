<template>
  <div class="mygrapics-root" ref="mgContainer">
    <div class="container">
      <div class="block"></div>
      <div class="block"></div>
      <div class="block"></div>
      <div class="block"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup.js'
import {Animator} from '@/examples/jsm-compat/mygrapics/common/lib/animator/index.js'

const mgContainer = ref(null)
const { runInit } = useGraphicsCleanup()

async function initMyGrapicsExample() {
  {
    const blocks = mgContainer.value.querySelectorAll('.block');
        const animator = new Animator({duration: 1000, iterations: 1.5});
        (async function () {
          let i = 0;
          while(true) { // eslint-disable-next-line no-await-in-loop
            await animator.animate(blocks[i++ % 4], ({target, timing}) => {
              target.style.transform = `rotate(${timing.p * 360}deg)`;
            });
          }
        }());
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
      margin: 20px;
      flex-shrink: 0;
      transform-origin: 50% 50%;
    }
    .block:nth-child(1) {background: red;}
    .block:nth-child(2) {background: blue;}
    .block:nth-child(3) {background: green;}
    .block:nth-child(4) {background: orange;}
</style>