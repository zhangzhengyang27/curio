<script setup lang="ts">
  /**
   * SSAOPass 屏幕空间环境光遮蔽教程
   * SSAO (Screen Space Ambient Occlusion) 通过分析深度缓冲来模拟环境光遮蔽效果
   * 能让物体之间的缝隙、角落等区域产生自然的阴影，增强场景真实感
   */
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
  import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
  import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js"
  import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js"

  // 容器引用
  const containerRef = shallowRef(null)

  // 后处理相关
  let composer: EffectComposer | null = null
  let ssaoPass: SSAOPass | null = null
  let gui: GUI | null = null
  const clock = new THREE.Clock()

  // 场景物体引用
  const meshes: THREE.Mesh[] = []

  // GUI 参数
  const params = {
    output: 2, // 输出模式：0=SSAO_ONLY, 1=SSAOBlur_ONLY, 2=Beauty, 3=Depth, 4=Normal
    aoRadius: 16, // 环境光遮蔽半径
    aoIntensity: 0.01, // 环境光遮蔽强度
    aoKernels: 32, // 采样核数量
    minDistance: 0.0005, // 最小距离
    maxDistance: 0.02, // 最大距离
    autoRotate: true // 是否自动旋转
  }

  // 输出模式名称映射
  const outputModes: Record<number, string> = {
    0: "SSAO Only（仅遮蔽）",
    1: "SSAO Blur（模糊遮蔽）",
    2: "Beauty（最终效果）",
    3: "Depth（深度图）",
    4: "Normal（法线图）"
  }

  // 使用封装的场景
  const {
    scene,
    camera,
    renderer,
    controls: _controls,
    startAnimation,
    handleResize: _handleResize,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    fov: 45,
    cameraPosition: { x: 4, y: 3, z: 6 },
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

  /**
   * 创建场景中的几何体
   * SSAO 效果在物体接触面和角落处最为明显
   */
  const createObjects = () => {
    if (!scene.value) return

    // 地面平面 - 大面积有助于展示 SSAO 在物体底部的遮蔽
    const groundGeo = new THREE.PlaneGeometry(12, 12)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      roughness: 0.8,
      metalness: 0.1
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.01
    ground.name = "ground"
    scene.value.add(ground)
    meshes.push(ground)

    // 球体 - 表面圆润，遮蔽效果柔和
    const sphereGeo = new THREE.SphereGeometry(0.8, 32, 32)
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xff6644,
      roughness: 0.5,
      metalness: 0.2
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    sphere.position.set(-1.5, 0.8, 0)
    scene.value.add(sphere)
    meshes.push(sphere)

    // 立方体 - 锐利边缘处 SSAO 效果最明显
    const cubeGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2)
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0x4488ff,
      roughness: 0.4,
      metalness: 0.3
    })
    const cube = new THREE.Mesh(cubeGeo, cubeMat)
    cube.position.set(0, 0.6, 0)
    scene.value.add(cube)
    meshes.push(cube)

    // 圆柱体
    const cylinderGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 32)
    const cylinderMat = new THREE.MeshStandardMaterial({
      color: 0x44cc88,
      roughness: 0.45,
      metalness: 0.25
    })
    const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat)
    cylinder.position.set(1.5, 0.75, 0)
    scene.value.add(cylinder)
    meshes.push(cylinder)

    // 圆环结 - 复杂几何体，展示细节处的遮蔽
    const torusKnotGeo = new THREE.TorusKnotGeometry(0.5, 0.15, 100, 16)
    const torusKnotMat = new THREE.MeshStandardMaterial({
      color: 0xffaa33,
      roughness: 0.35,
      metalness: 0.4
    })
    const torusKnot = new THREE.Mesh(torusKnotGeo, torusKnotMat)
    torusKnot.position.set(0, 1.2, -1.5)
    scene.value.add(torusKnot)
    meshes.push(torusKnot)

    // 一排小球 - 展示物体间距对 SSAO 的影响
    for (let i = 0; i < 5; i++) {
      const smallSphereGeo = new THREE.SphereGeometry(0.2, 24, 24)
      const smallSphereMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(i / 5, 0.7, 0.5),
        roughness: 0.4,
        metalness: 0.3
      })
      const smallSphere = new THREE.Mesh(smallSphereGeo, smallSphereMat)
      smallSphere.position.set(-2 + i * 1, 0.2, 1.5)
      scene.value.add(smallSphere)
      meshes.push(smallSphere)
    }
  }

  /**
   * 创建灯光
   * SSAO 主要影响环境光遮蔽，因此光照设置尽量简单
   */
  const createLights = () => {
    if (!scene.value) return

    // 环境光（SSAO 主要补充的就是环境光遮蔽）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.value.add(ambientLight)

    // 主方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 8, 5)
    scene.value.add(directionalLight)

    // 补光
    const fillLight = new THREE.DirectionalLight(0x8888cc, 0.3)
    fillLight.position.set(-3, 4, -3)
    scene.value.add(fillLight)
  }

  /**
   * 初始化后处理管线 - SSAO 效果
   */
  const initPostProcessing = () => {
    if (!renderer.value || !scene.value || !camera.value) return

    // 创建 EffectComposer
    composer = new EffectComposer(renderer.value)

    // RenderPass - 基础渲染通道
    const renderPass = new RenderPass(scene.value, camera.value)
    composer.addPass(renderPass)

    // SSAOPass - 屏幕空间环境光遮蔽
    ssaoPass = new SSAOPass(
      scene.value,
      camera.value,
      window.innerWidth,
      window.innerHeight
    )
    // 设置 SSAO 参数
    ssaoPass.kernelRadius = params.aoRadius
    ssaoPass.minDistance = params.minDistance
    ssaoPass.maxDistance = params.maxDistance
    ssaoPass.output = params.output
    composer.addPass(ssaoPass)

    // OutputPass - 色彩空间校正
    const outputPass = new OutputPass()
    composer.addPass(outputPass)
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()
    gui.title("SSAO 环境光遮蔽控制")

    // 输出模式控制
    const outputFolder = gui.addFolder("📺 输出模式")
    outputFolder
      .add(params, "output", {
        "SSAO Only": 0,
        "SSAO Blur": 1,
        "Beauty": 2,
        "Depth": 3,
        "Normal": 4
      })
      .name("输出模式")
      .onChange((value: number) => {
        if (ssaoPass) {
          ssaoPass.output = value
          console.log("输出模式:", outputModes[value])
        }
      })
    outputFolder.open()

    // SSAO 参数控制
    const ssaoFolder = gui.addFolder("🔧 SSAO 参数")
    ssaoFolder
      .add(params, "aoRadius", 0, 32, 0.5)
      .name("遮蔽半径 (kernelRadius)")
      .onChange((value) => {
        if (ssaoPass) ssaoPass.kernelRadius = value
      })

    ssaoFolder
      .add(params, "minDistance", 0.0001, 0.01, 0.0001)
      .name("最小距离 (minDistance)")
      .onChange((value) => {
        if (ssaoPass) ssaoPass.minDistance = value
      })

    ssaoFolder
      .add(params, "maxDistance", 0.005, 0.05, 0.001)
      .name("最大距离 (maxDistance)")
      .onChange((value) => {
        if (ssaoPass) ssaoPass.maxDistance = value
      })
    ssaoFolder.open()

    // 动画控制
    const animFolder = gui.addFolder("🎬 动画控制")
    animFolder
      .add(params, "autoRotate")
      .name("自动旋转")
    animFolder.open()

    // 说明信息
    const infoFolder = gui.addFolder("📖 SSAO 原理")
    const info = {
      description: "通过分析深度缓冲模拟环境光遮蔽",
      effect: "让物体缝隙、角落产生自然阴影",
      tip1: "物体底部与地面接触处遮蔽最明显",
      tip2: "锐利边缘比光滑表面遮蔽更强烈",
      tip3: "减小 minDistance/maxDistance 差值增强遮蔽"
    }
    infoFolder.add(info, "description").name("原理说明").disable()
    infoFolder.add(info, "effect").name("视觉效果").disable()
    infoFolder.add(info, "tip1").name("💡 提示1").disable()
    infoFolder.add(info, "tip2").name("💡 提示2").disable()
    infoFolder.add(info, "tip3").name("💡 提示3").disable()
    infoFolder.open()
  }

  /**
   * 初始化场景内容
   */
  const initSceneContent = () => {
    if (!scene.value || !renderer.value) return

    // 设置浅色背景（更好地展示 SSAO 遮蔽效果）
    scene.value.background = new THREE.Color(0x8888aa)

    // 创建灯光
    createLights()

    // 创建物体
    createObjects()

    // 初始化后处理管线
    initPostProcessing()

    // 初始化 GUI
    initGUI()

    // 启动动画循环
    startAnimation(() => {
      const elapsed = clock.getElapsedTime()

      // 自动旋转相机环绕场景
      if (params.autoRotate && camera.value) {
        const radius = 7
        camera.value.position.x = Math.sin(elapsed * 0.3) * radius
        camera.value.position.z = Math.cos(elapsed * 0.3) * radius
        camera.value.lookAt(0, 0.5, 0)
      }

      // 缓慢旋转圆环结
      const torusKnot = meshes.find((m) => m.geometry?.type === "TorusKnotGeometry")
      if (torusKnot) {
        torusKnot.rotation.y = elapsed * 0.3
        torusKnot.rotation.x = elapsed * 0.2
      }

      // 使用 composer 渲染（替代 renderer.render）
      if (composer) {
        composer.render()
      }
    })
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理后处理管线
    if (composer) {
      composer.dispose()
      composer = null
      ssaoPass = null
    }

    // 清理所有场景物体
    meshes.forEach((mesh) => {
      if (mesh.geometry) mesh.geometry.dispose()
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose())
        } else {
          mesh.material.dispose()
        }
      }
    })
    meshes.length = 0

    // 清理 GUI
    gui?.destroy()
    gui = null

    // 调用基础清理函数
    baseDispose()
  }

  // 组件挂载后初始化
  onMounted(() => {
    initSceneContent()
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🌑 SSAO 环境光遮蔽"
    description="通过屏幕空间技术模拟真实的环境光遮蔽效果，增强场景深度感"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>SSAO 核心参数：</h3>
        <ul>
          <li>📡 <strong>kernelRadius</strong> - 遮蔽采样半径</li>
          <li>📏 <strong>minDistance / maxDistance</strong> - 遮蔽深度范围</li>
          <li>📺 <strong>output</strong> - 输出模式切换</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>什么是 SSAO？</h3>
        <ul>
          <li>🌙 Ambient Occlusion（环境光遮蔽）模拟光线在角落和缝隙中难以到达的现象</li>
          <li>🖥️ Screen Space 表示完全在屏幕空间计算，不需要额外的光照贴图</li>
          <li>✨ 能让物体交接处、角落、表面细节产生自然的柔和阴影</li>
          <li>🎯 广泛用于游戏和实时渲染中增强画面真实感</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 调试技巧</p>
        <p>切换到 "SSAO Only" 模式可以单独查看遮蔽贴图效果，帮助理解 SSAO 的工作原理。切换到 "Depth" 可以查看深度图。</p>
      </div>

      <div class="controls-tip">
        <p>🎮 交互方式：</p>
        <ul>
          <li>🖱️ 鼠标左键拖动 - 旋转视角</li>
          <li>🖱️ 鼠标滚轮 - 缩放</li>
          <li>🖱️ 鼠标右键拖动 - 平移</li>
        </ul>
      </div>
    </template>

    <!-- Three.js 容器 -->
    <div
      ref="containerRef"
      class="three-container"
    />
  </PageLayout>
</template>

<style scoped>
  .three-container {
    width: 100%;
    height: 100vh;
    position: relative;
    overflow: hidden;
  }
</style>
