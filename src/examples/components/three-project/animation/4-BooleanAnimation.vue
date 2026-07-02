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

        // 添加模型到场景
        loadedModel = gltf.scene
        scene.value.add(loadedModel)

        // 为模型创建布尔动画（控制可见性）
        createModelBooleanAnimation(gltf.scene)
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
   * 为模型创建布尔动画（控制可见性）
   */
  const createModelBooleanAnimation = (model: THREE.Object3D) => {
    // 创建动画混合器
    mixer1 = new THREE.AnimationMixer(model)

    // 创建布尔关键帧轨道。控制 Sketchfab_Scene 对象的 visible 属性
    const boolKF = new THREE.BooleanKeyframeTrack(
      "Sketchfab_Scene.visible", // 目标属性路径
      [0, 1, 2, 3, 4], // 时间点
      [true, false, true, false, true] // 可见性值
    )

    // 创建动画剪辑
    const clip = new THREE.AnimationClip("bool", 4, [boolKF])

    // 创建动画动作并播放
    const action1 = mixer1.clipAction(clip)
    action1.play()

    console.log("模型布尔动画创建完成")
  }

  /**
   * 创建立方体
   */
  const createCube = () => {
    if (!scene.value) return

    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshStandardMaterial({
      color: 0xff33ff
    })
    cube = new THREE.Mesh(geometry, material)
    cube.name = "cube"
    scene.value.add(cube)

    console.log("立方体创建完成")
  }

  /**
   * 创建立方体的复合动画（位移 + 旋转 + 布尔）
   */
  const createCubeAnimation = () => {
    if (!cube) return

    // 1. 创建位移关键帧轨道
    const positionKF = new THREE.VectorKeyframeTrack(
      "cube.position",
      [0, 1, 2, 3, 4],
      [
        0,
        0,
        0, // 0秒
        2,
        0,
        0, // 1秒
        4,
        0,
        0, // 2秒
        2,
        0,
        0, // 3秒
        0,
        0,
        0 // 4秒
      ]
    )

    // 2. 创建四元数旋转关键帧
    const quaternion1 = new THREE.Quaternion()
    quaternion1.setFromEuler(new THREE.Euler(0, 0, 0))

    const quaternion2 = new THREE.Quaternion()
    quaternion2.setFromEuler(new THREE.Euler(Math.PI, 0, 0))

    const quaternion3 = new THREE.Quaternion()
    quaternion3.setFromEuler(new THREE.Euler(0, 0, 0))

    console.log("四元数值:", quaternion1, quaternion2, quaternion3)

    const quaternionArray = quaternion1.toArray().concat(quaternion2.toArray()).concat(quaternion3.toArray())

    console.log("合并后的四元数数组:", quaternionArray)

    // 创建旋转关键帧轨道
    const rotationKF = new THREE.QuaternionKeyframeTrack("cube.quaternion", [0, 2, 4], quaternionArray)

    // 3. 创建布尔关键帧轨道（控制可见性）
    // 立方体会在动画过程中闪烁（显示/隐藏）
    const boolKF = new THREE.BooleanKeyframeTrack(
      "cube.visible", // 控制立方体的可见性
      [0, 1, 2, 3, 4], // 时间点
      [true, false, true, false, true] // 可见性值：显示-隐藏-显示-隐藏-显示
    )

    // 创建动画混合器
    mixer = new THREE.AnimationMixer(cube)

    // 创建动画剪辑（包含位移、旋转和布尔三个轨道）
    const clip = new THREE.AnimationClip("move", 4, [positionKF, rotationKF, boolKF])

    // 创建动画动作并播放
    const action = mixer.clipAction(clip)
    action.play()

    console.log("立方体复合动画创建完成（位移 + 旋转 + 布尔）")
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
    gui.title("布尔动画控制")

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

    // 立方体动画控制
    if (mixer) {
      const cubeAnimParams = {
        timeScale: 1.0,
        paused: false
      }

      const cubeAnimFolder = gui.addFolder("立方体动画")

      cubeAnimFolder
        .add(cubeAnimParams, "timeScale", 0, 3, 0.1)
        .name("播放速度")
        .onChange((value) => {
          if (mixer) {
            mixer.timeScale = value
          }
        })

      cubeAnimFolder
        .add(cubeAnimParams, "paused")
        .name("暂停")
        .onChange((value) => {
          const actions = (mixer as any)._actions
          if (actions && actions.length > 0) {
            actions[0].paused = value
          }
        })

      cubeAnimFolder.open()
    }

    // 模型动画控制
    if (mixer1) {
      const modelAnimParams = {
        timeScale: 1.0,
        paused: false
      }

      const modelAnimFolder = gui.addFolder("模型动画")

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

    // 立方体控制
    if (cube) {
      const cubeParams = {
        color: "#ff33ff"
      }

      const cubeFolder = gui.addFolder("立方体设置")

      cubeFolder
        .addColor(cubeParams, "color")
        .name("颜色")
        .onChange((value) => {
          if (cube && cube.material) {
            const material = Array.isArray(cube.material) ? cube.material[0] : cube.material
            if (material instanceof THREE.MeshStandardMaterial) {
              material.color?.set(value)
            }
          }
        })

      cubeFolder.open()
    }

    // 添加说明信息
    const infoFolder = gui.addFolder("📖 关于布尔动画")
    const info = {
      description: "控制物体的可见性，实现闪烁效果"
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

    // 创建立方体
    createCube()

    // 创建立方体动画
    createCubeAnimation()

    // 加载 GLTF 模型（异步）
    loadGLTFModel()

    // 初始化 GUI
    initGUI()

    // 启动动画循环
    startAnimation(() => {
      const delta = clock.getDelta()

      // 更新立方体动画混合器
      if (mixer) {
        mixer.update(delta)
      }

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
    title="💡 布尔动画"
    description="使用 BooleanKeyframeTrack 控制物体可见性"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>💡 BooleanKeyframeTrack 布尔轨道</li>
          <li>👁️ 控制物体可见性（显示/隐藏）</li>
          <li>✨ 闪烁效果实现</li>
          <li>🎬 多个动画混合器同时运行</li>
          <li>📦 GLTF 模型加载与动画</li>
          <li>🎯 位移 + 旋转 + 布尔组合动画</li>
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
