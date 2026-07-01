<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 5]"
    :fit-container="false"
    :max-pixel-ratio="1"
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import ExampleScene from '../../ExampleScene.vue'

let cubes = []

function onReady(ctx) {
  const geometry = new THREE.BoxGeometry()
  const material = new THREE.MeshPhongMaterial({ color: 0x44aa88 })

  cubes = [-2, 0, 2].map((x) => {
    const cube = new THREE.Mesh(geometry, material)
    cube.position.x = x
    return cube
  })
  ctx.scene.add(...cubes)

  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(-1, 2, 4)
  ctx.scene.add(light)

  ctx.addUpdateCallback(() => {
    cubes.forEach((cube) => {
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01
    })
  })
}
</script>
