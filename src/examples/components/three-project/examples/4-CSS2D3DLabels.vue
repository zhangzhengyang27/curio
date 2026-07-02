<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
  import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  const containerRef = shallowRef<HTMLDivElement | null>(null)

  // 场景对象引用
  let scene: THREE.Scene | null = null
  let camera: THREE.PerspectiveCamera | null = null
  let renderer: THREE.WebGLRenderer | null = null
  let labelRenderer: CSS2DRenderer | null = null
  let controls: OrbitControls | null = null
  let clock: THREE.Clock | null = null
  let gui: GUI | null = null
  let animationId = 0

  // 可交互物体和标签
  let interactiveObjects: THREE.Mesh[] = []
  let labelObjects: Array<{ label: CSS2DObject; div: HTMLDivElement; config: typeof objectConfigs[number] }> = []

  // 物体配置
  const objectConfigs = [
    {
      name: "红色立方体",
      color: 0xe74c3c,
      geometry: new THREE.BoxGeometry(1.5, 1.5, 1.5),
      position: new THREE.Vector3(-3, 1, 0),
      bgColor: "#e74c3c",
      orbitRadius: 3,
      orbitSpeed: 0.5
    },
    {
      name: "蓝色球体",
      color: 0x3498db,
      geometry: new THREE.SphereGeometry(0.9, 32, 32),
      position: new THREE.Vector3(0, 1, 0),
      bgColor: "#3498db",
      orbitRadius: 0,
      orbitSpeed: 0
    },
    {
      name: "绿色圆锥",
      color: 0x2ecc71,
      geometry: new THREE.ConeGeometry(0.8, 1.8, 32),
      position: new THREE.Vector3(3, 1, 0),
      bgColor: "#2ecc71",
      orbitRadius: 3,
      orbitSpeed: -0.4
    },
    {
      name: "黄色圆环",
      color: 0xf1c40f,
      geometry: new THREE.TorusGeometry(0.7, 0.3, 16, 32),
      position: new THREE.Vector3(0, 1, -3),
      bgColor: "#f1c40f",
      orbitRadius: 0,
      orbitSpeed: 0
    },
    {
      name: "紫色圆柱",
      color: 0x9b59b6,
      geometry: new THREE.CylinderGeometry(0.6, 0.6, 1.5, 32),
      position: new THREE.Vector3(0, 1, 3),
      bgColor: "#9b59b6",
      orbitRadius: 0,
      orbitSpeed: 0
    }
  ]

  /**
   * 初始化场景（手动创建，不使用 useThreeScene）
   */
  const initScene = () => {
    if (!containerRef.value) return

    // 创建场景
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)

    // 创建相机
    camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(6, 5, 8)
    camera.lookAt(0, 0, 0)

    // 创建 WebGL 渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    containerRef.value.appendChild(renderer.domElement)

    // 创建 CSS2D 渲染器
    labelRenderer = new CSS2DRenderer()
    labelRenderer.setSize(window.innerWidth, window.innerHeight)
    labelRenderer.domElement.style.position = "absolute"
    labelRenderer.domElement.style.top = "0"
    labelRenderer.domElement.style.left = "0"
    labelRenderer.domElement.style.pointerEvents = "none"
    containerRef.value.appendChild(labelRenderer.domElement)

    // 创建 OrbitControls
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05

    // 创建时钟
    clock = new THREE.Clock()
  }

  /**
   * 创建 CSS2D 标签
   */
  const createLabel = (parent: THREE.Object3D, config: typeof objectConfigs[number]) => {
    const labelDiv = document.createElement("div")
    labelDiv.className = "css2d-label"
    labelDiv.style.backgroundColor = config.bgColor
    labelDiv.style.border = `2px solid ${config.bgColor}`
    labelDiv.style.borderRadius = "6px"
    labelDiv.style.padding = "6px 12px"
    labelDiv.style.fontSize = "13px"
    labelDiv.style.fontFamily = "Arial, sans-serif"
    labelDiv.style.fontWeight = "bold"
    labelDiv.style.color = "#fff"
    labelDiv.style.textShadow = "0 1px 3px rgba(0,0,0,0.5)"
    labelDiv.style.whiteSpace = "nowrap"
    labelDiv.style.pointerEvents = "none"
    labelDiv.style.transition = "opacity 0.3s"
    labelDiv.innerHTML = `${config.name}<br><span style="font-size:10px;font-weight:normal;opacity:0.8">(${config.position.x.toFixed(0)}, ${config.position.y.toFixed(0)}, ${config.position.z.toFixed(0)})</span>`

    const label = new CSS2DObject(labelDiv)
    label.position.set(0, 1.5, 0)
    parent.add(label)

    return { label, div: labelDiv, config }
  }

  /**
   * 创建场景物体和标签
   */
  const createObjects = () => {
    const s = scene
    if (!s) return

    objectConfigs.forEach((config) => {
      const material = new THREE.MeshStandardMaterial({
        color: config.color,
        roughness: 0.4,
        metalness: 0.3
      })
      const mesh = new THREE.Mesh(config.geometry, material)
      mesh.position.copy(config.position)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData = { ...config }
      s.add(mesh)
      interactiveObjects.push(mesh)

      // 创建标签
      const labelObj = createLabel(mesh, config)
      labelObjects.push(labelObj)
    })
  }

  /**
   * 添加光源
   */
  const addLights = () => {
    if (!scene) return

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(5, 8, 5)
    dirLight.castShadow = true
    scene.add(dirLight)

    const pointLight = new THREE.PointLight(0xffffff, 0.4, 20)
    pointLight.position.set(-3, 5, -3)
    scene.add(pointLight)
  }

  /**
   * 添加地面
   */
  const addFloor = () => {
    if (!scene) return

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x2d2d44, roughness: 0.9 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    // 网格辅助线
    const grid = new THREE.GridHelper(20, 20, 0x444466, 0x333355)
    scene.add(grid)
  }

  /**
   * 初始化 GUI
   */
  const initGUI = () => {
    gui = new GUI()
    gui.title("标签控制")

    const settings = {
      fontSize: 13,
      showLabels: true,
      showCoords: true
    }

    const styleFolder = gui.addFolder("🎨 标签样式")
    styleFolder
      .add(settings, "fontSize", 10, 20, 1)
      .name("字体大小")
      .onChange((val) => {
        labelObjects.forEach((l) => {
          l.div.style.fontSize = val + "px"
        })
      })
    styleFolder
      .add(settings, "showLabels")
      .name("显示标签")
      .onChange((val) => {
        labelObjects.forEach((l) => {
          l.div.style.display = val ? "block" : "none"
        })
      })
    styleFolder
      .add(settings, "showCoords")
      .name("显示坐标")
      .onChange((val) => {
        labelObjects.forEach((l) => {
          const span = l.div.querySelector("span")
          if (span) span.style.display = val ? "inline" : "none"
        })
      })
    styleFolder.open()
  }

  /**
   * 动画循环
   */
  const animate = () => {
    animationId = requestAnimationFrame(animate)

    if (!clock || !scene || !camera || !renderer || !labelRenderer || !controls) return

    const elapsed = clock.getElapsedTime()

    // 让有轨道参数的物体做圆周运动
    interactiveObjects.forEach((mesh, i) => {
      const config = mesh.userData
      if (config.orbitRadius > 0) {
        const angle = elapsed * config.orbitSpeed
        mesh.position.x = Math.cos(angle) * config.orbitRadius
        mesh.position.z = Math.sin(angle) * config.orbitRadius
        // 让物体上下浮动
        mesh.position.y = 1 + Math.sin(elapsed * 1.5 + i) * 0.3
      }
    })

    // 更新标签内容（坐标）
    labelObjects.forEach((labelObj, i) => {
      const mesh = interactiveObjects[i]
      const pos = mesh.position
      const span = labelObj.div.querySelector("span")
      if (span) {
        span.textContent = `(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`
      }
    })

    controls.update()
    renderer.render(scene, camera)
    labelRenderer.render(scene, camera)
  }

  /**
   * 处理窗口大小变化
   */
  const handleResize = () => {
    if (!camera || !renderer || !labelRenderer) return

    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    labelRenderer.setSize(window.innerWidth, window.innerHeight)
  }

  /**
   * 清理资源
   */
  const dispose = () => {
    if (animationId) cancelAnimationFrame(animationId)

    // 移除 CSS2D 渲染器的 DOM
    if (labelRenderer && containerRef.value) {
      containerRef.value.removeChild(labelRenderer.domElement)
      labelRenderer.domElement = null as any
    }

    // 清理标签 DOM
    labelObjects.forEach((l) => {
      l.div.remove()
    })

    // 清理场景
    interactiveObjects.forEach((obj) => {
      obj.geometry.dispose()
      const mat = obj.material
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose())
      } else {
        mat.dispose()
      }
    })

    controls?.dispose()
    renderer?.dispose()
    gui?.destroy()

    window.removeEventListener("resize", handleResize)

    scene = null
    camera = null
    renderer = null
    labelRenderer = null
    controls = null
    clock = null
    gui = null
    interactiveObjects = []
    labelObjects = []
  }

  onMounted(() => {
    initScene()
    addLights()
    addFloor()
    createObjects()
    initGUI()
    window.addEventListener("resize", handleResize)
    animate()
  })

  onUnmounted(() => {
    dispose()
  })
