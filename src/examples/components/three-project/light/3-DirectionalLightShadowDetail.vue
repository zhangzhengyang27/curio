<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"

  // 容器引用
  const containerRef = shallowRef(null)

  // 场景对象引用
  let torusKnot: THREE.Mesh | null = null
  let sphere: THREE.Mesh | null = null
  let box: THREE.Mesh | null = null
  let planeMesh: THREE.Mesh | null = null
  let ambientLight: THREE.AmbientLight | null = null
  let directionalLight: THREE.DirectionalLight | null = null
  let directionalLightHelper: THREE.DirectionalLightHelper | null = null
  let gui: GUI | null = null

  // 使用封装的场景
  const { scene, camera, renderer, controls, startAnimation } = useThreeScene(containerRef, {
    fov: 45,
    cameraPosition: { x: 0.4, y: 2.4, z: 15 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 1,
      maxDistance: 100
    },
    showAxesHelper: true,
    axesHelperSize: 5,
    showGridHelper: false
  })

  /**
   * 加载 HDR 环境贴图
   */
  const loadHDREnvironment = () => {
    const rgbeLoader = new RGBELoader()
    rgbeLoader.load(
      "/three-project/texture/Video_Copilot-Back Light_0007_4k.hdr",
      (envMap) => {
        // 设置球形贴图
        envMap.mapping = THREE.EquirectangularReflectionMapping
        // 设置环境背景
        if (!scene.value) return
        scene.value.background = envMap
        console.log("HDR 环境贴图加载完成")
      },
      undefined,
      (error) => {
        console.error("HDR 加载失败:", error)
        // 如果 HDR 加载失败，设置一个默认背景色
        if (!scene.value) return
        scene.value.background = new THREE.Color(0x2c3e50)
      }
    )
  }

  /**
   * 创建几何体
   */
  const createGeometries = () => {
    if (!scene.value) return

    // 创建环形扭结
    const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16)
    const material1 = new THREE.MeshPhysicalMaterial({
      color: 0xccccff
    })
    torusKnot = new THREE.Mesh(geometry, material1)
    torusKnot.position.set(4, 0, 0)
    torusKnot.castShadow = true
    torusKnot.receiveShadow = true
    scene.value.add(torusKnot)

    // 创建球体
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32)
    const material2 = new THREE.MeshPhysicalMaterial({
      color: 0xffffff
    })
    sphere = new THREE.Mesh(sphereGeometry, material2)
    sphere.castShadow = true
    sphere.receiveShadow = true
    scene.value.add(sphere)

    // 创建立方体
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
    const material3 = new THREE.MeshPhysicalMaterial({
      color: 0xffcccc
    })
    box = new THREE.Mesh(boxGeometry, material3)
    box.position.set(-4, 0, 0)
    box.castShadow = true
    box.receiveShadow = true
    scene.value.add(box)

    // 创建平面
    const planeGeometry = new THREE.PlaneGeometry(24, 24, 1, 1)
    const planeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x999999
    })
    planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
    planeMesh.rotation.x = -Math.PI / 2
    planeMesh.position.set(0, -1, 0)
    planeMesh.receiveShadow = true
    planeMesh.castShadow = true
    scene.value.add(planeMesh)

    console.log("几何体创建完成")
  }

  /**
   * 添加灯光
   */
  const addLights = () => {
    if (!scene.value) return

    // 添加环境光
    ambientLight = new THREE.AmbientLight(0xffffff, 0.1)
    scene.value.add(ambientLight)

    // 添加平行光
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
    directionalLight.position.set(10, 10, 0)
    // 默认平行光的目标是原点
    directionalLight.target.position.set(0, 0, 0)

    // 设置光投射阴影
    directionalLight.castShadow = true

    // 设置阴影相机参数（关键配置）
    directionalLight.shadow.camera.left = -10
    directionalLight.shadow.camera.right = 10
    directionalLight.shadow.camera.top = 10
    directionalLight.shadow.camera.bottom = -10
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 50

    // 设置阴影的纹理大小（影响阴影质量）
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048

    scene.value.add(directionalLight)

    // 添加平行光辅助器
    directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight)
    scene.value.add(directionalLightHelper)

    console.log("平行光配置:", directionalLight)
  }

  /**
   * 设置渲染器阴影
   */
  const setupRenderer = () => {
    if (!renderer.value) return

    // 设置渲染器允许投射阴影
    renderer.value.shadowMap.enabled = true
    // 设置色彩空间
    renderer.value.outputColorSpace = THREE.SRGBColorSpace
    // 设置色调映射
    renderer.value.toneMapping = THREE.ACESFilmicToneMapping
    renderer.value.toneMappingExposure = 1
  }

  /**
   * 创建 GUI 调试界面
   */
  const createGUI = () => {
    gui = new GUI()

    // 球体位置控制
    if (sphere) {
      const sphereFolder = gui.addFolder("球体控制")
      sphereFolder.add(sphere.position, "x", -10, 10).name("位置 X")
      sphereFolder.add(sphere.position, "y", -10, 10).name("位置 Y")
      sphereFolder.add(sphere.position, "z", -10, 10).name("位置 Z")
      sphereFolder.open()
    }

    // 环境光控制
    if (ambientLight) {
      gui.add(ambientLight, "intensity", 0, 1, 0.01).name("环境光强度")
    }

    // 平行光控制
    if (directionalLight) {
      const lightFolder = gui.addFolder("平行光")
      lightFolder.add(directionalLight, "intensity", 0, 2, 0.01).name("强度")
      lightFolder.add(directionalLight.position, "x", -20, 20).name("位置 X")
      lightFolder.add(directionalLight.position, "y", -20, 20).name("位置 Y")
      lightFolder.add(directionalLight.position, "z", -20, 20).name("位置 Z")
      lightFolder.open()

      // 阴影相机控制
      const shadowFolder = gui.addFolder("阴影相机参数")
      shadowFolder
        .add(directionalLight.shadow.camera, "left", -20, 0)
        .name("左边界")
        .onChange(() => {
          if (!directionalLight) return
          directionalLight.shadow.camera.updateProjectionMatrix()
        })
      shadowFolder
        .add(directionalLight.shadow.camera, "right", 0, 20)
        .name("右边界")
        .onChange(() => {
          if (!directionalLight) return
          directionalLight.shadow.camera.updateProjectionMatrix()
        })
      shadowFolder
        .add(directionalLight.shadow.camera, "top", 0, 20)
        .name("上边界")
        .onChange(() => {
          if (!directionalLight) return
          directionalLight.shadow.camera.updateProjectionMatrix()
        })
      shadowFolder
        .add(directionalLight.shadow.camera, "bottom", -20, 0)
        .name("下边界")
        .onChange(() => {
          if (!directionalLight) return
          directionalLight.shadow.camera.updateProjectionMatrix()
        })
      shadowFolder
        .add(directionalLight.shadow.camera, "near", 0.1, 10)
        .name("近平面")
        .onChange(() => {
          if (!directionalLight) return
          directionalLight.shadow.camera.updateProjectionMatrix()
        })
      shadowFolder
        .add(directionalLight.shadow.camera, "far", 10, 100)
        .name("远平面")
        .onChange(() => {
          if (!directionalLight) return
          directionalLight.shadow.camera.updateProjectionMatrix()
        })
    }

    console.log("GUI 创建完成")
  }

  /**
   * 初始化场景内容
   */
  const initContent = () => {
    setupRenderer()
    loadHDREnvironment()
    createGeometries()
    addLights()
    createGUI()
  }

  // 组件挂载后初始化
  onMounted(() => {
    // 等待场景初始化完成
    setTimeout(() => {
      initContent()

      // 开始渲染循环
      startAnimation(() => {
        // 更新平行光辅助器
        if (directionalLightHelper) {
          directionalLightHelper.update()
        }
      })
    }, 100)
  })

  // 组件卸载时清理
  onUnmounted(() => {
    // 销毁 GUI
    if (gui) {
      gui.destroy()
    }

    // 清理几何体和材质
    const meshes = [torusKnot, sphere, box, planeMesh]
    meshes.forEach((mesh) => {
      if (mesh) {
        mesh.geometry?.dispose()
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => mat.dispose())
        } else {
          mesh.material?.dispose()
        }
      }
    })
  })
