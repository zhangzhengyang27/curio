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

  controls.enableDamping = true
  
  // 文件地址
  const urls = [0, 1, 2, 3, 4, 5].map(k => (props.example?.globals?.FILE_HOST + 'files/sky/skyBox0/' + (k + 1) + '.png'));
  
  const textureCube = new THREE.CubeTextureLoader().load(urls);
  
  scene.background = textureCube;
  
  // 环境贴图
  const boxGeometry = new THREE.BoxGeometry(10, 10, 10);
  
  const boxMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, envMap: textureCube, metalness: 1, roughness: 0 });
  
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
  
  scene.add(boxMesh);
}
</script>
