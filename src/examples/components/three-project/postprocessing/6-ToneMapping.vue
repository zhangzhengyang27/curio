<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
  import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
  import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js"

  // 容器引用
  const containerRef = shallowRef(null)

  // 使用公共的 Three.js 场景逻辑
  const {
    scene,
    camera,
    renderer,
    controls: _controls,
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

  // 场景对象引用
  let brightSpheres: THREE.Mesh[] = []  // 高亮度物体
  let darkSpheres: THREE.Mesh[] = []    // 暗部物体
  let floorMesh: THREE.Mesh | null = null

  // 色调映射设置
  const toneMappingSettings = {
    type: "ACESFilmicToneMapping",
    exposure: 1.0
  }

  // 色调映射类型选项
  const toneMappingTypes: Record<string, number> = {
    "NoToneMapping": THREE.NoToneMapping,
    "LinearToneMapping": THREE.LinearToneMapping,
    "ReinhardToneMapping": THREE.ReinhardToneMapping,
    "CineonToneMapping": THREE.CineonToneMapping,
    "ACESFilmicToneMapping": THREE.ACESFilmicToneMapping
  }

  /**
   * 创建场景 —— 包含高亮度物体和暗部物体，方便对比色调映射效果
   */
  const createSceneObjects = () => {
    if (!scene.value || !renderer.value) return

    // 设置场景背景为深色
    scene.value.background = new THREE.Color(0x0a0a0a)

    // === 1. 高亮度物体组（高 emissive 强度的发光球体） ===
    const brightColors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff]
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.SphereGeometry(0.4, 32, 32)
      const mat = new THREE.MeshStandardMaterial({
        color: brightColors[i],
        emissive: brightColors[i],
        emissiveIntensity: 3,  // 高发光强度
        roughness: 0.2,
        metalness: 0.8
      })
      const sphere = new THREE.Mesh(geo, mat)
      const angle = (i / 6) * Math.PI * 2
      sphere.position.set(
        Math.cos(angle) * 2.5,
        1,
        Math.sin(angle) * 2.5
      )
      scene.value.add(sphere)
      brightSpheres.push(sphere)
    }

    // 中心大发光球体（极亮）
    const centerGeo = new THREE.SphereGeometry(0.6, 32, 32)
    const centerMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 5,  // 极高发光强度
      roughness: 0,
      metalness: 1
    })
    const centerSphere = new THREE.Mesh(centerGeo, centerMat)
    centerSphere.position.set(0, 1.5, 0)
    scene.value.add(centerSphere)
    brightSpheres.push(centerSphere)

    // === 2. 暗部物体组（低亮度球体） ===
    const darkColors = [0x1a1a2e, 0x16213e, 0x0f3460, 0x1a1a1a, 0x2d132c, 0x0c0c0c]
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.SphereGeometry(0.3, 32, 32)
      const mat = new THREE.MeshStandardMaterial({
        color: darkColors[i],
        emissive: darkColors[i],
        emissiveIntensity: 0.05,  // 极低发光
        roughness: 0.9,
        metalness: 0.1
      })
      const sphere = new THREE.Mesh(geo, mat)
      const angle = (i / 6) * Math.PI * 2 + Math.PI / 6
      sphere.position.set(
        Math.cos(angle) * 4,
        0.3,
        Math.sin(angle) * 4
      )
      scene.value.add(sphere)
      darkSpheres.push(sphere)
    }

    // === 3. 地面（接收光照的平面） ===
    const floorGeo = new THREE.PlaneGeometry(12, 12)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2
    })
    floorMesh = new THREE.Mesh(floorGeo, floorMat)
    floorMesh.rotation.x = -Math.PI / 2
    floorMesh.position.y = -0.5
    scene.value.add(floorMesh)

    // === 4. 灯光设置 ===
    // 环境光（低强度，保留暗部细节）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15)
    scene.value.add(ambientLight)

    // 主平行光
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(5, 10, 5)
    scene.value.add(dirLight)

    // 暖色点光源（模拟环境反射）
    const warmLight = new THREE.PointLight(0xff8844, 2, 10)
    warmLight.position.set(-3, 3, -2)
    scene.value.add(warmLight)

    // 冷色点光源
    const coolLight = new THREE.PointLight(0x4488ff, 2, 10)
    coolLight.position.set(3, 3, 2)
    scene.value.add(coolLight)

    console.log("色调映射场景创建完成")
  }

  /**
   * 创建后处理管线
   * 管线：RenderPass → OutputPass
   * OutputPass 确保色调映射正确应用到后处理管线
   */
  const createComposer = () => {
    if (!renderer.value || !scene.value || !camera.value) return

    composer = new EffectComposer(renderer.value)

    // 渲染通道
    const renderPass = new RenderPass(scene.value, camera.value)
    composer.addPass(renderPass)

    // 输出通道 —— 确保 toneMapping 和 colorSpace 被正确应用
    const outputPass = new OutputPass()
    composer.addPass(outputPass)
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()
    gui.title("色调映射控制")

    // 色调映射类型选择
    gui
      .add(toneMappingSettings, "type", Object.keys(toneMappingTypes))
      .name("色调映射类型")
      .onChange((value: string) => {
        if (renderer.value) {
          renderer.value.toneMapping = toneMappingTypes[value] as THREE.ToneMapping
          // 更新所有材质以反映新的色调映射
          const currentScene = scene.value
          if (!currentScene) return
          currentScene.traverse((obj) => {
            const mesh = obj as THREE.Mesh
            if (mesh.material) {
              const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
              if (mat.toneMapped !== undefined) {
                mat.needsUpdate = true
              }
            }
          })
        }
      })

    // Exposure 调节
    gui
      .add(toneMappingSettings, "exposure", 0, 3, 0.01)
      .name("曝光度 (exposure)")
      .onChange((value) => {
        if (renderer.value) {
          renderer.value.toneMappingExposure = value
        }
      })

    // 色调映射说明文件夹
    const infoFolder = gui.addFolder("📖 色调映射说明")
    const infoData: Record<string, string> = {
      "NoToneMapping": "无色调映射，HDR 值直接输出",
      "LinearToneMapping": "线性映射，简单的 HDR→LDR 转换",
      "ReinhardToneMapping": "Reinhard 映射，保留更多暗部细节",
      "CineonToneMapping": "电影胶片映射，高对比度电影感",
      "ACESFilmicToneMapping": "ACES 电影工业标准，色彩最好"
    }
    for (const [key, val] of Object.entries(infoData)) {
      const obj: Record<string, string> = {}
      obj[key] = val
      infoFolder.add(obj, key).name(key).listen().disable()
    }
    infoFolder.close()

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

    // 配置渲染器 —— 使用线性色彩空间以支持 HDR 渲染
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
      // 高亮球体轻微上下浮动
      const time = performance.now() * 0.001
      brightSpheres.forEach((sphere, i) => {
        if (i < 6) {
          sphere.position.y = 1 + Math.sin(time * 1.5 + i * 0.8) * 0.3
        }
      })

      // 暗部球体缓慢旋转
      darkSpheres.forEach((sphere, i) => {
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 6 + time * 0.2
        sphere.position.x = Math.cos(angle) * 4
        sphere.position.z = Math.sin(angle) * 4
      })

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
    title="🎨 后处理色调映射"
    description="对比 NoToneMapping / Linear / Reinhard / Cineon / ACES Filmic 五种色调映射效果"
  >
    <!-- 内容区域 -->
    <template #content>
      <div class="features">
        <h3>✨ 功能特性</h3>
        <ul>
          <li>🔴 <strong>高亮度物体</strong> - 高 emissive 强度球体（容易过曝）</li>
          <li>⚫ <strong>暗部物体</strong> - 低亮度球体（保留暗部细节测试）</li>
          <li>🎨 <strong>5 种色调映射</strong> - 实时切换对比</li>
          <li>☀️ <strong>Exposure 调节</strong> - 曝光度实时调整</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📖 什么是色调映射（Tone Mapping）？</h3>
        <ul>
          <li>将 HDR（高动态范围）颜色映射到 LDR（低动态范围）显示</li>
          <li>不同的映射算法产生不同的视觉效果</li>
          <li><strong>ACES Filmic</strong> 是电影工业标准，效果最自然</li>
          <li><strong>Reinhard</strong> 在暗部细节保留上表现更好</li>
          <li><strong>Cineon</strong> 提供类似电影胶片的高对比度效果</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔧 管线结构</h3>
        <ul>
          <li>1️⃣ <code>RenderPass</code> - 场景渲染</li>
          <li>2️⃣ <code>OutputPass</code> - 应用 toneMapping + colorSpace</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>renderer.toneMapping = THREE.ACESFilmicToneMapping</code></p>
        <p><code>renderer.toneMappingExposure = 1.0</code></p>
      </div>

      <div class="controls-tip">
        <p>🎮 操作提示</p>
        <ul>
          <li>🖱️ 左键拖动：旋转视角</li>
          <li>🖱️ 滚轮：缩放</li>
          <li>🎚️ GUI 切换色调映射类型 + 调节曝光度</li>
          <li>💡 建议调高 exposure 观察高亮球体的过曝差异</li>
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
