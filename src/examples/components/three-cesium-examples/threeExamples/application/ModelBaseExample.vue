<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 4, 4]"
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
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

  scene.background = new THREE.Color('gainsboro');
  
  function animationLoop() {
  }
  
  controls.enableDamping = true;
  controls.autoRotate = true;
  
  var light = new THREE.DirectionalLight('white', 3);
  light.position.set(1, 1, 1);
  scene.add(light);
  
  let group: any = null

  const loader = new GLTFLoader()
  
  loader.setDRACOLoader(new DRACOLoader().setDecoderPath(props.example?.globals?.FILE_HOST + 'js/three/draco/'))
  
  loader.load(
  
      props.example?.globals?.HOST + '/files/model/car.glb',
  
      function (gltf) {
  
          group = gltf.scene
  
          scene.add(group)
          add_model_base()
      }
  
  )
  
  // 模型底座
  function add_model_base(){
      const box = new THREE.Box3()
      box.setFromObject(group)
      // const helper = new THREE.Box3Helper(box)
      // scene.add(helper)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const shape = new  THREE.Shape()
      shape.moveTo(center.x,center.z)
      // 底座大小在这控制 这里取半径的根号2倍
      let radius = Math.max(size.x,size.z) / 2 * Math.sqrt(2)
      shape.arc(0,0,radius,0,Math.PI * 2)
      let m = new THREE.MeshBasicMaterial({color:'red',side:2})
      const geo = new THREE.ShapeGeometry(shape,32)
      const mesh = new THREE.Mesh(geo,m)
      geo.center()
      mesh.rotateX(-Math.PI / 2)
      scene.add(mesh)
  }
}
</script>
