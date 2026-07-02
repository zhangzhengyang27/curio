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
    showGridHelper: true
  })

  // GUI 和对象引用
  let gui: GUI | null = null
  let toonMeshes: { group: THREE.Group; material: THREE.MeshToonMaterial; label: string }[] = []
  let gradientTextures: THREE.DataTexture[] = []
  let animationId: number = 0

  /**
   * 创建不同阶数的渐变贴图（DataTexture）
   * 用于控制 MeshToonMaterial 的色阶数量
   * @param {number} steps - 色阶数（1=两色, 2=三色, 3=四色, 4=五色）
   * @returns {THREE.DataTexture}
   */
  const createGradientTexture = (steps: number) => {
    // 色阶数 = steps + 1
    const size = steps + 1
    const data = new Uint8Array(size * 4) // RGBA

    for (let i = 0; i < size; i++) {
      // 生成从暗到亮的灰度值
      const value = Math.round((i / steps) * 255)
      data[i * 4] = value     // R
      data[i * 4 + 1] = value // G
      data[i * 4 + 2] = value // B
      data[i * 4 + 3] = 255   // A
    }

    const texture = new THREE.DataTexture(data, size, 1, THREE.RGBAFormat)
    texture.minFilter = THREE.NearestFilter // 使用最近邻过滤，产生硬边色阶
    texture.magFilter = THREE.NearestFilter
    texture.needsUpdate = true // 必须设置，否则不会更新到 GPU
    return texture
  }

  /**
   * 创建卡通风格的简单角色（用基本几何体组合）
   * 身体 = 圆柱体，头部 = 球体，手臂/腿 = 小圆柱体
   */
  const createToonCharacter = (material: THREE.MeshToonMaterial, position: THREE.Vector3) => {
    const group = new THREE.Group()

    // 身体（圆柱体）
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.35, 1, 16)
    const body = new THREE.Mesh(bodyGeometry, material)
    body.position.y = 0.5
    group.add(body)

    // 头部（球体）
    const headGeometry = new THREE.SphereGeometry(0.3, 16, 16)
    const head = new THREE.Mesh(headGeometry, material)
    head.position.y = 1.3
    group.add(head)

    // 左臂
    const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8)
    const leftArm = new THREE.Mesh(armGeometry, material)
    leftArm.position.set(-0.45, 0.7, 0)
    leftArm.rotation.z = 0.3
    group.add(leftArm)

    // 右臂
    const rightArm = new THREE.Mesh(armGeometry, material)
    rightArm.position.set(0.45, 0.7, 0)
    rightArm.rotation.z = -0.3
    group.add(rightArm)

    // 左腿
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8)
    const leftLeg = new THREE.Mesh(legGeometry, material)
    leftLeg.position.set(-0.15, -0.1, 0)
    group.add(leftLeg)

    // 右腿
    const rightLeg = new THREE.Mesh(legGeometry, material)
    rightLeg.position.set(0.15, -0.1, 0)
    group.add(rightLeg)

    group.position.copy(position)
    return group
  }

  /**
   * 创建场景
   */
  const createScene = () => {
    if (!scene.value) return

    // 设置场景背景
    scene.value.background = new THREE.Color(0x2a2a3e)

    // 颜色列表，每个角色使用不同颜色
    const colors = [
      0xff6b6b, // 红色
      0x4ecdc4, // 青色
      0xffe66d, // 黄色
      0xa8e6cf  // 浅绿
    ]

    // 色阶标签
    const labels = ["1阶（亮暗两色）", "2阶（亮/中/暗）", "3阶（4级色阶）", "4阶（5级色阶）"]

    // 为每个色阶数创建角色
    for (let i = 0; i < 4; i++) {
      // 创建对应阶数的渐变贴图
      const gradientTexture = createGradientTexture(i + 1)
      gradientTextures.push(gradientTexture)

      // 创建 MeshToonMaterial
      const material = new THREE.MeshToonMaterial({
        color: colors[i],
        gradientMap: gradientTexture
      })

      // 创建角色，排列在同一行
      const x = (i - 1.5) * 2.2
      const character = createToonCharacter(material, new THREE.Vector3(x, -0.35, 0))

      scene.value.add(character)
      toonMeshes.push({ group: character, material, label: labels[i] })
    }

    // 添加方向光（Toon 材质需要明确的光源方向来产生阴影边界）
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(5, 8, 5)
    scene.value.add(directionalLight)

    // 添加第二个方向光（从另一侧补光，增强卡通效果）
    const backLight = new THREE.DirectionalLight(0x6688ff, 0.5)
    backLight.position.set(-3, 4, -5)
    scene.value.add(backLight)

    // 添加环境光（不要太亮，保持色阶对比）
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    scene.value.add(ambientLight)

    console.log("卡通渲染材质场景创建成功")
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()
    gui.title("卡通渲染控制")

    const params = {
      rotationSpeed: 0.5,
      autoRotate: true
    }

    // 旋转控制
    const rotateFolder = gui.addFolder("🔄 旋转控制")
    rotateFolder
      .add(params, "autoRotate")
      .name("自动旋转")

    rotateFolder
      .add(params, "rotationSpeed", 0, 2, 0.05)
      .name("旋转速度")

    rotateFolder.open()

    // 为每个角色添加颜色控制
    const colorFolder = gui.addFolder("🎨 颜色控制")
    const colorParams = {
      color1: "#ff6b6b",
      color2: "#4ecdc4",
      color3: "#ffe66d",
      color4: "#a8e6cf"
    }

    colorFolder.addColor(colorParams, "color1").name("1阶 颜色").onChange((v) => {
      const mesh = toonMeshes[0]
      if (!mesh) return
      if (mesh.material.color) mesh.material.color.set(v)
    })
    colorFolder.addColor(colorParams, "color2").name("2阶 颜色").onChange((v) => {
      const mesh = toonMeshes[1]
      if (!mesh) return
      if (mesh.material.color) mesh.material.color.set(v)
    })
    colorFolder.addColor(colorParams, "color3").name("3阶 颜色").onChange((v) => {
      const mesh = toonMeshes[2]
      if (!mesh) return
      if (mesh.material.color) mesh.material.color.set(v)
    })
    colorFolder.addColor(colorParams, "color4").name("4阶 颜色").onChange((v) => {
      const mesh = toonMeshes[3]
      if (!mesh) return
      if (mesh.material.color) mesh.material.color.set(v)
    })
    colorFolder.open()

    // 技术说明
    const infoFolder = gui.addFolder("📖 技术说明")
    const info = {
      MeshToonMaterial: "卡通渲染材质，产生分阶色阶效果",
      gradientMap: "渐变贴图，控制色阶数量（NearestFilter）",
      "1阶": "只有亮暗两色，硬阴影效果",
      "2阶": "亮/中/暗三色，经典卡通风格",
      DataTexture: "程序化创建的纹理，needsUpdate=true"
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
    // 清理渐变贴图
    gradientTextures.forEach((t) => t.dispose())
    gradientTextures = []

    // 清理引用
    toonMeshes = []

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

    // 启动带旋转的动画
    startAnimation(() => {
      if (!scene.value) return
      // 角色缓慢旋转
      toonMeshes.forEach((item) => {
        item.group.rotation.y += 0.005
      })
    })
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🎨 卡通渲染材质"
    description="MeshToonMaterial 渐变贴图实现不同阶数的卡通色阶"
  >
    <template #content>
      <div class="info-section">
        <h3>🎨 色阶效果对比：</h3>
        <ul>
          <li><strong>1阶</strong>（红）：亮暗两色，硬阴影效果</li>
          <li><strong>2阶</strong>（青）：亮/中/暗三色，经典卡通</li>
          <li><strong>3阶</strong>（黄）：4级色阶，更柔和的过渡</li>
          <li><strong>4阶</strong>（绿）：5级色阶，接近真实但仍有分阶感</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 核心原理：</h3>
        <ul>
          <li><strong>MeshToonMaterial</strong>：Three.js 内置的卡通渲染材质</li>
          <li><strong>gradientMap</strong>：渐变贴图，亮度值被离散化为有限色阶</li>
          <li><strong>DataTexture + NearestFilter</strong>：关键！确保产生硬边色阶而非平滑渐变</li>
          <li><strong>gradientMap = null</strong>：默认使用两阶（亮暗）</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 渐变贴图创建：</p>
        <p><code>const data = new Uint8Array(steps * 4)</code></p>
        <p><code>const tex = new THREE.DataTexture(data, steps, 1, RGBAFormat)</code></p>
        <p><code>tex.minFilter = THREE.NearestFilter // 硬边色阶</code></p>
        <p><code>tex.magFilter = THREE.NearestFilter</code></p>
        <p><code>tex.needsUpdate = true // 必须！</code></p>
      </div>

      <div class="controls-tip">
        <p>🎮 操作提示：</p>
        <ul>
          <li>🖱️ 左键拖动：旋转视角</li>
          <li>🖱️ 滚轮：缩放</li>
          <li>🎚️ 自动旋转开关和速度调节</li>
          <li>🎚️ 每个角色的颜色可独立修改</li>
          <li>💡 观察不同色阶数的光影离散效果</li>
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
