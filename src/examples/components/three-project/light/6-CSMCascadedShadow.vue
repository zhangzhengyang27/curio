<!-- @ts-nocheck -->
<script setup>
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
  import { CSM } from "three/addons/csm/CSM.js"

  // 容器引用
  const containerRef = shallowRef(null)

  // CSM 参数配置
  const params = {
    orthographic: false,
    fade: false,
    far: 1000,
    mode: "practical",
    lightX: -1,
    lightY: -1,
    lightZ: -1,
    margin: 100,
    lightFar: 1000,
    lightNear: 1,
    autoUpdateHelper: true
  }

  // 场景对象引用
  let torusKnot = null
  let sphere = null
  let box = null
  let planeMesh = null
  let ambientLight = null
  let directionalLight = null
  let directionalLightHelper = null
  let cameraHelper = null
  let csm = null
  let gui = null

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
        scene.value.background = envMap
        console.log("HDR 环境贴图加载完成")
      },
      undefined,
      (error) => {
        console.error("HDR 加载失败:", error)
        // 如果 HDR 加载失败，设置一个默认背景色
        scene.value.background = new THREE.Color(0x1a1a2e)
      }
    )
  }

  /**
   * 创建 CSM 级联阴影
   */
  const createCSM = () => {
    if (!scene.value || !camera.value) return

    csm = new CSM({
      maxFar: params.far,
      cascades: 4, // 级联数量
      parent: scene.value, // 场景
      shadowMapSize: 1024, // 阴影贴图大小
      lightDirection: new THREE.Vector3(params.lightX, params.lightY, params.lightZ).normalize(),
      camera: camera.value // 相机
    })
    csm.fade = true // 启用淡入淡出
    csm.updateFrustums() // 更新视锥

    console.log("CSM 级联阴影创建完成")
  }

  /**
   * 创建几何体
   */
  const createGeometries = () => {
    if (!scene.value || !csm) return

    // 创建环形扭结
    const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16)
    const material1 = new THREE.MeshPhysicalMaterial({
      color: 0xccccff
    })
    csm.setupMaterial(material1) // 关键：使用 CSM 设置材质
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
    csm.setupMaterial(material2)
    sphere = new THREE.Mesh(sphereGeometry, material2)
    sphere.castShadow = true
    sphere.receiveShadow = true
    scene.value.add(sphere)

    // 创建立方体
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
    const material3 = new THREE.MeshPhysicalMaterial({
      color: 0xffcccc
    })
    csm.setupMaterial(material3)
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
    csm.setupMaterial(planeMaterial)
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
    directionalLight.position.set(params.lightX, params.lightY, params.lightZ).normalize().multiplyScalar(-200)
    directionalLight.target.position.set(0, 0, 0)
    scene.value.add(directionalLight)

    // 添加平行光辅助器
    directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight)
    scene.value.add(directionalLightHelper)

    // 添加相机辅助器（显示阴影相机）
    cameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
    scene.value.add(cameraHelper)

    console.log("灯光添加完成")
  }

  /**
   * 设置渲染器阴影
   */
  const setupRenderer = () => {
    if (!renderer.value) return

    // 设置渲染器允许投射阴影
    renderer.value.shadowMap.enabled = true
    // 设置阴影类型为柔和阴影
    renderer.value.shadowMap.type = THREE.PCFSoftShadowMap
    // 设置色彩空间
    renderer.value.outputColorSpace = THREE.SRGBColorSpace
    // 设置色调映射
    renderer.value.toneMapping = THREE.ACESFilmicToneMapping
    renderer.value.toneMappingExposure = 1
  }

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

    // CSM 控制
    if (csm) {
      const csmFolder = gui.addFolder("CSM 级联阴影")
      csmFolder
        .add(csm, "fade")
        .name("启用淡入淡出")
        .onChange((value) => {
          csm.fade = value
          csm.updateFrustums()
        })
      csmFolder.open()

      // CSM 参数
      const paramsFolder = gui.addFolder("CSM 参数")
      paramsFolder
        .add(params, "far", 100, 5000)
        .name("最大距离")
        .onChange((value) => {
          csm.maxFar = value
          csm.updateFrustums()
        })
      paramsFolder
        .add(params, "lightX", -1, 1, 0.01)
        .name("光方向 X")
        .onChange(() => {
          const newDirection = new THREE.Vector3(params.lightX, params.lightY, params.lightZ).normalize()
          csm.lightDirection = newDirection
          directionalLight.position.copy(newDirection).multiplyScalar(-200)
          directionalLightHelper?.update()
        })
      paramsFolder
        .add(params, "lightY", -1, 1, 0.01)
        .name("光方向 Y")
        .onChange(() => {
          const newDirection = new THREE.Vector3(params.lightX, params.lightY, params.lightZ).normalize()
          csm.lightDirection = newDirection
          directionalLight.position.copy(newDirection).multiplyScalar(-200)
          directionalLightHelper?.update()
        })
      paramsFolder
        .add(params, "lightZ", -1, 1, 0.01)
        .name("光方向 Z")
        .onChange(() => {
          const newDirection = new THREE.Vector3(params.lightX, params.lightY, params.lightZ).normalize()
          csm.lightDirection = newDirection
          directionalLight.position.copy(newDirection).multiplyScalar(-200)
          directionalLightHelper?.update()
        })
    }

    console.log("GUI 创建完成")
  }

  const initContent = () => {
    setupRenderer()
    loadHDREnvironment()
    createCSM()
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
        // 更新相机矩阵
        if (camera.value) {
          camera.value.updateMatrixWorld()
        }
        // 更新 CSM
        if (csm) {
          csm.update()
        }
        // 更新平行光辅助器
        if (directionalLightHelper) {
          directionalLightHelper.update()
        }
      })
    }, 100)
  })

  // 组件卸载时清理
  onUnmounted(() => {
    if (gui) {
      gui.destroy()
    }

    // 清理 CSM
    if (csm) {
      csm.dispose()
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
    title="CSM 级联阴影"
    description="Cascaded Shadow Maps - 高级阴影优化技术"
  >
    <!-- 内容区域 -->
    <template #content>
      <div class="controls-tip">
        <p>🎮 使用右侧面板调整 CSM 级联阴影参数</p>
      </div>

      <div class="features">
        <h3>🌟 CSM 特性</h3>
        <ul>
          <li>✅ 级联阴影贴图（Cascaded Shadow Maps）</li>
          <li>✅ 多级阴影质量优化</li>
          <li>✅ 近处高精度，远处低精度</li>
          <li>✅ 自动淡入淡出过渡</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📚 CSM 核心概念</h3>
        <ul>
          <li><strong>cascades</strong> - 级联数量，通常 3-4 级</li>
          <li><strong>maxFar</strong> - 最大阴影距离</li>
          <li><strong>shadowMapSize</strong> - 每级阴影贴图大小</li>
          <li><strong>fade</strong> - 启用级联间淡入淡出</li>
          <li><strong>setupMaterial</strong> - 为材质设置 CSM 支持</li>
        </ul>
      </div>

      <div class="tips">
        <h3>💡 技术原理</h3>
        <ul>
          <li>📐 <strong>多级视锥分割</strong>：将相机视锥分成多个级联</li>
          <li>🎯 <strong>距离优化</strong>：近处使用高分辨率，远处使用低分辨率</li>
          <li>⚡ <strong>性能提升</strong>：在保证质量的同时减少性能开销</li>
          <li>✨ <strong>自动过渡</strong>：级联间平滑过渡，避免明显分界</li>
          <li>🔧 <strong>材质设置</strong>：需要用 csm.setupMaterial() 处理材质</li>
        </ul>
      </div>

      <div class="comparison">
        <h3>🔄 CSM vs 传统阴影</h3>
        <ul>
          <li>✅ <strong>传统阴影</strong>：单一分辨率，近处模糊或远处浪费</li>
          <li>✅ <strong>CSM 阴影</strong>：多级分辨率，平衡质量与性能</li>
          <li>✅ <strong>适用场景</strong>：大型开放世界、远景渲染</li>
        </ul>
      </div>

      <div class="usage">
        <h3>🎓 使用场景</h3>
        <ul>
          <li>🏞️ 大型室外场景</li>
          <li>🌄 开放世界游戏</li>
          <li>🏙️ 城市建筑渲染</li>
          <li>🌲 自然景观展示</li>
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
    background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
  }
</style>
