<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 8, 30]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

async function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  controls.enableDamping = true
  
  // 文件地址
  const urls = [0, 1, 2, 3, 4, 5].map(k => (props.example?.globals?.FILE_HOST + 'files/sky/skyBox0/' + (k + 1) + '.png'));
  
  const textureCube = new THREE.CubeTextureLoader().load(urls);
  
  scene.background = textureCube;
  
  const video = document.createElement('video')
  
  video.crossOrigin = 'anonymous' // 跨域
  
  video.src = 'https://z2586300277.github.io/3d-file-server/video/test.mp4'
  
  video.loop = true // 循环播放
  
  video.muted = true // 静音
  
  video.play()
  
  const texture = await new Promise(r => video.onloadeddata = () => r(new THREE.VideoTexture(video))) // 创建视频纹理
  
  new GLTFLoader().load(props.example?.globals?.FILE_HOST + "models/glb/zhanguan.glb", (gltf) => {
  
    gltf.scene.traverse((child) => {
  
      if (child.isMesh) {
  
        child.material.map = texture
  
        child.material.envMap = textureCube
  
      }
  
    })
  
    scene.add(gltf.scene)
  
  })
}
</script>
