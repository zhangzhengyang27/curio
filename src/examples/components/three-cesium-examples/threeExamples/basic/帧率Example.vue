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
import Stats from 'three/examples/jsm/libs/stats.module.js'; 
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

  //引入性能监视器stats.js
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
  
  const stats = new Stats();
  document.body.appendChild(stats.domElement);
  ctx.addUpdateCallback(() => {
    stats.update();
  })
}
</script>
