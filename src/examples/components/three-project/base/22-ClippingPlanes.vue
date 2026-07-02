<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  const containerRef = shallowRef(null)

  const { scene, renderer, startAnimation, onSceneReady, dispose: baseDispose } =
    useThreeScene(containerRef, {
      cameraPosition: { x: 4, y: 3, z: 5 },
      enableControls: true,
      controlsConfig: { enableDamping: true, dampingFactor: 0.05 },
      showAxesHelper: true,
      showGridHelper: true
    })

  let gui!: GUI, clipMeshes: THREE.Mesh[] = []
  const clippingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

  const params = {
    normalX: 0, normalY: 1, normalZ: 0,
    constant: 0,
    enabled: true,
    showHelper: true
  }

  const createScene = () => {
    const sceneValue = scene.value
    if (!sceneValue || !renderer.value) return

    // 开启局部裁剪
    renderer.value.localClippingEnabled = true

    // 裁剪平面的可视化辅助
    const planeGeo = new THREE.PlaneGeometry(6, 6)
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0xff0000, transparent: true, opacity: 0.15, side: THREE.DoubleSide,
      depthWrite: false
    })
    const planeHelper = new THREE.Mesh(planeGeo, planeMat)
    planeHelper.rotation.x = -Math.PI / 2
    planeHelper.name = "clipHelper"
    sceneValue.add(planeHelper)

    // 创建一组物体
    const items = [
      { geo: new THREE.BoxGeometry(1.5, 1.5, 1.5), color: 0xe74c3c, pos: [-2, 0.75, 0] },
      { geo: new THREE.SphereGeometry(0.8, 32, 32), color: 0x3498db, pos: [0, 0.8, 0] },
      { geo: new THREE.ConeGeometry(0.7, 1.6, 32), color: 0x2ecc71, pos: [2, 0.8, 0] },
      { geo: new THREE.TorusKnotGeometry(0.5, 0.18, 100, 16), color: 0xf39c12, pos: [0, 0.8, -2] }
    ]

    items.forEach(({ geo, color, pos }) => {
      const mat = new THREE.MeshStandardMaterial({
        color,
        clippingPlanes: [clippingPlane],
        clipShadows: true,
        side: THREE.DoubleSide
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(pos[0], pos[1], pos[2])
      sceneValue.add(mesh)
      clipMeshes.push(mesh)

      // 被裁剪的内部面（Stencil 辅助效果）
      const stencilMat = new THREE.MeshStandardMaterial({
        color,
        clippingPlanes: [clippingPlane],
        clipShadows: true,
        side: THREE.BackSide
      })
      const stencilMesh = new THREE.Mesh(geo, stencilMat)
      stencilMesh.position.set(pos[0], pos[1], pos[2])
      sceneValue.add(stencilMesh)
      clipMeshes.push(stencilMesh)
    })

    // 灯光
    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    sceneValue.add(ambient)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(5, 10, 7)
    sceneValue.add(dirLight)
  }

  const updateClipPlane = () => {
    clippingPlane.normal.set(params.normalX, params.normalY, params.normalZ).normalize()
    clippingPlane.constant = params.constant

    // 更新辅助面
    if (scene.value) {
      const helper = scene.value.getObjectByName("clipHelper")
      if (helper) {
        // 根据法线方向调整辅助面的旋转
        if (params.normalX === 1) helper.rotation.set(0, Math.PI / 2, 0)
        else if (params.normalZ === 1) helper.rotation.set(Math.PI / 2, 0, 0)
        else helper.rotation.set(-Math.PI / 2, 0, 0)
        helper.position.set(0, params.constant, 0)
        helper.visible = params.showHelper
      }
    }
  }

  const animateCallback = () => {
    clipMeshes.forEach((m, i) => {
      if (i % 2 === 0) m.rotation.y += 0.005
    })
  }

  const initGUI = () => {
    gui = new GUI()
    gui.add(params, "enabled").name("启用裁剪").onChange((v: boolean) => {
      ;(clippingPlane as any).enabled = v
    })
    gui.add(params, "normalX", -1, 1, 0.1).name("法线 X").onChange(updateClipPlane)
    gui.add(params, "normalY", -1, 1, 0.1).name("法线 Y").onChange(updateClipPlane)
    gui.add(params, "normalZ", -1, 1, 0.1).name("法线 Z").onChange(updateClipPlane)
    gui.add(params, "constant", -3, 3, 0.1).name("偏移距离").onChange(updateClipPlane)
    gui.add(params, "showHelper").name("显示裁剪面").onChange(updateClipPlane)
  }

  onSceneReady(() => {
    createScene()
    updateClipPlane()
    initGUI()
    startAnimation(animateCallback)
  })

  onUnmounted(() => {
    clipMeshes.forEach(m => {
      m.geometry.dispose()
      const mat = m.material as THREE.Material
      mat.dispose()
    })
    gui?.destroy()
    baseDispose()
  })
</script>

<template>
  <PageLayout
    title="✂️ 剪裁平面"
    description="Clipping Plane 剪裁物体，展示内部截面"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>✂️ 剪裁平面"切开"物体</li>
          <li>🔲 半透明辅助面可视化裁剪位置</li>
          <li>📐 法线方向 + 偏移距离控制</li>
          <li>🖥️ 双面渲染展示内部截面</li>
        </ul>
      </div>
    </template>
    <div ref="containerRef" />
  </PageLayout>
</template>
