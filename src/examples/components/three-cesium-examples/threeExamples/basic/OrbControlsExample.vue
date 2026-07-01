<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 1, 4]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import { GUI } from "three/addons/libs/lil-gui.module.min.js"
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

  const geomerty = new THREE.PlaneGeometry(1, 1)
  
  const map = new THREE.TextureLoader().load(props.example?.globals?.HOST + 'files/author/KallkaGo.jpg')
  
  const material = new THREE.MeshBasicMaterial({ map , color: 0xf2f2f2, side: THREE.DoubleSide })
  
  const mesh = new THREE.Mesh(geomerty, material)
  
  scene.add(mesh)
  
  scene.add(new THREE.AxesHelper(10), new THREE.GridHelper(10, 10))
  
  const folder = new GUI()
  
  folder.add(controls, 'autoRotate').name('自动旋转')
  
  folder.add(controls, 'autoRotateSpeed').name('自动旋转速度')
  
  folder.add(controls, 'enableDamping').name('阻尼')
  
  folder.add(controls, 'dampingFactor').name('阻尼系数').min(0).max(1)
  
  folder.add(controls, 'minDistance').name('最小距离')
  
  folder.add(controls, 'maxDistance').name('最大距离')
  
  folder.add(controls, 'maxAzimuthAngle', -2 * Math.PI, Math.PI * 2).name('水平旋转上限')
  
  folder.add(controls, 'minAzimuthAngle', -2 * Math.PI, Math.PI * 2).name('水平旋转下限')
  
  folder.add(controls, 'maxPolarAngle', 0, Math.PI).name('垂直旋转上限')
  
  folder.add(controls, 'minPolarAngle', 0, Math.PI).name('垂直旋转下限')
  
  folder.add(controls, 'maxTargetRadius').name('目标移动上限')
  
  folder.add(controls, 'minTargetRadius').name('目标移动下限')
  
  folder.add(controls, 'enablePan').name('平移')
  
  folder.add(controls, 'panSpeed').name('平移速度')
  
  folder.add(controls, 'enableRotate').name('旋转')
  
  folder.add(controls, 'rotateSpeed').name('旋转速度')
  
  folder.add(controls, 'enableZoom').name('缩放')
  
  folder.add(controls, 'zoomSpeed').name('缩放速度')
  
  folder.add(controls, 'zoomToCursor').name('光标为缩放中心')
  
  folder.add(controls.target, 'x').name('目标位置x').listen()
  
  folder.add(controls.target, 'y').name('目标位置y').listen()
  
  folder.add(controls.target, 'z').name('目标位置z').listen()
  
  folder.add({ '重置': () => folder.reset()}, '重置')
}
</script>
