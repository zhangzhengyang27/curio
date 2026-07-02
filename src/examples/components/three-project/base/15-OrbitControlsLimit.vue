<script setup lang="ts">
  import { shallowRef, onUnmounted, onMounted } from "vue"
  import * as THREE from "three"
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
  import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 容器引用
  const containerRef = shallowRef<HTMLDivElement | null>(null)

  // Three.js 对象引用
  let scene!: THREE.Scene
  let camera!: THREE.PerspectiveCamera
  let renderer!: THREE.WebGLRenderer
  let controls!: OrbitControls
  let gui!: GUI
  let animationId: number | null = null
  let envMap: THREE.Texture | null = null
  let loadedModel: THREE.Object3D | null = null

  /**
   * 初始化场景
   */
  const initScene = () => {
    if (!containerRef.value) return

    // 创建场景
    scene = new THREE.Scene()
    // 设置背景颜色（粉色背景）
    scene.background = new THREE.Color(0xe2d0e0)

    // 创建相机
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(5, 1.8, 0)
    camera.lookAt(0, 1.2, 0)

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance" // 使用高性能模式
    })
    // 💡 性能优化：禁用阴影（这个演示不需要阴影）
    renderer.shadowMap.enabled = false
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.value.appendChild(renderer.domElement)

    // 添加坐标轴辅助器
    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)

    // 初始化轨道控制器（带限制）
    initControls()

    console.log("场景初始化完成")
  }

  /**
   * 初始化轨道控制器（带限制）
   */
  const initControls = () => {
    if (!camera || !renderer) return

    controls = new OrbitControls(camera, renderer.domElement)

    // 启用阻尼
    controls.enableDamping = true
    controls.dampingFactor = 0.05

    // 设置控制器目标点（关注点）
    controls.target.set(0, 1.2, 0)

    // 禁用平移（适合室内场景漫游）
    controls.enablePan = false

    // 设置距离限制（缩放限制）
    controls.minDistance = 3 // 最小距离
    controls.maxDistance = 5 // 最大距离

    // 设置垂直角度限制（极角，从 Y 轴向下的角度）
    // Math.PI / 2 是水平视角
    controls.minPolarAngle = Math.PI / 2 - Math.PI / 12 // 最小极角（向上 15 度）
    controls.maxPolarAngle = Math.PI / 2 // 最大极角（水平）

    // 设置水平角度限制（方位角，从 Z 轴的旋转角度）
    controls.minAzimuthAngle = Math.PI / 2 - Math.PI / 12 // 最小方位角（-15 度）
    controls.maxAzimuthAngle = Math.PI / 2 + Math.PI / 12 // 最大方位角（+15 度）

    console.log("控制器限制设置完成")
  }

  /**
   * 加载 HDR 环境贴图（优化版本 - 使用较小的纹理）
   */
  const loadHDREnvironment = () => {
    // 💡 性能优化：对于控制器演示，不需要加载 HDR 环境贴图
    // 使用简单的环境光即可
    if (!scene) return

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    // 添加方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    console.log("光照设置完成")

    // 如果确实需要 HDR，可以使用这段代码（但会影响性能）
    /*
    const rgbeLoader = new RGBELoader()
    rgbeLoader.load(
      "/three-project/texture/3DTotal-Medieval_City_0001_4k.hdr",
      (texture) => {
        texture.mapping = THREE.EquirectangularRefractionMapping
        envMap = texture
        if (scene) {
          scene.environment = texture
        }
        console.log("HDR 环境贴图加载成功")
      },
      undefined,
      (error) => {
        console.error("HDR 环境贴图加载失败:", error)
      }
    )
    */
  }

  /**
   * 加载 GLTF 模型（优化版本）
   */
  const loadGltfModel = () => {
    if (!scene) return

    // 💡 性能优化：city.glb 模型太大太复杂，会导致严重性能问题
    // 对于控制器演示，使用简单的几何体即可

    // 创建一个简单的房间场景
    createSimpleRoom()

    // 如果确实需要加载城市模型，使用下面的代码（但会严重影响性能）
    /*
    const gltfLoader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath("/three-project/draco/")
    gltfLoader.setDRACOLoader(dracoLoader)

    gltfLoader.load(
      "/three-project/model/city.glb",
      (gltf) => {
        console.log("城市场景模型加载成功:", gltf)
        loadedModel = gltf.scene
        
        // 性能优化：简化模型
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            // 禁用阴影接收和投射
            child.castShadow = false
            child.receiveShadow = false
            // 简化几何体（如果可能）
            if (child.geometry) {
              child.geometry.computeBoundingSphere()
            }
          }
        })
        
        scene.add(gltf.scene)
      },
      (progress) => {
        const percent = (progress.loaded / progress.total) * 100
        console.log(`模型加载进度: ${percent.toFixed(2)}%`)
      },
      (error) => {
        console.error("模型加载失败:", error)
      }
    )
    */
  }

  /**
   * 创建简单的房间场景（替代复杂的城市模型）
   */
  const createSimpleRoom = () => {
    if (!scene) return

    // 创建地板
    const floorGeometry = new THREE.PlaneGeometry(10, 10)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.8,
      metalness: 0.2
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    scene.add(floor)

    // 创建一些立方体作为场景物体
    const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)
    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a90e2,
      roughness: 0.5,
      metalness: 0.5
    })

    // 在目标点周围添加一些立方体
    for (let i = 0; i < 5; i++) {
      const box = new THREE.Mesh(boxGeometry, boxMaterial.clone())
      const angle = (i / 5) * Math.PI * 2
      const radius = 2
      box.position.set(Math.cos(angle) * radius, 0.25, Math.sin(angle) * radius)
      const mat = box.material as THREE.MeshStandardMaterial
      mat.color!.setHSL(i / 5, 0.7, 0.5)
      scene.add(box)
    }

    // 在中心添加一个高的立方体（观察目标）
    const centerBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 2.4, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0xe74c3c,
        roughness: 0.4,
        metalness: 0.6
      })
    )
    centerBox.position.set(0, 1.2, 0)
    scene.add(centerBox)

    console.log("简单场景创建完成")
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    // 控制器限制参数
    if (controls) {
      const controlsFolder = gui.addFolder("🎮 控制器限制")

      const controlsParams = {
        enablePan: controls.enablePan,
        minDistance: controls.minDistance,
        maxDistance: controls.maxDistance,
        minPolarAngle: (controls.minPolarAngle * 180) / Math.PI,
        maxPolarAngle: (controls.maxPolarAngle * 180) / Math.PI,
        minAzimuthAngle: (controls.minAzimuthAngle * 180) / Math.PI,
        maxAzimuthAngle: (controls.maxAzimuthAngle * 180) / Math.PI
      }

      controlsFolder
        .add(controlsParams, "enablePan")
        .name("启用平移")
        .onChange((value) => {
          controls.enablePan = value
        })

      controlsFolder
        .add(controlsParams, "minDistance", 1, 10, 0.1)
        .name("最小距离")
        .onChange((value) => {
          controls.minDistance = value
        })

      controlsFolder
        .add(controlsParams, "maxDistance", 1, 20, 0.1)
        .name("最大距离")
        .onChange((value) => {
          controls.maxDistance = value
        })

      controlsFolder
        .add(controlsParams, "minPolarAngle", 0, 180, 1)
        .name("最小极角（度）")
        .onChange((value) => {
          controls.minPolarAngle = (value * Math.PI) / 180
        })

      controlsFolder
        .add(controlsParams, "maxPolarAngle", 0, 180, 1)
        .name("最大极角（度）")
        .onChange((value) => {
          controls.maxPolarAngle = (value * Math.PI) / 180
        })

      controlsFolder
        .add(controlsParams, "minAzimuthAngle", -180, 180, 1)
        .name("最小方位角（度）")
        .onChange((value) => {
          controls.minAzimuthAngle = (value * Math.PI) / 180
        })

      controlsFolder
        .add(controlsParams, "maxAzimuthAngle", -180, 180, 1)
        .name("最大方位角（度）")
        .onChange((value) => {
          controls.maxAzimuthAngle = (value * Math.PI) / 180
        })

      controlsFolder.open()
    }

    // 相机信息
    const infoFolder = gui.addFolder("📊 相机信息")
    const info = {
      position: "0, 0, 0",
      distance: 0,
      polarAngle: 0,
      azimuthAngle: 0
    }

    infoFolder.add(info, "position").name("相机位置").listen()
    infoFolder.add(info, "distance").name("距离目标").listen()
    infoFolder.add(info, "polarAngle").name("极角（度）").listen()
    infoFolder.add(info, "azimuthAngle").name("方位角（度）").listen()

    // 💡 性能优化：在动画循环中更新信息，而不是使用 setInterval
    // 将 info 对象暴露给动画循环使用
    window.__cameraInfo = info

    infoFolder.open()
  }

  /**
   * 动画循环（优化版本）
   */
  const animate = () => {
    animationId = requestAnimationFrame(animate)

    // 更新控制器
    if (controls) {
      controls.update()
    }

    // 💡 性能优化：在动画循环中更新 GUI 信息（而不是使用 setInterval）
    if (camera && controls && window.__cameraInfo) {
      const info = window.__cameraInfo
      info.position = `${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}`

      // 计算相机到目标的距离
      const distance = camera.position.distanceTo(controls.target)
      info.distance = distance.toFixed(2)

      // 计算极角（垂直角度）
      const polarAngle = controls.getPolarAngle()
      info.polarAngle = ((polarAngle * 180) / Math.PI).toFixed(1)

      // 计算方位角（水平角度）
      const azimuthAngle = controls.getAzimuthalAngle()
      info.azimuthAngle = ((azimuthAngle * 180) / Math.PI).toFixed(1)
    }

    // 渲染场景
    if (renderer && scene && camera) {
      renderer.render(scene, camera)
    }
  }

  /**
   * 处理窗口大小变化
   */
  const handleResize = () => {
    if (!camera || !renderer) return

    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  /**
   * 清理资源
   */
  const dispose = () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }

    // 清理控制器
    if (controls) {
      controls.dispose()
    }

    // 清理环境贴图
    if (envMap) {
      envMap.dispose()
      envMap = null
    }

    // 清理加载的模型
    if (loadedModel && scene) {
      loadedModel.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose()
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
      scene.remove(loadedModel)
      loadedModel = null
    }

    // 清理场景
    if (scene) {
      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose()
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
    }

    // 清理渲染器
    if (renderer) {
      renderer.dispose()
    }

    // 清理 GUI
    if (gui) {
      gui.destroy()
    }

    // 清理全局变量
    if (window.__cameraInfo) {
      delete window.__cameraInfo
    }

    // 移除事件监听
    window.removeEventListener("resize", handleResize)
  }

  // 组件挂载后初始化
  onMounted(() => {
    initScene()
    loadHDREnvironment()
    loadGltfModel()
    initGUI()
    animate()
    window.addEventListener("resize", handleResize)
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    dispose()
  })
