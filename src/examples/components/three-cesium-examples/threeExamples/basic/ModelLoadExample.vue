<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[5, 5, 5]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(ctx: any) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  scene.add(new THREE.AmbientLight(0xffffff, 4))
  
  scene.add(new THREE.AxesHelper(1000))
  
  // 加载模型 gltf/ glb  draco解码器
  const loader = new GLTFLoader()
  
  loader.setDRACOLoader(new DRACOLoader().setDecoderPath(props.example?.globals?.FILE_HOST + 'js/three/draco/'))
  
  loader.load(
  
      props.example?.globals?.HOST + '/files/model/car.glb',
  
      gltf => {
  
          scene.add(gltf.scene)
  
      }
  
  )
  
  // 加载模型 fbx
  new FBXLoader().load(props.example?.globals?.HOST + '/files/model/city.FBX', (object3d) => {
  
      scene.add(object3d)
  
      object3d.scale.set(0.0005, 0.0005, 0.0005)
  
  })
  
  // 加载模型 obj/ mtl
  const objLoader = new OBJLoader()
  
  const mtlLoader = new MTLLoader()
  
  mtlLoader.load(props.example?.globals?.FILE_HOST + 'files/model/house/house.mtl', (mtl) => {
  
      mtl.preload()
  
      objLoader.setMaterials(mtl)
  
      objLoader.load(
  
          props.example?.globals?.FILE_HOST + 'files/model/house/house.obj',
  
          (obj) => {
  
              scene.add(obj)
  
              obj.position.x += 3
  
          }
  
      )
  
  })
}
</script>
