<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"


  const containerRef = shallowRef(null)
  const clock = new THREE.Clock()
  let gui: any = null
  let mixer: any = null
  let skeletonHelper: any = null
  let _loadedModel = null
  let animationActions: any[] = []
  let currentAction: any = null

  const params = {
    currentAnim: 0,
    showSkeleton: true,
    timeScale: 1
  }

  const { scene, camera, renderer, controls: _controls, startAnimation, dispose: baseDispose } =
    useThreeScene(containerRef, {
      fov: 45,
      cameraPosition: { x: 0, y: 2, z: 6 },
      enableControls: true,
      controlsConfig: { enableDamping: true, dampingFactor: 0.05, minDistance: 1, maxDistance: 20 },
      showAxesHelper: false,
      showGridHelper: true
    })

  const toggleSkeleton = (visible: any) => {
    if (skeletonHelper) skeletonHelper.visible = visible
  }

  const loadModel = () => {
    const loader = new GLTFLoader()
    loader.load(
      "/three-project/model/yugang.glb",
      (gltf) => {
        if (!scene.value) return
        const model = gltf.scene
        scene.value.add(model)
        _loadedModel = model

        // 遍历检查骨骼
        let hasSkeleton = false
        model.traverse((child) => {
          if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
            hasSkeleton = true
            console.log("发现 SkinnedMesh:", child.name)
          }
        })

        // 创建骨骼辅助器
        if (hasSkeleton) {
          skeletonHelper = new THREE.SkeletonHelper(model)
          skeletonHelper.visible = params.showSkeleton
          scene.value.add(skeletonHelper)
          console.log("骨骼可视化已启用")
        }

        // 处理动画
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model)
          animationActions = gltf.animations.map((clip, index) => {
            const action = mixer.clipAction(clip)
            if (index === 0) {
              action.play()
              currentAction = action
            }
            return { name: clip.name || `动画 ${index}`, action }
          })
          initGUI(gltf.animations, hasSkeleton)
        } else {
          initGUI([], hasSkeleton)
        }
      },
      undefined,
      (err) => console.error("模型加载失败:", err)
    )
  }

  const initGUI = (animations: any[] = [], hasSkeleton: any) => {
    gui = new GUI()
    gui.title("骨骼动画控制")

    if (animations.length > 0) {
      const animFolder = gui.addFolder("🎬 动画切换")
      const eventObj: any = {}
      animations.forEach((clip, index) => {
        const name = clip.name || `动画 ${index}`
        eventObj[`play${index}`] = () => {
          if (currentAction) {
            currentAction.fadeOut(0.5)
          }
          const action = animationActions[index].action
          action.reset().fadeIn(0.5).play()
          currentAction = action
          params.currentAnim = index
        }
        animFolder.add(eventObj, `play${index}`).name(`▶ ${name}`)
      })
      animFolder.open()

      const speedFolder = gui.addFolder("⚙️ 播放设置")
      speedFolder.add(params, "timeScale", 0.1, 3, 0.1).name("播放速度").onChange((v: any) => {
        if (mixer) mixer.timeScale = v
      })
      speedFolder.open()
    }

    if (hasSkeleton) {
      const skelFolder = gui.addFolder("🦴 骨骼显示")
      skelFolder.add(params, "showSkeleton").name("显示骨骼").onChange(toggleSkeleton)
      skelFolder.open()
    }

    const infoFolder = gui.addFolder("📖 说明")
    const info = { 状态: hasSkeleton ? "模型包含骨骼动画" : "模型无骨骼" }
    infoFolder.add(info, "状态").name("骨骼状态").disable()
    infoFolder.open()
  }

  const initScene = () => {
    if (!scene.value || !renderer.value) return
    renderer.value.shadowMap.enabled = true
    scene.value.background = new THREE.Color(0x222233)
    if (camera.value) camera.value.lookAt(0, 1, 0)

    const ambientLight = new THREE.AmbientLight(0x404060, 2)
    scene.value.add(ambientLight)
    const dirLight = new THREE.DirectionalLight(0xffffff, 3)
    dirLight.position.set(5, 5, 5)
    scene.value.add(dirLight)

    loadModel()
    startAnimation(() => {
      if (mixer) mixer.update(clock.getDelta())
    })
  }

  onMounted(() => initScene())

  onUnmounted(() => {
    if (mixer) { mixer.stopAllAction(); mixer = null }
    gui?.destroy()
    gui = null
    skeletonHelper = null
    _loadedModel = null
    animationActions = []
    currentAction = null
    baseDispose()
  })
</script>

<template>
  <PageLayout
    title="🦴 骨骼动画"
    description="加载 GLB 模型并可视化骨骼结构，支持动画切换"
  >
    <template #content>
      <div class="features">
        <h3>骨骼动画功能：</h3>
        <ul>
          <li>📦 <strong>GLTFLoader</strong> - 加载 GLB 模型</li>
          <li>🦴 <strong>SkeletonHelper</strong> - 骨骼可视化</li>
          <li>🎭 多动画切换（带淡入淡出）</li>
          <li>👤 SkinnedMesh 骨骼蒙皮</li>
          <li>⏱️ AnimationMixer 播放控制</li>
        </ul>
      </div>
    </template>
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
