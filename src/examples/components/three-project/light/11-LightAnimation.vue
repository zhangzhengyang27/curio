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
    cameraPosition: { x: 0, y: 4, z: 6 },
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
  let spotLights: THREE.SpotLight[] = []
  let lightBulbs: THREE.Mesh[] = []
  let lightBulbMaterials: THREE.MeshBasicMaterial[] = []
  // 动画参数
  let animSpeed: number = 1.0
  let animEnabled: boolean = true
  let clock: THREE.Clock = new THREE.Clock()

  /**
   * 创建场景
   */
  const createScene = () => {
    const s = scene.value
    if (!s) return

    // 暗色背景
    s.background = new THREE.Color(0x080810)

    // 地面
    const floorGeo = new THREE.PlaneGeometry(15, 15)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    s.add(floor)

    // 中心物体 - 球体
    const sphereGeo = new THREE.SphereGeometry(1, 64, 64)
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.3,
      metalness: 0.4
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    sphere.position.set(0, 1.2, 0)
    sphere.castShadow = true
    s.add(sphere)

    // 创建 4 个彩色 SpotLight，围绕中心物体
    const lightConfigs = [
      { color: 0xff0000, intensity: 30, pos: [3, 4, 0] },
      { color: 0x00ff00, intensity: 30, pos: [0, 4, 3] },
      { color: 0x0088ff, intensity: 30, pos: [-3, 4, 0] },
      { color: 0xff00ff, intensity: 30, pos: [0, 4, -3] }
    ]

    lightConfigs.forEach((config) => {
      // SpotLight
      const light = new THREE.SpotLight(config.color, config.intensity, 20, Math.PI / 6, 0.5, 2)
      light.position.set(config.pos[0], config.pos[1], config.pos[2])
      light.target.position.set(0, 0, 0)
      light.castShadow = true
      s.add(light)
      s.add(light.target)

      // 灯泡标记（小球体）
      const bulbGeo = new THREE.SphereGeometry(0.15, 16, 16)
      const bulbMat = new THREE.MeshBasicMaterial({ color: config.color })
      const bulb = new THREE.Mesh(bulbGeo, bulbMat)
      bulb.position.copy(light.position)
      s.add(bulb)

      spotLights.push(light)
      lightBulbs.push(bulb)
      lightBulbMaterials.push(bulbMat)
    })

    // 微弱环境光
    const ambLight = new THREE.AmbientLight(0x111111, 0.3)
    s.add(ambLight)
  }

  /**
   * 灯光动画回调
   */
  const animateCallback = () => {
    if (!animEnabled) return

    const elapsed = clock.getElapsedTime() * animSpeed
    const radius = 3
    const height = 4

    spotLights.forEach((light, index) => {
      // 每个灯光偏移不同的角度
      const angle = elapsed * 0.5 + (index * Math.PI) / 2

      // 灯光绕中心旋转
      light.position.x = Math.cos(angle) * radius
      light.position.z = Math.sin(angle) * radius
      light.position.y = height + Math.sin(elapsed * 2 + index) * 0.5

      // 更新灯泡位置
      if (lightBulbs[index]) {
        lightBulbs[index].position.copy(light.position)
      }

      // 强度脉冲效果（用 sin 控制强度波动）
      const pulse = 20 + Math.sin(elapsed * 3 + index * 1.5) * 15
      light.intensity = Math.max(0, pulse)

      // 颜色循环（使用 HSL 色环旋转）
      const hue = (elapsed * 0.1 + index * 0.25) % 1
      light.color.setHSL(hue, 1.0, 0.5)
      const bulbMat = lightBulbMaterials[index] as THREE.MeshBasicMaterial | undefined
      if (!bulbMat) return
      bulbMat.color!.copy(light.color)
    })
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    const params = {
      animSpeed: 1.0,
      animEnabled: true,
      light1: true,
      light2: true,
      light3: true,
      light4: true
    }

    const folder = gui.addFolder("🎭 灯光动画控制")
    folder
      .add(params, "animEnabled")
      .name("启用动画")
      .onChange((v) => {
        animEnabled = v
      })

    folder
      .add(params, "animSpeed", 0.1, 5, 0.1)
      .name("动画速度")
      .onChange((v) => {
        animSpeed = v
      })

    folder.open()

    // 各灯光开关
    const lightFolder = gui.addFolder("💡 灯光开关")
    const names = ["light1", "light2", "light3", "light4"] as const
    const labels = ["🔴 红光", "🟢 绿光", "🔵 蓝光", "🟣 紫光"]

    names.forEach((name, index) => {
      lightFolder
        .add(params, name)
        .name(labels[index])
        .onChange((v: boolean) => {
          if (!spotLights[index] || !lightBulbs[index]) return
          spotLights[index].visible = v
          lightBulbs[index].visible = v
        })
    })
    lightFolder.open()

    // 动画说明
    const infoFolder = gui.addFolder("ℹ️ 动画说明")
    infoFolder.add({ info: "1. 颜色渐变: Color.setHSL() 循环色相" }, "info").name("颜色渐变").disable()
    infoFolder.add({ info: "2. 强度脉冲: Math.sin() 控制波动" }, "info").name("强度脉冲").disable()
    infoFolder.add({ info: "3. 旋转: cos/sin 计算圆形轨道" }, "info").name("绕物体旋转").disable()
    infoFolder.add({ info: "4. 交替: 每灯相位偏移 π/2" }, "info").name("交替闪烁").disable()
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    spotLights = []
    lightBulbs = []
    lightBulbMaterials = []

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
    title="🎭 灯光动画"
    description="展示多种灯光动画效果：颜色渐变、强度脉冲、绕物体旋转、多灯交替闪烁"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🌈 <strong>颜色渐变</strong> - 使用 Color.setHSL() 实现色环循环</li>
          <li>💓 <strong>强度脉冲</strong> - Math.sin() 控制灯光强度波动</li>
          <li>🔄 <strong>绕物体旋转</strong> - cos/sin 计算圆形轨道位置</li>
          <li>✨ <strong>交替闪烁</strong> - 多灯相位偏移实现舞台灯光效果</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 动画技巧：</h3>
        <ul>
          <li><strong>颜色插值</strong>: 使用 <code>Color.setHSL(h, s, l)</code> 循环色相</li>
          <li><strong>强度波动</strong>: <code>intensity = base + Math.sin(time * speed) * amplitude</code></li>
          <li><strong>圆形轨道</strong>: <code>x = cos(angle) * r; z = sin(angle) * r</code></li>
          <li><strong>相位偏移</strong>: 每个灯光使用 <code>offset = index * (2π / count)</code></li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 注意事项：</h3>
        <ul>
          <li>🔸 灯光动画频繁更新颜色和位置可能影响性能</li>
          <li>🔸 在移动端应减少灯光数量和动画频率</li>
          <li>🔸 可以用 <code>Color.lerp(target, alpha)</code> 在两个颜色间平滑过渡</li>
          <li>🔸 SpotLight 带 shadow 会显著增加 GPU 开销</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>// 颜色循环</code></p>
        <p><code>const hue = (elapsed * 0.1 + offset) % 1</code></p>
        <p><code>light.color.setHSL(hue, 1.0, 0.5)</code></p>
        <br>
        <p><code>// 强度脉冲</code></p>
        <p><code>light.intensity = 20 + Math.sin(elapsed * 3) * 15</code></p>
        <br>
        <p><code>// 圆形轨道</code></p>
        <p><code>light.position.x = Math.cos(elapsed * 0.5) * radius</code></p>
        <p><code>light.position.z = Math.sin(elapsed * 0.5) * radius</code></p>
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