</script>

<template>
  <PageLayout
    title="🎮 控制器限制查看 3D 场景"
    description="学习如何限制 OrbitControls 的查看范围，适合室内场景漫游和展示"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🎮 <strong>控制器限制</strong> - 限制轨道控制器的各种参数</li>
          <li>🚫 <strong>禁用平移</strong> - enablePan = false，防止偏离场景</li>
          <li>📏 <strong>距离限制</strong> - minDistance 和 maxDistance 控制缩放范围</li>
          <li>⬆️ <strong>垂直角度限制</strong> - minPolarAngle 和 maxPolarAngle</li>
          <li>↔️ <strong>水平角度限制</strong> - minAzimuthAngle 和 maxAzimuthAngle</li>
          <li>🎯 <strong>目标点设置</strong> - target.set() 设置关注点</li>
          <li>🎨 <strong>简单场景</strong> - 使用简单几何体替代复杂模型（性能优化）</li>
          <li>📊 <strong>实时信息</strong> - 显示相机位置、距离、角度等</li>
          <li>⚡ <strong>性能优化</strong> - 禁用不必要的阴影和 HDR，流畅运行</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 控制器目标点 (Target)：</h3>
        <ul>
          <li><strong>定义</strong>：控制器旋转和观察的中心点</li>
          <li><strong>设置</strong>：controls.target.set(x, y, z)</li>
          <li><strong>本例</strong>：target.set(0, 1.2, 0) - 关注高度 1.2 的点</li>
          <li><strong>作用</strong>：相机围绕此点旋转，适合观察特定对象</li>
          <li>💡 场景漫游通常设置目标点为人眼高度（1.5-1.8m）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🚫 禁用平移 (enablePan)：</h3>
        <ul>
          <li><strong>默认值</strong>：true（允许平移）</li>
          <li><strong>设置为 false</strong>：禁止用户通过鼠标右键平移相机</li>
          <li><strong>适用场景</strong>：</li>
          <li>&nbsp;&nbsp;• 场景漫游（防止"穿墙"）</li>
          <li>&nbsp;&nbsp;• 产品展示（固定展示区域）</li>
          <li>&nbsp;&nbsp;• 限定观察范围的应用</li>
          <li>💡 禁用平移可以让用户更专注于旋转观察</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📏 距离限制 (Distance)：</h3>
        <ul>
          <li><strong>minDistance</strong>：相机到目标点的最小距离</li>
          <li>&nbsp;&nbsp;• 本例：3 - 防止靠得太近</li>
          <li>&nbsp;&nbsp;• 用途：避免穿模、保持合适的观察距离</li>
          <li><strong>maxDistance</strong>：相机到目标点的最大距离</li>
          <li>&nbsp;&nbsp;• 本例：5 - 防止离得太远</li>
          <li>&nbsp;&nbsp;• 用途：保持清晰度、限制观察范围</li>
          <li><strong>缩放控制</strong>：鼠标滚轮缩放被限制在此范围内</li>
          <li>💡 场景漫游建议距离范围 2-6 米</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⬆️ 垂直角度限制 (Polar Angle)：</h3>
        <ul>
          <li><strong>定义</strong>：极角，从 Y 轴正方向（上）向下测量的角度</li>
          <li><strong>范围</strong>：0 到 π（0° 到 180°）</li>
          <li><strong>参考值</strong>：</li>
          <li>&nbsp;&nbsp;• 0（0°）：从正上方向下看</li>
          <li>&nbsp;&nbsp;• π/2（90°）：水平视角</li>
          <li>&nbsp;&nbsp;• π（180°）：从正下方向上看</li>
          <li><strong>本例设置</strong>：</li>
          <li>&nbsp;&nbsp;• minPolarAngle: π/2 - π/12（75°）- 允许稍微向上看</li>
          <li>&nbsp;&nbsp;• maxPolarAngle: π/2（90°）- 最多水平看</li>
          <li><strong>效果</strong>：限制相机只能在水平到稍微向上的范围内</li>
          <li>💡 场景漫游通常限制在 60°-120° 范围，模拟人眼视角</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>↔️ 水平角度限制 (Azimuth Angle)：</h3>
        <ul>
          <li><strong>定义</strong>：方位角，在 XZ 平面上从 Z 轴正方向的旋转角度</li>
          <li><strong>范围</strong>：-∞ 到 +∞（默认无限制）</li>
          <li><strong>参考值</strong>：</li>
          <li>&nbsp;&nbsp;• 0：朝向 +Z 方向</li>
          <li>&nbsp;&nbsp;• π/2（90°）：朝向 +X 方向</li>
          <li>&nbsp;&nbsp;• π（180°）：朝向 -Z 方向</li>
          <li>&nbsp;&nbsp;• -π/2（-90°）：朝向 -X 方向</li>
          <li><strong>本例设置</strong>：</li>
          <li>&nbsp;&nbsp;• minAzimuthAngle: π/2 - π/12（75°）</li>
          <li>&nbsp;&nbsp;• maxAzimuthAngle: π/2 + π/12（105°）</li>
          <li><strong>效果</strong>：限制水平旋转在 30° 范围内（75° 到 105°）</li>
          <li>💡 适合展示特定方向的场景，如房间一角</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>// 设置控制器限制</code></p>
        <p><code>controls.target.set(0, 1.2, 0) // 目标点</code></p>
        <p><code>controls.enablePan = false // 禁用平移</code></p>
        <p><code>controls.minDistance = 3 // 最小距离</code></p>
        <p><code>controls.maxDistance = 5 // 最大距离</code></p>
        <p><code>controls.minPolarAngle = Math.PI/2 - Math.PI/12</code></p>
        <p><code>controls.maxPolarAngle = Math.PI/2</code></p>
        <p><code>controls.minAzimuthAngle = Math.PI/2 - Math.PI/12</code></p>
        <p><code>controls.maxAzimuthAngle = Math.PI/2 + Math.PI/12</code></p>
      </div>

      <div class="info-section">
        <h3>🎯 应用场景示例：</h3>
        <ul>
          <li><strong>室内展厅</strong>：</li>
          <li>&nbsp;&nbsp;• 禁用平移，限制角度范围</li>
          <li>&nbsp;&nbsp;• 距离 2-6 米，极角 60°-120°</li>
          <li><strong>产品展示</strong>：</li>
          <li>&nbsp;&nbsp;• 目标设置在产品中心</li>
          <li>&nbsp;&nbsp;• 距离 1-3 米，允许 360° 旋转</li>
          <li><strong>建筑外观</strong>：</li>
          <li>&nbsp;&nbsp;• 限制极角 30°-90°（不看地下）</li>
          <li>&nbsp;&nbsp;• 距离 10-50 米</li>
          <li><strong>博物馆展品</strong>：</li>
          <li>&nbsp;&nbsp;• 方位角限制 180°（只看正面）</li>
          <li>&nbsp;&nbsp;• 极角 45°-135°</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📐 角度计算说明：</h3>
        <ul>
          <li><strong>弧度转角度</strong>：角度 = 弧度 × 180 / π</li>
          <li><strong>角度转弧度</strong>：弧度 = 角度 × π / 180</li>
          <li><strong>常用角度</strong>：</li>
          <li>&nbsp;&nbsp;• 15° = π/12 弧度</li>
          <li>&nbsp;&nbsp;• 30° = π/6 弧度</li>
          <li>&nbsp;&nbsp;• 45° = π/4 弧度</li>
          <li>&nbsp;&nbsp;• 90° = π/2 弧度</li>
          <li>&nbsp;&nbsp;• 180° = π 弧度</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚙️ 实现要点：</h3>
        <ul>
          <li>1️⃣ <strong>先设置 target</strong> - 在设置其他参数前设置目标点</li>
          <li>2️⃣ <strong>角度使用弧度</strong> - Three.js 使用弧度制，不是角度</li>
          <li>3️⃣ <strong>合理的限制</strong> - 根据场景特点设置合适的范围</li>
          <li>4️⃣ <strong>测试体验</strong> - 实际操作测试用户体验是否友好</li>
          <li>5️⃣ <strong>更新控制器</strong> - 修改参数后控制器会自动生效</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔧 其他控制器参数：</h3>
        <ul>
          <li><strong>enableRotate</strong>：是否允许旋转（默认 true）</li>
          <li><strong>enableZoom</strong>：是否允许缩放（默认 true）</li>
          <li><strong>autoRotate</strong>：是否自动旋转（默认 false）</li>
          <li><strong>autoRotateSpeed</strong>：自动旋转速度（默认 2.0）</li>
          <li><strong>rotateSpeed</strong>：手动旋转速度（默认 1.0）</li>
          <li><strong>zoomSpeed</strong>：缩放速度（默认 1.0）</li>
          <li><strong>panSpeed</strong>：平移速度（默认 1.0）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚠️ 注意事项：</h3>
        <ul>
          <li>🔸 <strong>角度范围</strong>：minAngle 必须小于 maxAngle</li>
          <li>🔸 <strong>距离范围</strong>：minDistance 必须小于 maxDistance</li>
          <li>🔸 <strong>极角限制</strong>：0 ≤ minPolarAngle &lt; maxPolarAngle ≤ π</li>
          <li>🔸 <strong>方位角</strong>：可以设置负值，范围可超过 2π</li>
          <li>🔸 <strong>用户体验</strong>：过度限制可能让用户感到受限</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🚀 进阶技巧：</h3>
        <ul>
          <li>💡 根据场景动态调整控制器限制</li>
          <li>💡 使用 <strong>controls.saveState()</strong> 和 <strong>reset()</strong> 保存/恢复状态</li>
          <li>💡 监听控制器事件（change、start、end）实现交互</li>
          <li>💡 结合碰撞检测防止相机穿透物体</li>
          <li>💡 使用 <strong>screenSpacePanning</strong> 改变平移行为</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚡ 本示例的性能优化：</h3>
        <ul>
          <li>✅ <strong>轻量场景</strong>：使用简单几何体替代复杂的 city.glb 模型</li>
          <li>✅ <strong>禁用阴影</strong>：关闭 shadowMap，减少 GPU 负担</li>
          <li>✅ <strong>简化光照</strong>：使用环境光+方向光，替代 4K HDR 贴图</li>
          <li>✅ <strong>优化更新</strong>：在 requestAnimationFrame 中更新 GUI，而非 setInterval</li>
          <li>✅ <strong>性能模式</strong>：渲染器使用 powerPreference: "high-performance"</li>
          <li>💡 如需复杂场景，请取消注释相关代码（会影响性能）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📊 实时信息说明：</h3>
        <ul>
          <li><strong>相机位置</strong>：当前相机的 (x, y, z) 坐标</li>
          <li><strong>距离目标</strong>：相机到目标点的欧氏距离</li>
          <li><strong>极角</strong>：当前垂直角度（0°=俯视，90°=水平，180°=仰视）</li>
          <li><strong>方位角</strong>：当前水平角度（相对于 Z 轴的旋转）</li>
          <li>💡 观察这些值有助于理解控制器的工作原理</li>
        </ul>
      </div>

      <div class="controls-tip">
        <p>🎮 操作提示：</p>
        <ul>
          <li>🖱️ <strong>左键拖动</strong>：旋转视角（受角度限制）</li>
          <li>🖱️ <strong>右键拖动</strong>：平移（已禁用）</li>
          <li>🖱️ <strong>滚轮</strong>：缩放（限制在 3-5 米范围）</li>
          <li>🎚️ <strong>GUI 面板</strong>：实时调整所有控制器参数</li>
          <li>&nbsp;&nbsp;• 尝试修改角度范围观察效果变化</li>
          <li>&nbsp;&nbsp;• 启用/禁用平移查看区别</li>
          <li>&nbsp;&nbsp;• 调整距离限制范围</li>
          <li>💡 <strong>建议</strong>：先尝试旋转和缩放，感受限制效果</li>
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
