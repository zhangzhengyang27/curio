<template>
  <div class="graphics-root" ref="gContainer">
    <div class="chart bargraph">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
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
/**
      dataset = {
        current: [15, 11, 17, 25, 37],
        total: [25, 26, 40, 45, 68],
      }
    */

    .bargraph {
      display: grid;
      width: 150px;
      height: 100px;
      padding: 10px;
      transform: scaleY(3);
      grid-template-columns: repeat(5, 20%);
    }

    .bargraph div {
      margin: 0 2px;
    }

    .bargraph div:nth-child(1) {
    background: linear-gradient(to bottom, transparent 75%, #37c 0, #37c 85%, #3c7 0);
    }
    .bargraph div:nth-child(2) {
    background: linear-gradient(to bottom, transparent 74%, #37c 0, #37c 89%, #3c7 0);
    }
    .bargraph div:nth-child(3) {
    background: linear-gradient(to bottom, transparent 60%, #37c 0, #37c 83%, #3c7 0);
    }
    .bargraph div:nth-child(4) {
    background: linear-gradient(to bottom, transparent 55%, #37c 0, #37c 75%, #3c7 0);
    }
    .bargraph div:nth-child(5) {
    background: linear-gradient(to bottom, transparent 32%, #37c 0, #37c 63%, #3c7 0);
    }
</style>