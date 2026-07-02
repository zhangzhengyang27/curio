<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
  import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
  import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js"
  import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js"
  import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js"

  // 容器引用
  const containerRef = shallowRef<HTMLDivElement | null>(null)

  // 使用公共的 Three.js 场景逻辑
  const {
    scene,
    camera,
    renderer,
    controls,
    startAnimation,
    onSceneReady,
    handleResize,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 3, y: 2, z: 5 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 2,
      maxDistance: 15
    },
    showAxesHelper: false,
    showGridHelper: true
  })

  // GUI 和后处理对象引用
  let gui: GUI | null = null
  let composer: EffectComposer | null = null
  let renderPass: RenderPass | null = null
  let fxaaPass: ShaderPass | null = null

  // 场景对象引用
  let wireframeSphere: THREE.Mesh | null = null
  let wireframeTorus: THREE.Mesh | null = null
  let cubeGroup: THREE.Group | null = null

  // 抗锯齿模式配置
  const settings = {
    mode: "fxaa"
  }

  /**
   * 创建场景物体 —— 由线框和细小几何体组成，让锯齿明显可见
   */
  const createSceneObjects = () => {
    if (!scene.value) return

    // === 1. 线框球体（二十面体，低细分让边缘明显） ===
    const sphereGeo = new THREE.IcosahedronGeometry(1.2, 1)
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x42b983,
      wireframe: true
    })
    wireframeSphere = new THREE.Mesh(sphereGeo, wireframeMat)
    wireframeSphere.position.set(0, 0.5, 0)
    scene.value.add(wireframeSphere)

    // === 2. 线框圆环（细圆环让锯齿更明显） ===
    const torusGeo = new THREE.TorusGeometry(1, 0.02, 8, 64)
    const torusMat = new THREE.MeshBasicMaterial({
      color: 0xff6b6b,
      wireframe: true
    })
    wireframeTorus = new THREE.Mesh(torusGeo, torusMat)
    wireframeTorus.position.set(0, 0.5, 0)
    wireframeTorus.rotation.x = Math.PI / 2
    scene.value.add(wireframeTorus)

    // === 3. 小方块群组（不同颜色的细小方块） ===
    cubeGroup = new THREE.Group()
    const cubeGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15)
    const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf7dc6f, 0xbb8fce]

    for (let i = 0; i < 60; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        roughness: 0.3,
        metalness: 0.6
      })
      const cube = new THREE.Mesh(cubeGeo, mat)
      // 在球面上随机分布
      const phi = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      const r = 1.8 + Math.random() * 0.5
      cube.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta) + 0.5,
        r * Math.cos(phi)
      )
      cube.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )
      cubeGroup.add(cube)
    }
    scene.value.add(cubeGroup)

    // === 4. 网格地面（线框模式） ===
    const gridGeo = new THREE.PlaneGeometry(10, 10, 20, 20)
    const gridMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    })
    const gridFloor = new THREE.Mesh(gridGeo, gridMat)
    gridFloor.rotation.x = -Math.PI / 2
    gridFloor.position.y = -1
    scene.value.add(gridFloor)

    // === 灯光设置 ===
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.value.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    directionalLight.position.set(5, 8, 5)
    scene.value.add(directionalLight)

    const pointLight = new THREE.PointLight(0x42b983, 1, 10)
    pointLight.position.set(-2, 3, 2)
    scene.value.add(pointLight)

    console.log("FXAA 场景物体创建完成")
  }

  /**
   * 创建 FXAA 后处理管线
   * 管线：RenderPass → FXAAShader → OutputPass
   */
  const createFXAAComposer = () => {
    if (!renderer.value || !scene.value || !camera.value) return

    // 创建后处理合成器
    composer = new EffectComposer(renderer.value)

    // 第一步：渲染通道 —— 将场景渲染到纹理
    renderPass = new RenderPass(scene.value, camera.value)
    composer.addPass(renderPass)

    // 第二步：FXAA 抗锯齿着色器通道
    fxaaPass = new ShaderPass(FXAAShader)
    // FXAAShader 需要设置分辨率 uniform（注意是 1/宽, 1/高）
    fxaaPass.uniforms["resolution"].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    )
    composer.addPass(fxaaPass)

    // 第三步：输出通道 —— 确保正确的色彩空间输出
    const outputPass = new OutputPass()
    composer.addPass(outputPass)
  }

  /**
   * 创建无 FXAA 的基础渲染管线
   * 管线：RenderPass → OutputPass
   */
  const createBaseComposer = () => {
    if (!renderer.value || !scene.value || !camera.value) return

    composer = new EffectComposer(renderer.value)

    const pass = new RenderPass(scene.value, camera.value)
    composer.addPass(pass)

    const outputPass = new OutputPass()
    composer.addPass(outputPass)
  }

  /**
   * 重建渲染器（切换抗锯齿模式时需要）
   * @param {boolean} antialias - 是否启用渲染器内置抗锯齿
   */
  const rebuildRenderer = (antialias: boolean) => {
    if (!containerRef.value || !camera.value || !renderer.value) return

    // 移除旧的 DOM 元素
    const oldDom = renderer.value.domElement
    if (oldDom.parentNode) {
      oldDom.parentNode.removeChild(oldDom)
    }
    renderer.value.dispose()

    // 创建新的渲染器
    const newRenderer = new THREE.WebGLRenderer({ antialias })
    newRenderer.setSize(window.innerWidth, window.innerHeight)
    newRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    newRenderer.outputColorSpace = THREE.SRGBColorSpace
    containerRef.value.appendChild(newRenderer.domElement)

    // 更新 renderer 引用（shallowRef 赋值）
    renderer.value = newRenderer

    // 重新绑定轨道控制器
    if (controls.value) {
      controls.value.dispose()
    }
    const newControls = new OrbitControls(camera.value, newRenderer.domElement)
    newControls.enableDamping = true
    newControls.dampingFactor = 0.05
    newControls.minDistance = 2
    newControls.maxDistance = 15
    // 更新 controls 引用
    controls.value = newControls
  }

  /**
   * 切换抗锯齿模式
   * - 'none': 无抗锯齿（关闭 MSAA，不加 FXAA）
   * - 'msaa': 渲染器内置 MSAA（不加 FXAA）
   * - 'fxaa': 关闭 MSAA，使用后处理 FXAA
   */
  const switchMode = (mode: string) => {
    // 清理旧的 composer
    if (composer) {
      composer.dispose()
      composer = null
    }
    renderPass = null
    fxaaPass = null

    switch (mode) {
      case "none":
        // 无抗锯齿：重建渲染器（关闭 antialias），不加 FXAA
        rebuildRenderer(false)
        createBaseComposer()
        break

      case "msaa":
        // MSAA：重建渲染器（开启 antialias），不加 FXAA
        rebuildRenderer(true)
        createBaseComposer()
        break

      case "fxaa":
        // FXAA：重建渲染器（关闭 antialias），加 FXAA 后处理
        rebuildRenderer(false)
        createFXAAComposer()
        break
    }

    console.log("已切换到抗锯齿模式:", mode)
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()
    gui.title("FXAA 抗锯齿控制")

    // 抗锯齿模式选择
    gui
      .add(settings, "mode", ["none", "msaa", "fxaa"])
      .name("抗锯齿模式")
      .onChange((value) => {
        switchMode(value)
      })

    // 模式说明文件夹
    const infoFolder = gui.addFolder("📖 模式说明")
    const infoData: Record<string, string> = {
      "无抗锯齿": "完全关闭，锯齿最明显，性能最高",
      "MSAA": "渲染器内置多重采样抗锯齿",
      "FXAA": "后处理快速近似抗锯齿（推荐）"
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
    renderPass = null
    fxaaPass = null

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
    // 重建渲染器为无抗锯齿模式（FXAA 模式需要关闭 MSAA）
    rebuildRenderer(false)

    // 创建场景物体
    createSceneObjects()

    // 创建 FXAA 后处理管线（默认模式）
    createFXAAComposer()

    // 初始化 GUI
    initGUI()

    // 启动动画循环 —— 使用 composer.render() 替代 renderer.render()
    startAnimation(() => {
      // 旋转线框球体
      if (wireframeSphere) {
        wireframeSphere.rotation.y += 0.005
        wireframeSphere.rotation.x += 0.003
      }

      // 旋转线框圆环
      if (wireframeTorus) {
        wireframeTorus.rotation.z += 0.008
      }

      // 旋转小方块群组
      if (cubeGroup) {
        cubeGroup.rotation.y += 0.003
      }

      // 更新 FXAA 分辨率（确保窗口大小变化后仍然正确）
      if (fxaaPass) {
        fxaaPass.uniforms["resolution"].value.set(
          1 / window.innerWidth,
          1 / window.innerHeight
        )
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
    title="🔲 FXAA 后处理抗锯齿"
    description="FXAA 抗锯齿后处理效果演示，对比无抗锯齿、MSAA、FXAA 三种模式"
  >
    <!-- 内容区域 -->
    <template #content>
      <div class="features">
        <h3>✨ 功能特性</h3>
        <ul>
          <li>🔲 <strong>无抗锯齿 (none)</strong> - 完全关闭，锯齿最明显</li>
          <li>🎯 <strong>MSAA</strong> - 渲染器内置多重采样抗锯齿</li>
          <li>🔍 <strong>FXAA</strong> - 后处理快速近似抗锯齿（Fast Approximate Anti-Aliasing）</li>
          <li>🎛️ GUI 实时切换三种抗锯齿模式</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📖 什么是 FXAA？</h3>
        <ul>
          <li><strong>FXAA</strong>（Fast Approximate Anti-Aliasing）是图像空间抗锯齿技术</li>
          <li>在最终渲染的图像上进行分析和模糊处理</li>
          <li>优点：性能开销低，实现简单</li>
          <li>缺点：可能使画面整体略微模糊</li>
          <li>适合：实时渲染、游戏、性能敏感场景</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔧 管线结构</h3>
        <ul>
          <li>1️⃣ <code>RenderPass</code> - 将场景渲染到纹理</li>
          <li>2️⃣ <code>ShaderPass(FXAAShader)</code> - 执行 FXAA 抗锯齿</li>
          <li>3️⃣ <code>OutputPass</code> - 确保正确的色彩空间输出</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>const fxaaPass = new ShaderPass(FXAAShader)</code></p>
        <p><code>fxaaPass.uniforms["resolution"].value.set(</code></p>
        <p><code>&nbsp;&nbsp;1 / window.innerWidth,</code></p>
        <p><code>&nbsp;&nbsp;1 / window.innerHeight</code></p>
        <p><code>)</code></p>
      </div>

      <div class="controls-tip">
        <p>🎮 操作提示</p>
        <ul>
          <li>🖱️ 左键拖动：旋转视角</li>
          <li>🖱️ 滚轮：缩放</li>
          <li>🎚️ GUI 切换抗锯齿模式观察差异</li>
          <li>💡 建议放大观察线框边缘的锯齿</li>
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
