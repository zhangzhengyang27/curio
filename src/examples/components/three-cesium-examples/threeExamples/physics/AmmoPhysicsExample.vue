<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[15, 15, 15]"
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { AmmoPhysics } from 'three/examples/jsm/physics/AmmoPhysics.js'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

async function onReady(ctx: any) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  scene.add(new THREE.DirectionalLight(0xffffff, 3))
  
  // 安装
  const physics = await AmmoPhysics()
  
  const floor = new THREE.Mesh(new THREE.BoxGeometry(60, 5, 60), new THREE.MeshLambertMaterial({ color: 0x444444 }))
  
  floor.position.y -= 20
  
  floor.userData.physics = { mass: 0 }
  
  scene.add(floor)
  
  for (let i = 0; i < 100; i++) {
  
      const geometry = Math.random() > 0.5 ? new THREE.IcosahedronGeometry() : new THREE.SphereGeometry()
  
      const material = new THREE.MeshLambertMaterial({ color: 0xffffff * Math.random() })
  
      const mesh = new THREE.Mesh(geometry, material)
  
      mesh.position.set(Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5)
  
      mesh.userData.physics = { mass: 1 }
  
      scene.add(mesh)
  
  }
  
  physics.addScene(scene) // 启动物理引擎
}
</script>
