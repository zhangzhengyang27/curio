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
  
  const video = document.createElement('video')
  video.crossOrigin = 'anonymous'
  video.src = props.example?.globals?.FILE_HOST + 'video/vr.mp4'
  video.loop = true
  video.muted = true
  video.play()
  
  const texture = new THREE.VideoTexture(video)
  const geometry = new THREE.SphereGeometry(100, 64, 32)
  
  const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
  })
  
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
  
  ctx.addUpdateCallback(() => {
    mesh.rotation.y += 0.001
  })
}
</script>
