<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[200, 200, 200]"
    :camera-look-at="[0, 10, 0]"
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
  const geometry = new THREE.BoxGeometry(10, 60, 100); //几何体
  const material = new THREE.MeshLambertMaterial(); //材质 
  const mesh = new THREE.Mesh(geometry, material); //网格模型
  mesh.position.set(0, 10, 0); //网格模型位置
  scene.add(mesh);  //场景添加网格模型
  
  // AxesHelper
  const axesHelper = new THREE.AxesHelper(150);
  scene.add(axesHelper);
  
  // 光源
  const pointLight = new THREE.DirectionalLight(0xff00ff, 1.0); //颜色、强度
  pointLight.position.set(200, 300, 400);   //位置
  scene.add(pointLight); //点光源添加到场景中
  
  // 光源参考线
  const dirLightHelper = new THREE.DirectionalLightHelper(pointLight, 5, 0xff0000);
  scene.add(dirLightHelper);
  
  // 相机
  
  // 渲染器
  
  // 设置相机控件轨道控制器OrbitControls
  // 如果OrbitControls改变了相机参数，重新调用渲染器渲染三维场景
  //监听鼠标、键盘事件
}
</script>
