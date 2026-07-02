<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"

  // 着色器（相对当前目录）
  import vertexShader from "./shader/water/vertex.glsl?raw"
  import fragmentShader from "./shader/water/fragment.glsl?raw"

  // 容器引用
  const containerRef = shallowRef<HTMLDivElement | null>(null)

  // 使用 Three.js 场景 composable
  const { scene, renderer, startAnimation } = useThreeScene(containerRef, {
    fov: 90,
    cameraPosition: { x: 0.8, y: 1.2, z: 2.2 },
    enableControls: true,
    showAxesHelper: true,
    axesHelperSize: 5,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05
    }
  })

  let shaderMaterial: THREE.ShaderMaterial | null = null
  let gui: GUI | null = null
  let plane: THREE.Mesh | null = null

  // GUI 参数
  const params = {
    uWaresFrequency: 14, // 波纹频率（控制 sin 波的疏密）
    uScale: 0.03, // 位移缩放（控制波高/烟雾强度）
    uXzScale: 1.5, // Z 轴方向的频率缩放（拉伸/压缩波纹）
    uNoiseFrequency: 10, // 噪声频率（控制噪声花纹尺度）
    uNoiseScale: 1.5, // 噪声强度（影响位移贡献）
    uLowColor: "#ff0000", // 低颜色（烟雾底部）
    uHighColor: "#ffff00", // 高颜色（烟雾顶部）
    uXspeed: 1, // XY 波动的时间速度
    uZspeed: 1, // Z 轴方向的时间速度
    uNoiseSpeed: 1, // 噪声随时间的流动速度
    uOpacity: 1 // 透明度
  }

  /**
   * 创建 Shader 材质和平面
   */
  const createWaterSmoke = () => {
    if (!scene.value) return

    // 渲染器透明背景
    if (renderer.value) {
      renderer.value.setClearAlpha(0)
    }

    // 自定义材质
    shaderMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        uWaresFrequency: { value: params.uWaresFrequency },
        uScale: { value: params.uScale },
        uNoiseFrequency: { value: params.uNoiseFrequency },
        uNoiseScale: { value: params.uNoiseScale },
        uXzScale: { value: params.uXzScale },
        uTime: { value: 0 },
        uLowColor: { value: new THREE.Color(params.uLowColor) },
        uHighColor: { value: new THREE.Color(params.uHighColor) },
        uXspeed: { value: params.uXspeed },
        uZspeed: { value: params.uZspeed },
        uNoiseSpeed: { value: params.uNoiseSpeed },
        uOpacity: { value: params.uOpacity }
      }
    })

    // 几何体
    plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 1024, 1024), shaderMaterial)
    plane.rotation.x = -Math.PI / 2
    scene.value.add(plane)
  }

  /**
   * 创建 GUI
   */
  const createGUI = () => {
    gui = new GUI()
    gui.add(params, "uWaresFrequency", 1, 100, 0.1).onChange((v: number) => {
      shaderMaterial!.uniforms.uWaresFrequency.value = v
    })
    gui.add(params, "uScale", 0, 0.2, 0.001).onChange((v: number) => {
      shaderMaterial!.uniforms.uScale.value = v
    })
    gui.add(params, "uNoiseFrequency", 1, 100, 0.1).onChange((v: number) => {
      shaderMaterial!.uniforms.uNoiseFrequency.value = v
    })
    gui.add(params, "uNoiseScale", 0, 5, 0.001).onChange((v: number) => {
      shaderMaterial!.uniforms.uNoiseScale.value = v
    })
    gui.add(params, "uXzScale", 0, 5, 0.1).onChange((v: number) => {
      shaderMaterial!.uniforms.uXzScale.value = v
    })
    gui.addColor(params, "uLowColor").onFinishChange((v: string | number) => {
      shaderMaterial!.uniforms.uLowColor.value = new THREE.Color(v)
    })
    gui.addColor(params, "uHighColor").onFinishChange((v: string | number) => {
      shaderMaterial!.uniforms.uHighColor.value = new THREE.Color(v)
    })
    gui.add(params, "uXspeed", 0, 5, 0.001).onChange((v: number) => {
      shaderMaterial!.uniforms.uXspeed.value = v
    })
    gui.add(params, "uZspeed", 0, 5, 0.001).onChange((v: number) => {
      shaderMaterial!.uniforms.uZspeed.value = v
    })
    gui.add(params, "uNoiseSpeed", 0, 5, 0.001).onChange((v: number) => {
      shaderMaterial!.uniforms.uNoiseSpeed.value = v
    })
    gui.add(params, "uOpacity", 0, 1, 0.01).onChange((v: number) => {
      shaderMaterial!.uniforms.uOpacity.value = v
    })
  }

  /**
   * 初始化
   */
  const init = () => {
    createWaterSmoke()

    // 动画
    const clock = new THREE.Clock()
    startAnimation(() => {
      const elapsedTime = clock.getElapsedTime()
      shaderMaterial!.uniforms.uTime.value = elapsedTime
    })

    // GUI
    createGUI()
  }

  /**
   * 清理资源
   */
  const cleanup = () => {
    if (gui) {
      gui.destroy()
      gui = null
    }
    if (scene.value && plane) {
      scene.value.remove(plane)
      plane.geometry?.dispose()
      if (plane.material) {
        if (Array.isArray(plane.material)) {
          plane.material.forEach((m: THREE.Material) => m.dispose())
        } else {
          plane.material.dispose()
        }
      }
      plane = null
    }
    if (shaderMaterial) {
      shaderMaterial.dispose()
      shaderMaterial = null
    }
  }

  // 生命周期
  onMounted(() => {
    setTimeout(() => {
      init()
    }, 100)
  })

  onUnmounted(() => {
    cleanup()
  })
</script>

<template>
  <PageLayout
    title="💨 水面烟雾效果"
    description="基于顶点噪声与正弦波叠加的水面烟雾着色器"
  >
    <template #content>
      <div class="info-section">
        <h3>💡 技术要点：</h3>
        <ul>
          <li>自定义 ShaderMaterial，叠加 Perlin 噪声与正弦波</li>
          <li>lil-gui 实时调参：频率、强度、速度、透明度与配色</li>
          <li>透明背景渲染，可用于叠加到任意页面布局</li>
        </ul>
      </div>
    </template>

    <!-- Three.js 容器 -->
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
