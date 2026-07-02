<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 容器引用
  const containerRef = shallowRef(null)

  // 使用公共的 Three.js 场景逻辑
  const {
    scene,
    camera,
    renderer,
    startAnimation: _startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 15, y: 12, z: 15 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 5,
      maxDistance: 60
    },
    showAxesHelper: true
  })

  // GUI 和对象引用
  let gui: GUI | null = null
  let normalGroup: THREE.Group | null = null // 独立 Mesh 组
  let mergedMesh: THREE.Mesh | null = null // 合并后的 Mesh
  let animationId = 0

  // 配置参数
  const params = {
    mode: "merged", // 'normal' 或 'merged'
    meshCount: 100, // Mesh 数量
    shape: "box", // 'box' 或 'sphere'
    animate: true // 是否播放动画
  }

  // 保存原始位置数据（用于动画）
  let originalPositions: THREE.Vector3[] = []

  // GUI 信息对象
  const infoObj = {
    drawCalls: 0,
    triangles: 0,
    mode: "合并几何体"
  }

  /**
   * 创建独立 Mesh 组（未合并）
   * @param {number} count - Mesh 数量
   */
  const createNormalMeshes = (count: number) => {
    // 清理旧的独立 Mesh
    if (normalGroup) {
      normalGroup.traverse((child) => {
        if (child.isMesh) {
          const mesh = child as THREE.Mesh
          mesh.geometry?.dispose()
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          materials.forEach((m) => m?.dispose())
        }
      })
      scene.value?.remove(normalGroup)
    }

    normalGroup = new THREE.Group()
    normalGroup.name = "normalGroup"
    originalPositions = []

    // 创建共享几何体（但每个 Mesh 独立）
    const geometry =
      params.shape === "box"
        ? new THREE.BoxGeometry(0.8, 0.8, 0.8)
        : new THREE.SphereGeometry(0.5, 16, 16)

    // 共享材质 —— 所有 Mesh 使用相同材质
    const material = new THREE.MeshPhongMaterial({
      color: 0x42b983,
      flatShading: true
    })

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geometry, material)

      // 在网格中分布
      const gridSize = Math.ceil(Math.cbrt(count))
      const spacing = 1.5
      const x = (i % gridSize) * spacing - (gridSize * spacing) / 2
      const y = (Math.floor(i / gridSize) % gridSize) * spacing - (gridSize * spacing) / 2
      const z = Math.floor(i / (gridSize * gridSize)) * spacing - (gridSize * spacing) / 2

      mesh.position.set(x, y, z)
      originalPositions.push(new THREE.Vector3(x, y, z))

      normalGroup.add(mesh)
    }

    normalGroup.visible = params.mode === "normal"
    scene.value?.add(normalGroup)
  }

  /**
   * 创建合并后的几何体 Mesh
   * @param {number} count - Mesh 数量
   */
  const createMergedMesh = (count: number) => {
    // 清理旧的合并 Mesh
    if (mergedMesh) {
      mergedMesh.geometry.dispose()
      const materials = Array.isArray(mergedMesh.material)
        ? mergedMesh.material
        : [mergedMesh.material]
      materials.forEach((m) => m.dispose())
      scene.value?.remove(mergedMesh)
      mergedMesh = null
    }

    // 创建要合并的几何体数组
    const geometries: THREE.BufferGeometry[] = []
    const gridSize = Math.ceil(Math.cbrt(count))
    const spacing = 1.5

    for (let i = 0; i < count; i++) {
      // 创建几何体
      let geometry =
        params.shape === "box"
          ? new THREE.BoxGeometry(0.8, 0.8, 0.8)
          : new THREE.SphereGeometry(0.5, 16, 16)

      // 计算位置
      const x = (i % gridSize) * spacing - (gridSize * spacing) / 2
      const y = (Math.floor(i / gridSize) % gridSize) * spacing - (gridSize * spacing) / 2
      const z = Math.floor(i / (gridSize * gridSize)) * spacing - (gridSize * spacing) / 2

      // 应用位移变换到几何体
      geometry.translate(x, y, z)
      geometries.push(geometry)
    }

    // 使用 BufferGeometryUtils 合并所有几何体
    const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries)

    if (!mergedGeometry) {
      console.error("合并几何体失败！")
      return
    }

    // 创建合并后的 Mesh（单一材质）
    const material = new THREE.MeshPhongMaterial({
      color: 0x42b983,
      flatShading: true
    })

    mergedMesh = new THREE.Mesh(mergedGeometry, material)
    mergedMesh.name = "mergedMesh"

    // 清理原始几何体数组
    geometries.forEach((g) => g.dispose())

    mergedMesh.visible = params.mode === "merged"
    scene.value?.add(mergedMesh)
  }

  /**
   * 切换渲染模式
   * @param {string} mode - 'normal' 或 'merged'
   */
  const switchMode = (mode: string) => {
    params.mode = mode

    if (normalGroup) {
      normalGroup.visible = mode === "normal"
    }
    if (mergedMesh) {
      mergedMesh.visible = mode === "merged"
    }

    infoObj.mode = mode === "merged" ? "合并几何体" : "独立 Mesh"
  }

  /**
   * 动画循环
   */
  const animate = () => {
    animationId = requestAnimationFrame(animate)

    const time = performance.now() * 0.001

    // 动画：让 Mesh 缓慢波动
    if (params.animate) {
      if (normalGroup && normalGroup.visible) {
        normalGroup.children.forEach((mesh, i) => {
          if (originalPositions[i]) {
            mesh.position.y =
              originalPositions[i].y + Math.sin(time * 2 + i * 0.1) * 0.3
          }
        })
      }
      if (mergedMesh && mergedMesh.visible) {
        mergedMesh.rotation.y = time * 0.2
        mergedMesh.position.y = Math.sin(time) * 0.5
      }
    }

    // 渲染场景
    if (renderer.value && scene.value && camera.value) {
      renderer.value.render(scene.value, camera.value)

      // 更新 GUI 中的性能信息
      if (renderer.value.info) {
        infoObj.drawCalls = renderer.value.info.render.calls
        infoObj.triangles = renderer.value.info.render.triangles
      }
    }
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    // 渲染模式控制
    const modeFolder = gui.addFolder("渲染模式")
    modeFolder
      .add(params, "mode", { "独立 Mesh": "normal", "合并几何体": "merged" })
      .name("当前模式")
      .onChange((value) => switchMode(value))
    modeFolder.open()

    // Mesh 数量
    const countFolder = gui.addFolder("Mesh 数量")
    countFolder
      .add(params, "meshCount", [50, 100, 200, 500])
      .name("数量")
      .onChange(() => {
        createNormalMeshes(params.meshCount)
        createMergedMesh(params.meshCount)
        switchMode(params.mode)
      })
    countFolder.open()

    // 形状选择
    const shapeFolder = gui.addFolder("形状")
    shapeFolder
      .add(params, "shape", { "立方体": "box", "球体": "sphere" })
      .name("几何体形状")
      .onChange(() => {
        createNormalMeshes(params.meshCount)
        createMergedMesh(params.meshCount)
        switchMode(params.mode)
      })

    // 动画控制
    gui.add(params, "animate").name("播放动画")

    // 性能信息面板
    const infoFolder = gui.addFolder("📊 渲染信息")
    infoFolder.add(infoObj, "mode").name("当前模式").listen().disable()
    infoFolder.add(infoObj, "drawCalls").name("Draw Calls").listen().disable()
    infoFolder.add(infoObj, "triangles").name("三角面数").listen().disable()
    infoFolder.open()

    // 说明
    const tipFolder = gui.addFolder("💡 说明")
    const tips = {
      merged: "合并后: 1 次 Draw Call",
      normal: "独立时: N 次 Draw Call",
      limit: "限制: 必须使用相同材质"
    }
    tipFolder.add(tips, "merged").name("合并优势").disable()
    tipFolder.add(tips, "normal").name("独立劣势").disable()
    tipFolder.add(tips, "limit").name("合并限制").disable()
  }

  /**
   * 初始化光照
   */
  const initLights = () => {
    if (!scene.value) return

    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5)
    scene.value.add(ambientLight)

    // 平行光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    directionalLight.position.set(10, 20, 10)
    scene.value.add(directionalLight)

    // 补光
    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.5)
    fillLight.position.set(-10, 5, -10)
    scene.value.add(fillLight)
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 取消动画帧
    if (animationId) {
      cancelAnimationFrame(animationId)
    }

    // 清理独立 Mesh 组
    if (normalGroup) {
      normalGroup.traverse((child) => {
        if (child.isMesh) {
          const mesh = child as THREE.Mesh
          mesh.geometry?.dispose()
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          materials.forEach((m) => m?.dispose())
        }
      })
      scene.value?.remove(normalGroup)
      normalGroup = null
    }

    // 清理合并 Mesh
    if (mergedMesh) {
      mergedMesh.geometry.dispose()
      const materials = Array.isArray(mergedMesh.material)
        ? mergedMesh.material
        : [mergedMesh.material]
      materials.forEach((m) => m.dispose())
      scene.value?.remove(mergedMesh)
      mergedMesh = null
    }

    // 清理数据
    originalPositions = []

    // 清理 GUI
    gui?.destroy()

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    // 初始化光照
    initLights()
    // 创建两种模式的网格
    createNormalMeshes(params.meshCount)
    createMergedMesh(params.meshCount)
    // 设置初始模式
    switchMode(params.mode)
    // 初始化 GUI
    initGUI()
    // 启动动画循环
    animate()
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🔗 合并几何体 (Merged Geometry)"
    description="学习如何使用 BufferGeometryUtils.mergeGeometries 将多个几何体合并为一个，减少 Draw Call"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🔗 <strong>合并几何体</strong> - 使用 <code>mergeGeometries</code> 将多个几何体合并为一个</li>
          <li>📊 <strong>性能对比</strong> - GUI 切换独立 Mesh vs 合并后的 Mesh</li>
          <li>🎨 <strong>多种形状</strong> - 支持立方体和球体</li>
          <li>📏 <strong>数量调节</strong> - 50/100/200/500 个几何体</li>
          <li>📊 <strong>实时监控</strong> - 通过 GUI 面板查看 Draw Call 数量变化</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📖 什么是几何体合并？</h3>
        <ul>
          <li><strong>定义</strong>：将多个 BufferGeometry 合并为一个 BufferGeometry 的技术</li>
          <li><strong>原理</strong>：将所有顶点、法线、UV 等数据合并到一个顶点缓冲区中</li>
          <li><strong>效果</strong>：从 N 次 Draw Call 降低到 1 次 Draw Call</li>
          <li><strong>与 InstancedMesh 的区别</strong>：合并后的几何体无法单独修改，但更灵活</li>
          <li>⚠️ <strong>限制</strong>：所有 Mesh 必须使用相同材质</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚙️ 工作原理：</h3>
        <ul>
          <li>1️⃣ <strong>创建多个几何体</strong> - 每个几何体设置好位置（通过 <code>translate()</code>）</li>
          <li>2️⃣ <strong>合并几何体数组</strong> - 调用 <code>mergeGeometries(geometries)</code></li>
          <li>3️⃣ <strong>创建单个 Mesh</strong> - 使用合并后的几何体和共享材质</li>
          <li>4️⃣ <strong>清理原始几何体</strong> - 合并后不再需要原始几何体</li>
          <li>5️⃣ <strong>一次 Draw Call</strong> - GPU 一次性渲染所有几何体</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>🔧 核心代码：</p>
        <p><code>import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'</code></p>
        <br>
        <p><code>// 创建并变换几何体</code></p>
        <p><code>const geo = new THREE.BoxGeometry(1, 1, 1)</code></p>
        <p><code>geo.translate(x, y, z) // 将几何体移动到目标位置</code></p>
        <p><code>geometries.push(geo)</code></p>
        <br>
        <p><code>// 合并所有几何体</code></p>
        <p><code>const merged = BufferGeometryUtils.mergeGeometries(geometries)</code></p>
        <p><code>const mesh = new THREE.Mesh(merged, sharedMaterial)</code></p>
      </div>

      <div class="info-section">
        <h3>📊 合并 vs 实例化 对比：</h3>
        <ul>
          <li><strong>mergeGeometries</strong>：</li>
          <li>&nbsp;&nbsp;• 合并后无法单独移动/旋转某个几何体</li>
          <li>&nbsp;&nbsp;• 适合静态场景（如地形、建筑）</li>
          <li>&nbsp;&nbsp;• 可以使用不同几何体类型混合合并</li>
          <li><strong>InstancedMesh</strong>：</li>
          <li>&nbsp;&nbsp;• 每个 instance 可以独立变换</li>
          <li>&nbsp;&nbsp;• 所有 instance 必须使用相同几何体</li>
          <li>&nbsp;&nbsp;• 适合动态场景（如树木、粒子）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚠️ 使用限制：</h3>
        <ul>
          <li>🔸 所有 Mesh 必须使用<strong>相同材质</strong></li>
          <li>🔸 合并后无法单独操作某个几何体的变换</li>
          <li>🔸 不适合需要动态更新的场景</li>
          <li>🔸 合并大量几何体时需要注意内存使用</li>
          <li>💡 如果需要不同颜色，可以使用顶点颜色（vertex colors）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 应用场景：</h3>
        <ul>
          <li>🗺️ <strong>地形渲染</strong> - 将多个地形块合并</li>
          <li>🏙️ <strong>静态建筑</strong> - 不需要移动的建筑群</li>
          <li>🧩 <strong>拼图/模型</strong> - 多部件的静态模型</li>
          <li>🎮 <strong>游戏关卡</strong> - 静态场景元素</li>
          <li>🏗️ <strong>BIM/建筑</strong> - 大量静态构件</li>
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
