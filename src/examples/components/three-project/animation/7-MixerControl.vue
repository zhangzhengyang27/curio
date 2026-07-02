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
    controls,
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
   * 创建立方体的复合动画
   */
  const createCubeAnimation = () => {
    if (!cube) return

    // 1. 创建位移关键帧轨道
    const positionKF = new THREE.VectorKeyframeTrack("cube.position", [0, 1, 2, 3, 4], [0, 0, 0, 2, 0, 0, 4, 0, 0, 2, 0, 0, 0, 0, 0])

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

    // 3. 创建颜色关键帧轨道
    const colorKF = new THREE.ColorKeyframeTrack(
      "cube.material.color",
      [0, 2, 4],
      [
        1,
        0,
        1, // 紫红色
        1,
        1,
        0, // 黄色
        1,
        0,
        1 // 紫红色
      ]
    )

    // 创建动画混合器
    mixer = new THREE.AnimationMixer(cube)

    // 创建动画剪辑
    const clip = new THREE.AnimationClip("move", 4, [positionKF, rotationKF, colorKF])

    // 创建动画动作并播放
    action = mixer.clipAction(clip)
    action.play()

    console.log("立方体复合动画创建完成")
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
    gui.title("AnimationMixer 控制详解")

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

    // AnimationMixer 控制方法 ⭐ 核心功能
    if (mixer && action) {
      const eventObj = {
        // 停止所有动画
        stopAll: () => {
          if (!mixer || !action) return
          mixer.stopAllAction()
          console.log("已停止所有动画")
        },
        // 播放动画并跳转到2秒位置
        play: () => {
          if (!mixer || !action) return
          action.play()
          mixer.setTime(2) // 设置动画时间为2秒
          console.log("播放动画，并跳转到2秒位置")
        },
        // 暂停动画
        pause: () => {
          if (!mixer || !action) return
          action.paused = true
          console.log("暂停动画")
        },
        // 恢复播放
        resume: () => {
          if (!mixer || !action) return
          action.paused = false
          console.log("恢复播放")
        },
        // 重置动画到开始
        reset: () => {
          if (!mixer || !action) return
          action.reset()
          console.log("重置动画到开始位置")
        },
        // 停止动画
        stop: () => {
          if (!mixer || !action) return
          action.stop()
          console.log("停止动画")
        }
      }

      const mixerFolder = gui.addFolder("🎬 Mixer 控制方法")

      // 添加控制按钮
      mixerFolder.add(eventObj, "stopAll").name("停止所有动画 (stopAllAction)")
      mixerFolder.add(eventObj, "play").name("播放并跳转到2秒 (play + setTime)")
      mixerFolder.add(eventObj, "pause").name("暂停动画 (paused = true)")
      mixerFolder.add(eventObj, "resume").name("恢复播放 (paused = false)")
      mixerFolder.add(eventObj, "reset").name("重置动画 (reset)")
      mixerFolder.add(eventObj, "stop").name("停止动画 (stop)")

      // 播放速度控制
      mixerFolder
        .add(mixer, "timeScale", 0, 3, 0.1)
        .name("播放速度 (timeScale)")
        .onChange((value) => {
          console.log("播放速度:", value)
        })

      mixerFolder.open()
    }

    // 动画状态信息
    const stateFolder = gui.addFolder("📊 动画状态")
    const stateInfo = {
      isRunning: "查看控制台",
      currentTime: "查看控制台",
      duration: "4秒"
    }

    stateFolder.add(stateInfo, "isRunning").name("是否运行").disable()
    stateFolder.add(stateInfo, "currentTime").name("当前时间").disable()
    stateFolder.add(stateInfo, "duration").name("动画时长").disable()
    stateFolder.open()

    // 添加说明信息
    const infoFolder = gui.addFolder("📖 Mixer 方法说明")
    const info = {
      stopAllAction: "停止混合器中的所有动画",
      setTime: "设置动画播放到指定时间",
      timeScale: "控制动画播放速度"
    }
    infoFolder.add(info, "stopAllAction").name("stopAllAction").disable()
    infoFolder.add(info, "setTime").name("setTime").disable()
    infoFolder.add(info, "timeScale").name("timeScale").disable()
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

    // 初始化 GUI
    initGUI()

    // 启动动画循环
    startAnimation(() => {
      const delta = clock.getDelta()

      // 更新动画混合器
      if (mixer) {
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
    title="🎛️ AnimationMixer 控制详解"
    description="深入了解 AnimationMixer 的各种控制方法"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>AnimationMixer 核心方法：</h3>
        <ul>
          <li>⏹️ <strong>stopAllAction()</strong> - 停止所有动画</li>
          <li>⏱️ <strong>setTime(time)</strong> - 设置动画时间</li>
          <li>⚡ <strong>timeScale</strong> - 控制播放速度</li>
          <li>⏸️ <strong>action.paused</strong> - 暂停/恢复动画</li>
          <li>🔄 <strong>action.reset()</strong> - 重置动画</li>
          <li>⏹️ <strong>action.stop()</strong> - 停止单个动画</li>
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
