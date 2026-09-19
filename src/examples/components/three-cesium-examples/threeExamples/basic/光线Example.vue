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

  // 1、影响哪些材质
  //     不影响：MeshBasicMaterial（基础）
  //     影像：  MeshLambertMaterial（漫反射）、MeshPhongMaterial（高光）、MeshPhysicalMaterial（物理）、MeshStandardMaterial（物理）
  
  // 2、光源（分类、颜色、强度、衰减、位置）
  //     PointLight（点光源）、SpotLight（聚光灯）、DirectionalLight（平行光）、AmbientLight（环境光）
  
  // 场景
  const geometry = new THREE.BoxGeometry(100, 100, 100); //几何体
  const material = new THREE.MeshLambertMaterial(); //材质 
  const mesh = new THREE.Mesh(geometry, material); //网格模型
  mesh.position.set(0, 10, 0); //网格模型位置
  scene.add(mesh);  //场景添加网格模型
  
  // AxesHelper
  const axesHelper = new THREE.AxesHelper(150);
  scene.add(axesHelper);
  
  // ---------光源-----------
  const directionalLight = new THREE.DirectionalLight(0xff00ff, 1.0); //颜色、强度
  directionalLight.position.set(100, 0, 200);   //位置
  scene.add(directionalLight); //点光源添加到场景中
  
  // -----------光源参考线-----------
  const dirLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5, 0xff0000);
  scene.add(dirLightHelper);
  
  // 相机
  
  // 渲染器
}
</script>
