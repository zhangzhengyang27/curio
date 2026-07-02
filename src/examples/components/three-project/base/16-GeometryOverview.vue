<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  const containerRef = shallowRef(null)

  const { scene, camera, renderer, startAnimation, onSceneReady, dispose: baseDispose } =
    useThreeScene(containerRef, {
      cameraPosition: { x: 8, y: 6, z: 12 },
      enableControls: true,
      controlsConfig: { enableDamping: true, dampingFactor: 0.05 },
      showGridHelper: true
    })

  let gui!: GUI, meshes: THREE.Mesh[] = [], raycaster!: THREE.Raycaster, mouse!: THREE.Vector2
    let selectedMesh: THREE.Mesh | null = null
    let clickListenerTimeout: ReturnType<typeof setTimeout> | null = null

  const colors = [
    0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6,
    0x1abc9c, 0xe67e22, 0x2980b9, 0xc0392b, 0x27ae60,
    0x8e44ad, 0xd35400, 0x16a085, 0xf1c40f, 0x7f8c8d
  ]

  const geometries = [
    { name: "BoxGeometry", create: () => new THREE.BoxGeometry(1, 1, 1) },
    { name: "SphereGeometry", create: () => new THREE.SphereGeometry(0.6, 32, 32) },
    { name: "ConeGeometry", create: () => new THREE.ConeGeometry(0.5, 1.2, 32) },
    { name: "CylinderGeometry", create: () => new THREE.CylinderGeometry(0.4, 0.4, 1.2, 32) },
    { name: "TorusGeometry", create: () => new THREE.TorusGeometry(0.5, 0.2, 16, 48) },
    { name: "TorusKnotGeometry", create: () => new THREE.TorusKnotGeometry(0.5, 0.15, 100, 16) },
    { name: "DodecahedronGeometry", create: () => new THREE.DodecahedronGeometry(0.6) },
    { name: "IcosahedronGeometry", create: () => new THREE.IcosahedronGeometry(0.6) },
    { name: "OctahedronGeometry", create: () => new THREE.OctahedronGeometry(0.6) },
    { name: "TetrahedronGeometry", create: () => new THREE.TetrahedronGeometry(0.6) },
    { name: "CircleGeometry", create: () => new THREE.CircleGeometry(0.5, 32) },
    { name: "RingGeometry", create: () => new THREE.RingGeometry(0.3, 0.6, 32) },
    { name: "PlaneGeometry", create: () => new THREE.PlaneGeometry(1, 1) },
    { name: "CapsuleGeometry", create: () => new THREE.CapsuleGeometry(0.3, 0.6, 16, 32) },
    { name: "LatheGeometry", create: () => {
      const pts: THREE.Vector2[] = []
      for (let i = 0; i < 12; i++) {
        const t = i / 11
        pts.push(new THREE.Vector2(Math.sin(t * Math.PI) * 0.4 + 0.1, t * 1.2))
      }
      return new THREE.LatheGeometry(pts, 32)
    }},
    { name: "PolyhedronGeometry", create: () => new THREE.PolyhedronGeometry(
      [0,1,0, 1,-1,1, -1,-1,1, -1,-1,-1, 1,-1,-1], [0,1,2, 0,2,3, 0,3,4, 0,4,1, 5,2,1, 5,3,2, 5,4,3, 5,1,4]
    )}
  ]

  const createGeometries = () => {
    const sceneValue = scene.value
    if (!sceneValue) return
    const cols = 4
    const spacing = 2.2
    meshes = geometries.map((item, i) => {
      const geo = item.create()
      const mat = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        metalness: 0.3,
        roughness: 0.5
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.name = item.name
      const row = Math.floor(i / cols)
      const col = i % cols
      mesh.position.set(col * spacing - (cols - 1) * spacing / 2, row * spacing - 0.5, 0)
      sceneValue.add(mesh)
      return mesh
    })

    // 添加环境光和方向光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    sceneValue.add(ambientLight)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(5, 10, 7)
    sceneValue.add(dirLight)
  }

  const initRaycaster = () => {
    raycaster = new THREE.Raycaster()
    mouse = new THREE.Vector2()
  }

  const handleClick = (event: MouseEvent) => {
    if (!camera.value || !renderer.value) return
    const rect = renderer.value.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(mouse, camera.value)
    const intersects = raycaster.intersectObjects(meshes)

    // 恢复上一个选中
    if (selectedMesh) {
      const prevMat = selectedMesh.material as THREE.MeshStandardMaterial
      prevMat.emissive!.setHex(0x000000)
      selectedMesh = null
    }
    if (intersects.length > 0) {
      const obj = intersects[0].object as THREE.Mesh
      const mat = obj.material as THREE.MeshStandardMaterial
      mat.emissive!.setHex(0x333333)
      selectedMesh = obj
      console.log("选中几何体:", obj.name)
    }
  }

  const initGUI = () => {
    gui = new GUI()
    const params = { wireframe: false, autoRotate: true }
    gui.add(params, "wireframe").name("线框模式").onChange((v: boolean) => {
      meshes.forEach(m => {
        const mat = m.material as THREE.MeshStandardMaterial
        mat.wireframe = v
      })
    })
    gui.add(params, "autoRotate").name("自动旋转")
  }

  const animateCallback = () => {
    if (!gui) return
    const params = gui.controllers.find(c => c._name === "自动旋转")
    if (params && params.getValue()) {
      meshes.forEach((m, i) => {
        m.rotation.y += 0.005 + i * 0.0005
        m.rotation.x += 0.003
      })
    }
  }

  onSceneReady(() => {
    createGeometries()
    initRaycaster()
    initGUI()
    startAnimation(animateCallback)
  })

  onMounted(() => {
    clickListenerTimeout = setTimeout(() => window.addEventListener("click", handleClick), 100)
  })

  onUnmounted(() => {
    if (clickListenerTimeout) {
      clearTimeout(clickListenerTimeout)
      clickListenerTimeout = null
    }
    window.removeEventListener("click", handleClick)
    meshes.forEach(m => {
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
    title="📦 几何体总览"
    description="展示 15+ Three.js 内置几何体，点击查看名称"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>📦 16 种内置几何体展示</li>
          <li>🖱️ 点击高亮并显示几何体名称（控制台）</li>
          <li>🎛️ GUI 控制线框和自动旋转</li>
          <li>🎨 不同颜色区分各几何体</li>
        </ul>
      </div>
    </template>
    <div ref="containerRef" />
  </PageLayout>
</template>