</script>

<template>
  <PageLayout
    title="🏷️ CSS2D 标签系统"
    description="HTML 标签跟随 3D 物体移动，支持动态内容更新和样式自定义"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🏷️ <strong>CSS2DRenderer</strong> - HTML 标签叠加在 WebGL canvas 上</li>
          <li>📍 <strong>位置跟随</strong> - 标签实时跟踪 3D 物体位置</li>
          <li>🔄 <strong>动态更新</strong> - 标签内容（坐标）每帧更新</li>
          <li>🎨 <strong>自定义样式</strong> - 背景色、边框、字体大小可调</li>
          <li>🚀 <strong>轨道运动</strong> - 部分物体自动做圆周运动展示标签跟随</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 关键技术点：</h3>
        <ul>
          <li><strong>CSS2DRenderer</strong>：独立的渲染器，输出 HTML DOM</li>
          <li><strong>CSS2DObject</strong>：将 DOM 元素附加到 3D 场景中</li>
          <li><strong>position: absolute</strong>：叠加在 WebGL canvas 上方</li>
          <li><strong>pointerEvents: none</strong>：标签不拦截鼠标事件</li>
          <li><strong>不使用 useThreeScene</strong>：手动管理渲染和生命周期</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js"</code></p>
        <p><code /></p>
        <p><code>// 创建 CSS2D 渲染器</code></p>
        <p><code>const labelRenderer = new CSS2DRenderer()</code></p>
        <p><code>labelRenderer.domElement.style.position = "absolute"</code></p>
        <p><code>container.appendChild(labelRenderer.domElement)</code></p>
        <p><code /></p>
        <p><code>// 创建标签</code></p>
        <p><code>const div = document.createElement("div")</code></p>
        <p><code>const label = new CSS2DObject(div)</code></p>
        <p><code>label.position.set(0, 1.5, 0)</code></p>
        <p><code>mesh.add(label)</code></p>
      </div>

      <div class="controls-tip">
        <p>🎮 操作方式：</p>
        <ul>
          <li>🔭 鼠标拖拽 → 旋转视角</li>
          <li>🔍 滚轮 → 缩放</li>
          <li>🎛️ GUI → 调整标签样式</li>
        </ul>
      </div>
    </template>

    <div
      ref="containerRef"
      style="width: 100%; height: 100vh"
    />
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
