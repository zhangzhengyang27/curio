<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted, reactive, ref } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
  import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"
  import { TransformControls } from "three/examples/jsm/controls/TransformControls.js"
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

  // ==================== 响应式状态 ====================
  const containerRef = shallowRef<HTMLDivElement | null>(null)
  const isLoading = ref(true)
  const loadingText = ref("正在初始化场景...")
  const selectedObjectName = ref("")

  // ==================== 场景对象引用 ====================
  let tControls: TransformControls | null = null
  let orbitControls: OrbitControls | null = null
  let basicScene: THREE.Group | null = null
  let gui: GUI | null = null
  let gltfLoader: GLTFLoader | null = null
  let dracoLoader: DRACOLoader | null = null
  let gridHelper: THREE.GridHelper | null = null
  let sceneMeshes: Array<{ name: string; path: string; icon: string; object3d: THREE.Group; instanceName: string }> = []
  let meshesNum: Record<string, number> = {}
  let meshesFolder: GUI | null = null

  /**
   * TransformControls 拖动事件：切换 OrbitControls 启用状态
   */
  const onTControlsDraggingChanged = (event: { value: unknown }) => {
    if (orbitControls) {
      orbitControls.enabled = !(event.value as boolean)
    }
  }

  /**
   * TransformControls 变化事件：吸附到地面
   */
  const onTControlsChange = () => {
    if (tControls && eventObj.isClampGroup && tControls.object) {
      // 将物体吸附到地面
      tControls.object.position.y = 0
    }
  }

  // ==================== 配置对象 ====================
  interface EventObj {
    translateSnapNum: number | null
    rotateSnapNum: number
    scaleSnapNum: number
    isClampGroup: boolean
    isLight: boolean
  }

  const eventObj = reactive<EventObj>({
    translateSnapNum: null,
    rotateSnapNum: 0,
    scaleSnapNum: 0,
    isClampGroup: false,
    isLight: true
  })

  // ==================== 物体列表配置 ====================
  const meshList = [
    {
      name: "盆栽",
      path: "/three-project/model/house/plants-min.glb",
      icon: "🪴"
    },
    {
      name: "单人沙发",
      path: "/three-project/model/house/sofa_chair_min.glb",
      icon: "🛋️"
    }
  ]

  const {
    scene,
    camera,
    renderer,
    startAnimation,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    fov: 45,
    cameraPosition: { x: 3, y: 2.5, z: 8 }, // 相机位置
    enableControls: false, // 禁用默认控制器，使用自定义
    showAxesHelper: true,
    axesHelperSize: 5,
    showGridHelper: false
  })

  // ==================== 场景初始化方法 ====================

  /**
   * 加载 HDR 环境贴图
   */
  const loadHDREnvironment = () => {
    loadingText.value = "正在加载环境贴图..."
    const rgbeLoader = new RGBELoader()
    rgbeLoader.load(
      "/three-project/texture/Video_Copilot-Back Light_0007_4k.hdr",
      (envMap) => {
        if (!scene.value) return
        envMap.mapping = THREE.EquirectangularRefractionMapping
        scene.value.background = new THREE.Color(0xcccccc)
        scene.value.environment = envMap
        console.log("✅ HDR 环境贴图加载完成")
      },
      (progress) => {
        const percent = ((progress.loaded / progress.total) * 100).toFixed(0)
        loadingText.value = `正在加载环境贴图... ${percent}%`
      },
      (error) => {
        console.warn("⚠️ HDR 加载失败，使用默认背景:", error)
        if (!scene.value) return
        scene.value.background = new THREE.Color(0xcccccc)
      }
    )
  }

  /**
   * 添加网格辅助器
   */
  const addGridHelper = () => {
    if (!scene.value) return
    gridHelper = new THREE.GridHelper(50, 50)
    gridHelper.material.opacity = 0.3
    gridHelper.material.transparent = true
    scene.value.add(gridHelper)
  }

  /**
   * 设置渲染器
   */
  const setupRenderer = () => {
    if (!renderer.value) return
    renderer.value.shadowMap.enabled = true // 开启阴影映射
    renderer.value.toneMapping = THREE.ReinhardToneMapping // 设置色调映射
    renderer.value.toneMappingExposure = 1 // 设置色调映射曝光
  }

  /**
   * 初始化 GLTF 加载器
   */
  const initGLTFLoader = () => {
    gltfLoader = new GLTFLoader()
    dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath("/three-project/draco/")
    gltfLoader.setDRACOLoader(dracoLoader)
  }

  /**
   * 加载基础户型模型
   */
  const loadBasicScene = () => {
    if (!gltfLoader) return
    loadingText.value = "正在加载户型模型..."
    gltfLoader.load(
      "/three-project/model/house/house-scene-min.glb",
      (gltf) => {
        basicScene = gltf.scene
        console.log("✅ 户型基础模型加载完成")
      },
      (progress) => {
        if (progress.total > 0) {
          const percent = ((progress.loaded / progress.total) * 100).toFixed(0)
          loadingText.value = `正在加载户型模型... ${percent}%`
        }
      },
      (error) => {
        console.warn("⚠️ 户型模型加载失败:", error)
      }
    )
  }

  // ==================== 变换控制器方法 ====================

  /**
   * 创建变换控制器
   */
  const createTransformControls = () => {
    if (!camera.value || !renderer.value) return

    // 创建变换控制器
    tControls = new TransformControls(camera.value, renderer.value.domElement)

    // 监听拖动事件，禁用轨道控制器
      tControls.addEventListener("dragging-changed", onTControlsDraggingChanged)

      // 监听变化，实现吸附功能。如果isClampGroup为true，则将物体吸附到地面
      tControls.addEventListener("change", onTControlsChange)

      if (scene.value) {
        scene.value.add((tControls as any)._root)
      }
      console.log("✅ 变换控制器创建完成")
  }

  /**
   * 选择物体（变换控制器附加到物体）
   */
  const tControlSelect = (mesh: THREE.Object3D, name = "未命名物体") => {
    if (tControls) {
      tControls.attach(mesh)
      selectedObjectName.value = name
      console.log(`🎯 选中物体: ${name}`)
    }
  }

  // ==================== 物体管理方法 ====================

  /**
   * 添加物体到场景
   */
  const addMeshToScene = (item: typeof meshList[number]) => {
    if (!gltfLoader || !scene.value) return

    console.log(`📦 开始加载: ${item.icon} ${item.name}`)

    gltfLoader.load(
      item.path,
      (gltf) => {
        if (!scene.value) return
        const object3d = gltf.scene

        // 记录物体信息
        meshesNum[item.name] = meshesNum[item.name] ? meshesNum[item.name] + 1 : 1
        const meshName = `${item.icon} ${item.name}${meshesNum[item.name]}`

        sceneMeshes.push({
          ...item,
          object3d,
          instanceName: meshName
        })

        scene.value.add(object3d)
        tControlSelect(object3d, meshName)

        // 动态添加到 GUI
        const meshOpt = {
          toggleMesh: () => tControlSelect(object3d, meshName)
        }
        if (meshesFolder) {
          meshesFolder.add(meshOpt, "toggleMesh").name(meshName)
        }

        console.log(`✅ ${item.icon} ${item.name} 添加成功`)
      },
      (progress) => {
        if (progress.total > 0) {
          const percent = ((progress.loaded / progress.total) * 100).toFixed(0)
          console.log(`⏳ ${item.name} 加载中... ${percent}%`)
        }
      },
      (error) => {
        console.error(`❌ ${item.name} 加载失败:`, error)
      }
    )
  }

  /**
   * GUI 事件方法
   */
  const guiMethods = {
    addScene: () => {
      if (basicScene && scene.value) {
        scene.value.add(basicScene)
        selectedObjectName.value = "🏠 户型基础模型"
        console.log("✅ 户型基础模型已添加到场景")
      } else {
        console.warn("⚠️ 户型模型尚未加载完成，请稍候")
      }
    },
    setTranslate: () => {
      if (tControls) {
        tControls.setMode("translate")
        console.log("🔧 切换到位移模式")
      }
    },
    setRotate: () => {
      if (tControls) {
        tControls.setMode("rotate")
        console.log("🔧 切换到旋转模式")
      }
    },
    setScale: () => {
      if (tControls) {
        tControls.setMode("scale")
        console.log("🔧 切换到缩放模式")
      }
    },
    toggleSpace: () => {
      if (tControls) {
        const newSpace = tControls.space === "local" ? "world" : "local"
        tControls.setSpace(newSpace)
        console.log(`🌍 切换到${newSpace === "world" ? "世界" : "本地"}坐标系`)
      }
    },
    cancelMesh: () => {
      if (tControls) {
        tControls.detach()
        selectedObjectName.value = ""
        console.log("❌ 取消选择")
      }
    }
  }

  /**
   * 创建 GUI 控制面板
   */
  const createGUI = () => {
    gui = new GUI()

    // 基础操作
    gui.add(guiMethods, "addScene").name("添加户型基础模型")
    gui.add(guiMethods, "setTranslate").name("位移模式 (快捷键 T)")
    gui.add(guiMethods, "setRotate").name("旋转模式 (快捷键 R)")
    gui.add(guiMethods, "setScale").name("缩放模式 (快捷键 S)")
    gui.add(guiMethods, "toggleSpace").name("切换空间模式")
    gui.add(guiMethods, "cancelMesh").name("取消选择")

    // 灯光控制
    gui
      .add(eventObj, "isLight")
      .name("是否开启灯光")
      .onChange((value) => {
        if (renderer.value) {
          renderer.value.toneMappingExposure = value ? 1 : 0.1
        }
      })

    // 添加物体文件夹
    const folderAddMesh = gui.addFolder("添加物体")
    meshList.forEach((item) => {
      const itemMethods = {
        addMesh: () => addMeshToScene(item)
      }
      folderAddMesh.add(itemMethods, "addMesh").name(item.name)
    })

    // 家居列表文件夹
    meshesFolder = gui.addFolder("家居列表")

    // 固定设置文件夹
    const snapFolder = gui.addFolder("固定设置")
    snapFolder
      .add(eventObj, "translateSnapNum", {
        不固定: null,
        1: 1,
        0.1: 0.1,
        10: 10
      })
      .name("固定位移设置")
      .onChange(() => {
        if (tControls) {
          tControls.setTranslationSnap(eventObj.translateSnapNum)
        }
      })
    snapFolder
      .add(eventObj, "rotateSnapNum", 0, 1)
      .step(0.01)
      .name("旋转")
      .onChange(() => {
        if (tControls) {
          tControls.setRotationSnap(eventObj.rotateSnapNum * Math.PI * 2)
        }
      })
    snapFolder
      .add(eventObj, "scaleSnapNum", 0, 2)
      .step(0.1)
      .name("缩放")
      .onChange(() => {
        if (tControls) {
          tControls.setScaleSnap(eventObj.scaleSnapNum)
        }
      })
    snapFolder.add(eventObj, "isClampGroup").name("是否吸附到地面")

    console.log("GUI 创建完成")
  }

  /**
   * 键盘快捷键监听
   */
  const handleKeydown = (event: KeyboardEvent) => {
    switch (event.key.toLowerCase()) {
      case "t":
        guiMethods.setTranslate()
        break
      case "r":
        guiMethods.setRotate()
        break
      case "s":
        guiMethods.setScale()
        break
    }
  }

  // ==================== 初始化方法 ====================
  const initContent = () => {
    loadingText.value = "正在初始化场景..."

    // 设置相机朝向
    if (camera.value) {
      camera.value.lookAt(0, 1.2, 0)
    }

    setupRenderer()
    addGridHelper()
    loadHDREnvironment()
    initGLTFLoader()
    loadBasicScene()
    createTransformControls()
    createGUI()

    // 添加键盘监听
    window.addEventListener("keydown", handleKeydown)

    // 延迟隐藏加载界面
    setTimeout(() => {
      isLoading.value = false
      console.log("🎉 场景初始化完成！")
    }, 2000)
  }

  // 组件挂载后初始化
  onMounted(() => {
    // 等待场景初始化完成
    setTimeout(() => {
      initContent()

      // 创建自定义轨道控制器
      if (!camera.value || !renderer.value) return
      orbitControls = new OrbitControls(camera.value, renderer.value.domElement)
      orbitControls.enableDamping = true // 启用阻尼
      // 轨道控制器已在模块作用域中声明

      // 开始渲染循环
      startAnimation(() => {
        if (orbitControls) {
          orbitControls.update() // 更新轨道控制器
        }
      })
    }, 100)
  })

  // 组件卸载时清理
  onUnmounted(() => {
    // 移除键盘监听
    window.removeEventListener("keydown", handleKeydown)

    // 销毁 GUI
    if (gui) {
      gui.destroy()
      gui = null
    }

    // 清理变换控制器
    if (tControls) {
      tControls.removeEventListener("dragging-changed", onTControlsDraggingChanged)
      tControls.removeEventListener("change", onTControlsChange)
      tControls.detach()
      tControls.dispose()
      tControls = null
    }

    // 清理轨道控制器
    if (orbitControls) {
      orbitControls.dispose()
      orbitControls = null
    }

    // 清理加载器
    if (dracoLoader) {
      dracoLoader.dispose()
      dracoLoader = null
    }

    // 移除并释放基础户型模型
    if (basicScene) {
      scene.value?.remove(basicScene)
      basicScene.traverse((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
      basicScene = null
    }

    // 清理场景中的物体
    sceneMeshes.forEach((item) => {
      if (item.object3d) {
        scene.value?.remove(item.object3d)
        item.object3d.traverse((child) => {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose())
            } else {
              child.material.dispose()
            }
          }
        })
      }
    })
    sceneMeshes = []
    meshesNum = {}
    meshesFolder = null

    // 调用基础清理，释放 scene/renderer/camera/ResizeObserver
    baseDispose()
  })
