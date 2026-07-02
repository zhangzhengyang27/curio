<script setup lang="ts">
  /**
   * 3D 变换控制器 (TransformControls)
   * 类似 Blender/Unity 编辑器中的变换工具，支持平移、旋转、缩放
   */
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { TransformControls } from "three/examples/jsm/controls/TransformControls.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 容器引用
  const containerRef = shallowRef(null)

  // 变换模式定义
  const transformModes = ["translate", "rotate", "scale"] as const
  const modeNames = { translate: "平移 (W)", rotate: "旋转 (E)", scale: "缩放 (R)" }

  // 当前变换模式索引
  let currentModeIndex = 0

  // 当前选中的物体
  let selectedMesh: THREE.Mesh | null = null

  // 保存所有可选物体的列表
  let selectableMeshes: THREE.Mesh[] = []

  // GUI 实例
  let gui!: GUI

  // TransformControls 实例
  let transformControls!: TransformControls

  // Raycaster 相关
  let raycaster!: THREE.Raycaster
  let mouse!: THREE.Vector2
  let isDragging = false // 标记是否正在拖拽 TransformControls

  // 使用公共的 Three.js 场景逻辑（保留 OrbitControls）
  const {
    scene,
    camera,
    renderer,
    controls,
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 5, y: 5, z: 8 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 2,
      maxDistance: 30
    },
    showAxesHelper: true,
    showGridHelper: true
  })

  /**
   * 创建场景中的多个不同形状物体
   */
  const createObjects = () => {
    if (!scene.value) return

    // 物体 1 - 立方体（红色）
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.4, metalness: 0.3 })
    )
    box.position.set(-3, 0.75, 0)
    box.name = "立方体"
    scene.value.add(box)
    selectableMeshes.push(box)

    // 物体 2 - 球体（蓝色）
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.3, metalness: 0.5 })
    )
    sphere.position.set(0, 1, 0)
    sphere.name = "球体"
    scene.value.add(sphere)
    selectableMeshes.push(sphere)

    // 物体 3 - 圆锥体（绿色）
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 2, 32),
      new THREE.MeshStandardMaterial({ color: 0x44ff88, roughness: 0.5, metalness: 0.2 })
    )
    cone.position.set(3, 1, 0)
    cone.name = "圆锥体"
    scene.value.add(cone)
    selectableMeshes.push(cone)

    // 物体 4 - 圆环结（紫色）
    const torusKnot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.6, 0.2, 100, 16),
      new THREE.MeshStandardMaterial({ color: 0xff44ff, roughness: 0.3, metalness: 0.6 })
    )
    torusKnot.position.set(0, 1.5, -3)
    torusKnot.name = "圆环结"
    scene.value.add(torusKnot)
    selectableMeshes.push(torusKnot)

    // 物体 5 - 圆柱体（橙色）
    const cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 2, 32),
      new THREE.MeshStandardMaterial({ color: 0xff8844, roughness: 0.4, metalness: 0.3 })
    )
    cylinder.position.set(-3, 1, 3)
    cylinder.name = "圆柱体"
    scene.value.add(cylinder)
    selectableMeshes.push(cylinder)

    // 添加环境光和方向光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.value.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 10, 7)
    directionalLight.castShadow = true
    scene.value.add(directionalLight)

    // 地面（仅用于视觉参考，不可选中）
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.8,
        metalness: 0.1
      })
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = 0
    ground.name = "ground" // 地面不加入 selectableMeshes，不会被选中
    scene.value.add(ground)
  }

  /**
   * 初始化 TransformControls
   */
  const initTransformControls = () => {
    if (!camera.value || !renderer.value || !scene.value) return

    // 创建 TransformControls 实例
    transformControls = new TransformControls(camera.value, renderer.value.domElement)

    // 添加到场景中
    scene.value.add((transformControls as any)._root)

    // 监听 dragging-changed 事件
    // 拖拽时自动禁用 OrbitControls，释放后恢复
    transformControls.addEventListener("dragging-changed", ((event: { value: boolean }) => {
      isDragging = event.value
      if (controls.value) {
        controls.value.enabled = !event.value
      }
      // 更新 GUI 中的物体信息
      updateGUIInfo()
    }) as any)

    // 监听 change 事件，实时更新 GUI 显示
    transformControls.addEventListener("change", () => {
      updateGUIInfo()
    })
  }

  /**
   * 初始化 Raycaster 点击检测
   */
  const initRaycaster = () => {
    if (!renderer.value) return

    raycaster = new THREE.Raycaster()
    mouse = new THREE.Vector2()

    // 在 renderer 的 domElement 上监听 pointerdown 事件
    renderer.value.domElement.addEventListener("pointerdown", onPointerDown)
  }

  /**
   * 鼠标按下事件处理 - 选中物体
   */
  const onPointerDown = (event: PointerEvent) => {
    // 如果正在拖拽 TransformControls，不处理点击选中
    if (isDragging) return

    if (!camera.value || !renderer.value) return

    // 将鼠标位置归一化为设备坐标 (-1 到 +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -((event.clientY / window.innerHeight) * 2 - 1)

    // 更新射线
    raycaster.setFromCamera(mouse, camera.value)

    // 检测与可选物体的交点
    const intersects = raycaster.intersectObjects(selectableMeshes)

    if (intersects.length > 0) {
      const object = intersects[0].object
      selectObject(object as THREE.Mesh)
    }
  }

  /**
   * 选中物体，将 TransformControls 附加到该物体上
   */
  const selectObject = (mesh: THREE.Mesh) => {
    // 取消之前选中物体的边框效果
    if (selectedMesh && selectedMesh.material) {
      const prevMat = Array.isArray(selectedMesh.material) ? selectedMesh.material[0] : selectedMesh.material
      ;(prevMat as THREE.MeshStandardMaterial).emissive?.set(0x000000)
    }

    // 设置新的选中物体
    selectedMesh = mesh

    // 给选中物体添加发光效果
    if (selectedMesh.material) {
      const mat = Array.isArray(selectedMesh.material) ? selectedMesh.material[0] : selectedMesh.material
      ;(mat as THREE.MeshStandardMaterial).emissive!.set(0x333333)
    }

    // 将 TransformControls 附加到选中的物体上
    transformControls.attach(selectedMesh)

    // 更新 GUI 信息
    updateGUIInfo()
  }

  /**
   * 切换变换模式
   * @param {number} index - 模式索引（0=平移，1=旋转，2=缩放）
   */
  const setTransformMode = (index: number) => {
    currentModeIndex = index % transformModes.length
    if (transformControls) {
      transformControls.setMode(transformModes[currentModeIndex] as "translate" | "rotate" | "scale")
    }
    updateGUIInfo()
  }

  /**
   * 更新 GUI 中显示的信息
   */
  let guiInfo!: { selectedObject: string; mode: string; position: string; rotation: string; scale: string }

  const updateGUIInfo = () => {
    if (!guiInfo || !selectedMesh) return
    guiInfo.selectedObject = selectedMesh.name
    guiInfo.position = `(${selectedMesh.position.x.toFixed(2)}, ${selectedMesh.position.y.toFixed(2)}, ${selectedMesh.position.z.toFixed(2)})`
    guiInfo.rotation = `(${THREE.MathUtils.radToDeg(selectedMesh.rotation.x).toFixed(1)}°, ${THREE.MathUtils.radToDeg(selectedMesh.rotation.y).toFixed(1)}°, ${THREE.MathUtils.radToDeg(selectedMesh.rotation.z).toFixed(1)}°)`
    guiInfo.scale = `(${selectedMesh.scale.x.toFixed(2)}, ${selectedMesh.scale.y.toFixed(2)}, ${selectedMesh.scale.z.toFixed(2)})`
    guiInfo.mode = modeNames[transformModes[currentModeIndex]]
  }

  /**
   * 初始化 GUI 控制面板
   */
  const initGUI = () => {
    gui = new GUI({ title: "变换控制器" })

    // 物体信息
    guiInfo = {
      selectedObject: "无",
      mode: modeNames[transformModes[0]],
      position: "(0, 0, 0)",
      rotation: "(0°, 0°, 0°)",
      scale: "(1, 1, 1)"
    }

    const infoFolder = gui.addFolder("选中物体信息")
    infoFolder.add(guiInfo, "selectedObject").name("物体名称").listen()
    infoFolder.add(guiInfo, "mode").name("当前模式").listen()
    infoFolder.add(guiInfo, "position").name("位置 (x,y,z)").listen()
    infoFolder.add(guiInfo, "rotation").name("旋转 (x,y,z)").listen()
    infoFolder.add(guiInfo, "scale").name("缩放 (x,y,z)").listen()

    // 模式切换控制
    const modeFolder = gui.addFolder("变换模式")
    const modeParams = {
      translate: () => setTransformMode(0),
      rotate: () => setTransformMode(1),
      scale: () => setTransformMode(2),
      cycleMode: () => setTransformMode(currentModeIndex + 1)
    }
    modeFolder.add(modeParams, "translate").name("📐 平移模式 (W)")
    modeFolder.add(modeParams, "rotate").name("🔄 旋转模式 (E)")
    modeFolder.add(modeParams, "scale").name("📏 缩放模式 (R)")
    modeFolder.add(modeParams, "cycleMode").name("⏭️ 循环切换 (空格)")

    // 物体快捷选中
    const selectFolder = gui.addFolder("快捷选中")
    const selectParams: Record<string, () => void> = {}
    selectableMeshes.forEach((mesh, index) => {
      selectParams[`select_${index}`] = () => selectObject(mesh)
    })
    selectableMeshes.forEach((mesh, index) => {
      selectFolder.add(selectParams, `select_${index}`).name(`选中 ${mesh.name}`)
    })

    // 解除选中
    const actionParams = {
      detach: () => {
        if (selectedMesh && selectedMesh.material) {
          const mat = Array.isArray(selectedMesh.material) ? selectedMesh.material[0] : selectedMesh.material
          ;(mat as THREE.MeshStandardMaterial).emissive!.set(0x000000)
        }
        selectedMesh = null
        transformControls.detach()
        guiInfo.selectedObject = "无"
        guiInfo.position = "(0, 0, 0)"
        guiInfo.rotation = "(0°, 0°, 0°)"
        guiInfo.scale = "(1, 1, 1)"
      }
    }
    selectFolder.add(actionParams, "detach").name("❌ 解除选中")
  }

  /**
   * 键盘事件处理 - 空格键切换模式
   */
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.code === "Space") {
      event.preventDefault() // 阻止页面滚动
      setTransformMode(currentModeIndex + 1)
    } else if (event.code === "KeyW") {
      setTransformMode(0) // W = 平移
    } else if (event.code === "KeyE") {
      setTransformMode(1) // E = 旋转
    } else if (event.code === "KeyR") {
      setTransformMode(2) // R = 缩放
    }
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 移除事件监听
    window.removeEventListener("keydown", onKeyDown)
    if (renderer.value) {
      renderer.value.domElement.removeEventListener("pointerdown", onPointerDown)
    }

    // 清理 TransformControls
    transformControls?.detach()
    transformControls?.dispose()

    // 清理 GUI
    gui?.destroy()

    // 清理可选物体列表
    selectableMeshes = []
    selectedMesh = null

    // 调用基础清理
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    createObjects()
    initTransformControls()
    initRaycaster()
    initGUI()
    startAnimation()
  })

  // 添加键盘事件监听
  onUnmounted(() => {
    extendedDispose()
  })

  // 需要在 mounted 之后添加键盘监听
  import { onMounted } from "vue"
  onMounted(() => {
    window.addEventListener("keydown", onKeyDown)
  })
