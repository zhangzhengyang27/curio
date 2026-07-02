<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import * as CANNON from "cannon-es"

  const containerRef = shallowRef(null)

  // 布料参数
  const CLOTH_SIZE = 10 // 10x10 粒子网格
  const CLOTH_WIDTH = 8
  const CLOTH_HEIGHT = 6
  const REST_DIST_X = CLOTH_WIDTH / (CLOTH_SIZE - 1)
  const REST_DIST_Z = CLOTH_HEIGHT / (CLOTH_SIZE - 1)
  const MASS = 0.1

  // 物理和场景引用
  let world: CANNON.World | null = null
  let clock: THREE.Clock | null = null
  let gui: GUI | null = null
  let animationId = 0

  // 布料粒子物理体和渲染网格
    let particles: CANNON.Body[][] = [] // CANNON.Body[]
    let springs: CANNON.Spring[] = [] // CANNON.Spring[]
    const springListeners = new Map<CANNON.Spring, () => void>()
    let clothMesh: THREE.Mesh | null = null
  let clothGeometry: THREE.PlaneGeometry | null = null
  let defaultMaterial: CANNON.Material | null = null

  // 鼠标交互
  let raycaster: THREE.Raycaster | null = null
  let mouse: THREE.Vector2 | null = null
  let mousePlane: THREE.Plane | null = null
  let isDragging = false
  let dragParticle: CANNON.Body | null = null
  let dragIntersection = new THREE.Vector3()
  let _dragOffset = new THREE.Vector3()

  // 设置
  const settings = {
    windStrength: 3.0,
    windEnabled: true,
    damping: 0.03,
    stiffness: 50,
    showWireframe: true
  }

  const {
    scene,
    camera,
    renderer,
    controls,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 6, y: 5, z: 8 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 3,
      maxDistance: 20
    },
    showAxesHelper: true,
    axesHelperSize: 3
  })

  /**
   * 创建物理世界
   */
  const createPhysicsWorld = () => {
    world = new CANNON.World()
    world.gravity.set(0, -9.8, 0)
    world.solver.iterations = 20

    defaultMaterial = new CANNON.Material("default")
    const contactMat = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
      friction: 0.1,
      restitution: 0.0
    })
    world.addContactMaterial(contactMat)
  }

  /**
   * 创建布料粒子系统
   */
  const createClothParticles = () => {
    if (!scene.value || !world) return

    const startX = -CLOTH_WIDTH / 2
    const startZ = -CLOTH_HEIGHT / 2
    const startY = 5

    // 创建粒子
    for (let i = 0; i < CLOTH_SIZE; i++) {
      particles[i] = []
      for (let j = 0; j < CLOTH_SIZE; j++) {
        const x = startX + i * REST_DIST_X
        const y = startY
        const z = startZ + j * REST_DIST_Z

        const shape = new CANNON.Particle()
        const body = new CANNON.Body({
          mass: MASS,
          material: defaultMaterial ?? undefined,
          linearDamping: settings.damping
        })
        body.addShape(shape)
        body.position.set(x, y, z)

        // 顶部一排粒子固定（质量为 0）
        if (j === 0) {
          body.mass = 0
          body.updateMassProperties()
        }

        world.addBody(body)
        particles[i][j] = body
      }
    }

    // 创建弹簧（结构弹簧 + 剪切弹簧）
    for (let i = 0; i < CLOTH_SIZE; i++) {
      for (let j = 0; j < CLOTH_SIZE; j++) {
        // 结构弹簧 - 水平
        if (i < CLOTH_SIZE - 1) {
          createSpring(particles[i][j], particles[i + 1][j], REST_DIST_X)
        }
        // 结构弹簧 - 垂直
        if (j < CLOTH_SIZE - 1) {
          createSpring(particles[i][j], particles[i][j + 1], REST_DIST_Z)
        }
        // 剪切弹簧 - 对角线
        if (i < CLOTH_SIZE - 1 && j < CLOTH_SIZE - 1) {
          const diagDist = Math.sqrt(REST_DIST_X * REST_DIST_X + REST_DIST_Z * REST_DIST_Z)
          createSpring(particles[i][j], particles[i + 1][j + 1], diagDist, true)
          createSpring(particles[i + 1][j], particles[i][j + 1], diagDist, true)
        }
        // 弯曲弹簧 - 跳一个连接（增加稳定性）
        if (i < CLOTH_SIZE - 2) {
          createSpring(particles[i][j], particles[i + 2][j], REST_DIST_X * 2, true)
        }
        if (j < CLOTH_SIZE - 2) {
          createSpring(particles[i][j], particles[i][j + 2], REST_DIST_Z * 2, true)
        }
      }
    }

    // 创建布料 Mesh
    clothGeometry = new THREE.PlaneGeometry(
      CLOTH_WIDTH,
      CLOTH_HEIGHT,
      CLOTH_SIZE - 1,
      CLOTH_SIZE - 1
    )

    const clothMat = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      side: THREE.DoubleSide,
      roughness: 0.6,
      metalness: 0.1,
      wireframe: settings.showWireframe
    })

    clothMesh = new THREE.Mesh(clothGeometry, clothMat)
    clothMesh.castShadow = true
    clothMesh.receiveShadow = true
    scene.value.add(clothMesh)

    // 固定点可视化
    for (let i = 0; i < CLOTH_SIZE; i++) {
      const pinMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xe74c3c })
      )
      pinMesh.position.copy(particles[i][0].position)
      scene.value.add(pinMesh)
    }
  }

  /**
   * 创建弹簧
   */
  const createSpring = (bodyA: any, bodyB: any, restLength: number, isBend = false) => {
      if (!world) return
      const spring = new CANNON.Spring(bodyA, bodyB, {
        restLength: restLength,
        stiffness: isBend ? settings.stiffness * 0.3 : settings.stiffness,
        damping: 0.5
      })
      const onPostStep = () => {
        const force = spring.getForce()
        bodyA.applyForce(force, bodyA.position)
        bodyB.applyForce(force.negate(), bodyB.position)
      }
      spring.addEventListener("postStep", onPostStep)
      springListeners.set(spring, onPostStep)
      world.addSpring(spring)
      springs.push(spring)
    }

  /**
   * 添加地面和支架
   */
  const addGroundAndSupport = () => {
    if (!scene.value || !world) return

    // 地面
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.value.add(floor)

    // 物理地面
    const floorBody = new CANNON.Body({ mass: 0, material: defaultMaterial ?? undefined })
    floorBody.addShape(new CANNON.Plane())
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    world.addBody(floorBody)

    // 支架横杆
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(CLOTH_WIDTH + 1, 0.15, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x8b7355 })
    )
    bar.position.set(0, 5, -CLOTH_HEIGHT / 2)
    bar.castShadow = true
    scene.value.add(bar)

    // 支架竖杆
    for (let side of [-1, 1]) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 5, 8),
        new THREE.MeshStandardMaterial({ color: 0x8b7355 })
      )
      pole.position.set(side * (CLOTH_WIDTH / 2 + 0.3), 2.5, -CLOTH_HEIGHT / 2)
      pole.castShadow = true
      scene.value.add(pole)
    }
  }

  /**
   * 添加光源
   */
  const addLights = () => {
    if (!scene.value) return

    scene.value.add(new THREE.AmbientLight(0xffffff, 0.5))

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(5, 10, 5)
    dirLight.castShadow = true
    scene.value.add(dirLight)
  }

  /**
   * 初始化鼠标交互
   */
  const initMouseInteraction = () => {
    if (!renderer.value) return
    raycaster = new THREE.Raycaster()
    mouse = new THREE.Vector2()
    mousePlane = new THREE.Plane()

    const el = renderer.value.domElement
    el.addEventListener("mousedown", onMouseDown)
    el.addEventListener("mousemove", onMouseMove)
    el.addEventListener("mouseup", onMouseUp)
  }

  /**
   * 找到最近的布料粒子
   */
  const findClosestParticle = (point: THREE.Vector3) => {
    let closest = null
    let minDist = Infinity

    for (let i = 0; i < CLOTH_SIZE; i++) {
      for (let j = 0; j < CLOTH_SIZE; j++) {
        const body = particles[i][j]
        if (body.mass === 0) continue // 跳过固定点
        const dist = body.position.distanceTo(
          new CANNON.Vec3(point.x, point.y, point.z)
        )
        if (dist < minDist) {
          minDist = dist
          closest = body
        }
      }
    }

    return minDist < 2 ? closest : null
  }

  const onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0 || !raycaster || !camera.value || !mouse || !renderer.value) return

    const rect = renderer.value.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera.value)
    if (!clothMesh) return
    const intersects = raycaster.intersectObject(clothMesh)

    if (intersects.length > 0) {
      const point = intersects[0].point
      dragParticle = findClosestParticle(point)

      if (dragParticle && mousePlane) {
        isDragging = true
        // 设置拖拽平面（面向相机）
        const camDir = new THREE.Vector3()
        camera.value.getWorldDirection(camDir)
        mousePlane.setFromNormalAndCoplanarPoint(camDir.negate(), point)

        if (controls.value) controls.value.enabled = false
      }
    }
  }

  const onMouseMove = (event: MouseEvent) => {
    if (!isDragging || !dragParticle || !raycaster || !camera.value || !mouse || !mousePlane || !renderer.value) return

    const rect = renderer.value.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera.value)
    if (raycaster.ray.intersectPlane(mousePlane, dragIntersection)) {
      dragParticle.position.set(
        dragIntersection.x,
        dragIntersection.y,
        dragIntersection.z
      )
      dragParticle.velocity.set(0, 0, 0)
    }
  }

  const onMouseUp = () => {
    if (isDragging) {
      isDragging = false
      dragParticle = null
      if (controls.value) controls.value.enabled = true
    }
  }

  /**
   * 施加风力
   */
  const applyWind = () => {
    if (!settings.windEnabled || !clock) return

    const time = clock.getElapsedTime()

    for (let i = 0; i < CLOTH_SIZE; i++) {
      for (let j = 0; j < CLOTH_SIZE; j++) {
        const body = particles[i][j]
        if (body.mass === 0) continue

        // 随机风力（模拟风的波动）
        const windX = Math.sin(time * 2 + i * 0.5) * settings.windStrength
        const windY = Math.sin(time * 3 + j * 0.3) * settings.windStrength * 0.2
        const windZ = Math.cos(time * 1.5 + i * 0.3 + j * 0.2) * settings.windStrength * 0.5

        body.applyForce(
          new CANNON.Vec3(windX, windY, windZ),
          body.position
        )
      }
    }
  }

  /**
   * 更新布料网格顶点
   */
  const updateClothMesh = () => {
    if (!clothGeometry || !clothMesh) return

    const positions = clothGeometry.attributes.position.array

    for (let i = 0; i < CLOTH_SIZE; i++) {
      for (let j = 0; j < CLOTH_SIZE; j++) {
        const body = particles[i][j]
        const idx = (j * CLOTH_SIZE + i) * 3
        positions[idx] = body.position.x
        positions[idx + 1] = body.position.y
        positions[idx + 2] = body.position.z
      }
    }

    clothGeometry.attributes.position.needsUpdate = true
    clothGeometry.computeVertexNormals()
  }

  /**
   * 初始化 GUI
   */
  const initGUI = () => {
    gui = new GUI()
    gui.title("布料模拟控制")

    const windFolder = gui.addFolder("🌬️ 风力")
    windFolder.add(settings, "windEnabled").name("启用风力")
    windFolder.add(settings, "windStrength", 0, 15, 0.5).name("风力强度")
    windFolder.open()

    const physicsFolder = gui.addFolder("⚙️ 物理参数")
    physicsFolder.add(settings, "damping", 0, 0.2, 0.005).name("阻尼").onChange((val) => {
      particles.flat().forEach((body) => {
        if (body.mass > 0) body.linearDamping = val
      })
    })

    const displayFolder = gui.addFolder("🎨 显示")
    displayFolder.add(settings, "showWireframe").name("线框模式").onChange((val: boolean) => {
      if (clothMesh) {
        const materials = Array.isArray(clothMesh.material) ? clothMesh.material : [clothMesh.material]
        materials.forEach((mat) => {
          if (mat) {
            const m = mat as THREE.MeshStandardMaterial
            m.wireframe = val
          }
        })
      }
    })
    displayFolder.add({ color: "#3498db" }, "color").name("布料颜色").onChange((val: string) => {
      if (clothMesh) {
        const materials = Array.isArray(clothMesh.material) ? clothMesh.material : [clothMesh.material]
        materials.forEach((mat) => {
          if (mat) {
            const m = mat as THREE.MeshStandardMaterial
            m.color?.set(val)
          }
        })
      }
    })

    const resetFolder = gui.addFolder("🔄 重置")
    resetFolder.add({
      reset: () => {
        const startX = -CLOTH_WIDTH / 2
        const startZ = -CLOTH_HEIGHT / 2
        for (let i = 0; i < CLOTH_SIZE; i++) {
          for (let j = 0; j < CLOTH_SIZE; j++) {
            const body = particles[i][j]
            body.position.set(
              startX + i * REST_DIST_X,
              5,
              startZ + j * REST_DIST_Z
            )
            body.velocity.set(0, 0, 0)
            body.angularVelocity.set(0, 0, 0)
          }
        }
      }
    }, "reset").name("重置布料")
  }

  /**
   * 自定义渲染循环
   */
  const customRender = () => {
    if (!clock || !world || !renderer.value || !scene.value || !camera.value) return

    const deltaTime = clock.getDelta()

    // 施加风力
    applyWind()

    // 更新物理引擎
    world.step(1 / 120, deltaTime)

    // 更新布料网格
    updateClothMesh()

    // 更新固定点可视化
    let pinIndex = 0
    scene.value.traverse((child) => {
      if (child.isMesh && child.geometry?.parameters?.radius === 0.08) {
        if (pinIndex < CLOTH_SIZE && particles[pinIndex]) {
          child.position.copy(particles[pinIndex][0].position)
          pinIndex++
        }
      }
    })

    if (controls.value) controls.value.update()
    renderer.value.render(scene.value, camera.value)
    animationId = requestAnimationFrame(customRender)
  }

  /**
   * 初始化场景内容
   */
  const initContent = () => {
    if (!scene.value) return

    clock = new THREE.Clock()

    createPhysicsWorld()
    addGroundAndSupport()
    createClothParticles()
    addLights()
    initGUI()
    initMouseInteraction()

    if (renderer.value) {
      renderer.value.shadowMap.enabled = true
    }
  }

  /**
   * 扩展清理
   */
  const extendedDispose = () => {
    if (animationId) cancelAnimationFrame(animationId)

    // 移除鼠标事件
    const el = renderer.value?.domElement
    if (el) {
      el.removeEventListener("mousedown", onMouseDown)
      el.removeEventListener("mousemove", onMouseMove)
      el.removeEventListener("mouseup", onMouseUp)
    }

    // 清理物理弹簧
      springs.forEach((spring) => {
        const listener = springListeners.get(spring)
        if (listener) {
          spring.removeEventListener("postStep", listener)
        }
        world?.removeSpring(spring)
      })
      springListeners.clear()

      // 清理物理体
    particles.flat().forEach((body) => {
      world?.removeBody(body)
    })

    // 清理 Three.js 对象
    if (clothMesh && scene.value && clothGeometry) {
      scene.value.remove(clothMesh)
      const mat = (Array.isArray(clothMesh.material) ? clothMesh.material[0] : clothMesh.material)!
      mat?.dispose()
      clothGeometry.dispose()
    }

    gui?.destroy()

    world = null
    clock = null
    gui = null
    particles = []
    springs = []
    clothMesh = null
    clothGeometry = null
    defaultMaterial = null
    raycaster = null
    mouse = null
    mousePlane = null
    isDragging = false
    dragParticle = null

    baseDispose()
  }

  onSceneReady(() => {
    initContent()
    customRender()
  })

  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🧵 布料模拟"
    description="使用 cannon-es 粒子+弹簧系统模拟布料 - 重力下垂、鼠标拖拽、风力效果"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🧵 <strong>粒子网格</strong> - 10x10 CANNON.Particle 粒子系统</li>
          <li>🔗 <strong>弹簧连接</strong> - 结构弹簧 + 剪切弹簧 + 弯曲弹簧</li>
          <li>📌 <strong>固定点</strong> - 顶部一排粒子固定（mass=0）</li>
          <li>🌊 <strong>风力效果</strong> - 随时间波动的风力模拟</li>
          <li>🖱️ <strong>鼠标拖拽</strong> - 拖拽布料施加力</li>
          <li>📐 <strong>实时更新</strong> - 每帧同步粒子位置到顶点</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 关键技术点：</h3>
        <ul>
          <li><strong>CANNON.Particle</strong>：无形状的质点，只有质量</li>
          <li><strong>CANNON.Spring</strong>：弹簧力连接两个 body</li>
          <li><strong>结构弹簧</strong>：水平+垂直相邻粒子连接</li>
          <li><strong>剪切弹簧</strong>：对角线连接，防止剪切变形</li>
          <li><strong>弯曲弹簧</strong>：跳一连接，增加结构稳定性</li>
          <li><strong>PlaneGeometry</strong>：布料渲染网格，顶点跟随粒子</li>
          <li><strong>computeVertexNormals</strong>：更新法线以正确显示光照</li>
        </ul>
      </div>

      <div class="controls-tip">
        <p>🎮 操作方式：</p>
        <ul>
          <li>🖱️ 点击布料并拖拽 → 施加力移动布料</li>
          <li>🌬️ 调整风力 → 观察布料飘动效果</li>
          <li>🎛️ 线框模式 → 查看粒子网格结构</li>
          <li>🔄 重置布料 → 恢复平面初始状态</li>
        </ul>
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
</style>
