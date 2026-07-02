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
    renderer: _renderer,
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 0, y: 2, z: 8 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 2,
      maxDistance: 20
    },
    showAxesHelper: false,
    showGridHelper: false
  })

  // GUI 和对象引用
  let gui: GUI | null = null
  let wireframeMeshes: { mesh: THREE.Mesh; material: THREE.MeshBasicMaterial }[] = []
  let pointsSystem: THREE.Points | null = null
  let pointsMaterial: THREE.PointsMaterial | null = null
  let circleTexture: THREE.Texture | null = null

  /**
   * 使用 Canvas 创建自定义圆形点纹理
   * 默认点显示为方块，使用圆形纹理使点更美观
   */
  const createCircleTexture = () => {
    const size = 64
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")!

    // 从中心到边缘的径向渐变，产生柔和的圆形粒子
    const center = size / 2
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)")     // 中心完全不透明
    gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.8)") // 过渡区域
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)")     // 边缘完全透明

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    const texture = new THREE.CanvasTexture(canvas)
    return texture
  }

  /**
   * 创建线框展示区域（左侧）
   */
  const createWireframeSection = () => {
    if (!scene.value) return

    const geometries = [
      { geo: new THREE.BoxGeometry(1, 1, 1), name: "BoxGeometry" },
      { geo: new THREE.SphereGeometry(0.6, 16, 16), name: "SphereGeometry" },
      { geo: new THREE.TorusGeometry(0.5, 0.2, 12, 24), name: "TorusGeometry" },
      { geo: new THREE.ConeGeometry(0.5, 1, 12), name: "ConeGeometry" },
      { geo: new THREE.TorusKnotGeometry(0.4, 0.15, 64, 8), name: "TorusKnotGeometry" }
    ]

    const colors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0xa8e6cf, 0xdda0dd]

    // 排列成一行
    geometries.forEach((item, index) => {
      const material = new THREE.MeshBasicMaterial({
        color: colors[index],
        wireframe: true
      })

      const mesh = new THREE.Mesh(item.geo, material)
      mesh.position.set((index - 2) * 1.8, 2.5, 0)
      scene.value?.add(mesh)

      wireframeMeshes.push({ mesh, material })
    })
  }

  /**
   * 创建点云展示区域（右侧/下方）
   * 5000个随机点分布在球体表面
   */
  const createPointsSection = () => {
    if (!scene.value) return

    const count = 5000
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    // 在球体表面均匀分布点
    for (let i = 0; i < count; i++) {
      // 使用球坐标系随机生成表面点
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 2

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      // 根据位置设置颜色（上暖下冷）
      const t = (positions[i * 3 + 1] + radius) / (2 * radius) // 0~1
      colors[i * 3] = 0.2 + t * 0.8      // R
      colors[i * 3 + 1] = 0.5 + t * 0.3  // G
      colors[i * 3 + 2] = 1.0 - t * 0.5  // B
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))

    // 创建圆形点纹理
    circleTexture = createCircleTexture()

    // 点云材质
    pointsMaterial = new THREE.PointsMaterial({
      size: 0.08,
      sizeAttenuation: true,
      map: circleTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    })

    pointsSystem = new THREE.Points(geometry, pointsMaterial)
    pointsSystem.position.set(0, -1.5, 0)
    scene.value.add(pointsSystem)
  }

  /**
   * 创建场景
   */
  const createScene = () => {
    if (!scene.value) return

    // 设置深色背景
    scene.value.background = new THREE.Color(0x0a0a1a)

    // 创建线框区域
    createWireframeSection()

    // 创建点云区域
    createPointsSection()

    // 添加简单光照（点云和线框不需要复杂光照，但有助于场景氛围）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.value.add(ambientLight)

    console.log("线框与点云材质场景创建成功")
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()
    gui.title("线框与点云材质控制")

    // 线框控制
    const wireframeFolder = gui.addFolder("🔲 线框控制")
    const wireParams = {
      wireframe: true,
      autoRotate: true
    }

    wireframeFolder
      .add(wireParams, "wireframe")
      .name("线框模式")
      .onChange((value) => {
        wireframeMeshes.forEach((item) => {
          item.material.wireframe = value
        })
      })

    wireframeFolder
      .add(wireParams, "autoRotate")
      .name("线框旋转")

    wireframeFolder.open()

    // 点云控制
    const pointsFolder = gui.addFolder("✨ 点云控制")
    const pointParams = {
      size: 0.08,
      sizeAttenuation: true,
      rotationSpeed: 0.3,
      useCircleTexture: true,
      blending: "AdditiveBlending"
    }

    pointsFolder
      .add(pointParams, "size", 0.01, 0.5, 0.01)
      .name("点大小")
      .onChange((value) => {
        if (pointsMaterial) pointsMaterial.size = value
      })

    pointsFolder
      .add(pointParams, "sizeAttenuation")
      .name("深度衰减")
      .onChange((value) => {
        if (pointsMaterial) {
          pointsMaterial.sizeAttenuation = value
          pointsMaterial.needsUpdate = true
        }
      })

    pointsFolder
      .add(pointParams, "useCircleTexture")
      .name("圆形纹理")
      .onChange((value) => {
        if (pointsMaterial) {
          pointsMaterial.map = value ? circleTexture : null
          pointsMaterial.needsUpdate = true
        }
      })

    pointsFolder
      .add(pointParams, "blending", ["NormalBlending", "AdditiveBlending"])
      .name("混合模式")
      .onChange((value) => {
        if (pointsMaterial) {
          pointsMaterial.blending = value === "AdditiveBlending"
            ? THREE.AdditiveBlending
            : THREE.NormalBlending
          pointsMaterial.needsUpdate = true
        }
      })

    pointsFolder
      .add(pointParams, "rotationSpeed", 0, 1, 0.05)
      .name("旋转速度")

    pointsFolder.open()

    // 技术说明
    const infoFolder = gui.addFolder("📖 技术说明")
    const info = {
      wireframe: "wireframe=true → 只渲染线框，不渲染面",
      Points: "THREE.Points → 粒子/点云系统",
      PointsMaterial: "点材质，控制大小、颜色、衰减",
      "圆形纹理": "Canvas 生成径向渐变纹理替代方块",
      sizeAttenuation: "深度衰减：近大远小效果",
      "AdditiveBlending": "加法混合：重叠区域更亮"
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
    // 清理圆形纹理
    if (circleTexture) {
      circleTexture.dispose()
      circleTexture = null
    }

    // 清理引用
    wireframeMeshes = []
    pointsSystem = null
    pointsMaterial = null

    // 清理 GUI
    gui?.destroy()
    gui = null

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    createScene()
    initGUI()

    startAnimation(() => {
      if (!scene.value) return

      // 线框几何体旋转
      wireframeMeshes.forEach((item, _index) => {
        item.mesh.rotation.x += 0.003
        item.mesh.rotation.y += 0.005
      })

      // 点云旋转
      if (pointsSystem) {
        pointsSystem.rotation.y += 0.002
        pointsSystem.rotation.x += 0.001
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
    title="🔲 线框与点云材质"
    description="Wireframe 模式、Points 点云和自定义圆形点纹理"
  >
    <template #content>
      <div class="info-section">
        <h3>🔲 三个展示区域：</h3>
        <ul>
          <li><strong>Wireframe 模式</strong>（上方）：5种几何体的线框渲染，展示网格结构</li>
          <li><strong>Points 点云</strong>（下方）：5000个点分布在球体表面，加法混合发光</li>
          <li><strong>圆形纹理</strong>：Canvas 径向渐变替代默认方块点</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 核心概念：</h3>
        <ul>
          <li><strong>MeshBasicMaterial.wireframe</strong>：最简单的线框方式，只渲染三角形边</li>
          <li><strong>THREE.Points</strong>：高性能粒子系统，每个粒子是一个顶点</li>
          <li><strong>PointsMaterial</strong>：控制粒子大小、颜色、衰减、混合模式</li>
          <li><strong>自定义纹理</strong>：用 Canvas 绘制圆形渐变，使粒子显示为柔和的圆点</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 自定义圆形点纹理：</p>
        <p><code>// Canvas 径向渐变</code></p>
        <p><code>const grad = ctx.createRadialGradient(c,c,0, c,c,r)</code></p>
        <p><code>grad.addColorStop(0, "rgba(255,255,255,1)")</code></p>
        <p><code>grad.addColorStop(1, "rgba(255,255,255,0)")</code></p>
      </div>

      <div class="controls-tip">
        <p>🎮 操作提示：</p>
        <ul>
          <li>🖱️ 左键拖动：旋转视角</li>
          <li>🖱️ 滚轮：缩放</li>
          <li>🎚️ 线框开关：切换面/线框渲染</li>
          <li>🎚️ 点大小、深度衰减、混合模式</li>
          <li>🎚️ 圆形纹理开关：对比方块和圆形效果</li>
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