</script>

<template>
  <PageLayout
    title="🔧 TransformControls 变换控制器"
    description="类似 Blender/Unity 的 3D 物体变换工具"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="controls-tip">
        <p>🎮 <strong>操作说明</strong></p>
        <ul>
          <li>🖱️ <strong>点击物体</strong> - 选中物体，TransformControls 自动附加</li>
          <li>⌨️ <strong>W 键</strong> - 切换到平移模式</li>
          <li>⌨️ <strong>E 键</strong> - 切换到旋转模式</li>
          <li>⌨️ <strong>R 键</strong> - 切换到缩放模式</li>
          <li>⌨️ <strong>空格键</strong> - 循环切换变换模式</li>
          <li>🖱️ <strong>拖拽控制器</strong> - 变换物体（自动禁用旋转视角）</li>
        </ul>
      </div>

      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>📐 <strong>三种变换模式</strong> - 平移 / 旋转 / 缩放</li>
          <li>🖱️ <strong>Raycaster 选中</strong> - 点击物体即可选中</li>
          <li>🔄 <strong>自动联动</strong> - 拖拽时禁用 OrbitControls</li>
          <li>📊 <strong>实时显示</strong> - 位置/旋转/缩放数值</li>
          <li>🎯 <strong>快捷键</strong> - W/E/R 快速切换模式</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>🔧 核心代码：</p>
        <p style="margin-top: 8px">
          创建控制器：<code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px">new TransformControls(camera, domElement)</code>
        </p>
        <p style="margin-top: 4px">
          附加物体：<code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px">transformControls.attach(mesh)</code>
        </p>
        <p style="margin-top: 4px">
          切换模式：<code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px">transformControls.setMode('translate')</code>
        </p>
        <p style="margin-top: 4px">
          联动控制：<code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px">controls.enabled = !isDragging</code>
        </p>
      </div>

      <div class="info-section">
        <h3>📚 应用场景：</h3>
        <ul>
          <li>🏗️ 3D 编辑器中的物体变换</li>
          <li>🎮 游戏场景编辑工具</li>
          <li>🛒 3D 产品定制与摆放</li>
          <li>🏠 室内设计工具</li>
          <li>🤖 机器人运动学可视化</li>
        </ul>
      </div>
    </template>

    <!-- Three.js 容器 -->
    <div ref="containerRef" />
  </PageLayout>
</template>

<style scoped>
  :deep(canvas) {
    cursor: crosshair;
  }
</style>
