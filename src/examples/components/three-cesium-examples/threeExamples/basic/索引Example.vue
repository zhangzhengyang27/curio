<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[200, 200, 200]"
    :camera-look-at="[0, 0, 0]"
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

  // 网格模型Mesh其实就一个一个三角形(面)拼接构成
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
      0, 0, 0,
      50, 0, 0,
      50, 0, 50,
  
      // 0, 0, 0,
      0, 0, 50,
      // 50, 0, 50,
  ]);
  
  // 下面索引值对应顶点位置数据中的顶点坐标
  // 第 0、1、2这三个点构成一个三角形
  // 第 0、3、2这三个点构成一个三角形
  const indexes = new Uint16Array([
      0, 1, 2, 0, 3, 2,
  ])
  
  geometry.index = new THREE.BufferAttribute(indexes, 1);
  
  geometry.attributes.position = new THREE.BufferAttribute(vertices, 3);
  
  // 点渲染模式
  const material2 = new THREE.PointsMaterial({
      color: 0xffff00,
      size: 10.0 //点对象像素尺寸
  });
  const points = new THREE.Points(geometry, material2); //点模型对象
  scene.add(points);
  
  // 线材质对象
  const material1 = new THREE.LineBasicMaterial({
      color: 0xff0000 //线条颜色
  });
  // 创建线模型对象
  const line = new THREE.Line(geometry, material1);
  scene.add(line);
  
  // 网格
  const material = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  
  // AxesHelper
  const axesHelper = new THREE.AxesHelper(150);
  scene.add(axesHelper);
  
  // 相机
  
  // 渲染器
}
</script>
