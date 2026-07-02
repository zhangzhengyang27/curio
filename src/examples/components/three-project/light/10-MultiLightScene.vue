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
    cameraPosition: { x: 4, y: 3, z: 4 },
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
  // 三点光照
  let keyLight: THREE.DirectionalLight | null = null
  let fillLight: THREE.DirectionalLight | null = null
  let rimLight: THREE.DirectionalLight | null = null
  let ambientLight: THREE.AmbientLight | null = null
  // 光源 Helper
  let keyHelper: THREE.Mesh | null = null
  let fillHelper: THREE.Mesh | null = null
  let rimHelper: THREE.Mesh | null = null

  /**
   * 创建场景
   */
  const createScene = () => {
    if (!scene.value) return

    // 暗色背景
    scene.value.background = new THREE.Color(0x111118)

    // 地面
    const floorGeo = new THREE.PlaneGeometry(12, 12)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.8,
      metalness: 0.2
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.value.add(floor)

    // 中心主物体 - 球体
    const sphereGeo = new THREE.SphereGeometry(1, 64, 64)
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xcc8844,
      roughness: 0.4,
      metalness: 0.3
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    sphere.position.set(0, 1.2, 0)
    sphere.castShadow = true
    sphere.receiveShadow = true
    scene.value.add(sphere)

    // 辅助物体 - 立方体
    const boxGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6)
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5 })
    const box = new THREE.Mesh(boxGeo, boxMat)
    box.position.set(-2, 0.3, 1)
    scene.value.add(box)

    // 辅助物体 - 圆环结
    const torusGeo = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 16)
    const torusMat = new THREE.MeshStandardMaterial({ color: 0x6666aa, roughness: 0.3, metalness: 0.5 })
    const torus = new THREE.Mesh(torusGeo, torusMat)
    torus.position.set(2, 0.6, -1)
    scene.value.add(torus)

    // ============ 三点光照设置 ============

    // Key Light（主光）：从右上方照射，强度最高
    keyLight = new THREE.DirectionalLight(0xffeedd, 3)
    keyLight.position.set(4, 6, 4)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(1024, 1024)
    keyLight.shadow.camera.near = 0.1
    keyLight.shadow.camera.far = 20
    keyLight.shadow.camera.left = -5
    keyLight.shadow.camera.right = 5
    keyLight.shadow.camera.top = 5
    keyLight.shadow.camera.bottom = -5
    scene.value.add(keyLight)

    // Fill Light（补光）：从左下方，强度较低
    fillLight = new THREE.DirectionalLight(0x8888ff, 0.8)
    fillLight.position.set(-4, 2, 2)
    scene.value.add(fillLight)

    // Rim Light（轮廓光）：从后方，强度中等
    rimLight = new THREE.DirectionalLight(0xffffff, 1.5)
    rimLight.position.set(0, 3, -5)
    scene.value.add(rimLight)

    // 环境光补充
    ambientLight = new THREE.AmbientLight(0x222233, 0.5)
    scene.value.add(ambientLight)

    // 创建光源 Helper（小球体标识位置）
    const createLightMarker = (color: number) => {
      const geo = new THREE.SphereGeometry(0.12, 16, 16)
      const mat = new THREE.MeshBasicMaterial({ color })
      return new THREE.Mesh(geo, mat)
    }

    keyHelper = createLightMarker(0xffeedd)
    keyHelper.position.copy(keyLight.position)
    scene.value.add(keyHelper)

    fillHelper = createLightMarker(0x8888ff)
    fillHelper.position.copy(fillLight.position)
    scene.value.add(fillHelper)

    rimHelper = createLightMarker(0xffffff)
    rimHelper.position.copy(rimLight.position)
    scene.value.add(rimHelper)
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    // Key Light 控制
    const keyFolder = gui.addFolder("🔑 主光 (Key Light)")
    const keyParams = {
      enabled: true,
      intensity: 3,
      color: "#ffeedd",
      posX: 4, posY: 6, posZ: 4
    }
    keyFolder.add(keyParams, "enabled").name("启用").onChange((v) => {
      if (!keyLight || !keyHelper) return
      keyLight.visible = v
      keyHelper.visible = v
    })
    keyFolder.addColor(keyParams, "color").name("颜色").onChange((v) => {
      if (!keyLight) return
      keyLight.color.set(v)
    })
    keyFolder.add(keyParams, "intensity", 0, 10, 0.1).name("强度").onChange((v) => {
      if (!keyLight) return
      keyLight.intensity = v
    })
    keyFolder.add(keyParams, "posX", -8, 8, 0.1).name("X").onChange((v) => {
      if (!keyLight || !keyHelper) return
      keyLight.position.x = v
      keyHelper.position.x = v
    })
    keyFolder.add(keyParams, "posY", 0, 10, 0.1).name("Y").onChange((v) => {
      if (!keyLight || !keyHelper) return
      keyLight.position.y = v
      keyHelper.position.y = v
    })
    keyFolder.add(keyParams, "posZ", -8, 8, 0.1).name("Z").onChange((v) => {
      if (!keyLight || !keyHelper) return
      keyLight.position.z = v
      keyHelper.position.z = v
    })
    keyFolder.open()

    // Fill Light 控制
    const fillFolder = gui.addFolder("💡 补光 (Fill Light)")
    const fillParams = {
      enabled: true,
      intensity: 0.8,
      color: "#8888ff",
      posX: -4, posY: 2, posZ: 2
    }
    fillFolder.add(fillParams, "enabled").name("启用").onChange((v) => {
      if (!fillLight || !fillHelper) return
      fillLight.visible = v
      fillHelper.visible = v
    })
    fillFolder.addColor(fillParams, "color").name("颜色").onChange((v) => {
      if (!fillLight) return
      fillLight.color.set(v)
    })
    fillFolder.add(fillParams, "intensity", 0, 5, 0.1).name("强度").onChange((v) => {
      if (!fillLight) return
      fillLight.intensity = v
    })
    fillFolder.add(fillParams, "posX", -8, 8, 0.1).name("X").onChange((v) => {
      if (!fillLight || !fillHelper) return
      fillLight.position.x = v
      fillHelper.position.x = v
    })
    fillFolder.add(fillParams, "posY", 0, 10, 0.1).name("Y").onChange((v) => {
      if (!fillLight || !fillHelper) return
      fillLight.position.y = v
      fillHelper.position.y = v
    })
    fillFolder.add(fillParams, "posZ", -8, 8, 0.1).name("Z").onChange((v) => {
      if (!fillLight || !fillHelper) return
      fillLight.position.z = v
      fillHelper.position.z = v
    })

    // Rim Light 控制
    const rimFolder = gui.addFolder("✨ 轮廓光 (Rim Light)")
    const rimParams = {
      enabled: true,
      intensity: 1.5,
      color: "#ffffff",
      posX: 0, posY: 3, posZ: -5
    }
    rimFolder.add(rimParams, "enabled").name("启用").onChange((v) => {
      if (!rimLight || !rimHelper) return
      rimLight.visible = v
      rimHelper.visible = v
    })
    rimFolder.addColor(rimParams, "color").name("颜色").onChange((v) => {
      if (!rimLight) return
      rimLight.color.set(v)
    })
    rimFolder.add(rimParams, "intensity", 0, 5, 0.1).name("强度").onChange((v) => {
      if (!rimLight) return
      rimLight.intensity = v
    })
    rimFolder.add(rimParams, "posX", -8, 8, 0.1).name("X").onChange((v) => {
      if (!rimLight || !rimHelper) return
      rimLight.position.x = v
      rimHelper.position.x = v
    })
    rimFolder.add(rimParams, "posY", 0, 10, 0.1).name("Y").onChange((v) => {
      if (!rimLight || !rimHelper) return
      rimLight.position.y = v
      rimHelper.position.y = v
    })
    rimFolder.add(rimParams, "posZ", -8, 8, 0.1).name("Z").onChange((v) => {
      if (!rimLight || !rimHelper) return
      rimLight.position.z = v
      rimHelper.position.z = v
    })

    // 环境光控制
    const ambFolder = gui.addFolder("🌍 环境光")
    const ambParams = { intensity: 0.5 }
    ambFolder.add(ambParams, "intensity", 0, 3, 0.1).name("强度").onChange((v) => {
      if (!ambientLight) return
      ambientLight.intensity = v
    })

    // 预设方案
    const presetFolder = gui.addFolder("🎨 布光预设")
    const presets = {
      "摄影棚": () => {
        if (!keyLight || !fillLight || !rimLight || !ambientLight) return
        keyLight.color.set(0xffeedd); keyLight.intensity = 3; keyLight.position.set(4, 6, 4)
        fillLight.color.set(0x8888ff); fillLight.intensity = 0.8; fillLight.position.set(-4, 2, 2)
        rimLight.color.set(0xffffff); rimLight.intensity = 1.5; rimLight.position.set(0, 3, -5)
        ambientLight.intensity = 0.5
      },
      "夜景": () => {
        if (!keyLight || !fillLight || !rimLight || !ambientLight) return
        keyLight.color.set(0x4488ff); keyLight.intensity = 2; keyLight.position.set(2, 4, 3)
        fillLight.color.set(0x222244); fillLight.intensity = 0.3; fillLight.position.set(-3, 1, 1)
        rimLight.color.set(0x6666aa); rimLight.intensity = 1; rimLight.position.set(0, 2, -4)
        ambientLight.intensity = 0.1
      },
      "日落": () => {
        if (!keyLight || !fillLight || !rimLight || !ambientLight) return
        keyLight.color.set(0xff6622); keyLight.intensity = 4; keyLight.position.set(5, 2, 0)
        fillLight.color.set(0x4422aa); fillLight.intensity = 0.5; fillLight.position.set(-3, 3, 2)
        rimLight.color.set(0xff4400); rimLight.intensity = 1.2; rimLight.position.set(-2, 4, -3)
        ambientLight.intensity = 0.3
      },
      "冷色": () => {
        if (!keyLight || !fillLight || !rimLight || !ambientLight) return
        keyLight.color.set(0xaaccff); keyLight.intensity = 3; keyLight.position.set(3, 5, 3)
        fillLight.color.set(0x88aaff); fillLight.intensity = 1; fillLight.position.set(-3, 2, 2)
        rimLight.color.set(0xccddff); rimLight.intensity = 2; rimLight.position.set(0, 3, -4)
        ambientLight.intensity = 0.4
      }
    }

    presetFolder.add(presets, "摄影棚").name("📸 摄影棚")
    presetFolder.add(presets, "夜景").name("🌙 夜景")
    presetFolder.add(presets, "日落").name("🌅 日落")
    presetFolder.add(presets, "冷色").name("❄️ 冷色")
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
    title="🎬 多光源组合场景"
    description="演示经典三点光照法（主光/补光/轮廓光），预设多种布光方案"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🔑 <strong>主光 (Key Light)</strong> - 主要光源，从右上方照射，强度最高</li>
          <li>💡 <strong>补光 (Fill Light)</strong> - 填充阴影，从左下方，强度较低</li>
          <li>✨ <strong>轮廓光 (Rim Light)</strong> - 从后方照射，勾勒物体轮廓</li>
          <li>🎨 <strong>布光预设</strong> - 摄影棚/夜景/日落/冷色一键切换</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 三点光照法说明：</h3>
        <ul>
          <li><strong>Key Light</strong> - 定义场景主光源方向和阴影，强度最高</li>
          <li><strong>Fill Light</strong> - 补充暗部细节，通常是冷色调，强度为主光的 1/2~1/4</li>
          <li><strong>Rim Light</strong> - 从物体背后照射，创造边缘高光，分离物体与背景</li>
          <li>三点光照是影视、摄影、3D 渲染中最经典的布光方案</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 布光技巧：</h3>
        <ul>
          <li>🔸 主光和补光色温可不同（暖色主光 + 冷色补光）</li>
          <li>🔸 轮廓光让物体从背景中"跳出来"</li>
          <li>🔸 环境光不宜过强，避免冲淡三点光照效果</li>
          <li>🔸 尝试预设方案，理解不同布光风格</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>// 主光</code></p>
        <p><code>const keyLight = new THREE.DirectionalLight(0xffeedd, 3)</code></p>
        <p><code>keyLight.position.set(4, 6, 4)</code></p>
        <br>
        <p><code>// 补光（强度较低）</code></p>
        <p><code>const fillLight = new THREE.DirectionalLight(0x8888ff, 0.8)</code></p>
        <p><code>fillLight.position.set(-4, 2, 2)</code></p>
        <br>
        <p><code>// 轮廓光（从后方）</code></p>
        <p><code>const rimLight = new THREE.DirectionalLight(0xffffff, 1.5)</code></p>
        <p><code>rimLight.position.set(0, 3, -5)</code></p>
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