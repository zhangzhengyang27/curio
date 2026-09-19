<template>
  <div class="graphics-root" ref="gContainer">
    <div class="chart piegraph">
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
.piegraph {
      display: inline-block;
      width: 250px;
      height: 250px;
      border-radius: 50%;
      background-image: conic-gradient(#37c 30deg, #3c7 30deg, #3c7 65deg, orange 65deg, orange 110deg, #f73 110deg, #f73 200deg, #ccc 200deg);
    }
</style>