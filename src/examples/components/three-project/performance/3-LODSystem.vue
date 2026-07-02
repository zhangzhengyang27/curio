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
    startAnimation: _startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 0, y: 5, z: 20 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 2,
      maxDistance: 100
    },
    showAxesHelper: true
  })

  // GUI 和对象引用
  let gui: GUI | null = null
  let animationId = 0
  let lodObjects: THREE.LOD[] = [] // LOD 对象数组
  let labels: Array<{ sprite: THREE.Sprite; lod: THREE.LOD; name: string }> = [] // 文字标签 Sprite 数组

  // FPS 计算
  let frameCount = 0
  let lastFpsTime = performance.now()

  // GUI 信息对象
  const infoObj = {
    fps: 0,
    lodDetails: ""
  }

  /**
   * 创建文字标签 Sprite
   * @param {string} text - 标签文本
   * @returns {THREE.Sprite} 文字标签
   */
  const createLabel = (text: string) => {
    const canvas = document.createElement("canvas")
    canvas.width = 256
    canvas.height = 64
    const ctx = canvas.getContext("2d")!

    // 绘制背景
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
    ctx.roundRect(0, 0, 256, 64, 8)
    ctx.fill()

    // 绘制文字
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 24px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(text, 128, 32)

    // 创建纹理
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true

    // 创建 Sprite
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false })
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(4, 1, 1)

    return sprite
  }

  /**
   * 更新文字标签内容
   * @param {THREE.Sprite} sprite - Sprite 对象
   * @param {string} text - 新文本
   */
  const updateLabel = (sprite: THREE.Sprite, text: string) => {
    const canvas = document.createElement("canvas")
    canvas.width = 256
    canvas.height = 64
    const ctx = canvas.getContext("2d")!

    // 绘制背景
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
    ctx.roundRect(0, 0, 256, 64, 8)
    ctx.fill()

    // 根据当前 LOD 级别设置颜色
    let color = "#42b983" // 高精度 - 绿色
    if (text.includes("中精度")) color = "#f0ad4e" // 中精度 - 橙色
    if (text.includes("低精度")) color = "#d9534f" // 低精度 - 红色

    // 绘制文字
    ctx.fillStyle = color
    ctx.font = "bold 24px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(text, 128, 32)

    // 更新纹理
    const oldTexture = sprite.material.map
    const newTexture = new THREE.CanvasTexture(canvas)
    sprite.material.map = newTexture
    sprite.material.needsUpdate = true

    // 清理旧纹理
    if (oldTexture) oldTexture.dispose()
  }

  /**
   * 创建 LOD 多细节层次对象
   * @param {THREE.Vector3} position - 对象位置
   * @param {string} name - 对象名称
   */
  const createLODObject = (position: THREE.Vector3, name: string) => {
    // 创建 LOD 对象
    const lod = new THREE.LOD()

    // === 高精度模型 ===
    // IcosahedronGeometry(radius, detail=4) → 约 5120 个三角面
    const highGeo = new THREE.IcosahedronGeometry(1, 4)
    const highMat = new THREE.MeshPhongMaterial({
      color: 0x42b983,
      flatShading: true
    })
    const highMesh = new THREE.Mesh(highGeo, highMat)
    highMesh.name = `${name}_high`

    // === 中精度模型 ===
    // IcosahedronGeometry(radius, detail=2) → 约 320 个三角面
    const midGeo = new THREE.IcosahedronGeometry(1, 2)
    const midMat = new THREE.MeshPhongMaterial({
      color: 0xf0ad4e,
      flatShading: true
    })
    const midMesh = new THREE.Mesh(midGeo, midMat)
    midMesh.name = `${name}_mid`

    // === 低精度模型 ===
    // IcosahedronGeometry(radius, detail=0) → 约 20 个三角面（正二十面体）
    const lowGeo = new THREE.IcosahedronGeometry(1, 0)
    const lowMat = new THREE.MeshPhongMaterial({
      color: 0xd9534f,
      flatShading: true
    })
    const lowMesh = new THREE.Mesh(lowGeo, lowMat)
    lowMesh.name = `${name}_low`

    // 添加层级（distance 表示相机距离小于该值时使用该层级）
    // 距离 0-8：高精度，8-20：中精度，20+：低精度
    lod.addLevel(highMesh, 0) // 距离 0 开始使用高精度
    lod.addLevel(midMesh, 8) // 距离 8 以上切换到中精度
    lod.addLevel(lowMesh, 20) // 距离 20 以上切换到低精度

    // 设置位置
    lod.position.copy(position)
    lod.name = name

    // 添加到场景
    scene.value?.add(lod)

    // 创建标签并放在物体上方
    const label = createLabel(`${name}: 高精度`)
    label.position.set(position.x, position.y + 2, position.z)
    scene.value?.add(label)

    lodObjects.push(lod)
    labels.push({ sprite: label, lod, name })
  }

  /**
   * 动画循环
   */
  const animate = () => {
    animationId = requestAnimationFrame(animate)

    const time = performance.now() * 0.001

    // 更新所有 LOD 对象（LOD.update() 必须手动调用）
    lodObjects.forEach((lod) => {
      if (camera.value) {
        lod.update(camera.value)
      }
      // 添加轻微旋转动画
      lod.rotation.y = time * 0.3
    })

    // 更新标签文本
    let detailStr = ""
    labels.forEach(({ sprite, lod, name }) => {
      const currentLevel = lod.getCurrentLevel()
      let levelText = "高精度"
      if (currentLevel === 1) levelText = "中精度"
      if (currentLevel >= 2) levelText = "低精度"
      updateLabel(sprite, `${name}: ${levelText}`)
      detailStr += `${name}=L${currentLevel} `
    })
    infoObj.lodDetails = detailStr.trim()

    // 计算 FPS
    frameCount++
    const now = performance.now()
    if (now - lastFpsTime >= 1000) {
      infoObj.fps = Math.round((frameCount * 1000) / (now - lastFpsTime))
      frameCount = 0
      lastFpsTime = now
    }

    // 渲染场景
    if (renderer.value && scene.value && camera.value) {
      renderer.value.render(scene.value, camera.value)
    }
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    // FPS 信息
    const fpsFolder = gui.addFolder("📊 性能信息")
    fpsFolder.add(infoObj, "fps").name("FPS").listen().disable()
    fpsFolder.add(infoObj, "lodDetails").name("LOD 层级").listen().disable()
    fpsFolder.open()

    // LOD 距离阈值说明
    const lodInfoFolder = gui.addFolder("📏 LOD 距离设置")
    const lodInfo = {
      high: "0 ~ 8 单位 → 高精度 (绿)",
      mid: "8 ~ 20 单位 → 中精度 (橙)",
      low: "20+ 单位 → 低精度 (红)"
    }
    lodInfoFolder.add(lodInfo, "high").name("高精度范围").disable()
    lodInfoFolder.add(lodInfo, "mid").name("中精度范围").disable()
    lodInfoFolder.add(lodInfo, "low").name("低精度范围").disable()

    // 三角面数说明
    const triFolder = gui.addFolder("🔺 三角面数")
    const triInfo = {
      high: "高精度: ~5120 三角面",
      mid: "中精度: ~320 三角面",
      low: "低精度: ~20 三角面"
    }
    triFolder.add(triInfo, "high").name("高精度").disable()
    triFolder.add(triInfo, "mid").name("中精度").disable()
    triFolder.add(triInfo, "low").name("低精度").disable()

    // 操作提示
    const tipFolder = gui.addFolder("💡 操作提示")
    const tips = {
      move: "使用鼠标拖拽/滚轮移动相机",
      observe: "靠近物体观察 LOD 切换",
      watch: "观察物体颜色和标签变化"
    }
    tipFolder.add(tips, "move").name("移动相机").disable()
    tipFolder.add(tips, "observe").name("观察切换").disable()
    tipFolder.add(tips, "watch").name("颜色标识").disable()
  }

  /**
   * 初始化光照
   */
  const initLights = () => {
    if (!scene.value) return

    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5)
    scene.value.add(ambientLight)

    // 平行光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    directionalLight.position.set(10, 20, 10)
    scene.value.add(directionalLight)

    // 补光
    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.5)
    fillLight.position.set(-10, 5, -10)
    scene.value.add(fillLight)
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 取消动画帧
    if (animationId) {
      cancelAnimationFrame(animationId)
    }

    // 清理 LOD 对象
    lodObjects.forEach((lod) => {
      lod.traverse((child) => {
        if (child.isMesh) {
          const mesh = child as THREE.Mesh
          mesh.geometry?.dispose()
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          materials.forEach((m) => m?.dispose())
        }
      })
      scene.value?.remove(lod)
    })
    lodObjects = []

    // 清理标签
    labels.forEach(({ sprite }) => {
      sprite.material.map?.dispose()
      sprite.material.dispose()
      scene.value?.remove(sprite)
    })
    labels = []

    // 清理 GUI
    gui?.destroy()

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    // 初始化光照
    initLights()

    // 创建多个 LOD 物体，分布在不同位置
    createLODObject(new THREE.Vector3(0, 0, 0), "中心")
    createLODObject(new THREE.Vector3(15, 0, 0), "右侧")
    createLODObject(new THREE.Vector3(-15, 0, 0), "左侧")
    createLODObject(new THREE.Vector3(0, 0, 15), "前方")
    createLODObject(new THREE.Vector3(0, 0, -15), "后方")
    createLODObject(new THREE.Vector3(10, 0, 10), "右前")
    createLODObject(new THREE.Vector3(-10, 0, -10), "左后")

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
    title="📐 LOD 多细节层次"
    description="学习如何使用 Three.js 的 LOD 系统根据距离自动切换不同精度的模型，优化渲染性能"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>📐 <strong>LOD 系统</strong> - 根据相机距离自动切换 3 个精度级别</li>
          <li>🟢 <strong>高精度</strong> - 近距离使用 IcosahedronGeometry(detail=4)，约 5120 三角面</li>
          <li>🟡 <strong>中精度</strong> - 中距离使用 IcosahedronGeometry(detail=2)，约 320 三角面</li>
          <li>🔴 <strong>低精度</strong> - 远距离使用 IcosahedronGeometry(detail=0)，约 20 三角面</li>
          <li>🏷️ <strong>文字标签</strong> - 实时显示每个物体的当前 LOD 层级</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📖 什么是 LOD？</h3>
        <ul>
          <li><strong>全称</strong>：Level of Detail（细节层次）</li>
          <li><strong>原理</strong>：距离较远时使用低精度模型，距离较近时使用高精度模型</li>
          <li><strong>目的</strong>：在不影响视觉质量的前提下减少远距离物体的渲染开销</li>
          <li><strong>本质</strong>：用三角面数换帧率 —— 远处物体细节本就看不清</li>
          <li>💡 大型 3D 游戏（如 GTA、赛博朋克）都广泛使用 LOD 技术</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚙️ 工作原理：</h3>
        <ul>
          <li>1️⃣ <strong>创建 LOD 对象</strong> - <code>new THREE.LOD()</code></li>
          <li>2️⃣ <strong>添加精度层级</strong> - <code>lod.addLevel(mesh, distance)</code></li>
          <li>3️⃣ <strong>手动更新</strong> - 每帧调用 <code>lod.update(camera)</code></li>
          <li>4️⃣ <strong>自动切换</strong> - Three.js 根据距离选择合适的层级</li>
          <li>5️⃣ <strong>仅渲染当前层级</strong> - 其他层级的 Mesh 不会参与渲染</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>🔧 核心代码：</p>
        <p><code>const lod = new THREE.LOD()</code></p>
        <br>
        <p><code>// 添加不同精度的层级</code></p>
        <p><code>lod.addLevel(highMesh, 0)  // 距离 0 开始显示高精度</code></p>
        <p><code>lod.addLevel(midMesh, 8)   // 距离 8+ 切换到中精度</code></p>
        <p><code>lod.addLevel(lowMesh, 20)  // 距离 20+ 切换到低精度</code></p>
        <br>
        <p><code>// 每帧更新</code></p>
        <p><code>lod.update(camera)</code></p>
        <br>
        <p><code>// 获取当前层级</code></p>
        <p><code>const level = lod.getCurrentLevel()</code></p>
      </div>

      <div class="info-section">
        <h3>📊 各精度级别对比：</h3>
        <ul>
          <li><strong>高精度 (detail=4)</strong>：~5120 三角面，表面光滑 ✅ 近距离使用</li>
          <li><strong>中精度 (detail=2)</strong>：~320 三角面，略有棱角 🟡 中距离使用</li>
          <li><strong>低精度 (detail=0)</strong>：~20 三角面，正二十面体 🔴 远距离使用</li>
          <li>💡 三角面数从 5120 降到 20，性能提升约 256 倍</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 使用技巧：</h3>
        <ul>
          <li>🎯 使用鼠标滚轮拉近/拉远，观察 LOD 切换</li>
          <li>🎨 不同精度用不同颜色标识（绿/橙/红）</li>
          <li>🏷️ 物体上方的标签实时显示当前 LOD 层级</li>
          <li>📊 GUI 面板显示 FPS 和各物体 LOD 级别</li>
          <li>⚠️ <code>lod.update(camera)</code> 必须在渲染前手动调用</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 应用场景：</h3>
        <ul>
          <li>🌍 <strong>开放世界游戏</strong> - 远处建筑/地形使用低精度</li>
          <li>🏙️ <strong>城市场景</strong> - 远处建筑群自动降级</li>
          <li>🌲 <strong>自然场景</strong> - 远处树木简化为 billboard</li>
          <li>🚗 <strong>赛车游戏</strong> - 远处车辆使用低模</li>
          <li>🗺️ <strong>地图/地球</strong> - 不同缩放级别使用不同精度</li>
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
