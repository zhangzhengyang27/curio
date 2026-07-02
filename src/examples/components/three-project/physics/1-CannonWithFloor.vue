<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import * as CANNON from "cannon-es"

  // 容器引用
  const containerRef = shallowRef(null)

  // 物理引擎和场景对象引用
  let world: CANNON.World | null = null
  let sphere: THREE.Mesh | null = null
  let sphereBody: CANNON.Body | null = null
  let floor: THREE.Mesh | null = null
  let floorBody: CANNON.Body | null = null
  let sphereWorldMaterial: CANNON.Material | null = null
  let clock: THREE.Clock | null = null
  let gui: GUI | null = null

  // 使用公共的 Three.js 场景逻辑
  const {
    scene,
    camera,
    renderer,
    controls,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 0, y: 0, z: 18 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05
    },
    showAxesHelper: true,
    axesHelperSize: 5
  })

  /**
   * 创建物理世界
   */
  const createPhysicsWorld = () => {
    world = new CANNON.World()
    world.gravity.set(0, -9.8, 0)
  }

  /**
   * 创建球体和物理体
   */
  const createSphere = () => {
    if (!scene.value || !world) return

    // 创建 Three.js 球体（渲染用）
    const sphereGeometry = new THREE.SphereGeometry(1, 20, 20)
    const sphereMaterial = new THREE.MeshStandardMaterial()
    sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.castShadow = true
    scene.value.add(sphere)

    // 创建物理小球形状
    const sphereShape = new CANNON.Sphere(1)

    // 设置物体材质
    sphereWorldMaterial = new CANNON.Material()

    // 创建物理世界的物体
    sphereBody = new CANNON.Body({
      shape: sphereShape,
      position: new CANNON.Vec3(0, 0, 0),
      mass: 1, // 小球质量
      material: sphereWorldMaterial // 物体材质
    })

    // 将物体添加至物理世界
    world.addBody(sphereBody)
  }

  /**
   * 创建地板和物理地面
   */
  const createFloor = () => {
    if (!scene.value || !world) return

    // 创建 Three.js 地面（渲染用）
    floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial())
    floor.position.set(0, -5, 0)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.value.add(floor)

    // 物理世界创建地面
    const floorShape = new CANNON.Plane()
    floorBody = new CANNON.Body()
    // 当质量为0的时候，可以使得物体保持不动
    floorBody.mass = 0
    floorBody.addShape(floorShape)
    // 地面位置
    floorBody.position.set(0, -5, 0)
    // 旋转地面的位置
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    world.addBody(floorBody)
  }

  /**
   * 添加光源
   */
  const addLights = () => {
    if (!scene.value) return

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.value.add(ambientLight)

    // 添加平行光
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5)
    dirLight.castShadow = true
    scene.value.add(dirLight)
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()
    gui.title("物理引擎控制")

    // 球体控制
    const sphereFolder = gui.addFolder("⚽ 球体属性")

    const sphereSettings = {
      resetPosition: () => {
        if (sphereBody) {
          sphereBody.position.set(0, 0, 0)
          sphereBody.velocity.set(0, 0, 0)
          sphereBody.angularVelocity.set(0, 0, 0)
        }
      },
      addForce: () => {
        if (sphereBody) {
          sphereBody.applyLocalForce(
            new CANNON.Vec3(0, 300, 0), // 力的大小和方向
            new CANNON.Vec3(0, 0, 0) // 作用点
          )
        }
      }
    }

    sphereFolder.add(sphereSettings, "resetPosition").name("重置位置")
    sphereFolder.add(sphereSettings, "addForce").name("施加向上的力")
    sphereFolder.open()

    // 物理世界控制
    const worldFolder = gui.addFolder("🌍 物理世界")

    const worldSettings = {
      gravity: -9.8
    }

    worldFolder
      .add(worldSettings, "gravity", -20, 0, 0.1)
      .name("重力")
      .onChange((value) => {
        if (world) {
          world.gravity.set(0, value, 0)
        }
      })

    worldFolder.open()
  }

  /**
   * 自定义渲染循环
   */
  const customRender = () => {
    if (!clock || !world || !sphere || !sphereBody || !renderer.value || !scene.value || !camera.value) return

    const deltaTime = clock.getDelta()

    // 更新物理引擎世界
    world.step(1 / 120, deltaTime)

    // 同步 Three.js 球体位置到物理引擎
    sphere.position.copy(sphereBody.position)

    // 更新控制器
    if (controls.value) {
      controls.value.update()
    }

    // 渲染场景
    renderer.value.render(scene.value, camera.value)

    // 请求下一帧
    requestAnimationFrame(customRender)
  }

  /**
   * 初始化场景内容
   */
  const initContent = () => {
    if (!scene.value) return

    // 创建时钟
    clock = new THREE.Clock()

    // 创建物理世界
    createPhysicsWorld()

    // 创建球体
    createSphere()

    // 创建地板
    createFloor()

    // 添加光源
    addLights()

    // 初始化 GUI
    initGUI()

    // 启用渲染器阴影
    if (renderer.value) {
      renderer.value.shadowMap.enabled = true
    }
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理物理世界
    if (world && sphereBody) {
      world.removeBody(sphereBody)
    }
    if (world && floorBody) {
      world.removeBody(floorBody)
    }

    // 清理场景对象
    if (sphere && scene.value) {
      scene.value.remove(sphere)
      sphere.geometry?.dispose()
      const mat = sphere.material
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose())
      } else {
        mat?.dispose()
      }
    }

    if (floor && scene.value) {
      scene.value.remove(floor)
      floor.geometry?.dispose()
      const mat = floor.material
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose())
      } else {
        mat?.dispose()
      }
    }

    // 清理 GUI
    gui?.destroy()

    // 清空引用
    world = null
    sphere = null
    sphereBody = null
    floor = null
    floorBody = null
    sphereWorldMaterial = null
    clock = null
    gui = null

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    // 初始化场景内容
    initContent()

    // 启动自定义渲染循环
    customRender()
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="⚽ Cannon 物理引擎 - 地面碰撞"
    description="使用 Cannon.js 创建物理世界 - 球体与地面的重力模拟与碰撞"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🌍 <strong>物理世界</strong> - Cannon.js 物理引擎（重力 9.8 m/s²）</li>
          <li>⚽ <strong>刚体球体</strong> - 质量为 1 的物理球体</li>
          <li>📐 <strong>物理平面</strong> - CANNON.Plane 平面碰撞形状</li>
          <li>🎯 <strong>位置同步</strong> - Three.js 渲染对象与物理对象同步</li>
          <li>⏱️ <strong>时间步进</strong> - 固定时间步长 1/120 秒</li>
          <li>💡 <strong>质量为 0</strong> - 地面质量为 0，保持静止不动</li>
          <li>🎛️ GUI 实时调整物理参数</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 关键技术点：</h3>
        <ul>
          <li><strong>PlaneGeometry</strong>：Three.js 平面几何体（渲染用）</li>
          <li><strong>CANNON.Plane</strong>：Cannon 物理平面（碰撞检测用）</li>
          <li><strong>质量为 0</strong>：floorBody.mass = 0 使地面保持静止</li>
          <li><strong>四元数旋转</strong>：quaternion.setFromAxisAngle() 旋转平面</li>
          <li><strong>阴影设置</strong>：球体投射阴影，地面接收阴影</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>// 创建物理世界</code></p>
        <p><code>const world = new CANNON.World()</code></p>
        <p><code>world.gravity.set(0, -9.8, 0)</code></p>
        <p><code /></p>
        <p><code>// 创建物理球体</code></p>
        <p><code>const sphereShape = new CANNON.Sphere(1)</code></p>
        <p><code>const sphereBody = new CANNON.Body({</code></p>
        <p><code>&nbsp;&nbsp;shape: sphereShape,</code></p>
        <p><code>&nbsp;&nbsp;mass: 1,</code></p>
        <p><code>&nbsp;&nbsp;material: new CANNON.Material()</code></p>
        <p><code>})</code></p>
        <p><code /></p>
        <p><code>// 创建物理地面（质量为 0）</code></p>
        <p><code>const floorShape = new CANNON.Plane()</code></p>
        <p><code>const floorBody = new CANNON.Body({ mass: 0 })</code></p>
        <p><code>floorBody.addShape(floorShape)</code></p>
        <p><code>floorBody.quaternion.setFromAxisAngle(</code></p>
        <p><code>&nbsp;&nbsp;new CANNON.Vec3(1, 0, 0), -Math.PI / 2</code></p>
        <p><code>)</code></p>
      </div>

      <div class="info-section">
        <h3>🔧 Cannon.js 物理平面：</h3>
        <ul>
          <li><strong>CANNON.Plane</strong> - 无限大的平面碰撞形状</li>
          <li><strong>默认朝向</strong> - 平面法线默认朝向 +Y 轴</li>
          <li><strong>旋转平面</strong> - 使用四元数（Quaternion）旋转</li>
          <li><strong>setFromAxisAngle</strong> - 通过旋转轴和角度设置四元数</li>
          <li><strong>Vec3(1,0,0)</strong> - 绕 X 轴旋转 -90° 使平面水平</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚙️ 物理体质量（Mass）：</h3>
        <ul>
          <li><strong>mass > 0</strong> - 动态物体，受力和重力影响</li>
          <li><strong>mass = 0</strong> - 静态物体，不受力影响，保持静止</li>
          <li><strong>球体质量 = 1</strong> - 会下落并与地面碰撞</li>
          <li><strong>地面质量 = 0</strong> - 保持静止，作为障碍物</li>
          <li>💡 适用于墙壁、地面等不动的物体</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 四元数（Quaternion）旋转：</h3>
        <ul>
          <li><strong>定义</strong>：用于表示 3D 空间中的旋转</li>
          <li><strong>优势</strong>：避免万向节锁、插值更平滑</li>
          <li><strong>setFromAxisAngle</strong>：通过旋转轴和角度创建四元数</li>
          <li><strong>旋转轴</strong>：Vec3(1, 0, 0) 表示绕 X 轴旋转</li>
          <li><strong>旋转角度</strong>：-Math.PI / 2 表示逆时针旋转 90°</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 使用技巧：</h3>
        <ul>
          <li>🎛️ 点击「施加向上的力」让球体弹跳</li>
          <li>🎛️ 调整重力值观察球体下落速度变化</li>
          <li>🎛️ 点击「重置位置」让球体回到原点</li>
          <li>💡 观察球体与地面的碰撞效果</li>
          <li>💡 注意时间步长对物理模拟的影响</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚡ 性能优化建议：</h3>
        <ul>
          <li>💡 使用 PlaneGeometry 而非复杂网格作为地面</li>
          <li>💡 静态物体（地面）质量设为 0 减少计算</li>
          <li>💡 合理设置时间步长（1/60 或 1/120）</li>
          <li>💡 使用简单的碰撞形状（Sphere、Plane）</li>
          <li>💡 及时清理不用的物理对象</li>
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
