<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[5, 2, 0]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GUI } from 'lil-gui'
import gsap from 'gsap'
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

  controls.enableDamping = true
  
  const pointLight = new THREE.PointLight(0xffffff, 1.5, 0, 0)
  
  pointLight.position.set(5, 5, 5)
  
  scene.add(pointLight)
  
  scene.add(new THREE.AmbientLight(0xffffff, 1))
  
  let group
  
  const loader = new GLTFLoader()
  
  loader.setDRACOLoader(new DRACOLoader().setDecoderPath(props.example?.globals?.FILE_HOST + 'js/three/draco/'))
  
  loader.load(
  
      props.example?.globals?.HOST + '/files/model/car.glb',
  
      function (gltf) {
  
          group = gltf.scene
  
          scene.add(group)
  
      }
  
  )
  
  // 裁剪面
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  
  renderer.clippingPlanes = [plane]
  
  renderer.localClippingEnabled = true
  
  const gui = new GUI()
  
  gui.add({ play: () => { gsap.to(plane, { constant: 2, duration: 2 })} }, 'play')
  
  gui.add({ restore: () => { gsap.to(plane, { constant: -2, duration: 2 })} }, 'restore')
}
</script>
