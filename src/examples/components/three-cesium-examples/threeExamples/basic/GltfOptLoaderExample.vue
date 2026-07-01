<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 2, 3]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js"
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
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
  
  // HDR
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  
  const texture = new RGBELoader().load(props.example?.globals?.FILE_HOST + '/files/hdr/1k.hdr', (t) => {
  
      const map = pmremGenerator.fromEquirectangular(t).texture
  
      pmremGenerator.dispose()
  
      return map
  
  })
  
  texture.mapping = THREE.EquirectangularReflectionMapping
  
  // GLTF
  const loader = new GLTFLoader()
  
  loader.setMeshoptDecoder(MeshoptDecoder)
  
  loader.load(props.example?.globals?.FILE_HOST + 'models/su7/sm_car.gltf', gltf => {
  
      scene.add(gltf.scene)
  
      gltf.scene.traverse(obj => {
  
          if (obj.isMesh) {
  
              obj.material.envMap = texture
  
          }
  
      })
  
  })
}
</script>
