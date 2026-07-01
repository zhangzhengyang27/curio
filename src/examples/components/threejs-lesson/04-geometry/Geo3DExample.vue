<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[2, 3, 4]"
    :camera-options="{ fov: 45 }"
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import ExampleScene from '../../ExampleScene.vue'

function onReady(ctx) {
  const geometry = new THREE.TorusKnotGeometry(0.5, 0.1, 128, 3, 8, 9)

  const material = new THREE.MeshNormalMaterial({
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })
  const mesh = new THREE.Mesh(geometry, material)
  ctx.scene.add(mesh)

  const wireframeMaterial = new THREE.MeshBasicMaterial({ wireframe: true })
  const wireframe = new THREE.Mesh(geometry, wireframeMaterial)
  ctx.scene.add(wireframe)
}
</script>
