<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
  import gsap from "gsap"
  import vertexShader from "./shader/flylight/vertex.glsl?raw"
  import fragmentShader from "./shader/flylight/fragment.glsl?raw"

  // 容器引用
  const containerRef = shallowRef<HTMLDivElement | null>(null)

  // 使用 Three.js 场景 composable
  const { scene, camera, renderer, controls, startAnimation } = useThreeScene(containerRef, {
    fov: 90,
    cameraPosition: { x: 0, y: 0, z: 2 },
    enableControls: true,
    showAxesHelper: false,
    axesHelperSize: 5,
    showGridHelper: false,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05
    }
  })

  let shaderMaterial: THREE.ShaderMaterial | null = null
  const gltfLoader = new GLTFLoader()
  let gui: GUI | null = null
  const flyingLights: THREE.Object3D[] = [] // 飞行灯光数组
  const animations: gsap.core.Tween[] = [] // 动画时间轴数组

  // GUI 参数
  const params = {
    lightCount: 5,
    autoRotate: true,
    autoRotateSpeed: 0.1,
    toneMappingExposure: 0.2
  }

  /**
   * 加载 HDR 环境贴图
   */
  const loadEnvironment = () => {
    const rgbeLoader = new RGBELoader()

    rgbeLoader
      .loadAsync("/three-project/texture/2k.hdr")
      .then((texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping
        if (scene.value) {
          scene.value.background = texture
          scene.value.environment = texture
        }
      })
      .catch((error) => {
        console.error("Failed to load HDR texture:", error)
      })
  }

  /**
   * 创建着色器材质
   */
  const createShaderMaterial = () => {
    shaderMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {},
      side: THREE.DoubleSide
    })
  }

  /**
   * 加载并创建飞行灯光
   */
  const loadFlyingLights = () => {
    gltfLoader.load(
      "/three-project/model/flyLight.glb",
      (gltf: any) => {
        console.log("GLTF loaded:", gltf)

        // 获取灯箱对象并应用着色器材质
        const lightBox = gltf.scene.children[1] as THREE.Mesh
        if (lightBox && shaderMaterial) {
          lightBox.material = shaderMaterial
        }

        // 创建多个飞行灯光
        for (let i = 0; i < params.lightCount; i++) {
          const flyLight = gltf.scene.clone(true)

          // 随机位置
          const x = (Math.random() - 0.5) * 300
          const z = (Math.random() - 0.5) * 300
          const y = Math.random() * 60 + 25
          flyLight.position.set(x, y, z)

          // 旋转动画
          const rotationAnim = gsap.to(flyLight.rotation, {
            y: 2 * Math.PI,
            duration: 10 + Math.random() * 30,
            repeat: -1,
            ease: "none"
          })

          // 位置浮动动画
          const positionAnim = gsap.to(flyLight.position, {
            x: "+=" + Math.random() * 5,
            y: "+=" + Math.random() * 20,
            yoyo: true,
            duration: 5 + Math.random() * 10,
            repeat: -1,
            ease: "sine.inOut"
          })

          // 保存动画引用
          animations.push(rotationAnim, positionAnim)
          flyingLights.push(flyLight)

          if (scene.value) {
            scene.value.add(flyLight)
          }
        }

        console.log(`Created ${params.lightCount} flying lights`)
      },
      (progress: { loaded: number; total: number }) => {
        console.log("Loading progress:", (progress.loaded / progress.total) * 100 + "%")
      },
      (error: unknown) => {
        console.error("Failed to load GLTF model:", error)
      }
    )
  }

  /**
   * 配置渲染器
   */
  const configureRenderer = () => {
    if (!renderer.value) return

    renderer.value.outputColorSpace = THREE.SRGBColorSpace
    renderer.value.toneMapping = THREE.ACESFilmicToneMapping
    renderer.value.toneMappingExposure = params.toneMappingExposure
  }

  /**
   * 配置轨道控制器
   */
  const configureControls = () => {
    if (!controls.value) return

    controls.value.autoRotate = params.autoRotate
    controls.value.autoRotateSpeed = params.autoRotateSpeed
    controls.value.maxPolarAngle = (Math.PI / 3) * 2
    controls.value.minPolarAngle = (Math.PI / 3) * 2
  }

  /**
   * 创建 GUI 控制器
   */
  const createGUI = () => {
    gui = new GUI()

    const renderFolder = gui.addFolder("渲染设置")
    renderFolder
      .add(params, "toneMappingExposure", 0, 2, 0.01)
      .name("曝光度")
      .onChange((value) => {
        if (renderer.value) {
          renderer.value.toneMappingExposure = value
        }
      })
    renderFolder.open()

    const controlsFolder = gui.addFolder("控制器设置")
    controlsFolder
      .add(params, "autoRotate")
      .name("自动旋转")
      .onChange((value) => {
        if (controls.value) {
          controls.value.autoRotate = value
        }
      })
    controlsFolder
      .add(params, "autoRotateSpeed", 0, 1, 0.01)
      .name("旋转速度")
      .onChange((value) => {
        if (controls.value) {
          controls.value.autoRotateSpeed = value
        }
      })
    controlsFolder.open()
  }

  /**
   * 初始化场景
   */
  const initScene = () => {
    if (!scene.value || !camera.value || !renderer.value) return

    // 配置渲染器
    configureRenderer()

    // 配置控制器
    configureControls()

    // 加载环境贴图
    loadEnvironment()

    // 创建着色器材质
    createShaderMaterial()

    // 加载飞行灯光
    loadFlyingLights()

    // 创建 GUI
    createGUI()

    // 启动动画循环
    startAnimation(() => {
      // 控制器自动更新在 useThreeScene 中处理
    })
  }

  /**
   * 清理资源
   */
  const cleanup = () => {
    // 停止所有 GSAP 动画
    animations.forEach((anim) => {
      anim.kill()
    })
    animations.length = 0

    // 清理飞行灯光
    flyingLights.forEach((light) => {
      if (scene.value) {
        scene.value.remove(light)
      }
      // 清理几何体和材质
      light.traverse((child: THREE.Object3D) => {
        const mesh = child as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const mat = mesh.material
        if (mat) {
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
          else mat.dispose()
        }
      })
    })
    flyingLights.length = 0

    // 清理着色器材质
    if (shaderMaterial) {
      shaderMaterial.dispose()
    }

    // 销毁 GUI
    if (gui) {
      gui.destroy()
      gui = null
    }
  }

  // 组件挂载
  onMounted(() => {
    setTimeout(() => {
      initScene()
    }, 100)
  })

  // 组件卸载
  onUnmounted(() => {
    cleanup()
  })
