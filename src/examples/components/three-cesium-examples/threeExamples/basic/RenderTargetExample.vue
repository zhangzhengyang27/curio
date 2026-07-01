<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[2, 0, 9]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
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

  new OrbitControls(camera, renderer.domElement)
  
  const urls = [0, 1, 2, 3, 4, 5].map(k => (props.example?.globals?.FILE_HOST + 'files/sky/skyBox0/' + (k + 1) + '.png'));
  
  const textureCube = new THREE.CubeTextureLoader().load(urls);
  
  scene.background = textureCube;
  
  const renderTarget = new THREE.WebGLRenderTarget(ctx.container?.clientWidth, ctx.container?.clientHeight)
  
  new GLTFLoader().load(
  
      props.example?.globals?.FILE_HOST + 'models/glb/computer.glb',
  
      gltf => {
  
          const model = gltf.scene
  
          model.traverse(child =>  child.layers.set(1))
  
          scene.add(model)
  
      }
  
  )
  
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ map: renderTarget.texture }))
  
  scene.add(plane)
  
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshBasicMaterial({ map: renderTarget.texture }))
  
  sphere.position.set(3, 0, 0)
  
  scene.add(sphere)
  
  ctx.addUpdateCallback(() => {
    camera.layers.set(1)
        renderer.setRenderTarget(renderTarget)
        camera.layers.set(0)
        renderer.setRenderTarget(null)
  })
}
</script>
