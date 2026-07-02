<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  const containerRef = shallowRef(null)

  const { scene, startAnimation, onSceneReady, dispose: baseDispose } =
    useThreeScene(containerRef, {
      cameraPosition: { x: 5, y: 4, z: 6 },
      enableControls: true,
      controlsConfig: { enableDamping: true, dampingFactor: 0.05 }
    })

  let gui!: GUI
  const helpers: Record<string, any> = {}

  const params = {
    axesHelper: true,
    axesSize: 5,
    gridHelper: true,
    gridSize: 10,
    boxHelper: true,
    directionalLightHelper: true,
    spotLightHelper: true,
    pointLightHelper: true
  }

  const createScene = () => {
    if (!scene.value) return

    // 地面
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.name = "ground"
    scene.value.add(ground)

    // 被包裹的物体（用于 BoxHelper）
    const mainMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x3498db, metalness: 0.5, roughness: 0.3 })
    )
    mainMesh.position.set(0, 0.75, 0)
    mainMesh.name = "mainBox"
    scene.value.add(mainMesh)

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x2ecc71 })
    )
    sphere.position.set(2, 0.6, 0)
    scene.value.add(sphere)

    // --- Helpers ---

    // AxesHelper
    helpers.axes = new THREE.AxesHelper(params.axesSize)
    helpers.axes.name = "axesHelper"
    scene.value.add(helpers.axes)

    // GridHelper
    helpers.grid = new THREE.GridHelper(params.gridSize, params.gridSize)
    helpers.grid.position.y = 0.01
    helpers.grid.name = "gridHelper"
    scene.value.add(helpers.grid)

    // BoxHelper
    helpers.box = new THREE.BoxHelper(mainMesh, 0xffff00)
    helpers.box.name = "boxHelper"
    scene.value.add(helpers.box)

    // DirectionalLight + Helper
    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(3, 5, 3)
    dirLight.name = "dirLight"
    scene.value.add(dirLight)

    helpers.dirLight = new THREE.DirectionalLightHelper(dirLight, 1, 0xffa500)
    helpers.dirLight.name = "dirLightHelper"
    scene.value.add(helpers.dirLight)

    // SpotLight + Helper
    const spotLight = new THREE.SpotLight(0xff6600, 2, 15, Math.PI / 6)
    spotLight.position.set(-3, 5, -2)
    spotLight.target.position.set(0, 0, 0)
    spotLight.name = "spotLight"
    scene.value.add(spotLight)
    scene.value.add(spotLight.target)

    helpers.spotLight = new THREE.SpotLightHelper(spotLight, 0xff6600)
    helpers.spotLight.name = "spotLightHelper"
    scene.value.add(helpers.spotLight)

    // PointLight + Helper
    const pointLight = new THREE.PointLight(0x00ff00, 1, 10)
    pointLight.position.set(2, 2, 2)
    pointLight.name = "pointLight"
    scene.value.add(pointLight)

    helpers.pointLight = new THREE.PointLightHelper(pointLight, 0.3)
    helpers.pointLight.name = "pointLightHelper"
    scene.value.add(helpers.pointLight)

    // 灯光
    scene.value.add(new THREE.AmbientLight(0xffffff, 0.3))
  }

  const animateCallback = () => {
    // BoxHelper 需要手动更新
    const mainBox = scene.value?.getObjectByName("mainBox")
    if (mainBox && helpers.box) {
      mainBox.rotation.y += 0.005
      helpers.box.update()
    }
    // 更新 SpotLightHelper
    if (helpers.spotLight) helpers.spotLight.update()
  }

  const initGUI = () => {
    if (!scene.value) return
    const sceneValue = scene.value
    gui = new GUI()

    const h = gui.addFolder("AxesHelper")
    h.add(params, "axesHelper").name("显示").onChange((v) => { helpers.axes.visible = v })
    h.add(params, "axesSize", 1, 10, 0.5).name("大小").onChange((v: number) => {
      sceneValue.remove(helpers.axes)
      helpers.axes.dispose()
      helpers.axes = new THREE.AxesHelper(v)
      helpers.axes.visible = params.axesHelper
      sceneValue.add(helpers.axes)
    })

    const g = gui.addFolder("GridHelper")
    g.add(params, "gridHelper").name("显示").onChange((v) => { helpers.grid.visible = v })
    g.add(params, "gridSize", 5, 20, 1).name("大小").onChange((v: number) => {
      sceneValue.remove(helpers.grid)
      helpers.grid.dispose()
      helpers.grid = new THREE.GridHelper(v, v)
      helpers.grid.position.y = 0.01
      helpers.grid.visible = params.gridHelper
      sceneValue.add(helpers.grid)
    })

    const b = gui.addFolder("BoxHelper")
    b.add(params, "boxHelper").name("显示").onChange((v) => { helpers.box.visible = v })

    const dl = gui.addFolder("DirectionalLightHelper")
    dl.add(params, "directionalLightHelper").name("显示").onChange((v) => { helpers.dirLight.visible = v })

    const sl = gui.addFolder("SpotLightHelper")
    sl.add(params, "spotLightHelper").name("显示").onChange((v) => { helpers.spotLight.visible = v })

    const pl = gui.addFolder("PointLightHelper")
    pl.add(params, "pointLightHelper").name("显示").onChange((v) => { helpers.pointLight.visible = v })
  }

  onSceneReady(() => {
    createScene()
    initGUI()
    startAnimation(animateCallback)
  })

  onUnmounted(() => {
    Object.values(helpers).forEach(h => {
      if (h) h.dispose?.()
    })
    gui?.destroy()
    baseDispose()
  })
</script>

<template>
  <PageLayout
    title="🔧 辅助工具"
    description="AxesHelper / GridHelper / BoxHelper / 各种灯光 Helper 展示与独立开关"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>📊 AxesHelper - 坐标轴辅助</li>
          <li>📏 GridHelper - 网格辅助</li>
          <li>📦 BoxHelper - 包围盒辅助（实时跟踪旋转）</li>
          <li>💡 DirectionalLightHelper / SpotLightHelper / PointLightHelper</li>
          <li>🎛️ 每种 Helper 独立开关</li>
        </ul>
      </div>
    </template>
    <div ref="containerRef" />
  </PageLayout>
</template>
