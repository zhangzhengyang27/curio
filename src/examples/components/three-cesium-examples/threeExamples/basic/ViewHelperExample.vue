<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 10, 10]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { ViewHelper } from 'three/examples/jsm/helpers/ViewHelper.js'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(ctx: any) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  controls.enableDamping = true
  
  scene.add(new THREE.AxesHelper(5), new THREE.GridHelper(10, 10))
  
  const viewHelper = new ViewHelper(camera, renderer.domElement)
  
  renderer.autoClear = false // 需要将自动清除关闭
  
  ctx.addUpdateCallback(() => {
    // renderer.clear() // 可能需要的清除操作
        viewHelper.render(renderer)
  })
}
</script>
