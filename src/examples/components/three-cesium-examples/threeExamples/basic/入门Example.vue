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

  // 场景 + 相机-- > 渲染器 - >成果
  
  // 场景 = （网格模型(几何体 + 材质) + 位置） + （网格模型(几何体 + 材质) + 位置）
  // 相机 = 相机位置 + 相机观察位置
  
  const geometry = new THREE.BoxGeometry(100, 100, 100); //几何体
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); //材质 
  const mesh = new THREE.Mesh(geometry, material); //网格模型
  mesh.position.set(0, 10, 0); //网格模型位置
  scene.add(mesh);  //场景添加网格模型
}
</script>
