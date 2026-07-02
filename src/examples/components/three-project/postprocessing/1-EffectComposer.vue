<script setup lang="ts">
  /**
   * EffectComposer 后处理基础教程
   * 演示 EffectComposer + RenderPass + ShaderPass 的基本使用
   * 左右分屏对比：左半用 renderer 直接渲染（普通），右半用 EffectComposer 渲染（后处理）
   */
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
  import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
  import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js"
  import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader.js"
  import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js"

  // 容器引用
  const containerRef = shallowRef(null)

  // 后处理相关
  let composer: EffectComposer | null = null
  let gui: GUI | null = null
  const clock = new THREE.Clock()

  // 场景物体引用
  let cube: THREE.Mesh | null = null
  let sphere: THREE.Mesh | null = null
  let torus: THREE.Mesh | null = null

  // GUI 参数
  const params = {
    enabled: true, // 是否启后处理对比
    amount: 0.005, // 色差偏移量
    angle: 0.0 // 色差角度
  }

  // 使用封装的场景
  const {
    scene,
    camera,
    renderer,
    controls: _controls,
    startAnimation,
    handleResize: _handleResize,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    fov: 45,
    cameraPosition: { x: 0, y: 2, z: 6 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 2,
      maxDistance: 15
    },
    showAxesHelper: false,
    showGridHelper: false
  })

  /**
   * 创建场景中的彩色旋转几何体
   */
  const createObjects = () => {
    if (!scene.value) return

    // 立方体 - 红色
    const cubeGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2)
    const cubeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      roughness: 0.3,
      metalness: 0.6
    })
    cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
    cube.position.set(-2, 0, 0)
    scene.value.add(cube)

    // 球体 - 绿色
    const sphereGeometry = new THREE.SphereGeometry(0.8, 32, 32)
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0x44ff44,
      roughness: 0.2,
      metalness: 0.7
    })
    sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.position.set(0, 0, 0)
    scene.value.add(sphere)

    // 圆环 - 蓝色
    const torusGeometry = new THREE.TorusGeometry(0.7, 0.3, 16, 48)
    const torusMaterial = new THREE.MeshStandardMaterial({
      color: 0x4444ff,
      roughness: 0.25,
      metalness: 0.65
    })
    torus = new THREE.Mesh(torusGeometry, torusMaterial)
    torus.position.set(2, 0, 0)
    scene.value.add(torus)
  }

  /**
   * 创建灯光
   */
  const createLights = () => {
    if (!scene.value) return

    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.value.add(ambientLight)

    // 主方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    directionalLight.position.set(5, 5, 5)
    scene.value.add(directionalLight)

    // 辅助点光源 - 暖色调
    const pointLight1 = new THREE.PointLight(0xffaa44, 0.8, 20)
    pointLight1.position.set(-3, 3, 2)
    scene.value.add(pointLight1)

    // 辅助点光源 - 冷色调
    const pointLight2 = new THREE.PointLight(0x4488ff, 0.6, 20)
    pointLight2.position.set(3, -2, 3)
    scene.value.add(pointLight2)
  }

  /**
   * 初始化后处理管线
   */
  const initPostProcessing = () => {
    if (!renderer.value || !scene.value || !camera.value) return

    // 创建 EffectComposer，使用 renderer 作为渲染目标
    composer = new EffectComposer(renderer.value)

    // RenderPass - 基础渲染通道，将场景渲染到纹理
    const renderPass = new RenderPass(scene.value, camera.value)
    composer.addPass(renderPass)

    // ShaderPass - 使用 RGBShiftShader 实现色差效果
    const rgbShiftPass = new ShaderPass(RGBShiftShader)
    rgbShiftPass.uniforms["amount"].value = params.amount
    rgbShiftPass.uniforms["angle"].value = params.angle
    composer.addPass(rgbShiftPass)

    // OutputPass - 确保输出正确的色彩空间
    const outputPass = new OutputPass()
    composer.addPass(outputPass)
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()
    gui.title("后处理控制")

    // 后处理开关
    const controlFolder = gui.addFolder("🎛️ 色差效果")
    controlFolder
      .add(params, "enabled")
      .name("启用后处理对比")
      .onChange(() => {
        console.log(params.enabled ? "已启用后处理对比" : "已关闭后处理对比")
      })

    controlFolder
      .add(params, "amount", 0, 0.02, 0.001)
      .name("色差强度 (amount)")
      .onChange((value) => {
        // 更新 ShaderPass 的 uniform
        if (composer) {
          const rgbShiftPass = composer.passes[1] // ShaderPass 是第二个通道
          if (rgbShiftPass && rgbShiftPass.uniforms) {
            rgbShiftPass.uniforms["amount"].value = value
          }
        }
      })

    controlFolder
      .add(params, "angle", 0, Math.PI * 2, 0.01)
      .name("色差角度 (angle)")
      .onChange((value) => {
        if (composer) {
          const rgbShiftPass = composer.passes[1]
          if (rgbShiftPass && rgbShiftPass.uniforms) {
            rgbShiftPass.uniforms["angle"].value = value
          }
        }
      })

    controlFolder.open()

    // 说明信息
    const infoFolder = gui.addFolder("📖 关于 EffectComposer")
    const info = {
      description: "后处理管线，串联多个渲染通道",
      renderPass: "基础通道，将场景渲染到纹理",
      shaderPass: "自定义着色器通道（色差效果）",
      outputPass: "输出通道，色彩空间校正"
    }
    infoFolder.add(info, "description").name("EffectComposer").disable()
    infoFolder.add(info, "renderPass").name("RenderPass").disable()
    infoFolder.add(info, "shaderPass").name("ShaderPass").disable()
    infoFolder.add(info, "outputPass").name("OutputPass").disable()
    infoFolder.open()
  }

  /**
   * 初始化场景内容
   */
  const initSceneContent = () => {
    if (!scene.value || !renderer.value) return

    // 设置背景颜色
    scene.value.background = new THREE.Color(0x1a1a2e)

    // 创建灯光
    createLights()

    // 创建物体
    createObjects()

    // 初始化后处理管线
    initPostProcessing()

    // 初始化 GUI
    initGUI()

    // 启动动画循环
    startAnimation(() => {
      const elapsed = clock.getElapsedTime()

      // 旋转物体
      if (cube) {
        cube.rotation.x = elapsed * 0.5
        cube.rotation.y = elapsed * 0.7
      }
      if (sphere) {
        sphere.rotation.x = elapsed * 0.3
        sphere.rotation.z = elapsed * 0.5
        sphere.position.y = Math.sin(elapsed) * 0.3
      }
      if (torus) {
        torus.rotation.x = elapsed * 0.4
        torus.rotation.y = elapsed * 0.6
        torus.position.y = Math.sin(elapsed + 1) * 0.3
      }

      // 分屏渲染对比
      if (!composer || !renderer.value || !scene.value || !camera.value) return

      const width = renderer.value.domElement.clientWidth
      const height = renderer.value.domElement.clientHeight

      if (params.enabled) {
        // ===== 分屏模式 =====
        // 左半屏：直接用 renderer 渲染（无后处理）
        renderer.value.setScissorTest(true)

        // 先清除整个画面
        renderer.value.clear()

        // 左半 - 普通渲染
        renderer.value.setViewport(0, 0, width / 2, height)
        renderer.value.setScissor(0, 0, width / 2, height)
        renderer.value.render(scene.value, camera.value)

        // 右半 - 后处理渲染
        // 设置 composer 只渲染右半部分
        composer.setSize(width / 2, height)
        renderer.value.setViewport(width / 2, 0, width / 2, height)
        renderer.value.setScissor(width / 2, 0, width / 2, height)
        composer.render()

        // 恢复设置
        renderer.value.setScissorTest(false)
        // 恢复 composer 尺寸
        composer.setSize(width, height)
      } else {
        // ===== 全屏后处理模式 =====
        renderer.value.setScissorTest(false)
        composer.setSize(width, height)
        composer.render()
      }
    })
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理后处理管线
    if (composer) {
      composer.dispose()
      composer = null
    }

    // 清理场景物体
    if (cube) {
      cube.geometry?.dispose()
      const mat = cube.material
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose())
      } else {
        mat?.dispose()
      }
      cube = null
    }
    if (sphere) {
      sphere.geometry?.dispose()
      const mat = sphere.material
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose())
      } else {
        mat?.dispose()
      }
      sphere = null
    }
    if (torus) {
      torus.geometry?.dispose()
      const mat = torus.material
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose())
      } else {
        mat?.dispose()
      }
      torus = null
    }

    // 清理 GUI
    gui?.destroy()
    gui = null

    // 调用基础清理函数
    baseDispose()
  }

  // 组件挂载后初始化
  onMounted(() => {
    initSceneContent()
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🎨 EffectComposer 后处理基础"
    description="学习 EffectComposer 管线和后处理效果的基本使用方法"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>后处理管线概念：</h3>
        <ul>
          <li>🔗 <strong>EffectComposer</strong> - 后处理管线管理器</li>
          <li>📐 <strong>RenderPass</strong> - 基础渲染通道</li>
          <li>🎨 <strong>ShaderPass</strong> - 自定义着色器通道</li>
          <li>🌈 <strong>RGBShiftShader</strong> - 色差效果</li>
          <li>🖼️ <strong>OutputPass</strong> - 色彩空间校正输出</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 分屏对比说明</p>
        <p>启用对比后，左半屏为普通渲染，右半屏为后处理渲染（带色差效果），可以直观看到后处理带来的视觉差异。</p>
      </div>

      <div class="controls-tip">
        <p>🎮 交互方式：</p>
        <ul>
          <li>🖱️ 鼠标左键拖动 - 旋转视角</li>
          <li>🖱️ 鼠标滚轮 - 缩放</li>
          <li>🖱️ 鼠标右键拖动 - 平移</li>
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
    width: 100%;
    height: 100vh;
    position: relative;
    overflow: hidden;
  }
</style>