</script>

<template>
  <PageLayout
    title="家居场景编辑器"
    description="使用变换控制器实现家居场景编辑功能"
  >
    <!-- 内容区域 -->
    <template #content>
      <!-- 选中物体提示 -->
      <div
        v-if="selectedObjectName"
        class="selected-object"
      >
        <p>
          🎯 当前选中: <strong>{{ selectedObjectName }}</strong>
        </p>
      </div>

      <div class="controls-tip">
        <p>🎮 使用右侧面板控制场景</p>
      </div>

      <div class="features">
        <h3>🏠 编辑器功能</h3>
        <ul>
          <li>✅ 变换控制器（移动/旋转/缩放）</li>
          <li>✅ 3D 模型加载与管理</li>
          <li>✅ 键盘快捷键操作</li>
          <li>✅ 吸附到地面功能</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⌨️ 快捷键</h3>
        <ul>
          <li><strong>T</strong> - 位移模式</li>
          <li><strong>R</strong> - 旋转模式</li>
          <li><strong>S</strong> - 缩放模式</li>
        </ul>
      </div>

      <div class="tips">
        <h3>💡 使用技巧</h3>
        <ul>
          <li>🔧 <strong>变换控制器</strong>：选择物体后可拖拽、旋转、缩放</li>
          <li>🎯 <strong>空间模式</strong>：切换本地/世界坐标系</li>
          <li>📐 <strong>固定设置</strong>：启用网格吸附功能</li>
          <li>🏠 <strong>户型模型</strong>：先加载户型基础模型</li>
          <li>🪑 <strong>家具添加</strong>：从添加物体菜单选择家具</li>
        </ul>
      </div>

      <div class="usage">
        <h3>📚 TransformControls</h3>
        <ul>
          <li>🔄 <strong>translate</strong> - 位移控制</li>
          <li>🔁 <strong>rotate</strong> - 旋转控制</li>
          <li>📏 <strong>scale</strong> - 缩放控制</li>
          <li>🌍 <strong>space</strong> - 本地/世界坐标切换</li>
          <li>🔒 <strong>snap</strong> - 网格吸附</li>
        </ul>
      </div>

      <p class="small-text">
        📌 拖拽物体时轨道控制器自动禁用
      </p>
    </template>

    <!-- Three.js 容器 -->
    <div
      ref="containerRef"
      class="three-container"
    >
      <!-- 加载界面 -->
      <div
        v-if="isLoading"
        class="loading-overlay"
      >
        <div class="loading-content">
          <div class="spinner" />
          <p class="loading-text">
            {{ loadingText }}
          </p>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<style scoped>
  .three-container {
    width: 100%;
    height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: relative;
  }

  /* 选中物体提示 */
  .selected-object {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    margin-bottom: 15px;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    animation: slideIn 0.3s ease-out;
  }

  .selected-object p {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
  }

  .selected-object strong {
    font-weight: 700;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 加载界面 */
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(10px);
  }

  .loading-content {
    text-align: center;
    color: white;
  }

  .spinner {
    width: 50px;
    height: 50px;
    margin: 0 auto 20px;
    border: 4px solid rgba(255, 255, 255, 0.2);
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-text {
    font-size: 16px;
    font-weight: 500;
    color: #fff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }
</style>
