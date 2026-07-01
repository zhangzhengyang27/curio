<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[2, 3, 4]"
    :camera-options="{ fov: 45 }"
    @ready="onReady"
  ></ExampleScene>
</template>

<script setup>
import * as THREE from 'three'
import ExampleScene from '../../ExampleScene.vue'

function onReady(ctx) {
  const vertices = [
    { pos: [-1, -1, 1], norm: [0, 0, 1], uv: [0, 0] },
    { pos: [1, -1, 1], norm: [0, 0, 1], uv: [1, 0] },
    { pos: [-1, 1, 1], norm: [0, 0, 1], uv: [0, 1] },
    { pos: [-1, 1, 1], norm: [0, 0, 1], uv: [0, 1] },
    { pos: [1, -1, 1], norm: [0, 0, 1], uv: [1, 0] },
    { pos: [1, 1, 1], norm: [0, 0, 1], uv: [1, 1] },

    { pos: [1, -1, 1], norm: [1, 0, 0], uv: [0, 0] },
    { pos: [1, -1, -1], norm: [1, 0, 0], uv: [1, 0] },
    { pos: [1, 1, 1], norm: [1, 0, 0], uv: [0, 1] },
    { pos: [1, 1, 1], norm: [1, 0, 0], uv: [0, 1] },
    { pos: [1, -1, -1], norm: [1, 0, 0], uv: [1, 0] },
    { pos: [1, 1, -1], norm: [1, 0, 0], uv: [1, 1] },

    { pos: [1, -1, -1], norm: [0, 0, -1], uv: [0, 0] },
    { pos: [-1, -1, -1], norm: [0, 0, -1], uv: [1, 0] },
    { pos: [1, 1, -1], norm: [0, 0, -1], uv: [0, 1] },
    { pos: [1, 1, -1], norm: [0, 0, -1], uv: [0, 1] },
    { pos: [-1, -1, -1], norm: [0, 0, -1], uv: [1, 0] },
    { pos: [-1, 1, -1], norm: [0, 0, -1], uv: [1, 1] },

    { pos: [-1, -1, -1], norm: [-1, 0, 0], uv: [0, 0] },
    { pos: [-1, -1, 1], norm: [-1, 0, 0], uv: [1, 0] },
    { pos: [-1, 1, -1], norm: [-1, 0, 0], uv: [0, 1] },
    { pos: [-1, 1, -1], norm: [-1, 0, 0], uv: [0, 1] },
    { pos: [-1, -1, 1], norm: [-1, 0, 0], uv: [1, 0] },
    { pos: [-1, 1, 1], norm: [-1, 0, 0], uv: [1, 1] },

    { pos: [1, 1, -1], norm: [0, 1, 0], uv: [0, 0] },
    { pos: [-1, 1, -1], norm: [0, 1, 0], uv: [1, 0] },
    { pos: [1, 1, 1], norm: [0, 1, 0], uv: [0, 1] },
    { pos: [1, 1, 1], norm: [0, 1, 0], uv: [0, 1] },
    { pos: [-1, 1, -1], norm: [0, 1, 0], uv: [1, 0] },
    { pos: [-1, 1, 1], norm: [0, 1, 0], uv: [1, 1] },

    { pos: [1, -1, 1], norm: [0, -1, 0], uv: [0, 0] },
    { pos: [-1, -1, 1], norm: [0, -1, 0], uv: [1, 0] },
    { pos: [1, -1, -1], norm: [0, -1, 0], uv: [0, 1] },
    { pos: [1, -1, -1], norm: [0, -1, 0], uv: [0, 1] },
    { pos: [-1, -1, 1], norm: [0, -1, 0], uv: [1, 0] },
    { pos: [-1, -1, -1], norm: [0, -1, 0], uv: [1, 1] },
  ]

  const positions = []
  const normals = []
  const uvs = []
  for (const vertex of vertices) {
    positions.push(...vertex.pos)
    normals.push(...vertex.norm)
    uvs.push(...vertex.uv)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2))

  const material = new THREE.MeshNormalMaterial({
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })
  const cube = new THREE.Mesh(geometry, material)
  ctx.scene.add(cube)

  const wireframeMaterial = new THREE.MeshBasicMaterial({ wireframe: true })
  const wireframe = new THREE.Mesh(geometry, wireframeMaterial)
  ctx.scene.add(wireframe)
}
</script>
