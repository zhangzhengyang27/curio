<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[200, 200, 200]"
    :camera-look-at="[0, 0, 0]"
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

  // 网格模型Mesh其实就一个一个三角形(面)拼接构成
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
      0, 0, 0,
      50, 0, 0,
      50, 0, 50,
  
      0, 0, 0,
      0, 0, 50,
      50, 0, 50,
  ]);
  
  geometry.attributes.position = new THREE.BufferAttribute(vertices, 3);
  
  const colors = new Float32Array([
      1, 1, 1, //顶点1颜色
      1, 1, 0, //顶点2颜色
      1, 1, 1, //顶点3颜色
      1, 0, 0, //顶点4颜色
      0, 1, 1, //顶点5颜色
      0, 0, 1, //顶点6颜色
  ]);
  geometry.attributes.color = new THREE.BufferAttribute(colors, 3)
  
  // 点颜色
  const material = new THREE.PointsMaterial({
      vertexColors: colors as unknown as boolean,
      size: 10.0
  })
  const points = new THREE.Points(geometry, material)
  scene.add(points)
  
  // 网格颜色
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
  
  // AxesHelper
  const axesHelper = new THREE.AxesHelper(150);
  scene.add(axesHelper);
  
  // 相机
  
  // 渲染器
}
</script>
