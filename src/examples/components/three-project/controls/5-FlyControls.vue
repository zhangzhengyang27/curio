<script setup lang="ts">
  /**
   * 飞行控制器 (FlyControls)
   * 第一人称飞行视角，适用于在 3D 世界中自由漫游
   */
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { FlyControls } from "three/examples/jsm/controls/FlyControls.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 容器引用
  const containerRef = shallowRef(null)

  // Clock 用于计算 delta 时间
  const clock = new THREE.Clock()

  // GUI 实例
  let gui!: GUI

  // FlyControls 实例
  let flyControls!: FlyControls

  // 用于在动画循环中判断是否已初始化
  let isInited = false

  // 飞行状态信息
  let flightInfo!: { posX: number; posY: number; posZ: number; speed: string }

  // 使用公共的 Three.js 场景逻辑（禁用默认 OrbitControls）
  const {
    scene,
    camera,
    renderer,
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 0, y: 10, z: 30 },
    enableControls: false, // 禁用 OrbitControls，使用 FlyControls 替代
    controlsConfig: {},
    showAxesHelper: false,
    showGridHelper: false
  })

  /**
   * 创建 3D 世界场景 - 包含大量物体供飞行探索
   */
  const createWorld = () => {
    if (!scene.value) return

    // 设置雾效，增加空间感
    scene.value.fog = new THREE.FogExp2(0x0a0a2e, 0.008)

    // 设置场景背景
    scene.value.background = new THREE.Color(0x0a0a2e)

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6)
    scene.value.add(ambientLight)

    // 添加方向光（模拟太阳）
    const sunLight = new THREE.DirectionalLight(0xffeedd, 1.2)
    sunLight.position.set(50, 80, 30)
    scene.value.add(sunLight)

    // 添加点光源（模拟灯光）
    const pointLight1 = new THREE.PointLight(0xff6644, 2, 50)
    pointLight1.position.set(0, 8, 0)
    scene.value.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0x4488ff, 2, 50)
    pointLight2.position.set(20, 5, -20)
    scene.value.add(pointLight2)

    // --- 创建地面 ---
    const groundGeo = new THREE.PlaneGeometry(500, 500)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a3e,
      roughness: 0.9,
      metalness: 0.1
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = 0
    scene.value.add(ground)

    // --- 创建星球群 ---
    const planetColors = [0xff4466, 0x44ff88, 0x4488ff, 0xffaa44, 0xaa44ff, 0xff44aa]
    for (let i = 0; i < 40; i++) {
      const radius = Math.max(0.5, Math.random() * 3 + 0.5)
      const planetGeo = new THREE.SphereGeometry(radius, 24, 24)
      const planetMat = new THREE.MeshStandardMaterial({
        color: planetColors[Math.floor(Math.random() * planetColors.length)],
        roughness: 0.6,
        metalness: 0.3,
        emissive: planetColors[Math.floor(Math.random() * planetColors.length)],
        emissiveIntensity: 0.1
      })
      const planet = new THREE.Mesh(planetGeo, planetMat)
      planet.position.set(
        (Math.random() - 0.5) * 200,
        Math.random() * 30 + 2,
        (Math.random() - 0.5) * 200
      )
      scene.value.add(planet)
    }

    // --- 创建方块建筑群 ---
    const buildingColors = [0x334455, 0x445566, 0x556677, 0x2a3a4a, 0x3a4a5a]
    for (let i = 0; i < 50; i++) {
      const w = Math.random() * 3 + 1
      const h = Math.random() * 15 + 3
      const d = Math.random() * 3 + 1
      const buildingGeo = new THREE.BoxGeometry(w, h, d)
      const buildingMat = new THREE.MeshStandardMaterial({
        color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
        roughness: 0.7,
        metalness: 0.2
      })
      const building = new THREE.Mesh(buildingGeo, buildingMat)
      building.position.set(
        (Math.random() - 0.5) * 150,
        h / 2,
        (Math.random() - 0.5) * 150
      )
      scene.value.add(building)

      // 给一些建筑添加发光窗户效果
      if (Math.random() > 0.5) {
        const windowLight = new THREE.PointLight(
          Math.random() > 0.5 ? 0xffdd88 : 0x88ddff,
          0.5,
          10
        )
        windowLight.position.copy(building.position)
        windowLight.position.y = h * 0.6
        scene.value.add(windowLight)
      }
    }

    // --- 创建装饰性环状物 ---
    for (let i = 0; i < 15; i++) {
      const ringRadius = Math.max(1, Math.random() * 5 + 2)
      const tubeRadius = Math.max(0.1, Math.random() * 0.3 + 0.1)
      const ringGeo = new THREE.TorusGeometry(ringRadius, tubeRadius, 16, 100)
      const ringMat = new THREE.MeshStandardMaterial({
        color: planetColors[Math.floor(Math.random() * planetColors.length)],
        roughness: 0.3,
        metalness: 0.7,
        emissive: planetColors[Math.floor(Math.random() * planetColors.length)],
        emissiveIntensity: 0.2
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.set(
        (Math.random() - 0.5) * 160,
        Math.random() * 20 + 5,
        (Math.random() - 0.5) * 160
      )
      ring.rotation.x = Math.random() * Math.PI
      ring.rotation.y = Math.random() * Math.PI
      scene.value.add(ring)
    }

    // --- 创建发光粒子 ---
    const particleCount = 500
    const particlePositions = new Float32Array(particleCount * 3)
    const particleColors = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 300
      particlePositions[i * 3 + 1] = Math.random() * 50 + 1
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 300

      const color = new THREE.Color(
        planetColors[Math.floor(Math.random() * planetColors.length)]
      )
      particleColors[i * 3] = color.r
      particleColors[i * 3 + 1] = color.g
      particleColors[i * 3 + 2] = color.b
    }

    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3))
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3))

    const particleMat = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    })

    const particles = new THREE.Points(particleGeo, particleMat)
    scene.value.add(particles)
  }

  /**
   * 初始化 FlyControls
   */
  const initFlyControls = () => {
    if (!camera.value || !renderer.value) return

    // 创建 FlyControls 实例
    flyControls = new FlyControls(camera.value, renderer.value.domElement)

    // 基本配置
    flyControls.rollSpeed = 0.5 // 翻滚速度
    flyControls.autoForward = false // 不自动前进
    flyControls.dragToLook = false // 鼠标移动即控制视角（不需要拖拽）

    // 移动速度
    ;(flyControls as any).moveForward = false
    ;(flyControls as any).moveBackward = false
    ;(flyControls as any).moveLeft = false
    ;(flyControls as any).moveRight = false

    // 重置 Clock，避免第一帧 delta 过大
    clock.getDelta()
  }

  /**
   * 初始化 GUI 控制面板
   */
  const initGUI = () => {
    gui = new GUI({ title: "飞行控制" })

    // 飞行状态信息（只读显示）
    flightInfo = {
      posX: 0,
      posY: 0,
      posZ: 0,
      speed: "正常"
    }

    const infoFolder = gui.addFolder("飞行信息")
    infoFolder.add(flightInfo, "posX").name("X 位置").listen().decimals(1)
    infoFolder.add(flightInfo, "posY").name("Y 位置").listen().decimals(1)
    infoFolder.add(flightInfo, "posZ").name("Z 位置").listen().decimals(1)
    infoFolder.add(flightInfo, "speed").name("速度").listen()

    // FlyControls 参数控制
    const paramsFolder = gui.addFolder("控制器参数")
    const params = {
      rollSpeed: flyControls.rollSpeed,
      autoForward: flyControls.autoForward,
      dragToLook: flyControls.dragToLook
    }

    paramsFolder
      .add(params, "rollSpeed", 0, 5, 0.1)
      .name("翻滚速度")
      .onChange((value) => {
        flyControls.rollSpeed = value
      })

    paramsFolder
      .add(params, "autoForward")
      .name("自动前进")
      .onChange((value) => {
        flyControls.autoForward = value
      })

    paramsFolder
      .add(params, "dragToLook")
      .name("拖拽查看")
      .onChange((value) => {
        flyControls.dragToLook = value
      })

    // 移动状态显示（只读，由键盘控制）
    const moveFolder = gui.addFolder("移动状态")
    const moveInfo = {
      forward: false,
      backward: false,
      left: false,
      right: false
    }

    moveFolder.add(moveInfo, "forward").name("前进 (W)").listen()
    moveFolder.add(moveInfo, "backward").name("后退 (S)").listen()
    moveFolder.add(moveInfo, "left").name("左移 (A)").listen()
    moveFolder.add(moveInfo, "right").name("右移 (D)").listen()

    // 保存 moveInfo 引用以便在键盘事件中更新
    window._flyMoveInfo = moveInfo

    // 视角重置
    const actionFolder = gui.addFolder("操作")
    actionFolder.add({
      resetView: () => {
        if (camera.value) {
          camera.value.position.set(0, 10, 30)
          camera.value.lookAt(0, 0, 0)
        }
      }
    }, "resetView").name("🔄 重置视角")
  }

  /**
   * 动画循环 - 更新 FlyControls 和飞行信息
   */
  const animate = () => {
    if (!isInited) return

    const delta = clock.getDelta()

    // 更新 FlyControls（必须传入 delta 时间）
    if (flyControls) {
      flyControls.update(delta)
    }

    // 更新飞行信息显示
    if (camera.value && flightInfo) {
      flightInfo.posX = camera.value.position.x
      flightInfo.posY = camera.value.position.y
      flightInfo.posZ = camera.value.position.z

      // 检测 Shift 键状态来显示速度
      flightInfo.speed = window._flyBoost ? "加速 ⚡" : "正常"
    }
  }

  /**
   * 键盘按下事件处理
   */
  const onKeyDown = (event: KeyboardEvent) => {
    if (!flyControls) return

    const moveInfo = window._flyMoveInfo
    if (!moveInfo) return

    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        ;(flyControls as any).moveForward = true
        moveInfo.forward = true
        break
      case "KeyS":
      case "ArrowDown":
        ;(flyControls as any).moveBackward = true
        moveInfo.backward = true
        break
      case "KeyA":
      case "ArrowLeft":
        ;(flyControls as any).moveLeft = true
        moveInfo.left = true
        break
      case "KeyD":
      case "ArrowRight":
        ;(flyControls as any).moveRight = true
        moveInfo.right = true
        break
      case "ShiftLeft":
      case "ShiftRight":
        // Shift 加速：增大移动速度
        flyControls.movementSpeed = 5
        window._flyBoost = true
        break
      case "KeyQ":
        // Q 下降
        if (camera.value) {
          camera.value.position.y -= 1
        }
        break
      case "KeyE":
        // E 上升
        if (camera.value) {
          camera.value.position.y += 1
        }
        break
    }
  }

  /**
   * 键盘松开事件处理
   */
  const onKeyUp = (event: KeyboardEvent) => {
    if (!flyControls) return

    const moveInfo = window._flyMoveInfo
    if (!moveInfo) return

    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        ;(flyControls as any).moveForward = false
        moveInfo.forward = false
        break
      case "KeyS":
      case "ArrowDown":
        ;(flyControls as any).moveBackward = false
        moveInfo.backward = false
        break
      case "KeyA":
      case "ArrowLeft":
        ;(flyControls as any).moveLeft = false
        moveInfo.left = false
        break
      case "KeyD":
      case "ArrowRight":
        ;(flyControls as any).moveRight = false
        moveInfo.right = false
        break
      case "ShiftLeft":
      case "ShiftRight":
        // 松开 Shift 恢复正常速度
        flyControls.movementSpeed = 1
        window._flyBoost = false
        break
    }
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 移除事件监听
    window.removeEventListener("keydown", onKeyDown)
    window.removeEventListener("keyup", onKeyUp)

    // 清理飞行状态
    delete window._flyMoveInfo
    delete window._flyBoost

    // 清理 FlyControls
    flyControls?.dispose()

    // 清理 GUI
    gui?.destroy()

    // 调用基础清理
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    createWorld()
    initFlyControls()
    initGUI()
    isInited = true
    startAnimation(animate) // 传入 animate 回调
  })

  // 添加键盘事件监听
  onMounted(() => {
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
  })

  // 清理资源
  onUnmounted(() => {
    isInited = false
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="✈️ FlyControls 飞行控制器"
    description="第一人称飞行视角，在 3D 星际世界中自由漫游"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="controls-tip">
        <p>🎮 <strong>操作说明</strong></p>
        <ul>
          <li>🖱️ <strong>鼠标移动</strong> - 控制飞行方向（视角）</li>
          <li>⌨️ <strong>W / ↑</strong> - 向前飞行</li>
          <li>⌨️ <strong>S / ↓</strong> - 向后飞行</li>
          <li>⌨️ <strong>A / ←</strong> - 向左飞行</li>
          <li>⌨️ <strong>D / →</strong> - 向右飞行</li>
          <li>⌨️ <strong>Q</strong> - 下降</li>
          <li>⌨️ <strong>E</strong> - 上升</li>
          <li>⌨️ <strong>Shift</strong> - 加速飞行</li>
        </ul>
      </div>

      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>✈️ <strong>自由飞行</strong> - 6 自由度飞行控制</li>
          <li>🌌 <strong>3D 世界</strong> - 星球、建筑、粒子组成的奇幻场景</li>
          <li>⚙️ <strong>参数调节</strong> - 翻滚速度、自动前进、拖拽查看</li>
          <li>📊 <strong>实时信息</strong> - 位置坐标和飞行速度显示</li>
          <li>⚡ <strong>加速模式</strong> - 按住 Shift 加速飞行</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>🔧 核心代码：</p>
        <p style="margin-top: 8px">
          创建控制器：<code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px">new FlyControls(camera, domElement)</code>
        </p>
        <p style="margin-top: 4px">
          更新控制器：<code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px">flyControls.update(clock.getDelta())</code>
        </p>
        <p style="margin-top: 4px">
          移动控制：<code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px">flyControls.moveForward = true/false</code>
        </p>
        <p style="margin-top: 4px">
          速度调节：<code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px">flyControls.movementSpeed = 5</code>
        </p>
      </div>

      <div class="info-section">
        <h3>📚 应用场景：</h3>
        <ul>
          <li>🎮 FPS 游戏视角控制</li>
          <li>🌌 太空/飞行模拟器</li>
          <li>🗺️ 3D 地图/城市漫游</li>
          <li>🏗️ 建筑方案预览漫游</li>
          <li>🤖 无人机飞行模拟</li>
        </ul>
      </div>
    </template>

    <!-- Three.js 容器 -->
    <div ref="containerRef" />
  </PageLayout>
</template>

<style scoped>
  :deep(canvas) {
    cursor: none;
  }
</style>
