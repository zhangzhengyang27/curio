<script setup lang="ts">
import { shallowRef, onUnmounted } from 'vue'
import * as THREE from 'three'
import { useThreeScene } from '@/examples/components/three-project/_shared/useThreeScene'
import PageLayout from '@/examples/components/three-project/_shared/PageLayout.vue'

const containerRef = shallowRef<HTMLDivElement | null>(null)

const { scene, camera, renderer, startAnimation, onSceneReady, dispose: baseDispose } = useThreeScene(
  containerRef,
  {
    fov: 45,
    cameraPosition: { x: 0, y: 50, z: 200 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05
    },
    showAxesHelper: false,
    showGridHelper: false
  }
)

let spriteList: THREE.Sprite[] = []
let material: THREE.SpriteMaterial | null = null

onSceneReady(() => {
  if (!scene.value || !camera.value || !renderer.value) return

  // 添加灯光
  scene.value.add(new THREE.AmbientLight(0xffffff, 0.4))
  const spotLight = new THREE.SpotLight(0xffffff)
  spotLight.position.set(200, 800, 400)
  scene.value.add(spotLight)

  // 创建圆形纹理
  function getSpriteTexture() {
    const canvas = document.createElement('canvas')
    const size = 8
    canvas.width = size * 2
    canvas.height = size * 2

    const c = canvas.getContext('2d')
    if (!c) return null

    c.fillStyle = '#00ff00'
    c.arc(size, size, size / 1.5, 0, Math.PI * 2)
    c.fill()

    const texture = new THREE.CanvasTexture(canvas)
    return texture
  }

  const texture = getSpriteTexture()
  if (!texture) return

  material = new THREE.SpriteMaterial({
    color: 0x008800,
    map: texture
  })

  const total = 20
  for (let i = -total; i < total; i++) {
    for (let j = -total; j < total; j++) {
      const sprite = new THREE.Sprite(material)
      sprite.position.set(i * 10, 0, j * 10)
      spriteList.push(sprite)
      scene.value.add(sprite)
    }
  }

  let status = 0
  const speed = 0.1
  const height = 5
  const step = 0.3

  startAnimation(() => {
    let index = -1
    for (let x = 0; x < total * 2; x++) {
      for (let y = 0; y < total * 2; y++) {
        index++
        const sprite = spriteList[index]
        if (!sprite) continue

        sprite.position.y = Math.sin(x + status) * step * height + Math.sin(y + status) * step * height

        const scaleValue = Math.sin(x + status) * step + 1
        sprite.scale.set(scaleValue, scaleValue, scaleValue)
      }
    }
    status += speed
  })
})

onUnmounted(() => {
  spriteList.forEach((sprite) => {
    sprite.geometry?.dispose()
  })
  spriteList = []

  material?.map?.dispose()
  material?.dispose()
  material = null

  baseDispose()
})
</script>

<template>
  <PageLayout
    title="水波粒子"
    description="使用 Three.js Sprite 构建的正弦波动画，每个粒子的位置与缩放都随时间波动"
  >
    <template #content>
      <div class="features">
        <h3>核心知识点：</h3>
        <ul>
          <li><strong>Sprite 粒子</strong> - 始终面向相机的 2D 贴片</li>
          <li><strong>CanvasTexture</strong> - 动态绘制圆形纹理</li>
          <li><strong>正弦波动</strong> - 通过 sin(x + time) 模拟水面起伏</li>
        </ul>
      </div>
    </template>

    <div ref="containerRef" />
  </PageLayout>
</template>
