<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"

  // 容器引用
  const containerRef = shallowRef(null)

  // 动画相关
  let mixer: any = null
  const clock = new THREE.Clock()
  let gui: any = null
  let cube: any = null
  let action: any = null

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
        // 设置折射贴图
        envMap.mapping = THREE.EquirectangularRefractionMapping
        // 设置背景色
        scene.value!.background = new THREE.Color(0xcccccc)
        // 设置环境贴图
        scene.value!.environment = envMap
        console.log("HDR 环境贴图加载完成")
      },
      undefined,
      (error) => {
        console.error("HDR 加载失败:", error)
        // 如果 HDR 加载失败，设置一个默认背景色
        scene.value!.background = new THREE.Color(0xcccccc)
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
   * 创建使用四元数的旋转动画
   * 四元数相比欧拉角的优势：
   * 1. 避免万向锁问题
   * 2. 旋转插值更平滑
   * 3. 计算效率更高
   */
  const createQuaternionAnimation = () => {
    if (!cube) return

    // 创建位移关键帧轨道
    const positionKF = new THREE.VectorKeyframeTrack(
      "cube.position",
      [0, 1, 2, 3, 4], // 时间点
      [
        0,
        0,
        0, // 0秒: (0, 0, 0)
        2,
        0,
        0, // 1秒: (2, 0, 0)
        4,
        0,
        0, // 2秒: (4, 0, 0)
        2,
        0,
        0, // 3秒: (2, 0, 0)
        0,
        0,
        0 // 4秒: (0, 0, 0)
      ]
    )

    // 创建四元数旋转关键帧
    // 四元数 1: 初始状态，无旋转
    const quaternion1 = new THREE.Quaternion()
    quaternion1.setFromEuler(new THREE.Euler(0, 0, 0))

    // 四元数 2: 绕 X 轴旋转 180 度（PI）
    const quaternion2 = new THREE.Quaternion()
    quaternion2.setFromEuler(new THREE.Euler(Math.PI, 0, 0))

    // 四元数 3: 回到初始状态
    const quaternion3 = new THREE.Quaternion()
    quaternion3.setFromEuler(new THREE.Euler(0, 0, 0))

    console.log("四元数值:", quaternion1, quaternion2, quaternion3)

    // 将三个四元数转换为数组并合并
    // 每个四元数有 4 个值 (x, y, z, w)，所以总共 12 个值
    const quaternionArray = quaternion1.toArray().concat(quaternion2.toArray()).concat(quaternion3.toArray())
    console.log("合并后的四元数数组:", quaternionArray)

    // 创建四元数关键帧轨道
    // 使用 QuaternionKeyframeTrack 而不是 VectorKeyframeTrack
    const rotationKF = new THREE.QuaternionKeyframeTrack(
      "cube.quaternion", // 注意：这里使用 quaternion 而不是 rotation
      [0, 2, 4], // 时间点: 0秒, 2秒, 4秒
      quaternionArray // 四元数数组
    )

    // 创建动画混合器
    mixer = new THREE.AnimationMixer(cube)

    // 创建动画剪辑（包含位移和四元数旋转）
    const clip = new THREE.AnimationClip("move", 4, [positionKF, rotationKF])

    // 创建动画动作
    action = mixer.clipAction(clip)

    // 播放动画
    action.play()
    console.log("四元数旋转动画创建完成")
  }

  /**
   * 配置网格辅助器
   */
  const configureGridHelper = () => {
    if (!scene.value) return

    // 找到网格辅助器并设置透明度
    scene.value.traverse((object) => {
      if (object.type === "GridHelper") {
        const gridMat = object.material as THREE.LineBasicMaterial
        gridMat.opacity = 0.3
        gridMat.transparent = true
      }
    })
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()
    gui.title("四元数旋转动画控制")

    // 场景设置
    const sceneParams = {
      backgroundColor: "#cccccc"
    }

    const sceneFolder = gui.addFolder("场景设置")
    sceneFolder
      .addColor(sceneParams, "backgroundColor")
      .name("背景颜色")
      .onChange((value: any) => {
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
        .onChange((value: any) => {
          if (mixer) {
            mixer.timeScale = value
          }
        })

      // 暂停/播放
      animationFolder
        .add(animationParams, "paused")
        .name("暂停")
        .onChange((value: any) => {
          if (action) {
            action.paused = value
          }
        })

      // 循环播放
      animationFolder
        .add(animationParams, "loop")
        .name("循环播放")
        .onChange((value: any) => {
          if (action) {
            if (value) {
              action.setLoop(THREE.LoopRepeat)
            } else {
              action.setLoop(THREE.LoopOnce)
            }
          }
        })

      animationFolder.open()
    }

    // 立方体控制
    if (cube) {
      const cubeParams = {
        color: "#ff33ff"
      }

      const cubeFolder = gui.addFolder("立方体设置")

      // 颜色控制
      cubeFolder
        .addColor(cubeParams, "color")
        .name("颜色")
        .onChange((value: any) => {
          if (cube) {
            cube.material.color.set(value)
          }
        })

      cubeFolder.open()
    }

    // 添加说明信息
    const infoFolder = gui.addFolder("📖 关于四元数")
    const info = {
      description: "四元数旋转避免万向锁，插值更平滑"
    }
    infoFolder.add(info, "description").name("优势").disable()
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

    // 创建四元数动画
    createQuaternionAnimation()

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
      cube.material.dispose()
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
    title="🔄 四元数旋转动画"
    description="使用 QuaternionKeyframeTrack 创建平滑旋转动画"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🎯 QuaternionKeyframeTrack 四元数轨道</li>
          <li>🌀 避免万向锁问题</li>
          <li>🌊 旋转插值更平滑</li>
          <li>⚡ 计算效率更高</li>
          <li>📐 Euler 角转四元数</li>
          <li>🎬 位移 + 旋转组合动画</li>
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
