<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 注意：本示例不使用 useThreeScene，手动管理 renderer 和多视口

  const containerRef = shallowRef<HTMLDivElement | null>(null)
  let renderer!: THREE.WebGLRenderer, animationId: number | null = null
  const scenes: { scene: THREE.Scene; camera: THREE.Camera; left: number; bottom: number; width: number; height: number; update: () => void }[] = []
  const _cameras: THREE.Camera[] = []

  const init = () => {
    if (!containerRef.value) return
    const w = containerRef.value.clientWidth
    const h = containerRef.value.clientHeight

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setScissorTest(true)
    containerRef.value.appendChild(renderer.domElement)

    const hw = w / 2
    const hh = h / 2

    // --- 视口 1: 透视 - 旋转立方体 ---
    const s1 = new THREE.Scene()
    s1.background = new THREE.Color(0x1a1a2e)
    const c1 = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    c1.position.set(2, 2, 3)
    c1.lookAt(0, 0, 0)
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xe74c3c })
    )
    s1.add(box)
    s1.add(new THREE.AmbientLight(0xffffff, 0.5))
    s1.add(new THREE.DirectionalLight(0xffffff, 1).translateZ(5))
    scenes.push({ scene: s1, camera: c1, left: 0, bottom: hh, width: hw, height: hh, update: () => { box.rotation.x += 0.01; box.rotation.y += 0.01 } })

    // --- 视口 2: 透视 - 球体 ---
    const s2 = new THREE.Scene()
    s2.background = new THREE.Color(0x16213e)
    const c2 = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    c2.position.set(0, 0, 3)
    c2.lookAt(0, 0, 0)
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x3498db })
    )
    s2.add(sphere)
    s2.add(new THREE.AmbientLight(0xffffff, 0.5))
    s2.add(new THREE.DirectionalLight(0xffffff, 1).translateZ(5))
    scenes.push({ scene: s2, camera: c2, left: hw, bottom: hh, width: hw, height: hh, update: () => { sphere.position.y = Math.sin(Date.now() * 0.002) * 0.5 } })

    // --- 视口 3: 正交 - 环面结 ---
    const s3 = new THREE.Scene()
    s3.background = new THREE.Color(0x0f3460)
    const aspect = hw / hh
    const c3 = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 100)
    c3.position.set(3, 2, 3)
    c3.lookAt(0, 0, 0)
    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.8, 0.25, 100, 16),
      new THREE.MeshStandardMaterial({ color: 0x2ecc71 })
    )
    s3.add(knot)
    s3.add(new THREE.AmbientLight(0xffffff, 0.5))
    s3.add(new THREE.DirectionalLight(0xffffff, 1).translateZ(5))
    scenes.push({ scene: s3, camera: c3, left: 0, bottom: 0, width: hw, height: hh, update: () => { knot.rotation.x += 0.01; knot.rotation.z += 0.005 } })

    // --- 视口 4: 透视 - 十二面体 ---
    const s4 = new THREE.Scene()
    s4.background = new THREE.Color(0x533483)
    const c4 = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    c4.position.set(0, 2, 4)
    c4.lookAt(0, 0, 0)
    const dodec = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1),
      new THREE.MeshStandardMaterial({ color: 0xf39c12, wireframe: true })
    )
    s4.add(dodec)
    s4.add(new THREE.AmbientLight(0xffffff, 0.3))
    const pl = new THREE.PointLight(0xffffff, 1, 20)
    pl.position.set(3, 3, 3)
    s4.add(pl)
    scenes.push({ scene: s4, camera: c4, left: hw, bottom: 0, width: hw, height: hh, update: () => { dodec.rotation.y += 0.02; dodec.rotation.x += 0.01 } })

    animate()
  }

  const animate = () => {
    animationId = requestAnimationFrame(animate)
    if (!renderer || !containerRef.value) return

    const w = containerRef.value.clientWidth
    const h = containerRef.value.clientHeight
    renderer.setSize(w, h)

    scenes.forEach((vp) => {
      vp.update()
      renderer.setViewport(vp.left, vp.bottom, vp.width, vp.height)
      renderer.setScissor(vp.left, vp.bottom, vp.width, vp.height)
      renderer.render(vp.scene, vp.camera)
    })
  }

  const handleResize = () => {
    if (!renderer || !containerRef.value) return
    const w = containerRef.value.clientWidth
    const h = containerRef.value.clientHeight
    renderer.setSize(w, h)
    const hw = w / 2, hh = h / 2
    // 更新各视口尺寸
    scenes[0].left = 0; scenes[0].bottom = hh; scenes[0].width = hw; scenes[0].height = hh
    scenes[1].left = hw; scenes[1].bottom = hh; scenes[1].width = hw; scenes[1].height = hh
    scenes[2].left = 0; scenes[2].bottom = 0; scenes[2].width = hw; scenes[2].height = hh
    scenes[3].left = hw; scenes[3].bottom = 0; scenes[3].width = hw; scenes[3].height = hh
  }

  const dispose = () => {
    if (animationId) cancelAnimationFrame(animationId)
    window.removeEventListener("resize", handleResize)
    scenes.forEach(vp => {
      vp.scene.traverse(child => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          const mat = child.material as THREE.Material
          mat.dispose()
        }
      })
    })
    if (renderer) {
      renderer.dispose()
      renderer.domElement.remove()
    }
  }

  onMounted(() => { init(); window.addEventListener("resize", handleResize) })
  onUnmounted(() => { dispose() })
</script>

<template>
  <PageLayout
    title="🔲 多视口渲染"
    description="手动创建 renderer + 4 个相机，四分屏渲染（setViewport / setScissor）"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🔲 四分屏独立渲染</li>
          <li>📷 透视 + 正交相机混合</li>
          <li>✂️ setViewport / setScissor 裁剪区域</li>
          <li>🔄 每个视口独立动画</li>
        </ul>
        <p style="margin-top: 8px; color: #888;">
          注：本示例不使用 useThreeScene，手动管理渲染器和生命周期。
        </p>
      </div>
    </template>
    <div ref="containerRef" />
  </PageLayout>
</template>

<style scoped>
  :deep(canvas) {
    width: 100% !important;
    height: 100% !important;
  }
</style>
