<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[10, 10, 10]"
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
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

  scene.add(new THREE.AxesHelper(100000), new THREE.AmbientLight(0xffffff, 6))
  
  // 加载模型
  new FBXLoader().load(props.example?.globals?.HOST + '/files/model/city.FBX', (object3d) => {
  
      scene.add(object3d)
  
      object3d.scale.set(0.0005, 0.0005, 0.0005)
  
      setTransformAnimate(object3d)
  
  })
  
  // 变换动画
  function setTransformAnimate(mesh) {
  
      const position = mesh.position.clone()
      
      position.y += 5 // 位置向上移动100
  
      const rotation = mesh.rotation.clone()
  
      rotation.y += Math.PI / 4 // 旋转45度
  
      const scale = mesh.scale.clone()
      
      scale.z *= 2 // 缩放z轴2倍
  
      scale.x *= 2 // 缩放x轴2倍
  
      // 组合参数
      const transformInfo_ = { position, rotation, scale } 
  
      // 执行
      const promises_gsap = ['position', 'rotation', 'scale'].map(i => {
  
          return new Promise(resolve => {
      
              gsap.to(mesh[i], {
      
                  x: transformInfo_[i].x,
      
                  y: transformInfo_[i].y,
      
                  z: transformInfo_[i].z,
      
                  //间隔时间
                  duration: 3,
      
                  //动画参数名
                  ease: 'none',
      
                  //重复次数
                  repeat: 0,
      
                  //往返移动
                  yoyo: false,
      
                  yoyoEase: true,
      
                  onComplete: resolve
      
              })
      
          })
      
      })
      
      Promise.all(promises_gsap).then(() => console.log('动画完成'))
  
  }
}
</script>
