<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 4]"
    :camera-options="{ fov: 45 }"
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import ExampleScene from '../../ExampleScene.vue'

function onReady(ctx) {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.bezierCurveTo(1, 1, -1, 1, 0, 0)
  const geometry = new THREE.ShapeGeometry(shape, 6)

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
