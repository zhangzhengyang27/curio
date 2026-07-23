<script setup lang="ts">
import { shallowRef, onUnmounted } from 'vue'
import * as THREE from 'three'
import { useThreeScene } from '@/examples/components/three-project/_shared/useThreeScene'
import PageLayout from '@/examples/components/three-project/_shared/PageLayout.vue'
import { City } from './effect/city'

const containerRef = shallowRef<HTMLDivElement | null>(null)

const { scene, camera, controls, renderer, startAnimation, onSceneReady, dispose: baseDispose } = useThreeScene(
  containerRef,
  {
    fov: 45,
    near: 1,
    far: 100000,
    cameraPosition: { x: 1000, y: 500, z: 100 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 100,
      maxDistance: 2000
    },
    showAxesHelper: false,
    showGridHelper: false
  }
)

let city: City | null = null
let cityDisposeFn: (() => void) | null = null

onSceneReady(() => {
  if (!scene.value || !camera.value || !controls.value || !renderer.value) return

  // 添加灯光
  scene.value.add(new THREE.AmbientLight(0xadadad))
  const directionLight = new THREE.DirectionalLight(0xffffff)
  directionLight.position.set(0, 0, 0)
  scene.value.add(directionLight)

  // 设置场景背景
  renderer.value.setClearColor(new THREE.Color(0x000000), 1)

  // 禁用默认缩放，使用城市自定义的滚轮交互
  controls.value.enableZoom = false
  controls.value.enablePan = true

  // 初始化城市场景
  city = new City(scene.value, camera.value, controls.value)
  cityDisposeFn = () => city?.dispose()

  const clock = new THREE.Clock()
  startAnimation(() => {
    city?.start(clock.getDelta())
  })
})

onUnmounted(() => {
  cityDisposeFn?.()
  city = null
  baseDispose()
})
</script>

<template>
  <PageLayout
    title="智慧城市可视化"
    description="基于 Three.js 的实时城市场景，包含建筑扫描、雷达、光墙、飞线、粒子天气等特效"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🏙️ <strong>FBX 城市模型</strong> - 加载北京城市建筑模型</li>
          <li>✨ <strong>建筑扫描特效</strong> - ShaderMaterial 实现扫光与线条</li>
          <li>🌧️ <strong>天气粒子系统</strong> - 雨、雪、烟雾效果</li>
          <li>🚀 <strong>飞线与光墙</strong> - 动态数据可视化元素</li>
          <li>🖱️ <strong>交互操作</strong> - 滚轮缩放、点击建筑飞行定位</li>
        </ul>
      </div>

      <div class="controls-tip">
        <p>操作说明：</p>
        <ul>
          <li>左键拖拽旋转视角</li>
          <li>滚轮以鼠标位置为中心缩放</li>
          <li>点击建筑飞行到该位置</li>
        </ul>
      </div>
    </template>

    <div ref="containerRef" />
  </PageLayout>
</template>
