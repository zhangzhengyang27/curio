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
  let mixer: THREE.AnimationMixer | null = null // 立方体的动画混合器
  let mixer1: THREE.AnimationMixer | null = null // 模型的动画混合器
  const clock = new THREE.Clock()
  let gui: GUI | null = null
  let cube: THREE.Mesh | null = null
  let loadedModel: THREE.Group | null = null

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
        // 设置背景色
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
   * 加载 GLTF 模型（月球模型）
   */
  const loadGLTFModel = () => {
    if (!scene.value) return

    // 实例化 GLTF 加载器
    const gltfLoader = new GLTFLoader()

    // 实例化 Draco 解码器
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath("/three-project/draco/")
    gltfLoader.setDRACOLoader(dracoLoader)

    // 加载月球模型
    gltfLoader.load(
      "/three-project/model/moon.glb",
      (gltf) => {
        if (!scene.value) return
        console.log("月球模型加载成功:", gltf)

        // 获取月球材质对象
        const moon = gltf.scene.getObjectByName("defaultMaterial")
        if (moon && moon.material) {
          // 设置材质为透明，以便透明度动画生效
          const material = Array.isArray(moon.material) ? moon.material[0] : moon.material
          material.transparent = true
          console.log("月球材质已设置为透明")
        }

        // 添加模型到场景
        loadedModel = gltf.scene
        scene.value.add(loadedModel)

        // 为模型创建数值动画（透明度 + 位置）
        createModelNumberAnimation(gltf.scene)
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
   * 为模型创建数值动画（透明度 + 位置）
   */
  const createModelNumberAnimation = (model: THREE.Object3D) => {
    // 创建动画混合器
    mixer1 = new THREE.AnimationMixer(model)

    // 创建透明度数值关键帧轨道 ⭐ 核心功能
    // NumberKeyframeTrack 用于控制单个数值属性
    const opacityKF = new THREE.NumberKeyframeTrack(
      "defaultMaterial.material.opacity", // 目标属性：材质的透明度
      [0, 1, 2, 3, 4], // 时间点
      [1, 0.5, 0, 0.5, 1] // 透明度值：1(完全不透明) → 0.5 → 0(完全透明) → 0.5 → 1
    )

    // 创建位置关键帧轨道
    const positionZKF = new THREE.VectorKeyframeTrack(
      "defaultMaterial.position", // 目标对象的位置
      [0, 2, 4], // 时间点
      [
        0,
        0,
        0, // 0秒: 初始位置
        0,
        2,
        0, // 2秒: Y轴上移2个单位
        0,
        0,
        0 // 4秒: 回到初始位置
      ]
    )

    // 创建动画剪辑（包含透明度和位置两个轨道）
    const clip = new THREE.AnimationClip("opacity", 4, [opacityKF, positionZKF])

    // 创建动画动作并播放
    const action1 = mixer1.clipAction(clip)
    action1.play()

    console.log("模型数值动画创建完成（透明度 + 位置）")
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

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()
    gui.title("数值动画控制")

    // 场景设置
    const sceneParams = {
      backgroundColor: "#cccccc"
    }

    const sceneFolder = gui.addFolder("场景设置")
    sceneFolder
      .addColor(sceneParams, "backgroundColor")
      .name("背景颜色")
      .onChange((value) => {
        if (scene.value) {
          scene.value.background = new THREE.Color(value)
        }
      })
    sceneFolder.open()

    // 模型动画控制
    if (mixer1) {
      const modelAnimParams = {
        timeScale: 1.0,
        paused: false
      }

      const modelAnimFolder = gui.addFolder("月球动画")

      modelAnimFolder
        .add(modelAnimParams, "timeScale", 0, 3, 0.1)
        .name("播放速度")
        .onChange((value) => {
          if (mixer1) {
            mixer1.timeScale = value
          }
        })

      modelAnimFolder
        .add(modelAnimParams, "paused")
        .name("暂停")
        .onChange((value) => {
          const actions = (mixer1 as any)._actions
          if (actions && actions.length > 0) {
            actions[0].paused = value
          }
        })

      modelAnimFolder.open()
    }

    // 透明度动画说明
    const opacityInfo = {
      time0: "1.0 (完全不透明)",
      time1: "0.5 (半透明)",
      time2: "0.0 (完全透明)",
      time3: "0.5 (半透明)",
      time4: "1.0 (完全不透明)"
    }

    const opacityFolder = gui.addFolder("🌙 月球透明度变化")
    opacityFolder.add(opacityInfo, "time0").name("0秒").disable()
    opacityFolder.add(opacityInfo, "time1").name("1秒").disable()
    opacityFolder.add(opacityInfo, "time2").name("2秒").disable()
    opacityFolder.add(opacityInfo, "time3").name("3秒").disable()
    opacityFolder.add(opacityInfo, "time4").name("4秒").disable()
    opacityFolder.open()

    // 添加说明信息
    const infoFolder = gui.addFolder("📖 关于数值动画")
    const info = {
      description: "NumberKeyframeTrack 控制单个数值属性"
    }
    infoFolder.add(info, "description").name("说明").disable()
    infoFolder.open()
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

    // 调整相机视角
    if (camera.value) {
      camera.value.lookAt(0, 1.2, 0)
    }

    // 配置网格辅助器
    configureGridHelper()

    // 加载 HDR 环境
    loadHDREnvironment()

    // 加载 GLTF 模型（异步）
    loadGLTFModel()

    // 初始化 GUI
    initGUI()

    // 启动动画循环
    startAnimation(() => {
      const delta = clock.getDelta()

      // 更新模型动画混合器
      if (mixer1) {
        mixer1.update(delta)
      }
    })
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 停止所有动画混合器
    if (mixer) {
      mixer.stopAllAction()
      mixer = null
    }
    if (mixer1) {
      mixer1.stopAllAction()
      mixer1 = null
    }

    // 清理立方体
    if (cube && scene.value) {
      cube.geometry.dispose()
      if (cube.material) {
        const material = Array.isArray(cube.material) ? cube.material[0] : cube.material
        material.dispose()
      }
      scene.value.remove(cube)
      cube = null
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
    title="🔢 数值动画"
    description="使用 NumberKeyframeTrack 控制单个数值属性"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🔢 NumberKeyframeTrack 数值轨道</li>
          <li>👻 材质透明度动画控制</li>
          <li>🌙 月球模型淡入淡出效果</li>
          <li>📍 位置 + 透明度组合动画</li>
          <li>📊 实时透明度信息显示</li>
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
