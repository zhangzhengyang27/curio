<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  const containerRef = shallowRef(null)

  const { scene, startAnimation, onSceneReady, dispose: baseDispose } =
    useThreeScene(containerRef, {
      cameraPosition: { x: 4, y: 4, z: 6 },
      enableControls: true,
      controlsConfig: { enableDamping: true, dampingFactor: 0.05 },
      showAxesHelper: true,
      showGridHelper: true
    })

  let gui!: GUI, currentMesh: THREE.Mesh | null = null

  const params = {
    shapeType: "star",
    depth: 1.5,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.1,
    bevelSegments: 3,
    color: 0x3498db
  }

  const createStar = () => {
    const shape = new THREE.Shape()
    const spikes = 5
    const outerR = 1.5
    const innerR = 0.7
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR
      const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)
    }
    shape.closePath()
    return shape
  }

  const createRectWithHole = () => {
    const shape = new THREE.Shape()
    shape.moveTo(-1.5, -1.5)
    shape.lineTo(1.5, -1.5)
    shape.lineTo(1.5, 1.5)
    shape.lineTo(-1.5, 1.5)
    shape.closePath()
    const hole = new THREE.Path()
    hole.absellipse(0, 0, 0.6, 0.6, 0, Math.PI * 2, false)
    shape.holes.push(hole)
    return shape
  }

  const createHeart = () => {
    const shape = new THREE.Shape()
    const x = 0, y = 0
    shape.moveTo(x + 0.5, y + 0.5)
    shape.bezierCurveTo(x + 0.5, y + 0.5, x + 0.4, y, x, y)
    shape.bezierCurveTo(x - 0.6, y, x - 0.6, y + 0.7, x - 0.6, y + 0.7)
    shape.bezierCurveTo(x - 0.6, y + 1.1, x - 0.3, y + 1.54, x, y + 1.9)
    shape.bezierCurveTo(x + 0.3, y + 1.54, x + 0.6, y + 1.1, x + 0.6, y + 0.7)
    shape.bezierCurveTo(x + 0.6, y + 0.7, x + 0.6, y, x, y)
    shape.bezierCurveTo(x - 0.4, y, x - 0.5, y + 0.5, x - 0.5, y + 0.5)
    // 简化心形路径
    const heart = new THREE.Shape()
    heart.moveTo(0, 0.8)
    heart.bezierCurveTo(0, 1.2, -0.5, 1.6, -1.2, 1.2)
    heart.bezierCurveTo(-2, 0.6, -1.5, -0.8, 0, -1.8)
    heart.bezierCurveTo(1.5, -0.8, 2, 0.6, 1.2, 1.2)
    heart.bezierCurveTo(0.5, 1.6, 0, 1.2, 0, 0.8)
    return heart
  }

  const createExtrudedMesh = () => {
    if (!scene.value) return

    // 清除旧的
    if (currentMesh) {
      scene.value.remove(currentMesh)
      currentMesh.geometry.dispose()
      const mat = currentMesh.material as THREE.Material
      mat.dispose()
      currentMesh = null
    }

    let shape!: THREE.Shape
    switch (params.shapeType) {
      case "star": shape = createStar(); break
      case "rectHole": shape = createRectWithHole(); break
      case "heart": shape = createHeart(); break
    }

    const extrudeSettings = {
      depth: params.depth,
      bevelEnabled: params.bevelEnabled,
      bevelThickness: params.bevelThickness,
      bevelSize: params.bevelSize,
      bevelSegments: params.bevelSegments
    }

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geometry.center()
    const material = new THREE.MeshStandardMaterial({
      color: params.color,
      metalness: 0.3,
      roughness: 0.5,
      side: THREE.DoubleSide
    })
    currentMesh = new THREE.Mesh(geometry, material)
    currentMesh.rotation.x = -0.3
    scene.value.add(currentMesh)
  }

  const initGUI = () => {
    gui = new GUI()
    gui.add(params, "shapeType", ["star", "rectHole", "heart"]).name("形状").onChange(createExtrudedMesh)
    gui.add(params, "depth", 0.1, 4, 0.1).name("拉伸深度").onChange(createExtrudedMesh)
    gui.add(params, "bevelEnabled").name("倒角").onChange(createExtrudedMesh)
    gui.add(params, "bevelThickness", 0.01, 0.5, 0.01).name("倒角厚度").onChange(createExtrudedMesh)
    gui.add(params, "bevelSize", 0.01, 0.3, 0.01).name("倒角大小").onChange(createExtrudedMesh)
    gui.add(params, "bevelSegments", 1, 8, 1).name("倒角分段").onChange(createExtrudedMesh)
    gui.addColor(params, "color").name("颜色").onChange((v: number) => {
      if (currentMesh) {
        const mat = currentMesh.material as THREE.MeshStandardMaterial
        mat.color!.set(v)
      }
    })
  }

  const animateCallback = () => {
    if (currentMesh) {
      currentMesh.rotation.y += 0.005
    }
  }

  onSceneReady(() => {
    if (!scene.value) return
    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    scene.value.add(ambient)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(5, 10, 7)
    scene.value.add(dirLight)

    createExtrudedMesh()
    initGUI()
    startAnimation(animateCallback)
  })

  onUnmounted(() => {
    if (currentMesh) {
      currentMesh.geometry.dispose()
      const mat = currentMesh.material as THREE.Material
      mat.dispose()
    }
    gui?.destroy()
    baseDispose()
  })
</script>

<template>
  <PageLayout
    title="🌀 形状拉伸"
    description="Shape + ExtrudeGeometry：星形、带孔矩形、心形"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>⭐ 星形 / 🟩 带孔矩形 / ❤️ 心形</li>
          <li>📏 ExtrudeGeometry 拉伸成 3D</li>
          <li>🎛️ GUI 调节深度、倒角参数</li>
          <li>🎨 实时切换形状和颜色</li>
        </ul>
      </div>
    </template>
    <div ref="containerRef" />
  </PageLayout>
</template>
