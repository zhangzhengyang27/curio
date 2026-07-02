<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import * as CANNON from "cannon-es"

  const containerRef = shallowRef(null)

  // 物理引擎和场景对象引用
  let world: CANNON.World | null = null
  let clock: THREE.Clock | null = null
  let gui: GUI | null = null
  let animationId = 0

  // 门框相关
  let doorFrameBody: CANNON.Body | null = null
  let doorFrameMesh: THREE.Group | null = null

  // 门（铰链约束）相关
  let doorBody: CANNON.Body | null = null
  let doorMesh: THREE.Mesh | null = null
  let doorHinge: CANNON.HingeConstraint | null = null
  let doorMaterial: THREE.MeshStandardMaterial | null = null

  // 摆锤（距离约束）相关
  let pendulumBody: CANNON.Body | null = null
  let pendulumMesh: THREE.Mesh | null = null
  let pendulumAnchorBody: CANNON.Body | null = null
  let pendulumAnchorMesh: THREE.Mesh | null = null
  let pendulumConstraint: CANNON.DistanceConstraint | null = null

  // 碰撞材质
  let defaultMaterial: CANNON.Material | null = null

  const {
    scene,
    camera,
    renderer,
    controls,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 8, y: 5, z: 10 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 3,
      maxDistance: 25
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

    // 默认接触材质
    defaultMaterial = new CANNON.Material("default")
    const contactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
      friction: 0.3,
      restitution: 0.3
    })
    world.addContactMaterial(contactMaterial)
  }

  /**
   * 创建地面
   */
  const createFloor = () => {
    if (!scene.value || !world) return

    // Three.js 地面
    const floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 })
    )
    floorMesh.rotation.x = -Math.PI / 2
    floorMesh.receiveShadow = true
    scene.value.add(floorMesh)

    // CANNON 地面
    const floorBody = new CANNON.Body({
      mass: 0,
      material: defaultMaterial ?? undefined
    })
    floorBody.addShape(new CANNON.Plane())
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    world.addBody(floorBody)
  }

  /**
   * 创建门框和门（铰链约束 HingeConstraint）
   */
  const createDoor = () => {
    if (!scene.value || !world) return

    // === 门框 ===
    // Three.js 门框 - 使用两个竖柱和一个横梁
    const frameGroup = new THREE.Group()

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.6 })

    // 左柱
    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 0.3), frameMat)
    leftPillar.position.set(-1.5, 2, 0)
    leftPillar.castShadow = true
    frameGroup.add(leftPillar)

    // 右柱
    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 0.3), frameMat)
    rightPillar.position.set(1.5, 2, 0)
    rightPillar.castShadow = true
    frameGroup.add(rightPillar)

    // 横梁
    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.3, 0.3), frameMat)
    topBeam.position.set(0, 4, 0)
    topBeam.castShadow = true
    frameGroup.add(topBeam)

    scene.value.add(frameGroup)

    // CANNON 门框（静态刚体）
    doorFrameBody = new CANNON.Body({ mass: 0, material: defaultMaterial ?? undefined })
    doorFrameBody.position.set(0, 0, 0)
    // 左柱
    doorFrameBody.addShape(new CANNON.Box(new CANNON.Vec3(0.15, 2, 0.15)), new CANNON.Vec3(-1.5, 2, 0))
    // 右柱
    doorFrameBody.addShape(new CANNON.Box(new CANNON.Vec3(0.15, 2, 0.15)), new CANNON.Vec3(1.5, 2, 0))
    // 横梁
    doorFrameBody.addShape(new CANNON.Box(new CANNON.Vec3(1.65, 0.15, 0.15)), new CANNON.Vec3(0, 4, 0))
    world.addBody(doorFrameBody)

    // === 门（动态刚体，铰链约束） ===
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xcd853f, roughness: 0.5 })
    doorMesh = new THREE.Mesh(new THREE.BoxGeometry(2.7, 3.5, 0.15), doorMat)
    doorMesh.position.set(-0.15, 1.75, 0)
    doorMesh.castShadow = true
    scene.value.add(doorMesh)

    doorMaterial = doorMat

    doorBody = new CANNON.Body({
      mass: 2,
      material: defaultMaterial ?? undefined
    })
    doorBody.addShape(
      new CANNON.Box(new CANNON.Vec3(1.35, 1.75, 0.075)),
      new CANNON.Vec3(-0.15, 1.75, 0)
    )
    doorBody.position.set(0, 0, 0)
    world.addBody(doorBody)

    // === HingeConstraint 铰链约束 ===
    // 铰链轴心在左柱顶部：世界坐标 (-1.5, 4, 0)
    // 约束轴方向：Y 轴（让门绕垂直轴旋转开合）
    const pivotA = new CANNON.Vec3(-1.5, 4, 0) // 在门框 body 上的局部轴心
    const pivotB = new CANNON.Vec3(-1.35, 4, 0) // 在门 body 上的局部轴心（门左上角附近）
    const axisA = new CANNON.Vec3(0, 1, 0) // 约束轴（Y轴，门绕垂直轴开合）
    const axisB = new CANNON.Vec3(0, 1, 0)

    doorHinge = new CANNON.HingeConstraint(doorFrameBody, doorBody, {
      pivotA,
      pivotB,
      axisA,
      axisB,
      maxForce: 50
    })
    world.addConstraint(doorHinge)

    // 限制门的旋转角度
    doorBody.angularFactor = new CANNON.Vec3(0, 1, 0) // 只允许绕 Y 轴旋转
  }

  /**
   * 创建摆锤（DistanceConstraint 距离约束）
   */
  const createPendulum = () => {
    if (!scene.value || !world) return

    const anchorX = 5

    // === 锚点（固定点） ===
    pendulumAnchorMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x95a5a6, metalness: 0.5 })
    )
    pendulumAnchorMesh.position.set(anchorX, 6, 0)
    pendulumAnchorMesh.castShadow = true
    scene.value.add(pendulumAnchorMesh)

    pendulumAnchorBody = new CANNON.Body({ mass: 0, material: defaultMaterial ?? undefined })
    pendulumAnchorBody.position.set(anchorX, 6, 0)
    pendulumAnchorBody.addShape(new CANNON.Sphere(0.2))
    world.addBody(pendulumAnchorBody)

    // === 摆锤球 ===
    pendulumMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xe67e22, metalness: 0.4, roughness: 0.3 })
    )
    pendulumMesh.position.set(anchorX, 2, 0)
    pendulumMesh.castShadow = true
    scene.value.add(pendulumMesh)

    pendulumBody = new CANNON.Body({
      mass: 3,
      material: defaultMaterial ?? undefined
    })
    pendulumBody.position.set(anchorX, 2, 0)
    pendulumBody.addShape(new CANNON.Sphere(0.6))
    world.addBody(pendulumBody)

    // === DistanceConstraint 距离约束 ===
    // 绳长 = 4（锚点Y=6, 摆锤初始Y=2）
    pendulumConstraint = new CANNON.DistanceConstraint(pendulumAnchorBody, pendulumBody, 4)
    world.addConstraint(pendulumConstraint)

    // === 绳子可视化 ===
    const ropeGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(anchorX, 6, 0),
      new THREE.Vector3(anchorX, 2, 0)
    ])
    const ropeMaterial = new THREE.LineBasicMaterial({ color: 0xecf0f1, linewidth: 2 })
    const rope = new THREE.Line(ropeGeometry, ropeMaterial)
    rope.userData.isRope = true
    scene.value.add(rope)
  }

  /**
   * 添加光源
   */
  const addLights = () => {
    if (!scene.value) return

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.value.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(5, 10, 5)
    dirLight.castShadow = true
    scene.value.add(dirLight)
  }

  /**
   * 初始化 GUI
   */
  const initGUI = () => {
    gui = new GUI()
    gui.title("物理约束控制")

    // 门控制
    const doorFolder = gui.addFolder("🚪 门（铰链约束）")
    const doorSettings = {
      pushDoor: () => {
        if (doorBody) {
          // 在门板中间偏右的位置施加推力
          doorBody.applyForce(
            new CANNON.Vec3(50, 0, 20),
            new CANNON.Vec3(2, 2, 0)
          )
        }
      },
      pullDoor: () => {
        if (doorBody) {
          doorBody.applyForce(
            new CANNON.Vec3(-50, 0, -20),
            new CANNON.Vec3(2, 2, 0)
          )
        }
      },
      resetDoor: () => {
        if (doorBody) {
          doorBody.position.set(0, 0, 0)
          doorBody.quaternion.set(0, 0, 0, 1)
          doorBody.velocity.set(0, 0, 0)
          doorBody.angularVelocity.set(0, 0, 0)
        }
      }
    }
    doorFolder.add(doorSettings, "pushDoor").name("推门")
    doorFolder.add(doorSettings, "pullDoor").name("拉门")
    doorFolder.add(doorSettings, "resetDoor").name("重置门")
    doorFolder.open()

    // 摆锤控制
    const pendulumFolder = gui.addFolder("🏓 摆锤（距离约束）")
    const pendulumSettings = {
      pushPendulum: () => {
        if (pendulumBody) {
          pendulumBody.applyForce(
            new CANNON.Vec3(30, 10, 0),
            new CANNON.Vec3(0, 0, 0)
          )
        }
      },
      resetPendulum: () => {
        if (pendulumBody) {
          pendulumBody.position.set(5, 2, 0)
          pendulumBody.quaternion.set(0, 0, 0, 1)
          pendulumBody.velocity.set(0, 0, 0)
          pendulumBody.angularVelocity.set(0, 0, 0)
        }
      }
    }
    pendulumFolder.add(pendulumSettings, "pushPendulum").name("推摆锤")
    pendulumFolder.add(pendulumSettings, "resetPendulum").name("重置摆锤")
    pendulumFolder.open()

    // 重力控制
    const worldFolder = gui.addFolder("🌍 物理世界")
    const worldSettings = { gravity: -9.8 }
    worldFolder
      .add(worldSettings, "gravity", -20, 0, 0.1)
      .name("重力")
      .onChange((val) => {
        if (world) world.gravity.set(0, val, 0)
      })
  }

  /**
   * 更新绳子可视化
   */
  const updateRope = () => {
    if (!scene.value || !pendulumAnchorBody || !pendulumBody) return

    const anchorBody = pendulumAnchorBody
    const bobBody = pendulumBody

    scene.value.traverse((child) => {
      if (child.userData.isRope && child.isLine && child.geometry) {
        const positions = child.geometry.attributes.position.array
        // 锚点位置
        positions[0] = anchorBody.position.x
        positions[1] = anchorBody.position.y
        positions[2] = anchorBody.position.z
        // 摆锤位置
        positions[3] = bobBody.position.x
        positions[4] = bobBody.position.y
        positions[5] = bobBody.position.z
        child.geometry.attributes.position.needsUpdate = true
      }
    })
  }

  /**
   * 自定义渲染循环
   */
  const customRender = () => {
    if (!clock || !world || !renderer.value || !scene.value || !camera.value) return

    const deltaTime = clock.getDelta()

    // 更新物理引擎
    world.step(1 / 120, deltaTime)

    // 同步门位置
    if (doorBody && doorMesh) {
      doorMesh.position.copy(doorBody.position)
      doorMesh.quaternion.copy(doorBody.quaternion)
    }

    // 同步摆锤位置
    if (pendulumBody && pendulumMesh) {
      pendulumMesh.position.copy(pendulumBody.position)
      pendulumMesh.quaternion.copy(pendulumBody.quaternion)
    }

    // 更新绳子
    updateRope()

    // 更新控制器
    if (controls.value) controls.value.update()

    // 渲染场景
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
    createFloor()
    createDoor()
    createPendulum()
    addLights()
    initGUI()

    if (renderer.value) {
      renderer.value.shadowMap.enabled = true
    }
  }

  /**
   * 扩展清理
   */
  const extendedDispose = () => {
    if (animationId) cancelAnimationFrame(animationId)

    // 清理物理约束
    if (world && doorHinge) world.removeConstraint(doorHinge)
    if (world && pendulumConstraint) world.removeConstraint(pendulumConstraint)

    // 清理物理体
    if (world && doorBody) world.removeBody(doorBody)
    if (world && doorFrameBody) world.removeBody(doorFrameBody)
    if (world && pendulumBody) world.removeBody(pendulumBody)
    if (world && pendulumAnchorBody) world.removeBody(pendulumAnchorBody)

    // 清理 Three.js 对象
    const cleanupMeshes = [doorMesh, pendulumMesh, pendulumAnchorMesh]
    cleanupMeshes.forEach((mesh) => {
      if (mesh && scene.value) {
        scene.value.remove(mesh)
        mesh.geometry?.dispose()
        const mat = mesh.material
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose())
        } else {
          mat?.dispose()
        }
      }
    })

    // 清理门框 group
    const currentScene = scene.value
    if (currentScene) {
      currentScene.traverse((child) => {
        if (child.isGroup && child !== currentScene) {
          currentScene.remove(child)
          child.traverse((obj) => {
            if (obj.isMesh) {
              obj.geometry?.dispose()
              const mat = obj.material
              if (Array.isArray(mat)) {
                mat.forEach((m) => m.dispose())
              } else {
                mat?.dispose()
              }
            }
          })
        }
      })
    }

    gui?.destroy()

    world = null
    clock = null
    gui = null
    doorFrameBody = null
    doorFrameMesh = null
    doorBody = null
    doorMesh = null
    doorHinge = null
    pendulumBody = null
    pendulumMesh = null
    pendulumAnchorBody = null
    pendulumAnchorMesh = null
    pendulumConstraint = null
    defaultMaterial = null

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
    title="🔗 物理约束系统"
    description="HingeConstraint 铰链约束（门开合）+ DistanceConstraint 距离约束（摆锤）"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🚪 <strong>HingeConstraint</strong> - 铰链约束，模拟门的开合</li>
          <li>🏓 <strong>DistanceConstraint</strong> - 距离约束，模拟摆锤</li>
          <li>📐 <strong>多形状组合</strong> - 门框由多个 Box 组成</li>
          <li>🔄 <strong>位置/四元数同步</strong> - 物理体与渲染对象同步</li>
          <li>🎹 <strong>GUI 交互</strong> - 推门/拉门/重置、推摆锤</li>
          <li>🎯 <strong>angularFactor</strong> - 限制旋转轴</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 关键技术点：</h3>
        <ul>
          <li><strong>HingeConstraint</strong>：铰链约束，限制两个刚体绕同一轴旋转</li>
          <li><strong>DistanceConstraint</strong>：距离约束，保持两个刚体之间的距离</li>
          <li><strong>pivotA / pivotB</strong>：约束在两个 body 上的局部锚点</li>
          <li><strong>axisA / axisB</strong>：约束旋转轴方向</li>
          <li><strong>angularFactor</strong>：Vec3(0,1,0) 限制只绕 Y 轴旋转</li>
        </ul>
      </div>

      <div class="controls-tip">
        <p>🎮 操作方式：</p>
        <ul>
          <li>🚪 点击「推门/拉门」→ 观察门绕铰链开合</li>
          <li>🏓 点击「推摆锤」→ 观察摆锤来回摆动</li>
          <li>🔄 点击「重置」→ 回到初始状态</li>
          <li>🎛️ 调整重力 → 观察对摆锤周期的影响</li>
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
