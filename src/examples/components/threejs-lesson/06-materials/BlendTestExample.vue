<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[20, 30, 40]"
    :camera-look-at="[0, 0, 0]"
    :clear-color="0x666666"
    :shadow-map="true"
    @ready="onReady"
  ></ExampleScene>
</template>

<script setup>
import { AdditiveBlending, Mesh, MeshBasicMaterial } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import ExampleScene from '../../ExampleScene.vue'

function onReady(ctx) {
  const { scene, renderer, addUpdateCallback } = ctx

  renderer.localClippingEnabled = true
  renderer.shadowMap.enabled = true

  const highlightMat = new MeshBasicMaterial({
    color: 0xff0000,
    opacity: 0,
    blending: AdditiveBlending,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: 0,
    polygonOffsetUnits: -1,
  })

  const gltfLoader = new GLTFLoader()
  gltfLoader
    .loadAsync('/external-examples/threejs-lesson/06-materials/public/models/gltf/cabinet.glb')
    .then((model) => {
      init(model.scene.children[0])
    })

  const row = 2
  const col = 4
  const rowSize = 2.85
  const colSize = 9
  function init(mesh) {
    const material = mesh.material
    const { map } = material
    if (!map) {
      return
    }

    const { geometry } = mesh

    for (let z = -row; z < row; z++) {
      for (let x = -col; x < col; x++) {
        const mesh = new Mesh(
          geometry,
          new MeshBasicMaterial({
            map,
          })
        )
        mesh.position.x = x * rowSize
        mesh.position.z = z * colSize
        scene.add(mesh)
      }
    }

    const highlightMesh = new Mesh(mesh.geometry, highlightMat)
    scene.add(highlightMesh)
  }

  let time = 0
  addUpdateCallback((delta, elapsed) => {
    time += delta * 1000
    highlightMat.opacity = (Math.sin(time * 0.005) * 0.5 + 0.5) * 0.4 + 0.1
  })
}
</script>
