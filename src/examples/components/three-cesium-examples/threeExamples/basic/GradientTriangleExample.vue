<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 500]"
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
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

  initObject();
  function initObject() {
    let geometry = new THREE.BufferGeometry(); // 使用BufferGeometry
  
    let vertices = new Float32Array([
      0, 0, 0, // 顶点p1
      0, 200, 0, // 顶点p2
      200, 0, 0 // 顶点p3
    ]);
  
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  
    let colors = [
      1.0, 0.0, 0.0, // 颜色1 (红色)
      0.0, 1.0, 0.0, // 颜色2 (绿色)
      0.0, 0.0, 1.0  // 颜色3 (蓝色)
    ];
  
    // 创建顶点颜色属性
    let colorAttribute = new THREE.BufferAttribute(new Float32Array(colors), 3);
    geometry.setAttribute('color', colorAttribute);
  
    // 定义索引，创建三角形面
    let indices = [
      0, 1, 2 // 索引0, 1, 2 表示顶点数组中的p1, p2, p3
    ];
    let indexAttribute = new THREE.BufferAttribute(new Uint16Array(indices), 1);
    geometry.setIndex(indexAttribute);
  
    let material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      wireframe: false
    });
  
    let obj = new THREE.Mesh(geometry, material);
    scene.add(obj);
  }
}
</script>
