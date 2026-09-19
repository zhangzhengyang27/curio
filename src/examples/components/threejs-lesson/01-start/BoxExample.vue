<template>
  <ExampleScene
    ref="sceneRef"
    camera="perspective"
    :camera-position="[0, 0, 5]"
    :default-lights="true"
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import ExampleScene from '../../ExampleScene.vue'

let cube: any = null

function onReady(ctx: any) {
  const geometry = new THREE.BoxGeometry()
  const material = new THREE.MeshNormalMaterial()
  cube = new THREE.Mesh(geometry, material)
  ctx.scene.add(cube)

  ctx.addUpdateCallback((delta: number) => {
    cube.rotation.x += delta
    cube.rotation.y += delta
  })
}
</script>
