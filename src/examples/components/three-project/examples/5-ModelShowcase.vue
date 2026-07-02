<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
  import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
  import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
  import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
  import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js"
  import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  const containerRef = shallowRef<HTMLDivElement | null>(null)

  // 场景对象引用
  let gui: GUI | null = null
  let clock: THREE.Clock | null = null
  let animationId = 0
  let composer: EffectComposer | null = null
  let bloomPass: UnrealBloomPass | null = null
  let currentModel: THREE.Group | null = null
  let gltfLoader: GLTFLoader | null = null
  let rgbeLoader: RGBELoader | null = null

  // 可用模型列表
  const availableModels = [
    { name: "小黄鸭", path: "/three-project/model/Duck.glb" },
    { name: "飞灯", path: "/three-project/model/flyLight.glb" },
    { name: "月球", path: "/three-project/model/moon.glb" },
    { name: "鱼缸", path: "/three-project/model/yugang.glb" },
    { name: "新年场景", path: "/three-project/model/newyears_min.glb" },
    { name: "城市", path: "/three-project/model/city.glb" }
  ]

  // 设置
  const settings = {
    autoRotate: true,
    rotateSpeed: 1.0,
    bloomEnabled: false,
    bloomStrength: 0.5,
    bloomRadius: 0.4,
    bloomThreshold: 0.6,
    backgroundType: "dark",
    currentModelIndex: 0,
    envMapIntensity: 1.0
  }

  const {
    scene,
    camera,
    renderer,
    controls,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 3, y: 2, z: 5 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 1,
      maxDistance: 30
    },
    showAxesHelper: false
  })

  /**
   * 设置背景
   */
  const setBackground = (type: string) => {
    if (!scene.value) return

    switch (type) {
      case "white":
        scene.value.background = new THREE.Color(0xffffff)
        break
      case "dark":
        scene.value.background = new THREE.Color(0x1a1a2e)
        break
      case "gray":
        scene.value.background = new THREE.Color(0x808080)
        break
      case "gradient": {
        const canvas = document.createElement("canvas")
        canvas.width = 2
        canvas.height = 512
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          scene.value.background = new THREE.Color(0x1a1a2e)
          break
        }
        const gradient = ctx.createLinearGradient(0, 0, 0, 512)
        gradient.addColorStop(0, "#0f0c29")
        gradient.addColorStop(0.5, "#302b63")
        gradient.addColorStop(1, "#24243e")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 2, 512)
        const texture = new THREE.CanvasTexture(canvas)
        scene.value.background = texture
        break
      }
      default:
        scene.value.background = new THREE.Color(0x1a1a2e)
    }
  }

  /**
   * 加载 HDR 环境贴图
   */
  const loadEnvironment = () => {
    rgbeLoader = new RGBELoader()
    rgbeLoader.load(
      "/three-project/texture/050.hdr",
      (texture) => {
        if (!scene.value) return
        texture.mapping = THREE.EquirectangularReflectionMapping
        scene.value.environment = texture
        if (settings.backgroundType === "hdr") {
          scene.value.background = texture
        }
      },
      undefined,
      (err) => {
        console.warn("HDR 加载失败，使用简单光照", err)
        addFallbackLights()
      }
    )
  }

  /**
   * HDR 加载失败时的后备光源
   */
  const addFallbackLights = () => {
    if (!scene.value) return
    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.value.add(ambient)
    const dir = new THREE.DirectionalLight(0xffffff, 0.8)
    dir.position.set(5, 8, 5)
    scene.value.add(dir)
  }

  /**
   * 加载 GLB 模型
   */
  const loadModel = (index: number) => {
    if (!scene.value) return

    // 移除当前模型
    if (currentModel) {
      scene.value.remove(currentModel)
      currentModel.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose())
            } else {
              child.material.dispose()
            }
          }
        }
      })
      currentModel = null
    }

    const modelConfig = availableModels[index]
    if (!modelConfig) return

    gltfLoader = new GLTFLoader()
    gltfLoader.load(
      modelConfig.path,
      (gltf) => {
        if (!scene.value) return

        currentModel = gltf.scene

        // 自适应缩放：计算包围盒并缩放到合理大小
        const box = new THREE.Box3().setFromObject(currentModel)
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const targetSize = 3
        const scale = targetSize / Math.max(maxDim, 0.001)
        currentModel.scale.setScalar(scale)

        // 重新计算并居中
        const newBox = new THREE.Box3().setFromObject(currentModel)
        const center = newBox.getCenter(new THREE.Vector3())
        currentModel.position.sub(center)

        scene.value.add(currentModel)

        // 调整相机位置
        if (!camera.value || !controls.value) return
        const camDist = targetSize * 2
        camera.value.position.set(camDist, camDist * 0.6, camDist)
        camera.value.lookAt(0, 0, 0)
        controls.value.target.set(0, 0, 0)
        controls.value.update()
      },
      undefined,
      (err) => {
        console.error("模型加载失败:", err)
      }
    )
  }

  /**
   * 初始化后处理
   */
  const initPostProcessing = () => {
    if (!renderer.value || !scene.value || !camera.value) return

    composer = new EffectComposer(renderer.value)
    const renderPass = new RenderPass(scene.value, camera.value)
    composer.addPass(renderPass)

    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      settings.bloomStrength,
      settings.bloomRadius,
      settings.bloomThreshold
    )
    composer.addPass(bloomPass)

    const outputPass = new OutputPass()
    composer.addPass(outputPass)
  }

  /**
   * 初始化 GUI
   */
  const initGUI = () => {
    gui = new GUI()
    gui.title("模型展示控制")

    // 模型切换
    const modelFolder = gui.addFolder("📦 模型选择")
    const _modelNames = availableModels.map((m) => m.name)
    modelFolder
      .add(settings, "currentModelIndex", 0, availableModels.length - 1, 1)
      .name("模型")
      .onChange((val) => {
        loadModel(val)
      })
    modelFolder.open()

    // 旋转控制
    const rotateFolder = gui.addFolder("🔄 旋转")
    rotateFolder.add(settings, "autoRotate").name("自动旋转")
    rotateFolder
      .add(settings, "rotateSpeed", 0, 5, 0.1)
      .name("旋转速度")
    rotateFolder.open()

    // Bloom 控制
    const bloomFolder = gui.addFolder("✨ Bloom 后处理")
    bloomFolder.add(settings, "bloomEnabled").name("启用 Bloom").onChange((val) => {
      settings.bloomEnabled = val
    })
    bloomFolder
      .add(settings, "bloomStrength", 0, 3, 0.1)
      .name("强度")
      .onChange((val) => {
        if (bloomPass) bloomPass.strength = val
      })
    bloomFolder
      .add(settings, "bloomRadius", 0, 1, 0.05)
      .name("半径")
      .onChange((val) => {
        if (bloomPass) bloomPass.radius = val
      })
    bloomFolder
      .add(settings, "bloomThreshold", 0, 1, 0.05)
      .name("阈值")
      .onChange((val) => {
        if (bloomPass) bloomPass.threshold = val
      })

    // 背景控制
    const bgFolder = gui.addFolder("🎨 背景")
    bgFolder
      .add(settings, "backgroundType", ["white", "dark", "gray", "gradient"])
      .name("背景类型")
      .onChange((val) => setBackground(val))
  }

  /**
   * 自定义渲染循环
   */
  const customRender = () => {
    animationId = requestAnimationFrame(customRender)

    if (!scene.value || !camera.value || !clock) return

    const delta = clock.getDelta()

    // 自动旋转
    if (currentModel && settings.autoRotate) {
      currentModel.rotation.y += delta * settings.rotateSpeed
    }

    if (controls.value) controls.value.update()

    // 使用后处理或普通渲染
    if (composer && settings.bloomEnabled) {
      composer.render()
    } else if (renderer.value) {
      renderer.value.render(scene.value, camera.value)
    }
  }

  /**
   * 初始化场景内容
   */
  const initContent = () => {
    if (!scene.value) return

    clock = new THREE.Clock()

    // 设置初始背景
    setBackground(settings.backgroundType)

    // 加载环境贴图
    loadEnvironment()

    // 加载第一个模型
    loadModel(0)

    // 初始化后处理
    initPostProcessing()

    // 初始化 GUI
    initGUI()

    // 渲染器设置
    if (renderer.value) {
      renderer.value.shadowMap.enabled = true
      renderer.value.toneMapping = THREE.ACESFilmicToneMapping
      renderer.value.toneMappingExposure = 1.0
      renderer.value.outputColorSpace = THREE.SRGBColorSpace
    }
  }

  /**
   * 扩展清理
   */
  const extendedDispose = () => {
    if (animationId) cancelAnimationFrame(animationId)

    // 清理模型
    if (currentModel && scene.value) {
      scene.value.remove(currentModel)
      currentModel.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose())
            } else {
              child.material.dispose()
            }
          }
        }
      })
    }

    // 清理后处理
    if (composer) {
      composer.renderToScreen = null as any
      composer.dispose()
    }

    // 清理环境贴图
    if (scene.value) {
      if (scene.value.environment) scene.value.environment.dispose()
      if (
        scene.value.background &&
        scene.value.background instanceof THREE.Texture
      ) {
        scene.value.background.dispose()
      }
    }

    gui?.destroy()

    if (animationId) cancelAnimationFrame(animationId)

    composer = null
    bloomPass = null
    currentModel = null
    gui = null
    clock = null
    gltfLoader = null
    rgbeLoader = null

    baseDispose()
  }

  onSceneReady(() => {
    initContent()
    customRender()
  })

  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🖼️ 模型展示框架"
    description="GLB 模型加载展示 - 环境贴图、自动旋转、Bloom 后处理、背景切换"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>📦 <strong>GLTFLoader</strong> - 加载 GLB/GLTF 模型</li>
          <li>🌍 <strong>RGBELoader</strong> - HDR 环境贴图提供真实光照</li>
          <li>🔄 <strong>自动旋转</strong> - 模型自动绕 Y 轴旋转</li>
          <li>✨ <strong>Bloom 后处理</strong> - UnrealBloomPass 发光效果</li>
          <li>🎨 <strong>背景切换</strong> - 白色/暗色/灰色/渐变背景</li>
          <li>🔀 <strong>多模型切换</strong> - 支持项目内多个 GLB 模型</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 关键技术点：</h3>
        <ul>
          <li><strong>GLTFLoader</strong>：Three.js 官方 GLTF 模型加载器</li>
          <li><strong>RGBELoader</strong>：HDR 环境贴图加载，提供 PBR 光照</li>
          <li><strong>EquirectangularReflectionMapping</strong>：等距柱状投影映射</li>
          <li><strong>EffectComposer</strong>：后处理管线</li>
          <li><strong>UnrealBloomPass</strong>：泛光效果</li>
          <li><strong>OutputPass</strong>：色彩空间转换输出</li>
          <li><strong>ACESFilmicToneMapping</strong>：电影级色调映射</li>
        </ul>
      </div>

      <div class="controls-tip">
        <p>🎮 操作方式：</p>
        <ul>
          <li>🔮 鼠标拖拽 → 旋转视角</li>
          <li>🔍 滚轮 → 缩放</li>
          <li>🎛️ GUI → 切换模型、调整参数</li>
        </ul>
      </div>
    </template>

    <div ref="containerRef" />
  </PageLayout>
</template>

<style scoped>
  code {
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 6px;
    border-radius: 3px;
    font-family: "Courier New", monospace;
    font-size: 11px;
    color: #42b983;
  }
</style>
