<script setup lang="ts">
  /**
   * DragControls 拖拽 3D 物体
   * 使用 DragControls 实现鼠标拖拽 3D 物体的交互
   * 拖拽时自动禁用 OrbitControls，释放后恢复
   * 支持自由拖拽和轴向限制拖拽
   */
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { DragControls } from "three/examples/jsm/controls/DragControls.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 容器引用
  const containerRef = shallowRef(null)

  // 使用公共的 Three.js 场景逻辑
  // 保留 OrbitControls，拖拽时自动禁用/恢复
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
      minDistance: 3,
      maxDistance: 20
    },
    showAxesHelper: true,
    showGridHelper: true
  })

  // GUI 和控制器引用
  let gui: GUI | null = null
  let dragControlsInstance: DragControls | null = null

  // 可拖拽的物体数组
  let draggableObjects: THREE.Mesh[] = []

  // 物体原始颜色映射（用于拖拽时高亮和恢复）
  const originalColors = new Map<THREE.Mesh, THREE.Color>()

  // 当前拖拽信息
  let dragInfo = { isDragging: false, objectName: "无", position: "x: 0, y: 0, z: 0" }

  // 拖拽模式参数
  let dragModeParams = {
    mode: "translate",
    // 自定义模式选项（DragControls 原生不支持轴向限制，这里通过变换函数实现）
    customMode: "自由拖拽",
    highlightColor: "#ffff00",
    highlightScale: 1.15
  }

  // 自定义拖拽轴限制
  let customMode = "自由拖拽"
  let constrainedAxis: string | null = null // null = 自由, 'x', 'y', 'z'

  /**
   * 创建可拖拽的物体
   * 包含多种不同颜色和形状的几何体
   */
  const createDraggableObjects = () => {
    if (!scene.value) return

    // 清除已有物体
    draggableObjects.forEach((mesh) => scene.value!.remove(mesh))
    draggableObjects = []
    originalColors.clear()

    // ====== 光照 ======
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    ambientLight.name = "ambientLight"
    scene.value.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    directionalLight.position.set(5, 10, 7)
    directionalLight.name = "directionalLight"
    scene.value.add(directionalLight)

    // ====== 定义物体列表 ======
    const objectDefinitions = [
      {
        name: "红色立方体",
        geometry: new THREE.BoxGeometry(1.2, 1.2, 1.2),
        color: 0xff4444,
        position: { x: -3, y: 0.6, z: 0 }
      },
      {
        name: "绿色球体",
        geometry: new THREE.SphereGeometry(0.7, 32, 32),
        color: 0x44ff44,
        position: { x: 0, y: 0.7, z: 0 }
      },
      {
        name: "蓝色圆锥",
        geometry: new THREE.ConeGeometry(0.6, 1.4, 32),
        color: 0x4488ff,
        position: { x: 3, y: 0.7, z: 0 }
      },
      {
        name: "紫色圆柱",
        geometry: new THREE.CylinderGeometry(0.5, 0.5, 1.2, 32),
        color: 0xaa44ff,
        position: { x: -1.5, y: 0.6, z: -2.5 }
      },
      {
        name: "橙色圆环",
        geometry: new THREE.TorusGeometry(0.6, 0.2, 16, 32),
        color: 0xff8800,
        position: { x: 1.5, y: 0.8, z: -2.5 }
      },
      {
        name: "青色正十二面体",
        geometry: new THREE.DodecahedronGeometry(0.7),
        color: 0x00cccc,
        position: { x: 0, y: 0.7, z: 2.5 }
      },
      {
        name: "粉色正八面体",
        geometry: new THREE.OctahedronGeometry(0.7),
        color: 0xff44aa,
        position: { x: -2.5, y: 0.7, z: 2.5 }
      },
      {
        name: "黄色正四面体",
        geometry: new THREE.TetrahedronGeometry(0.8),
        color: 0xffcc00,
        position: { x: 2.5, y: 0.8, z: 2.5 }
      }
    ]

    // 创建所有物体
    objectDefinitions.forEach((def) => {
      const material = new THREE.MeshStandardMaterial({
        color: def.color,
        roughness: 0.3,
        metalness: 0.5
      })
      const mesh = new THREE.Mesh(def.geometry, material)
      mesh.position.set(def.position.x, def.position.y, def.position.z)
      mesh.name = def.name
      scene.value!.add(mesh)

      // 保存可拖拽物体引用
      draggableObjects.push(mesh)

      // 保存原始颜色
      const meshMaterial = mesh.material as THREE.MeshStandardMaterial
      originalColors.set(mesh, meshMaterial.color!.clone())
    })
  }

  /**
   * 初始化 DragControls
   */
  const initDragControls = () => {
    if (!camera.value || !renderer.value) return

    // 创建 DragControls 实例
    dragControlsInstance = new DragControls(
      draggableObjects,
      camera.value,
      renderer.value.domElement
    )

    // ====== 拖拽开始事件 ======
    dragControlsInstance.addEventListener("dragstart", (event) => {
      if (!controls.value) return

      // 禁用 OrbitControls，防止拖拽时同时旋转场景
      controls.value.enabled = false

      // 记录拖拽开始位置（用于轴向限制）
      if (constrainedAxis) {
        event.object.userData.startPosition = event.object.position.clone()
      }

      // 高亮物体：改变颜色和缩放
      highlightObject(event.object, true)

      // 更新拖拽信息
      dragInfo.isDragging = true
      dragInfo.objectName = event.object.name

      // 改变鼠标样式
      renderer.value!.domElement.style.cursor = "grabbing"
    })

    // ====== 拖拽中事件 ======
    dragControlsInstance.addEventListener("drag", (event) => {
      // 轴向限制：拖拽时只在指定轴上移动
      if (constrainedAxis && event.object.userData.startPosition) {
        const startPos = event.object.userData.startPosition
        const currentPos = event.object.position

        switch (constrainedAxis) {
          case "x":
            currentPos.y = startPos.y
            currentPos.z = startPos.z
            break
          case "y":
            currentPos.x = startPos.x
            currentPos.z = startPos.z
            break
          case "z":
            currentPos.x = startPos.x
            currentPos.y = startPos.y
            break
        }
      }

      // 实时更新位置信息
      const pos = event.object.position
      dragInfo.position = `x: ${pos.x.toFixed(2)}, y: ${pos.y.toFixed(2)}, z: ${pos.z.toFixed(2)}`
    })

    // ====== 拖拽结束事件 ======
    dragControlsInstance.addEventListener("dragend", (event) => {
      if (!controls.value) return

      // 恢复 OrbitControls
      controls.value.enabled = true

      // 恢复物体外观
      highlightObject(event.object, false)

      // 清除拖拽状态
      dragInfo.isDragging = false
      dragInfo.objectName = "无"
      dragInfo.position = "x: 0, y: 0, z: 0"

      // 清除起始位置数据
      if (event.object.userData.startPosition) {
        delete event.object.userData.startPosition
      }

      // 恢复鼠标样式
      renderer.value!.domElement.style.cursor = "grab"
    })

    // ====== 鼠标悬停事件 ======
    dragControlsInstance.addEventListener("hoveron", (event) => {
      if (!dragInfo.isDragging) {
        renderer.value!.domElement.style.cursor = "grab"
        // 轻微缩放反馈
        event.object.scale.setScalar(1.05)
      }
    })

    dragControlsInstance.addEventListener("hoveroff", (event) => {
      if (!dragInfo.isDragging) {
        renderer.value!.domElement.style.cursor = "auto"
        // 恢复缩放
        event.object.scale.setScalar(1.0)
      }
    })
  }

  /**
   * 高亮物体或恢复原始外观
   * @param {THREE.Mesh} object - 目标物体
   * @param {boolean} highlight - 是否高亮
   */
  const highlightObject = (object: THREE.Object3D, highlight: boolean) => {
    if (!object || !object.material) return

    const material = (Array.isArray(object.material) ? object.material[0] : object.material) as THREE.MeshStandardMaterial

    if (highlight) {
      // 高亮：设置高亮颜色和放大
      material.emissive!.set(dragModeParams.highlightColor)
      material.emissiveIntensity = 0.3
      object.scale.setScalar(dragModeParams.highlightScale)
    } else {
      // 恢复原始颜色和缩放
      material.emissive!.set(0x000000)
      material.emissiveIntensity = 0
      object.scale.setScalar(1.0)
    }
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    // ====== 拖拽模式控制 ======
    const modeFolder = gui.addFolder("🎮 拖拽模式")

    const modeOptions = {
      customMode: "自由拖拽"
    }

    const modes = ["自由拖拽", "仅 X 轴", "仅 Y 轴", "仅 Z 轴"]

    modeFolder
      .add(modeOptions, "customMode", modes)
      .name("拖拽模式")
      .onChange((value) => {
        customMode = value
        switch (value) {
          case "自由拖拽":
            constrainedAxis = null
            break
          case "仅 X 轴":
            constrainedAxis = "x"
            break
          case "仅 Y 轴":
            constrainedAxis = "y"
            break
          case "仅 Z 轴":
            constrainedAxis = "z"
            break
        }
      })

    modeFolder.open()

    // ====== 外观设置 ======
    const appearanceFolder = gui.addFolder("🎨 高亮设置")

    appearanceFolder
      .addColor(dragModeParams, "highlightColor")
      .name("高亮颜色")
      .onChange(() => {
        // 更新已有高亮物体
        draggableObjects.forEach((obj) => {
          const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material
          if (!mat) return
          if (((mat as THREE.MeshStandardMaterial).emissiveIntensity ?? 0) <= 0) return
          ;(mat as THREE.MeshStandardMaterial).emissive!.set(dragModeParams.highlightColor)
        })
      })

    appearanceFolder
      .add(dragModeParams, "highlightScale", 1.0, 1.5, 0.05)
      .name("高亮缩放")

    appearanceFolder.open()

    // ====== 拖拽状态信息 ======
    const statusFolder = gui.addFolder("📊 拖拽状态")

    const statusData = {
      isDragging: "否",
      objectName: "无",
      position: "x: 0, y: 0, z: 0",
      mode: "自由拖拽"
    }

    statusFolder.add(statusData, "isDragging").name("正在拖拽").listen()
    statusFolder.add(statusData, "objectName").name("当前物体").listen()
    statusFolder.add(statusData, "position").name("物体位置").listen()
    statusFolder.add(statusData, "mode").name("当前模式").listen()

    statusFolder.open()

    // 定期更新 GUI 状态
    const statusInterval = setInterval(() => {
      statusData.isDragging = dragInfo.isDragging ? "是 ✅" : "否"
      statusData.objectName = dragInfo.objectName
      statusData.position = dragInfo.position
      statusData.mode = customMode
    }, 100)

    // 保存 interval 引用以便清理
    window.__dragStatusInterval = statusInterval as unknown as number
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理状态更新定时器
    if (window.__dragStatusInterval) {
      clearInterval(window.__dragStatusInterval)
      delete window.__dragStatusInterval
    }

    // 清理 DragControls
    if (dragControlsInstance) {
      dragControlsInstance.dispose()
      dragControlsInstance = null
    }

    // 清理原始颜色映射
    originalColors.clear()

    // 清理 GUI
    gui?.destroy()
    gui = null

    // 清理引用
    draggableObjects = []
    constrainedAxis = null

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    // 创建可拖拽物体
    createDraggableObjects()
    // 初始化 DragControls
    initDragControls()
    // 初始化 GUI
    initGUI()
    // 启动动画循环
    startAnimation()
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🖐️ 拖拽 3D 物体"
    description="使用 DragControls 实现鼠标拖拽 3D 物体，支持自由拖拽和轴向限制模式"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🖐️ <strong>自由拖拽</strong> - 鼠标拖拽物体在三维空间中移动</li>
          <li>📐 <strong>轴向限制</strong> - 支持仅 X/Y/Z 轴方向拖拽</li>
          <li>🎨 <strong>高亮反馈</strong> - 拖拽时物体发光 + 放大效果</li>
          <li>🔗 <strong>自动协同</strong> - 拖拽时禁用 OrbitControls，释放后恢复</li>
          <li>📡 <strong>事件监听</strong> - dragstart / drag / dragend 完整事件</li>
          <li>🖱️ <strong>悬停提示</strong> - 鼠标悬停物体时改变指针样式</li>
          <li>📊 <strong>实时状态</strong> - GUI 面板显示当前拖拽物体和位置</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎮 操作指南：</h3>
        <ul>
          <li>🖱️ <strong>鼠标悬停</strong> - 物体轻微放大，鼠标变为抓手</li>
          <li>🖐️ <strong>左键拖拽</strong> - 拖拽物体移动</li>
          <li>🔄 <strong>右键旋转</strong> - OrbitControls 旋转视角</li>
          <li>📏 <strong>滚轮缩放</strong> - OrbitControls 缩放</li>
          <li>⚙️ <strong>GUI 面板</strong> - 切换拖拽模式和高亮设置</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 DragControls 核心 API：</h3>
        <ul>
          <li><code>new DragControls(objects, camera, domElement)</code></li>
          <li><code>'dragstart'</code> - 拖拽开始事件</li>
          <li><code>'drag'</code> - 拖拽中事件（每帧触发）</li>
          <li><code>'dragend'</code> - 拖拽结束事件</li>
          <li><code>'hoveron'</code> - 鼠标悬停进入事件</li>
          <li><code>'hoveroff'</code> - 鼠标悬停离开事件</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 实现原理：</p>
        <ul style="margin-top: 8px">
          <li>• DragControls 使用 Raycaster 检测鼠标与物体的交点</li>
          <li>• 拖拽时通过修改物体 position 实现移动</li>
          <li>• 轴向限制：在 drag 事件中锁定其他两个轴的坐标</li>
          <li>• 协同 OrbitControls：dragstart 禁用，dragend 恢复</li>
          <li>• 物体高亮通过设置 emissive（自发光）属性实现</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 拖拽模式说明：</h3>
        <ul>
          <li>🌐 <strong>自由拖拽</strong> - 物体在 3D 空间中自由移动</li>
          <li>↔️ <strong>仅 X 轴</strong> - 物体只能左右移动</li>
          <li>↕️ <strong>仅 Y 轴</strong> - 物体只能上下移动</li>
          <li>⬆️ <strong>仅 Z 轴</strong> - 物体只能前后移动</li>
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
</style>
