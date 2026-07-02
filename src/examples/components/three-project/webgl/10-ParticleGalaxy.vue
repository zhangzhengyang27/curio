<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"

  import vertexShader from "./shader/galaxy/vertexShader.glsl?raw"
  import fragmentShader from "./shader/galaxy/fragmentShader.glsl?raw"

  const containerRef = shallowRef(null)

  const { scene, startAnimation } = useThreeScene(containerRef, {
    fov: 75,
    cameraPosition: { x: 0, y: 0, z: 5 },
    enableControls: true,
    showAxesHelper: false,
    axesHelperSize: 5,
    controlsConfig: { enableDamping: true }
  })

  let geometry: THREE.BufferGeometry | null = null
  let material: THREE.ShaderMaterial | null = null
  let points: THREE.Points | null = null
  let gui: GUI | null = null

  // 纹理
  const textureLoader = new THREE.TextureLoader()
  const texture = textureLoader.load("/three-project/texture/particles/9.png")

  // 参数
  const params = {
    count: 2500,
    size: 0.1,
    radius: 5,
    branches: 4,
    color: "#ff6b6b",
    outColor: "#1b263b"
  }

  let galaxyColor = new THREE.Color(params.color)
  let outGalaxyColor = new THREE.Color(params.outColor)

  const generateGalaxy = () => {
    if (!scene.value) return
    if (points && geometry && material) {
      geometry.dispose()
      material.dispose()
      scene.value.remove(points)
    }

    geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(params.count * 3)
    const colors = new Float32Array(params.count * 3)
    const scales = new Float32Array(params.count)
    const imgIndex = new Float32Array(params.count)

    for (let i = 0; i < params.count; i++) {
      const current = i * 3
      const branchAngel = (i % params.branches) * ((2 * Math.PI) / params.branches)
      const radius = Math.random() * params.radius
      const randomX = Math.pow(Math.random() * 2 - 1, 3) * 0.5 * (params.radius - radius) * 0.3
      const randomY = Math.pow(Math.random() * 2 - 1, 3) * 0.5 * (params.radius - radius) * 0.3
      const randomZ = Math.pow(Math.random() * 2 - 1, 3) * 0.5 * (params.radius - radius) * 0.3

      positions[current] = Math.cos(branchAngel) * radius + randomX
      positions[current + 1] = randomY
      positions[current + 2] = Math.sin(branchAngel) * radius + randomZ

      const mixColor = galaxyColor.clone()
      mixColor.lerp(outGalaxyColor, radius / params.radius)
      colors[current] = mixColor.r
      colors[current + 1] = mixColor.g
      colors[current + 2] = mixColor.b

      scales[i] = Math.random()
      imgIndex[i] = i % 3
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1))
    geometry.setAttribute("imgIndex", new THREE.BufferAttribute(imgIndex, 1))

    material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: texture },
        uColor: { value: galaxyColor }
      }
    })

    points = new THREE.Points(geometry, material)
    scene.value.add(points)
  }

  const createGUI = () => {
    gui = new GUI()
    gui.add(params, "count", 500, 10000, 100).name("粒子数量").onFinishChange(generateGalaxy)
    gui.add(params, "radius", 1, 20, 0.1).name("半径").onChange(generateGalaxy)
    gui.add(params, "branches", 2, 8, 1).name("分支数").onChange(generateGalaxy)
    gui
      .addColor(params, "color")
      .name("内圈颜色")
      .onFinishChange((v) => {
        galaxyColor = new THREE.Color(v)
        generateGalaxy()
      })
    gui
      .addColor(params, "outColor")
      .name("外圈颜色")
      .onFinishChange((v) => {
        outGalaxyColor = new THREE.Color(v)
        generateGalaxy()
      })
  }

  const init = () => {
    generateGalaxy()

    const clock = new THREE.Clock()
    startAnimation(() => {
      const elapsed = clock.getElapsedTime()
      if (material && material.uniforms && material.uniforms.uTime) {
        material.uniforms.uTime.value = elapsed
      }
    })

    createGUI()
  }

  const cleanup = () => {
    if (gui) {
      gui.destroy()
      gui = null
    }
    if (scene.value && points) {
      scene.value.remove(points)
      geometry?.dispose()
      material?.dispose()
      points = null
    }
  }

  onMounted(() => {
    setTimeout(() => init(), 100)
  })
  onUnmounted(() => cleanup())
</script>

<template>
  <PageLayout
    title="🌌 粒子银河"
    description="Shader + Points 实现的旋转银河星系，lil-gui 参数可调"
  >
    <div
      ref="containerRef"
      class="three-container"
    />
  </PageLayout>
</template>

<style scoped>
  .three-container {
    width: 100vw;
    height: 100vh;
  }
</style>
