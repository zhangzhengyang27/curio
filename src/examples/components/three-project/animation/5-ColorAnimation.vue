<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"

  // 容器引用
  const containerRef = shallowRef<HTMLDivElement | null>(null)

  // 动画相关
  let mixer: THREE.AnimationMixer | null = null
  const clock = new THREE.Clock()
  let gui: GUI | null = null
  let cube: THREE.Mesh | null = null
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
   * 创建颜色关键帧动画
   * ColorKeyframeTrack 可以实现物体颜色的渐变动画
   */
  const createColorAnimation = () => {
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

    const rotationKF = new THREE.QuaternionKeyframeTrack("cube.quaternion", [0, 2, 4], quaternionArray)

    // 3. 创建颜色关键帧轨道 ⭐ 核心功能
    // ColorKeyframeTrack 用于创建颜色渐变动画
    // 颜色值使用 RGB 格式，范围 0-1
    const colorKF = new THREE.ColorKeyframeTrack(
      "cube.material.color", // 目标属性：材质的颜色
      [0, 2, 4], // 时间点：0秒, 2秒, 4秒
      [
        1,
        0,
        1, // 0秒: 紫红色 (R=1, G=0, B=1)
        1,
        1,
        0, // 2秒: 黄色   (R=1, G=1, B=0)
        1,
        0,
        1 // 4秒: 紫红色 (R=1, G=0, B=1) 回到起始颜色
      ]
    )

    // 创建动画混合器
    mixer = new THREE.AnimationMixer(cube)

    // 创建动画剪辑（包含位移、旋转和颜色三个轨道）
    const clip = new THREE.AnimationClip("move", 4, [positionKF, rotationKF, colorKF])

    // 创建动画动作并播放
    action = mixer.clipAction(clip)
    action.play()

    console.log("颜色渐变动画创建完成（紫红 → 黄色 → 紫红）")
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
    gui.title("颜色渐变动画控制")

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

    // 动画控制
    if (action && mixer) {
      const animationParams = {
        timeScale: 1.0,
        paused: false,
        loop: true
      }

      const animationFolder = gui.addFolder("动画控制")

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
            action.paused = value
          }
        })

      // 循环播放
      animationFolder
        .add(animationParams, "loop")
        .name("循环播放")
        .onChange((value) => {
          if (action) {
            if (value) {
              action.setLoop(THREE.LoopRepeat, Infinity)
            } else {
              action.setLoop(THREE.LoopOnce, 0)
            }
          }
        })

      animationFolder.open()
    }

    // 颜色信息显示
    if (cube) {
      const colorInfo = {
        startColor: "紫红色 (1, 0, 1)",
        middleColor: "黄色 (1, 1, 0)",
        endColor: "紫红色 (1, 0, 1)"
      }

      const colorFolder = gui.addFolder("🎨 颜色渐变说明")
      colorFolder.add(colorInfo, "startColor").name("0秒").disable()
      colorFolder.add(colorInfo, "middleColor").name("2秒").disable()
      colorFolder.add(colorInfo, "endColor").name("4秒").disable()
      colorFolder.open()
    }

    // 添加说明信息
    const infoFolder = gui.addFolder("📖 关于颜色动画")
    const info = {
      description: "使用 RGB 值实现平滑颜色过渡"
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

    // 创建颜色动画
    createColorAnimation()

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
    title="🎨 颜色渐变动画"
    description="使用 ColorKeyframeTrack 创建平滑的颜色过渡动画"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🎨 ColorKeyframeTrack 颜色轨道</li>
          <li>🌈 RGB 颜色平滑过渡</li>
          <li>💫 紫红 → 黄色 → 紫红色渐变</li>
          <li>🎬 位移 + 旋转 + 颜色组合动画</li>
          <li>⏱️ 时间轴控制（速度、暂停、循环）</li>
          <li>📊 实时颜色信息显示</li>
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
