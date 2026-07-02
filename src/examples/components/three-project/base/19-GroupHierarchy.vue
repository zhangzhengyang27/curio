<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  const containerRef = shallowRef(null)

  const { scene, startAnimation, onSceneReady, dispose: baseDispose } =
    useThreeScene(containerRef, {
      cameraPosition: { x: 10, y: 8, z: 10 },
      enableControls: true,
      controlsConfig: { enableDamping: true, dampingFactor: 0.05 },
      showAxesHelper: true,
      showGridHelper: true
    })

  let gui!: GUI
  let sunGroup!: THREE.Group, earthPivot!: THREE.Group, moonPivot!: THREE.Group, earthMesh!: THREE.Mesh, moonMesh!: THREE.Mesh

  const params = {
    sunSpeed: 0.005,
    earthOrbitSpeed: 0.02,
    moonOrbitSpeed: 0.05,
    showWorldPos: false
  }

  const createScene = () => {
    if (!scene.value) return

    // 太阳
    sunGroup = new THREE.Group()
    sunGroup.name = "太阳系"
    const sunGeo = new THREE.SphereGeometry(1.2, 32, 32)
    const sunMat = new THREE.MeshStandardMaterial({
      color: 0xf1c40f, emissive: 0xf39c12, emissiveIntensity: 0.5
    })
    const sunMesh = new THREE.Mesh(sunGeo, sunMat)
    sunMesh.name = "太阳"
    sunGroup.add(sunMesh)

    // 地球公转容器
    earthPivot = new THREE.Group()
    earthPivot.name = "地球公转"
    sunGroup.add(earthPivot)

    // 地球
    const earthGeo = new THREE.SphereGeometry(0.5, 32, 32)
    const earthMat = new THREE.MeshStandardMaterial({ color: 0x3498db })
    earthMesh = new THREE.Mesh(earthGeo, earthMat)
    earthMesh.name = "地球"
    earthMesh.position.x = 4
    earthPivot.add(earthMesh)

    // 月球公转容器（挂载在地球上）
    moonPivot = new THREE.Group()
    moonPivot.name = "月球公转"
    earthMesh.add(moonPivot)

    // 月球
    const moonGeo = new THREE.SphereGeometry(0.2, 32, 32)
    const moonMat = new THREE.MeshStandardMaterial({ color: 0xbdc3c7 })
    moonMesh = new THREE.Mesh(moonGeo, moonMat)
    moonMesh.name = "月球"
    moonMesh.position.x = 1.2
    moonPivot.add(moonMesh)

    // 地球轨道线
    const orbitGeo = new THREE.RingGeometry(3.95, 4.05, 64)
    const orbitMat = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide })
    const orbit = new THREE.Mesh(orbitGeo, orbitMat)
    orbit.rotation.x = -Math.PI / 2
    sunGroup.add(orbit)

    // 月球轨道线
    const moonOrbitGeo = new THREE.RingGeometry(1.15, 1.25, 32)
    const moonOrbitMat = new THREE.MeshBasicMaterial({ color: 0x555555, side: THREE.DoubleSide })
    const moonOrbit = new THREE.Mesh(moonOrbitGeo, moonOrbitMat)
    moonOrbit.rotation.x = -Math.PI / 2
    earthMesh.add(moonOrbit)

    scene.value.add(sunGroup)

    // 灯光
    const ambient = new THREE.AmbientLight(0xffffff, 0.3)
    scene.value.add(ambient)
    const pointLight = new THREE.PointLight(0xffffff, 2, 50)
    pointLight.position.set(0, 0, 0)
    sunGroup.add(pointLight)

    // 演示 traverse
    console.log("=== 场景层级 traverse ===")
    sunGroup.traverse((child) => {
      if (child.isMesh) {
        console.log(`Mesh: ${child.name}, 局部坐标: (${child.position.x.toFixed(1)}, ${child.position.y.toFixed(1)}, ${child.position.z.toFixed(1)})`)
      }
    })

    // 演示 getObjectByName
    const found = sunGroup.getObjectByName("月球")
    console.log("getObjectByName('月球'):", found ? "找到" : "未找到")
  }

  const animateCallback = () => {
    if (!sunGroup) return
    sunGroup.rotation.y += params.sunSpeed
    earthPivot.rotation.y += params.earthOrbitSpeed
    moonPivot.rotation.y += params.moonOrbitSpeed

    if (params.showWorldPos && earthMesh && moonMesh) {
      const worldPos = new THREE.Vector3()
      earthMesh.getWorldPosition(worldPos)
      const moonWorldPos = new THREE.Vector3()
      moonMesh.getWorldPosition(moonWorldPos)
      console.log(
        `地球世界坐标: (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}, ${worldPos.z.toFixed(2)}) ` +
        `月球世界坐标: (${moonWorldPos.x.toFixed(2)}, ${moonWorldPos.y.toFixed(2)}, ${moonWorldPos.z.toFixed(2)})`
      )
    }
  }

  const initGUI = () => {
    gui = new GUI()
    gui.add(params, "sunSpeed", 0, 0.05, 0.001).name("太阳自转速度")
    gui.add(params, "earthOrbitSpeed", 0, 0.1, 0.005).name("地球公转速度")
    gui.add(params, "moonOrbitSpeed", 0, 0.15, 0.005).name("月球公转速度")
    gui.add(params, "showWorldPos").name("显示世界坐标(控制台)")
    gui.add({ reset: () => { params.sunSpeed = 0.005; params.earthOrbitSpeed = 0.02; params.moonOrbitSpeed = 0.05 } }, "reset").name("重置速度")
  }

  onSceneReady(() => {
    createScene()
    initGUI()
    startAnimation(animateCallback)
  })

  onUnmounted(() => {
    gui?.destroy()
    baseDispose()
  })
</script>

<template>
  <PageLayout
    title="🌍 层级关系"
    description="Group 嵌套（太阳-地球-月亮），局部/世界坐标、traverse/getObjectByName"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>☀️ 太阳自转 + 🌍 地球公转 + 🌙 月球公转</li>
          <li>🔗 Group 层级嵌套关系</li>
          <li>📊 traverse 遍历 + getObjectByName 查找</li>
          <li>📐 局部坐标与世界坐标对比</li>
        </ul>
      </div>
    </template>
    <div ref="containerRef" />
  </PageLayout>
</template>
