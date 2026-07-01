<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[4, 4, 4]"
    :clear-color="0x000000"
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import ExampleScene from '../../ExampleScene.vue'

function onReady(ctx) {
  const { scene } = ctx

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(ambientLight)

  const dirLight = new THREE.DirectionalLight(0xffffff, 1)
  dirLight.position.set(3, 5, 2)
  scene.add(dirLight)

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x00acec })
  )
  box.position.y = 0.5
  scene.add(box)

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({ color: 0xeeeeee })
  )
  plane.rotation.x = -Math.PI / 2
  plane.receiveShadow = true
  scene.add(plane)
}
</script>
