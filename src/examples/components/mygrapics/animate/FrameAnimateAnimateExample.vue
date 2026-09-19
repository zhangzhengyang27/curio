<template>
  <div class="mygrapics-root" ref="mgContainer">
    <div class="bird"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'

const mgContainer = ref<HTMLElement | null>(null)
const { runInit } = useGraphicsCleanup()

async function initMyGrapicsExample() {

}

onMounted(() => {
  runInit(initMyGrapicsExample).catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})

</script>

<style scoped>
.bird {
      position: absolute;
      left: 100px;
      top: 100px;
      width:86px;
      height:60px;
      zoom: 0.5;
      background-repeat: no-repeat;
      background-image: url(/mygrapics/assets/external/t01f265b6b6479fffc4.png);
      background-position: -178px -2px;
      animation: flappy .5s step-end infinite;
    }

    @keyframes flappy {
      0% {background-position: -178px -2px;}
      33% {background-position: -90px -2px;}
      66% {background-position: -2px -2px;}
    }
</style>