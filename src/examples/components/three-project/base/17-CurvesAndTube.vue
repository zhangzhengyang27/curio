<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  const containerRef = shallowRef(null)

  const { scene, startAnimation, onSceneReady, dispose: baseDispose } =
    useThreeScene(containerRef, {
      cameraPosition: { x: 5, y: 5, z: 8 },
      enableControls: true,
      controlsConfig: { enableDamping: true, dampingFactor: 0.05 },
      showAxesHelper: true,
      showGridHelper: true
    })

  let gui!: GUI
  let curveObjects: THREE.Object3D[] = []
  let currentGroup = new THREE.Group()

  const params = {
    curveType: "CatmullRomCurve3",
    tubeRadius: 0.08,
    tubeSegments: 64,
    showTube: true,
    showLine: true,
    showPoints: true
  }

  const createCurvePoints: Record<string, () => THREE.Vector3[]> = {
    CatmullRomCurve3: () => [
      new THREE.Vector3(-3, 0, 0),
      new THREE.Vector3(-1, 2, 1),
      new THREE.Vector3(1, -1, -1),
      new THREE.Vector3(2, 1, 2),
      new THREE.Vector3(4, 0, 0)
    ],
    CubicBezierCurve3: () => [
      new THREE.Vector3(-3, 0, 0),
      new THREE.Vector3(-1, 3, 2),
      new THREE.Vector3(2, -2, -1),
      new THREE.Vector3(4, 0, 0)
    ],
    LineCurve3: () => [
      new THREE.Vector3(-3, -1, 0),
      new THREE.Vector3(4, 1, 0)
    ]
  }

  const createCurve = () => {
    if (!scene.value) return

    // 清除旧的
    scene.value.remove(currentGroup)
    currentGroup = new THREE.Group()
    curveObjects = []

    // 创建曲线
    let curve!: THREE.Curve<THREE.Vector3>
    const points = createCurvePoints[params.curveType]()
    switch (params.curveType) {
      case "CatmullRomCurve3":
        curve = new THREE.CatmullRomCurve3(points)
        break
      case "CubicBezierCurve3":
        curve = new THREE.CubicBezierCurve3(points[0], points[1], points[2], points[3])
        break
      case "LineCurve3":
        curve = new THREE.LineCurve3(points[0], points[1])
        break
    }

    // 曲线线条
    const curvePoints = curve.getPoints(100)
    const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints)
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00ff00 })
    const line = new THREE.Line(lineGeo, lineMat)
    line.visible = params.showLine
    currentGroup.add(line)
    curveObjects.push(line)

    // 控制点球体
    const curveAny = curve as any
    const actualPoints = params.curveType === "LineCurve3" ? [curveAny.v0, curveAny.v1] :
      params.curveType === "CubicBezierCurve3"
        ? [curveAny.v0, curveAny.v1, curveAny.v2, curveAny.v3] : points
    actualPoints.forEach((pt: THREE.Vector3, i: number) => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        new THREE.MeshStandardMaterial({ color: i === 0 ? 0xff0000 : i === actualPoints.length - 1 ? 0x0000ff : 0xffff00 })
      )
      sphere.position.copy(pt)
      sphere.visible = params.showPoints
      currentGroup.add(sphere)
      curveObjects.push(sphere)
    })

    // TubeGeometry 管道
    if (params.curveType !== "LineCurve3") {
      const tubeGeo = new THREE.TubeGeometry(curve, params.tubeSegments, params.tubeRadius, 16, false)
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x3498db, transparent: true, opacity: 0.6, side: THREE.DoubleSide
      })
      const tube = new THREE.Mesh(tubeGeo, tubeMat)
      tube.visible = params.showTube
      currentGroup.add(tube)
      curveObjects.push(tube)
    }

    scene.value.add(currentGroup)
  }

  const initGUI = () => {
    gui = new GUI()
    gui.add(params, "curveType", ["CatmullRomCurve3", "CubicBezierCurve3", "LineCurve3"])
      .name("曲线类型").onChange(createCurve)
    gui.add(params, "tubeRadius", 0.01, 0.5, 0.01).name("管道半径").onChange(createCurve)
    gui.add(params, "tubeSegments", 8, 128, 1).name("管道分段").onChange(createCurve)
    gui.add(params, "showLine").name("显示曲线").onChange((v) => {
      if (curveObjects[0]) curveObjects[0].visible = v
    })
    gui.add(params, "showPoints").name("显示控制点").onChange((v) => {
      curveObjects.slice(1, -1).forEach(obj => { if (obj.material) obj.visible = v })
      // 更精准地只切换球体
      currentGroup.children.forEach(c => {
        if (c.isMesh) c.visible = v
      })
    })
    gui.add(params, "showTube").name("显示管道").onChange((v) => {
      currentGroup.children.forEach(c => {
        if (c.isMesh && c.geometry && c.geometry.type === "TubeGeometry") c.visible = v
      })
    })
  }

  onSceneReady(() => {
    if (!scene.value) return
    // 灯光
    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    scene.value.add(ambient)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(5, 10, 7)
    scene.value.add(dirLight)

    createCurve()
    initGUI()
    startAnimation()
  })

  onUnmounted(() => {
    currentGroup.children.forEach(c => {
      if (c.geometry) {
        const geo = c.geometry as THREE.BufferGeometry
        geo.dispose()
      }
      if (c.material) {
        const mat = c.material as THREE.Material
        mat.dispose()
      }
    })
    gui?.destroy()
    baseDispose()
  })
</script>

<template>
  <PageLayout
    title="🌈 曲线与管道"
    description="CatmullRomCurve3 / CubicBezierCurve3 / LineCurve3 可视化与 TubeGeometry"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>📐 三种曲线类型切换</li>
          <li>🔴🟡🔵 彩色控制点（起点红/中间黄/终点蓝）</li>
          <li>🔵 半透明管道几何体</li>
          <li>🎛️ GUI 控制管道半径、分段、显示选项</li>
        </ul>
      </div>
    </template>
    <div ref="containerRef" />
  </PageLayout>
</template>
