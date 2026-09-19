<template>
  <ExampleScene
    camera="orthographic"
    :camera-options="{ size: 1 }"
    :clear-color="0x000000"
    antialias
    :enable-controls="false"
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import ExampleScene from '@/examples/components/ExampleScene.vue'

function onReady(ctx: any) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const container = ctx.container

  const world = new THREE.Object3D()
  scene.add(world)

  const width = container.clientWidth
  const height = container.clientHeight

  // 在容器范围内生成若干彩色半透明立方体
  const cubes: any[] = []
  const count = 5
  for (let i = 0; i < count; i++) {
    const color = new THREE.Color().setHSL(i * 0.15, 1.0, 0.5)
    const size = 80 + i * 40
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 })
    )
    cube.position.x = (Math.random() - 0.5) * width * 0.6
    cube.position.y = (Math.random() - 0.5) * height * 0.6
    world.add(cube)
    cubes.push(cube)
  }

  ctx.addUpdateCallback((delta: number, elapsed: number) => {
    cubes.forEach((cube, i) => {
      cube.rotation.x = elapsed * 0.5 + i
      cube.rotation.y = elapsed * 0.3 + i
    })
  })

  ctx.addUpdateCallback(() => {
    renderer.render(scene, camera)
  })
}
</script>
