<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[6, 6, 3]"
    :shadow-map="true"
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import ExampleScene from '../../ExampleScene.vue'

function onReady(ctx) {
  const { scene } = ctx

  const light = new THREE.SpotLight(0x00acec)
  light.position.set(2, 5, 3)
  light.castShadow = true
  light.angle = 0.3
  light.penumbra = 0.5
  light.decay = 2
  light.distance = 50
  const {
    shadow: { mapSize, camera },
  } = light
  mapSize.width = 512
  mapSize.height = 512
  camera.near = 1
  camera.far = 10
  scene.add(light)

  const mat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
  })
  const geo = new THREE.BoxGeometry(1, 0.5, 1)
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(0, 1, 0)
  mesh.castShadow = true
  scene.add(mesh)

  const geometry = new THREE.PlaneGeometry(2000, 2000)
  geometry.rotateX(-Math.PI / 2)
  const material = new THREE.MeshStandardMaterial()
  const plane = new THREE.Mesh(geometry, material)
  plane.receiveShadow = true
  scene.add(plane)
}
</script>
