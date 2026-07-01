<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 10]"
    :camera-look-at="[0, 0, 0]"
    @ready="onReady"
  />
</template>

<script setup>
import { BufferAttribute, BufferGeometry, Mesh, MeshBasicMaterial } from 'three'
import ExampleScene from '../../ExampleScene.vue'

function onReady(ctx) {
  const { scene } = ctx

  const vertices = new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0])
  const colors = new Float32Array([0, 1, 0, 1, 1, 0, 1, -1, 0])

  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(vertices, 3))
  geo.setAttribute('color', new BufferAttribute(colors, 3))

  const mat = new MeshBasicMaterial({
    color: 0xffffff,
    vertexColors: true,
  })
  const mesh = new Mesh(geo, mat)
  scene.add(mesh)
}
</script>
