<template>
  <div
    ref="containerRef"
    class="gaussian-splats-example"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const containerRef = ref(null)
let viewer = null

onMounted(() => {
  viewer = new GaussianSplats3D.Viewer({
    rootElement: containerRef.value,
    useSharedArrayBuffer: false,
    useBuiltInControls: true,
    sharedMemoryForWorkers: false,
    cameraUp: [0, -1, -0.6],
    initialCameraPosition: [-1, -4, 6],
    initialCameraLookAt: [0, 4, 0]
  })

  viewer.addSplatScene(props.example?.globals?.FILE_HOST + 'other/deskFlower.ksplat', {
    splatAlphaRemovalThreshold: 5,
    showLoadingUI: true,
    position: [0, 1, 0],
    rotation: [0, 0, 0, 1],
    scale: [1.5, 1.5, 1.5]
  }).then(() => {
    viewer.start()
  })
})

onUnmounted(() => {
  viewer?.dispose?.()
  viewer = null
})
</script>

<style scoped>
.gaussian-splats-example {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
