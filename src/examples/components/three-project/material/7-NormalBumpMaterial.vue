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
    renderer,
    controls,
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 3, y: 3, z: 3 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 1,
      maxDistance: 15
    },
    showAxesHelper: false,
    showGridHelper: true
  })

  // GUI 和对象引用
  let gui: GUI | null = null
  let plane: THREE.Mesh | null = null
  let material: THREE.MeshStandardMaterial | null = null
  let bumpTexture: THREE.Texture | null = null
  let normalTexture: THREE.Texture | null = null

  /**
   * 使用 Canvas 程序化生成灰度凹凸贴图
   * 绘制一些随机的圆形凸起和凹下区域
   */
  const createBumpTexture = () => {
    const size = 512
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")!

    // 填充灰色底色（表示没有凹凸）
    ctx.fillStyle = "#808080"
    ctx.fillRect(0, 0, size, size)

    // 绘制随机圆形凸起（亮色 = 凸起）
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      const r = 10 + Math.random() * 40
      const brightness = 160 + Math.floor(Math.random() * 95)
      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    // 绘制随机圆形凹下区域（暗色 = 凹下）
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      const r = 10 + Math.random() * 30
      const darkness = 30 + Math.floor(Math.random() * 80)
      ctx.fillStyle = `rgb(${darkness}, ${darkness}, ${darkness})`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    // 绘制一些波纹效果
    ctx.strokeStyle = "#aaaaaa"
    ctx.lineWidth = 3
    for (let i = 0; i < 8; i++) {
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, 30 + i * 25, 0, Math.PI * 2)
      ctx.stroke()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
  }

  /**
   * 使用 Canvas 程序化生成法线贴图
   * 基于灰度贴图计算法线方向（简化版本，直接绘制法线颜色）
   */
  const createNormalTexture = () => {
    const size = 512
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")!

    // 法线贴图默认为中性法线 (0.5, 0.5, 1.0) 即 (128, 128, 255) 蓝色
    ctx.fillStyle = "#8080ff"
    ctx.fillRect(0, 0, size, size)

    // 绘制一些"凸起"法线区域（R通道偏移表示X方向，G通道偏移表示Y方向）
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      const r = 10 + Math.random() * 40
      // 法线偏移方向随机
      const nr = 80 + Math.floor(Math.random() * 96) // R: 80-175
      const ng = 80 + Math.floor(Math.random() * 96) // G: 80-175
      ctx.fillStyle = `rgb(${nr}, ${ng}, 255)`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    // 绘制一些"凹下"法线区域
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      const r = 10 + Math.random() * 30
      const nr = 30 + Math.floor(Math.random() * 80)
      const ng = 30 + Math.floor(Math.random() * 80)
      ctx.fillStyle = `rgb(${nr}, ${ng}, 255)`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    // 波纹法线
    for (let i = 0; i < 8; i++) {
      const centerX = size / 2
      const centerY = size / 2
      const radius = 30 + i * 25
      // 波纹向外的法线
      ctx.strokeStyle = `rgb(${150 - i * 8}, ${150 - i * 8}, 255)`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.stroke()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
  }

  /**
   * 创建平面几何体
   * 高细分度以支持位移贴图
   */
  const createScene = () => {
    if (!scene.value) return

    // 生成程序化纹理
    bumpTexture = createBumpTexture()
    normalTexture = createNormalTexture()

    // 创建高细分平面（256x256 细分，支持位移贴图）
    const geometry = new THREE.PlaneGeometry(4, 4, 256, 256)

    // 创建材质 - 默认使用 BumpMap 模式
    material = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      bumpMap: bumpTexture,
      bumpScale: 0.05,
      side: THREE.DoubleSide
    })

    plane = new THREE.Mesh(geometry, material)
    // 旋转平面使其水平放置，方便观察
    plane.rotation.x = -Math.PI / 2
    scene.value.add(plane)

    // 添加方向光（从斜上方照射，使凹凸效果清晰可见）
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
    directionalLight.position.set(3, 5, 3)
    scene.value.add(directionalLight)

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5)
    scene.value.add(ambientLight)

    // 添加第二个方向光（补光）
    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.5)
    fillLight.position.set(-3, 3, -3)
    scene.value.add(fillLight)

    // 设置场景背景
    scene.value.background = new THREE.Color(0x1a1a2e)

    console.log("凹凸/法线/位移贴图场景创建成功")
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    if (!material) return
    const mat = material

    gui = new GUI()
    gui.title("凹凸/法线/位移贴图控制")

    // 模式切换参数
    const params = {
      mode: "bump",
      bumpScale: 0.05,
      normalScale: 1.0,
      displacementScale: 0.5,
      wireframe: false,
      color: "#cccccc"
    }

    // 模式选择
    const modeFolder = gui.addFolder("🔄 贴图模式")
    modeFolder
      .add(params, "mode", ["bump", "normal", "displacement"])
      .name("贴图模式")
      .onChange((value) => {
        // 清除所有贴图
        mat.bumpMap = null
        mat.normalMap = null
        mat.displacementMap = null
        mat.bumpScale = 0
        if (mat.normalScale) mat.normalScale.set(1, 1)
        mat.displacementScale = 0

        switch (value) {
          case "bump":
            mat.bumpMap = bumpTexture
            mat.bumpScale = params.bumpScale
            break
          case "normal":
            mat.normalMap = normalTexture
            if (mat.normalScale) mat.normalScale.set(params.normalScale, params.normalScale)
            break
          case "displacement":
            mat.displacementMap = bumpTexture // 位移贴图使用灰度图
            mat.displacementScale = params.displacementScale
            break
        }

        mat.needsUpdate = true
      })
    modeFolder.open()

    // 参数调节
    const paramFolder = gui.addFolder("⚙️ 参数调节")
    paramFolder
      .add(params, "bumpScale", 0, 0.3, 0.005)
      .name("bumpScale（凹凸强度）")
      .onChange((value) => {
        mat.bumpScale = value
      })

    paramFolder
      .add(params, "normalScale", 0, 3, 0.1)
      .name("normalScale（法线强度）")
      .onChange((value) => {
        if (mat.normalScale) mat.normalScale.set(value, value)
      })

    paramFolder
      .add(params, "displacementScale", 0, 2, 0.05)
      .name("displacementScale（位移强度）")
      .onChange((value) => {
        mat.displacementScale = value
      })

    paramFolder.open()

    // 显示选项
    const displayFolder = gui.addFolder("🎨 显示选项")
    displayFolder
      .add(params, "wireframe")
      .name("线框模式")
      .onChange((value) => {
        mat.wireframe = value
      })

    displayFolder
      .addColor(params, "color")
      .name("材质颜色")
      .onChange((value) => {
        if (mat.color) mat.color.set(value)
      })

    displayFolder.open()

    // 说明信息
    const infoFolder = gui.addFolder("📖 技术说明")
    const info = {
      bump: "凹凸贴图：仅改变光照效果，不改变几何体",
      normal: "法线贴图：更精细的光照模拟，不改变几何体",
      displacement: "位移贴图：实际移动顶点位置，改变几何体"
    }
    for (const [key, value] of Object.entries(info)) {
      const obj: Record<string, string> = {}
      obj[key] = value
      infoFolder.add(obj, key).name(key).listen().disable()
    }
    infoFolder.open()
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理纹理
    if (bumpTexture) {
      bumpTexture.dispose()
      bumpTexture = null
    }
    if (normalTexture) {
      normalTexture.dispose()
      normalTexture = null
    }

    // 清理 GUI
    gui?.destroy()
    gui = null

    // 调用基础清理函数（会遍历清理几何体和材质）
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    if (renderer.value) {
      renderer.value.shadowMap.enabled = true
    }
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
    title="🗺️ NormalMap / BumpMap / DisplacementMap 对比"
    description="三种凹凸贴图技术的原理和效果对比"
  >
    <template #content>
      <div class="info-section">
        <h3>🗺️ 三种贴图模式：</h3>
        <ul>
          <li><strong>BumpMap（凹凸贴图）</strong>：使用灰度图模拟表面凹凸，仅改变光照阴影效果，不实际改变几何体顶点</li>
          <li><strong>NormalMap（法线贴图）</strong>：使用 RGB 贴图模拟每个像素的法线方向，比 BumpMap 更精细</li>
          <li><strong>DisplacementMap（位移贴图）</strong>：根据灰度值实际移动顶点位置，真正改变几何体形状</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 核心原理：</h3>
        <ul>
          <li><strong>BumpMap</strong>：灰度值越高，表面越"凸起"。计算简单，效果一般</li>
          <li><strong>NormalMap</strong>：RGB 分别表示法线的 XYZ 方向，蓝色(128,128,255)为中性法线。光照计算更准确</li>
          <li><strong>DisplacementMap</strong>：灰度值直接映射为顶点位移量。需要高细分几何体才能看到效果</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 关键区别：</p>
        <p><code>BumpMap / NormalMap → 不改变顶点，仅视觉模拟</code></p>
        <p><code>DisplacementMap → 实际移动顶点，真实几何变化</code></p>
        <p><code>DisplacementMap 需要 high-subdivision geometry</code></p>
      </div>

      <div class="controls-tip">
        <p>🎮 操作提示：</p>
        <ul>
          <li>🖱️ 左键拖动：旋转视角</li>
          <li>🖱️ 滚轮：缩放</li>
          <li>🎚️ <strong>贴图模式</strong>：切换 Bump / Normal / Displacement</li>
          <li>🎚️ <strong>各参数滑块</strong>：实时调节贴图强度</li>
          <li>💡 建议开启线框模式观察 Displacement 的顶点变化</li>
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
</style>
