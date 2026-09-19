<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 30, 30]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { GUI } from 'lil-gui'
import gsap from 'gsap'
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

  scene.add(new THREE.AxesHelper(1000))
  
  scene.add(new THREE.GridHelper(100, 20))
  
  // 环境贴图
  const boxGeometry = new THREE.BoxGeometry(10, 10, 10);
  
  const boxMaterial = new THREE.MeshBasicMaterial({ color: 'blue' });
  
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
  
  scene.add(boxMesh);
  
  new GUI().add({fn: () => {
  
      // 创建一个相机动画
      createGsapAnimation(camera.position, { x: 20, y: 20, z: 20 })
  
      // 创建一个目标运动动画
      createGsapAnimation(controls.target, { x: -5, y: 2, z: 1 })
  
  }}, 'fn').name('播放');
  
  /* 视角动画 */
  function createGsapAnimation(position: any, position_: any, gsapQuery: any = null) {
  
      //设置动画 x轴运动 持续时间
      return gsap.to(
  
          position,
  
          {
  
              ...position_,
  
              //间隔时间
              duration: 2,
  
              //动画参数名
              ease: 'none',
  
              //重复次数
              repeat: 0,
  
              //往返移动
              yoyo: false,
  
              yoyoEase: true,
  
              ...gsapQuery,
  
          }
  
      )
  
  }
}
</script>