</script>

<template>
  <PageLayout
    title="✨ 飞行灯光效果"
    description="使用着色器和 GSAP 动画实现梦幻飞行灯光场景"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>✨ <strong>飞行灯光</strong> - 150 个随机分布的发光物体</li>
          <li>🎨 <strong>自定义着色器</strong> - 使用 ShaderMaterial 创建特殊发光效果</li>
          <li>🎬 <strong>GSAP 动画</strong> - 平滑的旋转和浮动动画</li>
          <li>🌅 <strong>HDR 环境贴图</strong> - 真实的环境光照和反射</li>
          <li>🎛️ <strong>色调映射</strong> - ACES Filmic 色调映射增强视觉效果</li>
          <li>🎮 <strong>轨道控制器</strong> - 自动旋转和交互控制</li>
          <li>📦 <strong>GLTF 模型加载</strong> - 加载 3D 灯光模型</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 技术要点：</h3>
        <ul>
          <li><strong>GLTF 模型克隆</strong>：使用 <code>gltf.scene.clone(true)</code> 创建多个实例</li>
          <li><strong>随机分布</strong>：x、z 范围 -150 到 150，y 范围 25 到 85</li>
          <li>
            <strong>GSAP 动画</strong>：
            <ul>
              <li>旋转动画：10-40 秒完成一圈，无限循环</li>
              <li>浮动动画：5-15 秒往返，使用 yoyo 模式</li>
            </ul>
          </li>
          <li><strong>色调映射</strong>：ACES Filmic 提供电影级色彩</li>
          <li><strong>环境贴图</strong>：HDR 格式提供更真实的光照</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>// 创建飞行灯光</code></p>
        <p><code>const flyLight = gltf.scene.clone(true)</code></p>
        <p><code>flyLight.position.set(x, y, z)</code></p>
        <p><code /></p>
        <p><code>// GSAP 旋转动画</code></p>
        <p><code>gsap.to(flyLight.rotation, {</code></p>
        <p><code>&nbsp;&nbsp;y: 2 * Math.PI,</code></p>
        <p><code>&nbsp;&nbsp;duration: 10 + Math.random() * 30,</code></p>
        <p><code>&nbsp;&nbsp;repeat: -1</code></p>
        <p><code>})</code></p>
      </div>

      <div class="info-section">
        <h3>🎨 着色器材质：</h3>
        <ul>
          <li><strong>ShaderMaterial</strong>：完全自定义的材质</li>
          <li><strong>顶点着色器</strong>：处理顶点位置变换</li>
          <li><strong>片元着色器</strong>：计算像素颜色，创建发光效果</li>
          <li><strong>DoubleSide</strong>：双面渲染，确保从任何角度都可见</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🌅 HDR 环境贴图：</h3>
        <ul>
          <li><strong>RGBELoader</strong>：加载 HDR 格式的环境贴图</li>
          <li><strong>EquirectangularReflectionMapping</strong>：等距柱状投影映射</li>
          <li><strong>scene.background</strong>：设置场景背景</li>
          <li><strong>scene.environment</strong>：设置环境光照，影响材质反射</li>
          <li>💡 HDR 提供高动态范围的光照信息</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎬 GSAP 动画技巧：</h3>
        <ul>
          <li><strong>gsap.to()</strong>：创建补间动画</li>
          <li><strong>duration</strong>：动画持续时间（秒）</li>
          <li><strong>repeat: -1</strong>：无限循环</li>
          <li><strong>yoyo: true</strong>：往返动画（A→B→A）</li>
          <li><strong>ease</strong>：缓动函数（sine.inOut 等）</li>
          <li><strong>随机化</strong>：每个灯光的动画时长不同，创造自然效果</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎛️ 色调映射：</h3>
        <ul>
          <li><strong>ACESFilmicToneMapping</strong>：电影级色调映射</li>
          <li><strong>LinearToneMapping</strong>：线性映射（默认）</li>
          <li><strong>ReinhardToneMapping</strong>：Reinhard 算法</li>
          <li><strong>CineonToneMapping</strong>：Cineon 算法</li>
          <li><strong>toneMappingExposure</strong>：曝光度控制（0.2 适合本场景）</li>
          <li>💡 色调映射将 HDR 颜色映射到显示器可显示的范围</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎮 轨道控制器设置：</h3>
        <ul>
          <li><strong>autoRotate</strong>：启用自动旋转</li>
          <li><strong>autoRotateSpeed</strong>：旋转速度（0.1 缓慢旋转）</li>
          <li><strong>maxPolarAngle</strong>：最大极角（限制垂直视角）</li>
          <li><strong>minPolarAngle</strong>：最小极角</li>
          <li>💡 设置相同的最大最小极角可锁定垂直视角</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📦 GLTF 模型克隆：</h3>
        <ul>
          <li><strong>gltf.scene.clone(true)</strong>：深度克隆场景</li>
          <li><strong>true 参数</strong>：递归克隆所有子对象</li>
          <li><strong>优势</strong>：只需加载一次模型，节省内存和加载时间</li>
          <li><strong>注意</strong>：材质是共享的，修改一个会影响所有实例</li>
          <li>💡 本例中 150 个灯光共享同一个着色器材质</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚡ 性能优化：</h3>
        <ul>
          <li>✅ 使用模型克隆而不是重复加载</li>
          <li>✅ 共享材质减少 GPU 内存占用</li>
          <li>✅ 合理的动画时长随机化</li>
          <li>✅ 限制极角范围减少不必要的计算</li>
          <li>✅ 使用 sRGB 编码优化颜色显示</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 学习建议：</h3>
        <ul>
          <li>📖 调整 GUI 中的参数观察效果变化</li>
          <li>📖 修改飞行灯光的数量和分布范围</li>
          <li>📖 尝试不同的色调映射算法</li>
          <li>📖 修改 GSAP 动画参数创造不同效果</li>
          <li>📖 学习如何使用自定义着色器</li>
          <li>💡 这是一个综合性示例，涉及多个高级技术</li>
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
