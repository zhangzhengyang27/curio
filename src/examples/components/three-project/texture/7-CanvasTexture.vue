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
    cameraPosition: { x: 0, y: 2, z: 5 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 2,
      maxDistance: 12
    },
    showAxesHelper: false,
    showGridHelper: false
  })

  // GUI 和对象引用
  let gui: GUI | null = null
  let clockCanvas: HTMLCanvasElement | null = null
  let clockCtx: CanvasRenderingContext2D | null = null
  let clockTexture: THREE.CanvasTexture | null = null
  let counterCanvas: HTMLCanvasElement | null = null
  let counterCtx: CanvasRenderingContext2D | null = null
  let counterTexture: THREE.CanvasTexture | null = null
  let shapeCanvas: HTMLCanvasElement | null = null
  let shapeCtx: CanvasRenderingContext2D | null = null
  let shapeTexture: THREE.CanvasTexture | null = null
  // 计数器值
  let counterValue = 0
  // 更新频率控制
  let updateInterval = 100 // ms
  let lastUpdateTime = 0
  // 动画帧时间
  let clock = new THREE.Clock()

  /**
   * 创建时钟 Canvas 和纹理
   */
  const createClockCanvas = () => {
    clockCanvas = document.createElement("canvas")
    clockCanvas.width = 512
    clockCanvas.height = 512
    clockCtx = clockCanvas.getContext("2d")
    if (!clockCtx) return new THREE.CanvasTexture(clockCanvas)
    clockTexture = new THREE.CanvasTexture(clockCanvas)
    return clockTexture
  }

  /**
   * 更新时钟 Canvas 内容
   */
  const updateClockCanvas = () => {
    if (!clockCtx) return

    const ctx = clockCtx
    const size = 512

    // 清除画布
    ctx.fillStyle = "#1a1a2e"
    ctx.fillRect(0, 0, size, size)

    // 获取当前时间
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")
    const seconds = String(now.getSeconds()).padStart(2, "0")

    // 绘制边框
    ctx.strokeStyle = "#42b983"
    ctx.lineWidth = 4
    ctx.strokeRect(10, 10, size - 20, size - 20)

    // 绘制标题
    ctx.fillStyle = "#42b983"
    ctx.font = "bold 32px monospace"
    ctx.textAlign = "center"
    ctx.fillText("实时时钟", size / 2, 60)

    // 绘制时间
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 80px monospace"
    ctx.fillText(`${hours}:${minutes}`, size / 2, size / 2 - 10)

    // 绘制秒数
    ctx.fillStyle = "#ff6b6b"
    ctx.font = "bold 48px monospace"
    ctx.fillText(seconds, size / 2, size / 2 + 60)

    // 绘制日期
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    ctx.fillStyle = "#888888"
    ctx.font = "24px monospace"
    ctx.fillText(dateStr, size / 2, size / 2 + 120)

    // 标记纹理需要更新
    if (clockTexture) clockTexture.needsUpdate = true
  }

  /**
   * 创建计数器 Canvas 和纹理
   */
  const createCounterCanvas = () => {
    counterCanvas = document.createElement("canvas")
    counterCanvas.width = 512
    counterCanvas.height = 512
    counterCtx = counterCanvas.getContext("2d")
    if (!counterCtx) return new THREE.CanvasTexture(counterCanvas)
    counterTexture = new THREE.CanvasTexture(counterCanvas)
    return counterTexture
  }

  /**
   * 更新计数器 Canvas 内容
   */
  const updateCounterCanvas = () => {
    if (!counterCtx) return

    const ctx = counterCtx
    const size = 512

    // 清除画布
    ctx.fillStyle = "#2d1b69"
    ctx.fillRect(0, 0, size, size)

    // 绘制边框
    ctx.strokeStyle = "#ffd93d"
    ctx.lineWidth = 4
    ctx.strokeRect(10, 10, size - 20, size - 20)

    // 绘制标题
    ctx.fillStyle = "#ffd93d"
    ctx.font = "bold 32px monospace"
    ctx.textAlign = "center"
    ctx.fillText("动态计数器", size / 2, 60)

    // 绘制计数器值
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 120px monospace"
    ctx.fillText(String(counterValue), size / 2, size / 2 + 30)

    // 绘制进度条
    const progress = (counterValue % 100) / 100
    const barWidth = size - 80
    ctx.fillStyle = "#444444"
    ctx.fillRect(40, size / 2 + 80, barWidth, 20)
    ctx.fillStyle = "#ffd93d"
    ctx.fillRect(40, size / 2 + 80, barWidth * progress, 20)

    // 绘制百分比
    ctx.fillStyle = "#aaaaaa"
    ctx.font = "24px monospace"
    ctx.fillText(`${(progress * 100).toFixed(0)}%`, size / 2, size / 2 + 140)

    // 标记纹理需要更新
    if (counterTexture) counterTexture.needsUpdate = true
  }

  /**
   * 创建图形 Canvas 和纹理
   */
  const createShapeCanvas = () => {
    shapeCanvas = document.createElement("canvas")
    shapeCanvas.width = 512
    shapeCanvas.height = 512
    shapeCtx = shapeCanvas.getContext("2d")
    if (!shapeCtx) return new THREE.CanvasTexture(shapeCanvas)
    shapeTexture = new THREE.CanvasTexture(shapeCanvas)
    return shapeTexture
  }

  /**
   * 更新图形 Canvas 内容（动态旋转图形）
   */
  const updateShapeCanvas = (time: number) => {
    if (!shapeCtx) return

    const ctx = shapeCtx
    const size = 512
    const cx = size / 2
    const cy = size / 2

    // 清除画布
    ctx.fillStyle = "#0d1b2a"
    ctx.fillRect(0, 0, size, size)

    // 绘制边框
    ctx.strokeStyle = "#00d2ff"
    ctx.lineWidth = 4
    ctx.strokeRect(10, 10, size - 20, size - 20)

    // 绘制标题
    ctx.fillStyle = "#00d2ff"
    ctx.font = "bold 28px monospace"
    ctx.textAlign = "center"
    ctx.fillText("动态图形", cx, 50)

    // 绘制旋转的多边形
    const colors = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6b9d"]
    for (let i = 0; i < 5; i++) {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(time * (0.5 + i * 0.2) + (i * Math.PI) / 5)
      ctx.strokeStyle = colors[i]
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.8

      // 绘制多边形
      const sides = 3 + i
      const radius = 80 + i * 25
      ctx.beginPath()
      for (let j = 0; j <= sides; j++) {
        const angle = (j / sides) * Math.PI * 2
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        if (j === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
      ctx.restore()
    }

    // 绘制中心脉冲圆
    const pulseRadius = 30 + Math.sin(time * 3) * 15
    ctx.beginPath()
    ctx.arc(cx, cy, Math.max(1, pulseRadius), 0, Math.PI * 2)
    ctx.fillStyle = "#00d2ff"
    ctx.globalAlpha = 0.3
    ctx.fill()
    ctx.globalAlpha = 1.0

    // 标记纹理需要更新
    if (shapeTexture) shapeTexture.needsUpdate = true
  }

  /**
   * 创建场景
   */
  const createScene = () => {
    if (!scene.value) return

    // 创建时钟平面
    const clockTex = createClockCanvas()
    const clockGeo = new THREE.PlaneGeometry(2, 2)
    const clockMat = new THREE.MeshBasicMaterial({ map: clockTex })
    const clockPlane = new THREE.Mesh(clockGeo, clockMat)
    clockPlane.position.set(-3, 1.5, 0)
    scene.value.add(clockPlane)

    // 创建计数器立方体
    const counterTex = createCounterCanvas()
    const counterGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5)
    const counterMat = new THREE.MeshBasicMaterial({ map: counterTex })
    const counterCube = new THREE.Mesh(counterGeo, counterMat)
    counterCube.position.set(0, 1.5, 0)
    scene.value.add(counterCube)

    // 创建图形球体
    const shapeTex = createShapeCanvas()
    const shapeGeo = new THREE.SphereGeometry(1, 32, 32)
    const shapeMat = new THREE.MeshBasicMaterial({ map: shapeTex })
    const shapeSphere = new THREE.Mesh(shapeGeo, shapeMat)
    shapeSphere.position.set(3, 1.5, 0)
    scene.value.add(shapeSphere)

    // 添加灯光（虽然用 BasicMaterial 不需要灯光，但为了场景完整性）
    const ambLight = new THREE.AmbientLight(0xffffff, 1)
    scene.value.add(ambLight)

    // 添加地面
    const floorGeo = new THREE.PlaneGeometry(12, 6)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    scene.value.add(floor)

    // 添加方向光
    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(5, 8, 5)
    scene.value.add(dirLight)
  }

  /**
   * 动画回调
   */
  const animateCallback = () => {
    const elapsed = clock.getElapsedTime()
    const now = performance.now()

    // 根据更新频率控制更新
    if (now - lastUpdateTime >= updateInterval) {
      lastUpdateTime = now
      counterValue++
      updateClockCanvas()
      updateCounterCanvas()
      updateShapeCanvas(elapsed)
    }
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    const params = {
      updateFrequency: 100,
      pause: false
    }

    const folder = gui.addFolder("⏱️ 更新控制")
    folder
      .add(params, "updateFrequency", 16, 1000, 16)
      .name("更新间隔 (ms)")
      .onChange((v) => {
        updateInterval = v
      })
    folder
      .add(params, "pause")
      .name("暂停更新")
      .onChange((v) => {
        if (v) {
          updateInterval = Infinity
        } else {
          updateInterval = params.updateFrequency
        }
      })
    folder.open()

    const infoFolder = gui.addFolder("📋 说明")
    infoFolder.add({ info: "左侧平面: 实时时钟" }, "info").name("时钟平面").disable()
    infoFolder.add({ info: "中间立方体: 动态计数器" }, "info").name("计数器立方体").disable()
    infoFolder.add({ info: "右侧球体: 旋转图形" }, "info").name("图形球体").disable()
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    clockTexture?.dispose()
    counterTexture?.dispose()
    shapeTexture?.dispose()
    clockTexture = counterTexture = shapeTexture = null
    clockCanvas = counterCanvas = shapeCanvas = null
    clockCtx = counterCtx = shapeCtx = null

    gui?.destroy()
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    createScene()
    initGUI()
    startAnimation(animateCallback)
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🖼️ 动态 Canvas 纹理"
    description="使用 CanvasTexture 将动态 Canvas 内容实时映射到 3D 物体表面"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>⏰ <strong>实时时钟</strong> - 在 3D 平面上显示当前时间</li>
          <li>🔢 <strong>动态计数器</strong> - 立方体表面显示实时递增的数字</li>
          <li>🌀 <strong>旋转图形</strong> - 球体表面绘制动态旋转的几何图形</li>
          <li>⏱️ <strong>更新频率控制</strong> - 通过 GUI 调节纹理更新频率</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 CanvasTexture 原理：</h3>
        <ul>
          <li>使用 Canvas 2D API 绘制内容</li>
          <li>将 Canvas 元素传给 <code>THREE.CanvasTexture</code></li>
          <li>每帧更新 Canvas 内容后设置 <code>texture.needsUpdate = true</code></li>
          <li>GPU 会在下次渲染时重新上传纹理数据</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 性能提示：</h3>
        <ul>
          <li>🔸 频繁更新纹理会消耗 GPU 带宽</li>
          <li>🔸 建议根据需求合理设置更新频率</li>
          <li>🔸 Canvas 尺寸不宜过大（512x512 通常是合理选择）</li>
          <li>🔸 16ms = 约 60FPS，100ms = 约 10FPS</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>const canvas = document.createElement('canvas')</code></p>
        <p><code>const texture = new THREE.CanvasTexture(canvas)</code></p>
        <br>
        <p><code>// 在动画循环中更新</code></p>
        <p><code>ctx.fillStyle = '#ff0000'</code></p>
        <p><code>ctx.fillRect(0, 0, 512, 512)</code></p>
        <p><code>texture.needsUpdate = true // 必须设置！</code></p>
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
