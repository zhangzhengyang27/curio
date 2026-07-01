<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[1, 1, 1]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  scene.add(new THREE.AxesHelper(100))
  
  const urls = [0, 1, 2, 3, 4, 5].map(k => (props.example?.globals?.FILE_HOST + 'files/sky/skyBox0/' + (k + 1) + '.png'));
  
  const textureCube = new THREE.CubeTextureLoader().load(urls);
  
  new GLTFLoader().load(props.example?.globals?.FILE_HOST + 'models/whitebuild.glb', (gltf) => {
  
      const model = gltf.scene
  
      model.traverse((child) => {
  
          if (child.isMesh) {
  
              child.material.envMap = textureCube
  
              const { geometry } = child
              const edges = new THREE.EdgesGeometry(geometry)
              let lineGeometry = new LineSegmentsGeometry().fromEdgesGeometry(edges)
              const material = new LineMaterial({
                  color: 0xfcde8c,
                  linewidth: 2.5,
                  envMap: textureCube,
                  resolution: new THREE.Vector2(ctx.container?.clientWidth, ctx.container?.clientHeight)
              })
  
              const lines = new LineSegments2(lineGeometry, material)
              lines.computeLineDistances()
              lines.applyMatrix4(child.matrixWorld)
  
              scene.add(lines)
          }
  
      })
  
      scene.add(model)
  })
}
</script>
