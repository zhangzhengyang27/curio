<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 5]"
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
  
  // 后期处理
  const composer = new EffectComposer(renderer);
  
  const renderPass = new RenderPass(scene, camera);
  
  composer.addPass(renderPass);
  
  // 轮廓
  const outlinePass = new OutlinePass(new THREE.Vector2(ctx.container?.clientWidth, ctx.container?.clientHeight), scene, camera);
  
  outlinePass.visibleEdgeColor.set('red'); // 设置可见边缘颜色
  
  composer.addPass(outlinePass);
  
  const outputPass2 = new OutlinePass(new THREE.Vector2(ctx.container?.clientWidth, ctx.container?.clientHeight), scene, camera);
  
  composer.addPass(outputPass2);
  
  const outlinePass3 = new OutlinePass(new THREE.Vector2(ctx.container?.clientWidth, ctx.container?.clientHeight), scene, camera);
  
  outlinePass3.visibleEdgeColor.set('blue');
  
  composer.addPass(outlinePass3);
  
  // 色彩校正
  const outputPass = new OutputPass();
  
  composer.addPass(outputPass);
  
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 32), new THREE.MeshBasicMaterial())
  
  cone.position.set(2, 0, 0)
  
  scene.add(cone);
  
  outlinePass.selectedObjects = [cone]
  
  const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x00ff00 }))
  
  scene.add(cube);
  
  outputPass2.selectedObjects = [cube];
  
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshBasicMaterial({ color: 'yellow' }))
  
  sphere.position.set(-2, 0, 0)
  
  scene.add(sphere);
  
  outlinePass3.selectedObjects = [sphere];
  
  // 渲染
  
  ctx.addUpdateCallback(() => {
    composer.render()
  })
  
  // 适配
}
</script>
