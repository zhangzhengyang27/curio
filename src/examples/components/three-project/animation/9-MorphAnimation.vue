<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"

  const containerRef = shallowRef(null)
  const clock = new THREE.Clock()
  let gui: any = null
  let morphMesh: any = null

  const params = {
    influence1: 0,
    influence2: 0,
    autoPlay: false,
    speed: 1
  }

  const { scene, camera: _camera, renderer: _renderer, controls: _controls, startAnimation, dispose: baseDispose } =
    useThreeScene(containerRef, {
      fov: 50,
      cameraPosition: { x: 0, y: 1.5, z: 5 },
      enableControls: true,
      controlsConfig: { enableDamping: true, dampingFactor: 0.05 },
      showAxesHelper: false
    })

  const initScene = () => {
    if (!scene.value) return

    scene.value.background = new THREE.Color(0x1a1a2e)

    // 创建基础球体
    const geometry = new THREE.SphereGeometry(1, 32, 32)
    const posAttr = geometry.attributes.position
    const vertexCount = posAttr.count

    // morph target 1: 挤压变形
    const squeezePos = new Float32Array(vertexCount * 3)
    for (let i = 0; i < vertexCount; i++) {
      const x = posAttr.getX(i)
      const y = posAttr.getY(i)
      const z = posAttr.getZ(i)
      squeezePos[i * 3] = x * 1.5
      squeezePos[i * 3 + 1] = y * 0.4
      squeezePos[i * 3 + 2] = z * 1.5
    }

    // morph target 2: 拉伸变形
    const stretchPos = new Float32Array(vertexCount * 3)
    for (let i = 0; i < vertexCount; i++) {
      const x = posAttr.getX(i)
      const y = posAttr.getY(i)
      const z = posAttr.getZ(i)
      const dist = Math.sqrt(x * x + z * z)
      const taper = Math.max(0, 1 - dist * 0.6)
      stretchPos[i * 3] = x * taper * 0.7
      stretchPos[i * 3 + 1] = y * 1.8
      stretchPos[i * 3 + 2] = z * taper * 0.7
    }

    geometry.morphAttributes.position = [
      new THREE.BufferAttribute(squeezePos, 3),
      new THREE.BufferAttribute(stretchPos, 3)
    ]

    const material = new THREE.MeshStandardMaterial({
      color: 0x00d2ff,
      metalness: 0.3,
      roughness: 0.4
    })

    morphMesh = new THREE.Mesh(geometry, material)
    morphMesh.morphTargetInfluences[0] = 0
    morphMesh.morphTargetInfluences[1] = 0
    scene.value.add(morphMesh)

    // 灯光
    const ambientLight = new THREE.AmbientLight(0x404060, 1.5)
    scene.value.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 2)
    dirLight.position.set(5, 5, 5)
    scene.value.add(dirLight)

    const pointLight = new THREE.PointLight(0xff6600, 1.5, 20)
    pointLight.position.set(-3, 2, -3)
    scene.value.add(pointLight)

    // 线框副本作为参考
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      wireframe: true,
      transparent: true,
      opacity: 0.1
    })
    const wireMesh = new THREE.Mesh(geometry.clone(), wireMat)
    scene.value.add(wireMesh)

    initGUI()
    startAnimation(() => {
      if (morphMesh && params.autoPlay) {
        const t = clock.elapsedTime * params.speed
        morphMesh.morphTargetInfluences[0] = (Math.sin(t) + 1) * 0.5
        morphMesh.morphTargetInfluences[1] = (Math.cos(t * 0.7) + 1) * 0.5
        params.influence1 = morphMesh.morphTargetInfluences[0]
        params.influence2 = morphMesh.morphTargetInfluences[1]
      }
      if (morphMesh) {
        morphMesh.morphTargetInfluences[0] = params.influence1
        morphMesh.morphTargetInfluences[1] = params.influence2
      }
    })
  }

  const initGUI = () => {
    gui = new GUI()
    gui.title("变形动画控制")

    const folder = gui.addFolder("Morph Target 控制")
    folder.add(params, "influence1", 0, 1, 0.01).name("挤压变形")
    folder.add(params, "influence2", 0, 1, 0.01).name("拉伸变形")
    folder.add(params, "autoPlay").name("自动循环动画")
    folder.add(params, "speed", 0.1, 3, 0.1).name("动画速度")
    folder.open()

    const infoFolder = gui.addFolder("📖 Morph Targets 说明")
    const info = {
      概念: "通过预定义目标网格形状实现平滑形变",
      应用1: "面部表情动画（喜怒哀乐）",
      应用2: "角色肌肉变形、风吹草动",
      方法: "morphTargetInfluences 控制权重"
    }
    infoFolder.add(info, "概念").name("概念").disable()
    infoFolder.add(info, "应用1").name("应用1").disable()
    infoFolder.add(info, "应用2").name("应用2").disable()
    infoFolder.add(info, "方法").name("方法").disable()
  }

  onMounted(() => initScene())

  onUnmounted(() => {
    gui?.destroy()
    gui = null
    morphMesh = null
    baseDispose()
  })
</script>

<template>
  <PageLayout
    title="🔮 变形动画 Morph"
    description="通过 morph targets 实现几何体的平滑变形效果"
  >
    <template #content>
      <div class="features">
        <h3>Morph Targets 变形动画：</h3>
        <ul>
          <li>🌀 <strong>morphAttributes.position</strong> - 定义目标形状</li>
          <li>🎚️ <strong>morphTargetInfluences</strong> - 控制变形权重</li>
          <li>🎯 挤压变形（横向拉伸，纵向压缩）</li>
          <li>📐 拉伸变形（纵向拉伸，横向收缩）</li>
          <li>🎭 应用场景：面部表情、角色肌肉变形</li>
        </ul>
      </div>
    </template>
    <div
      ref="containerRef"
      class="three-container"
    />
  </PageLayout>
</template>

<style scoped>
  .three-container {
    width: 100%;
    height: 100vh;
    position: relative;
    overflow: hidden;
  }
</style>
