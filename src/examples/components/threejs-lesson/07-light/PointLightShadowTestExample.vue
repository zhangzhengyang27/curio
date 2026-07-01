<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 25, 0]"
    :shadow-map="true"
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import ExampleScene from '../../ExampleScene.vue'

function onReady(ctx) {
  const { scene } = ctx

  const light = new THREE.PointLight()
  light.position.set(0, 6, 0)
  light.castShadow = true
  const {
    shadow: { mapSize, camera },
  } = light
  mapSize.width = 512
  mapSize.height = 512
  camera.near = 0.5
  camera.far = 50
  scene.add(light)

  for (let z = 0; z < 2; z++) {
    for (let x = 0; x < 2; x++) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
      })
      const geo = new THREE.BoxGeometry(1, 4, 1)
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.y = 2
      mesh.position.x = x * 4 - 2
      mesh.position.z = z * 4 - 2
      mesh.castShadow = true
      scene.add(mesh)
    }
  }

  const geometry = new THREE.PlaneGeometry(2000, 2000)
  geometry.rotateX(-Math.PI / 2)
  const material = new THREE.MeshStandardMaterial()
  const plane = new THREE.Mesh(geometry, material)
  plane.receiveShadow = true
  scene.add(plane)
}
</script>
