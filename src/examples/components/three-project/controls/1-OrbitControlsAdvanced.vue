<script setup lang="ts">
  /**
   * OrbitControls 进阶用法
   * 展示 OrbitControls 的高级功能，包括阻尼、自动旋转、目标切换、限制参数等
   */
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
    camera,
    controls,
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 5, y: 5, z: 5 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 2,
      maxDistance: 20
    },
    showAxesHelper: true,
    showGridHelper: true
  })

  // GUI 引用
  let gui: GUI | null = null

  // 场景中的物体引用
  let meshes: THREE.Mesh[] = []

  // 目标切换动画相关变量
  let isTransitioning = false
  let transitionStartPos = new THREE.Vector3()
  let transitionEndPos = new THREE.Vector3()
  let transitionStartTarget = new THREE.Vector3()
  let transitionEndTarget = new THREE.Vector3()
  let transitionProgress = 0
  const transitionDuration = 1.0 // 切换动画持续时间（秒）

  // 事件状态显示
  let eventStatus = { status: "无事件" }

  /**
   * 创建场景中的物体
   * 包含 3 个不同颜色和形状的几何体
   */
  const createObjects = () => {
    if (!scene.value) return

    // 清除已有物体
    meshes.forEach((mesh) => scene.value!.remove(mesh))
    meshes = []

    // 物体 1: 红色立方体（左侧）
    const boxGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2)
    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      roughness: 0.3,
      metalness: 0.5
    })
    const box = new THREE.Mesh(boxGeometry, boxMaterial)
    box.position.set(-3, 0.6, 0)
    box.name = "红色立方体"
    scene.value.add(box)
    meshes.push(box)

    // 物体 2: 绿色球体（中间）
    const sphereGeometry = new THREE.SphereGeometry(0.8, 32, 32)
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0x44ff44,
      roughness: 0.2,
      metalness: 0.6
    })
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.position.set(0, 0.8, 0)
    sphere.name = "绿色球体"
    scene.value.add(sphere)
    meshes.push(sphere)

    // 物体 3: 蓝色圆锥体（右侧）
    const coneGeometry = new THREE.ConeGeometry(0.7, 1.5, 32)
    const coneMaterial = new THREE.MeshStandardMaterial({
      color: 0x4444ff,
      roughness: 0.4,
      metalness: 0.3
    })
    const cone = new THREE.Mesh(coneGeometry, coneMaterial)
    cone.position.set(3, 0.75, 0)
    cone.name = "蓝色圆锥体"
    scene.value.add(cone)
    meshes.push(cone)

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    ambientLight.name = "ambientLight"
    scene.value.add(ambientLight)

    // 添加平行光（增强视觉效果）
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    directionalLight.position.set(5, 10, 5)
    directionalLight.name = "directionalLight"
    scene.value.add(directionalLight)
  }

  /**
   * 缓动函数：平滑过渡
   * 使用 easeInOutCubic 缓动
   */
  const easeInOutCubic = (t: number) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  /**
   * 平滑切换相机目标和位置
   * @param {THREE.Vector3} targetPosition - 要查看的目标位置
   * @param {THREE.Vector3} cameraPosition - 相机移动到的位置
   */
  const smoothTransitionTo = (targetPosition: THREE.Vector3, cameraPosition: THREE.Vector3) => {
    if (isTransitioning || !camera.value || !controls.value) return

    isTransitioning = true
    transitionProgress = 0

    // 记录起始状态
    transitionStartPos.copy(camera.value.position)
    transitionStartTarget.copy(controls.value.target)

    // 记录目标状态
    transitionEndPos.copy(cameraPosition)
    transitionEndTarget.copy(targetPosition)
  }

  /**
   * 每帧更新切换动画
   */
  const updateTransition = () => {
    if (!isTransitioning || !camera.value || !controls.value) return

    transitionProgress += 1 / 60 // 假设 60fps

    if (transitionProgress >= transitionDuration) {
      // 动画完成，直接设置最终位置
      camera.value.position.copy(transitionEndPos)
      controls.value.target.copy(transitionEndTarget)
      controls.value.update()
      isTransitioning = false
      return
    }

    // 计算当前进度（带缓动）
    const t = easeInOutCubic(transitionProgress / transitionDuration)

    // 插值相机位置
    camera.value.position.lerpVectors(transitionStartPos, transitionEndPos, t)
    // 插值目标位置
    controls.value.target.lerpVectors(transitionStartTarget, transitionEndTarget, t)
    controls.value.update()
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    // ====== 自动旋转控制 ======
    const autoRotateFolder = gui.addFolder("🔄 自动旋转")

    const autoRotateParams = {
      autoRotate: false,
      autoRotateSpeed: 2.0
    }

    autoRotateFolder
      .add(autoRotateParams, "autoRotate")
      .name("启用自动旋转")
      .onChange((value) => {
        if (controls.value) {
          controls.value.autoRotate = value
        }
      })

    autoRotateFolder
      .add(autoRotateParams, "autoRotateSpeed", 0.1, 10, 0.1)
      .name("旋转速度")
      .onChange((value) => {
        if (controls.value) {
          controls.value.autoRotateSpeed = value
        }
      })

    autoRotateFolder.open()

    // ====== 限制参数控制 ======
    const limitsFolder = gui.addFolder("📐 限制参数")

    const limitsParams = {
      minDistance: 2,
      maxDistance: 20,
      minPolarAngle: 0, // 0 度（正上方）
      maxPolarAngle: Math.PI, // 180 度（正下方）
      minAzimuthAngle: -Math.PI, // -180 度
      maxAzimuthAngle: Math.PI, // 180 度
      enablePan: true,
      enableRotate: true,
      enableZoom: true
    }

    limitsFolder
      .add(limitsParams, "minDistance", 0.5, 10, 0.5)
      .name("最小距离")
      .onChange((value) => {
        if (controls.value) controls.value.minDistance = value
      })

    limitsFolder
      .add(limitsParams, "maxDistance", 5, 50, 1)
      .name("最大距离")
      .onChange((value) => {
        if (controls.value) controls.value.maxDistance = value
      })

    limitsFolder
      .add(limitsParams, "minPolarAngle", 0, Math.PI / 2, 0.05)
      .name("最小仰角 (rad)")
      .onChange((value) => {
        if (controls.value) controls.value.minPolarAngle = value
      })

    limitsFolder
      .add(limitsParams, "maxPolarAngle", Math.PI / 4, Math.PI, 0.05)
      .name("最大仰角 (rad)")
      .onChange((value) => {
        if (controls.value) controls.value.maxPolarAngle = value
      })

    limitsFolder
      .add(limitsParams, "minAzimuthAngle", -Math.PI, 0, 0.05)
      .name("最小方位角 (rad)")
      .onChange((value) => {
        if (controls.value) controls.value.minAzimuthAngle = value
      })

    limitsFolder
      .add(limitsParams, "maxAzimuthAngle", 0, Math.PI, 0.05)
      .name("最大方位角 (rad)")
      .onChange((value) => {
        if (controls.value) controls.value.maxAzimuthAngle = value
      })

    limitsFolder.open()

    // ====== 控制开关 ======
    const toggleFolder = gui.addFolder("⚙️ 控制开关")

    toggleFolder
      .add(limitsParams, "enablePan")
      .name("启用平移")
      .onChange((value) => {
        if (controls.value) controls.value.enablePan = value
      })

    toggleFolder
      .add(limitsParams, "enableRotate")
      .name("启用旋转")
      .onChange((value) => {
        if (controls.value) controls.value.enableRotate = value
      })

    toggleFolder
      .add(limitsParams, "enableZoom")
      .name("启用缩放")
      .onChange((value) => {
        if (controls.value) controls.value.enableZoom = value
      })

    toggleFolder.open()

    // ====== 事件状态 ======
    const eventFolder = gui.addFolder("📡 控制器事件")
    eventFolder.add(eventStatus, "status").name("当前事件").listen()
    eventFolder.open()
  }

  /**
   * 初始化控制器事件监听
   */
  const initControlEvents = () => {
    if (!controls.value) return

    // 开始拖拽事件
    controls.value.addEventListener("start", () => {
      eventStatus.status = "start - 开始操作"
    })

    // 变化事件
    controls.value.addEventListener("change", () => {
      eventStatus.status = "change - 正在操作"
    })

    // 结束拖拽事件
    controls.value.addEventListener("end", () => {
      eventStatus.status = "end - 操作结束"
    })
  }

  /**
   * 切换到查看红色立方体
   */
  const focusOnBox = () => {
    smoothTransitionTo(
      new THREE.Vector3(-3, 0.6, 0), // 目标：立方体位置
      new THREE.Vector3(-5, 3, 3) // 相机位置
    )
  }

  /**
   * 切换到查看绿色球体
   */
  const focusOnSphere = () => {
    smoothTransitionTo(
      new THREE.Vector3(0, 0.8, 0), // 目标：球体位置
      new THREE.Vector3(2, 3, 3) // 相机位置
    )
  }

  /**
   * 切换到查看蓝色圆锥体
   */
  const focusOnCone = () => {
    smoothTransitionTo(
      new THREE.Vector3(3, 0.75, 0), // 目标：圆锥位置
      new THREE.Vector3(5, 3, 3) // 相机位置
    )
  }

  /**
   * 恢复到默认视角
   */
  const resetView = () => {
    smoothTransitionTo(
      new THREE.Vector3(0, 0, 0), // 目标：原点
      new THREE.Vector3(5, 5, 5) // 相机位置
    )
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理 GUI
    gui?.destroy()
    gui = null

    // 清理引用
    meshes = []

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    // 创建场景物体
    createObjects()
    // 初始化 GUI
    initGUI()
    // 初始化控制器事件
    initControlEvents()
    // 启动动画循环
    startAnimation(() => {
      // 更新目标切换动画
      updateTransition()
    })
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🎮 OrbitControls 进阶"
    description="深入探索 OrbitControls 的高级功能：自动旋转、目标切换、限制参数和事件监听"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🔄 <strong>自动旋转</strong> - 场景自动旋转展示（可调速度）</li>
          <li>🎯 <strong>目标切换</strong> - 点击按钮平滑切换查看不同物体</li>
          <li>📐 <strong>距离限制</strong> - minDistance / maxDistance 控制缩放范围</li>
          <li>📏 <strong>角度限制</strong> - 极角和方位角限制旋转范围</li>
          <li>⚙️ <strong>功能开关</strong> - 独立控制平移、旋转、缩放</li>
          <li>📡 <strong>事件监听</strong> - start / change / end 事件</li>
          <li>阻尼 <strong>平滑效果</strong> - enableDamping 惯性阻尼</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎮 视角切换按钮：</h3>
        <ul>
          <li>📦 <strong>查看立方体</strong> - 相机移动到红色立方体附近</li>
          <li>⚽ <strong>查看球体</strong> - 相机移动到绿色球体附近</li>
          <li>🔺 <strong>查看圆锥</strong> - 相机移动到蓝色圆锥附近</li>
          <li>🏠 <strong>重置视角</strong> - 恢复默认视角</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 核心参数说明：</h3>
        <ul>
          <li><code>enableDamping</code> - 启用阻尼，需在动画循环中调用 update()</li>
          <li><code>dampingFactor</code> - 阻尼系数，值越小惯性越大</li>
          <li><code>autoRotate</code> - 自动旋转开关</li>
          <li><code>autoRotateSpeed</code> - 自动旋转速度（默认 2.0）</li>
          <li><code>minDistance / maxDistance</code> - 相机到目标的最小/最大距离</li>
          <li><code>minPolarAngle / maxPolarAngle</code> - 垂直旋转角度限制（弧度）</li>
          <li><code>minAzimuthAngle / maxAzimuthAngle</code> - 水平旋转角度限制（弧度）</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 使用技巧：</p>
        <ul style="margin-top: 8px">
          <li>• 左键拖拽旋转，右键拖拽平移，滚轮缩放</li>
          <li>• 在 GUI 面板中实时调整所有参数</li>
          <li>• 角度限制使用弧度制：π/2 = 90°, π = 180°</li>
          <li>• 事件面板可查看控制器当前交互状态</li>
        </ul>
      </div>

      <!-- 视角切换按钮区域 -->
      <div class="button-group">
        <button
          class="btn"
          @click="focusOnBox"
        >
          📦 查看立方体
        </button>
        <button
          class="btn"
          @click="focusOnSphere"
        >
          ⚽ 查看球体
        </button>
        <button
          class="btn"
          @click="focusOnCone"
        >
          🔺 查看圆锥
        </button>
        <button
          class="btn btn-reset"
          @click="resetView"
        >
          🏠 重置视角
        </button>
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

  /* 按钮组样式 */
  .button-group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 10px;
  }

  .btn {
    padding: 8px 14px;
    background: rgba(66, 185, 131, 0.8);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: background 0.3s, transform 0.1s;
  }

  .btn:hover {
    background: rgba(66, 185, 131, 1);
  }

  .btn:active {
    transform: scale(0.95);
  }

  .btn-reset {
    background: rgba(255, 165, 0, 0.8);
  }

  .btn-reset:hover {
    background: rgba(255, 165, 0, 1);
  }
</style>
