<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import gsap from "gsap"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
  import { Water } from "three/examples/jsm/objects/Water2.js"

  // 着色器（飞行灯光）
  import vertexShader from "./shader/flylight/vertex.glsl?raw"
  import fragmentShader from "./shader/flylight/fragment.glsl?raw"

  // 烟花类
  import Fireworks from "./firework"

  const containerRef = shallowRef<HTMLDivElement | null>(null)

  const { scene, camera, renderer, controls, startAnimation } = useThreeScene(containerRef, {
    fov: 90,
    cameraPosition: { x: 0, y: 0, z: 20 },
    enableControls: true,
    showAxesHelper: false,
    controlsConfig: {
      enableDamping: true
    }
  })

  const gltfLoader = new GLTFLoader()
  let shaderMaterial: THREE.ShaderMaterial | null = null
  let gui: GUI | null = null
  let water: Water | null = null
  const fireworks: Fireworks[] = []
  const flyLights: { obj: THREE.Object3D; anims: gsap.core.Tween[] }[] = []
  let lastFireTime = 0 // 点击烟花的节流时间戳（ms）
  let instancedMesh: THREE.InstancedMesh | null = null // 实例化飞行灯网格
  let instancedState: {
    basePositions: THREE.Vector3[]
    baseHeights: Float32Array
    radius: Float32Array
    rotSpeed: Float32Array
    floatAmp: Float32Array
    floatSpeed: Float32Array
    tmpMatrix: THREE.Matrix4
  } | null = null // 实例化动画状态缓存

  // GUI 参数
  const params = {
    autoRotate: true,
    autoRotateSpeed: 0.1,
    exposure: 0.1,
    flyLightCount: 100
  }

  const loadEnvironment = () => {
    const rgbe = new RGBELoader()
    rgbe
      .loadAsync("/three-project/texture/2k.hdr")
      .then((texture: any) => {
        texture.mapping = THREE.EquirectangularReflectionMapping
        if (scene.value) {
          scene.value.background = texture
          scene.value.environment = texture
        }
      })
      .catch((e) => console.error("HDR 加载失败", e))
  }

  const createRendererSettings = () => {
    if (!renderer.value) return
    renderer.value.outputColorSpace = THREE.SRGBColorSpace
    renderer.value.toneMapping = THREE.ACESFilmicToneMapping
    renderer.value.toneMappingExposure = params.exposure
  }

  const createWater = () => {
    if (!scene.value) return
    const waterGeometry = new THREE.PlaneGeometry(100, 100)
    water = new Water(waterGeometry, {
      scale: 4,
      textureHeight: 1024,
      textureWidth: 1024
    })
    water.position.y = 1
    water.rotation.x = -Math.PI / 2
    scene.value.add(water)
  }

  const createFlyLightShader = () => {
    shaderMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {},
      side: THREE.DoubleSide
    })
  }

  const loadStaticScene = () => {
    gltfLoader.load(
      "/three-project/model/newyears_min.glb",
      (gltf) => {
        if (scene.value) scene.value.add(gltf.scene)
        createWater()
      },
      undefined,
      (e: any) => console.error("newyears_min.glb 加载失败", e)
    )
  }

  const createFlyingLights = () => {
    gltfLoader.load(
      "/three-project/model/flyLight.glb",
      (gltf: any) => {
        const template = gltf.scene
        const lightBox = template.children[0] as THREE.Mesh | undefined
        if (lightBox) lightBox.material = shaderMaterial!

        for (let i = 0; i < 150; i++) {
          const flyLight = template.clone(true)
          const x = (Math.random() - 0.5) * 300
          const z = (Math.random() - 0.5) * 300
          const y = Math.random() * 60 + 5
          flyLight.position.set(x, y, z)

          const rotAnim = gsap.to(flyLight.rotation, {
            y: 2 * Math.PI,
            duration: 10 + Math.random() * 30,
            repeat: -1
          })
          const posAnim = gsap.to(flyLight.position, {
            x: "+=" + Math.random() * 5,
            y: "+=" + Math.random() * 20,
            yoyo: true,
            duration: 5 + Math.random() * 10,
            repeat: -1
          })

          flyLights.push({ obj: flyLight, anims: [rotAnim, posAnim] })
          if (scene.value) scene.value.add(flyLight)
        }
      },
      undefined,
      (e: any) => console.error("flyLight.glb 加载失败", e)
    )
  }

  // 使用 InstancedMesh 实现飞行灯（替代大量克隆与 GSAP 动画）
  const createInstancedFlyingLights = () => {
    gltfLoader.load(
      "/three-project/model/flyLight.glb",
      (gltf: any) => {
        let mesh: any = null
        gltf.scene.traverse((c: any) => {
          if (!mesh && c.isMesh && c.geometry) mesh = c
        })
        if (!mesh || !mesh.geometry) return

        mesh.material = shaderMaterial!

        const count = Math.max(1, Math.floor(params.flyLightCount))
        instancedMesh = new THREE.InstancedMesh(mesh.geometry, mesh.material, count)
        instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
        instancedMesh.frustumCulled = false

        const basePositions = new Array(count)
        const baseHeights = new Float32Array(count)
        const radius = new Float32Array(count)
        const rotSpeed = new Float32Array(count)
        const floatAmp = new Float32Array(count)
        const floatSpeed = new Float32Array(count)
        const tmpMatrix = new THREE.Matrix4()

        for (let i = 0; i < count; i++) {
          const x = (Math.random() - 0.5) * 300
          const z = (Math.random() - 0.5) * 300
          const y = Math.random() * 60 + 5
          basePositions[i] = new THREE.Vector3(x, 0, z)
          baseHeights[i] = y
          radius[i] = 5 + Math.random() * 10
          rotSpeed[i] = 0.1 + Math.random() * 0.5
          floatAmp[i] = 2 + Math.random() * 6
          floatSpeed[i] = 0.2 + Math.random() * 0.6

          tmpMatrix.makeTranslation(x, y, z)
          instancedMesh.setMatrixAt(i, tmpMatrix)
        }

        instancedState = { basePositions, baseHeights, radius, rotSpeed, floatAmp, floatSpeed, tmpMatrix }
        if (scene.value) scene.value.add(instancedMesh)
      },
      undefined,
      (e: any) => console.error("flyLight.glb 加载失败", e)
    )
  }

  const createGUI = () => {
    gui = new GUI()
    const renderFolder = gui.addFolder("渲染与控制")
    renderFolder
      .add(params, "exposure", 0, 1, 0.01)
      .name("曝光度")
      .onChange((v) => {
        if (renderer.value) renderer.value.toneMappingExposure = v
      })
    renderFolder
      .add(params, "autoRotate")
      .name("自动旋转")
      .onChange((v) => {
        if (controls.value) controls.value.autoRotate = v
      })
    renderFolder
      .add(params, "autoRotateSpeed", 0, 1, 0.01)
      .name("旋转速度")
      .onChange((v) => {
        if (controls.value) controls.value.autoRotateSpeed = v
      })
    renderFolder
      .add(params, "flyLightCount", 10, 300, 1)
      .name("飞行灯数量")
      .onFinishChange(() => {
        console.warn("调整飞行灯数量后建议刷新页面以生效")
      })
    renderFolder.open()
  }

  const onClick = () => {
    const now = performance.now()
    if (now - lastFireTime < 250) return
    lastFireTime = now
    const color = `hsl(${Math.floor(Math.random() * 360)},100%,80%)`
    const position = {
      x: (Math.random() - 0.5) * 40,
      z: -(Math.random() - 0.5) * 40,
      y: 3 + Math.random() * 15
    }
    if (!scene.value || !camera.value) return
    const fw = new Fireworks(color, position)
    fw.addScene(scene.value, camera.value)
    fireworks.push(fw)
  }

  const init = () => {
    loadEnvironment()
    createRendererSettings()
    createFlyLightShader()
    loadStaticScene()
    // 使用实例化飞行灯（性能更好）
    createInstancedFlyingLights()
    if (controls.value) {
      controls.value.autoRotate = params.autoRotate
      controls.value.autoRotateSpeed = params.autoRotateSpeed
    }

    const clock = new THREE.Clock()
    startAnimation(() => {
      // controls 阻尼更新在 composable 内部
      // 更新烟花
      for (let i = fireworks.length - 1; i >= 0; i--) {
        const type = fireworks[i].update()
        if (type === "remove") fireworks.splice(i, 1)
      }

      // 更新 InstancedMesh 飞行灯矩阵
      if (instancedMesh && instancedState) {
        const t = clock.getElapsedTime()
        const { basePositions, baseHeights, radius, rotSpeed, floatAmp, floatSpeed, tmpMatrix } = instancedState
        for (let i = 0; i < instancedMesh.count; i++) {
          const base = basePositions[i]
          const angle = t * rotSpeed[i] + i * 0.1
          const y = baseHeights[i] + Math.sin(t * floatSpeed[i] + i) * floatAmp[i]
          const x = base.x + Math.cos(angle) * radius[i]
          const z = base.z + Math.sin(angle) * radius[i]
          tmpMatrix.makeTranslation(x, y, z)
          instancedMesh.setMatrixAt(i, tmpMatrix)
        }
        instancedMesh.instanceMatrix.needsUpdate = true
      }
    })

    createGUI()
    window.addEventListener("click", onClick)
  }

  const cleanup = () => {
    window.removeEventListener("click", onClick)
    if (gui) {
      gui.destroy()
      gui = null
    }
    // 清理飞行灯光
    flyLights.forEach(({ obj, anims }) => {
      anims.forEach((a) => a.kill())
      if (scene.value) scene.value.remove(obj)
      obj.traverse((c) => {
        const mesh = c as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        if (mesh.material) {
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose())
          else mesh.material.dispose()
        }
      })
    })
    flyLights.length = 0

    // 清理水面
    if (scene.value && water) {
      scene.value.remove(water)
      water.geometry?.dispose()
      if (water.material) {
        if (Array.isArray(water.material)) water.material.forEach((m) => m.dispose())
        else water.material.dispose()
      }
      water = null
    }

    // 停止烟花（类内部自管资源，这里只清数组）
    fireworks.length = 0
  }

  onMounted(() => {
    setTimeout(() => init(), 100)
  })
  onUnmounted(() => cleanup())
</script>

<template>
  <PageLayout
    title="🎆 新年场景与烟花"
    description="HDR 场景 + Water2 水面 + 飞行灯光 Shader + 点击烟花"
  >
    <div
      ref="containerRef"
      class="three-container"
    />
  </PageLayout>
</template>

<style scoped>
  .three-container {
    width: 100vw;
    height: 100vh;
  }
</style>
