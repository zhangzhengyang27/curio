<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  const containerRef = shallowRef<HTMLDivElement | null>(null)

  // 场景对象引用
  let draggableObjects: THREE.Mesh[] = []
  let raycaster: THREE.Raycaster | null = null
  let mouse: THREE.Vector2 | null = null
  let boxHelper: THREE.BoxHelper | null = null
  let gui: GUI | null = null
  let clock: THREE.Clock | null = null
  let animationId = 0
  let hoveredObject: THREE.Mesh | null = null
  let selectedObject: THREE.Mesh | null = null
  let isDragging = false
  let dragPlane: THREE.Plane | null = null
  let offset: THREE.Vector3 | null = null
  let intersection: THREE.Vector3 | null = null
  let originalPositions = new Map<THREE.Mesh, THREE.Vector3>()

  const {
    scene,
    camera,
    renderer,
    controls,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 8, y: 6, z: 8 },
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

  // 物体配置数据
  const objectConfigs = [
    { name: "红色立方体", color: 0xe74c3c, geometry: new THREE.BoxGeometry(1.2, 1.2, 1.2), position: new THREE.Vector3(-3, 0.6, 0) },
    { name: "蓝色球体", color: 0x3498db, geometry: new THREE.SphereGeometry(0.7, 32, 32), position: new THREE.Vector3(0, 0.7, 0) },
    { name: "绿色圆锥", color: 0x2ecc71, geometry: new THREE.ConeGeometry(0.7, 1.4, 32), position: new THREE.Vector3(3, 0.7, 0) },
    { name: "黄色圆环", color: 0xf1c40f, geometry: new THREE.TorusGeometry(0.6, 0.25, 16, 32), position: new THREE.Vector3(-1.5, 0.6, 3) },
    { name: "紫色圆柱", color: 0x9b59b6, geometry: new THREE.CylinderGeometry(0.5, 0.5, 1.2, 32), position: new THREE.Vector3(1.5, 0.6, -3) }
  ]

  /**
   * 创建场景中的可交互物体
   */
  const createObjects = () => {
    const s = scene.value
    if (!s) return

    objectConfigs.forEach((config) => {
      const material = new THREE.MeshStandardMaterial({
        color: config.color,
        emissive: 0x000000,
        emissiveIntensity: 0,
        roughness: 0.4,
        metalness: 0.3
      })
      const mesh = new THREE.Mesh(config.geometry, material)
      mesh.position.copy(config.position)
      mesh.userData.name = config.name
      mesh.userData.originalColor = config.color
      mesh.castShadow = true
      mesh.receiveShadow = true
      s.add(mesh)
      draggableObjects.push(mesh)
      originalPositions.set(mesh, config.position.clone())
    })
  }

  /**
   * 添加光源
   */
  const addLights = () => {
    if (!scene.value) return

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.value.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(5, 8, 5)
    dirLight.castShadow = true
    scene.value.add(dirLight)
  }

  /**
   * 添加地面
   */
  const addFloor = () => {
    if (!scene.value) return

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    floor.receiveShadow = true
    scene.value.add(floor)
  }

  /**
   * 初始化 Raycaster 和鼠标
   */
  const initRaycaster = () => {
    raycaster = new THREE.Raycaster()
    mouse = new THREE.Vector2()
    dragPlane = new THREE.Plane()
    intersection = new THREE.Vector3()
    offset = new THREE.Vector3()
  }

  /**
   * 获取鼠标在 NDC 坐标中的位置
   */
  const getMouseNDC = (event: MouseEvent) => {
    if (!renderer.value || !mouse) return
    const rect = renderer.value.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  /**
   * 鼠标移动 - 悬停高亮
   */
  const onMouseMove = (event: MouseEvent) => {
    if (!raycaster || !camera.value || !mouse || isDragging) return
    if (!renderer.value) return

    getMouseNDC(event)
    raycaster.setFromCamera(mouse, camera.value)

    const intersects = raycaster.intersectObjects(draggableObjects)

    // 重置之前高亮的物体
    if (hoveredObject && hoveredObject !== selectedObject) {
      const mat = hoveredObject.material
      if (Array.isArray(mat)) {
        mat.forEach((m) => {
          const sm = m as THREE.MeshStandardMaterial
          sm.emissive?.setHex(0x000000)
          sm.emissiveIntensity = 0
        })
      } else {
        const sm = mat as THREE.MeshStandardMaterial
        sm.emissive?.setHex(0x000000)
        sm.emissiveIntensity = 0
      }
    }

    if (intersects.length > 0) {
      const obj = intersects[0].object as THREE.Mesh
      hoveredObject = obj
      // 发光高亮效果
      if (obj !== selectedObject) {
        const mat = obj.material
        if (Array.isArray(mat)) {
          mat.forEach((m) => {
            const sm = m as THREE.MeshStandardMaterial
            sm.emissive?.setHex(obj.userData.originalColor)
            sm.emissiveIntensity = 0.3
          })
        } else {
          const sm = mat as THREE.MeshStandardMaterial
          sm.emissive?.setHex(obj.userData.originalColor)
          sm.emissiveIntensity = 0.3
        }
      }
      renderer.value.domElement.style.cursor = "pointer"
    } else {
      hoveredObject = null
      renderer.value.domElement.style.cursor = "default"
    }

    // 拖拽中：计算新位置
    if (isDragging && selectedObject) {
      getMouseNDC(event)
      raycaster.setFromCamera(mouse, camera.value)
      if (dragPlane && intersection && raycaster.ray.intersectPlane(dragPlane, intersection)) {
        if (offset) selectedObject.position.copy(intersection.sub(offset))
      }
      updateGUIInfo()
    }
  }

  /**
   * 鼠标按下 - 选中物体 & 开始拖拽
   */
  const onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0 || !raycaster || !camera.value || !mouse) return

    getMouseNDC(event)
    raycaster.setFromCamera(mouse, camera.value)

    const intersects = raycaster.intersectObjects(draggableObjects)

    if (intersects.length > 0) {
      const obj = intersects[0].object as THREE.Mesh

      // 取消之前选中物体的边框
      if (selectedObject && selectedObject !== obj) {
        const mat = selectedObject.material
        if (Array.isArray(mat)) {
          mat.forEach((m) => {
            const sm = m as THREE.MeshStandardMaterial
            sm.emissive?.setHex(0x000000)
            sm.emissiveIntensity = 0
          })
        } else {
          const sm = mat as THREE.MeshStandardMaterial
          sm.emissive?.setHex(0x000000)
          sm.emissiveIntensity = 0
        }
        if (boxHelper && scene.value) {
          scene.value.remove(boxHelper)
          boxHelper.dispose()
          boxHelper = null
        }
      }

      // 选中新物体
      selectedObject = obj
      const mat = obj.material
      if (Array.isArray(mat)) {
        mat.forEach((m) => {
          const sm = m as THREE.MeshStandardMaterial
          sm.emissive?.setHex(0x00ff00)
          sm.emissiveIntensity = 0.4
        })
      } else {
        const sm = mat as THREE.MeshStandardMaterial
        sm.emissive?.setHex(0x00ff00)
        sm.emissiveIntensity = 0.4
      }

      // 添加 BoxHelper
      if (boxHelper && scene.value) {
        scene.value.remove(boxHelper)
        boxHelper.dispose()
      }
      if (!scene.value) return
      boxHelper = new THREE.BoxHelper(obj, 0x00ff00)
      scene.value.add(boxHelper)

      // 设置拖拽参考平面（XZ 平面，通过物体中心高度）
      if (!dragPlane) return
      dragPlane.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 1, 0),
        obj.position
      )

      // 计算鼠标在拖拽平面上的偏移
      if (intersection && raycaster.ray.intersectPlane(dragPlane, intersection)) {
        if (offset) offset.copy(intersection).sub(obj.position)
      }

      isDragging = true
      if (controls.value) controls.value.enabled = false

      updateGUIInfo()
    }
  }

  /**
   * 鼠标松开 - 结束拖拽
   */
  const onMouseUp = () => {
    if (isDragging) {
      isDragging = false
      if (controls.value) controls.value.enabled = true
    }
  }

  /**
   * 双击重置位置
   */
  const onDoubleClick = (event: MouseEvent) => {
    if (!raycaster || !camera.value || !mouse) return

    getMouseNDC(event)
    raycaster.setFromCamera(mouse, camera.value)

    const intersects = raycaster.intersectObjects(draggableObjects)
    if (intersects.length > 0) {
      const obj = intersects[0].object as THREE.Mesh
      const originalPos = originalPositions.get(obj)
      if (originalPos) {
        obj.position.copy(originalPos)
        updateGUIInfo()
        if (boxHelper) boxHelper.update()
      }
    }
  }

  /**
   * 更新 GUI 中的选中物体信息
   */
  const updateGUIInfo = () => {
    if (!gui || !selectedObject) return

    const infoFolder = gui.__infoFolder
    if (infoFolder) {
      infoFolder.__info.name = selectedObject.userData.name
      infoFolder.__info.position = `(${selectedObject.position.x.toFixed(1)}, ${selectedObject.position.y.toFixed(1)}, ${selectedObject.position.z.toFixed(1)})`
      infoFolder.__info.color = "#" + new THREE.Color(selectedObject.userData.originalColor).getHexString()
      // 强制 GUI 更新显示
      for (const controller of infoFolder.controllersRecursive()) {
        controller.updateDisplay()
      }
    }
  }

  /**
   * 初始化 GUI
   */
  const initGUI = () => {
    gui = new GUI()
    gui.title("Raycaster 交互控制")

    const infoFolder = gui.addFolder("📋 选中物体信息")
    const infoData = { name: "无", position: "(0, 0, 0)", color: "#ffffff" }
    infoFolder.__info = infoData
    infoFolder.add(infoData, "name").name("名称").listen().disable()
    infoFolder.add(infoData, "position").name("位置").listen().disable()
    infoFolder.add(infoData, "color").name("颜色").listen().disable()
    gui.__infoFolder = infoFolder

    const controlsFolder = gui.addFolder("🎮 操作说明")
    const controlData = {
      hint: "悬停: 高亮 | 点击: 选中\n拖拽: XZ平面 | 双击: 重置"
    }
    controlsFolder.add(controlData, "hint").name("操作提示").disable()
    controlsFolder.open()
  }

  /**
   * 添加事件监听
   */
  const addEventListeners = () => {
    if (!renderer.value) return
    const el = renderer.value.domElement
    el.addEventListener("mousemove", onMouseMove)
    el.addEventListener("mousedown", onMouseDown)
    el.addEventListener("mouseup", onMouseUp)
    el.addEventListener("dblclick", onDoubleClick)
  }

  /**
   * 自定义渲染循环
   */
  const customRender = () => {
    if (!renderer.value || !scene.value || !camera.value) return

    if (controls.value) controls.value.update()

    // 更新 BoxHelper
    if (boxHelper && selectedObject) {
      boxHelper.update()
    }

    renderer.value.render(scene.value, camera.value)
    animationId = requestAnimationFrame(customRender)
  }

  /**
   * 初始化场景内容
   */
  const initContent = () => {
    if (!scene.value) return

    clock = new THREE.Clock()
    initRaycaster()
    addLights()
    addFloor()
    createObjects()
    initGUI()
    addEventListeners()

    if (renderer.value) {
      renderer.value.shadowMap.enabled = true
    }
  }

  /**
   * 扩展清理
   */
  const extendedDispose = () => {
    const el = renderer.value?.domElement
    if (el) {
      el.removeEventListener("mousemove", onMouseMove)
      el.removeEventListener("mousedown", onMouseDown)
      el.removeEventListener("mouseup", onMouseUp)
      el.removeEventListener("dblclick", onDoubleClick)
    }

    if (boxHelper && scene.value) {
      scene.value.remove(boxHelper)
      boxHelper.dispose()
    }

    draggableObjects.forEach((obj) => {
      if (scene.value) scene.value.remove(obj)
      obj.geometry.dispose()
      const mat = obj.material
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose())
      } else {
        mat.dispose()
      }
    })

    draggableObjects = []
    originalPositions.clear()
    gui?.destroy()

    if (animationId) cancelAnimationFrame(animationId)

    raycaster = null
    mouse = null
    boxHelper = null
    gui = null
    clock = null
    hoveredObject = null
    selectedObject = null
    isDragging = false
    dragPlane = null
    offset = null
    intersection = null

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
    title="🎯 Raycaster 进阶交互"
    description="鼠标悬停高亮、点击选中、XZ 平面拖拽、双击重置位置"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🖱️ <strong>悬停高亮</strong> - 鼠标悬停时 emissive 发光效果</li>
          <li>👆 <strong>点击选中</strong> - 点击物体显示 BoxHelper 边框</li>
          <li>✋ <strong>拖拽移动</strong> - 沿 XZ 平面拖拽移动物体</li>
          <li>🔄 <strong>双击重置</strong> - 双击物体回到初始位置</li>
          <li>📋 <strong>信息面板</strong> - GUI 显示选中物体名称、位置、颜色</li>
          <li>📐 <strong>THREE.Plane</strong> - 拖拽参考平面</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 关键技术点：</h3>
        <ul>
          <li><strong>Raycaster</strong>：Three.js 内置射线检测工具</li>
          <li><strong>setFromCamera</strong>：从相机发射射线</li>
          <li><strong>intersectObjects</strong>：检测射线与物体交叉</li>
          <li><strong>THREE.Plane</strong>：无限平面，用于拖拽参考</li>
          <li><strong>BoxHelper</strong>：显示物体的包围盒边框</li>
          <li><strong>emissive</strong>：自发光材质属性实现高亮</li>
        </ul>
      </div>

      <div class="controls-tip">
        <p>🎮 操作方式：</p>
        <ul>
          <li>🖱️ 鼠标悬停 → 物体发光高亮</li>
          <li>👆 左键单击 → 选中物体（绿色边框）</li>
          <li>✋ 按住拖拽 → 沿 XZ 平面移动物体</li>
          <li>🔄 双击物体 → 重置到初始位置</li>
          <li>🔭 右键拖拽 → 旋转视角（OrbitControls）</li>
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
