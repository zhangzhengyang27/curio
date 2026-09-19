<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[2, 2, 2]"
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
  
  scene.add(new THREE.AxesHelper(100), new THREE.GridHelper(100, 10))
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 3)
  directionalLight.position.set(5, 5, 5)
  scene.add(directionalLight)
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 2)
  scene.add(ambientLight)
  
  async function createVideoPlane(url: string, width: number, height: number, positionY: number) {
  
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.src = url
      video.loop = true
      video.muted = true
      video.play()
      const texture = new THREE.VideoTexture(video)
      const geometry = new THREE.PlaneGeometry(width, height)
  
      const material = new THREE.MeshStandardMaterial({
          color: 0xffffff * Math.random(), // 随机颜色
          alphaMap: texture,
          transparent: true,
          side: THREE.DoubleSide,
      })
  
      const mesh = new THREE.Mesh(geometry, material)
      mesh.rotation.x = -Math.PI / 2
      mesh.position.set(0, positionY, 0) // 设置位置
      scene.add(mesh)
  }
  
  createVideoPlane(props.example?.globals?.FILE_HOST + 'files/video/c1.mp4', 3, 3 , 0.01)
  createVideoPlane(props.example?.globals?.FILE_HOST + 'files/video/c2.mp4', 4, 4, 0)
  createVideoPlane(props.example?.globals?.FILE_HOST + 'files/video/c3.mp4', 5, 5, -0.01)
}
</script>
