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
  const containerRef = shallowRef(null)

  // 动画相关
  let mixer: any = null
  const clock = new THREE.Clock()
  let gui: any = null
  let loadedModel: any = null

  // 动画动作
  let walkAction: any = null
  let runAction: any = null
  let posAction: any = null
  let greetAction: any = null
  let idleAction: any = null
  let currentAction: any = null

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
        scene.value!.background = new THREE.Color(0xcccccc)
      }
    )
  }

  /**
   * 加载角色模型
   */
  const loadCharacterModel = () => {
    if (!scene.value) return

    // 实例化 GLTF 加载器
    const gltfLoader = new GLTFLoader()

    // 实例化 Draco 解码器
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath("/three-project/draco/")
    gltfLoader.setDRACOLoader(dracoLoader)

    // 加载角色模型
    gltfLoader.load(
      "/three-project/model/hilda_regular_00.glb",
      (gltf) => {
        console.log("角色模型加载成功:", gltf)
        console.log(
          "动画列表:",
          gltf.animations.map((anim, index) => `${index}: ${anim.name}`)
        )

        // 添加模型到场景
        scene.value!.add(gltf.scene)

        // 创建动画混合器
        mixer = new THREE.AnimationMixer(gltf.scene)

        // 获取各种动画动作
        // 注意：动画索引根据模型的动画列表确定
        walkAction = mixer.clipAction(gltf.animations[37]) // 行走
        runAction = mixer.clipAction(gltf.animations[27]) // 跑步
        idleAction = mixer.clipAction(gltf.animations[6]) // 空闲
        posAction = mixer.clipAction(gltf.animations[23]) // 姿势
        greetAction = mixer.clipAction(gltf.animations[0]) // 问候

        // 设置初始动作为空闲
        currentAction = idleAction
        idleAction.play()

        console.log("动画初始化完成，当前动作：空闲")
        console.log("Mixer:", mixer)

        // 模型加载完成后初始化 GUI
        initGUI()
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

  // 动画状态信息（用于 GUI 显示）
  const animationState = {
    currentAnimation: "空闲 (Idle)",
    isPlaying: "是",
    timeScale: "1.0"
  }

  /**
   * 获取动画名称
   */
  const getAnimationName = (action: any) => {
    if (action === idleAction) return "空闲 (Idle)"
    if (action === walkAction) return "行走 (Walk)"
    if (action === runAction) return "跑步 (Run)"
    if (action === greetAction) return "问候 (Greet)"
    if (action === posAction) return "姿势 (Pose)"
    return "未知"
  }

  /**
   * 切换到指定动画（带交叉淡入淡出效果）
   * @param {THREE.AnimationAction} targetAction - 目标动画
   * @param {number} duration - 过渡时间（秒）
   */
  const switchToAction = (targetAction: any, duration = 0.5) => {
    if (!targetAction || targetAction === currentAction) return

    // 启用目标动画
    targetAction.enabled = true
    targetAction.setEffectiveTimeScale(1) // 设置时间缩放
    targetAction.setEffectiveWeight(1) // 设置动画权重
    targetAction.play() // 播放目标动画

    // 从当前动画交叉淡入淡出到目标动画
    if (currentAction) {
      currentAction.crossFadeTo(targetAction, duration, true) // 交叉淡入淡出到目标动画
    }

    // 更新当前动画
    currentAction = targetAction

    // 更新状态显示
    animationState.currentAnimation = getAnimationName(targetAction)
  }

  /**
   * 配置网格辅助器
   */
  const configureGridHelper = () => {
    if (!scene.value) return

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
    gui.title("角色动画控制")

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

    // 动画控制对象
    const eventObj = {
      // 停止所有动画
      stopAll: () => {
        mixer.stopAllAction()
        animationState.isPlaying = "否"
        animationState.currentAnimation = "无"
        console.log("已停止所有动画")
      },
      // 播放所有动画（调试用）
      play: () => {
        mixer._actions.forEach((action: any) => {
          action.play()
        })
        animationState.isPlaying = "是"
        animationState.currentAnimation = "所有动画"
        console.log("播放所有动画")
      },
      // 切换到跑步动画
      playRun: () => {
        switchToAction(runAction, 0.5)
        animationState.isPlaying = "是"
        console.log("切换到跑步动画")
      },
      // 切换到行走动画
      playWalk: () => {
        switchToAction(walkAction, 0.5)
        animationState.isPlaying = "是"
        console.log("切换到行走动画")
      },
      // 切换到问候动画
      playGreet: () => {
        switchToAction(greetAction, 0.5)
        animationState.isPlaying = "是"
        console.log("切换到问候动画")
      },
      // 切换到空闲动画
      playIdle: () => {
        switchToAction(idleAction, 0.5)
        animationState.isPlaying = "是"
        console.log("切换到空闲动画")
      },
      // 切换到姿势动画
      playPos: () => {
        switchToAction(posAction, 0.5)
        animationState.isPlaying = "是"
        console.log("切换到姿势动画")
      }
    }

    // 动画切换控制 ⭐ 核心功能
    const animationFolder = gui.addFolder("🎬 动画切换 (CrossFade)")

    animationFolder.add(eventObj, "stopAll").name("⏹️ 停止所有动画")
    animationFolder.add(eventObj, "play").name("▶️ 播放所有动画")
    animationFolder.add(eventObj, "playIdle").name("🧍 空闲 (Idle)")
    animationFolder.add(eventObj, "playWalk").name("🚶 行走 (Walk)")
    animationFolder.add(eventObj, "playRun").name("🏃 跑步 (Run)")
    animationFolder.add(eventObj, "playGreet").name("👋 问候 (Greet)")
    animationFolder.add(eventObj, "playPos").name("🧘 姿势 (Pose)")

    animationFolder.open()

    // 当前状态显示 ⭐ 新增功能
    const stateFolder = gui.addFolder("📊 当前状态")
    stateFolder.add(animationState, "currentAnimation").name("当前动画").listen().disable()
    stateFolder.add(animationState, "isPlaying").name("播放中").listen().disable()
    stateFolder.add(animationState, "timeScale").name("播放速度").listen().disable()
    stateFolder.open()

    // 播放速度控制
    if (mixer) {
      const mixerFolder = gui.addFolder("⚙️ Mixer 设置")
      mixerFolder
        .add(mixer, "timeScale", 0, 3, 0.1)
        .name("播放速度")
        .onChange((value: any) => {
          console.log("播放速度:", value)
          animationState.timeScale = value.toFixed(1)
        })
      mixerFolder.open()
    }

    // 添加说明信息
    const infoFolder = gui.addFolder("📖 CrossFade 说明")
    const info = {
      crossFadeTo: "平滑过渡到目标动画",
      duration: "过渡时间：0.5秒",
      效果: "当前动画淡出，目标动画淡入"
    }
    infoFolder.add(info, "crossFadeTo").name("方法").disable()
    infoFolder.add(info, "duration").name("过渡时间").disable()
    infoFolder.add(info, "效果").name("效果").disable()
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

    // 加载角色模型（异步，加载完成后会初始化 GUI）
    loadCharacterModel()

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

    // 清理加载的模型
    if (loadedModel && scene.value) {
      loadedModel.traverse((child: any) => {
        if (child.geometry) {
          child.geometry.dispose()
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((material: any) => material.dispose())
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
    walkAction = null
    runAction = null
    posAction = null
    greetAction = null
    idleAction = null
    currentAction = null

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
    title="🎭 动画交叉淡入淡出"
    description="使用 crossFadeTo 实现角色动画的平滑切换"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>CrossFade 动画切换：</h3>
        <ul>
          <li>🎭 <strong>crossFadeTo()</strong> - 交叉淡入淡出过渡</li>
          <li>👤 角色模型多动画切换</li>
          <li>🚶 行走、跑步、问候、空闲、姿势</li>
          <li>⏱️ 0.5秒平滑过渡效果</li>
          <li>⚡ setEffectiveWeight() - 设置动画权重</li>
          <li>🎯 setEffectiveTimeScale() - 设置时间缩放</li>
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
