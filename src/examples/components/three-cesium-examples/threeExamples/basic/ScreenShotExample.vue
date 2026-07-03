<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 10, 10]"
    custom-render
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GUI } from 'lil-gui'
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

  const composer = new EffectComposer(renderer);
  
  const renderPass = new RenderPass(scene, camera);
  
  composer.addPass(renderPass);
  
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0, 0)
  
  composer.addPass(bloomPass);
  
  ctx.addUpdateCallback(() => {
    composer.render()
  })
  
  // 物体
  const geometry = new THREE.BoxGeometry()
  
  const material = new THREE.MeshBasicMaterial({ color: 'yellow' })
  
  const cube = new THREE.Mesh(geometry, material)
  
  scene.add(cube)
  
  // 截图
  new GUI().add({ '截图': screenShot }, '截图')
  
  function screenShot() {
  
      composer.render()
  
      const base64 = renderer.domElement.toDataURL(['image/png', '0.8'])
  
      const link = document.createElement('a');
  
      link.href = base64;
  
      link.download = 'myImage.png';
  
      link.click();
  
  }
}
</script>
