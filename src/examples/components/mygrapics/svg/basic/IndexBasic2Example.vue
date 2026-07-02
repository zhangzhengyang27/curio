<template>
  <div class="mygrapics-root" ref="mgContainer">
    <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
      <circle
        cx="100" cy="50" r="40" stroke="black"
        stroke-width="2" fill="orange"
      />
    </svg>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup.js'

const mgContainer = ref(null)
const { runInit } = useGraphicsCleanup()

async function initMyGrapicsExample() {

}

onMounted(() => {
  runInit(initMyGrapicsExample).catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})

</script>