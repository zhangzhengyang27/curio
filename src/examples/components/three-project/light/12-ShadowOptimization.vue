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
    renderer,
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 5, y: 5, z: 5 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 2,
      maxDistance: 15
    },
    showAxesHelper: false,
    showGridHelper: false
  })

  // GUI 和对象引用
  let gui: GUI | null = null
  let dirLight: THREE.DirectionalLight | null = null
  let lightHelper: THREE.DirectionalLightHelper | null = null
  // FPS 计算
  let frameCount: number = 0
  let lastFPSTime: number = performance.now()
  let currentFPS: number = 60

  /**
   * 创建场景
   */
  const createScene = () => {
    if (!scene.value || !renderer.value) return

    // 设置场景背景
    scene.value.background = new THREE.Color(0x1a1a2e)

    // 启用阴影
    renderer.value.shadowMap.enabled = true
    // 默认使用 PCFSoft 阴影
    renderer.value.shadowMap.type = THREE.PCFSoftShadowMap

    // 创建地面
    const floorGeo = new THREE.PlaneGeometry(15, 15)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.8,
      metalness: 0.1
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    floor.receiveShadow = true
    scene.value.add(floor)

    // 创建多个物体用于产生阴影
    // 球体
    const sphereGeo = new THREE.SphereGeometry(0.6, 32, 32)
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.5 })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    sphere.position.set(-2, 0.6, 0)
    sphere.castShadow = true
    sphere.receiveShadow = true
    scene.value.add(sphere)

    // 立方体
    const boxGeo = new THREE.BoxGeometry(1, 1, 1)
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.5 })
    const box = new THREE.Mesh(boxGeo, boxMat)
    box.position.set(0, 0.5, 1)
    box.castShadow = true
    box.receiveShadow = true
    scene.value.add(box)

    // 圆环结
    const torusGeo = new THREE.TorusKnotGeometry(0.5, 0.15, 64, 16)
    const torusMat = new THREE.MeshStandardMaterial({ color: 0x44ff44, roughness: 0.4, metalness: 0.3 })
    const torus = new THREE.Mesh(torusGeo, torusMat)
    torus.position.set(2, 1, -1)
    torus.castShadow = true
    torus.receiveShadow = true
    scene.value.add(torus)

    // 圆柱体
    const cylGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 32)
    const cylMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.5 })
    const cyl = new THREE.Mesh(cylGeo, cylMat)
    cyl.position.set(1, 0.75, 2)
    cyl.castShadow = true
    cyl.receiveShadow = true
    scene.value.add(cyl)

    // 锥体
    const coneGeo = new THREE.ConeGeometry(0.5, 1.2, 32)
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xaa44ff, roughness: 0.5 })
    const cone = new THREE.Mesh(coneGeo, coneMat)
    cone.position.set(-1, 0.6, -2)
    cone.castShadow = true
    cone.receiveShadow = true
    scene.value.add(cone)

    // 创建 DirectionalLight
    dirLight = new THREE.DirectionalLight(0xffffff, 3)
    dirLight.position.set(5, 8, 5)
    dirLight.castShadow = true

    // 设置阴影相机范围
    dirLight.shadow.camera.near = 0.1
    dirLight.shadow.camera.far = 30
    dirLight.shadow.camera.left = -8
    dirLight.shadow.camera.right = 8
    dirLight.shadow.camera.top = 8
    dirLight.shadow.camera.bottom = -8

    // 初始阴影贴图大小
    dirLight.shadow.mapSize.set(1024, 1024)
    dirLight.shadow.bias = -0.001
    dirLight.shadow.normalBias = 0.02

    scene.value.add(dirLight)

    // DirectionalLightHelper
    lightHelper = new THREE.DirectionalLightHelper(dirLight, 1)
    scene.value.add(lightHelper)

    // 环境光
    const ambLight = new THREE.AmbientLight(0x333344, 0.8)
    scene.value.add(ambLight)
  }

  /**
   * 动画回调（计算 FPS）
   */
  const animateCallback = () => {
    frameCount++
    const now = performance.now()
    if (now - lastFPSTime >= 1000) {
      currentFPS = frameCount
      frameCount = 0
      lastFPSTime = now

      // 更新 GUI 中的 FPS 显示
      if (gui) {
        gui.controllersRecursive().forEach((c) => {
          if (c.property === "fps") {
            c.updateDisplay()
          }
        })
      }
    }
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    const params = {
      mapSize: 1024,
      bias: -0.001,
      normalBias: 0.02,
      shadowType: "PCFSoft",
      fps: 60
    }

    // 阴影分辨率
    const resFolder = gui.addFolder("📐 阴影分辨率")
    resFolder
      .add(params, "mapSize", [256, 512, 1024, 2048, 4096])
      .name("贴图大小 (mapSize)")
      .onChange((v) => {
        if (dirLight) {
          const size = typeof v === "string" ? parseInt(v) : v
          dirLight.shadow.mapSize.set(size, size)
          // 需要清除旧的阴影贴图
          if (dirLight.shadow.map) {
            dirLight.shadow.map.dispose()
            dirLight.shadow.map = null
          }
        }
      })
    resFolder.open()

    // Shadow Bias
    const biasFolder = gui.addFolder("⚖️ Shadow Bias")
    biasFolder
      .add(params, "bias", -0.01, 0.01, 0.0001)
      .name("bias (阴影偏移)")
      .onChange((v) => {
        if (dirLight) dirLight.shadow.bias = v
      })

    biasFolder
      .add(params, "normalBias", 0, 0.1, 0.001)
      .name("normalBias (法线偏移)")
      .onChange((v) => {
        if (dirLight) dirLight.shadow.normalBias = v
      })
    biasFolder.open()

    // 阴影类型
    const typeFolder = gui.addFolder("🔲 阴影类型")
    typeFolder
      .add(params, "shadowType", ["Basic", "PCF", "PCFSoft", "VSM"])
      .name("阴影类型")
      .onChange((v) => {
        if (!renderer.value) return
        switch (v) {
          case "Basic":
            renderer.value.shadowMap.type = THREE.BasicShadowMap
            break
          case "PCF":
            renderer.value.shadowMap.type = THREE.PCFShadowMap
            break
          case "PCFSoft":
            renderer.value.shadowMap.type = THREE.PCFSoftShadowMap
            break
          case "VSM":
            renderer.value.shadowMap.type = THREE.VSMShadowMap
            break
        }
        // 需要重新编译材质
        scene.value?.traverse((obj) => {
          if (obj.material) {
            const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
            materials.forEach((mat) => {
              mat.needsUpdate = true
            })
          }
        })
      })
    typeFolder.open()

    // 性能信息
    const perfFolder = gui.addFolder("⚡ 性能信息")
    perfFolder.add(params, "fps").name("当前 FPS").disable()
    perfFolder.open()

    // 问题说明
    const issueFolder = gui.addFolder("⚠️ 常见阴影问题")
    issueFolder
      .add(
        { info: "Shadow Acne: bias 值不够大，表面出现条纹" },
        "info"
      )
      .name("阴影痤疮")
      .disable()
    issueFolder
      .add(
        { info: "Peter Panning: bias 值太大，阴影与物体分离" },
        "info"
      )
      .name("彼得潘效应")
      .disable()
    issueFolder
      .add(
        { info: "解决: 调节 bias 和 normalBias 找到平衡点" },
        "info"
      )
      .name("解决方案")
      .disable()
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    lightHelper?.dispose()
    lightHelper = null

    gui?.destroy()
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    createScene()
    initGUI()
    startAnimation(animateCallback)
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🌑 阴影优化技巧"
    description="探索阴影贴图分辨率、Bias 偏移和阴影类型对渲染效果和性能的影响"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>📐 <strong>分辨率对比</strong> - 512/1024/2048/4096 阴影贴图质量对比</li>
          <li>⚖️ <strong>Shadow Bias</strong> - 调节阴影偏移，解决阴影痤疮问题</li>
          <li>📐 <strong>Normal Bias</strong> - 法线偏移，解决彼得潘效应</li>
          <li>🔲 <strong>阴影类型</strong> - Basic/PCF/PCFSoft/VSM 对比</li>
          <li>⚡ <strong>FPS 显示</strong> - 实时显示帧率对比性能</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 阴影类型说明：</h3>
        <ul>
          <li><strong>BasicShadowMap</strong> - 无过滤，锯齿明显，性能最好</li>
          <li><strong>PCFShadowMap</strong> - Percentage Closer Filtering，边缘柔和</li>
          <li><strong>PCFSoftShadowMap</strong> - 更柔和的 PCF，推荐默认使用</li>
          <li><strong>VSMShadowMap</strong> - Variance Shadow Map，支持模糊，可能有光晕</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚠️ 常见阴影问题：</h3>
        <ul>
          <li><strong>Shadow Acne（阴影痤疮）</strong> - bias 值太小导致表面出现条纹状伪影</li>
          <li><strong>Peter Panning（彼得潘效应）</strong> - bias 值太大导致阴影脱离物体</li>
          <li><strong>解决方法</strong> - 逐步调节 bias（约 -0.001）和 normalBias（约 0.02）</li>
          <li><strong>分辨率</strong> - 越高越清晰，但占用更多显存和计算资源</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 优化建议：</h3>
        <ul>
          <li>🔸 移动端使用 512~1024 分辨率</li>
          <li>🔸 PC 端使用 1024~2048 分辨率</li>
          <li>🔸 限制阴影相机范围（left/right/top/bottom）避免浪费</li>
          <li>🔸 合理设置 shadow.camera.near/far 减少精度浪费</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>renderer.shadowMap.enabled = true</code></p>
        <p><code>renderer.shadowMap.type = THREE.PCFSoftShadowMap</code></p>
        <br>
        <p><code>light.shadow.mapSize.set(1024, 1024)</code></p>
        <p><code>light.shadow.bias = -0.001</code></p>
        <p><code>light.shadow.normalBias = 0.02</code></p>
      </div>

      <div class="controls-tip">
        <p>🎮 操作提示：</p>
        <ul style="margin-top: 8px">
          <li>• 切换不同分辨率观察阴影清晰度变化</li>
          <li>• 将 bias 设为 0 观察阴影痤疮</li>
          <li>• 将 bias 设为 -0.01 观察彼得潘效应</li>
          <li>• 切换阴影类型对比柔和程度</li>
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
  .features,
  .info-section,
  .code-tip,
  .controls-tip {
    margin-bottom: 16px;
  }
  .features h3,
  .info-section h3,
  .code-tip p:first-child,
  .controls-tip p:first-child {
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
