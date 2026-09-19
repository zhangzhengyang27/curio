<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 20]"
    alpha
    antialias
    custom-render
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
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

  const effectComposer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  effectComposer.addPass(renderPass);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(ctx.container?.clientWidth, ctx.container?.clientHeight), 0.8, 0.4, 0.0);
  effectComposer.addPass(bloomPass);
  
  const geometry = new THREE.ConeGeometry(3.5, 5.5, 4);
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("/external-examples/3d-file-server/g2657/images/gradual_change_y_02.png");
  const material = new THREE.MeshBasicMaterial({
      map: texture
  })
  
  const cone = new THREE.Mesh(geometry, material);
  cone.rotation.x = -Math.PI;
  scene.add(cone);
  
  let d = 0.03
  
  ctx.addUpdateCallback(() => {
    if (cone.position.y > 3 || cone.position.y < 0) d = -d
        cone.position.y += d;
        cone.rotation.y += Math.PI / 100;
        effectComposer.render()
  })
}
</script>
