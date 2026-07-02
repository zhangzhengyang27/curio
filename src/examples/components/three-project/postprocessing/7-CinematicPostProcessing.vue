<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
  import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
  import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js"
  import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js"

  // 容器引用
  const containerRef = shallowRef(null)

  // 使用公共的 Three.js 场景逻辑
  const {
    scene,
    camera,
    renderer,
    controls,
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 0, y: 3, z: 8 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 3,
      maxDistance: 20
    },
    showAxesHelper: false,
    showGridHelper: false
  })

  // GUI 和后处理对象引用
  let gui: GUI | null = null
  let composer: EffectComposer | null = null
  let renderPass: RenderPass | null = null
  let bloomPass: UnrealBloomPass | null = null

  // 场景对象引用
  let objects: THREE.Mesh[] = []

  // 色调映射类型选项
  const toneMappingTypes: Record<string, number> = {
    "NoToneMapping": THREE.NoToneMapping,
    "LinearToneMapping": THREE.LinearToneMapping,
    "ReinhardToneMapping": THREE.ReinhardToneMapping,
    "CineonToneMapping": THREE.CineonToneMapping,
    "ACESFilmicToneMapping": THREE.ACESFilmicToneMapping
  }

  // 电影级后处理设置
  const settings = {
    // Bloom 参数
    bloomStrength: 1.0,
    bloomRadius: 0.4,
    bloomThreshold: 0.6,
    bloomEnabled: true,

    // 色调映射参数
    toneMappingType: "ACESFilmicToneMapping",
    exposure: 1.0
  }

  /**
   * 创建精美场景 —— 多个不同材质的几何体 + 精心设计的灯光
   */
  const createSceneObjects = () => {
    if (!scene.value) return

    // 设置场景背景为深色（深蓝黑色调，电影感）
    scene.value.background = new THREE.Color(0x050510)

    // 添加雾效增加层次感
    scene.value.fog = new THREE.FogExp2(0x050510, 0.035)

    // === 1. 中心主体：大型金属环形扭结（高 emissive，用于 Bloom） ===
    const torusKnotGeo = new THREE.TorusKnotGeometry(1, 0.35, 128, 32)
    const torusKnotMat = new THREE.MeshPhysicalMaterial({
      color: 0x4488ff,
      emissive: 0x2244aa,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    })
    const torusKnot = new THREE.Mesh(torusKnotGeo, torusKnotMat)
    torusKnot.position.set(0, 1.5, 0)
    scene.value.add(torusKnot)
    objects.push(torusKnot)

    // === 2. 环绕的小型发光球体（Bloom 效果的主要来源） ===
    const glowColors = [0xff4466, 0x44ff88, 0x4488ff, 0xffaa22, 0xff44ff]
    for (let i = 0; i < 10; i++) {
      const geo = new THREE.SphereGeometry(0.15, 24, 24)
      const mat = new THREE.MeshStandardMaterial({
        color: glowColors[i % glowColors.length],
        emissive: glowColors[i % glowColors.length],
        emissiveIntensity: 3.0,  // 高发光强度，产生明显 Bloom
        roughness: 0,
        metalness: 1
      })
      const sphere = new THREE.Mesh(geo, mat)
      const angle = (i / 10) * Math.PI * 2
      const radius = 2.5
      sphere.position.set(
        Math.cos(angle) * radius,
        1.5 + Math.sin(angle * 2) * 0.5,
        Math.sin(angle) * radius
      )
      scene.value.add(sphere)
      objects.push(sphere)
    }

    // === 3. 底座平台（金属质感） ===
    const platformGeo = new THREE.CylinderGeometry(4, 4.5, 0.3, 64)
    const platformMat = new THREE.MeshPhysicalMaterial({
      color: 0x222233,
      roughness: 0.3,
      metalness: 0.9,
      clearcoat: 0.5
    })
    const platform = new THREE.Mesh(platformGeo, platformMat)
    platform.position.y = -0.5
    scene.value.add(platform)
    objects.push(platform)

    // === 4. 外围装饰：旋转的细线框球体 ===
    const wireGeo = new THREE.IcosahedronGeometry(3.5, 1)
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x223366,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    })
    const wireSphere = new THREE.Mesh(wireGeo, wireMat)
    wireSphere.position.set(0, 1.5, 0)
    scene.value.add(wireSphere)
    objects.push(wireSphere)

    // === 5. 地面（反射效果） ===
    const floorGeo = new THREE.PlaneGeometry(20, 20)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111122,
      roughness: 0.4,
      metalness: 0.8
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.65
    scene.value.add(floor)
    objects.push(floor)

    // === 6. 灯光系统（多光源营造电影感光照） ===
    // 低强度环境光
    const ambientLight = new THREE.AmbientLight(0x111122, 0.3)
    scene.value.add(ambientLight)

    // 主光源（冷白色，从上方照射）
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.6)
    mainLight.position.set(5, 10, 5)
    scene.value.add(mainLight)

    // 暖色侧光
    const warmLight = new THREE.PointLight(0xff6644, 3, 15)
    warmLight.position.set(-4, 3, -3)
    scene.value.add(warmLight)

    // 冷色侧光
    const coolLight = new THREE.PointLight(0x4466ff, 3, 15)
    coolLight.position.set(4, 3, 3)
    scene.value.add(coolLight)

    // 底部紫色补光
    const bottomLight = new THREE.PointLight(0x8844ff, 1, 10)
    bottomLight.position.set(0, -1, 0)
    scene.value.add(bottomLight)

    console.log("电影级后处理场景创建完成")
  }

  /**
   * 创建电影级后处理管线
   * 管线：RenderPass → UnrealBloomPass → OutputPass
   */
  const createComposer = () => {
    if (!renderer.value || !scene.value || !camera.value) return

    // 创建后处理合成器
    composer = new EffectComposer(renderer.value)

    // 第一步：渲染通道 —— 将场景渲染到纹理
    renderPass = new RenderPass(scene.value, camera.value)
    composer.addPass(renderPass)

    // 第二步：Unreal Bloom 通道 —— 辉光效果
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight), // 分辨率
      settings.bloomStrength,  // 辉光强度
      settings.bloomRadius,    // 辉光半径
      settings.bloomThreshold // 辉光阈值（亮度超过此值才产生辉光）
    )
    composer.addPass(bloomPass)

    // 第三步：输出通道 —— 应用色调映射和色彩空间转换
    const outputPass = new OutputPass()
    composer.addPass(outputPass)
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()
    gui.title("🎬 电影级后处理控制")

    // === Bloom 控制文件夹 ===
    const bloomFolder = gui.addFolder("🌟 Bloom 辉光")
    bloomFolder
      .add(settings, "bloomStrength", 0, 3, 0.01)
      .name("强度 (strength)")
      .onChange((value) => {
        if (bloomPass) bloomPass.strength = value
      })

    bloomFolder
      .add(settings, "bloomRadius", 0, 1, 0.01)
      .name("半径 (radius)")
      .onChange((value) => {
        if (bloomPass) bloomPass.radius = value
      })

    bloomFolder
      .add(settings, "bloomThreshold", 0, 2, 0.01)
      .name("阈值 (threshold)")
      .onChange((value) => {
        if (bloomPass) bloomPass.threshold = value
      })

    bloomFolder
      .add(settings, "bloomEnabled")
      .name("启用 Bloom")
      .onChange((enabled) => {
        if (bloomPass) bloomPass.enabled = enabled
      })

    bloomFolder.open()

    // === 色调映射控制文件夹 ===
    const toneFolder = gui.addFolder("🎨 色调映射")

    toneFolder
      .add(settings, "toneMappingType", Object.keys(toneMappingTypes))
      .name("映射类型")
      .onChange((value: string) => {
        if (renderer.value) {
          renderer.value.toneMapping = toneMappingTypes[value] as THREE.ToneMapping
          const currentScene = scene.value
          if (!currentScene) return
          currentScene.traverse((obj) => {
            const mesh = obj as THREE.Mesh
            if (mesh.material) {
              const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
              mat.needsUpdate = true
            }
          })
        }
      })

    toneFolder
      .add(settings, "exposure", 0, 3, 0.01)
      .name("曝光度 (exposure)")
      .onChange((value) => {
        if (renderer.value) {
          renderer.value.toneMappingExposure = value
        }
      })

    toneFolder.open()

    // === 快捷预设 ===
    const presets = {
      "默认电影": () => {
        settings.bloomStrength = 1.0
        settings.bloomRadius = 0.4
        settings.bloomThreshold = 0.6
        settings.bloomEnabled = true
        settings.exposure = 1.0
        settings.toneMappingType = "ACESFilmicToneMapping"
        applySettings()
      },
      "梦幻柔光": () => {
        settings.bloomStrength = 2.0
        settings.bloomRadius = 0.8
        settings.bloomThreshold = 0.3
        settings.bloomEnabled = true
        settings.exposure = 1.3
        settings.toneMappingType = "ACESFilmicToneMapping"
        applySettings()
      },
      "赛博朋克": () => {
        settings.bloomStrength = 1.5
        settings.bloomRadius = 0.3
        settings.bloomThreshold = 0.5
        settings.bloomEnabled = true
        settings.exposure = 1.2
        settings.toneMappingType = "CineonToneMapping"
        applySettings()
      },
      "写实风格": () => {
        settings.bloomStrength = 0.3
        settings.bloomRadius = 0.2
        settings.bloomThreshold = 0.9
        settings.bloomEnabled = true
        settings.exposure = 0.9
        settings.toneMappingType = "LinearToneMapping"
        applySettings()
      },
      "无后处理": () => {
        settings.bloomStrength = 0
        settings.bloomRadius = 0
        settings.bloomThreshold = 1
        settings.bloomEnabled = false
        settings.exposure = 1.0
        settings.toneMappingType = "NoToneMapping"
        applySettings()
      }
    }

    // 应用当前设置到渲染器和 bloom
    const applySettings = () => {
      if (bloomPass) {
        bloomPass.strength = settings.bloomStrength
        bloomPass.radius = settings.bloomRadius
        bloomPass.threshold = settings.bloomThreshold
        bloomPass.enabled = settings.bloomEnabled
      }
      if (renderer.value) {
        renderer.value.toneMapping = toneMappingTypes[settings.toneMappingType] as THREE.ToneMapping
        renderer.value.toneMappingExposure = settings.exposure
        const currentScene = scene.value
        if (currentScene) {
          currentScene.traverse((obj) => {
            const mesh = obj as THREE.Mesh
            if (mesh.material) {
              const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
              mat.needsUpdate = true
            }
          })
        }
      }
      // 更新 GUI 显示
      gui?.controllersRecursive().forEach((ctrl) => ctrl.updateDisplay())
    }

    const presetFolder = gui.addFolder("🎬 快捷预设")
    for (const [name, fn] of Object.entries(presets)) {
      const obj: Record<string, any> = {}
      obj[name] = fn
      presetFolder.add(obj, name).name(name)
    }
    presetFolder.open()

    console.log("GUI 创建完成")
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理后处理合成器
    if (composer) {
      composer.dispose()
      composer = null
    }
    renderPass = null
    bloomPass = null

    // 清理 GUI
    if (gui) {
      gui.destroy()
      gui = null
    }

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    if (!renderer.value) return

    // 配置渲染器
    renderer.value.outputColorSpace = THREE.SRGBColorSpace
    renderer.value.toneMapping = THREE.ACESFilmicToneMapping
    renderer.value.toneMappingExposure = 1.0

    // 创建场景物体
    createSceneObjects()

    // 创建后处理管线
    createComposer()

    // 初始化 GUI
    initGUI()

    // 启动动画循环
    startAnimation(() => {
      const time = performance.now() * 0.001

      // 主体环形扭结缓慢旋转
      if (objects[0]) {
        objects[0].rotation.y = time * 0.3
        objects[0].rotation.x = Math.sin(time * 0.2) * 0.2
      }

      // 发光球体环绕运动
      for (let i = 1; i <= 10; i++) {
        const sphere = objects[i]
        if (!sphere) continue
        const baseAngle = ((i - 1) / 10) * Math.PI * 2
        const angle = baseAngle + time * 0.5
        const radius = 2.5
        sphere.position.x = Math.cos(angle) * radius
        sphere.position.z = Math.sin(angle) * radius
        sphere.position.y = 1.5 + Math.sin(time * 2 + baseAngle * 3) * 0.5
      }

      // 线框球体反向缓慢旋转
      if (objects[11]) {
        objects[11].rotation.y = -time * 0.1
        objects[11].rotation.x = time * 0.05
      }

      // 使用后处理合成器渲染
      if (composer) {
        composer.render()
      }
    })
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🎬 电影级后处理组合"
    description="Bloom 辉光 + 色调映射 + 多光源 —— 综合后处理电影级效果"
  >
    <!-- 内容区域 -->
    <template #content>
      <div class="features">
        <h3>✨ 功能特性</h3>
        <ul>
          <li>🌟 <strong>Unreal Bloom</strong> - 辉光后处理效果</li>
          <li>🎨 <strong>5 种色调映射</strong> - NoToneMapping / Linear / Reinhard / Cineon / ACES</li>
          <li>☀️ <strong>Exposure 调节</strong> - 曝光度实时调整</li>
          <li>🎛️ <strong>Bloom 参数</strong> - strength / radius / threshold 实时控制</li>
          <li>🎬 <strong>快捷预设</strong> - 默认电影 / 梦幻柔光 / 赛博朋克 / 写实风格</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📖 后处理管线</h3>
        <ul>
          <li>1️⃣ <code>RenderPass</code> - 将场景渲染到纹理</li>
          <li>2️⃣ <code>UnrealBloomPass</code> - Unreal 辉光效果</li>
          <li>3️⃣ <code>OutputPass</code> - 色调映射 + 色彩空间输出</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔧 Bloom 参数说明</h3>
        <ul>
          <li><strong>strength</strong> - 辉光强度（0~3），值越大辉光越明显</li>
          <li><strong>radius</strong> - 辉光扩散半径（0~1），值越大扩散越广</li>
          <li><strong>threshold</strong> - 辉光阈值（0~2），只有亮度超过此值才产生辉光</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>const bloomPass = new UnrealBloomPass(</code></p>
        <p><code>&nbsp;&nbsp;new THREE.Vector2(w, h),</code></p>
        <p><code>&nbsp;&nbsp;strength, radius, threshold</code></p>
        <p><code>)</code></p>
        <p><code>composer.addPass(renderPass)</code></p>
        <p><code>composer.addPass(bloomPass)</code></p>
        <p><code>composer.addPass(outputPass)</code></p>
      </div>

      <div class="controls-tip">
        <p>🎮 操作提示</p>
        <ul>
          <li>🖱️ 左键拖动：旋转视角</li>
          <li>🖱️ 滚轮：缩放</li>
          <li>🎚️ GUI 面板控制所有后处理参数</li>
          <li>💡 尝试不同快捷预设查看风格差异</li>
          <li>💡 调低 threshold 可以让更多物体产生辉光</li>
        </ul>
      </div>
    </template>
    <!-- Three.js 容器 -->
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

  .features,
  .info-section,
  .code-tip,
  .controls-tip {
    margin-bottom: 16px;
  }

  .features h3,
  .info-section h3,
  .code-tip p:first-child,
  .controls-tip p:first-child {
    margin-bottom: 8px;
    color: rgba(255, 255, 255, 0.9);
  }

  ul {
    margin: 0;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
    line-height: 1.6;
  }
</style>
