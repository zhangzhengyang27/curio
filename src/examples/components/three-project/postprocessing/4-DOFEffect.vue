<script setup lang="ts">
  /**
   * BokehPass 景深效果教程
   * 模拟真实相机的景深效果：焦点处清晰，远离焦点的物体产生散焦模糊
   * 通过一排从前到后排列的彩色物体来展示景深效果
   */
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
  import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
  import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js"
  import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js"

  // 容器引用
  const containerRef = shallowRef(null)

  // 后处理相关
  let composer: EffectComposer | null = null
  let bokehPass: BokehPass | null = null
  let gui: GUI | null = null
  const clock = new THREE.Clock()

  // 场景物体引用
  const meshes: THREE.Mesh[] = []

  // GUI 参数
  const params = {
    focus: 10.0, // 焦距（焦平面的距离）
    aperture: 0.025, // 光圈大小（值越大模糊越强）
    maxblur: 0.01, // 最大模糊程度
    showFocusHelper: true // 是否显示焦点辅助线
  }

  // 焦点辅助线
  let focusLine: THREE.Line | null = null

  // 使用封装的场景
  const {
    scene,
    camera,
    renderer,
    controls,
    startAnimation,
    handleResize,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    fov: 45,
    cameraPosition: { x: 0, y: 1, z: 15 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 5,
      maxDistance: 25
    },
    showAxesHelper: false,
    showGridHelper: false
  })

  /**
   * 创建一排从前到后排列的物体
   * 用来展示景深效果：近处和远处的物体会模糊，焦点处清晰
   */
  const createObjects = () => {
    if (!scene.value) return

    // 物体颜色列表 - 彩虹渐变
    const colors = [
      0xff4444, // 红
      0xff8844, // 橙
      0xffcc44, // 黄
      0x88ff44, // 黄绿
      0x44ff44, // 绿
      0x44ffcc, // 青绿
      0x4488ff, // 蓝
      0x8844ff, // 紫
      0xff44cc, // 粉
      0xff4444 // 红（循环）
    ]

    // 从前到后排列一排球体
    const spacing = 2.5 // 球体间距
    const total = 11
    const startZ = -spacing * (total - 1) / 2

    for (let i = 0; i < total; i++) {
      const radius = 0.6
      const geometry = new THREE.SphereGeometry(radius, 32, 32)
      const material = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        roughness: 0.3,
        metalness: 0.5,
        emissive: colors[i % colors.length],
        emissiveIntensity: 0.1 // 微弱自发光，让颜色更鲜艳
      })
      const sphere = new THREE.Mesh(geometry, material)
      sphere.position.set(0, 0, startZ + i * spacing)
      sphere.name = `sphere_${i}`
      scene.value.add(sphere)
      meshes.push(sphere)
    }

    // 在两侧添加一些立方体，增加场景丰富度
    for (let i = 0; i < total; i += 2) {
      const size = 0.8
      const geometry = new THREE.BoxGeometry(size, size, size)
      const material = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        roughness: 0.4,
        metalness: 0.4
      })
      const cubeL = new THREE.Mesh(geometry, material)
      cubeL.position.set(-2, 0, startZ + i * spacing)
      cubeL.rotation.y = Math.PI / 4
      scene.value.add(cubeL)
      meshes.push(cubeL)

      const cubeR = new THREE.Mesh(geometry, material.clone())
      cubeR.position.set(2, 0, startZ + i * spacing)
      cubeR.rotation.y = Math.PI / 4
      scene.value.add(cubeR)
      meshes.push(cubeR)
    }

    // 地面
    const groundGeo = new THREE.PlaneGeometry(30, 30)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x333344,
      roughness: 0.85,
      metalness: 0.1
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.7
    scene.value.add(ground)
    meshes.push(ground)
  }

  /**
   * 创建焦点辅助线
   * 在焦点位置显示一条垂直线，帮助用户理解焦点位置
   */
  const createFocusHelper = () => {
    if (!scene.value) return

    const geometry = new THREE.BufferGeometry()
    const vertices = new Float32Array([0, -1.5, 0, 0, 2, 0])
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))
    const material = new THREE.LineBasicMaterial({
      color: 0x44ff44,
      linewidth: 2,
      transparent: true,
      opacity: 0.6
    })
    focusLine = new THREE.Line(geometry, material)
    scene.value.add(focusLine)
  }

  /**
   * 创建灯光
   */
  const createLights = () => {
    if (!scene.value) return

    // 环境光
    const ambientLight = new THREE.AmbientLight(0x444466, 0.6)
    scene.value.add(ambientLight)

    // 主方向光 - 从侧上方照射
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 8, 0)
    scene.value.add(directionalLight)

    // 补光 - 从另一侧
    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3)
    fillLight.position.set(-5, 3, 5)
    scene.value.add(fillLight)

    // 顶部点光源
    const pointLight = new THREE.PointLight(0xffaa44, 0.5, 20)
    pointLight.position.set(0, 5, 0)
    scene.value.add(pointLight)
  }

  /**
   * 初始化后处理管线 - 景深效果
   */
  const initPostProcessing = () => {
    if (!renderer.value || !scene.value || !camera.value) return

    // 创建 EffectComposer
    composer = new EffectComposer(renderer.value)

    // RenderPass - 基础渲染通道
    const renderPass = new RenderPass(scene.value, camera.value)
    composer.addPass(renderPass)

    // BokehPass - 景深效果
    bokehPass = new BokehPass(scene.value, camera.value, {
      focus: params.focus, // 焦距
      aperture: params.aperture, // 光圈
      maxblur: params.maxblur // 最大模糊
    })
    composer.addPass(bokehPass)

    // OutputPass - 色彩空间校正
    const outputPass = new OutputPass()
    composer.addPass(outputPass)
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()
    gui.title("景深效果控制")

    // 景深参数控制
    const dofFolder = gui.addFolder("📸 景深参数")
    const bokehUniforms = bokehPass ? (bokehPass.uniforms as Record<string, any>) : null

    dofFolder
      .add(params, "focus", 1, 25, 0.1)
      .name("焦距 (focus)")
      .onChange((value: number) => {
        if (bokehUniforms) {
          bokehUniforms["focus"].value = value
        }
        updateFocusHelper(value)
      })

    dofFolder
      .add(params, "aperture", 0.001, 0.1, 0.001)
      .name("光圈 (aperture)")
      .onChange((value: number) => {
        if (bokehUniforms) {
          bokehUniforms["aperture"].value = value
        }
      })

    dofFolder
      .add(params, "maxblur", 0.001, 0.03, 0.001)
      .name("最大模糊 (maxblur)")
      .onChange((value: number) => {
        if (bokehUniforms) {
          bokehUniforms["maxblur"].value = value
        }
      })
    dofFolder.open()

    // 显示控制
    const displayFolder = gui.addFolder("📺 显示控制")
    displayFolder
      .add(params, "showFocusHelper")
      .name("显示焦点辅助线")
      .onChange((value) => {
        if (focusLine) focusLine.visible = value
      })
    displayFolder.open()

    // 说明信息
    const infoFolder = gui.addFolder("📖 景深原理")
    const info = {
      focus: "焦距：相机对焦的距离，该距离处最清晰",
      aperture: "光圈：控制模糊强度，模拟真实相机光圈",
      maxblur: "最大模糊：限制模糊的最大程度",
      tip1: "减小 aperture 可获得更大景深",
      tip2: "增大 aperture 可获得更明显的散焦效果"
    }
    infoFolder.add(info, "focus").name("focus").disable()
    infoFolder.add(info, "aperture").name("aperture").disable()
    infoFolder.add(info, "maxblur").name("maxblur").disable()
    infoFolder.add(info, "tip1").name("💡 提示1").disable()
    infoFolder.add(info, "tip2").name("💡 提示2").disable()
    infoFolder.open()
  }

  /**
   * 更新焦点辅助线位置
   */
  const updateFocusHelper = (focusDistance: number) => {
    if (!focusLine || !camera.value) return

    // 计算焦点在场景中的位置（沿相机方向 focusDistance 处）
    const dir = new THREE.Vector3()
    camera.value.getWorldDirection(dir)
    const pos = camera.value.position.clone().add(dir.multiplyScalar(focusDistance))
    focusLine.position.set(pos.x, 0, pos.z)
  }

  /**
   * 初始化场景内容
   */
  const initSceneContent = () => {
    if (!scene.value || !renderer.value) return

    // 设置深色背景
    scene.value.background = new THREE.Color(0x111122)

    // 创建灯光
    createLights()

    // 创建物体
    createObjects()

    // 创建焦点辅助线
    createFocusHelper()

    // 初始化后处理管线
    initPostProcessing()

    // 初始化 GUI
    initGUI()

    // 启动动画循环
    startAnimation(() => {
      const elapsed = clock.getElapsedTime()

      // 球体微微浮动
      meshes.forEach((mesh, index) => {
        if (mesh.geometry?.type === "SphereGeometry") {
          mesh.position.y = Math.sin(elapsed * 0.8 + index * 0.5) * 0.15
        }
      })

      // 立方体缓慢旋转
      meshes.forEach((mesh, index) => {
        if (mesh.geometry?.type === "BoxGeometry") {
          mesh.rotation.y = elapsed * 0.3 + index * 0.5
        }
      })

      // 更新焦点辅助线位置
      if (params.showFocusHelper && camera.value) {
        updateFocusHelper(params.focus)
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
      bokehPass = null
    }

    // 清理焦点辅助线
    if (focusLine) {
      focusLine.geometry?.dispose()
      const mat = focusLine.material
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose())
      } else {
        mat?.dispose()
      }
      focusLine = null
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
    title="📸 BokehPass 景深效果"
    description="模拟真实相机的景深效果，焦点清晰、远近视差模糊"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>景深效果参数：</h3>
        <ul>
          <li>🎯 <strong>focus</strong> - 焦距，控制清晰平面的位置</li>
          <li>⭕ <strong>aperture</strong> - 光圈大小，控制散焦强度</li>
          <li>🌫️ <strong>maxblur</strong> - 最大模糊程度限制</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>什么是景深？</h3>
        <ul>
          <li>📷 真实相机中，只有焦平面上的物体是完全清晰的</li>
          <li>🔲 离焦平面越远的物体越模糊（散焦/Bokeh）</li>
          <li>🎯 光圈越大（aperture 越大），景深越浅，模糊越明显</li>
          <li>🌌 Three.js 的 BokehPass 模拟了这种光学效果</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 调试技巧</p>
        <p>调节焦距（focus）观察绿色辅助线位置的变化，只有位于焦点处的物体最清晰。增大光圈可以让散焦效果更加梦幻。</p>
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
