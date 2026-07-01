<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[30, 30, 30]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
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
  
  scene.add(new THREE.AmbientLight(0xffffff, 2))
  
  // 创建一个曲线
  const curve = new THREE.CatmullRomCurve3([
  
      new THREE.Vector3(0, 20, 2),
  
      new THREE.Vector3(0, 0, 0),
  
      new THREE.Vector3(10, 8, 20),
  
  ])
  
  // 创建曲线几何
  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(500))
  
  // 创建曲线材质
  const material = new THREE.LineBasicMaterial({ color: 0xffffff })
  
  // 创建曲线
  const curveMesh = new THREE.Line(geometry, material)
  
  // 添加曲线到场景
  scene.add(curveMesh)
  
  let obj = null
  
  const loader = new GLTFLoader()
  
  loader.load(props.example?.globals?.FILE_HOST + 'models/glb/daodan.glb', g => {
  
      scene.add(g.scene)
  
      g.scene.scale.multiplyScalar(0.1)
  
      obj = g.scene
  
  })
  
  const speed = 0.001 // 控制物体沿曲线移动的速度
  
  const spin = 0.15 // 控制物体自旋的速度
  
  let t = 0 // 当前物体在曲线上的位置（0~1之间）
  
  let r = 0 // 当前自旋的角度
  
  const baseDir = new THREE.Vector3(0, 0, 1) // 物体默认朝向（z轴正方向）
  
  ctx.addUpdateCallback(() => {
    if (obj) {
            t = (t + speed) % 1 // 更新位置参数
            r += spin // 更新自旋角度
            obj.position.copy(curve.getPointAt(t)) // 设置物体位置
            const tangent = curve.getTangentAt(t).normalize() // 计算切线方向
            const lookQuat = new THREE.Quaternion().setFromUnitVectors(baseDir, tangent) // 计算朝向四元数
            const spinQuat = new THREE.Quaternion().setFromAxisAngle(tangent, r) // 计算自旋四元数
            obj.quaternion.copy(lookQuat).premultiply(spinQuat) // 应用旋转
        }
  })
}
</script>
