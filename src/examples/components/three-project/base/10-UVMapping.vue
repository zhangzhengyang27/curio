<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 容器引用
  const containerRef = shallowRef(null)

  // 使用公共的 Three.js 场景逻辑
  const {
    scene,
    camera: _camera,
    renderer: _renderer,
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
  let gui!: GUI
  let planeMesh!: THREE.Mesh // 左侧平面（使用 PlaneGeometry）
  let customPlane!: THREE.Mesh // 右侧平面（使用 BufferGeometry）
  let uvTexture!: THREE.Texture

  /**
   * 加载纹理
   */
  const loadTexture = () => {
    const textureLoader = new THREE.TextureLoader()
    uvTexture = textureLoader.load("/three-project/texture/uv_grid_opengl.jpg")
    console.log("UV 纹理已加载")
  }

  /** 创建使用 PlaneGeometry 的平面（左侧） */
  const createPlaneGeometry = () => {
    if (!scene.value) return

    // 创建平面几何体
    const planeGeometry = new THREE.PlaneGeometry(2, 2)
    console.log("PlaneGeometry:", planeGeometry)

    // 创建材质
    const planeMaterial = new THREE.MeshBasicMaterial({
      map: uvTexture,
      side: THREE.DoubleSide // 双面显示
    })

    // 创建平面网格
    planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
    planeMesh.position.x = -3
    scene.value.add(planeMesh)

    console.log("PlaneGeometry 平面已创建")
  }

  /** 创建使用 BufferGeometry 的平面（右侧），手动设置顶点、索引和 UV 坐标 */
  const createCustomGeometry = () => {
    if (!scene.value) return

    // 创建几何体
    const geometry = new THREE.BufferGeometry()

    // 创建顶点数据（4个顶点）
    // 顶点顺序：左下、右下、右上、左上
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

    // 创建顶点属性（3个值为一组：x, y, z）
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))

    // 创建索引（定义三角形）
    // 两个三角形组成一个矩形：第一个三角形 (0,1,2)，第二个三角形 (2,3,0)
    const indices = new Uint16Array([
      0,
      1,
      2, // 第一个三角形
      2,
      3,
      0 // 第二个三角形
    ])

    // 创建索引属性
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))

    // 设置 UV 坐标（纹理坐标）
    // UV 坐标范围：0-1，左下角为 (0,0)，右上角为 (1,1)
    const uv = new Float32Array([
      0,
      0, // 顶点 0 的 UV 坐标：左下
      1,
      0, // 顶点 1 的 UV 坐标：右下
      1,
      1, // 顶点 2 的 UV 坐标：右上
      0,
      1 // 顶点 3 的 UV 坐标：左上
    ])

    // 创建 UV 属性（2个值为一组：u, v）
    geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2))

    console.log("BufferGeometry:", geometry)

    // 创建材质
    const material = new THREE.MeshBasicMaterial({
      map: uvTexture,
      side: THREE.DoubleSide // 双面显示
    })

    // 创建平面网格
    customPlane = new THREE.Mesh(geometry, material)
    customPlane.position.x = 3
    scene.value.add(customPlane)

    console.log("BufferGeometry 平面已创建")
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    // 左侧平面控制（PlaneGeometry）
    const leftPlaneFolder = gui.addFolder("左侧平面 (PlaneGeometry)")
    leftPlaneFolder.add(planeMesh.position, "x").min(-10).max(0).step(0.1).name("X 轴位置")
    leftPlaneFolder.add(planeMesh.position, "y").min(-5).max(5).step(0.1).name("Y 轴位置")
    leftPlaneFolder.add(planeMesh.position, "z").min(-5).max(5).step(0.1).name("Z 轴位置")
    leftPlaneFolder.add(planeMesh.rotation, "x").min(-Math.PI).max(Math.PI).step(0.01).name("X 轴旋转")
    leftPlaneFolder.add(planeMesh.rotation, "y").min(-Math.PI).max(Math.PI).step(0.01).name("Y 轴旋转")
    leftPlaneFolder.add(planeMesh.rotation, "z").min(-Math.PI).max(Math.PI).step(0.01).name("Z 轴旋转")
    leftPlaneFolder.add(planeMesh, "visible").name("显示/隐藏")

    // 右侧平面控制（BufferGeometry）
    const rightPlaneFolder = gui.addFolder("右侧平面 (BufferGeometry)")
    rightPlaneFolder.add(customPlane.position, "x").min(0).max(10).step(0.1).name("X 轴位置")
    rightPlaneFolder.add(customPlane.position, "y").min(-5).max(5).step(0.1).name("Y 轴位置")
    rightPlaneFolder.add(customPlane.position, "z").min(-5).max(5).step(0.1).name("Z 轴位置")
    rightPlaneFolder.add(customPlane.rotation, "x").min(-Math.PI).max(Math.PI).step(0.01).name("X 轴旋转")
    rightPlaneFolder.add(customPlane.rotation, "y").min(-Math.PI).max(Math.PI).step(0.01).name("Y 轴旋转")
    rightPlaneFolder.add(customPlane.rotation, "z").min(-Math.PI).max(Math.PI).step(0.01).name("Z 轴旋转")
    rightPlaneFolder.add(customPlane, "visible").name("显示/隐藏")

    // UV 坐标信息
    const infoFolder = gui.addFolder("UV 坐标信息")
    const info = {
      description: "UV坐标范围: 0-1",
      leftBottom: "(0, 0)",
      rightTop: "(1, 1)"
    }
    infoFolder.add(info, "description").name("说明").disable()
    infoFolder.add(info, "leftBottom").name("左下角").disable()
    infoFolder.add(info, "rightTop").name("右上角").disable()

    // 全屏控制
    const screenFolder = gui.addFolder("屏幕控制")
    const eventObj = {
      Fullscreen: function () {
        document.body.requestFullscreen()
        console.log("进入全屏")
      },
      ExitFullscreen: function () {
        document.exitFullscreen()
        console.log("退出全屏")
      }
    }
    screenFolder.add(eventObj, "Fullscreen").name("🖥️ 全屏")
    screenFolder.add(eventObj, "ExitFullscreen").name("🚪 退出全屏")

    console.log("GUI 调试面板已初始化")
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理纹理
    if (uvTexture) {
      uvTexture.dispose()
    }

    // 清理左侧平面
    if (planeMesh) {
      planeMesh.geometry.dispose()
      const mat1 = planeMesh.material as THREE.Material
      mat1.dispose()
    }

    // 清理右侧平面
    if (customPlane) {
      customPlane.geometry.dispose()
      const mat2 = customPlane.material as THREE.Material
      mat2.dispose()
    }

    // 清理 GUI
    gui?.destroy()

    // 调用基础清理
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    loadTexture()
    createPlaneGeometry()
    createCustomGeometry()
    initGUI()
    startAnimation()
  })

  // 组件卸载时清理
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🗺️ UV 坐标映射"
    description="学习如何设置和使用 UV 坐标进行纹理映射"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>📐 <strong>PlaneGeometry</strong> - 使用内置几何体（左侧）</li>
          <li>🔧 <strong>BufferGeometry</strong> - 手动设置顶点和 UV（右侧）</li>
          <li>🗺️ <strong>UV 映射</strong> - UV 坐标纹理映射</li>
          <li>🎨 <strong>纹理贴图</strong> - UV 网格纹理展示</li>
          <li>🎮 <strong>交互控制</strong> - GUI 实时调整参数</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔧 UV 坐标系统：</h3>
        <ul>
          <li>📍 <strong>UV 坐标</strong> - U（横轴）和 V（纵轴）范围 0-1</li>
          <li>📐 <strong>左下角</strong> - UV 坐标为 (0, 0)</li>
          <li>📐 <strong>右上角</strong> - UV 坐标为 (1, 1)</li>
          <li>🔄 <strong>顶点对应</strong> - 每个顶点需要对应一个 UV 坐标</li>
          <li>🎯 <strong>纹理映射</strong> - UV 坐标决定纹理如何映射到几何体</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📊 两种实现方式对比：</h3>
        <ul>
          <li><strong>左侧 - PlaneGeometry：</strong></li>
          <li style="margin-left: 20px">
            ✅ 使用 Three.js 内置几何体
          </li>
          <li style="margin-left: 20px">
            ✅ 自动生成顶点和 UV 坐标
          </li>
          <li style="margin-left: 20px">
            ✅ 代码简单，适合标准形状
          </li>
          <li><strong>右侧 - BufferGeometry：</strong></li>
          <li style="margin-left: 20px">
            🔧 手动定义顶点位置
          </li>
          <li style="margin-left: 20px">
            🔧 手动设置索引（三角形）
          </li>
          <li style="margin-left: 20px">
            🔧 手动指定 UV 坐标
          </li>
          <li style="margin-left: 20px">
            🔧 更灵活，适合自定义形状
          </li>
        </ul>
      </div>
    </template>

    <!-- Three.js 容器 -->
    <div ref="containerRef" />
  </PageLayout>
</template>

<style scoped>
  code {
    background: rgba(0, 0, 0, 0.3);
    padding: 2px 6px;
    border-radius: 3px;
    font-family: "Courier New", monospace;
    font-size: 10px;
    color: #42b983;
  }
</style>
