<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  const containerRef = shallowRef(null)

  const { scene, startAnimation, onSceneReady, dispose: baseDispose } =
    useThreeScene(containerRef, {
      cameraPosition: { x: 3, y: 2, z: 4 },
      enableControls: true,
      controlsConfig: { enableDamping: true, dampingFactor: 0.05 }
    })

  let gui!: GUI, hdrTexture: THREE.Texture | null = null, originalEnvMap: THREE.Texture | null = null

  const params = {
    bgType: "solid",
    solidColor: "#1a1a2e",
    gradientTop: "#0f0c29",
    gradientBottom: "#302b63"
  }

  const createScene = () => {
    if (!scene.value) return

    // 添加物体（金属球 + 立方体用于展示环境反射）
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 64, 64),
      new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.9,
        roughness: 0.1
      })
    )
    sphere.position.set(-1, 0.5, 0)
    scene.value.add(sphere)

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.2, 1.2),
      new THREE.MeshStandardMaterial({
        color: 0x3498db,
        metalness: 0.5,
        roughness: 0.3
      })
    )
    box.position.set(1.5, 0.6, 0)
    scene.value.add(box)

    const torus = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.5, 0.18, 100, 16),
      new THREE.MeshStandardMaterial({ color: 0xe74c3c, metalness: 0.6, roughness: 0.2 })
    )
    torus.position.set(0, 0.8, -1.5)
    scene.value.add(torus)

    // 灯光
    scene.value.add(new THREE.AmbientLight(0xffffff, 0.5))
    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(5, 10, 7)
    scene.value.add(dirLight)
  }

  const setSolidBackground = () => {
    if (!scene.value) return
    scene.value.background = new THREE.Color(params.solidColor)
    // 清除环境贴图
    scene.value.environment = originalEnvMap
  }

  const setGradientBackground = () => {
    if (!scene.value) return
    const canvas = document.createElement("canvas")
    canvas.width = 2
    canvas.height = 512
    const ctx = canvas.getContext("2d")!
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, params.gradientTop)
    gradient.addColorStop(1, params.gradientBottom)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const texture = new THREE.CanvasTexture(canvas)
    scene.value.background = texture
    scene.value.environment = originalEnvMap
  }

  const setHDRBackground = () => {
    if (!scene.value) return
    const loader = new RGBELoader()
    loader.load("/three-project/texture/050.hdr", (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping
      hdrTexture = texture
      if (!scene.value) return
      scene.value.background = texture
      scene.value.environment = texture
    }, undefined, (err) => {
      console.warn("HDR 加载失败，使用纯色替代:", err)
      setSolidBackground()
    })
  }

  const switchBackground = () => {
    switch (params.bgType) {
      case "solid": setSolidBackground(); break
      case "gradient": setGradientBackground(); break
      case "hdr": setHDRBackground(); break
    }
  }

  const animateCallback = () => {
    if (!scene.value) return
    scene.value.children.forEach(child => {
      if (child.isMesh) {
        child.rotation.y += 0.003
      }
    })
  }

  const initGUI = () => {
    gui = new GUI()
    gui.add(params, "bgType", ["solid", "gradient", "hdr"]).name("背景类型").onChange(switchBackground)
    gui.addColor(params, "solidColor").name("纯色颜色").onChange(() => {
      if (params.bgType === "solid") setSolidBackground()
    })
    gui.addColor(params, "gradientTop").name("渐变顶部").onChange(() => {
      if (params.bgType === "gradient") setGradientBackground()
    })
    gui.addColor(params, "gradientBottom").name("渐变底部").onChange(() => {
      if (params.bgType === "gradient") setGradientBackground()
    })

    // 保存初始环境贴图
    if (scene.value) originalEnvMap = scene.value.environment

    // 初始背景
    setSolidBackground()
  }

  onSceneReady(() => {
    createScene()
    initGUI()
    startAnimation(animateCallback)
  })

  onUnmounted(() => {
    if (hdrTexture) hdrTexture.dispose()
    gui?.destroy()
    baseDispose()
  })
</script>

<template>
  <PageLayout
    title="🎨 场景背景"
    description="纯色 / Canvas 渐变 / HDR 环境贴图多种背景切换"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🎨 纯色背景（THREE.Color）</li>
          <li>🌈 Canvas 渐变纹理背景</li>
          <li>🌅 HDR 环境贴图背景（/texture/050.hdr）</li>
          <li>🔩 高金属度球体展示环境反射效果</li>
        </ul>
      </div>
    </template>
    <div ref="containerRef" />
  </PageLayout>
</template>
