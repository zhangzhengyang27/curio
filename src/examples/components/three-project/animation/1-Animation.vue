<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
  import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"

  // 容器引用
  const containerRef = shallowRef<HTMLDivElement | null>(null)

  // 动画相关
  let mixer: THREE.AnimationMixer | null = null
  const clock = new THREE.Clock()
  let gui: GUI | null = null
  let loadedModel: THREE.Group | null = null
  let action: THREE.AnimationAction | null = null

  // 使用封装的场景
  const {
    scene,
    camera,
    renderer,
    controls: _controls,
    startAnimation,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    fov: 45,
    cameraPosition: { x: 3, y: 2.5, z: 8 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 1,
      maxDistance: 100
    },
    showAxesHelper: true,
    axesHelperSize: 5,
    showGridHelper: true
  })

  /**
   * 加载 HDR 环境贴图
   */
  const loadHDREnvironment = () => {
    const rgbeLoader = new RGBELoader()
    rgbeLoader.load(
      "/three-project/texture/Video_Copilot-Back Light_0007_4k.hdr",
      (envMap) => {
        if (!scene.value) return
        // 设置折射贴图
        envMap.mapping = THREE.EquirectangularRefractionMapping
        // 设置背景色（不使用 HDR 作为背景）
        scene.value.background = new THREE.Color(0xcccccc)
        // 设置环境贴图
        scene.value.environment = envMap
        console.log("HDR 环境贴图加载完成")
      },
      undefined,
      (error) => {
        if (!scene.value) return
        console.error("HDR 加载失败:", error)
        // 如果 HDR 加载失败，设置一个默认背景色
        scene.value.background = new THREE.Color(0xcccccc)
      }
    )
  }

  /**
   * 加载 GLTF 模型
   */
  const loadGLTFModel = () => {
    if (!scene.value) return

    // 实例化 GLTF 加载器
    const gltfLoader = new GLTFLoader()

    // 实例化 Draco 解码器
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath("/three-project/draco/")
    gltfLoader.setDRACOLoader(dracoLoader)

    // 加载模型
    gltfLoader.load(
      "/three-project/model/huawei.glb",
      (gltf) => {
        if (!scene.value) return
        console.log("模型加载成功:", gltf)

        // 添加模型到场景
        loadedModel = gltf.scene
        scene.value.add(loadedModel)

        // 调整相机视角
        if (camera.value) {
          camera.value.lookAt(0, 1.2, 0)
        }

        // 创建动画混合器
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(gltf.scene)

          // 获取第一个动画并播放
          action = mixer.clipAction(gltf.animations[0])
          action.play()

          console.log("动画开始播放")

          // 如果有 GUI，添加动画控制
          if (gui) {
            createAnimationControls(gltf.animations)
          }
        }
      },
      (progress) => {
        const percent = ((progress.loaded / progress.total) * 100).toFixed(2)
        console.log(`模型加载中: ${percent}%`)
      },
      (error) => {
        console.error("模型加载失败:", error)
      }
    )
  }

  /**
   * 创建动画控制 GUI
   */
  const createAnimationControls = (animations: THREE.AnimationClip[]) => {
    if (!gui || !mixer) return

    const animationFolder = gui.addFolder("动画控制")

    const animationParams = {
      currentAnimation: 0,
      timeScale: 1.0,
      paused: false
    }

    // 动画选择
    if (animations.length > 1) {
      const animationNames: Record<string, number> = {}
      animations.forEach((clip, index) => {
        animationNames[clip.name || `动画 ${index + 1}`] = index
      })

      animationFolder
        .add(animationParams, "currentAnimation", animationNames)
        .name("选择动画")
        .onChange((value) => {
          if (!mixer) return
          if (action) {
            action.stop()
          }
          action = mixer.clipAction(animations[value])
          action.play()
        })
    }

    // 播放速度
    animationFolder
      .add(animationParams, "timeScale", 0, 3, 0.1)
      .name("播放速度")
      .onChange((value) => {
        if (mixer) {
          mixer.timeScale = value
        }
      })

    // 暂停/播放
    animationFolder
      .add(animationParams, "paused")
      .name("暂停")
      .onChange((value) => {
        if (action) {
          if (value) {
            action.paused = true
          } else {
            action.paused = false
          }
        }
      })

    animationFolder.open()
  }

  /**
   * 配置网格辅助器
   */
  const configureGridHelper = () => {
    if (!scene.value) return

    // 找到网格辅助器并设置透明度
    scene.value.traverse((object) => {
      if (object.type === "GridHelper" && object.material) {
        const material = Array.isArray(object.material) ? object.material[0] : object.material
        material.opacity = 0.3
        material.transparent = true
      }
    })
  }

  const initGUI = () => {
    gui = new GUI()
    gui.title("模型加载与动画控制")

    const params = {
      backgroundColor: "#cccccc"
    }

    // 背景颜色控制
    gui
      .addColor(params, "backgroundColor")
      .name("背景颜色")
      .onChange((value) => {
        if (scene.value) {
          scene.value.background = new THREE.Color(value)
        }
      })
  }

  /**
   * 初始化场景内容
   */
  const initSceneContent = () => {
    if (!scene.value || !renderer.value) return

    // 配置渲染器
    renderer.value.shadowMap.enabled = true
    renderer.value.toneMapping = THREE.ReinhardToneMapping
    renderer.value.toneMappingExposure = 1

    // 配置网格辅助器
    configureGridHelper()

    // 加载 HDR 环境
    loadHDREnvironment()

    // 加载 GLTF 模型
    loadGLTFModel()

    // 初始化 GUI
    initGUI()

    // 启动动画循环
    startAnimation(() => {
      // 更新动画混合器
      if (mixer) {
        const delta = clock.getDelta()
        mixer.update(delta)
      }
    })
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 停止动画混合器
    if (mixer) {
      mixer.stopAllAction()
      mixer = null
    }

    // 清理加载的模型
    if (loadedModel && scene.value) {
      loadedModel.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose()
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
      scene.value.remove(loadedModel)
      loadedModel = null
    }

    // 清理 GUI
    gui?.destroy()
    gui = null

    // 清理引用
    action = null

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
    title="🎥 模型加载与播放动画"
    description="使用 GLTF 加载器加载 3D 模型并播放内置动画"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>📦 GLTF/GLB 模型加载</li>
          <li>🗜️ Draco 压缩支持</li>
          <li>🎬 AnimationMixer 动画混合器</li>
          <li>⏯️ 动画播放控制（暂停、速度、循环）</li>
          <li>🌅 HDR 环境贴图</li>
          <li>🎛️ GUI 调试面板</li>
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
