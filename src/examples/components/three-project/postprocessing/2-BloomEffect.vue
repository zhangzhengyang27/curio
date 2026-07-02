<script setup lang="ts">
  /**
   * UnrealBloomPass 泛光效果教程
   * 演示如何使用 UnrealBloomPass 为场景添加发光效果
   * 通过 emissive 材质属性控制物体发光，threshold 控制哪些物体产生泛光
   */
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
  import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
  import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js"
  import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js"

  // 容器引用
  const containerRef = shallowRef(null)

  // 后处理相关
  let composer: EffectComposer | null = null
  let bloomPass: UnrealBloomPass | null = null
  let gui: GUI | null = null
  const clock = new THREE.Clock()

  // 场景物体引用
  const meshes: THREE.Mesh[] = []

  // GUI 参数
  const params = {
    strength: 1.5, // 泛光强度
    radius: 0.4, // 泛光半径
    threshold: 0.6, // 泛光阈值（亮度超过此值的像素才会泛光）
    emissiveIntensity: 2.0 // 发光强度
  }

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
    cameraPosition: { x: 0, y: 3, z: 7 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 2,
      maxDistance: 15
    },
    showAxesHelper: false,
    showGridHelper: true
  })

  /**
   * 创建发光物体（使用 emissive 材质）
   * emissive 颜色越亮，越容易触发泛光
   */
  const createEmissiveObjects = () => {
    if (!scene.value) return

    // 发光球体 - 亮黄色发光
    const glowingSphereGeo = new THREE.SphereGeometry(0.6, 32, 32)
    const glowingSphereMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffaa, // 自发光颜色：暖黄色
      emissiveIntensity: params.emissiveIntensity,
      roughness: 0.1,
      metalness: 0.8
    })
    const glowingSphere = new THREE.Mesh(glowingSphereGeo, glowingSphereMat)
    glowingSphere.position.set(-2, 1, 0)
    glowingSphere.name = "glowingSphere"
    scene.value.add(glowingSphere)
    meshes.push(glowingSphere)

    // 发光圆环 - 青色发光
    const glowingTorusGeo = new THREE.TorusGeometry(0.5, 0.2, 16, 48)
    const glowingTorusMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00ffff, // 自发光颜色：青色
      emissiveIntensity: params.emissiveIntensity,
      roughness: 0.15,
      metalness: 0.7
    })
    const glowingTorus = new THREE.Mesh(glowingTorusGeo, glowingTorusMat)
    glowingTorus.position.set(0, 1, 0)
    glowingTorus.name = "glowingTorus"
    scene.value.add(glowingTorus)
    meshes.push(glowingTorus)

    // 发光立方体 - 红色发光
    const glowingCubeGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8)
    const glowingCubeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xff4444, // 自发光颜色：红色
      emissiveIntensity: params.emissiveIntensity,
      roughness: 0.1,
      metalness: 0.6
    })
    const glowingCube = new THREE.Mesh(glowingCubeGeo, glowingCubeMat)
    glowingCube.position.set(2, 1, 0)
    glowingCube.name = "glowingCube"
    scene.value.add(glowingCube)
    meshes.push(glowingCube)
  }

  /**
   * 创建不发光的普通物体（作为对比）
   */
  const createNormalObjects = () => {
    if (!scene.value) return

    // 普通球体 - 蓝色
    const normalSphereGeo = new THREE.SphereGeometry(0.5, 32, 32)
    const normalSphereMat = new THREE.MeshStandardMaterial({
      color: 0x3366aa,
      roughness: 0.5,
      metalness: 0.3
    })
    const normalSphere = new THREE.Mesh(normalSphereGeo, normalSphereMat)
    normalSphere.position.set(-1, 0.5, -2)
    scene.value.add(normalSphere)
    meshes.push(normalSphere)

    // 普通立方体 - 绿色
    const normalCubeGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6)
    const normalCubeMat = new THREE.MeshStandardMaterial({
      color: 0x33aa66,
      roughness: 0.6,
      metalness: 0.2
    })
    const normalCube = new THREE.Mesh(normalCubeGeo, normalCubeMat)
    normalCube.position.set(1, 0.5, -2)
    scene.value.add(normalCube)
    meshes.push(normalCube)

    // 地面
    const groundGeo = new THREE.PlaneGeometry(15, 15)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x222233,
      roughness: 0.9,
      metalness: 0.1
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.5
    scene.value.add(ground)
    meshes.push(ground)
  }

  /**
   * 创建灯光
   */
  const createLights = () => {
    if (!scene.value) return

    // 柔和环境光
    const ambientLight = new THREE.AmbientLight(0x222244, 0.5)
    scene.value.add(ambientLight)

    // 主方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
    directionalLight.position.set(5, 8, 5)
    scene.value.add(directionalLight)

    // 补光
    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3)
    fillLight.position.set(-5, 3, -5)
    scene.value.add(fillLight)
  }

  /**
   * 初始化后处理管线 - 泛光效果
   */
  const initPostProcessing = () => {
    if (!renderer.value || !scene.value || !camera.value) return

    // 创建 EffectComposer
    composer = new EffectComposer(renderer.value)

    // RenderPass - 基础渲染通道
    const renderPass = new RenderPass(scene.value, camera.value)
    composer.addPass(renderPass)

    // UnrealBloomPass - 泛光效果
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight), // 分辨率
      params.strength, // 泛光强度
      params.radius, // 泛光半径
      params.threshold // 泛光阈值
    )
    composer.addPass(bloomPass)

    // OutputPass - 色彩空间校正
    const outputPass = new OutputPass()
    composer.addPass(outputPass)
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()
    gui.title("泛光效果控制")

    // 泛光参数控制
    const bloomFolder = gui.addFolder("🌟 泛光参数")
    bloomFolder
      .add(params, "strength", 0, 3, 0.05)
      .name("泛光强度 (strength)")
      .onChange((value) => {
        if (bloomPass) bloomPass.strength = value
      })

    bloomFolder
      .add(params, "radius", 0, 1, 0.01)
      .name("泛光半径 (radius)")
      .onChange((value) => {
        if (bloomPass) bloomPass.radius = value
      })

    bloomFolder
      .add(params, "threshold", 0, 1, 0.01)
      .name("泛光阈值 (threshold)")
      .onChange((value) => {
        if (bloomPass) bloomPass.threshold = value
      })

    bloomFolder.open()

    // 材质控制
    const materialFolder = gui.addFolder("🎨 材质控制")
    materialFolder
      .add(params, "emissiveIntensity", 0, 5, 0.1)
      .name("发光强度")
      .onChange((value) => {
        // 更新所有发光物体的 emissiveIntensity
        meshes.forEach((mesh) => {
          if (!mesh.material) return
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          materials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial && mat.emissive) {
              mat.emissiveIntensity = value
            }
          })
        })
      })
    materialFolder.open()

    // 说明信息
    const infoFolder = gui.addFolder("📖 泛光原理")
    const info = {
      strength: "泛光整体强度，值越大光晕越明显",
      radius: "泛光扩散半径，控制光晕大小",
      threshold: "亮度阈值，只对超过此亮度的像素生效",
      tip: "emissive 材质属性使物体自发光"
    }
    infoFolder.add(info, "strength").name("strength").disable()
    infoFolder.add(info, "radius").name("radius").disable()
    infoFolder.add(info, "threshold").name("threshold").disable()
    infoFolder.add(info, "tip").name("💡 提示").disable()
    infoFolder.open()
  }

  /**
   * 初始化场景内容
   */
  const initSceneContent = () => {
    if (!scene.value || !renderer.value) return

    // 设置深色背景（泛光效果在暗背景下更明显）
    scene.value.background = new THREE.Color(0x0a0a1a)

    // 创建灯光
    createLights()

    // 创建物体
    createEmissiveObjects()
    createNormalObjects()

    // 初始化后处理管线
    initPostProcessing()

    // 初始化 GUI
    initGUI()

    // 启动动画循环
    startAnimation(() => {
      const elapsed = clock.getElapsedTime()

      // 旋转发光物体，让场景更动态
      meshes.forEach((mesh, index) => {
        if (mesh.name && mesh.name.startsWith("glowing")) {
          mesh.rotation.x = elapsed * (0.3 + index * 0.15)
          mesh.rotation.y = elapsed * (0.5 + index * 0.1)
          // 上下浮动
          mesh.position.y = 1 + Math.sin(elapsed * 1.5 + index * 2) * 0.3
        }
      })

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
      bloomPass = null
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
    title="🌟 UnrealBloomPass 泛光效果"
    description="为场景中的发光物体添加梦幻般的辉光效果"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>泛光效果特性：</h3>
        <ul>
          <li>🌟 <strong>strength</strong> - 控制泛光整体强度</li>
          <li>📡 <strong>radius</strong> - 控制光晕扩散范围</li>
          <li>📏 <strong>threshold</strong> - 亮度阈值过滤</li>
          <li>💡 <strong>emissive</strong> - 材质自发光属性</li>
          <li>🎭 亮色物体泛光 vs 暗色物体不泛光</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 泛光原理</p>
        <p>UnrealBloomPass 会对场景中亮度超过 threshold 的像素进行模糊处理，然后与原始图像叠加，产生发光效果。设置 emissive 属性可以让物体自发光。</p>
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
