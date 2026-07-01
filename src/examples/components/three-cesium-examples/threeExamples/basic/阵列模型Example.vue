<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[500, 500, 500]"
    :camera-look-at="[0, 50, 0]"
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three';
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

  // 场景
  const geometry = new THREE.BoxGeometry(5, 5, 5);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); //材质 
  for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
          for (let k = 0; k < 10; k++) {
              const mesh = new THREE.Mesh(geometry, material); //网格模型对象Mesh
              mesh.position.set(i * 20, k * 20, j * 20);
              scene.add(mesh); //网格模型添加到场景中  
          }
      }
  }
  
  // AxesHelper
  const axesHelper = new THREE.AxesHelper(150);
  scene.add(axesHelper);
  
  // 相机
  
  // 渲染器
  
  // 设置相机控件轨道控制器OrbitControls
  // 如果OrbitControls改变了相机参数，重新调用渲染器渲染三维场景
  //监听鼠标、键盘事件
}
</script>
