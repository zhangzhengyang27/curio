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
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 0, y: 3, z: 3 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 1,
      maxDistance: 8
    },
    showAxesHelper: false,
    showGridHelper: false
  })

  // GUI 和对象引用
  let gui: GUI | null = null
  let plane: THREE.Mesh | null = null
  let material: THREE.MeshStandardMaterial | null = null
  let bumpTexture: THREE.Texture | null = null
  let normalTexture: THREE.Texture | null = null

  /**
   * 程序化生成凹凸灰度图
   * 用于生成 bumpMap（灰度图）
   */
  const createBumpMap = () => {
    const size = 512
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) return new THREE.CanvasTexture(canvas)

    // 基础灰色（平坦区域）
    ctx.fillStyle = "#808080"
    ctx.fillRect(0, 0, size, size)

    // 添加一些圆形凸起
    const addBump = (x: number, y: number, radius: number, brightness: number) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, `rgb(${brightness}, ${brightness}, ${brightness})`)
      gradient.addColorStop(1, "#808080")
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    // 添加多个随机凸起
    const bumps = [
      { x: 128, y: 128, r: 80, b: 200 },
      { x: 300, y: 100, r: 60, b: 180 },
      { x: 400, y: 250, r: 100, b: 220 },
      { x: 150, y: 350, r: 70, b: 190 },
      { x: 350, y: 380, r: 50, b: 210 },
      { x: 256, y: 256, r: 90, b: 230 }
    ]
    bumps.forEach((b) => addBump(b.x, b.y, b.r, b.b))

    return new THREE.CanvasTexture(canvas)
  }

  /**
   * 基于凹凸灰度图生成法线贴图
   * 简单的 Sobel 边缘检测生成法线
   */
  const createNormalMapFromBump = (bumpCanvas: HTMLCanvasElement) => {
    const size = bumpCanvas.width
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) return new THREE.CanvasTexture(canvas)

    // 获取凹凸图的像素数据
    const bumpCtx = bumpCanvas.getContext("2d")
    if (!bumpCtx) return new THREE.CanvasTexture(canvas)
    const bumpData = bumpCtx.getImageData(0, 0, size, size).data

    // 创建法线图
    const imageData = ctx.createImageData(size, size)
    const data = imageData.data
    const strength = 2.0 // 法线强度

    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        // Sobel 算子计算梯度
        const idx = (y * size + x) * 4
        const left = bumpData[((y) * size + (x - 1)) * 4] / 255
        const right = bumpData[((y) * size + (x + 1)) * 4] / 255
        const up = bumpData[((y - 1) * size + x) * 4] / 255
        const down = bumpData[((y + 1) * size + x) * 4] / 255

        // 计算法线方向
        const dx = (left - right) * strength
        const dy = (up - down) * strength
        const dz = 1.0

        // 归一化并映射到 [0, 255]
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz)
        data[idx] = Math.floor(((dx / len) * 0.5 + 0.5) * 255)     // R
        data[idx + 1] = Math.floor(((dy / len) * 0.5 + 0.5) * 255) // G
        data[idx + 2] = Math.floor(((dz / len) * 0.5 + 0.5) * 255) // B
        data[idx + 3] = 255                                          // A
      }
    }

    // 填充边缘像素
    for (let x = 0; x < size; x++) {
      const topIdx = x * 4
      data[topIdx] = 128; data[topIdx + 1] = 128; data[topIdx + 2] = 255; data[topIdx + 3] = 255
      const bottomIdx = ((size - 1) * size + x) * 4
      data[bottomIdx] = 128; data[bottomIdx + 1] = 128; data[bottomIdx + 2] = 255; data[bottomIdx + 3] = 255
    }
    for (let y = 0; y < size; y++) {
      const leftIdx = (y * size) * 4
      data[leftIdx] = 128; data[leftIdx + 1] = 128; data[leftIdx + 2] = 255; data[leftIdx + 3] = 255
      const rightIdx = (y * size + size - 1) * 4
      data[rightIdx] = 128; data[rightIdx + 1] = 128; data[rightIdx + 2] = 255; data[rightIdx + 3] = 255
    }

    ctx.putImageData(imageData, 0, 0)
    return new THREE.CanvasTexture(canvas)
  }

  /**
   * 创建场景
   */
  const createScene = () => {
    if (!scene.value) return

    // 生成凹凸贴图
    bumpTexture = createBumpMap()
    // 获取凹凸贴图的 canvas 用于生成法线贴图
    const bumpCanvas = bumpTexture.image as HTMLCanvasElement
    normalTexture = createNormalMapFromBump(bumpCanvas)

    // 创建高细分平面
    const planeGeo = new THREE.PlaneGeometry(4, 4, 128, 128)
    material = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.6,
      metalness: 0.1,
      bumpMap: bumpTexture,
      bumpScale: 0.3,
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(1, 1)
    })

    plane = new THREE.Mesh(planeGeo, material)
    plane.rotation.x = -Math.PI / 2
    scene.value.add(plane)

    // 添加方向光（从侧面照射，让凹凸细节清晰可见）
    const dirLight = new THREE.DirectionalLight(0xffffff, 3)
    dirLight.position.set(3, 5, 2)
    scene.value.add(dirLight)

    // 添加辅助方向光
    const dirLight2 = new THREE.DirectionalLight(0x8888ff, 1)
    dirLight2.position.set(-3, 3, -2)
    scene.value.add(dirLight2)

    // 环境光
    const ambLight = new THREE.AmbientLight(0x404040, 0.5)
    scene.value.add(ambLight)
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    const params = {
      mode: "normalMap",
      bumpScale: 0.3,
      normalScale: 1.0
    }

    const folder = gui.addFolder("🔄 凹凸 vs 法线 对比")

    folder
      .add(params, "mode", ["normalMap", "bumpMap", "both", "none"])
      .name("贴图模式")
      .onChange((v) => {
        if (!material) return
        switch (v) {
          case "normalMap":
            material.normalMap = normalTexture
            material.bumpMap = null
            break
          case "bumpMap":
            material.normalMap = null
            material.bumpMap = bumpTexture
            break
          case "both":
            material.normalMap = normalTexture
            material.bumpMap = bumpTexture
            break
          case "none":
            material.normalMap = null
            material.bumpMap = null
            break
        }
        material.needsUpdate = true
      })

    folder
      .add(params, "bumpScale", 0, 1, 0.01)
      .name("凹凸强度 (bumpScale)")
      .onChange((v) => {
        if (material) material.bumpScale = v
      })

    folder
      .add(params, "normalScale", 0, 3, 0.1)
      .name("法线强度 (normalScale)")
      .onChange((v) => {
        if (material) material.normalScale?.set(v, v)
      })

    folder.open()

    // 说明信息
    const infoFolder = gui.addFolder("📋 说明")
    infoFolder
      .add(
        {
          info: "NormalMap: RGB 法线方向，效果更好但生成复杂"
        },
        "info"
      )
      .name("法线贴图")
      .disable()
    infoFolder
      .add(
        {
          info: "BumpMap: 灰度高度图，简单但效果有限"
        },
        "info"
      )
      .name("凹凸贴图")
      .disable()
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    bumpTexture?.dispose()
    normalTexture?.dispose()
    bumpTexture = normalTexture = null

    material?.dispose()
    material = null

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
    title="🔄 法线贴图与凹凸贴图对比"
    description="对比 NormalMap 和 BumpMap 的效果差异，理解两种凹凸模拟技术的优劣"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🌊 <strong>法线贴图 (NormalMap)</strong> - RGB 编码法线方向，凹凸效果更真实</li>
          <li>⛰️ <strong>凹凸贴图 (BumpMap)</strong> - 灰度高度图，简单易生成</li>
          <li>🔄 <strong>模式切换</strong> - 在 GUI 中切换不同贴图模式进行对比</li>
          <li>🎛️ <strong>参数调节</strong> - 分别调节 bumpScale 和 normalScale</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 NormalMap vs BumpMap：</h3>
        <ul>
          <li><strong>NormalMap</strong> - RGB 三个通道分别编码 XYZ 法线方向，能正确响应光照角度</li>
          <li><strong>BumpMap</strong> - 灰度值表示高度，通过扰动感色器法线来模拟凹凸</li>
          <li><strong>效果</strong> - NormalMap 在斜角光照下表现更准确，BumpMap 在极端角度会失真</li>
          <li><strong>生成</strong> - BumpMap 更容易制作，NormalMap 通常从高模烘焙或由 BumpMap 转换</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 使用建议：</h3>
        <ul>
          <li>🔸 性能敏感场景可使用 BumpMap（GPU 计算量更小）</li>
          <li>🔸 追求视觉效果优先使用 NormalMap</li>
          <li>🔸 两者可以同时使用叠加效果（模式设为 "both"）</li>
          <li>🔸 本示例的法线贴图由凹凸贴图通过 Sobel 算子转换生成</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>// 使用凹凸贴图</code></p>
        <p><code>material.bumpMap = bumpTexture</code></p>
        <p><code>material.bumpScale = 0.3</code></p>
        <br>
        <p><code>// 使用法线贴图</code></p>
        <p><code>material.normalMap = normalTexture</code></p>
        <p><code>material.normalScale.set(1, 1)</code></p>
      </div>

      <div class="controls-tip">
        <p>🎮 操作提示：</p>
        <ul style="margin-top: 8px">
          <li>• 切换"贴图模式"对比 NormalMap 和 BumpMap 效果</li>
          <li>• 拖动相机到侧面观察凹凸效果差异</li>
          <li>• 调节强度参数观察凹凸深浅变化</li>
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
