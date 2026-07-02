<!-- @ts-nocheck -->
<script setup>
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import gsap from "gsap"

  const containerRef = shallowRef(null)
  let gui = null
  let pathLine = null
  let controlPointMeshes = []
  let sceneObjects = []

  const params = {
    progress: 0,
    isPlaying: false,
    speed: 0.5,
    loop: true
  }

  // 相机路径控制点
  const controlPoints = [
    new THREE.Vector3(-10, 3, -10),
    new THREE.Vector3(-5, 6, -2),
    new THREE.Vector3(0, 2, 0),
    new THREE.Vector3(5, 5, 2),
    new THREE.Vector3(10, 3, -10)
  ]

  const { scene, camera, renderer, controls, startAnimation, dispose: baseDispose } =
    useThreeScene(containerRef, {
      fov: 60,
      cameraPosition: { x: 0, y: 2, z: 0 },
      enableControls: false,
      showAxesHelper: false,
      showGridHelper: true
    })

  const createPath = () => {
    if (!scene.value) return
    const curve = new THREE.CatmullRomCurve3(controlPoints, false, "catmullrom", 0.5)

    // 路径可视化
    const points = curve.getPoints(200)
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00ff88, linewidth: 2 })
    pathLine = new THREE.Line(lineGeo, lineMat)
    scene.value.add(pathLine)

    // 控制点标记
    const sphereGeo = new THREE.SphereGeometry(0.2, 16, 16)
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xff2222, emissiveIntensity: 0.3 })
    controlPoints.forEach((p) => {
      const sphere = new THREE.Mesh(sphereGeo, sphereMat)
      sphere.position.copy(p)
      scene.value.add(sphere)
      controlPointMeshes.push(sphere)
    })
  }

  const createSceneObjects = () => {
    if (!scene.value) return
    // 沿途放置不同物体
    const objects = [
      { geo: new THREE.BoxGeometry(1, 1, 1), color: 0x4488ff, pos: [-7, 0.5, -6] },
      { geo: new THREE.TorusKnotGeometry(0.5, 0.15, 64, 8), color: 0xff8844, pos: [-2, 1, -1] },
      { geo: new THREE.ConeGeometry(0.5, 1.5, 8), color: 0x44ff88, pos: [2.5, 0.75, 1] },
      { geo: new THREE.OctahedronGeometry(0.6), color: 0xff44ff, pos: [7, 0.6, -6] },
      { geo: new THREE.DodecahedronGeometry(0.5), color: 0xffff44, pos: [0, 1, 0] }
    ]
    objects.forEach(({ geo, color, pos }) => {
      const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.3 })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(...pos)
      mesh.castShadow = true
      scene.value.add(mesh)
      sceneObjects.push(mesh)
    })
  }

  const createLights = () => {
    if (!scene.value) return
    scene.value.background = new THREE.Color(0x0d1117)
    scene.value.add(new THREE.AmbientLight(0x334455, 2))
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5)
    dirLight.position.set(5, 10, 5)
    scene.value.add(dirLight)
    const pointLight = new THREE.PointLight(0x00ff88, 2, 30)
    pointLight.position.set(0, 5, 0)
    scene.value.add(pointLight)
  }

  const initGUI = () => {
    gui = new GUI()
    gui.title("相机路径动画控制")

    const folder = gui.addFolder("🎬 动画控制")
    folder.add(params, "isPlaying").name("▶ 播放/暂停").onChange((v) => {
      if (v) playAnimation()
    })
    folder.add(params, "speed", 0.1, 2, 0.1).name("速度")
    folder.add(params, "loop").name("循环播放")
    folder.open()

    const eventObj = {
      reset: () => {
        params.progress = 0
        if (camera.value) camera.value.position.copy(controlPoints[0])
        gsap.killTweensOf(params)
        params.isPlaying = false
      }
    }
    folder.add(eventObj, "reset").name("⏹ 重置")
  }

  const playAnimation = () => {
    const duration = (1 - params.progress) / params.speed
    gsap.killTweensOf(params)
    gsap.to(params, {
      progress: 1,
      duration: Math.max(duration, 0.1),
      ease: "none",
      repeat: params.loop ? -1 : 0,
      onComplete: () => { if (!params.loop) params.isPlaying = false },
      onUpdate: () => updateCameraPosition(params.progress)
    })
  }

  const updateCameraPosition = (t) => {
    if (!camera.value) return
    const curve = new THREE.CatmullRomCurve3(controlPoints, false, "catmullrom", 0.5)
    const clampedT = Math.max(0, Math.min(1, t))
    const pos = curve.getPointAt(clampedT)
    camera.value.position.copy(pos)
    // 看向路径前方一点
    const lookT = Math.min(1, clampedT + 0.05)
    const lookAt = curve.getPointAt(lookT)
    camera.value.lookAt(lookAt)
  }

  const initScene = () => {
    if (!scene.value || !renderer.value) return
    createLights()
    createPath()
    createSceneObjects()
    updateCameraPosition(0)
    initGUI()

    startAnimation(() => {
      // 旋转沿途物体
      sceneObjects.forEach((obj, i) => {
        obj.rotation.y += 0.005 * (i % 2 === 0 ? 1 : -1)
        obj.rotation.x += 0.003 * (i % 3 === 0 ? 1 : -1)
      })
    })
  }

  onMounted(() => initScene())

  onUnmounted(() => {
    gsap.killTweensOf(params)
    gui?.destroy()
    gui = null
    pathLine = null
    controlPointMeshes = []
    sceneObjects = []
    baseDispose()
  })
</script>

<template>
  <PageLayout
    title="🎥 相机路径动画"
    description="使用 CatmullRomCurve3 创建3D路径，相机沿路径平滑移动"
  >
    <template #content>
      <div class="features">
        <h3>相机路径动画：</h3>
        <ul>
          <li>🛤️ <strong>CatmullRomCurve3</strong> - 创建平滑3D曲线</li>
          <li>📷 相机沿路径匀速移动</li>
          <li>🔴 控制点用红色球体标记</li>
          <li>🟢 路径用绿色线条可视化</li>
          <li>🎬 GSAP 驱动平滑动画</li>
          <li>🔄 支持循环播放和速度控制</li>
        </ul>
      </div>
    </template>
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
