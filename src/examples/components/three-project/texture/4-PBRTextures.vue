<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 容器引用
  const containerRef = shallowRef<HTMLDivElement | null>(null)

  // 使用公共的 Three.js 场景逻辑
  const {
    scene,
    renderer,
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 3, y: 2, z: 4 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 2,
      maxDistance: 12
    },
    showAxesHelper: false,
    showGridHelper: true
  })

  // GUI 和对象引用
  let gui: GUI | null = null
  let sphere: THREE.Mesh | null = null
  let plane: THREE.Mesh | null = null
  let sphereMaterial: THREE.MeshStandardMaterial | null = null
  let planeMaterial: THREE.MeshStandardMaterial | null = null
  // 贴图引用（用于切换开关）
  let colorMap: THREE.Texture | null = null
  let normalMap: THREE.Texture | null = null
  let roughnessMap: THREE.Texture | null = null
  let metalnessMap: THREE.Texture | null = null
  let aoMap: THREE.Texture | null = null

  /**
   * 程序化生成颜色贴图（砖墙/棋盘格风格）
   */
  const createColorMap = () => {
    const size = 512
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) return new THREE.CanvasTexture(canvas)

    // 绘制砖墙图案
    const brickWidth = 64
    const brickHeight = 32
    const mortarSize = 4

    // 砂浆底色
    ctx.fillStyle = "#8B8682"
    ctx.fillRect(0, 0, size, size)

    // 砖块颜色变化
    const brickColors = ["#B55239", "#C4624A", "#A84832", "#D4715A", "#BF5E45"]

    for (let row = 0; row < size / brickHeight; row++) {
      for (let col = 0; col < size / brickWidth + 1; col++) {
        // 每隔一行偏移半个砖块宽度
        const offsetX = row % 2 === 0 ? 0 : brickWidth / 2
        const x = col * brickWidth + offsetX + mortarSize
        const y = row * brickHeight + mortarSize

        ctx.fillStyle = brickColors[Math.floor(Math.random() * brickColors.length)]
        ctx.fillRect(x, y, brickWidth - mortarSize * 2, brickHeight - mortarSize * 2)
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }

  /**
   * 程序化生成法线贴图（基于砖墙图案）
   */
  const createNormalMap = () => {
    const size = 512
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) return new THREE.CanvasTexture(canvas)

    // 法线贴图默认平坦（蓝色 128,128,255）
    ctx.fillStyle = "#8080FF"
    ctx.fillRect(0, 0, size, size)

    const brickWidth = 64
    const brickHeight = 32
    const mortarSize = 4

    for (let row = 0; row < size / brickHeight; row++) {
      for (let col = 0; col < size / brickWidth + 1; col++) {
        const offsetX = row % 2 === 0 ? 0 : brickWidth / 2
        const x = col * brickWidth + offsetX
        const y = row * brickHeight

        // 砂浆凹槽 - 在砖块边缘绘制法线
        // 上边缘（法线朝下）
        ctx.fillStyle = "#8040FF" // 向下的法线
        ctx.fillRect(x, y, brickWidth, mortarSize)

        // 左边缘（法线朝右）
        ctx.fillStyle = "#FF80FF" // 向右的法线
        ctx.fillRect(x, y, mortarSize, brickHeight)

        // 砖块内部保持平坦
        ctx.fillStyle = "#8080FF"
        ctx.fillRect(x + mortarSize, y + mortarSize, brickWidth - mortarSize * 2, brickHeight - mortarSize * 2)

        // 砖块顶部边缘高亮（微弱的法线偏移）
        ctx.fillStyle = "#8090FF"
        ctx.fillRect(x + mortarSize, y + mortarSize, brickWidth - mortarSize * 2, 2)
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    return texture
  }

  /**
   * 程序化生成粗糙度贴图
   */
  const createRoughnessMap = () => {
    const size = 512
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) return new THREE.CanvasTexture(canvas)

    // 较粗糙的底色（砂浆）
    ctx.fillStyle = "#999999"
    ctx.fillRect(0, 0, size, size)

    const brickWidth = 64
    const brickHeight = 32
    const mortarSize = 4

    for (let row = 0; row < size / brickHeight; row++) {
      for (let col = 0; col < size / brickWidth + 1; col++) {
        const offsetX = row % 2 === 0 ? 0 : brickWidth / 2
        const x = col * brickWidth + offsetX + mortarSize
        const y = row * brickHeight + mortarSize

        // 砖块表面较光滑（较暗的值）
        const brightness = 100 + Math.floor(Math.random() * 40)
        ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`
        ctx.fillRect(x, y, brickWidth - mortarSize * 2, brickHeight - mortarSize * 2)
      }
    }

    return new THREE.CanvasTexture(canvas)
  }

  /**
   * 程序化生成金属度贴图
   */
  const createMetalnessMap = () => {
    const size = 512
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) return new THREE.CanvasTexture(canvas)

    // 非金属底色（黑色 = 0）
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, size, size)

    const brickWidth = 64
    const brickHeight = 32
    const mortarSize = 4

    for (let row = 0; row < size / brickHeight; row++) {
      for (let col = 0; col < size / brickWidth + 1; col++) {
        const offsetX = row % 2 === 0 ? 0 : brickWidth / 2
        const x = col * brickWidth + offsetX + mortarSize
        const y = row * brickHeight + mortarSize

        // 砖块微弱金属感
        const value = 10 + Math.floor(Math.random() * 20)
        ctx.fillStyle = `rgb(${value}, ${value}, ${value})`
        ctx.fillRect(x, y, brickWidth - mortarSize * 2, brickHeight - mortarSize * 2)
      }
    }

    return new THREE.CanvasTexture(canvas)
  }

  /**
   * 程序化生成 AO 贴图（环境光遮蔽）
   */
  const createAOMap = () => {
    const size = 512
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) return new THREE.CanvasTexture(canvas)

    // 无遮蔽（白色 = 1）
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, size, size)

    const brickWidth = 64
    const brickHeight = 32
    const mortarSize = 4

    for (let row = 0; row < size / brickHeight; row++) {
      for (let col = 0; col < size / brickWidth + 1; col++) {
        const offsetX = row % 2 === 0 ? 0 : brickWidth / 2
        const x = col * brickWidth + offsetX
        const y = row * brickHeight

        // 砂浆处有遮蔽（较暗）
        ctx.fillStyle = "#333333"
        ctx.fillRect(x, y, brickWidth, mortarSize)
        ctx.fillRect(x, y, mortarSize, brickHeight)

        // 砖块内部无遮蔽
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(x + mortarSize, y + mortarSize, brickWidth - mortarSize * 2, brickHeight - mortarSize * 2)
      }
    }

    return new THREE.CanvasTexture(canvas)
  }

  /**
   * 创建场景物体
   */
  const createScene = () => {
    if (!scene.value || !renderer.value) return

    // 生成所有贴图
    colorMap = createColorMap()
    normalMap = createNormalMap()
    roughnessMap = createRoughnessMap()
    metalnessMap = createMetalnessMap()
    aoMap = createAOMap()

    // 设置所有贴图的包裹模式
    const maps = [colorMap, normalMap, roughnessMap, metalnessMap, aoMap]
    maps.forEach((map) => {
      map.wrapS = THREE.RepeatWrapping
      map.wrapT = THREE.RepeatWrapping
    })

    // 创建球体 - 展示 PBR 贴图在曲面上的效果
    const sphereGeo = new THREE.SphereGeometry(1, 64, 64)
    sphereMaterial = new THREE.MeshStandardMaterial({
      map: colorMap,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(1, 1),
      roughnessMap: roughnessMap,
      roughness: 1,
      metalnessMap: metalnessMap,
      metalness: 1,
      aoMap: aoMap
    })
    sphere = new THREE.Mesh(sphereGeo, sphereMaterial)
    sphere.position.set(0, 1, 0)
    scene.value.add(sphere)

    // 创建平面 - 展示 PBR 贴图在平面上的效果
    const planeGeo = new THREE.PlaneGeometry(6, 6)
    planeMaterial = new THREE.MeshStandardMaterial({
      map: colorMap,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(1, 1),
      roughnessMap: roughnessMap,
      roughness: 1,
      metalnessMap: metalnessMap,
      metalness: 1,
      aoMap: aoMap
    })
    plane = new THREE.Mesh(planeGeo, planeMaterial)
    plane.rotation.x = -Math.PI / 2
    plane.position.set(0, 0, 0)
    scene.value.add(plane)

    // 添加方向光
    const dirLight = new THREE.DirectionalLight(0xffffff, 2)
    dirLight.position.set(5, 8, 5)
    scene.value.add(dirLight)

    // 添加环境光
    const ambLight = new THREE.AmbientLight(0x404040, 1)
    scene.value.add(ambLight)

    // 开启渲染器的色调映射
    renderer.value.toneMapping = THREE.ACESFilmicToneMapping
    renderer.value.toneMappingExposure = 1.0
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    // 贴图开关控制
    const params = {
      map: true,
      normalMap: true,
      roughnessMap: true,
      metalnessMap: true,
      aoMap: true,
      normalScale: 1.0
    }

    const folder = gui.addFolder("🎨 PBR 贴图控制")
    folder.add(params, "map").name("颜色贴图 (map)").onChange((v) => {
      if (sphereMaterial) sphereMaterial.map = v ? colorMap : null
      if (planeMaterial) planeMaterial.map = v ? colorMap : null
      if (sphereMaterial) sphereMaterial.needsUpdate = true
      if (planeMaterial) planeMaterial.needsUpdate = true
    })
    folder.add(params, "normalMap").name("法线贴图 (normalMap)").onChange((v) => {
      if (sphereMaterial) sphereMaterial.normalMap = v ? normalMap : null
      if (planeMaterial) planeMaterial.normalMap = v ? normalMap : null
      if (sphereMaterial) sphereMaterial.needsUpdate = true
      if (planeMaterial) planeMaterial.needsUpdate = true
    })
    folder.add(params, "roughnessMap").name("粗糙度贴图 (roughnessMap)").onChange((v) => {
      if (sphereMaterial) sphereMaterial.roughnessMap = v ? roughnessMap : null
      if (planeMaterial) planeMaterial.roughnessMap = v ? roughnessMap : null
      if (sphereMaterial) sphereMaterial.needsUpdate = true
      if (planeMaterial) planeMaterial.needsUpdate = true
    })
    folder.add(params, "metalnessMap").name("金属度贴图 (metalnessMap)").onChange((v) => {
      if (sphereMaterial) sphereMaterial.metalnessMap = v ? metalnessMap : null
      if (planeMaterial) planeMaterial.metalnessMap = v ? metalnessMap : null
      if (sphereMaterial) sphereMaterial.needsUpdate = true
      if (planeMaterial) planeMaterial.needsUpdate = true
    })
    folder.add(params, "aoMap").name("环境光遮蔽 (aoMap)").onChange((v) => {
      if (sphereMaterial) sphereMaterial.aoMap = v ? aoMap : null
      if (planeMaterial) planeMaterial.aoMap = v ? aoMap : null
      if (sphereMaterial) sphereMaterial.needsUpdate = true
      if (planeMaterial) planeMaterial.needsUpdate = true
    })
    folder.add(params, "normalScale", 0, 3, 0.1).name("法线强度 (normalScale)").onChange((v) => {
      if (sphereMaterial) sphereMaterial.normalScale?.set(v, v)
      if (planeMaterial) planeMaterial.normalScale?.set(v, v)
    })
    folder.open()
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理贴图
    ;[colorMap, normalMap, roughnessMap, metalnessMap, aoMap].forEach((t) => t?.dispose())
    colorMap = normalMap = roughnessMap = metalnessMap = aoMap = null

    // 清理材质
    sphereMaterial?.dispose()
    planeMaterial?.dispose()
    sphereMaterial = planeMaterial = null

    // 清理 GUI
    gui?.destroy()

    // 调用基础清理
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    createScene()
    initGUI()
    startAnimation()
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🎨 PBR 纹理全家桶"
    description="使用程序化方式生成全套 PBR 材质纹理贴图，展示每张贴图的作用"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🖼️ <strong>颜色贴图 (map)</strong> - 物体表面的颜色信息</li>
          <li>🌊 <strong>法线贴图 (normalMap)</strong> - 模拟表面凹凸细节</li>
          <li>✨ <strong>粗糙度贴图 (roughnessMap)</strong> - 控制表面光滑/粗糙程度</li>
          <li>🔩 <strong>金属度贴图 (metalnessMap)</strong> - 控制金属/非金属属性</li>
          <li>🌑 <strong>环境光遮蔽 (aoMap)</strong> - 模拟缝隙和角落的阴影</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 PBR 材质说明：</h3>
        <ul>
          <li><strong>map</strong> - 基础颜色贴图，定义物体表面颜色</li>
          <li><strong>normalMap</strong> - 法线贴图，RGB 分别对应 XYZ 法线方向</li>
          <li><strong>roughnessMap</strong> - 粗糙度贴图，白色 = 粗糙，黑色 = 光滑</li>
          <li><strong>metalnessMap</strong> - 金属度贴图，白色 = 金属，黑色 = 非金属</li>
          <li><strong>aoMap</strong> - 环境光遮蔽，白色 = 无遮蔽，黑色 = 完全遮蔽</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 提示：</h3>
        <ul>
          <li>🔸 使用 GUI 面板开关每张贴图，观察效果变化</li>
          <li>🔸 关闭所有贴图后可以看到纯灰色材质</li>
          <li>🔸 逐个开启贴图，理解每张贴图的独立作用</li>
          <li>🔸 本示例使用程序化生成贴图，实际项目中通常使用 Substance Painter 等工具制作</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码示例：</p>
        <p><code>const mat = new THREE.MeshStandardMaterial({</code></p>
        <p><code>  map: colorMap,</code></p>
        <p><code>  normalMap: normalMap,</code></p>
        <p><code>  roughnessMap: roughnessMap,</code></p>
        <p><code>  metalnessMap: metalnessMap,</code></p>
        <p><code>  aoMap: aoMap,</code></p>
        <p><code>  roughness: 1, metalness: 1</code></p>
        <p><code>})</code></p>
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
