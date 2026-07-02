<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"

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
  const { scene, camera: _camera, renderer, controls: _controls, startAnimation } = useThreeScene(containerRef, {
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
   * 创建几何体
   */
  const createGeometries = () => {
    if (!scene.value) return

    // 创建环形扭结
    const torusKnotGeometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16)
    const material1 = new THREE.MeshPhysicalMaterial({
      color: 0xccccff
    })
    torusKnot = new THREE.Mesh(torusKnotGeometry, material1)
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
    planeMesh.receiveShadow = true // 平面接收阴影
    planeMesh.castShadow = true // 平面投射阴影
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
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.6) // 平行光强度
    directionalLight.position.set(4, 4, 0) // 平行光位置
    directionalLight.target.position.set(0, 0, 0) // 平行光目标位置

    // 设置光投射阴影
    directionalLight.castShadow = true

    // 设置阴影相机参数
    directionalLight.shadow.camera.left = -10
    directionalLight.shadow.camera.right = 10
    directionalLight.shadow.camera.top = 10
    directionalLight.shadow.camera.bottom = -10
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 50

    // 设置阴影的纹理大小
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048

    scene.value.add(directionalLight)

    // 添加平行光辅助器
    directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight)
    scene.value.add(directionalLightHelper)

    console.log("灯光添加完成", directionalLight)
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

  const createGUI = () => {
    gui = new GUI()

    if (sphere) {
      gui.add(sphere.position, "z", -10, 10).name("球体 Z 轴")
      gui.add(sphere.position, "x", -10, 10).name("球体 X 轴")
      gui.add(sphere.position, "y", -10, 10).name("球体 Y 轴")
    }

    if (ambientLight) {
      gui.add(ambientLight, "intensity", 0, 1, 0.01).name("环境光强度")
    }

    if (directionalLight) {
      const lightFolder = gui.addFolder("平行光")
      lightFolder.add(directionalLight, "intensity", 0, 2, 0.01).name("强度")
      lightFolder.add(directionalLight.position, "x", -20, 20).name("位置 X")
      lightFolder.add(directionalLight.position, "y", -20, 20).name("位置 Y")
      lightFolder.add(directionalLight.position, "z", -20, 20).name("位置 Z")
      lightFolder.open()
    }

    console.log("GUI 创建完成")
  }

  /**
   * 初始化场景内容
   */
  const initContent = () => {
    setupRenderer()
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
        // 可以在这里添加动画逻辑
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
    title="灯光与阴影"
    description="Three.js 灯光系统与阴影效果演示"
  >
    <!-- 内容区域 -->
    <template #content>
      <div class="controls-tip">
        <p>🎮 使用右侧面板调整灯光参数</p>
      </div>

      <div class="features">
        <h3>🌟 灯光效果</h3>
        <ul>
          <li>✅ 环境光（AmbientLight）</li>
          <li>✅ 平行光（DirectionalLight）</li>
          <li>✅ 实时阴影投射</li>
          <li>✅ HDR 环境贴图</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📚 技术要点</h3>
        <ul>
          <li>renderer.shadowMap.enabled - 启用阴影</li>
          <li>light.castShadow - 光源投射阴影</li>
          <li>mesh.castShadow - 物体投射阴影</li>
          <li>mesh.receiveShadow - 物体接收阴影</li>
          <li>shadow.mapSize - 阴影贴图分辨率</li>
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
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  }
</style>
