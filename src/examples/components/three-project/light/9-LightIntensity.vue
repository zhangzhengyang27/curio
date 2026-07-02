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
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 5, y: 3, z: 5 },
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
  let pointLights: THREE.PointLight[] = []
  let lightHelpers: THREE.Mesh[] = []
  let lightHelperMaterials: THREE.MeshBasicMaterial[] = []

  /**
   * 创建场景
   */
  const createScene = () => {
    const s = scene.value
    if (!s || !renderer.value) return

    // 设置暗色背景
    s.background = new THREE.Color(0x111118)

    // 创建地面
    const floorGeo = new THREE.PlaneGeometry(20, 20)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.8,
      metalness: 0.2
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    s.add(floor)

    // 创建中心球体
    const sphereGeo = new THREE.SphereGeometry(0.5, 32, 32)
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.1
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    sphere.position.set(0, 0.5, 0)
    sphere.castShadow = true
    s.add(sphere)

    // 创建多个点光源用于对比
    const lightConfigs = [
      { color: 0xff4444, intensity: 50, distance: 0, decay: 2, pos: [-3, 2, 0] },
      { color: 0x44ff44, intensity: 100, distance: 0, decay: 2, pos: [0, 2, 0] },
      { color: 0x4444ff, intensity: 200, distance: 0, decay: 2, pos: [3, 2, 0] }
    ]

    lightConfigs.forEach((config) => {
      const light = new THREE.PointLight(config.color, config.intensity, config.distance, config.decay)
      light.position.set(config.pos[0], config.pos[1], config.pos[2])
      s.add(light)

      // 光源 Helper
      const helperGeo = new THREE.SphereGeometry(0.1, 16, 16)
      const helperMat = new THREE.MeshBasicMaterial({ color: config.color })
      const helper = new THREE.Mesh(helperGeo, helperMat)
      helper.position.copy(light.position)
      s.add(helper)

      pointLights.push(light)
      lightHelpers.push(helper)
      lightHelperMaterials.push(helperMat)
    })

    // 微弱环境光
    const ambLight = new THREE.AmbientLight(0x111122, 0.3)
    s.add(ambLight)
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    const lightNames = ["🔴 红光", "🟢 绿光", "🔵 蓝光"]

    pointLights.forEach((light, index) => {
      if (!gui) return
      const folder = gui.addFolder(lightNames[index])

      const params = {
        intensity: light.intensity,
        decay: light.decay,
        distance: light.distance,
        enabled: true,
        color: "#" + new THREE.Color(light.color).getHexString()
      }

      folder
        .add(params, "enabled")
        .name("启用")
        .onChange((v) => {
          light.visible = v
          if (lightHelpers[index]) lightHelpers[index].visible = v
        })

      folder
        .addColor(params, "color")
        .name("颜色")
        .onChange((v) => {
          light.color.set(v)
          const helperMat = lightHelperMaterials[index] as THREE.MeshBasicMaterial | undefined
          if (!helperMat) return
          helperMat.color!.set(v)
        })

      folder
        .add(params, "intensity", 0, 500, 1)
        .name("强度 (intensity)")
        .onChange((v) => {
          light.intensity = v
        })

      folder
        .add(params, "decay", 0, 5, 0.1)
        .name("衰减 (decay)")
        .onChange((v) => {
          light.decay = v
        })

      folder
        .add(params, "distance", 0, 20, 0.5)
        .name("照射距离 (distance)")
        .onChange((v) => {
          light.distance = v
        })

      folder.open()
    })

    // 物理光照说明
    const infoFolder = gui.addFolder("ℹ️ 物理光照说明")
    infoFolder
      .add(
        {
          info: "物理模式下: intensity 单位为坎德拉(cd), decay=2 为物理衰减"
        },
        "info"
      )
      .name("物理模式")
      .disable()
    infoFolder
      .add(
        {
          info: "传统模式(useLegacyLights): intensity 无物理单位, decay 可为0"
        },
        "info"
      )
      .name("传统模式")
      .disable()
    infoFolder
      .add(
        {
          info: "decay=2 为真实物理衰减(平方反比), 是推荐设置"
        },
        "info"
      )
      .name("衰减说明")
      .disable()
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    pointLights = []
    lightHelpers = []
    lightHelperMaterials = []

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
    title="📏 光照强度与物理单位"
    description="展示 Three.js 物理光照模式下 PointLight 的强度、衰减和距离参数"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>💡 <strong>强度对比</strong> - 三个不同强度的点光源并排对比</li>
          <li>📉 <strong>衰减控制</strong> - 调节 decay 参数观察光照衰减效果</li>
          <li>📏 <strong>距离限制</strong> - 设置 distance 限制照射范围</li>
          <li>🎯 <strong>物理单位</strong> - 理解坎德拉(cd)和物理衰减模型</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 物理光照模式说明：</h3>
        <ul>
          <li><strong>物理模式</strong> - intensity 单位为坎德拉（cd），使用真实物理衰减</li>
          <li><strong>decay = 2</strong> - 平方反比衰减（真实物理规律）</li>
          <li><strong>decay = 0</strong> - 无衰减（不推荐，不真实）</li>
          <li><strong>distance = 0</strong> - 无限距离（默认值）</li>
          <li><strong>distance > 0</strong> - 限制照射范围，在 distance 处光照为 0</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 关键概念：</h3>
        <ul>
          <li>🔸 物理模式下，点光源 intensity 需要较大的值（50-200+）</li>
          <li>🔸 decay=2 是物理正确的，但在小场景中可能需要很高的 intensity</li>
          <li>圆柱体和 Spotlight 在物理模式下也有类似行为</li>
          <li>🔸 DirectionalLight 的 intensity 在物理模式下与距离无关</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>// 物理模式下的点光源</code></p>
        <p><code>const light = new THREE.PointLight(</code></p>
        <p><code>  0xffffff, // 颜色</code></p>
        <p><code>  100,      // 强度 (坎德拉)</code></p>
        <p><code>  0,        // 距离 (0=无限)</code></p>
        <p><code>  2         // 衰减 (2=物理衰减)</code></p>
        <p><code>)</code></p>
      </div>

      <div class="controls-tip">
        <p>🎮 操作提示：</p>
        <ul style="margin-top: 8px">
          <li>• 调节 intensity 观察不同强度对场景的影响</li>
          <li>• 设置 decay=0 观察无衰减的不自然效果</li>
          <li>• 设置 distance 值观察光照范围被截断</li>
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
