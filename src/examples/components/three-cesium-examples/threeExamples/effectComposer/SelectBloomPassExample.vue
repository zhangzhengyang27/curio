<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 5, 5]"
    alpha
    antialias
    custom-render
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { BlendFunction, SelectiveBloomEffect, EffectComposer, EffectPass, RenderPass } from "postprocessing";
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

  // 附加后处理库
  const composer = new EffectComposer(renderer);
  
  const bloomEffect = new SelectiveBloomEffect(scene, camera, {
  
      blendFunction: BlendFunction.ADD,
  
      mipmapBlur: true,
  
      luminanceThreshold: 0.4,
  
      luminanceSmoothing: 0.2,
  
      intensity: 3.0
  
  })
  
  composer.addPass(new RenderPass(scene, camera))
  
  composer.addPass(new EffectPass(camera, bloomEffect))
  
  // 添加10个立方体
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
  
  const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xa0dee2 })
  
  const boxMaterial2 = new THREE.MeshBasicMaterial({ color: 'yellow' })
  
  const box1 = new THREE.Mesh(boxGeometry, boxMaterial)
  
  const box2 = new THREE.Mesh(boxGeometry, boxMaterial2)
  
  box1.position.set(-1.5, 0, 0)
  
  scene.add(box1, box2)
  
  ;(bloomEffect.selection.set as any)([box1], true)
  
  // 点击立方体时，高亮立方体
  ctx.container?.addEventListener('click', (e: any) => {
  
      const raycaster = new THREE.Raycaster()
  
      const mouse = new THREE.Vector2(
  
          (e.offsetX / e.target.clientWidth) * 2 - 1,
  
          -(e.offsetY / e.target.clientHeight) * 2 + 1
  
      )
  
      raycaster.setFromCamera(mouse, camera)
  
      const intersects = raycaster.intersectObjects(scene.children)
  
      if (intersects.length > 0) {
  
          const object = intersects[0].object
  
          bloomEffect.selection.toggle(object);
  
      }
  
  })
  
  // 渲染
  ctx.addUpdateCallback(() => {
    composer.render()
  })
}
</script>
