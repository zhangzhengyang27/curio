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
  let cube: THREE.Mesh
  let plane: THREE.Mesh
  let gui: GUI

  // GUI 事件对象
  interface EventObj {
    Fullscreen: () => void
    ExitFullscreen: () => void
  }

  /**
   * 创建多材质立方体
   * 每个面使用不同的颜色
   */
  const createMultiMaterialCube = (): void => {
    if (!scene.value) return

    // 创建立方体几何体
    const cubeGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1)
    console.log("立方体几何体:", cubeGeometry)

    // 创建 6 种不同颜色的材质（对应立方体的 6 个面）
    const materials: THREE.MeshBasicMaterial[] = [
      new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // 右侧面 - 绿色
      new THREE.MeshBasicMaterial({ color: 0xff0000 }), // 左侧面 - 红色
      new THREE.MeshBasicMaterial({ color: 0x0000ff }), // 顶面 - 蓝色
      new THREE.MeshBasicMaterial({ color: 0xffff00 }), // 底面 - 黄色
      new THREE.MeshBasicMaterial({ color: 0x00ffff }), // 前面 - 青色
      new THREE.MeshBasicMaterial({ color: 0xff00ff }) // 后面 - 品红色
    ]

    // 创建网格，传入材质数组
    cube = new THREE.Mesh(cubeGeometry, materials)
    cube.position.x = 2

    // 将立方体添加到场景中
    scene.value.add(cube)
  }

  /**
   * 创建使用顶点组的平面
   * 通过顶点组将同一几何体分成多个部分，每部分使用不同材质
   */
  const createVertexGroupPlane = (): void => {
    if (!scene.value) return

    // 创建 BufferGeometry
    const geometry: THREE.BufferGeometry = new THREE.BufferGeometry()

    // 定义四个顶点，形成一个矩形
    // 每三个数字为一个顶点坐标 (x, y, z)
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

    // 设置顶点属性
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))

    // 使用索引绘制（减少顶点重复）
    // 每三个索引定义一个三角形
    const indices = new Uint16Array([
      0,
      1,
      2, // 第一个三角形：右下角
      2,
      3,
      0 // 第二个三角形：左上角
    ])

    // 设置索引属性
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))

    // 设置顶点组
    // addGroup(start, count, materialIndex)
    // start: 起始索引
    // count: 索引数量
    // materialIndex: 使用的材质索引
    geometry.addGroup(0, 3, 0) // 第一个三角形使用第一个材质（绿色线框）
    geometry.addGroup(3, 3, 1) // 第二个三角形使用第二个材质（红色填充）

    console.log("顶点组几何体:", geometry)

    // 创建两种不同的材质
    const material1: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true // 线框模式
    })

    const material2: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000
      // 填充模式
    })

    // 创建网格，传入材质数组
    plane = new THREE.Mesh(geometry, [material1, material2])
    scene.value.add(plane)
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
    const screenFolder = gui.addFolder("屏幕控制")
    screenFolder.add(eventObj, "Fullscreen").name("全屏")
    screenFolder.add(eventObj, "ExitFullscreen").name("退出全屏")

    // 添加立方体控制
    const cubeFolder = gui.addFolder("立方体控制")
    cubeFolder.add(cube.position, "x").min(-5).max(5).step(0.1).name("X 轴位置")
    cubeFolder.add(cube.position, "y").min(-5).max(5).step(0.1).name("Y 轴位置")
    cubeFolder.add(cube.position, "z").min(-5).max(5).step(0.1).name("Z 轴位置")
    cubeFolder
      .add(cube.rotation, "x")
      .min(0)
      .max(Math.PI * 2)
      .step(0.01)
      .name("X 轴旋转")
    cubeFolder
      .add(cube.rotation, "y")
      .min(0)
      .max(Math.PI * 2)
      .step(0.01)
      .name("Y 轴旋转")

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

    // 线框模式切换
    const material1 = (plane.material as THREE.Material[])[0] as THREE.MeshBasicMaterial
    const wireframeParams: { wireframe: boolean } = {
      wireframe: !!material1.wireframe
    }
    planeFolder
      .add(wireframeParams, "wireframe")
      .name("第一材质线框")
      .onChange((val: boolean) => {
        material1.wireframe = val
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
    createMultiMaterialCube()
    createVertexGroupPlane()
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
    title="🎨 顶点组与材质"
    description="多材质立方体与顶点组应用"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="info-section">
        <h3>🎯 核心概念</h3>
        <ul>
          <li><strong>多材质网格</strong>：一个几何体使用多个材质</li>
          <li><strong>顶点组</strong>：将几何体分组，每组使用不同材质</li>
          <li><strong>addGroup()</strong>：定义材质应用范围</li>
          <li><strong>材质数组</strong>：按顺序对应顶点组</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 示例说明</h3>
        <p class="small-text">
          <strong>右侧立方体：</strong>每个面使用不同颜色的材质<br>
          <strong>左侧平面：</strong>使用顶点组将矩形分成两个三角形，分别应用不同材质
        </p>
      </div>

      <div class="code-tip">
        <p><strong>💡 顶点组用法：</strong></p>
        <p class="small-text">
          geometry.addGroup(start, count, materialIndex)<br>
          • start: 起始索引位置<br>
          • count: 使用的索引数量<br>
          • materialIndex: 材质在数组中的索引
        </p>
      </div>

      <div class="code-tip">
        <p><strong>🎨 立方体材质顺序：</strong></p>
        <p class="small-text">
          [0] 右侧面 - 绿色<br>
          [1] 左侧面 - 红色<br>
          [2] 顶面 - 蓝色<br>
          [3] 底面 - 黄色<br>
          [4] 前面 - 青色<br>
          [5] 后面 - 品红色
        </p>
      </div>

      <div class="controls-tip">
        <p>🎮 调试面板功能：</p>
        <ul>
          <li>控制立方体和平面的位置</li>
          <li>调整物体的旋转角度</li>
          <li>切换平面第一材质的线框模式</li>
          <li>全屏 / 退出全屏</li>
        </ul>
      </div>
    </template>

    <!-- Three.js 容器 -->
    <div ref="containerRef" />
  </PageLayout>
</template>

<style scoped>
  /* 页面特定样式可以在这里添加 */
</style>
