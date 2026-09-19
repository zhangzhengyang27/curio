<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[50, 50, 50]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
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

  scene.add(new THREE.AxesHelper(100))
  
  const map = new THREE.TextureLoader().load(props.example?.globals?.HOST + 'files/images/grid.png')
  
  const material = new THREE.MeshStandardMaterial({
      map,
      side: THREE.DoubleSide,
      transparent: true,
      emissive: 0x309df1, // 自发光颜色
      emissiveIntensity: 1, // 自发光强度
  })
  
  const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      material
  )
  
  floor.rotation.x = -Math.PI / 2
  
  scene.add(floor)
}
</script>
