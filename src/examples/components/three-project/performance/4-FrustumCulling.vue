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
    camera,
    renderer,
    startAnimation: _startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 0, y: 10, z: 40 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 5,
      maxDistance: 200
    },
    showAxesHelper: true
  })

  // GUI 和对象引用
  let gui: GUI | null = null
  let cameraHelper: THREE.CameraHelper | null = null // 相机辅助器（可视化视锥体）
  let animationId = 0
  let meshes: THREE.Mesh[] = [] // 所有场景中的 Mesh

  // FPS 计算
  let frameCount = 0
  let lastFpsTime = performance.now()

  // 配置参数
  const params = {
    showFrustum: false, // 是否显示视锥体
    frustumCulled: true, // 是否启用视锥体剔除（Three.js 默认开启）
    animate: true // 是否播放动画
  }

  // GUI 信息对象
  const infoObj = {
    fps: 0,
    drawCalls: 0,
    renderedObjects: 0,
    totalObjects: 0
  }

  /**
   * 创建大量物体分布在大场景中
   * @param {number} count - 物体数量
   */
  const createScene = (count: number) => {
    // 清理旧的物体
    meshes.forEach((mesh) => {
      scene.value?.remove(mesh)
      mesh.geometry.dispose()
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach((m) => m.dispose())
    })
    meshes = []

    // 创建共享几何体
    const geometries = [
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.SphereGeometry(1.5, 16, 16),
      new THREE.ConeGeometry(1, 3, 8)
    ]

    for (let i = 0; i < count; i++) {
      // 随机选择几何体
      const geometry = geometries[Math.floor(Math.random() * geometries.length)]

      // 随机颜色
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
        flatShading: true
      })

      const mesh = new THREE.Mesh(geometry, material)

      // 在大范围内随机分布（确保有些在视野外）
      mesh.position.set(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 200
      )

      // 随机旋转
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )

      // 随机缩放
      const scale = Math.random() * 2 + 0.5
      mesh.scale.set(scale, scale, scale)

      scene.value?.add(mesh)
      meshes.push(mesh)
    }

    infoObj.totalObjects = count
  }

  /**
   * 切换所有物体的 frustumCulled 属性
   * @param {boolean} value - 是否启用剔除
   */
  const setFrustumCulled = (value: boolean) => {
    meshes.forEach((mesh) => {
      mesh.frustumCulled = value
    })
  }

  /**
   * 动画循环
   */
  const animate = () => {
    animationId = requestAnimationFrame(animate)

    const time = performance.now() * 0.001

    // 物体动画（轻微旋转）
    if (params.animate) {
      meshes.forEach((mesh, i) => {
        mesh.rotation.y = time * 0.1 * (i % 2 === 0 ? 1 : -1)
        mesh.rotation.x = time * 0.05 * (i % 3 === 0 ? 1 : -1)
      })
    }

    // 更新相机辅助器
    if (cameraHelper && camera.value) {
      cameraHelper.update()
    }

    // 渲染场景
    if (renderer.value && scene.value && camera.value) {
      renderer.value.render(scene.value, camera.value)

      // 更新 GUI 信息
      if (renderer.value.info) {
        infoObj.drawCalls = renderer.value.info.render.calls
        // 渲染物体数 ≈ 总物体数 - 被剔除的物体数
        infoObj.renderedObjects = renderer.value.info.render.calls
      }
    }

    // 计算 FPS
    frameCount++
    const now = performance.now()
    if (now - lastFpsTime >= 1000) {
      infoObj.fps = Math.round((frameCount * 1000) / (now - lastFpsTime))
      frameCount = 0
      lastFpsTime = now
    }
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    // 视锥体剔除控制
    const cullFolder = gui.addFolder("视锥体剔除")
    cullFolder
      .add(params, "frustumCulled")
      .name("启用剔除")
      .onChange((value) => {
        setFrustumCulled(value)
      })
    cullFolder.open()

    // 视锥体可视化
    const visFolder = gui.addFolder("可视化")
    visFolder
      .add(params, "showFrustum")
      .name("显示视锥体")
      .onChange((value) => {
        if (cameraHelper) {
          cameraHelper.visible = value
        }
      })

    // 动画控制
    gui.add(params, "animate").name("播放动画")

    // 性能信息面板
    const infoFolder = gui.addFolder("📊 渲染信息")
    infoFolder.add(infoObj, "fps").name("FPS").listen().disable()
    infoFolder.add(infoObj, "totalObjects").name("总物体数").disable()
    infoFolder.add(infoObj, "drawCalls").name("Draw Calls").listen().disable()
    infoFolder.open()

    // 操作提示
    const tipFolder = gui.addFolder("💡 操作提示")
    const tips = {
      move: "移动相机到物体较少的方向",
      observe: "对比开启/关闭剔除的 FPS",
      watch: "观察 Draw Calls 随视角变化"
    }
    tipFolder.add(tips, "move").name("移动相机").disable()
    tipFolder.add(tips, "observe").name("FPS 对比").disable()
    tipFolder.add(tips, "watch").name("Draw Call 变化").disable()
  }

  /**
   * 初始化光照
   */
  const initLights = () => {
    if (!scene.value) return

    // 环境光 —— 提供基础照明
    const ambientLight = new THREE.AmbientLight(0x404040, 2)
    scene.value.add(ambientLight)

    // 平行光 —— 主光源
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(50, 100, 50)
    scene.value.add(directionalLight)

    // 补光
    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.5)
    fillLight.position.set(-50, 20, -50)
    scene.value.add(fillLight)

    // 半球光 —— 增加环境氛围
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x362d1f, 0.5)
    scene.value.add(hemiLight)
  }

  /**
   * 初始化相机辅助器
   */
  const initCameraHelper = () => {
    if (!camera.value) return

    // 创建相机辅助器（可视化视锥体）
    cameraHelper = new THREE.CameraHelper(camera.value)
    cameraHelper.visible = params.showFrustum
    scene.value?.add(cameraHelper)
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 取消动画帧
    if (animationId) {
      cancelAnimationFrame(animationId)
    }

    // 清理所有 Mesh
    meshes.forEach((mesh) => {
      mesh.geometry.dispose()
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach((m) => m.dispose())
      scene.value?.remove(mesh)
    })
    meshes = []

    // 清理相机辅助器
    if (cameraHelper) {
      cameraHelper.dispose()
      scene.value?.remove(cameraHelper)
      cameraHelper = null
    }

    // 清理 GUI
    gui?.destroy()

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    // 初始化光照
    initLights()
    // 创建场景中的大量物体
    createScene(500)
    // 初始化相机辅助器
    initCameraHelper()
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
    title="👁️ 视锥体剔除 (Frustum Culling)"
    description="学习 Three.js 的视锥体剔除机制，了解如何通过自动跳过视野外的物体来提升渲染性能"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>👁️ <strong>视锥体剔除</strong> - Three.js 默认自动跳过视野外的物体渲染</li>
          <li>📊 <strong>性能对比</strong> - 切换开启/关闭剔除，直观感受 FPS 差异</li>
          <li>📐 <strong>视锥体可视化</strong> - 使用 CameraHelper 显示相机视锥体范围</li>
          <li>🎮 <strong>交互观察</strong> - OrbitControls 移动相机，观察 Draw Call 变化</li>
          <li>📈 <strong>实时监控</strong> - GUI 面板显示 FPS 和 Draw Calls</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📖 什么是视锥体剔除？</h3>
        <ul>
          <li><strong>定义</strong>：Frustum Culling —— 不渲染相机视野（视锥体）外的物体</li>
          <li><strong>原理</strong>：每帧检查每个物体的包围球/包围盒是否与相机视锥体相交</li>
          <li><strong>效果</strong>：当相机只能看到一小部分物体时，大幅减少 Draw Call</li>
          <li><strong>默认开启</strong>：Three.js 默认对每个 Mesh 启用 <code>frustumCulled = true</code></li>
          <li>💡 场景中有 500 个物体，但你只能看到其中一部分时效果最明显</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚙️ 视锥体结构：</h3>
        <ul>
          <li>📐 <strong>Near Plane</strong> - 近裁剪面</li>
          <li>📐 <strong>Far Plane</strong> - 远裁剪面</li>
          <li>📐 <strong>Left/Right/Top/Bottom Planes</strong> - 四个侧面</li>
          <li>👁️ <strong>FOV</strong> - 视场角，决定视锥体的张角</li>
          <li>📐 <strong>Aspect Ratio</strong> - 宽高比，影响侧面角度</li>
          <li>💡 只有在这 6 个面围成的截锥体内的物体才会被渲染</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>🔧 核心代码：</p>
        <p><code>// Three.js 默认开启视锥体剔除</code></p>
        <p><code>mesh.frustumCulled = true // 默认值</code></p>
        <br>
        <p><code>// 关闭剔除（所有物体都会被渲染）</code></p>
        <p><code>mesh.frustumCulled = false</code></p>
        <br>
        <p><code>// 手动更新包围球（几何体变更后）</code></p>
        <p><code>mesh.geometry.computeBoundingSphere()</code></p>
        <br>
        <p><code>// 可视化视锥体</code></p>
        <p><code>const helper = new THREE.CameraHelper(camera)</code></p>
        <p><code>scene.add(helper)</code></p>
      </div>

      <div class="info-section">
        <h3>📊 性能对比：</h3>
        <ul>
          <li><strong>开启剔除</strong>：只渲染视野内的物体，Draw Call 少，FPS 高 ✅</li>
          <li><strong>关闭剔除</strong>：所有 500 个物体都会渲染，Draw Call 多，FPS 低 ⚠️</li>
          <li>💡 将相机转向物体较少的方向，对比更明显</li>
          <li>💡 物体分布范围很大（200x100x200），确保有很多物体在视野外</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚠️ 注意事项：</h3>
        <ul>
          <li>🔸 <strong>自动计算</strong>：Three.js 使用物体的包围球进行剔除判断</li>
          <li>🔸 <strong>手动更新</strong>：如果修改了几何体的顶点，需要重新计算包围球</li>
          <li>🔸 <strong>特殊对象</strong>：粒子系统等特殊对象可能需要手动处理</li>
          <li>🔸 <strong>CameraHelper</strong>：可以可视化视锥体，帮助调试</li>
          <li>🔸 <strong>大场景</strong>：场景越大、物体越多，剔除效果越明显</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 应用场景：</h3>
        <ul>
          <li>🌍 <strong>开放世界</strong> - 大量物体分布，相机只能看到一部分</li>
          <li>🏙️ <strong>室内场景</strong> - 墙壁隔开了不同房间，需要剔除</li>
          <li>🌲 <strong>森林场景</strong> - 大量树木，只有附近的可见</li>
          <li>🗺️ <strong>大地图</strong> - 超出视野范围的地块不需要渲染</li>
          <li>🎮 <strong>所有 3D 应用</strong> - 视锥体剔除是基本的性能优化手段</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 操作建议：</h3>
        <ul>
          <li>🖱️ <strong>旋转相机</strong> - 观察不同方向的 FPS 变化</li>
          <li>🔍 <strong>拉近相机</strong> - 视野变小，剔除更多物体</li>
          <li>🔦 <strong>开启视锥体可视化</strong> - 直观看到哪些物体会被渲染</li>
          <li>📊 <strong>对比 FPS</strong> - 关闭剔除后 FPS 应该明显下降</li>
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
