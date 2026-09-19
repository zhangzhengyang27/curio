<template>
  <div class="graphics-root" ref="gContainer">
    <div class="chart linegraph">
      <div class="segment"></div>
      <div class="segment"></div>
      <div class="segment"></div>
      <div class="segment"></div>
      <div class="segment"></div>
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
.linegraph {
      display: inline-block;
      position: relative;
      width: 500px;
      height: 300px;
    }
    .linegraph div {
      background: #3c7;
      position: absolute;
      transform-origin: 0 0;
      height: 3px;
    }

    .linegraph .segment:nth-child(1) {
      left: 0;
      top: 100%;
      width: 142px;
      transform: rotate(-45deg);
    }

    .linegraph .segment:nth-child(2) {
      left: 99px;
      top: calc(100% - 100px);
      width: 102px;
    }

    .linegraph .segment:nth-child(3) {
      left: 200px;
      top: calc(100% - 100px);
      width: 115.5px;
      transform: rotate(-30deg);
    }

    .linegraph .segment:nth-child(4) {
      left: 300px;
      top: calc(100% - 157.75px);
      width: 143px;
      transform: rotate(45deg);
    }

    .linegraph .segment:nth-child(5) {
      left: 400px;
      top: calc(100% - 57.75px);
      width: 100px;
    }
</style>