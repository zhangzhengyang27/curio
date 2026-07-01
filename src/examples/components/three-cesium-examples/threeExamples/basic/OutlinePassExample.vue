<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[15, 15, 15]"
    alpha
    antialias
    custom-render
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
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
  
  controls.dampingFactor = 0.02
  
  // 后期处理
  const composer = new EffectComposer(renderer);
  
  const renderPass = new RenderPass(scene, camera);
  
  composer.addPass(renderPass);
  
  // 轮廓
  const outlinePass = new OutlinePass(new THREE.Vector2(ctx.container?.clientWidth, ctx.container?.clientHeight), scene, camera);
  
  composer.addPass(outlinePass);
  
  // 色彩校正
  const outputPass = new OutputPass();
  
  composer.addPass(outputPass);
  
  // 渲染
  
  ctx.addUpdateCallback(() => {
    composer.render()
  })
  
  // 适配
  // 点击事件
  
  const raycaster = new THREE.Raycaster()
  
  ctx.container?.addEventListener('click', (event) => {
  
      const mouse = new THREE.Vector2(
  
          (event.offsetX / event.target.clientWidth) * 2 - 1,
  
          -(event.offsetY / event.target.clientHeight) * 2 + 1
  
      )
  
      raycaster.setFromCamera(mouse, camera)
  
      const intersects = raycaster.intersectObjects(scene.children)
  
      if (intersects.length > 0) outlinePass.selectedObjects = [intersects[0].object]
  
      else outlinePass.selectedObjects = []
  
  })
  
  // 辅助
  scene.add(new THREE.AxesHelper(500), new THREE.GridHelper(100, 20))
  
  // 物体
  for (let i = 0; i < 10; i++) {
  
      const geometry = new THREE.BoxGeometry()
  
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 * Math.random() })
  
      const cube = new THREE.Mesh(geometry, material)
  
      cube.position.x = Math.random() * 10
  
      cube.position.y = Math.random() * 10
  
      cube.position.z = Math.random() * 10
  
      scene.add(cube)
  
  }
}
</script>
