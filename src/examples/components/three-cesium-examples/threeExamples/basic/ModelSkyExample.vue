<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 5, 20]"
    :clear-color="0xffffff"
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
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
  
  const gird = new THREE.GridHelper(100, 20)
  
  scene.add(gird)
  
  const axes = new THREE.AxesHelper(1000)
  
  scene.add(axes)
  
  new GLTFLoader().load(props.example?.globals?.FILE_HOST + "models/glb/gltfSky/scene.gltf", (gltf) => {
  
      scene.add(gltf.scene)
  
      })
}
</script>
