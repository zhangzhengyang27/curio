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
    cameraPosition: { x: 0, y: 2, z: 5 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 2,
      maxDistance: 10
    },
    showAxesHelper: false,
    showGridHelper: false
  })

  // GUI 和对象引用
  let gui: GUI | null = null
  let textures: THREE.Texture[] = []
  let mainObject: THREE.Mesh | null = null
  let mainMaterial: THREE.MeshBasicMaterial | null = null

  /**
   * 程序化生成棋盘格纹理
   */
  const createCheckerTexture = () => {
    const size = 512
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) return new THREE.CanvasTexture(canvas)

    const tileSize = 32
    for (let y = 0; y < size; y += tileSize) {
      for (let x = 0; x < size; x += tileSize) {
        const isWhite = ((x / tileSize) + (y / tileSize)) % 2 === 0
        ctx.fillStyle = isWhite ? "#ffffff" : "#333333"
        ctx.fillRect(x, y, tileSize, tileSize)
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }

  /**
   * 程序化生成渐变纹理
   */
  const createGradientTexture = () => {
    const size = 512
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) return new THREE.CanvasTexture(canvas)

    const gradient = ctx.createLinearGradient(0, 0, size, size)
    gradient.addColorStop(0, "#ff0000")
    gradient.addColorStop(0.25, "#ff8800")
    gradient.addColorStop(0.5, "#ffff00")
    gradient.addColorStop(0.75, "#00ff00")
    gradient.addColorStop(1, "#0088ff")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }

  /**
   * 创建场景
   */
  const createScene = () => {
    if (!scene.value || !renderer.value) return

    // 生成纹理
    const checkerTex = createCheckerTexture()
    const gradientTex = createGradientTexture()
    textures.push(checkerTex, gradientTex)

    // 创建主物体（使用棋盘格纹理展示过滤模式差异）
    const geo = new THREE.PlaneGeometry(4, 4)
    mainMaterial = new THREE.MeshBasicMaterial({ map: checkerTex })
    mainObject = new THREE.Mesh(geo, mainMaterial)
    mainObject.rotation.x = -Math.PI / 3
    mainObject.position.set(0, 1, 0)
    scene.value.add(mainObject)

    // 创建辅助物体（渐变纹理球体）
    const sphereGeo = new THREE.SphereGeometry(0.6, 32, 32)
    const sphereMat = new THREE.MeshBasicMaterial({ map: gradientTex })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    sphere.position.set(-2.5, 1, 1)
    scene.value.add(sphere)

    // 地面
    const floorGeo = new THREE.PlaneGeometry(10, 10)
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    scene.value.add(floor)

    // 灯光
    const dirLight = new THREE.DirectionalLight(0xffffff, 2)
    dirLight.position.set(3, 5, 3)
    scene.value.add(dirLight)
    const ambLight = new THREE.AmbientLight(0x404040, 1)
    scene.value.add(ambLight)
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    const params = {
      filterMode: "LinearFilter",
      anisotropy: 1,
      generateMipmaps: true,
      wrapS: "RepeatWrapping",
      wrapT: "RepeatWrapping"
    }

    // 纹理过滤模式
    const filterFolder = gui.addFolder("🔍 纹理过滤模式")
    filterFolder
      .add(params, "filterMode", ["NearestFilter", "LinearFilter"])
      .name("过滤模式")
      .onChange((v) => {
        const filter = v === "NearestFilter" ? THREE.NearestFilter : THREE.LinearFilter
        textures.forEach((tex) => {
          tex.minFilter = filter
          tex.magFilter = filter
          tex.needsUpdate = true
        })
      })

    filterFolder
      .add(params, "anisotropy", 1, 16, 1)
      .name("各向异性过滤级别")
      .onChange((v) => {
        textures.forEach((tex) => {
          tex.anisotropy = Math.min(v, renderer.value?.capabilities.getMaxAnisotropy() || 16)
          tex.needsUpdate = true
        })
      })

    filterFolder
      .add(params, "generateMipmaps")
      .name("生成 Mipmap")
      .onChange((v) => {
        textures.forEach((tex) => {
          tex.generateMipmaps = v
          tex.needsUpdate = true
        })
      })
    filterFolder.open()

    // 包裹模式
    const wrapFolder = gui.addFolder("📐 包裹模式")
    wrapFolder
      .add(params, "wrapS", ["ClampToEdge", "RepeatWrapping", "MirroredRepeat"])
      .name("水平包裹 (wrapS)")
      .onChange((v) => {
        const wrap =
          v === "ClampToEdge"
            ? THREE.ClampToEdgeWrapping
            : v === "RepeatWrapping"
              ? THREE.RepeatWrapping
              : THREE.MirroredRepeatWrapping
        textures.forEach((tex) => {
          tex.wrapS = wrap
          tex.needsUpdate = true
        })
      })

    wrapFolder
      .add(params, "wrapT", ["ClampToEdge", "RepeatWrapping", "MirroredRepeat"])
      .name("垂直包裹 (wrapT)")
      .onChange((v) => {
        const wrap =
          v === "ClampToEdge"
            ? THREE.ClampToEdgeWrapping
            : v === "RepeatWrapping"
              ? THREE.RepeatWrapping
              : THREE.MirroredRepeatWrapping
        textures.forEach((tex) => {
          tex.wrapT = wrap
          tex.needsUpdate = true
        })
      })
    wrapFolder.open()

    // 内存信息
    const memFolder = gui.addFolder("💾 纹理内存信息")
    const memParams = {
      textures: "0",
      geometries: "0"
    }

    memFolder.add(memParams, "textures").name("纹理数量").disable()
    memFolder.add(memParams, "geometries").name("几何体数量").disable()

    // 每帧更新内存信息
    const updateMemInfo = () => {
      if (renderer.value && gui) {
        const info = renderer.value.info
        memParams.textures = String(info.memory.textures)
        memParams.geometries = String(info.memory.geometries)
        gui.controllersRecursive().forEach((c) => {
          if (c.property === "textures" || c.property === "geometries") {
            c.updateDisplay()
          }
        })
      }
    }
    memFolder.open()

    // 格式说明
    const formatFolder = gui.addFolder("📋 纹理格式对比")
    formatFolder.add({ info: "PNG: 无损压缩，文件较大" }, "info").name("PNG (无损/大)").disable()
    formatFolder.add({ info: "JPEG: 有损压缩，文件较小" }, "info").name("JPEG (有损/小)").disable()
    formatFolder.add({ info: "KTX2: GPU 压缩，显存最小" }, "info").name("KTX2 (GPU压缩/最小)").disable()
    formatFolder.add({ info: "Basis: 通用压缩，兼容性好" }, "info").name("Basis (通用压缩)").disable()
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    textures.forEach((t) => t?.dispose())
    textures = []

    mainMaterial?.dispose()
    mainMaterial = null

    gui?.destroy()
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
    title="📦 纹理格式与压缩"
    description="探索纹理过滤模式、各向异性过滤、Mipmap 等属性对渲染效果和性能的影响"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🔍 <strong>过滤模式</strong> - NearestFilter vs LinearFilter 对比</li>
          <li>📐 <strong>各向异性过滤</strong> - 消除纹理倾斜时的模糊</li>
          <li>🗺️ <strong>Mipmap 控制</strong> - 开关 Mipmap 观察远处纹理质量</li>
          <li>💾 <strong>内存信息</strong> - 实时显示 renderer.info.memory</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 纹理过滤模式：</h3>
        <ul>
          <li><strong>NearestFilter</strong> - 最近邻采样，像素化效果，性能最好</li>
          <li><strong>LinearFilter</strong> - 线性插值，平滑过渡，默认模式</li>
          <li>💡 远处缩小用 minFilter，近处放大用 magFilter</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📐 各向异性过滤：</h3>
        <ul>
          <li>解决纹理在倾斜角度下的模糊问题</li>
          <li>级别越高，远处倾斜面越清晰，但性能开销越大</li>
          <li>最大级别取决于 GPU（通常为 16）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📋 纹理格式对比：</h3>
        <ul>
          <li><strong>PNG</strong> - 无损压缩，支持透明通道，文件较大</li>
          <li><strong>JPEG</strong> - 有损压缩，不支持透明，文件较小</li>
          <li><strong>KTX2</strong> - GPU 原生压缩格式（ASTC/BC7），显存占用最小</li>
          <li><strong>Basis Universal</strong> - 跨平台通用压缩，兼容性好</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>texture.minFilter = THREE.LinearFilter</code></p>
        <p><code>texture.magFilter = THREE.NearestFilter</code></p>
        <p><code>texture.anisotropy = renderer.capabilities.getMaxAnisotropy()</code></p>
        <p><code>texture.generateMipmaps = true</code></p>
        <br>
        <p><code>// 查看纹理内存</code></p>
        <p><code>renderer.info.memory.textures // 纹理数量</code></p>
        <p><code>renderer.info.memory.geometries // 几何体数量</code></p>
      </div>

      <div class="controls-tip">
        <p>🎮 操作提示：</p>
        <ul style="margin-top: 8px">
          <li>• 切换 NearestFilter 观察像素化效果</li>
          <li>• 调高各向异性过滤级别，观察倾斜面清晰度</li>
          <li>• 关闭 Mipmap 后拉远观察远处纹理闪烁</li>
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
