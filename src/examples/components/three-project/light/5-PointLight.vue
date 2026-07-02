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
  let pointLight: THREE.PointLight | null = null
  let pointLightHelper: THREE.PointLightHelper | null = null
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

    // 添加点光源
    pointLight = new THREE.PointLight(0xffffff, 1)
    pointLight.position.set(0, 5, 0)
    pointLight.castShadow = true

    // 点光源关键参数
    pointLight.distance = 15 // 光的最大距离，0 表示无限远
    pointLight.decay = 2 // 沿着光照距离的衰减量（物理正确值为 2）

    // 设置阴影贴图大小
    pointLight.shadow.mapSize.width = 2048
    pointLight.shadow.mapSize.height = 2048

    scene.value.add(pointLight)

    // 添加点光源辅助器
    pointLightHelper = new THREE.PointLightHelper(pointLight, 0.5)
    scene.value.add(pointLightHelper)

    console.log("点光源配置:", pointLight)
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

    // 点光源控制
    if (pointLight) {
      const lightFolder = gui.addFolder("点光源")
      lightFolder.add(pointLight, "intensity", 0, 5, 0.1).name("强度")
      lightFolder
        .add(pointLight.position, "x", -20, 20)
        .name("位置 X")
        .onChange(() => {
          pointLightHelper?.update()
        })
      lightFolder
        .add(pointLight.position, "y", -5, 20)
        .name("位置 Y")
        .onChange(() => {
          pointLightHelper?.update()
        })
      lightFolder
        .add(pointLight.position, "z", -20, 20)
        .name("位置 Z")
        .onChange(() => {
          pointLightHelper?.update()
        })
      lightFolder.open()

      // 点光源参数控制
      const pointParamsFolder = gui.addFolder("点光源参数")
      pointParamsFolder
        .add(pointLight, "distance", 0, 100)
        .name("光照距离")
        .onChange(() => {
          pointLightHelper?.update()
        })
      pointParamsFolder
        .add(pointLight, "decay", 0, 5, 0.1)
        .name("衰减量")
        .onChange(() => {
          pointLightHelper?.update()
        })
      pointParamsFolder.open()

      // 点光源颜色控制
      const colorParams = {
        color: pointLight.color.getHex()
      }
      gui
        .addColor(colorParams, "color")
        .name("点光源颜色")
        .onChange((value) => {
          if (!pointLight) return
          pointLight.color.setHex(value)
          pointLightHelper?.update()
        })
    }

    console.log("GUI 创建完成")
  }

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
        // 更新点光源辅助器
        if (pointLightHelper) {
          pointLightHelper.update()
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
    title="点光源 PointLight"
    description="Three.js 点光源详解 - 向四面八方发射的光源"
  >
    <!-- 内容区域 -->
    <template #content>
      <div class="controls-tip">
        <p>🎮 使用右侧面板调整点光源参数</p>
      </div>

      <div class="features">
        <h3>🌟 点光源特性</h3>
        <ul>
          <li>✅ 从一个点向四面八方发射光线</li>
          <li>✅ 类似于现实中的灯泡</li>
          <li>✅ 光强度随距离衰减</li>
          <li>✅ 支持阴影投射（6 个方向的阴影贴图）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📚 核心参数说明</h3>
        <ul>
          <li><strong>color</strong> - 光的颜色，默认为白色</li>
          <li><strong>intensity</strong> - 光照强度，默认为 1</li>
          <li><strong>distance</strong> - 光的最大距离，0 表示无限远</li>
          <li><strong>decay</strong> - 沿距离的衰减量，默认为 2（物理正确）</li>
          <li><strong>position</strong> - 光源在空间中的位置</li>
        </ul>
      </div>

      <div class="tips">
        <h3>💡 使用技巧</h3>
        <ul>
          <li>💡 适合模拟灯泡、火把、星光等点光源</li>
          <li>⚡ decay = 2 符合物理真实性（平方反比定律）</li>
          <li>🎨 可以通过颜色创造不同氛围（暖色/冷色）</li>
          <li>🔍 distance 控制光照影响范围</li>
          <li>⚠️ 点光源阴影计算开销较大（6 个方向）</li>
          <li>🎯 多个点光源配合可创造复杂照明效果</li>
        </ul>
      </div>

      <div class="comparison">
        <h3>🔄 与其他光源对比</h3>
        <ul>
          <li>🆚 <strong>平行光</strong>：方向性光源，光线平行</li>
          <li>🆚 <strong>聚光灯</strong>：锥形光束，有方向性</li>
          <li>🆚 <strong>点光源</strong>：球形发散，无方向性</li>
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
    background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
  }
</style>
