<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 20]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
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
  
  const video = document.createElement('video')
  
  video.crossOrigin = 'anonymous' // 跨域
  
  video.src = 'https://z2586300277.github.io/3d-file-server/video/test.mp4'
  
  video.loop = true // 循环播放
  
  video.muted = true // 静音
  
  video.play()
  
  const texture = await new Promise(r => video.onloadeddata = () => r(new THREE.VideoTexture(video))) // 创建视频纹理
  
  const group = new THREE.Group()
  const config = {
      width: 16,
      height: 9,
      xGrid: 4,
      yGrid: 3,
      offset: 0.1
  }
  const ux = 1 / config.xGrid
  const uy = 1 / config.yGrid
  const planeWidth = config.width / config.xGrid - config.offset
  const planeHeight = config.height / config.yGrid - config.offset
  for (let i = 0; i < config.xGrid; i++) {
      for (let j = 0; j < config.yGrid; j++) {
          // 创建 4 * 3 子平面实现整体效果
          const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight)
          const material = new THREE.MeshBasicMaterial({
              map: texture,
              side: THREE.DoubleSide
          })
  
          // 切割uv来实现纹理映射到全部平面
          const uvs = geometry.attributes.uv.array
          for (let index = 0; index < uvs.length; index += 2) {
              uvs[index] = (uvs[index] + i) * ux
              uvs[index + 1] = (uvs[index + 1] + j) * uy
          }
  
          const mesh = new THREE.Mesh(geometry, material)
  
          mesh.dx = 0.004 * (0.5 - Math.random())
          mesh.dy = 0.004 * (0.5 - Math.random())
  
          const x = (i - config.xGrid / 2) * planeWidth + planeWidth * 0.5 + (i * config.offset) / 2
          const y = (j - config.yGrid / 2) * planeHeight + planeHeight * 0.5 + (j * config.offset) / 2
          mesh.position.set(x, y, 0)
          group.add(mesh)
  
      }
  
  }
  scene.add(group)
  
  const clock = new THREE.Clock()
  
  ctx.addUpdateCallback(() => {
    const elapsedTime = clock.getElapsedTime()
        for (const mesh of group.children) {
            mesh.rotation.x += Math.sin(elapsedTime * 0.1) * mesh.dx;
            mesh.rotation.y += Math.sin(elapsedTime * 0.2) * mesh.dy;
            mesh.position.x -= Math.sin(elapsedTime * 0.1) * mesh.dx;
            mesh.position.y += Math.sin(elapsedTime * 0.3) * mesh.dy;
            mesh.position.z += Math.cos(elapsedTime * 0.2) * mesh.dx;
        }
  })
}
</script>
