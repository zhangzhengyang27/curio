<template>
  <div class="mygrapics-root" ref="mgContainer">
    <h1 id="title"></h1>
    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="800" height="800" viewBox="0 0 1600 1600">
    </svg>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup.js'

const mgContainer = ref(null)
const { runInit } = useGraphicsCleanup()
async function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

async function initMyGrapicsExample() {
  await loadScript("/mygrapics/assets/external/d3-hierarchy.v1.min.js");
  await loadScript("/mygrapics/svg/hierarchy/app.js");
}

onMounted(() => {
  runInit(initMyGrapicsExample).catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})

</script>

<style scoped>
h1 {
      position: absolute;
      width: 800px;
      text-align: center;
    }
</style>