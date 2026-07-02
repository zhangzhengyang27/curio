<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 容器引用
  const containerRef = shallowRef<HTMLDivElement | null>(null)

  // 使用公共的 Three.js 场景逻辑
  const {
    scene,
    renderer,
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 20, y: 15, z: 20 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 5,
      maxDistance: 100
    },
    showAxesHelper: true
  })

  // GUI 和对象引用
  let gui: GUI | null = null
  let instancedMesh: THREE.InstancedMesh | null = null // InstancedMesh 对象
  let normalMeshes: THREE.Mesh[] = [] // 普通 Mesh 数组（用于对比）
  const dummy = new THREE.Object3D() // 矩阵辅助对象
  let normalMode = false // 是否切换到普通 Mesh 模式

  // 配置参数
  const params = {
    count: 10000, // instance 数量
    animate: true, // 是否播放动画
    showNormal: false // 是否显示普通 Mesh 对比
  }

  // GUI 信息对象
  const infoObj = {
    drawCalls: 0,
    triangles: 0,
  }

  /**
   * 创建 InstancedMesh 实例化网格
   * @param count - instance 数量
   */
  const createInstancedMesh = (count: number) => {
    // 清理旧的 InstancedMesh
    if (instancedMesh) {
      scene.value?.remove(instancedMesh)
      instancedMesh.geometry.dispose()
      const materials = Array.isArray(instancedMesh.material)
        ? instancedMesh.material
        : [instancedMesh.material]
      materials.forEach((m) => m.dispose())
      instancedMesh = null
    }

    // 创建共享的几何体和材质
    const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3)
    const material = new THREE.MeshPhongMaterial({})

    // 创建 InstancedMesh —— 只需一次 Draw Call
    instancedMesh = new THREE.InstancedMesh(geometry, material, count)

    // 临时颜色对象
    const color = new THREE.Color()

    // 遍历每个 instance，设置随机位置和颜色
    for (let i = 0; i < count; i++) {
      // 在一个大范围内随机分布
      dummy.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40
      )
      // 随机缩放
      const scale = Math.random() * 0.5 + 0.5
      dummy.scale.set(scale, scale, scale)
      // 更新矩阵并设置到 instance
      dummy.updateMatrix()
      instancedMesh.setMatrixAt(i, dummy.matrix)

      // 设置随机颜色
      color.setHSL(Math.random(), 0.8, 0.6)
      instancedMesh.setColorAt(i, color)
    }

    // 标记 instanceColor 需要更新
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true
    }
    // 标记矩阵需要更新
    instancedMesh.instanceMatrix.needsUpdate = true

    // 添加到场景
    scene.value?.add(instancedMesh)
  }

  /**
   * 创建普通 Mesh 数组（用于性能对比）
   * @param count - Mesh 数量
   */
  const createNormalMeshes = (count: number) => {
    // 清理旧的普通 Mesh
    normalMeshes.forEach((mesh) => {
      scene.value?.remove(mesh)
      mesh.geometry.dispose()
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach((m) => m.dispose())
    })
    normalMeshes = []

    const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3)

    for (let i = 0; i < count; i++) {
      // 每个 Mesh 独立的材质 → 大量 Draw Call
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6)
      })
      const mesh = new THREE.Mesh(geometry, material)

      // 随机位置
      mesh.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40
      )

      scene.value?.add(mesh)
      normalMeshes.push(mesh)
    }
  }

  /**
   * 动画更新 —— 让每个 instance 缓慢波动
   * （由 startAnimation 驱动，无需自行 requestAnimationFrame）
   */
  const updateAnimation = () => {
    const time = performance.now() * 0.001

    // 如果是 InstancedMesh 模式，更新每个 instance 的位置
    if (instancedMesh && !normalMode) {
      for (let i = 0; i < instancedMesh.count; i++) {
        // 获取当前 instance 的矩阵
        instancedMesh.getMatrixAt(i, dummy.matrix)
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale)

        // 缓慢 Y 轴波动
        dummy.position.y += Math.sin(time + i * 0.01) * 0.002

        // 更新矩阵
        dummy.updateMatrix()
        instancedMesh.setMatrixAt(i, dummy.matrix)
      }
      instancedMesh.instanceMatrix.needsUpdate = true
    }

    // 读取性能信息
    if (renderer.value?.info) {
      infoObj.drawCalls = renderer.value.info.render.calls
      infoObj.triangles = renderer.value.info.render.triangles
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
      .add(params, "showNormal")
      .name("显示普通 Mesh (对比)")
      .onChange((value: boolean) => {
        normalMode = value
        if (value) {
          // 隐藏 InstancedMesh，显示普通 Mesh
          if (instancedMesh) instancedMesh.visible = false
          // 创建普通 Mesh（限制最大数量为 5000，防止浏览器卡死）
          const count = Math.min(params.count, 5000)
          if (normalMeshes.length === 0 || normalMeshes.length !== count) {
            createNormalMeshes(count)
          } else {
            normalMeshes.forEach((m) => (m.visible = true))
          }
        } else {
          // 恢复 InstancedMesh
          if (instancedMesh) instancedMesh.visible = true
          normalMeshes.forEach((m) => (m.visible = false))
        }
      })

    // Instance 数量控制
    const countFolder = gui.addFolder("Instance 数量")
    countFolder
      .add(params, "count", [1000, 5000, 10000, 50000])
      .name("数量")
      .onChange((value: number) => {
        if (!normalMode) {
          createInstancedMesh(value)
        }
      })
    countFolder.open()

    // 动画控制
    gui.add(params, "animate").name("播放动画")

    // 性能信息面板
    const infoFolder = gui.addFolder("📊 渲染信息")
    infoFolder.add(infoObj, "drawCalls").name("Draw Calls").listen().disable()
    infoFolder.add(infoObj, "triangles").name("三角面数").listen().disable()
    infoFolder.open()

    // 说明
    const tipFolder = gui.addFolder("💡 说明")
    const tips = {
      instanced: "InstancedMesh: 1 次 Draw Call",
      normal: "普通 Mesh: N 次 Draw Call"
    }
    tipFolder.add(tips, "instanced").name("实例化渲染").disable()
    tipFolder.add(tips, "normal").name("普通渲染").disable()
  }

  /**
   * 初始化光照
   */
  const initLights = () => {
    if (!scene.value) return

    // 环境光 —— 提供基础照明
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5)
    scene.value.add(ambientLight)

    // 平行光 —— 提供方向性照明
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(10, 20, 10)
    scene.value.add(directionalLight)

    // 点光源 —— 增加场景层次
    const pointLight = new THREE.PointLight(0xff6633, 1, 50)
    pointLight.position.set(-10, 10, -10)
    scene.value.add(pointLight)
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理 InstancedMesh
    if (instancedMesh) {
      instancedMesh.geometry.dispose()
      const materials = Array.isArray(instancedMesh.material)
        ? instancedMesh.material
        : [instancedMesh.material]
      materials.forEach((m) => m.dispose())
      scene.value?.remove(instancedMesh)
      instancedMesh = null
    }

    // 清理普通 Mesh
    normalMeshes.forEach((mesh) => {
      mesh.geometry.dispose()
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach((m) => m.dispose())
      scene.value?.remove(mesh)
    })
    normalMeshes = []

    // 清理 GUI
    gui?.destroy()
    gui = null

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    // 初始化光照
    initLights()
    // 创建 InstancedMesh
    createInstancedMesh(params.count)
    // 初始化 GUI
    initGUI()
    // 启动动画循环
    startAnimation(updateAnimation)
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout title="⚡ InstancedMesh 实例化渲染" description="学习如何使用 InstancedMesh 大幅减少 Draw Call，实现高效的大规模物体渲染">
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>⚡ <strong>实例化渲染</strong> - 使用 InstancedMesh 将数万个物体合并为 1 次 Draw Call</li>
          <li>📊 <strong>性能对比</strong> - 切换普通 Mesh 模式，直观感受 Draw Call 的差异</li>
          <li>🎨 <strong>独立颜色</strong> - 每个 instance 可以有独立的颜色</li>
          <li>📐 <strong>独立变换</strong> - 每个 instance 可以有独立的位置、旋转和缩放</li>
          <li>🎯 <strong>实时监控</strong> - 通过 GUI 面板实时查看 Draw Call 和三角面数</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📖 什么是 InstancedMesh？</h3>
        <ul>
          <li><strong>定义</strong>：一种高效渲染大量相同几何体和材质的 3D 对象的技术</li>
          <li><strong>核心原理</strong>：将多个实例的变换矩阵和颜色数据打包，通过一次 Draw Call 渲染所有实例</li>
          <li><strong>性能提升</strong>：从 N 个 Draw Call 降低到 1 个 Draw Call</li>
          <li><strong>适用场景</strong>：树木、草地、粒子、建筑群等大量重复物体</li>
          <li>⚠️ <strong>限制</strong>：所有 instance 必须使用相同的几何体和材质</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚙️ 工作原理：</h3>
        <ul>
          <li>1️⃣ <strong>创建共享几何体和材质</strong> - 所有 instance 共享</li>
          <li>2️⃣ <strong>创建 InstancedMesh</strong> - 指定几何体、材质和实例数量</li>
          <li>3️⃣ <strong>设置每个实例的矩阵</strong> - 通过 <code>setMatrixAt()</code> 设置位置/旋转/缩放</li>
          <li>4️⃣ <strong>设置每个实例的颜色</strong> - 通过 <code>setColorAt()</code> 设置独立颜色</li>
          <li>5️⃣ <strong>标记更新</strong> - 设置 <code>instanceMatrix.needsUpdate = true</code></li>
          <li>6️⃣ <strong>一次 Draw Call</strong> - GPU 批量渲染所有实例</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>🔧 核心代码：</p>
        <p><code>// 创建 InstancedMesh</code></p>
        <p><code>const mesh = new THREE.InstancedMesh(geometry, material, count)</code></p>
        <br />
        <p><code>// 设置位置（使用 Object3D 辅助）</code></p>
        <p><code>dummy.position.set(x, y, z)</code></p>
        <p><code>dummy.updateMatrix()</code></p>
        <p><code>mesh.setMatrixAt(index, dummy.matrix)</code></p>
        <br />
        <p><code>// 设置颜色</code></p>
        <p><code>mesh.setColorAt(index, color)</code></p>
        <p><code>mesh.instanceColor.needsUpdate = true</code></p>
      </div>

      <div class="info-section">
        <h3>📊 性能对比：</h3>
        <ul>
          <li><strong>普通 Mesh (10000个)</strong>：约 10000 次 Draw Call ⚠️ 极慢</li>
          <li><strong>InstancedMesh (10000个)</strong>：仅 1 次 Draw Call ✅ 极快</li>
          <li>💡 打开 GUI 的"显示普通 Mesh"可以直观对比（限制 5000 个防止卡顿）</li>
          <li>💡 注意观察 Draw Calls 数值的变化</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 应用场景：</h3>
        <ul>
          <li>🌲 <strong>森林场景</strong> - 大量树木和植被</li>
          <li>🌿 <strong>草地/粒子</strong> - 数以万计的草叶或粒子</li>
          <li>🏙️ <strong>城市场景</strong> - 大量相似建筑</li>
          <li>🏢 <strong>室内场景</strong> - 大量相同家具</li>
          <li>🚗 <strong>交通场景</strong> - 大量车辆</li>
          <li>🎮 <strong>游戏开发</strong> - 任何需要批量渲染的场景</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 使用技巧：</h3>
        <ul>
          <li>🔧 通过 GUI 切换不同数量（1000/5000/10000/50000）</li>
          <li>📊 关注 Draw Calls 和三角面数的变化</li>
          <li>⚠️ 更新 instance 数据后必须设置 <code>needsUpdate = true</code></li>
          <li>💡 <code>getMatrixAt()</code> 可以读取已有的矩阵</li>
          <li>💡 配合 <code>setColorAt()</code> 实现实例间颜色差异</li>
        </ul>
      </div>
    </template>

    <!-- Three.js 容器 -->
    <div ref="containerRef"></div>
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
