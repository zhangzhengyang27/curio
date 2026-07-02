<script setup lang="ts">
  import { shallowRef, onUnmounted, type ShallowRef } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 容器引用
  const containerRef: ShallowRef<HTMLDivElement | null> = shallowRef(null)

  // 使用公共的 Three.js 场景逻辑
  const {
    scene,
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 2, y: 2, z: 5 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05
    },
    showAxesHelper: true
  })

  // Three.js 对象引用
  let plane: THREE.Mesh
  let gui: GUI

  // GUI 事件对象
  interface EventObj {
    Fullscreen: () => void
    ExitFullscreen: () => void
  }

  /**
   * 创建自定义几何体（使用 BufferGeometry）
   */
  const createCustomGeometry = (): void => {
    if (!scene.value) return

    // 创建 BufferGeometry
    const geometry: THREE.BufferGeometry = new THREE.BufferGeometry()

    // 创建顶点数据
    // 顶点是有序的，每三个数字为一个顶点坐标 (x, y, z)
    // 定义四个顶点，形成一个矩形
    const vertices = new Float32Array([
      -1.0,
      -1.0,
      0.0, // 顶点 0: 左下
      1.0,
      -1.0,
      0.0, // 顶点 1: 右下
      1.0,
      1.0,
      0.0, // 顶点 2: 右上
      -1.0,
      1.0,
      0.0 // 顶点 3: 左上
    ])

    // 创建顶点属性（position 是着色器中的属性名）
    // 第二个参数 3 表示每个顶点由 3 个值组成（x, y, z）
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))

    // 使用索引绘制（减少顶点重复）
    // 索引指定如何连接顶点形成三角形，每三个索引定义一个三角形
    const indices = new Uint16Array([
      0,
      1,
      2, // 第一个三角形：顶点 0 -> 1 -> 2
      2,
      3,
      0 // 第二个三角形：顶点 2 -> 3 -> 0
    ])

    // 设置索引属性
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))

    console.log("自定义几何体:", geometry)

    // 创建材质（线框模式便于观察结构）
    const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide, // 双面显示
      wireframe: true // 线框模式
    })

    // 创建网格
    plane = new THREE.Mesh(geometry, material)
    scene.value.add(plane)

    // 输出标准几何体供对比
    const cubeGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1)
    console.log("标准立方体几何体:", cubeGeometry)
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = (): void => {
    gui = new GUI()

    // 事件对象
    const eventObj: EventObj = {
      Fullscreen: () => {
        document.body.requestFullscreen()
        console.log("全屏")
      },
      ExitFullscreen: () => {
        document.exitFullscreen()
        console.log("退出全屏")
      }
    }

    // 添加全屏控制
    gui.add(eventObj, "Fullscreen").name("全屏")
    gui.add(eventObj, "ExitFullscreen").name("退出全屏")

    // 添加平面控制
    const planeFolder = gui.addFolder("平面控制")

    planeFolder.add(plane.position, "x").min(-5).max(5).step(0.1).name("X 轴位置")

    planeFolder.add(plane.position, "y").min(-5).max(5).step(0.1).name("Y 轴位置")

    planeFolder.add(plane.position, "z").min(-5).max(5).step(0.1).name("Z 轴位置")

    planeFolder
      .add(plane.rotation, "x")
      .min(0)
      .max(Math.PI * 2)
      .step(0.01)
      .name("X 轴旋转")

    planeFolder
      .add(plane.rotation, "y")
      .min(0)
      .max(Math.PI * 2)
      .step(0.01)
      .name("Y 轴旋转")

    planeFolder
      .add(plane.rotation, "z")
      .min(0)
      .max(Math.PI * 2)
      .step(0.01)
      .name("Z 轴旋转")

    // 材质控制
    const material = plane.material as THREE.MeshBasicMaterial
    const wireframeParams: { wireframe: boolean } = {
      wireframe: !!material.wireframe
    }
    gui
      .add(wireframeParams, "wireframe")
      .name("线框模式")
      .onChange((val: boolean) => {
        material.wireframe = val
      })
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = (): void => {
    // 清理 GUI
    gui?.destroy()
    // 调用基础清理
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    createCustomGeometry()
    initGUI()
    startAnimation()
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="📐 BufferGeometry"
    description="自定义几何体和顶点索引"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="info-section">
        <h3>🎯 核心概念</h3>
        <ul>
          <li><strong>BufferGeometry</strong>：高性能几何体</li>
          <li><strong>顶点数据</strong>：定义几何体的形状</li>
          <li><strong>索引</strong>：优化顶点重用</li>
          <li><strong>Float32Array</strong>：存储顶点坐标</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 示例说明</h3>
        <p class="small-text">
          本示例创建了一个矩形平面，使用 4 个顶点和 6 个索引（2个三角形）。 打开控制台可以查看几何体的详细信息。
        </p>
      </div>

      <div class="code-tip">
        <p><strong>💡 顶点顺序：</strong></p>
        <p class="small-text">
          逆时针定义的面为正面<br>
          三角形 1: 0 → 1 → 2<br>
          三角形 2: 2 → 3 → 0
        </p>
      </div>
    </template>

    <!-- Three.js 容器 -->
    <div ref="containerRef" />
  </PageLayout>
</template>
