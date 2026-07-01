<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 16]"
    :clear-color="0xffffff"
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
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

  controls.enableDamping = true
  
  const width = 10, height = 10 // 宽度和高度
  
  const dx = 1, dy = 1 // 网格间隔
  
  const colorA = new THREE.Color(0xaaaaaa), colorB = new THREE.Color(0xdfdfdf) // 网格颜色
  
  const vertices = [], colors = [] // 顶点和颜色
  
  // 生成网格顶点和颜色
  for (let i = -width / 2; i <= width / 2; i += dx) {
  
      vertices.push(i, -height / 2, 0, i, height / 2, 0) // 水平线
  
      const color = (i === 0) ? colorA : colorB // 颜色
  
      colors.push(...Array(2).fill(color.toArray()).flat())
  
  }
  
  // 垂直线
  for (let j = -height / 2; j <= height / 2; j += dy) {
  
      vertices.push(-width / 2, j, 0, width / 2, j, 0) // 垂直线
  
      const color = (j === 0) ? colorA : colorB // 颜色
  
      colors.push(...Array(2).fill(color.toArray()).flat())
      
  }
  
  // 创建 BufferGeometry 和材质
  const geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  
  const material = new THREE.LineBasicMaterial({ vertexColors: true })
  
  const grid = new THREE.LineSegments(geometry, material)
  
  scene.add(grid)
}
</script>
