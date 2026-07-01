<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[20, 20, 10]"
    :shadow-map="true"
    @ready="onReady"
  ></ExampleScene>
</template>

<script setup>
import * as THREE from 'three'
import ExampleScene from '../../ExampleScene.vue'

function onReady(ctx) {
  const { scene } = ctx

  const light = new THREE.DirectionalLight()
  light.position.set(0, 8, 12)
  light.castShadow = true
  const {
    shadow: { mapSize, camera },
  } = light
  mapSize.width = 5120
  mapSize.height = 5120
  camera.near = 0.5
  camera.far = 50
  camera.left = -100
  camera.right = 100
  camera.top = 100
  camera.bottom = -100
  scene.add(light)

  const mat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
  })
  const geo = new THREE.BoxGeometry(15, 4, 15)
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.y = 2
  mesh.castShadow = true
  scene.add(mesh)

  const geometry = new THREE.PlaneGeometry(2000, 2000)
  geometry.rotateX(-Math.PI / 2)
  const material = new THREE.MeshStandardMaterial()
  const plane = new THREE.Mesh(geometry, material)
  plane.receiveShadow = true
  scene.add(plane)

  const a = new THREE.Vector3(2, 0, 0)
  const b = new THREE.Vector3(0, 1, 0)
  const c = a.clone().cross(b)
  c.x = a.y * b.z - a.z * b.y
  c.y = a.z * b.x - a.x * b.z
  c.z = a.x * b.y - a.y * b.x
  c.setLength(1)
  console.log(c)
}
</script>
