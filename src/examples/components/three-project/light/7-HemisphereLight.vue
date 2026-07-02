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
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 4, y: 3, z: 5 },
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
  let hemiLight: THREE.HemisphereLight | null = null

  /**
   * 创建场景
   */
  const createScene = () => {
    if (!scene.value) return

    // 创建半球光
    hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x362907, 1.0)
    hemiLight.position.set(0, 10, 0)
    scene.value.add(hemiLight)

    // 地面
    const floorGeo = new THREE.PlaneGeometry(12, 12)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.8,
      metalness: 0.1
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    scene.value.add(floor)

    // 球体
    const sphereGeo = new THREE.SphereGeometry(0.6, 32, 32)
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.0 })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    sphere.position.set(-2, 0.6, 0)
    scene.value.add(sphere)

    // 立方体
    const boxGeo = new THREE.BoxGeometry(1, 1, 1)
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5, metalness: 0.0 })
    const box = new THREE.Mesh(boxGeo, boxMat)
    box.position.set(0, 0.5, 0)
    scene.value.add(box)

    // 圆环结
    const torusGeo = new THREE.TorusKnotGeometry(0.5, 0.15, 100, 16)
    const torusMat = new THREE.MeshStandardMaterial({ color: 0xff8844, roughness: 0.4, metalness: 0.3 })
    const torus = new THREE.Mesh(torusGeo, torusMat)
    torus.position.set(2, 1, 0)
    scene.value.add(torus)

    // 圆柱体
    const cylGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 32)
    const cylMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.5, metalness: 0.0 })
    const cyl = new THREE.Mesh(cylGeo, cylMat)
    cyl.position.set(0, 0.75, -2)
    scene.value.add(cyl)
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    const params = {
      skyColor: "#87ceeb",
      groundColor: "#362907",
      intensity: 1.0,
      enabled: true
    }

    const folder = gui.addFolder("🌐 半球光控制")

    folder
      .add(params, "enabled")
      .name("启用半球光")
      .onChange((v) => {
        if (hemiLight) hemiLight.visible = v
      })

    folder
      .addColor(params, "skyColor")
      .name("天空颜色 (skyColor)")
      .onChange((v) => {
        if (hemiLight) hemiLight.color.set(v)
      })

    folder
      .addColor(params, "groundColor")
      .name("地面颜色 (groundColor)")
      .onChange((v) => {
        if (hemiLight) hemiLight.groundColor.set(v)
      })

    folder
      .add(params, "intensity", 0, 5, 0.1)
      .name("光照强度 (intensity)")
      .onChange((v) => {
        if (hemiLight) hemiLight.intensity = v
      })

    folder.open()

    // 预设颜色方案
    const presetFolder = gui.addFolder("🎨 预设方案")
    const presets = {
      日间: () => {
        if (!hemiLight || !gui) return
        hemiLight.color.set(0x87ceeb)
        hemiLight.groundColor.set(0x362907)
        hemiLight.intensity = 1.0
        params.skyColor = "#87ceeb"
        params.groundColor = "#362907"
        params.intensity = 1.0
        gui.controllersRecursive().forEach((c) => c.updateDisplay())
      },
      黄昏: () => {
        if (!hemiLight || !gui) return
        hemiLight.color.set(0xff8844)
        hemiLight.groundColor.set(0x220044)
        hemiLight.intensity = 1.5
        params.skyColor = "#ff8844"
        params.groundColor = "#220044"
        params.intensity = 1.5
        gui.controllersRecursive().forEach((c) => c.updateDisplay())
      },
      夜晚: () => {
        if (!hemiLight || !gui) return
        hemiLight.color.set(0x112244)
        hemiLight.groundColor.set(0x000000)
        hemiLight.intensity = 0.5
        params.skyColor = "#112244"
        params.groundColor = "#000000"
        params.intensity = 0.5
        gui.controllersRecursive().forEach((c) => c.updateDisplay())
      },
      霓虹: () => {
        if (!hemiLight || !gui) return
        hemiLight.color.set(0xff00ff)
        hemiLight.groundColor.set(0x00ffff)
        hemiLight.intensity = 2.0
        params.skyColor = "#ff00ff"
        params.groundColor = "#00ffff"
        params.intensity = 2.0
        gui.controllersRecursive().forEach((c) => c.updateDisplay())
      }
    }

    presetFolder.add(presets, "日间").name("☀️ 日间")
    presetFolder.add(presets, "黄昏").name("🌅 黄昏")
    presetFolder.add(presets, "夜晚").name("🌙 夜晚")
    presetFolder.add(presets, "霓虹").name("💜 霓虹")
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
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
    title="🌐 半球光 (HemisphereLight)"
    description="模拟天空和地面之间的环境光照，为场景提供柔和的自然光效果"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🌤️ <strong>skyColor</strong> - 天空颜色，从上方照射</li>
          <li>🌍 <strong>groundColor</strong> - 地面颜色，从下方照射</li>
          <li>💡 <strong>intensity</strong> - 光照强度控制</li>
          <li>🎨 <strong>预设方案</strong> - 日间/黄昏/夜晚/霓虹一键切换</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 HemisphereLight 说明：</h3>
        <ul>
          <li><strong>构造函数</strong>: <code>new THREE.HemisphereLight(skyColor, groundColor, intensity)</code></li>
          <li><strong>skyColor</strong> - 从场景顶部向下照射的颜色</li>
          <li><strong>groundColor</strong> - 从场景底部向上照射的颜色</li>
          <li>没有方向，不会产生阴影</li>
          <li>适合模拟户外环境光照（天空 + 地面反射）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 使用技巧：</h3>
        <ul>
          <li>🔸 常作为场景的基础环境光，配合方向光使用</li>
          <li>🔸 天空色通常设为浅蓝色，地面色设为棕色/绿色</li>
          <li>🔸 黄昏场景可使用暖色调天空 + 深紫地面</li>
          <li>🔸 关闭半球光后可以看到纯黑色的环境</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>const light = new THREE.HemisphereLight(</code></p>
        <p><code>  0x87ceeb,  // 天空颜色</code></p>
        <p><code>  0x362907,  // 地面颜色</code></p>
        <p><code>  1.0        // 强度</code></p>
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
