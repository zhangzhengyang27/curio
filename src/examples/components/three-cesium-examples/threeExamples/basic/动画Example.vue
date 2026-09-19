<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[200, 200, 200]"
    :camera-look-at="[0, 10, 0]"
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three';
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

  // 场景
  const geometry = new THREE.BoxGeometry(10, 60, 100); //几何体
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); //材质 
  const mesh = new THREE.Mesh(geometry, material); //网格模型
  mesh.position.set(0, 10, 0); //网格模型位置
  scene.add(mesh);  //场景添加网格模型
  
  // AxesHelper
  const axesHelper = new THREE.AxesHelper(150);
  scene.add(axesHelper);
  
  // 相机
  
  // 渲染器
  
  // 渲染函数
  const clock = new THREE.Clock();
  ctx.addUpdateCallback(() => {
    const spt = clock.getDelta() * 1000;//毫秒
        console.log('两帧渲染时间间隔(毫秒)', spt);
        console.log('帧率FPS', 1000 / spt);
        mesh.rotateY(0.01);//每次绕y轴旋转0.01弧度
  })
}
</script>
