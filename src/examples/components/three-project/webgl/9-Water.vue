<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
  import { Water } from "three/examples/jsm/objects/Water2.js"

  const containerRef = shallowRef<HTMLDivElement | null>(null)

  const { scene, camera, renderer, startAnimation } = useThreeScene(containerRef, {
    fov: 90,
    cameraPosition: { x: 5, y: 5, z: 5 },
    enableControls: true,
    showAxesHelper: false,
    axesHelperSize: 5,
    controlsConfig: {
      enableDamping: true
    }
  })

  let water: Water | null = null
  let gui: GUI | null = null

  const params = {
    toneMappingExposure: 1.0,
    waterColor: "#ffffff",
    scale: 1.0,
    flowX: 1.0,
    flowY: 1.0,
    textureSize: 1024
  }

  const loadEnvironment = () => {
    const loader = new RGBELoader()
    loader
      .loadAsync("/three-project/texture/050.hdr")
      .then((texture: THREE.DataTexture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping
        if (scene.value) {
          scene.value.background = texture
          scene.value.environment = texture
        }
      })
      .catch((e: unknown) => console.error("HDR 加载失败", e))
  }

  const setupLights = () => {
    if (!scene.value) return
    const ambient = new THREE.AmbientLight(0xffffff, 1.5)
    const dir = new THREE.DirectionalLight(0xffffff, 0.6)
    dir.position.set(3, 5, 2)
    scene.value.add(ambient)
    scene.value.add(dir)
  }

  const configureRenderer = () => {
    if (!renderer.value) return
    // r183 API: outputEncoding → outputColorSpace, sRGBEncoding → SRGBColorSpace
    renderer.value.outputColorSpace = THREE.SRGBColorSpace
    renderer.value.toneMapping = THREE.ACESFilmicToneMapping
    renderer.value.toneMappingExposure = params.toneMappingExposure
    renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  const createWaterPlane = () => {
    if (!scene.value) return
    // r183: PlaneBufferGeometry 已合并到 PlaneGeometry
    const geometry = new THREE.PlaneGeometry(6, 3, 1, 1)
    water = new Water(geometry, {
      color: params.waterColor,
      scale: params.scale,
      flowDirection: new THREE.Vector2(params.flowX, params.flowY),
      textureHeight: params.textureSize,
      textureWidth: params.textureSize
    })
    water.rotation.x = -Math.PI / 2
    scene.value.add(water)
  }

  const createGUI = () => {
    gui = new GUI()

    const renderFolder = gui.addFolder("渲染设置")
    renderFolder
      .add(params, "toneMappingExposure", 0, 2, 0.01)
      .name("曝光度")
      .onChange((v: number) => {
        if (renderer.value) renderer.value.toneMappingExposure = v
      })
    renderFolder.open()

    const waterFolder = gui.addFolder("水体设置")
    waterFolder
      .addColor(params, "waterColor")
      .name("颜色")
      .onFinishChange((v: string | number) => {
        if (water && water.material && water.material.uniforms && water.material.uniforms.color && water.material.uniforms.color.value) {
          water.material.uniforms.color.value.set(v)
        }
      })
    waterFolder
      .add(params, "scale", 0.1, 5, 0.1)
      .name("波尺度")
      .onChange((v: number) => {
        if (water && water.material && water.material.uniforms && water.material.uniforms.config && water.material.uniforms.config.value) {
          water.material.uniforms.config.value.x = v
        }
      })
    waterFolder
      .add(params, "flowX", -3, 3, 0.1)
      .name("流向 X")
      .onChange((v: number) => {
        if (
          water &&
          water.material &&
          water.material.uniforms &&
          water.material.uniforms.flowDirection &&
          water.material.uniforms.flowDirection.value
        ) {
          water.material.uniforms.flowDirection.value.x = v
        }
      })
    waterFolder
      .add(params, "flowY", -3, 3, 0.1)
      .name("流向 Y")
      .onChange((v: number) => {
        if (
          water &&
          water.material &&
          water.material.uniforms &&
          water.material.uniforms.flowDirection &&
          water.material.uniforms.flowDirection.value
        ) {
          water.material.uniforms.flowDirection.value.y = v
        }
      })
    waterFolder
      .add(params, "textureSize", 256, 2048, 256)
      .name("纹理大小")
      .onFinishChange((v: number) => {
        if (water && water.geometry) {
          const geometry = water.geometry
          if (scene.value) scene.value.remove(water)
          water.material.dispose()
          water = new Water(geometry, {
            color: params.waterColor,
            scale: params.scale,
            flowDirection: new THREE.Vector2(params.flowX, params.flowY),
            textureHeight: v,
            textureWidth: v
          })
          if (scene.value) scene.value.add(water)
        }
      })
    waterFolder.open()
  }

  const initScene = () => {
    if (!scene.value || !camera.value || !renderer.value) return
    configureRenderer()
    setupLights()
    loadEnvironment()
    createWaterPlane()

    startAnimation(() => {})
    createGUI()
  }

  const cleanup = () => {
    if (gui) {
      gui.destroy()
      gui = null
    }
    if (scene.value && water) {
      scene.value.remove(water)
      water.geometry?.dispose()
      if (water.material) {
        if (Array.isArray(water.material)) water.material.forEach((m: THREE.Material) => m.dispose())
        else water.material.dispose()
      }
      water = null
    }
  }

  onMounted(() => {
    setTimeout(() => initScene(), 100)
  })

  onUnmounted(() => {
    cleanup()
  })
</script>

<template>
  <PageLayout
    title="🛁 水体 Water2"
    description="基于 Water2 与 HDR 环境的水体流动效果"
  >
    <template #content>
      <div class="info-section">
        <h3>💡 技术要点：</h3>
        <ul>
          <li>Water2 创建流动水面，支持流向与尺度调节</li>
          <li>RGBE HDR 环境作为背景与反射光照</li>
          <li>lil-gui 实时调参，统一项目风格</li>
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
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 0;
  }
</style>
