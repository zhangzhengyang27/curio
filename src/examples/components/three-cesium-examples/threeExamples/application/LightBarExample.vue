<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 10, 10]"
    alpha
    antialias
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

  scene.add(new THREE.AmbientLight(0xffffff, 0.5), new THREE.AxesHelper(100))
  
  // 随机创建光柱
  for (let i = 0; i < 10; i++) {
  
      const lightBar = createLightBar(0xffffff * Math.random())
  
      lightBar.position.set(Math.random() * 10 - 5, 0, Math.random() * 10 - 5)
  
      scene.add(lightBar)
  
  }
  
  function createLightBar(color = 0xfcde8c) {
      // 创建mesh
      const geometry = new THREE.CylinderGeometry(0.3, 0.3, 10, 6)
  
      const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
  
      const mesh = new THREE.Mesh(geometry, material)
  
      material.blending = THREE.AdditiveBlending
  
      // 创建纹理
      const texture = new THREE.TextureLoader().load(props.example?.globals?.FILE_HOST + 'images/channels/lightMap.png')
  
      texture.wrapS = THREE.RepeatWrapping
  
      texture.wrapT = THREE.RepeatWrapping
  
      // 创建平面
      const plane = new THREE.PlaneGeometry(1.5, 10)
  
      const planeMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.3, side: THREE.DoubleSide, map: texture })
  
      planeMaterial.blending = THREE.AdditiveBlending
  
      planeMaterial.depthTest = false
  
      const planeMesh = new THREE.Mesh(plane, planeMaterial)
  
      const planeMesh2 = planeMesh.clone()
  
      planeMesh2.rotation.y = Math.PI / 3
  
      const planeMesh3 = planeMesh.clone()
  
      planeMesh3.rotation.y = -Math.PI / 3
  
      mesh.add(planeMesh3)
  
      mesh.add(planeMesh)
  
      mesh.add(planeMesh2)
  
      // 创建group
      const group = new THREE.Group()
  
      ;(group as any).RootMaterials = [material, planeMaterial]
  
      group.add(mesh)
  
      return group
  
  }
}
</script>
