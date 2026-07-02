<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { VertexNormalsHelper } from "three/examples/jsm/helpers/VertexNormalsHelper.js"
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
  let planeMesh!: THREE.Mesh // 左侧平面（PlaneGeometry）
  let customPlane!: THREE.Mesh // 右侧平面（BufferGeometry）
  let uvTexture!: THREE.Texture
  let normalsHelper!: VertexNormalsHelper // 法向量辅助器

  /** 加载纹理 */
  const loadTexture = () => {
    const textureLoader = new THREE.TextureLoader()
    uvTexture = textureLoader.load("/three-project/texture/uv_grid_opengl.jpg")
    console.log("UV 纹理已加载")
  }

  /** 创建使用 PlaneGeometry 的平面（左侧） */
  const createPlaneGeometry = () => {
    if (!scene.value) return

    // 创建平面几何体（自动计算法向量）
    const planeGeometry = new THREE.PlaneGeometry(2, 2)
    console.log("PlaneGeometry:", planeGeometry)

    // 创建材质
    const planeMaterial = new THREE.MeshBasicMaterial({
      map: uvTexture,
      side: THREE.DoubleSide
    })

    // 创建平面网格
    planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
    planeMesh.position.x = -3
    scene.value.add(planeMesh)

    console.log("PlaneGeometry 平面已创建（自动法向量）")
  }

  /** 创建使用 BufferGeometry 的平面（右侧），手动设置法向量 */
  const createCustomGeometry = () => {
    if (!scene.value) return

    // 创建几何体
    const geometry = new THREE.BufferGeometry()

    // 创建顶点数据
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

    // 创建顶点属性
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))

    // 创建索引
    const indices = new Uint16Array([
      0,
      1,
      2, // 第一个三角形
      2,
      3,
      0 // 第二个三角形
    ])
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))

    // 设置 UV 坐标
    const uv = new Float32Array([
      0,
      0, // 顶点 0
      1,
      0, // 顶点 1
      1,
      1, // 顶点 2
      0,
      1 // 顶点 3
    ])
    geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2))

    // 手动设置法向量（每个顶点的法向量）
    // 法向量是指向平面外的垂直方向，用于光照计算
    const normals = new Float32Array([
      0,
      0,
      1, // 顶点 0 的法向量：指向 Z 轴正方向
      0,
      0,
      1, // 顶点 1 的法向量
      0,
      0,
      1, // 顶点 2 的法向量
      0,
      0,
      1 // 顶点 3 的法向量
    ])
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3))

    // 注意：也可以使用 geometry.computeVertexNormals() 自动计算法向量
    // geometry.computeVertexNormals();

    console.log("BufferGeometry:", geometry)

    // 创建材质
    const material = new THREE.MeshBasicMaterial({
      map: uvTexture,
      side: THREE.DoubleSide
    })

    // 创建平面网格
    customPlane = new THREE.Mesh(geometry, material)
    customPlane.position.x = 3
    scene.value.add(customPlane)

    // 创建法向量辅助器（可视化法向量）
    // 参数：网格对象、法向量长度、法向量颜色
    normalsHelper = new VertexNormalsHelper(customPlane, 0.2, 0xff0000)
    scene.value.add(normalsHelper)

    console.log("BufferGeometry 平面已创建（手动法向量）")
  }

  /** 初始化 GUI 调试面板 */
  const initGUI = () => {
    gui = new GUI()

    // 左侧平面控制（PlaneGeometry - 自动法向量）
    const leftPlaneFolder = gui.addFolder("左侧平面 (自动法向量)")
    leftPlaneFolder.add(planeMesh.position, "x").min(-10).max(0).step(0.1).name("X 轴位置")
    leftPlaneFolder.add(planeMesh.position, "y").min(-5).max(5).step(0.1).name("Y 轴位置")
    leftPlaneFolder.add(planeMesh.position, "z").min(-5).max(5).step(0.1).name("Z 轴位置")
    leftPlaneFolder.add(planeMesh.rotation, "x").min(-Math.PI).max(Math.PI).step(0.01).name("X 轴旋转")
    leftPlaneFolder.add(planeMesh.rotation, "y").min(-Math.PI).max(Math.PI).step(0.01).name("Y 轴旋转")
    leftPlaneFolder.add(planeMesh.rotation, "z").min(-Math.PI).max(Math.PI).step(0.01).name("Z 轴旋转")
    leftPlaneFolder.add(planeMesh, "visible").name("显示/隐藏")

    // 右侧平面控制（BufferGeometry - 手动法向量）
    const rightPlaneFolder = gui.addFolder("右侧平面 (手动法向量)")
    rightPlaneFolder.add(customPlane.position, "x").min(0).max(10).step(0.1).name("X 轴位置")
    rightPlaneFolder.add(customPlane.position, "y").min(-5).max(5).step(0.1).name("Y 轴位置")
    rightPlaneFolder.add(customPlane.position, "z").min(-5).max(5).step(0.1).name("Z 轴位置")
    rightPlaneFolder.add(customPlane.rotation, "x").min(-Math.PI).max(Math.PI).step(0.01).name("X 轴旋转")
    rightPlaneFolder.add(customPlane.rotation, "y").min(-Math.PI).max(Math.PI).step(0.01).name("Y 轴旋转")
    rightPlaneFolder.add(customPlane.rotation, "z").min(-Math.PI).max(Math.PI).step(0.01).name("Z 轴旋转")
    rightPlaneFolder.add(customPlane, "visible").name("显示/隐藏")

    // 法向量辅助器控制
    const normalsFolder = gui.addFolder("法向量辅助器")
    normalsFolder.add(normalsHelper, "visible").name("显示法向量")

    const normalsParams = {
      size: 0.2,
      updateSize: () => {
        // 更新法向量辅助器大小
        if (scene.value) {
          scene.value.remove(normalsHelper)
          normalsHelper.dispose()
          normalsHelper = new VertexNormalsHelper(customPlane, normalsParams.size, 0xff0000)
          scene.value.add(normalsHelper)
        }
      }
    }
    normalsFolder.add(normalsParams, "size").min(0.1).max(1).step(0.05).name("法向量长度")
    normalsFolder.add(normalsParams, "updateSize").name("🔧 应用长度")

    // 法向量信息
    const infoFolder = gui.addFolder("法向量信息")
    const info = {
      description: "法向量垂直于平面",
      direction: "(0, 0, 1)",
      usage: "用于光照计算"
    }
    infoFolder.add(info, "description").name("说明").disable()
    infoFolder.add(info, "direction").name("方向向量").disable()
    infoFolder.add(info, "usage").name("用途").disable()

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

  /** 扩展清理函数 */
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

    // 清理法向量辅助器
    if (normalsHelper) {
      normalsHelper.dispose()
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
    title="🧭 顶点法向量"
    description="学习法向量的原理与可视化，理解法向量在光照计算中的作用"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🧭 <strong>法向量</strong> - 顶点法向量的定义和使用</li>
          <li>🔴 <strong>可视化</strong> - VertexNormalsHelper 辅助器</li>
          <li>⚡ <strong>自动计算</strong> - computeVertexNormals() 方法</li>
          <li>✍️ <strong>手动设置</strong> - 手动定义法向量属性</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📐 什么是法向量？</h3>
        <ul>
          <li>📍 <strong>定义</strong> - 垂直于平面的方向向量</li>
          <li>📏 <strong>长度</strong> - 通常归一化为单位向量（长度为 1）</li>
          <li>🎯 <strong>方向</strong> - 指向平面的外侧（正面）</li>
          <li>💡 <strong>作用</strong> - 用于光照计算、阴影、反射等</li>
          <li>🔢 <strong>数据</strong> - 每个顶点都有一个法向量（x, y, z）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔧 两种设置方式：</h3>
        <ul>
          <li><strong>自动计算（推荐）：</strong></li>
          <li style="margin-left: 20px">
            ✅ 使用
            <code style="background: rgba(0, 0, 0, 0.3); padding: 2px 6px; border-radius: 3px; font-size: 11px">geometry.computeVertexNormals()</code>
          </li>
          <li style="margin-left: 20px">
            ✅ Three.js 自动根据三角形面计算
          </li>
          <li style="margin-left: 20px">
            ✅ 适合大多数情况
          </li>
          <li><strong>手动设置：</strong></li>
          <li style="margin-left: 20px">
            🔧 使用
            <code style="background: rgba(0, 0, 0, 0.3); padding: 2px 6px; border-radius: 3px; font-size: 11px">geometry.setAttribute("normal", ...)</code>
          </li>
          <li style="margin-left: 20px">
            🔧 需要精确控制法向量方向
          </li>
          <li style="margin-left: 20px">
            🔧 适合特殊效果（如卡通渲染）
          </li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎨 法向量的应用：</h3>
        <ul>
          <li>💡 <strong>漫反射光照</strong> - 法向量与光线夹角决定亮度</li>
          <li>✨ <strong>镜面反射</strong> - 计算高光效果</li>
          <li>🌓 <strong>背面剔除</strong> - 判断面是否朝向相机</li>
          <li>🎭 <strong>法线贴图</strong> - 增加表面细节</li>
          <li>🔮 <strong>环境映射</strong> - 计算反射方向</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔴 法向量辅助器：</h3>
        <ul>
          <li>📊 红色箭头表示法向量的方向</li>
          <li>📏 箭头长度可调节（默认 0.2）</li>
          <li>👁️ 帮助理解顶点法向量的方向</li>
          <li>🎓 调试和学习的好工具</li>
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
    font-size: 11px;
    color: #42b983;
  }
</style>
