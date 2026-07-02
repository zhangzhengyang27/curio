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
    cameraPosition: { x: 3, y: 2, z: 3 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 1,
      maxDistance: 15
    },
    showAxesHelper: false,
    showGridHelper: true
  })

  // GUI 和对象引用
  let gui: GUI | null = null
  let boxMaterials: { group: THREE.Group; material: THREE.MeshStandardMaterial; name: string; desc: string; originalSide: THREE.Side }[] = []
  let boxGroup: THREE.Group | null = null

  /**
   * 创建一个半打开的盒子（5个面组成，缺少一个面以便看到内部）
   * 使用 PlaneGeometry 构建5个面
   */
  const createOpenBox = (material: THREE.MeshStandardMaterial, position: THREE.Vector3) => {
    const group = new THREE.Group()
    const size = 1
    const thickness = 0.02

    // 底面
    const bottom = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      material
    )
    bottom.rotation.x = -Math.PI / 2
    bottom.position.y = 0
    group.add(bottom)

    // 前面
    const front = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      material
    )
    front.position.z = size / 2
    group.add(front)

    // 后面
    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      material
    )
    back.position.z = -size / 2
    back.rotation.y = Math.PI
    group.add(back)

    // 左面
    const left = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      material
    )
    left.position.x = -size / 2
    left.rotation.y = Math.PI / 2
    group.add(left)

    // 顶面（偏移一点，显示"半打开"效果）
    const top = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      material
    )
    top.rotation.x = Math.PI / 2
    top.position.y = size
    top.rotation.z = 0.3 // 稍微倾斜，表示半打开
    group.add(top)

    group.position.copy(position)
    return group
  }

  /**
   * 创建场景
   */
  const createScene = () => {
    if (!scene.value) return

    // 设置场景背景
    scene.value.background = new THREE.Color(0x1a1a2e)

    // 创建三个盒子，分别使用不同的 side 模式
    const sideModes = [
      { side: THREE.FrontSide, name: "FrontSide", color: 0xff6b6b, desc: "只渲染正面" },
      { side: THREE.BackSide, name: "BackSide", color: 0x4ecdc4, desc: "只渲染背面" },
      { side: THREE.DoubleSide, name: "DoubleSide", color: 0xffe66d, desc: "双面渲染" }
    ]

    boxGroup = new THREE.Group()

    sideModes.forEach((item, index) => {
      const material = new THREE.MeshStandardMaterial({
        color: item.color,
        side: item.side,
        metalness: 0.1,
        roughness: 0.6
      })

      const box = createOpenBox(material, new THREE.Vector3((index - 1) * 2.5, 0, 0))
      boxGroup!.add(box)

      boxMaterials.push({
        group: box,
        material,
        name: item.name,
        desc: item.desc,
        originalSide: item.side
      })
    })

    scene.value.add(boxGroup)

    // 添加方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(3, 5, 3)
    scene.value.add(directionalLight)

    // 添加点光源（从盒子内部照亮，使背面模式也可见）
    const pointLight = new THREE.PointLight(0xffffff, 1, 10)
    pointLight.position.set(0, 0.5, 0)
    scene.value.add(pointLight)

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5)
    scene.value.add(ambientLight)

    console.log("背面与双面材质场景创建成功")
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    if (boxMaterials.length === 0) return

    gui = new GUI()
    gui.title("渲染面模式控制")

    // 全局 side 模式切换
    const modeFolder = gui.addFolder("🔄 全局 Side 模式")
    const params = {
      mode: "individual",
      individual: "各自独立",
      allFrontSide: "全部 FrontSide",
      allBackSide: "全部 BackSide",
      allDoubleSide: "全部 DoubleSide"
    }

    modeFolder
      .add(params, "mode", ["individual", "FrontSide", "BackSide", "DoubleSide"])
      .name("Side 模式")
      .onChange((value) => {
        let sideMode!: THREE.Side
        switch (value) {
          case "FrontSide":
            sideMode = THREE.FrontSide
            break
          case "BackSide":
            sideMode = THREE.BackSide
            break
          case "DoubleSide":
            sideMode = THREE.DoubleSide
            break
          default:
            // individual: 恢复各自的原始模式
            boxMaterials.forEach((item) => {
              item.material.side = item.originalSide
              item.material.needsUpdate = true
            })
            return
        }

        boxMaterials.forEach((item) => {
          item.material.side = sideMode
          item.material.needsUpdate = true
        })
      })

    modeFolder.open()

    // 各盒子独立控制
    if (!gui) return
    const g = gui
    boxMaterials.forEach((item) => {
      const folder = g.addFolder(`📦 ${item.name}（${item.desc}）`)
      folder
        .add(item, "name")
        .name("当前模式")
        .listen()
        .disable()

      folder
        .addColor(item.material, "color")
        .name("颜色")

      folder.open()
    })

    // 旋转控制
    const rotateFolder = gui.addFolder("🔄 旋转控制")
    const rotateParams = {
      autoRotate: true,
      speed: 0.3
    }
    rotateFolder.add(rotateParams, "autoRotate").name("自动旋转")
    rotateFolder.add(rotateParams, "speed", 0, 1, 0.05).name("旋转速度")
    rotateFolder.open()

    // 性能说明
    const infoFolder = gui.addFolder("📖 性能说明")
    const info = {
      FrontSide: "默认模式，只渲染正面（法线朝向相机）",
      BackSide: "只渲染背面（法线远离相机），常用于看到内部",
      DoubleSide: "双面渲染，内外都可见，性能开销约2倍",
      "💡 提示": "尽量使用 FrontSide，只在必要时用 DoubleSide"
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
    // 清理引用
    boxMaterials = []
    boxGroup = null

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
      if (boxGroup) {
        boxGroup.rotation.y += 0.003
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
    title="📦 背面与双面材质"
    description="FrontSide / BackSide / DoubleSide 渲染模式对比"
  >
    <template #content>
      <div class="info-section">
        <h3>📦 三种渲染面模式：</h3>
        <ul>
          <li><strong>FrontSide</strong>（红色）：只渲染正面（法线朝向相机的面），从背面看不到</li>
          <li><strong>BackSide</strong>（青色）：只渲染背面（法线远离相机的面），从正面看不到</li>
          <li><strong>DoubleSide</strong>（黄色）：双面渲染，从任何角度都能看到</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 核心概念：</h3>
        <ul>
          <li><strong>FrontSide</strong>：默认值。只渲染三角形的正面。性能最佳</li>
          <li><strong>BackSide</strong>：常用于渲染盒子的内部场景</li>
          <li><strong>DoubleSide</strong>：内外两面都渲染。GPU 需要处理约2倍的三角形</li>
          <li><strong>需要设置 needsUpdate = true</strong>：切换 side 模式后必须更新材质</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 性能对比：</p>
        <p><code>FrontSide → 渲染 N 个三角形</code></p>
        <p><code>DoubleSide → 渲染约 2N 个三角形（性能约50%）</code></p>
        <p><code>建议：优先 FrontSide，必要时用 DoubleSide</code></p>
      </div>

      <div class="controls-tip">
        <p>🎮 操作提示：</p>
        <ul>
          <li>🖱️ 左键拖动：旋转视角</li>
          <li>🖱️ 滚轮：缩放</li>
          <li>🎚️ 全局 Side 模式切换，观察三个盒子同时变化</li>
          <li>🎚️ "individual" 模式恢复各自原始设置</li>
          <li>💡 注意：BackSide 模式下从外部看不到盒子面</li>
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
