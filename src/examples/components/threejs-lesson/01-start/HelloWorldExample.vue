<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 5]"
    :clear-color="0x000000"
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import ExampleScene from '../../ExampleScene.vue'

function onReady(ctx) {
  const geometry = new THREE.BoxGeometry()
  const material = new THREE.MeshNormalMaterial()
  const cube = new THREE.Mesh(geometry, material)
  ctx.scene.add(cube)

  ctx.addUpdateCallback(() => {
    cube.rotation.x += 0.01
    cube.rotation.y += 0.01
  })
}
</script>
