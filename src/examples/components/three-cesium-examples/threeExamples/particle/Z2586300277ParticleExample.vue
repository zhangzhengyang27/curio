<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 80, 200]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from "three";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
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

  controls.autoRotate = true
  
  const vertices = []
  
  const colors = []
  
  const sparklesGeometry = new THREE.BufferGeometry()
  
  const sparklesMaterial = new THREE.PointsMaterial({ size: 6, alphaTest: 0.5, map: new THREE.TextureLoader().load(`/external-examples/3d-file-server/images/channels/snow.png`), vertexColors: true })
  
  const points = new THREE.Points(sparklesGeometry, sparklesMaterial);
  
  scene.add(points)
  
  let sampler = null
  
  let mesh = null
  
  new OBJLoader().load(
  
      props.example?.globals?.FILE_HOST + 'files/model/z2586300277.obj',
  
      obj => {
  
          mesh = obj.children[0]
  
          mesh.material = new THREE.MeshBasicMaterial({ wireframe: true, color: 0xa58fb5, transparent: true, opacity: 0.2 })
  
          scene.add(obj)
  
          sampler = new MeshSurfaceSampler(mesh).build()
  
          }
  
  )
  
  const tempPosition = new THREE.Vector3()
  
  function render() {
  
      if (vertices.length < 10000) {
  
          sampler.sample(tempPosition)
  
          vertices.push(tempPosition.x, tempPosition.y, tempPosition.z)
  
          sparklesGeometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
  
          const color = new THREE.Color(0xa58fb5)
  
          colors.push(color.r, color.g, color.b)
  
          sparklesGeometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))
  
      }
  
      controls.update()
  
  }
}
</script>
