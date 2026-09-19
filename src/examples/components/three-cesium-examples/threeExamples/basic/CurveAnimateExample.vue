<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[30, 30, 30]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
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

  scene.add(new THREE.AmbientLight(0xffffff, 4))
  
  scene.add(new THREE.AxesHelper(1000))
  
  // 创建一个曲线
  const curve = new THREE.CatmullRomCurve3([
  
      new THREE.Vector3(0, 0, 0),
  
      new THREE.Vector3(20, 15, 0),
  
      new THREE.Vector3(15, 0, 20),
  
      new THREE.Vector3(5, 15, -5),
  
      new THREE.Vector3(10, 0, -10)
  
  ])
  
  // 创建曲线几何
  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(500))
  
  // 创建曲线材质
  const material = new THREE.LineBasicMaterial({ color: 0xffffff })
  
  // 创建曲线
  const curveMesh = new THREE.Line(geometry, material)
  
  // 添加曲线到场景
  scene.add(curveMesh)
  
  let car: any = null
  
  const loader = new GLTFLoader()
  
  loader.setDRACOLoader(new DRACOLoader().setDecoderPath(props.example?.globals?.FILE_HOST + 'js/three/draco/'))
  
  loader.load(
  
      props.example?.globals?.HOST + '/files/model/car.glb',
  
      gltf => {
  
          car = gltf.scene
  
          scene.add(car)
          // 定义时间
          let t: number = 0
  
          car.render = () => {
  
              t += 0.0004
  
              const point = curve.getPointAt(t % 1) // 获取当前点
  
              car.position.set(point.x, point.y, point.z) // 设置位置
  
              car.lookAt(curve.getPointAt((t + 0.01) % 1)) // 朝向下一个点
  
          }
  
      },
  
      (xhr) => { },
  
      (e) => { }
  
  )
  
  ctx.addUpdateCallback(() => {
    car?.render()
  })
}
</script>
