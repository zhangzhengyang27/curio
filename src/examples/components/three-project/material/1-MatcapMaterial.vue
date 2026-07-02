<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
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

  // GUI 和对象引用
  let gui!: GUI
  let duckMesh: THREE.Mesh | null = null
  let matcapTexture: THREE.Texture | null = null
  let originalMaterial: THREE.Material | null = null
  let loadedModel: THREE.Group | null = null
  let matcapMaterialInterval: ReturnType<typeof setInterval> | null = null

  /**
   * 获取鸭子网格的材质（单材质）
   */
  const getDuckMaterial = () => {
    if (!duckMesh || !duckMesh.material) return null
    return Array.isArray(duckMesh.material) ? duckMesh.material[0] : duckMesh.material
  }

  // 预设的 matcap 纹理列表
  const matcapTextures = [
    {
      name: "1",
      path: "/three-project/texture/matcaps/1.png"
    },
    {
      name: "2",
      path: "/three-project/texture/matcaps/2.png"
    },
    {
      name: "3",
      path: "/three-project/texture/matcaps/3.png"
    },
    {
      name: "4",
      path: "/three-project/texture/matcaps/4.png"
    },
    {
      name: "5",
      path: "/three-project/texture/matcaps/5.png"
    }
  ]

  /**
   * 加载 Matcap 纹理
   */
  const loadMatcapTexture = (texturePath: string) => {
    const textureLoader = new THREE.TextureLoader()

    textureLoader.load(
      texturePath,
      (texture) => {
        matcapTexture = texture
        console.log("Matcap 纹理加载成功:", texturePath)

        // 如果模型已加载，立即应用材质
        if (duckMesh && originalMaterial) {
          applyMatcapMaterial()
        }
      },
      undefined,
      (error) => {
        console.error("Matcap 纹理加载失败:", error)
        // 失败时使用默认纹理
        console.warn("使用默认材质")
      }
    )
  }

  /**
   * 应用 Matcap 材质到模型
   */
  const applyMatcapMaterial = () => {
    if (!duckMesh || !matcapTexture || !originalMaterial) return

    // 创建 Matcap 材质
    duckMesh.material = new THREE.MeshMatcapMaterial({
      matcap: matcapTexture,
      map: (originalMaterial as THREE.MeshStandardMaterial).map // 保留原始的颜色贴图
    })

    console.log("已应用 Matcap 材质")
  }

  /**
   * 切换到原始材质
   */
  const restoreOriginalMaterial = () => {
    if (!duckMesh || !originalMaterial) return

    duckMesh.material = originalMaterial.clone()
    console.log("已恢复原始材质")
  }

  /**
   * 加载 GLTF 模型
   */
  const loadGltfModel = () => {
    if (!scene.value) return

    const gltfLoader = new GLTFLoader()

    gltfLoader.load(
      "/three-project/model/Duck.glb",
      (gltf) => {
        console.log("Duck 模型加载成功:", gltf)
        loadedModel = gltf.scene
        if (!scene.value) return
        scene.value.add(gltf.scene)

        // 获取鸭子网格
        const found = gltf.scene.getObjectByName("LOD3spShape")
        duckMesh = found instanceof THREE.Mesh ? found : null

        if (duckMesh) {
          // 保存原始材质
          originalMaterial = getDuckMaterial()
          console.log("原始材质:", originalMaterial)

          // 如果 matcap 纹理已加载，应用材质
          if (matcapTexture) {
            applyMatcapMaterial()
          }
        } else {
          console.error("未找到 LOD3spShape 对象")
        }
      },
      (progress) => {
        const percent = (progress.loaded / progress.total) * 100
        console.log(`模型加载进度: ${percent.toFixed(2)}%`)
      },
      (error) => {
        console.error("模型加载失败:", error)
      }
    )
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    // 材质控制
    const materialFolder = gui.addFolder("Matcap 材质控制")

    const materialParams = {
      useMatcap: true,
      currentTexture: matcapTextures[0].name
    }

    // 保存 useMatcap controller 的引用
    const useMatcapController = materialFolder
      .add(materialParams, "useMatcap")
      .name("使用 Matcap 材质")
      .onChange((value) => {
        if (value) {
          applyMatcapMaterial()
        } else {
          restoreOriginalMaterial()
        }
      })

    // Matcap 纹理选择
    const textureNames = matcapTextures.map((t) => t.name)
    materialFolder
      .add(materialParams, "currentTexture", textureNames)
      .name("Matcap 纹理")
      .onChange((value) => {
        const selected = matcapTextures.find((t) => t.name === value)
        if (selected) {
          loadMatcapTexture(selected.path)
          // 切换纹理时自动启用 Matcap 材质
          useMatcapController.setValue(true)
        }
      })

    // 恢复原始材质按钮
    const buttonParams = {
      restoreOriginal: () => {
        // 使用 setValue 会自动触发 onChange，同时更新 GUI 显示
        useMatcapController.setValue(false)
      }
    }
    materialFolder.add(buttonParams, "restoreOriginal").name("🔄 恢复原始材质")

    materialFolder.open()

    // 模型信息
    const infoFolder = gui.addFolder("模型信息")
    const info = {
      materialType: "加载中...",
      hasMatcap: false
    }

    infoFolder.add(info, "materialType").name("材质类型").listen()
    infoFolder.add(info, "hasMatcap").name("是否使用 Matcap").listen()

    // 实时更新信息
    matcapMaterialInterval = setInterval(() => {
      const mat = getDuckMaterial()
      if (mat) {
        info.materialType = mat.type
        info.hasMatcap = mat.type === "MeshMatcapMaterial"
      }
    }, 100)
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理定时器
    if (matcapMaterialInterval) {
      clearInterval(matcapMaterialInterval)
      matcapMaterialInterval = null
    }

    // 清理纹理
    if (matcapTexture) {
      matcapTexture.dispose()
      matcapTexture = null
    }

    // 清理加载的模型
    if (loadedModel) {
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
      scene.value?.remove(loadedModel)
      loadedModel = null
    }

    // 清理引用
    duckMesh = null
    originalMaterial = null

    // 清理 GUI
    gui?.destroy()

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    // 先加载默认的 matcap 纹理
    loadMatcapTexture(matcapTextures[0].path)
    // 加载模型
    loadGltfModel()
    // 初始化 GUI
    initGUI()
    // 启动动画循环
    startAnimation()
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🎨 Matcap 材质"
    description="学习如何使用 MeshMatcapMaterial 创建无需光源的真实感渲染效果"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🎨 <strong>Matcap 材质</strong> - MeshMatcapMaterial 材质效果</li>
          <li>🖼️ <strong>多种预设</strong> - 5 种不同风格的 Matcap 纹理</li>
          <li>🔄 <strong>实时切换</strong> - 动态切换不同的 Matcap 纹理</li>
          <li>💡 <strong>无需光源</strong> - 不依赖场景光照即可呈现立体感</li>
          <li>⚡ <strong>性能优越</strong> - 计算简单，渲染速度快</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 什么是 Matcap？</h3>
        <ul>
          <li><strong>全称</strong>：Material Capture（材质捕获）</li>
          <li><strong>原理</strong>：将球形物体的光照效果烘焙到一张纹理中</li>
          <li><strong>映射方式</strong>：根据法向量从纹理中采样颜色</li>
          <li><strong>优势</strong>：无需计算光照，性能极佳</li>
          <li><strong>劣势</strong>：光照效果固定，不能动态改变</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 工作原理：</h3>
        <ul>
          <li>1️⃣ <strong>法向量</strong> - 获取模型表面每个点的法向量</li>
          <li>2️⃣ <strong>视角转换</strong> - 将法向量转换到相机空间</li>
          <li>3️⃣ <strong>UV 映射</strong> - 将法向量 XY 分量映射为 UV 坐标</li>
          <li>4️⃣ <strong>纹理采样</strong> - 从 Matcap 纹理中采样对应位置的颜色</li>
          <li>5️⃣ <strong>最终颜色</strong> - 采样颜色即为该点的最终颜色</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔧 核心代码：</h3>
        <ul>
          <li><code>new THREE.MeshMatcapMaterial({ matcap: texture })</code></li>
          <li><code>material.map</code> - 可以叠加颜色贴图</li>
          <li><code>material.matcap</code> - Matcap 纹理贴图</li>
          <li>💡 纹理通常是 512x512 或 1024x1024 的正方形图片</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>🎨 Matcap 纹理特点：</p>
        <ul style="margin-top: 8px">
          <li>• 通常是一个渲染好的球体截图</li>
          <li>• 包含了光照、高光、反射等所有效果</li>
          <li>• 中心是球体正对相机的部分</li>
          <li>• 边缘是球体侧面和背面的效果</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📊 与其他材质对比：</h3>
        <ul>
          <li><strong>MeshBasicMaterial</strong> - 无光照，纯色或纹理</li>
          <li><strong>MeshLambertMaterial</strong> - 漫反射，需要光源</li>
          <li><strong>MeshPhongMaterial</strong> - 漫反射+镜面反射，需要光源</li>
          <li><strong>MeshStandardMaterial</strong> - PBR 材质，需要光源</li>
          <li><strong>MeshMatcapMaterial</strong> - ⭐ 无需光源，性能好，效果真实</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 应用场景：</h3>
        <ul>
          <li>🎮 <strong>移动游戏</strong> - 性能要求高的场景</li>
          <li>🎨 <strong>概念设计</strong> - 快速展示模型效果</li>
          <li>📱 <strong>Web 3D</strong> - 减少计算，提升流畅度</li>
          <li>🖼️ <strong>静态展示</strong> - 产品展示、艺术作品</li>
          <li>⚡ <strong>低端设备</strong> - 需要兼容性能较差的设备</li>
          <li>🎭 <strong>风格化渲染</strong> - 卡通、手绘风格</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 使用技巧：</h3>
        <ul>
          <li>🎨 可以在 GUI 面板切换不同的 Matcap 纹理</li>
          <li>🔄 点击"恢复原始材质"查看原始效果对比</li>
          <li>🌐 网上有很多免费的 Matcap 纹理资源库</li>
          <li>🎯 可以自己渲染球体制作自定义 Matcap</li>
          <li>⚠️ Matcap 效果不会随相机或光源移动而改变</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔗 资源推荐：</h3>
        <ul>
          <li>📚 <strong>nidorx/matcaps</strong> - GitHub 上的 Matcap 纹理库</li>
          <li>🎨 <strong>ZBrush</strong> - 内置大量 Matcap 材质球</li>
          <li>🌐 <strong>Blender</strong> - 可以渲染自定义 Matcap</li>
          <li>💎 <strong>Substance Designer</strong> - 专业材质创建工具</li>
        </ul>
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

  .features,
  .info-section,
  .code-tip {
    margin-bottom: 16px;
  }

  .features h3,
  .info-section h3,
  .code-tip p:first-child {
    margin-bottom: 8px;
    color: rgba(255, 255, 255, 0.9);
  }

  ul {
    margin: 0;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
    line-height: 1.6;
  }
</style>
