<script setup lang="ts">
  /**
   * PointerLockControls 第一人称射击视角（FPS）
   * 使用 PointerLockControls 实现鼠标锁定和第一人称视角
   * WASD 移动 + 空格跳跃 + 鼠标视角控制
   */
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 容器引用
  const containerRef = shallowRef<HTMLDivElement | null>(null)

  // 使用公共的 Three.js 场景逻辑
  // enableControls: false 禁用默认 OrbitControls，手动创建 PointerLockControls
  const {
    scene,
    camera,
    renderer,
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 0, y: 1.7, z: 3 },
    enableControls: false,
    showAxesHelper: false,
    showGridHelper: false
  })

  // PointerLockControls 引用
    let pointerLockControls: PointerLockControls | null = null

    // PointerLockControls 事件监听
    const onPointerLock = () => {
      isLocked = true
    }
    const onPointerUnlock = () => {
      isLocked = false
    }

    // 移动状态
  let moveForward = false
  let moveBackward = false
  let moveLeft = false
  let moveRight = false
  let canJump = true

  // 物理参数
  const velocity = new THREE.Vector3()
  const direction = new THREE.Vector3()
  const moveSpeed = 5.0 // 移动速度
  const jumpVelocity = 8.0 // 跳跃初始速度
  const gravity = 20.0 // 重力加速度
  const playerHeight = 1.7 // 玩家眼睛高度

  // 鼠标锁定状态
  let isLocked = false

  // 时钟（用于帧率无关的物理计算）
  const _clock = new THREE.Clock()

  // 场景中的碰撞物体（用于限制玩家移动）
  let collidableObjects: THREE.Mesh[] = []

  // 动画 ID
  let prevTime = 0

  // 键盘事件清理函数（模块级变量，不污染全局命名空间）
  let keyCleanup: (() => void) | null = null

  /**
   * 创建房间场景
   * 包含地面、墙壁和一些物体
   */
  const createRoom = () => {
    if (!scene.value) return

    // 设置场景背景色（天蓝色）
    scene.value.background = new THREE.Color(0x87ceeb)
    // 添加雾效增加空间感
    scene.value.fog = new THREE.Fog(0x87ceeb, 10, 50)

    // ====== 环境光 ======
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    ambientLight.name = "ambientLight"
    scene.value.add(ambientLight)

    // ====== 平行光（模拟太阳光） ======
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 20, 10)
    directionalLight.name = "directionalLight"
    scene.value.add(directionalLight)

    // ====== 地面 ======
    const floorGeometry = new THREE.PlaneGeometry(30, 30)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.8,
      metalness: 0.2
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.name = "地面"
    scene.value.add(floor)

    // ====== 天花板 ======
    const ceilingGeometry = new THREE.PlaneGeometry(30, 30)
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.9,
      metalness: 0.1
    })
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial)
    ceiling.rotation.x = Math.PI / 2
    ceiling.position.y = 4
    ceiling.name = "天花板"
    scene.value.add(ceiling)

    // ====== 墙壁 ======
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.7,
      metalness: 0.1
    })

    // 后墙
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 4), wallMaterial)
    backWall.position.set(0, 2, -15)
    backWall.name = "后墙"
    scene.value.add(backWall)

    // 左墙
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 4), wallMaterial)
    leftWall.position.set(-15, 2, 0)
    leftWall.rotation.y = Math.PI / 2
    leftWall.name = "左墙"
    scene.value.add(leftWall)

    // 右墙
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 4), wallMaterial)
    rightWall.position.set(15, 2, 0)
    rightWall.rotation.y = -Math.PI / 2
    rightWall.name = "右墙"
    scene.value.add(rightWall)

    // 前墙
    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 4), wallMaterial)
    frontWall.position.set(0, 2, 15)
    frontWall.rotation.y = Math.PI
    frontWall.name = "前墙"
    scene.value.add(frontWall)

    // ====== 场景中的物体 ======
    // 红色方块
    const box1 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.4, metalness: 0.3 })
    )
    box1.position.set(-4, 1, -4)
    box1.name = "红色方块"
    scene.value.add(box1)
    collidableObjects.push(box1)

    // 绿色方块（较大）
    const box2 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1.5, 3),
      new THREE.MeshStandardMaterial({ color: 0x44ff44, roughness: 0.4, metalness: 0.3 })
    )
    box2.position.set(4, 0.75, -3)
    box2.name = "绿色方块"
    scene.value.add(box2)
    collidableObjects.push(box2)

    // 蓝色圆柱
    const cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 3, 32),
      new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.3, metalness: 0.5 })
    )
    cylinder.position.set(0, 1.5, -7)
    cylinder.name = "蓝色圆柱"
    scene.value.add(cylinder)
    collidableObjects.push(cylinder)

    // 黄色球体
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.2, metalness: 0.6 })
    )
    sphere.position.set(6, 0.8, 4)
    sphere.name = "黄色球体"
    scene.value.add(sphere)
    collidableObjects.push(sphere)

    // 紫色圆锥
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 2, 32),
      new THREE.MeshStandardMaterial({ color: 0xaa44ff, roughness: 0.3, metalness: 0.4 })
    )
    cone.position.set(-6, 1, 5)
    cone.name = "紫色圆锥"
    scene.value.add(cone)
    collidableObjects.push(cone)

    // 橙色圆环
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(0.7, 0.2, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0xff8800, roughness: 0.3, metalness: 0.5 })
    )
    torus.position.set(3, 1.5, 7)
    torus.rotation.x = Math.PI / 4
    torus.name = "橙色圆环"
    scene.value.add(torus)

    // 一排小方块作为台阶
    for (let i = 0; i < 5; i++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.4, 1.5),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(i / 5, 0.7, 0.5),
          roughness: 0.5,
          metalness: 0.2
        })
      )
      step.position.set(-8 + i * 1.6, 0.2 + i * 0.4, 2)
      step.name = `台阶 ${i + 1}`
      scene.value.add(step)
      collidableObjects.push(step)
    }
  }

  /**
   * 初始化 PointerLockControls
   */
  const initPointerLockControls = () => {
    if (!camera.value || !renderer.value || !scene.value) return

    // 创建 PointerLockControls
    pointerLockControls = new PointerLockControls(camera.value, renderer.value.domElement)

    // 将控制器添加到场景中（PointerLockControls 本身不添加，但需要设置场景引用）
    scene.value.add(pointerLockControls.object)

    // ====== 鼠标锁定事件 ======
      // 锁定成功
      pointerLockControls.addEventListener("lock", onPointerLock)

      // 解锁
      pointerLockControls.addEventListener("unlock", onPointerUnlock)

    // ====== 键盘事件 ======
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          moveForward = true
          break
        case "KeyS":
        case "ArrowDown":
          moveBackward = true
          break
        case "KeyA":
        case "ArrowLeft":
          moveLeft = true
          break
        case "KeyD":
        case "ArrowRight":
          moveRight = true
          break
        case "Space":
          if (canJump) {
            velocity.y = jumpVelocity
            canJump = false
          }
          break
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          moveForward = false
          break
        case "KeyS":
        case "ArrowDown":
          moveBackward = false
          break
        case "KeyA":
        case "ArrowLeft":
          moveLeft = false
          break
        case "KeyD":
        case "ArrowRight":
          moveRight = false
          break
      }
    }

    // 监听键盘事件
    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("keyup", onKeyUp)

    // 保存清理函数引用（模块级变量，不污染全局命名空间）
    keyCleanup = () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("keyup", onKeyUp)
    }
  }

  /**
   * 点击 canvas 锁定鼠标指针
   */
  const lockPointer = () => {
    if (pointerLockControls && !isLocked) {
      pointerLockControls.lock()
    }
  }

  /**
   * 物理更新函数（每帧调用）
   * 处理移动、重力和碰撞
   */
  const updatePhysics = () => {
    if (!pointerLockControls || !isLocked) return

    const time = performance.now()

    if (prevTime === 0) {
      prevTime = time
      return
    }

    // 计算帧间隔时间
    const delta = (time - prevTime) / 1000
    prevTime = time

    // 防止 delta 过大（例如切换标签页后回来）
    const clampedDelta = Math.min(delta, 0.1)

    // 限制移动范围
    const boundary = 14 // 房间边界（墙壁内部）

    // 阻尼衰减（松开按键后逐渐停止）
    velocity.x -= velocity.x * 10.0 * clampedDelta
    velocity.z -= velocity.z * 10.0 * clampedDelta

    // 重力
    velocity.y -= gravity * clampedDelta

    // 方向
    direction.z = Number(moveForward) - Number(moveBackward)
    direction.x = Number(moveRight) - Number(moveLeft)
    direction.normalize() // 确保对角线移动速度一致

    // 计算移动速度
    if (moveForward || moveBackward) velocity.z -= direction.z * moveSpeed * clampedDelta
    if (moveLeft || moveRight) velocity.x -= direction.x * moveSpeed * clampedDelta

    // 应用移动（使用 PointerLockControls 的 moveForward 和 moveRight）
    pointerLockControls.moveRight(-velocity.x * clampedDelta)
    pointerLockControls.moveForward(-velocity.z * clampedDelta)

    // 获取控制器对象（包含相机）
    const obj = pointerLockControls.object

    // 垂直方向（跳跃 + 重力）
    obj.position.y += velocity.y * clampedDelta

    // 地面碰撞检测
    if (obj.position.y < playerHeight) {
      velocity.y = 0
      obj.position.y = playerHeight
      canJump = true
    }

    // 边界限制
    obj.position.x = Math.max(-boundary, Math.min(boundary, obj.position.x))
    obj.position.z = Math.max(-boundary, Math.min(boundary, obj.position.z))
    // 天花板限制
    obj.position.y = Math.min(playerHeight, obj.position.y)
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理键盘事件（使用模块级变量，不污染全局命名空间）
    if (keyCleanup) {
      keyCleanup()
      keyCleanup = null
    }

    // 解锁鼠标
    if (pointerLockControls && isLocked) {
      document.exitPointerLock()
    }

    // 清理 PointerLockControls
      if (pointerLockControls) {
        pointerLockControls.removeEventListener("lock", onPointerLock)
        pointerLockControls.removeEventListener("unlock", onPointerUnlock)
        pointerLockControls.dispose()
        pointerLockControls = null
      }

    // 清理引用
    collidableObjects = []

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    // 创建房间场景
    createRoom()
    // 初始化 PointerLockControls
    initPointerLockControls()
    // 启动动画循环
    startAnimation(() => {
      // 更新物理
      updatePhysics()
    })
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🎯 第一人称视角 (FPS)"
    description="使用 PointerLockControls 实现第一人称射击视角，支持 WASD 移动、跳跃和鼠标视角控制"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🖱️ <strong>鼠标锁定</strong> - 点击画面锁定鼠标指针</li>
          <li>🔦 <strong>视角控制</strong> - 鼠标移动控制视角旋转</li>
          <li>🏃 <strong>WASD 移动</strong> - 前后左右移动（支持方向键）</li>
          <li>🦘 <strong>空格跳跃</strong> - 简单重力模拟的跳跃</li>
          <li>🏠 <strong>房间场景</strong> - 地面、墙壁、天花板和各种物体</li>
          <li>🎯 <strong>十字准心</strong> - 屏幕中央的准心 UI</li>
          <li>⚡ <strong>帧率无关</strong> - 使用 delta time 保证不同帧率下速度一致</li>
        </ul>
      </div>

      <div class="controls-tip">
        <p>🎮 操作指南：</p>
        <ul>
          <li>🖱️ <strong>点击画面</strong> - 锁定鼠标进入第一人称模式</li>
          <li>⬆️⬇️ <strong>鼠标上下</strong> - 上下旋转视角</li>
          <li>⬅️➡️ <strong>鼠标左右</strong> - 左右旋转视角</li>
          <li><strong>W / ↑</strong> - 向前移动</li>
          <li><strong>S / ↓</strong> - 向后移动</li>
          <li><strong>A / ←</strong> - 向左移动</li>
          <li><strong>D / →</strong> - 向右移动</li>
          <li><strong>空格</strong> - 跳跃</li>
          <li><strong>ESC</strong> - 解锁鼠标</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 PointerLockControls 说明：</h3>
        <ul>
          <li><code>controls.lock()</code> - 锁定鼠标指针</li>
          <li><code>controls.unlock()</code> - 解锁鼠标指针</li>
          <li><code>controls.moveForward(distance)</code> - 向前移动</li>
          <li><code>controls.moveRight(distance)</code> - 向右移动</li>
          <li><code>'lock'</code> 事件 - 鼠标锁定时触发</li>
          <li><code>'unlock'</code> 事件 - 鼠标解锁时触发</li>
          <li>需要用户交互（如点击）才能调用 requestPointerLock</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 与 OrbitControls 的区别：</p>
        <ul style="margin-top: 8px">
          <li>• OrbitControls: 围绕目标旋转（第三人称）</li>
          <li>• PointerLockControls: 第一人称自由视角</li>
          <li>• PointerLockControls 不提供缩放和平移</li>
          <li>• 适合 FPS 游戏、虚拟漫游等场景</li>
        </ul>
      </div>
    </template>

    <!-- Three.js 容器 -->
    <div
      ref="containerRef"
      @click="lockPointer"
    >
      <!-- 十字准心（鼠标锁定时显示） -->
      <div
        class="crosshair"
        :style="{ opacity: isLocked ? 1 : 0 }"
      >
        <div class="crosshair-h" />
        <div class="crosshair-v" />
        <div class="crosshair-dot" />
      </div>
      <!-- 提示信息（鼠标未锁定时显示） -->
      <div
        class="lock-hint"
        :style="{ opacity: isLocked ? 0 : 1 }"
      >
        <p>🎮 点击画面进入第一人称视角</p>
        <p class="small-text">
          WASD 移动 | 空格跳跃 | ESC 退出
        </p>
      </div>
    </div>
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

  /* 十字准心样式 */
  .crosshair {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 20;
    transition: opacity 0.3s;
  }

  .crosshair-h {
    position: absolute;
    width: 20px;
    height: 2px;
    background: rgba(255, 255, 255, 0.8);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
  }

  .crosshair-v {
    position: absolute;
    width: 2px;
    height: 20px;
    background: rgba(255, 255, 255, 0.8);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
  }

  .crosshair-dot {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(255, 50, 50, 0.9);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 6px rgba(255, 50, 50, 0.5);
  }

  /* 锁定提示样式 */
  .lock-hint {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: white;
    background: rgba(0, 0, 0, 0.7);
    padding: 30px 40px;
    border-radius: 12px;
    border: 2px solid rgba(66, 185, 131, 0.6);
    pointer-events: none;
    z-index: 20;
    transition: opacity 0.3s;
    backdrop-filter: blur(10px);
  }

  .lock-hint p {
    margin: 0 0 10px 0;
    font-size: 18px;
    font-weight: bold;
  }

  .lock-hint .small-text {
    font-size: 13px;
    color: #ccc;
    font-weight: normal;
    margin: 0;
  }
</style>