</script>

<template>
  <PageLayout
    title="平行光阴影详解"
    description="深入理解平行光阴影相机参数与阴影质量控制"
  >
    <!-- 内容区域 -->
    <template #content>
      <div class="controls-tip">
        <p>🎮 使用右侧面板调整阴影相机参数</p>
      </div>

      <div class="features">
        <h3>🌟 核心功能</h3>
        <ul>
          <li>✅ 平行光阴影相机参数实时调试</li>
          <li>✅ 阴影范围边界控制（left/right/top/bottom）</li>
          <li>✅ 阴影深度控制（near/far）</li>
          <li>✅ 高质量阴影贴图（2048x2048）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📚 阴影相机参数说明</h3>
        <ul>
          <li><strong>shadow.camera.left/right/top/bottom</strong> - 阴影范围边界</li>
          <li><strong>shadow.camera.near/far</strong> - 阴影深度范围</li>
          <li><strong>shadow.mapSize</strong> - 阴影贴图分辨率（越大越清晰）</li>
          <li><strong>castShadow</strong> - 物体是否投射阴影</li>
          <li><strong>receiveShadow</strong> - 物体是否接收阴影</li>
        </ul>
      </div>

      <div class="tips">
        <h3>💡 优化建议</h3>
        <ul>
          <li>🎯 根据场景大小调整 shadow.camera 边界</li>
          <li>📐 边界设置过大会降低阴影清晰度</li>
          <li>⚡ mapSize 越大性能开销越大</li>
          <li>🔍 使用 DirectionalLightHelper 可视化光源方向</li>
        </ul>
      </div>

      <p class="small-text">
        📌 使用鼠标拖拽可旋转视角，滚轮缩放
      </p>
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
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  }
</style>
