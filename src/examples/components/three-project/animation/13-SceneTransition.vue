<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import gsap from "gsap"

  const containerRef = shallowRef<HTMLDivElement | null>(null)
  let gui: GUI | null = null
  const sceneGroups: THREE.Group[] = []
  let currentIndex = 0
  let isAnimating = false

  const params = {
    transitionType: 0,
    duration: 1
  }

  const transitionNames = ["💫 淡入淡出", "📏 缩放过渡", "➡️ 位移过渡"]

  const { scene, renderer, startAnimation, dispose: baseDispose } =
    useThreeScene(containerRef, {
      fov: 50,
      cameraPosition: { x: 0, y: 3, z: 8 },
      enableControls: true,
      controlsConfig: { enableDamping: true, dampingFactor: 0.05 },
      showAxesHelper: false,
      showGridHelper: true
    })

  const createScene1 = () => {
    const group = new THREE.Group()
    // 圆柱 + 环的组合
    const cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 2, 32),
      new THREE.MeshStandardMaterial({ color: 0x4488ff, metalness: 0.6, roughness: 0.3 })
    )
    cylinder.position.y = 1
    group.add(cylinder)

    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(1.2, 0.1, 16, 48),
      new THREE.MeshStandardMaterial({ color: 0x88ccff, metalness: 0.8, roughness: 0.2 })
    )
    torus.position.y = 2.2
    torus.rotation.x = Math.PI / 2
    group.add(torus)
    return group
  }

  const createScene2 = () => {
    const group = new THREE.Group()
    // 立方体组合
    const colors = [0xff4444, 0x44ff44, 0x4444ff]
    colors.forEach((color, i) => {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.8, 0.8),
        new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.4 })
      )
      box.position.set(
        Math.cos((i * 2 * Math.PI) / 3) * 1,
        0.4 + (i % 2) * 0.8,
        Math.sin((i * 2 * Math.PI) / 3) * 1
      )
      box.rotation.y = (i * Math.PI) / 3
      group.add(box)
    })

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffff88, emissiveIntensity: 0.5 })
    )
    sphere.position.y = 2
    group.add(sphere)
    return group
  }

  const createScene3 = () => {
    const group = new THREE.Group()
    // 金字塔 + 螺旋
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 2, 4),
      new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.7, roughness: 0.2 })
    )
    cone.position.y = 1
    cone.rotation.y = Math.PI / 4
    group.add(cone)

    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.4, 0.12, 64, 8, 2, 3),
      new THREE.MeshStandardMaterial({ color: 0xff6600, metalness: 0.6, roughness: 0.3 })
    )
    knot.position.y = 2.5
    group.add(knot)

    return group
  }

  const initScenes = (): void => {
    if (!scene.value) return
    const creators = [createScene1, createScene2, createScene3]
    creators.forEach((createFn) => {
      const group = createFn()
      group.visible = false
      scene.value!.add(group)
      sceneGroups.push(group)
    })
    // 显示第一个场景
    sceneGroups[0].visible = true
  }

  const setMaterialOpacity = (group: THREE.Group, opacity: number): void => {
    group.traverse((child: THREE.Object3D) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh && mesh.material) {
        const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
        mat.transparent = opacity < 1
        mat.opacity = opacity
      }
    })
  }

  const doTransition = (toIndex: number): void => {
    if (isAnimating || toIndex === currentIndex || !scene.value) return
    isAnimating = true
    const fromGroup = sceneGroups[currentIndex]
    const toGroup = sceneGroups[toIndex]
    const duration = params.duration
    const type = params.transitionType

    // 预设目标场景
    toGroup.visible = true
    setMaterialOpacity(toGroup, type === 0 ? 0 : 1)

    if (type === 0) {
      // 淡入淡出
      setMaterialOpacity(fromGroup, 1)
      const tl = gsap.timeline({
        onComplete: () => {
          fromGroup.visible = false
          setMaterialOpacity(toGroup, 1)
          setMaterialOpacity(fromGroup, 1)
          currentIndex = toIndex
          isAnimating = false
        }
      })
      tl.to(
        { opacity: 1 },
        { opacity: 0, duration: duration / 2, ease: "power2.inOut", onUpdate() {
          setMaterialOpacity(fromGroup, this.targets()[0].opacity)
        }}
      )
      tl.to(
        { opacity: 0 },
        { opacity: 1, duration: duration / 2, ease: "power2.inOut", onUpdate() {
          setMaterialOpacity(toGroup, this.targets()[0].opacity)
        }}
      )
    } else if (type === 1) {
      // 缩放过渡
      toGroup.scale.set(0.01, 0.01, 0.01)
      const tl = gsap.timeline({
        onComplete: () => {
          fromGroup.visible = false
          fromGroup.scale.set(1, 1, 1)
          toGroup.scale.set(1, 1, 1)
          currentIndex = toIndex
          isAnimating = false
        }
      })
      tl.to(fromGroup.scale, { x: 0.01, y: 0.01, z: 0.01, duration: duration / 2, ease: "power2.in" })
      tl.to(toGroup.scale, { x: 1, y: 1, z: 1, duration: duration / 2, ease: "back.out(1.5)" })
    } else {
      // 位移过渡（从左侧滑入）
      toGroup.position.x = 8
      const tl = gsap.timeline({
        onComplete: () => {
          fromGroup.visible = false
          fromGroup.position.x = 0
          toGroup.position.x = 0
          currentIndex = toIndex
          isAnimating = false
        }
      })
      tl.to(fromGroup.position, { x: -8, duration: duration / 2, ease: "power2.in" })
      tl.to(toGroup.position, { x: 0, duration: duration / 2, ease: "power2.out" })
    }
  }

  const initGUI = () => {
    gui = new GUI()
    gui.title("场景过渡控制")

    const folder = gui.addFolder("🎬 过渡控制")
    folder.add(params, "transitionType", {
      [transitionNames[0]]: 0,
      [transitionNames[1]]: 1,
      [transitionNames[2]]: 2
    }).name("过渡类型")
    folder.add(params, "duration", 0.3, 3, 0.1).name("过渡时长")

    const eventObj = {
      scene1: () => doTransition(0),
      scene2: () => doTransition(1),
      scene3: () => doTransition(2),
      next: () => doTransition((currentIndex + 1) % sceneGroups.length)
    }
    folder.add(eventObj, "scene1").name("➡️ 场景1 (圆柱+环)")
    folder.add(eventObj, "scene2").name("➡️ 场景2 (立方体组合)")
    folder.add(eventObj, "scene3").name("➡️ 场景3 (金字塔+环结)")
    folder.add(eventObj, "next").name("⏭️ 下一个场景")
    folder.open()
  }

  const initScene = () => {
    if (!scene.value || !renderer.value) return
    scene.value.background = new THREE.Color(0x111122)
    scene.value.add(new THREE.AmbientLight(0x404060, 2))

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5)
    dirLight.position.set(5, 8, 5)
    scene.value.add(dirLight)

    const pointLight = new THREE.PointLight(0x6688ff, 1.5, 20)
    pointLight.position.set(-3, 4, -3)
    scene.value.add(pointLight)

    initScenes()
    initGUI()

    startAnimation(() => {
      sceneGroups.forEach((group, i) => {
        if (!group.visible) return
        group.children.forEach((child, j) => {
          child.rotation.y += 0.003 * (j + 1) * (i % 2 === 0 ? 1 : -1)
          if (child.position.y > 0.5) {
            child.position.y += Math.sin(Date.now() * 0.001 + i + j) * 0.002
          }
        })
      })
    })
  }

  onMounted(() => initScene())

  /**
   * 完整释放 Group 中所有 Three.js 资源（geometry / material / texture）
   */
  const disposeGroup = (group: THREE.Group): void => {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose())
        } else if (child.material) {
          child.material.dispose()
        }
      }
    })
  }

  onUnmounted(() => {
    // 停止所有 GSAP 动画
    gsap.killTweensOf("*")

    // 完整释放所有场景组的 GPU 资源
    sceneGroups.forEach((group) => {
      disposeGroup(group)
      scene.value?.remove(group)
    })
    sceneGroups.length = 0

    // 销毁 GUI
    gui?.destroy()
    gui = null

    // 基础清理（renderer / controls / 场景自身）
    baseDispose()
  })
</script>

<template>
  <PageLayout
    title="🔄 场景过渡动画"
    description="多种场景切换过渡效果：淡入淡出、缩放、位移"
  >
    <template #content>
      <div class="features">
        <h3>场景过渡动画：</h3>
        <ul>
          <li>💫 <strong>淡入淡出</strong> - opacity 从 0 到 1 渐变</li>
          <li>📏 <strong>缩放过渡</strong> - 从 0 放大到 1</li>
          <li>➡️ <strong>位移过渡</strong> - 从侧面滑入</li>
          <li>🎬 GSAP Timeline 编排过渡序列</li>
          <li>🎯 3 个不同几何体场景</li>
          <li>⏱️ 可调过渡时长</li>
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
