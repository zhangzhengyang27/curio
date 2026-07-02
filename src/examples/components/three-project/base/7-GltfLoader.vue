<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
  import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 容器引用
  const containerRef = shallowRef(null)

  // 使用公共的 Three.js 场景逻辑
  const {
    scene,
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 2, y: 2, z: 5 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05
    },
    showAxesHelper: true
  })

  // Three.js 对象引用
  let gui!: GUI
  let loadedModels: THREE.Object3D[] = [] // 保存加载的模型引用

  /**
   * 加载 GLTF 模型
   */
  const loadGltfModels = () => {
    if (!scene.value) return

    // 实例化 GLTF 加载器
    const gltfLoader = new GLTFLoader()

    // 实例化 DRACO 解码器（用于压缩模型）
    const dracoLoader = new DRACOLoader()
    // 设置 DRACO 解码器路径
    dracoLoader.setDecoderPath("/three-project/draco/")
    // 设置 GLTF 加载器的 DRACO 解码器
    gltfLoader.setDRACOLoader(dracoLoader)

    // 加载第一个模型：Duck（小鸭子）
    gltfLoader.load(
      "/three-project/model/Duck.glb",
      (gltf) => {
        console.log("Duck 模型加载成功:", gltf)
        if (!scene.value) return
        scene.value.add(gltf.scene)
        loadedModels.push(gltf.scene)

        // 可以调整鸭子模型的位置
        gltf.scene.position.set(-2, 0, 0)
        gltf.scene.scale.set(0.01, 0.01, 0.01) // 缩小鸭子
      },
      (progress) => {
        console.log("Duck 加载进度:", (progress.loaded / progress.total) * 100 + "%")
      },
      (error) => {
        console.error("Duck 模型加载失败:", error)
      }
    )

    // 加载第二个模型：City（城市场景，使用 DRACO 压缩）
    gltfLoader.load(
      "/three-project/model/city.glb",
      (gltf) => {
        console.log("City 模型加载成功:", gltf)
        if (!scene.value) return
        scene.value.add(gltf.scene)
        loadedModels.push(gltf.scene)

        // 可以调整城市模型的位置
        gltf.scene.position.set(2, 0, 0)
      },
      (progress) => {
        console.log("City 加载进度:", (progress.loaded / progress.total) * 100 + "%")
      },
      (error) => {
        console.error("City 模型加载失败:", error)
      }
    )
  }

  /**
   * 加载环境贴图
   */
  const loadEnvironmentMap = () => {
    if (!scene.value) return

    const rgbeLoader = new RGBELoader()
    rgbeLoader.load("/three-project/texture/3DTotal-Medieval_City_0001_4k.hdr", (envMap) => {
      // 设置球形贴图
      envMap.mapping = THREE.EquirectangularReflectionMapping
      // 设置场景环境贴图（影响物体的反射和折射）
      if (!scene.value) return
      scene.value.environment = envMap
      console.log("环境贴图加载成功")
    })
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    // 模型控制文件夹
    const modelFolder = gui.addFolder("模型控制")
    modelFolder.close() // 默认关闭

    // 添加模型可见性控制
    const modelParams = {
      showModels: true
    }

    modelFolder
      .add(modelParams, "showModels")
      .name("显示模型")
      .onChange((value) => {
        loadedModels.forEach((model) => {
          model.visible = value
        })
      })

    // 场景信息
    const sceneFolder = gui.addFolder("场景信息")
    sceneFolder.close()

    const sceneInfo = {
      objectCount: 0
    }

    sceneFolder.add(sceneInfo, "objectCount").name("对象数量").listen()

    // 更新场景信息
    setInterval(() => {
      sceneInfo.objectCount = scene.value?.children.length || 0
    }, 1000)
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理加载的模型
    loadedModels.forEach((model) => {
      model.traverse((child) => {
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
    })
    loadedModels = []

    gui?.destroy()
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    loadEnvironmentMap()
    loadGltfModels()
    initGUI()
    startAnimation()
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="📦 GLTF 模型加载"
    description="学习如何在 Three.js 中加载 GLTF/GLB 3D 模型"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>📦 <strong>GLTF/GLB 加载</strong> - 使用 GLTFLoader 加载 3D 模型</li>
          <li>🗜️ <strong>DRACO 压缩</strong> - 支持 DRACO 压缩模型</li>
          <li>🌍 <strong>HDR 环境贴图</strong> - 真实的环境光照</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 GLTF 格式说明：</h3>
        <ul>
          <li><strong>GLTF</strong> - GL Transmission Format（GL 传输格式）</li>
          <li><strong>.gltf</strong> - JSON 格式，包含外部资源</li>
          <li><strong>.glb</strong> - 二进制格式，所有资源打包在一起</li>
          <li><strong>DRACO</strong> - 几何体压缩算法，大幅减小文件大小</li>
          <li>✅ 推荐使用 .glb 格式（更小、更快）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔧 加载器配置：</h3>
        <ul>
          <li><strong>GLTFLoader</strong> - 加载 GLTF/GLB 模型</li>
          <li><strong>DRACOLoader</strong> - 解码压缩的几何体</li>
          <li><strong>RGBELoader</strong> - 加载 HDR 环境贴图</li>
          <li>💡 DRACO 需要配置解码器路径</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>🔧 核心代码：</p>
        <p style="margin-top: 8px">
          基础加载：<code style="background: rgba(0, 0, 0, 0.3); padding: 2px 6px; border-radius: 3px">gltfLoader.load('./model.glb', (gltf) => scene.add(gltf.scene))</code>
        </p>
        <p style="margin-top: 4px">
          DRACO 压缩：<code style="background: rgba(0, 0, 0, 0.3); padding: 2px 6px; border-radius: 3px">gltfLoader.setDRACOLoader(dracoLoader)</code>
        </p>
      </div>
    </template>

    <!-- Three.js 容器 -->
    <div ref="containerRef" />
  </PageLayout>
</template>

<style scoped>
  code {
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 6px;
    border-radius: 3px;
    font-family: "Courier New", monospace;
    font-size: 11px;
  }
</style>
