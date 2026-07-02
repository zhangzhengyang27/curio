<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 容器引用
  const containerRef = shallowRef(null)

  // 使用公共的 Three.js 场景逻辑
  const {
    scene,
    camera,
    renderer,
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 15, y: 10, z: 15 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 3,
      maxDistance: 80
    },
    showAxesHelper: true
  })

  // GUI 和对象引用
  let gui: GUI | null = null
  let animationId = 0
  let extraMeshes: THREE.Mesh[] = [] // 动态添加的物体
  let extraTextures: THREE.Texture[] = [] // 额外的纹理

  // FPS 计算
  let frameCount = 0
  let lastFpsTime = performance.now()
  let fps = 0

  // 配置参数
  const params = {
    // 显示面板控制
    showRendererInfo: true,
    showFPS: true,
    showMemory: true,
    // PixelRatio
    pixelRatio: window.devicePixelRatio || 2,
    // 场景控制
    extraMeshCount: 0, // 额外添加的物体数量
    animate: true
  }

  // 渲染信息对象
  const infoObj = {
    fps: 0,
    drawCalls: 0,
    triangles: 0,
    textures: 0,
    geometries: 0,
    programs: 0,
    // 内存信息（仅 Chrome 可用）
    usedJSHeapSize: 0 as string | number,
    totalJSHeapSize: 0 as string | number,
    jsHeapSizeLimit: 0 as string | number,
    memoryAvailable: false
  }

  /**
   * 创建基础场景（较重的场景用于演示性能监控）
   */
  const createBaseScene = () => {
    if (!scene.value) return

    // 创建基础光照
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5)
    scene.value.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    directionalLight.position.set(10, 20, 10)
    scene.value.add(directionalLight)

    const pointLight1 = new THREE.PointLight(0xff6633, 1, 50)
    pointLight1.position.set(-10, 10, -10)
    scene.value.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0x3366ff, 1, 50)
    pointLight2.position.set(10, 5, -10)
    scene.value.add(pointLight2)

    // 创建一组基础物体
    const geometries = [
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.SphereGeometry(0.7, 32, 32),
      new THREE.ConeGeometry(0.5, 1.5, 16),
      new THREE.TorusGeometry(0.5, 0.2, 16, 32),
      new THREE.CylinderGeometry(0.3, 0.5, 1, 16)
    ]

    // 创建彩色材质（带纹理效果）
    const colors = [0x42b983, 0x3498db, 0xe74c3c, 0xf39c12, 0x9b59b6]

    for (let i = 0; i < 20; i++) {
      const geometry = geometries[i % geometries.length]
      const material = new THREE.MeshPhongMaterial({
        color: colors[i % colors.length],
        flatShading: true
      })
      const mesh = new THREE.Mesh(geometry, material)

      // 在场景中分布
      const angle = (i / 20) * Math.PI * 2
      const radius = 5 + (i % 3) * 3
      mesh.position.set(
        Math.cos(angle) * radius,
        (i % 4) * 2 - 3,
        Math.sin(angle) * radius
      )
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )

      scene.value.add(mesh)
    }
  }

  /**
   * 动态添加物体（增加场景复杂度）
   * @param {number} count - 添加的物体数量
   */
  const addExtraMeshes = (count: number) => {
    // 先清理已有额外物体
    removeExtraMeshes()

    if (count <= 0) return

    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)

    for (let i = 0; i < count; i++) {
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5),
        flatShading: true
      })
      const mesh = new THREE.Mesh(geometry, material)

      // 随机位置
      mesh.position.set(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 30
      )

      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )

      scene.value?.add(mesh)
      extraMeshes.push(mesh)
    }
  }

  /**
   * 移除额外添加的物体
   */
  const removeExtraMeshes = () => {
    extraMeshes.forEach((mesh) => {
      mesh.geometry?.dispose()
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach((m) => m?.dispose())
      scene.value?.remove(mesh)
    })
    extraMeshes = []
  }

  /**
   * Dispose 演示 —— 清理额外物体和纹理，观察内存变化
   */
  const demoDispose = () => {
    // 清理额外物体
    removeExtraMeshes()
    params.extraMeshCount = 0

    // 清理额外纹理
    extraTextures.forEach((tex) => tex.dispose())
    extraTextures = []

    console.log("✅ 已执行 dispose 操作，观察内存变化")
  }

  /**
   * 更新 PixelRatio
   * @param {number} value - 像素比
   */
  const updatePixelRatio = (value: number) => {
    if (renderer.value) {
      renderer.value.setPixelRatio(value)
    }
  }

  /**
   * 获取内存信息（仅 Chrome 支持 performance.memory）
   */
  const getMemoryInfo = () => {
    // performance.memory 仅在 Chrome 中可用
    const perf = performance
    if (perf.memory) {
      infoObj.memoryAvailable = true
      infoObj.usedJSHeapSize = (perf.memory.usedJSHeapSize / 1048576).toFixed(1) + " MB"
      infoObj.totalJSHeapSize = (perf.memory.totalJSHeapSize / 1048576).toFixed(1) + " MB"
      infoObj.jsHeapSizeLimit = (perf.memory.jsHeapSizeLimit / 1048576).toFixed(0) + " MB"
    } else {
      infoObj.memoryAvailable = false
      infoObj.usedJSHeapSize = "不支持"
      infoObj.totalJSHeapSize = "不支持"
      infoObj.jsHeapSizeLimit = "不支持"
    }
  }

  /**
   * 动画循环
   */
  const animate = () => {
    animationId = requestAnimationFrame(animate)

    const time = performance.now() * 0.001

    // 更新额外物体的动画
    if (params.animate) {
      extraMeshes.forEach((mesh, i) => {
        mesh.rotation.y = time * 0.5 * (i % 2 === 0 ? 1 : -1)
        mesh.rotation.x = time * 0.3
      })
    }

    // 渲染场景
    if (renderer.value && scene.value && camera.value) {
      renderer.value.render(scene.value, camera.value)

      // 更新渲染信息
      if (renderer.value.info) {
        infoObj.drawCalls = renderer.value.info.render.calls
        infoObj.triangles = renderer.value.info.render.triangles
        infoObj.textures = renderer.value.info.memory.textures
        infoObj.geometries = renderer.value.info.memory.geometries
        infoObj.programs = renderer.value.info.programs ? renderer.value.info.programs.length : 0
      }
    }

    // 计算 FPS
    frameCount++
    const now = performance.now()
    if (now - lastFpsTime >= 500) {
      fps = Math.round((frameCount * 1000) / (now - lastFpsTime))
      infoObj.fps = fps
      frameCount = 0
      lastFpsTime = now
    }

    // 更新内存信息（每 30 帧更新一次，减少性能开销）
    if (frameCount % 30 === 0) {
      getMemoryInfo()
    }
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    // === 性能监控面板 ===
    const perfFolder = gui.addFolder("📊 性能监控")

    // FPS
    perfFolder.add(infoObj, "fps").name("FPS").listen().disable()
    perfFolder.add(infoObj, "drawCalls").name("Draw Calls").listen().disable()
    perfFolder.add(infoObj, "triangles").name("三角面数").listen().disable()

    perfFolder.open()

    // === 资源信息面板 ===
    const resFolder = gui.addFolder("📦 资源信息")
    resFolder.add(infoObj, "geometries").name("几何体数").listen().disable()
    resFolder.add(infoObj, "textures").name("纹理数").listen().disable()
    resFolder.add(infoObj, "programs").name("着色器程序数").listen().disable()
    resFolder.open()

    // === 内存信息面板 ===
    const memFolder = gui.addFolder("💾 内存信息")
    memFolder.add(infoObj as any, "usedJSHeapSize").name("JS 堆使用").listen().disable()
    memFolder.add(infoObj as any, "totalJSHeapSize").name("JS 堆总量").listen().disable()
    memFolder.add(infoObj as any, "jsHeapSizeLimit").name("JS 堆上限").listen().disable()
    memFolder.add(infoObj, "memoryAvailable").name("内存 API 可用").listen().disable()

    // === PixelRatio 控制 ===
    const prFolder = gui.addFolder("🖥️ 像素比 (PixelRatio)")
    const prOptions = {
      "0.5x (低)": 0.5,
      "1x (中)": 1,
      "1.5x (高)": 1.5,
      "2x (超高)": 2,
      "设备默认": window.devicePixelRatio || 2
    }
    const pixelRatioParams = { 像素比: window.devicePixelRatio || 2 }
    prFolder
      .add(pixelRatioParams, "像素比", prOptions)
      .name("选择像素比")
      .onChange((value: number) => {
        params.pixelRatio = value
        updatePixelRatio(value)
      })

    // 动态调整
    prFolder
      .add(params, "pixelRatio", 0.25, 3, 0.25)
      .name("精确调节")
      .onChange((value) => {
        updatePixelRatio(value)
      })

    // === 场景控制 ===
    const sceneFolder = gui.addFolder("🎮 场景控制")
    sceneFolder
      .add(params, "extraMeshCount", 0, 500, 10)
      .name("额外物体数")
      .onChange((value) => {
        addExtraMeshes(value)
      })

    // 动画控制
    sceneFolder.add(params, "animate").name("播放动画")

    // Dispose 演示按钮
    const disposeBtn = {
      dispose: () => demoDispose()
    }
    sceneFolder.add(disposeBtn, "dispose").name("🗑️ 清理额外物体")

    // === 优化建议 ===
    const tipFolder = gui.addFolder("💡 优化建议")
    const tips = {
      tip1: "降低 PixelRatio 可大幅提升性能",
      tip2: "减少 Draw Call 是最重要的优化",
      tip3: "使用 InstancedMesh 减少相同物体",
      tip4: "使用纹理图集(TextureAtlas)减少纹理数",
      tip5: "合理使用 dispose 释放内存"
    }
    tipFolder.add(tips, "tip1").name("像素比").disable()
    tipFolder.add(tips, "tip2").name("Draw Call").disable()
    tipFolder.add(tips, "tip3").name("实例化").disable()
    tipFolder.add(tips, "tip4").name("纹理合并").disable()
    tipFolder.add(tips, "tip5").name("资源释放").disable()
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 取消动画帧
    if (animationId) {
      cancelAnimationFrame(animationId)
    }

    // 清理额外物体
    removeExtraMeshes()

    // 清理额外纹理
    extraTextures.forEach((tex) => tex.dispose())
    extraTextures = []

    // 清理 GUI
    gui?.destroy()

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    // 创建基础场景
    createBaseScene()
    // 初始化 GUI
    initGUI()
    // 启动动画循环
    animate()
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="📈 性能监控与优化策略"
    description="集成多种性能监控工具，学习 FPS、渲染信息、内存使用等核心指标的监控方法，以及 PixelRatio 调节等优化策略"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>📊 <strong>渲染信息面板</strong> - 实时显示 Draw Call、三角面数、纹理数、几何体数</li>
          <li>📈 <strong>FPS 计数器</strong> - 自实现的帧率监控（无需外部库）</li>
          <li>💾 <strong>内存监控</strong> - 显示 JS 堆内存使用情况（Chrome）</li>
          <li>🖥️ <strong>PixelRatio 调节</strong> - 0.25x ~ 3x 精确调节渲染分辨率</li>
          <li>🗑️ <strong>Dispose 演示</strong> - 一键清理资源，观察内存变化</li>
          <li>🎮 <strong>动态场景</strong> - 添加/移除物体，观察性能变化</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📖 性能监控的重要性：</h3>
        <ul>
          <li><strong>为什么要监控</strong>：无法优化的东西无法度量</li>
          <li><strong>关键指标</strong>：FPS、Draw Call、三角面数、纹理数、内存</li>
          <li><strong>目标</strong>：60 FPS 稳定运行，Draw Call 尽量少</li>
          <li><strong>工具</strong>：Three.js 内置的 <code>renderer.info</code> 就够用了</li>
          <li>💡 Chrome 的 <code>performance.memory</code> 可以监控 JS 堆内存</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📊 renderer.info 解读：</h3>
        <ul>
          <li><strong>render.calls</strong> - Draw Call 次数（越少越好）</li>
          <li><strong>render.triangles</strong> - 渲染的三角面总数</li>
          <li><strong>memory.geometries</strong> - 内存中的几何体数量</li>
          <li><strong>memory.textures</strong> - 内存中的纹理数量</li>
          <li><strong>programs</strong> - 编译的着色器程序数量</li>
          <li>💡 这些数据每帧自动更新，可以随时读取</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>🔧 核心代码：</p>
        <p><code>// 读取渲染信息</code></p>
        <p><code>renderer.info.render.calls // Draw Call 数</code></p>
        <p><code>renderer.info.render.triangles // 三角面数</code></p>
        <p><code>renderer.info.memory.textures // 纹理数</code></p>
        <p><code>renderer.info.memory.geometries // 几何体数</code></p>
        <br>
        <p><code>// FPS 计算</code></p>
        <p><code>let frames = 0, lastTime = performance.now()</code></p>
        <p><code>frames++</code></p>
        <p><code>const now = performance.now()</code></p>
        <p><code>if (now - lastTime >= 1000) {</code></p>
        <p><code>&nbsp;&nbsp;fps = frames; frames = 0; lastTime = now</code></p>
        <p><code>}</code></p>
        <br>
        <p><code>// PixelRatio 调节</code></p>
        <p><code>renderer.setPixelRatio(0.5) // 降低分辨率</code></p>
        <br>
        <p><code>// 内存信息 (Chrome only)</code></p>
        <p><code>performance.memory.usedJSHeapSize</code></p>
      </div>

      <div class="info-section">
        <h3>🖥️ PixelRatio 优化策略：</h3>
        <ul>
          <li><strong>devicePixelRatio = 2</strong>（Retina 屏幕）：渲染像素是 CSS 像素的 4 倍 ⚠️</li>
          <li><strong>设置 1.5</strong>：在清晰度和性能间平衡 🟡</li>
          <li><strong>设置 1</strong>：标准清晰度，性能好 ✅</li>
          <li><strong>设置 0.5</strong>：低分辨率，性能最好，适合低端设备</li>
          <li>💡 建议使用 <code>Math.min(devicePixelRatio, 2)</code> 设置上限</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🗑️ Dispose 资源释放策略：</h3>
        <ul>
          <li>1️⃣ <strong>Geometry.dispose()</strong> - 释放几何体的 GPU 缓冲区</li>
          <li>2️⃣ <strong>Material.dispose()</strong> - 释放材质的 GPU 资源</li>
          <li>3️⃣ <strong>Texture.dispose()</strong> - 释放纹理的 GPU 内存</li>
          <li>4️⃣ <strong>Renderer.dispose()</strong> - 释放 WebGL 上下文</li>
          <li>5️⃣ <strong>removeChild()</strong> - 从场景图中移除对象</li>
          <li>⚠️ 不 dispose 会导致内存泄漏，页面越用越卡</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 常见优化策略：</h3>
        <ul>
          <li>⚡ <strong>降低 PixelRatio</strong> - 最简单的性能提升方式</li>
          <li>🔗 <strong>合并几何体</strong> - 减少 Draw Call</li>
          <li>📐 <strong>LOD</strong> - 远处使用低精度模型</li>
          <li>👁️ <strong>视锥体剔除</strong> - 自动跳过视野外物体</li>
          <li>🖼️ <strong>纹理压缩</strong> - 使用 KTX2/Basis 格式</li>
          <li>🧊 <strong>纹理图集</strong> - 合并小纹理减少 Draw Call</li>
          <li>🚫 <strong>按需渲染</strong> - 静态场景不每帧渲染</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 操作建议：</h3>
        <ul>
          <li>📊 观察 GUI 面板中各项指标的变化</li>
          <li>🖥️ 尝试不同 PixelRatio，感受画质与性能的平衡</li>
          <li>🎮 增加/减少物体数量，观察 FPS 和 Draw Call 变化</li>
          <li>🗑️ 点击"清理额外物体"，观察几何体数减少</li>
          <li>💾 在 Chrome 中可以查看 JS 堆内存的变化</li>
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
  }

  .features,
  .info-section,
  .code-tip {
    margin-bottom: 16px;
  }

  .features h3,
  .info-section h3,
  .code-tip p:first-child {
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
