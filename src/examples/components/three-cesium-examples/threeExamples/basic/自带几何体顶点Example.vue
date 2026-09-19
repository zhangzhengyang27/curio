<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[400, 300, 500]"
    :camera-look-at="[0, 50, 40]"
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
  //BoxGeometry：长方体
  const geometry1 = new THREE.BoxGeometry(10, 10, 10);
  // SphereGeometry：球体
  const geometry2 = new THREE.SphereGeometry(10);
  // CylinderGeometry：圆柱
  const geometry3 = new THREE.CylinderGeometry(10, 10, 100);
  
  // PlaneGeometry：矩形平面
  // 几何体细分数
  const geometry4 = new THREE.PlaneGeometry(10, 50, 10, 10);
  // CircleGeometry：圆形平面
  const geometry5 = new THREE.CircleGeometry(10);
  
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); //材质 
  
  const mesh1 = new THREE.Mesh(geometry1, material);
  mesh1.position.set(0, 0, 0);
  const mesh2 = new THREE.Mesh(geometry2, material);
  mesh2.position.set(0, 0, 30);
  const mesh3 = new THREE.Mesh(geometry3, material);
  mesh3.position.set(0, 0, 60);
  const mesh4 = new THREE.Mesh(geometry4, material);
  mesh4.position.set(0, 0, 90);
  const mesh5 = new THREE.Mesh(geometry5, material);
  mesh5.position.set(0, 0, 120);
  
  scene.add(mesh1);
  scene.add(mesh2);
  scene.add(mesh3);
  scene.add(mesh4);
  scene.add(mesh5);
  
  console.log('顶点位置数据', geometry1);
  console.log('顶点位置数据', geometry1.attributes.position);
  console.log('顶点位置数据', geometry2.attributes.position);
  console.log('顶点位置数据', geometry3.attributes.position);
  console.log('顶点位置数据', geometry4.attributes.position);
  console.log('顶点位置数据', geometry5.attributes.position);
  
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
