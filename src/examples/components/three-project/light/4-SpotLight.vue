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
  let spotLight: THREE.SpotLight | null = null
  let spotLightHelper: THREE.SpotLightHelper | null = null
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
    planeMesh.position.set(0, -2, 0)
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

    // 添加聚光灯
    spotLight = new THREE.SpotLight(0xffffff, 2)
    spotLight.position.set(0, 10, 0)
    spotLight.target.position.set(0, 0, 0)
    spotLight.castShadow = true

    // 聚光灯关键参数
    spotLight.angle = Math.PI / 8 // 光锥角度（弧度）
    spotLight.distance = 100 // 光的最大距离
    spotLight.penumbra = 0.5 // 半影衰减百分比（0-1）
    spotLight.decay = 2 // 沿着光照距离的衰减量

    // 设置阴影贴图大小
    spotLight.shadow.mapSize.width = 2048
    spotLight.shadow.mapSize.height = 2048

    scene.value.add(spotLight)

    // 添加聚光灯辅助器
    spotLightHelper = new THREE.SpotLightHelper(spotLight)
    scene.value.add(spotLightHelper)

    console.log("聚光灯配置:", spotLight)
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

    // 聚光灯控制
    if (spotLight) {
      const lightFolder = gui.addFolder("聚光灯")
      lightFolder.add(spotLight, "intensity", 0, 5, 0.1).name("强度")
      lightFolder
        .add(spotLight.position, "x", -20, 20)
        .name("位置 X")
        .onChange(() => {
          spotLightHelper?.update()
        })
      lightFolder
        .add(spotLight.position, "y", 0, 20)
        .name("位置 Y")
        .onChange(() => {
          spotLightHelper?.update()
        })
      lightFolder
        .add(spotLight.position, "z", -20, 20)
        .name("位置 Z")
        .onChange(() => {
          spotLightHelper?.update()
        })
      lightFolder.open()

      // 聚光灯参数控制
      const spotParamsFolder = gui.addFolder("聚光灯参数")
      spotParamsFolder
        .add(spotLight, "angle", 0, Math.PI / 2)
        .name("光锥角度")
        .onChange(() => {
          spotLightHelper?.update()
        })
      spotParamsFolder
        .add(spotLight, "distance", 0, 200)
        .name("光照距离")
        .onChange(() => {
          spotLightHelper?.update()
        })
      spotParamsFolder
        .add(spotLight, "penumbra", 0, 1, 0.01)
        .name("半影衰减")
        .onChange(() => {
          spotLightHelper?.update()
        })
      spotParamsFolder
        .add(spotLight, "decay", 0, 5, 0.1)
        .name("衰减量")
        .onChange(() => {
          spotLightHelper?.update()
        })
      spotParamsFolder.open()

      // 聚光灯目标位置控制
      const targetFolder = gui.addFolder("聚光灯目标")
      targetFolder
        .add(spotLight.target.position, "x", -10, 10)
        .name("目标 X")
        .onChange(() => {
          spotLightHelper?.update()
        })
      targetFolder
        .add(spotLight.target.position, "y", -10, 10)
        .name("目标 Y")
        .onChange(() => {
          spotLightHelper?.update()
        })
      targetFolder
        .add(spotLight.target.position, "z", -10, 10)
        .name("目标 Z")
        .onChange(() => {
          spotLightHelper?.update()
        })
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
        // 更新聚光灯辅助器
        if (spotLightHelper) {
          spotLightHelper.update()
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
    title="聚光灯 SpotLight"
    description="Three.js 聚光灯效果与参数详解"
  >
    <!-- 内容区域 -->
    <template #content>
      <div class="controls-tip">
        <p>🎮 使用右侧面板调整聚光灯参数</p>
      </div>

      <div class="features">
        <h3>🌟 聚光灯特性</h3>
        <ul>
          <li>✅ 从一个点向一个方向发射锥形光束</li>
          <li>✅ 光束沿着光照距离逐渐衰减</li>
          <li>✅ 支持阴影投射</li>
          <li>✅ 可控制光锥角度、半影、衰减等参数</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📚 核心参数说明</h3>
        <ul>
          <li><strong>angle</strong> - 光锥的最大角度（弧度），默认 Math.PI/3</li>
          <li><strong>penumbra</strong> - 聚光锥的半影衰减百分比，取值 0-1</li>
          <li><strong>distance</strong> - 光的最大距离，0 表示无限远</li>
          <li><strong>decay</strong> - 光沿距离的衰减量，默认为 2（物理正确）</li>
          <li><strong>target</strong> - 聚光灯的目标位置</li>
        </ul>
      </div>

      <div class="tips">
        <h3>💡 使用技巧</h3>
        <ul>
          <li>🎯 调整 angle 控制光照范围</li>
          <li>✨ penumbra 值越大，边缘越柔和</li>
          <li>📏 decay = 2 符合物理真实性</li>
          <li>🎨 可以改变 color 属性创造彩色灯光</li>
          <li>🔦 常用于舞台灯光、手电筒等效果</li>
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
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }
</style>
