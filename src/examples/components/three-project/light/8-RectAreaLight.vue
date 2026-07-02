<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { RectAreaLightHelper } from "three/examples/jsm/helpers/RectAreaLightHelper.js"
  import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 容器引用
  const containerRef = shallowRef(null)

  // 使用公共的 Three.js 场景逻辑
  const {
    scene,
    renderer,
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 4, y: 4, z: 4 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 2,
      maxDistance: 15
    },
    showAxesHelper: false,
    showGridHelper: false
  })

  // GUI 和对象引用
  let gui: GUI | null = null
  let rectLight: THREE.RectAreaLight | null = null
  let rectLightHelper: RectAreaLightHelper | null = null

  /**
   * 创建场景
   */
  const createScene = () => {
    const s = scene.value
    const r = renderer.value
    if (!s || !r) return

    // ⚠️ 重要：必须在使用 RectAreaLight 之前初始化 UniformsLib
    RectAreaLightUniformsLib.init()

    // 设置场景背景为深色（模拟暗室）
    s.background = new THREE.Color(0x111111)

    // 创建矩形面光
    rectLight = new THREE.RectAreaLight(0xffffff, 5, 3, 3)
    rectLight.position.set(0, 4, 0)
    rectLight.lookAt(0, 0, 0)
    s.add(rectLight)

    // 创建面光 Helper
    rectLightHelper = new RectAreaLightHelper(rectLight)
    rectLightHelper.position.copy(rectLight.position)
    rectLightHelper.lookAt(0, 0, 0)
    s.add(rectLightHelper)

    // 桌面
    const tableGeo = new THREE.BoxGeometry(6, 0.2, 4)
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.6,
      metalness: 0.1
    })
    const table = new THREE.Mesh(tableGeo, tableMat)
    table.position.set(0, 0.8, 0)
    s.add(table)

    // 桌腿
    const legGeo = new THREE.BoxGeometry(0.15, 0.8, 0.15)
    const legMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.7 })
    const legPositions = [
      [-2.5, 0.4, -1.5],
      [2.5, 0.4, -1.5],
      [-2.5, 0.4, 1.5],
      [2.5, 0.4, 1.5]
    ]
    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeo, legMat)
      leg.position.set(pos[0], pos[1], pos[2])
      s.add(leg)
    })

    // 桌上物品 - 球体（金属）
    const sphereGeo = new THREE.SphereGeometry(0.4, 32, 32)
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.9,
      roughness: 0.1
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    sphere.position.set(-1.5, 1.4, 0)
    s.add(sphere)

    // 桌上物品 - 立方体（塑料）
    const boxGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6)
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      metalness: 0.0,
      roughness: 0.3
    })
    const box = new THREE.Mesh(boxGeo, boxMat)
    box.position.set(0, 1.2, 0)
    s.add(box)

    // 桌上物品 - 圆环结（蓝色）
    const torusGeo = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 16)
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x4488ff,
      metalness: 0.5,
      roughness: 0.2
    })
    const torus = new THREE.Mesh(torusGeo, torusMat)
    torus.position.set(1.5, 1.3, 0)
    s.add(torus)

    // 地面
    const floorGeo = new THREE.PlaneGeometry(15, 15)
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    s.add(floor)

    // 微弱环境光（模拟环境反射）
    const ambLight = new THREE.AmbientLight(0x222222, 0.5)
    s.add(ambLight)

    // 启用阴影（RectAreaLight 本身不支持阴影，但其他光源可以）
    r.shadowMap.enabled = false
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    const params = {
      width: 3,
      height: 3,
      color: "#ffffff",
      intensity: 5,
      showHelper: true,
      lightX: 0,
      lightY: 4,
      lightZ: 0
    }

    const folder = gui.addFolder("💡 矩形面光控制")

    folder
      .add(params, "width", 0.5, 10, 0.5)
      .name("宽度 (width)")
      .onChange((v) => {
        if (rectLight) rectLight.width = v
      })

    folder
      .add(params, "height", 0.5, 10, 0.5)
      .name("高度 (height)")
      .onChange((v) => {
        if (rectLight) rectLight.height = v
      })

    folder
      .addColor(params, "color")
      .name("颜色 (color)")
      .onChange((v) => {
        if (rectLight) rectLight.color.set(v)
      })

    folder
      .add(params, "intensity", 0, 20, 0.5)
      .name("强度 (intensity)")
      .onChange((v) => {
        if (rectLight) rectLight.intensity = v
      })

    folder
      .add(params, "showHelper")
      .name("显示 Helper")
      .onChange((v) => {
        if (rectLightHelper) rectLightHelper.visible = v
      })

    folder.open()

    // 位置控制
    const posFolder = gui.addFolder("📍 光源位置")
    posFolder
      .add(params, "lightX", -5, 5, 0.1)
      .name("X")
      .onChange((v) => {
        if (rectLight) rectLight.position.x = v
        if (rectLightHelper) rectLightHelper.position.x = v
      })
    posFolder
      .add(params, "lightY", 1, 8, 0.1)
      .name("Y")
      .onChange((v) => {
        if (rectLight) rectLight.position.y = v
        if (rectLightHelper) rectLightHelper.position.y = v
      })
    posFolder
      .add(params, "lightZ", -5, 5, 0.1)
      .name("Z")
      .onChange((v) => {
        if (rectLight) rectLight.position.z = v
        if (rectLightHelper) rectLightHelper.position.z = v
      })
    posFolder.open()
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    rectLightHelper?.dispose()
    rectLightHelper = null

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
    title="💡 矩形面光 (RectAreaLight)"
    description="模拟真实世界中矩形发光面板（如窗户透光、LED 面板），产生均匀柔和的光照"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>📐 <strong>宽度/高度</strong> - 控制面光的大小</li>
          <li>🎨 <strong>颜色/强度</strong> - 调节面光的颜色和亮度</li>
          <li>📍 <strong>位置控制</strong> - 自由移动面光的位置</li>
          <li>🔧 <strong>Helper</strong> - 显示面光的辅助线框</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 RectAreaLight 说明：</h3>
        <ul>
          <li><strong>特点</strong> - 发射均匀的矩形光线，非点光源</li>
          <li><strong>用途</strong> - 模拟窗户、LED 面板、柔光箱等</li>
          <li><strong>阴影</strong> - RectAreaLight 不支持阴影投射</li>
          <li><strong>材质要求</strong> - 需要使用 MeshStandardMaterial 或 MeshPhysicalMaterial</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚠️ 重要注意事项：</h3>
        <ul>
          <li>🔸 必须在使用前调用 <code>RectAreaLightUniformsLib.init()</code></li>
          <li>🔸 需要导入 RectAreaLightHelper 来可视化光源</li>
          <li>🔸 面光越大，光照越柔和（面积光衰减特性）</li>
          <li>🔸 仅对 StandardMaterial/PhysicalMaterial 有效</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>import { RectAreaLightUniformsLib } from '...'</code></p>
        <p><code>RectAreaLightUniformsLib.init()</code></p>
        <br>
        <p><code>const light = new THREE.RectAreaLight(</code></p>
        <p><code>  0xffffff, // 颜色</code></p>
        <p><code>  5,        // 强度</code></p>
        <p><code>  3,        // 宽度</code></p>
        <p><code>  3         // 高度</code></p>
        <p><code>)</code></p>
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
