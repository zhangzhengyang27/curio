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
   * 创建位移和旋转关键帧动画
   */
  const createKeyframeAnimation = () => {
    if (!cube) return

    // 创建位移关键帧轨道
    // 参数1: 动画目标属性路径 (对象名.属性)
    // 参数2: 时间数组 (关键帧时间点，单位：秒)
    // 参数3: 值数组 (每个关键帧对应的位置值 x,y,z)
    const positionKF = new THREE.VectorKeyframeTrack(
      "cube.position", // 目标属性
      [0, 1, 2, 3, 4], // 时间点: 0秒, 1秒, 2秒, 3秒, 4秒
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
        0 // 4秒: (0, 0, 0) 回到起点
      ]
    )

    // 创建旋转关键帧轨道
    // 使用欧拉角创建旋转动画，绕 Y 轴旋转 360 度
    const rotationKF = new THREE.VectorKeyframeTrack(
      "cube.rotation", // 目标属性（欧拉角）
      [0, 1, 2, 3, 4], // 时间点
      [
        0,
        0,
        0, // 0秒: 无旋转
        0,
        Math.PI / 2,
        0, // 1秒: 绕Y轴旋转90度
        0,
        Math.PI,
        0, // 2秒: 绕Y轴旋转180度
        0,
        (Math.PI * 3) / 2,
        0, // 3秒: 绕Y轴旋转270度
        0,
        Math.PI * 2,
        0 // 4秒: 绕Y轴旋转360度（完整一圈）
      ]
    )

    // 创建缩放关键帧轨道（可选，增加更多动画效果）
    const scaleKF = new THREE.VectorKeyframeTrack(
      "cube.scale", // 目标属性
      [0, 1, 2, 3, 4], // 时间点
      [
        1,
        1,
        1, // 0秒: 原始大小
        1.5,
        1.5,
        1.5, // 1秒: 放大1.5倍
        1,
        1,
        1, // 2秒: 恢复原始大小
        0.5,
        0.5,
        0.5, // 3秒: 缩小到0.5倍
        1,
        1,
        1 // 4秒: 恢复原始大小
      ]
    )

    // 创建动画混合器
    mixer = new THREE.AnimationMixer(cube)

    // 创建动画剪辑（包含位移、旋转和缩放三个轨道）
    // 参数1: 动画名称
    // 参数2: 动画持续时间（秒）
    // 参数3: 关键帧轨道数组
    const clip = new THREE.AnimationClip("move", 4, [positionKF, rotationKF, scaleKF])

    // 创建动画动作
    action = mixer.clipAction(clip)

    // 播放动画
    action.play()

    console.log("位移、旋转和缩放动画创建完成")
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
    gui.title("关键帧动画控制")

    // 背景颜色控制
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
    if (action) {
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

    // 立方体控制
    if (cube) {
      const cubeParams = {
        color: "#ff33ff",
        positionX: 0,
        positionY: 0,
        positionZ: 0
      }

      const cubeFolder = gui.addFolder("立方体设置")

      // 颜色控制
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

    // 创建位移动画
    createKeyframeAnimation()

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
    title="🎯 关键帧动画"
    description="使用 VectorKeyframeTrack 创建多轨道关键帧动画"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>📍 VectorKeyframeTrack 位移轨道</li>
          <li>🔄 VectorKeyframeTrack 旋转轨道</li>
          <li>📏 VectorKeyframeTrack 缩放轨道</li>
          <li>🎬 多轨道组合动画</li>
          <li>⏱️ 时间轴控制（速度、暂停、循环）</li>
          <li>🎨 实时调整物体颜色</li>
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
