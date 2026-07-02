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
    renderer: _renderer,
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
  let gui: GUI | null = null
  let swordMesh: THREE.Mesh | null = null
  let envMap: THREE.Texture | null = null
  let loadedModel: THREE.Group | null = null
  let aoMapTexture: THREE.Texture | null = null
  let standardMaterialInterval: ReturnType<typeof setInterval> | null = null

  /**
   * 加载 HDR 环境贴图（使用折射映射）
   */
  const loadHDREnvironment = () => {
    const rgbeLoader = new RGBELoader()

    rgbeLoader.load(
      "/three-project/texture/3DTotal-Medieval_City_0001_4k.hdr",
      (texture) => {
        // 设置为折射映射
        texture.mapping = THREE.EquirectangularRefractionMapping
        envMap = texture

        // 设置环境贴图
        if (scene.value) {
          scene.value.background = texture
          scene.value.environment = texture
        }

        console.log("HDR 环境贴图加载成功（折射模式）")

        // 加载完 HDR 后再加载模型
        loadGltfModel()
      },
      undefined,
      (error) => {
        console.error("HDR 环境贴图加载失败:", error)
      }
    )
  }

  /**
   * 加载 GLTF 模型
   */
  const loadGltfModel = () => {
    if (!scene.value || !envMap) return

    // 实例化 GLTF 加载器
    const gltfLoader = new GLTFLoader()

    // 实例化 Draco 解码器
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath("/three-project/draco/")
    gltfLoader.setDRACOLoader(dracoLoader)

    gltfLoader.load(
      "/three-project/model/sword/sword.gltf",
      (gltf) => {
        console.log("模型加载成功:", gltf)
        loadedModel = gltf.scene
        scene.value?.add(gltf.scene)

        // 获取剑柄网格
        const found = gltf.scene.getObjectByName("Pommeau_Plane001")
        swordMesh = found instanceof THREE.Mesh ? found : null

        if (swordMesh) {
          const mat = swordMesh.material
          const singleMat = Array.isArray(mat) ? mat[0] : mat
          console.log("剑柄材质:", singleMat)

          // 保存 aoMap 纹理
          aoMapTexture = (singleMat as THREE.MeshStandardMaterial).aoMap || null

          // 初始化 GUI 控制
          initGUI()
        } else {
          console.error("未找到 Pommeau_Plane001 对象")
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

  const initGUI = () => {
    if (!swordMesh) return

    const mat = swordMesh.material
    const singleMat = Array.isArray(mat) ? mat[0] : mat
    const stdMat = singleMat as THREE.MeshStandardMaterial

    gui = new GUI()

    // 材质参数
    const params = {
      aoMap: true
    }

    // 环境遮蔽贴图控制
    gui
      .add(params, "aoMap")
      .name("环境遮蔽贴图 (AO Map)")
      .onChange((value) => {
        if (swordMesh) {
          stdMat.aoMap = value ? aoMapTexture : null
          stdMat.needsUpdate = true
          console.log("AO Map 切换:", value ? "开启" : "关闭")
        }
      })

    // 材质信息
    const infoFolder = gui.addFolder("📊 材质信息")
    const info = {
      materialType: stdMat.type,
      hasAOMap: !!stdMat.aoMap,
      hasMap: !!stdMat.map,
      hasNormalMap: !!stdMat.normalMap,
      hasMetalnessMap: !!stdMat.metalnessMap,
      hasRoughnessMap: !!stdMat.roughnessMap
    }

    infoFolder.add(info, "materialType").name("材质类型").listen()
    infoFolder.add(info, "hasAOMap").name("有 AO 贴图").listen()
    infoFolder.add(info, "hasMap").name("有颜色贴图").listen()
    infoFolder.add(info, "hasNormalMap").name("有法线贴图").listen()
    infoFolder.add(info, "hasMetalnessMap").name("有金属度贴图").listen()
    infoFolder.add(info, "hasRoughnessMap").name("有粗糙度贴图").listen()

    // 实时更新信息
    standardMaterialInterval = setInterval(() => {
      info.hasAOMap = !!stdMat.aoMap
    }, 100)

    infoFolder.open()
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理定时器
    if (standardMaterialInterval) {
      clearInterval(standardMaterialInterval)
      standardMaterialInterval = null
    }

    // 清理环境贴图
    if (envMap) {
      envMap.dispose()
      envMap = null
    }

    // 清理 AO 贴图
    if (aoMapTexture) {
      aoMapTexture.dispose()
      aoMapTexture = null
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
    swordMesh = null

    // 清理 GUI
    gui?.destroy()

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    // 加载 HDR 环境贴图
    loadHDREnvironment()
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
    title="⚔️ 标准材质详解"
    description="深入了解 Three.js 标准材质的各种贴图类型，特别是环境遮蔽贴图 (AO Map) 的作用"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🗺️ <strong>环境遮蔽贴图</strong> - AO Map 用于模拟光线遮蔽效果</li>
          <li>⚔️ <strong>GLTF 模型</strong> - 加载带有完整材质的剑模型</li>
          <li>🌍 <strong>HDR 环境</strong> - 高动态范围环境贴图提供真实光照</li>
          <li>🎮 <strong>GUI 调试</strong> - 实时切换 AO Map 查看效果对比</li>
          <li>🔧 <strong>Draco 压缩</strong> - 使用 Draco 解码器加载压缩模型</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🗺️ 什么是环境遮蔽贴图 (AO Map)？</h3>
        <ul>
          <li><strong>定义</strong>：Ambient Occlusion Map（环境遮蔽贴图）</li>
          <li><strong>作用</strong>：模拟物体表面凹陷处的光线遮蔽效果</li>
          <li><strong>原理</strong>：黑色区域表示被遮蔽（暗），白色区域表示未遮蔽（亮）</li>
          <li><strong>效果</strong>：增加模型的深度感和真实感</li>
          <li>💡 通过 GUI 开关可以直观对比有无 AO Map 的差异</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎨 标准材质的常见贴图类型：</h3>
        <ul>
          <li><strong>map (颜色贴图)</strong> - 基础颜色信息</li>
          <li><strong>aoMap (环境遮蔽贴图)</strong> - 光线遮蔽效果</li>
          <li><strong>normalMap (法线贴图)</strong> - 表面凹凸细节</li>
          <li><strong>metalnessMap (金属度贴图)</strong> - 金属/非金属区域</li>
          <li><strong>roughnessMap (粗糙度贴图)</strong> - 表面粗糙程度</li>
          <li><strong>emissiveMap (发光贴图)</strong> - 自发光区域</li>
          <li><strong>bumpMap (凹凸贴图)</strong> - 简单凹凸效果</li>
          <li><strong>displacementMap (位移贴图)</strong> - 实际改变顶点位置</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>// 1. 加载 HDR 环境贴图</code></p>
        <p><code>rgbeLoader.load(hdrPath, (texture) => {</code></p>
        <p><code>&nbsp;&nbsp;texture.mapping = THREE.EquirectangularRefractionMapping</code></p>
        <p><code>&nbsp;&nbsp;scene.background = texture</code></p>
        <p><code>&nbsp;&nbsp;scene.environment = texture</code></p>
        <p><code>})</code></p>
        <br>
        <p><code>// 2. 加载 GLTF 模型</code></p>
        <p><code>const dracoLoader = new DRACOLoader()</code></p>
        <p><code>dracoLoader.setDecoderPath('/draco/')</code></p>
        <p><code>gltfLoader.setDRACOLoader(dracoLoader)</code></p>
        <br>
        <p><code>// 3. 控制 AO Map</code></p>
        <p><code>mesh.material.aoMap = value ? aoMapTexture : null</code></p>
        <p><code>mesh.material.needsUpdate = true</code></p>
      </div>

      <div class="info-section">
        <h3>🎯 AO Map 的作用对比：</h3>
        <ul>
          <li><strong>开启 AO Map</strong>：</li>
          <li>&nbsp;&nbsp;• 凹陷处有明显的阴影</li>
          <li>&nbsp;&nbsp;• 物体的立体感和深度感更强</li>
          <li>&nbsp;&nbsp;• 细节更加丰富真实</li>
          <li><strong>关闭 AO Map</strong>：</li>
          <li>&nbsp;&nbsp;• 物体表面光照均匀</li>
          <li>&nbsp;&nbsp;• 缺少细节阴影</li>
          <li>&nbsp;&nbsp;• 显得较为"平面"</li>
          <li>💡 使用 GUI 中的开关实时对比效果</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚙️ 实现要点：</h3>
        <ul>
          <li>1️⃣ <strong>加载 HDR 环境贴图</strong> - 提供真实环境光照</li>
          <li>2️⃣ <strong>配置 Draco 解码器</strong> - 解压缩 GLTF 模型</li>
          <li>3️⃣ <strong>获取目标网格</strong> - 通过名称获取特定对象</li>
          <li>4️⃣ <strong>保存原始贴图</strong> - 用于开关切换</li>
          <li>5️⃣ <strong>更新材质</strong> - needsUpdate = true 生效</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔧 Draco 压缩技术：</h3>
        <ul>
          <li><strong>定义</strong>：Google 开发的 3D 几何压缩库</li>
          <li><strong>优势</strong>：大幅减小模型文件体积（压缩比可达 90%）</li>
          <li><strong>使用</strong>：需要配置解码器路径</li>
          <li><strong>注意</strong>：解码需要时间，适合大型模型</li>
          <li>💡 本例中的剑模型使用了 Draco 压缩</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📊 材质信息面板：</h3>
        <ul>
          <li>实时显示材质类型（通常是 MeshStandardMaterial）</li>
          <li>显示各种贴图的存在情况</li>
          <li>帮助理解模型使用了哪些贴图</li>
          <li>方便调试和学习材质配置</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚠️ 注意事项：</h3>
        <ul>
          <li>🔸 <strong>贴图格式</strong>：AO Map 通常是灰度图</li>
          <li>🔸 <strong>UV 坐标</strong>：贴图需要正确的 UV 映射</li>
          <li>🔸 <strong>材质更新</strong>：修改材质后需设置 needsUpdate = true</li>
          <li>🔸 <strong>Draco 路径</strong>：确保解码器文件路径正确</li>
          <li>🔸 <strong>模型名称</strong>：通过建模软件中的对象名称获取</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🚀 进阶技巧：</h3>
        <ul>
          <li>💡 结合多种贴图创建复杂材质效果</li>
          <li>💡 使用 <strong>aoMapIntensity</strong> 控制 AO 强度</li>
          <li>💡 为 AO Map 指定专用的 UV 通道（aoMap.channel）</li>
          <li>💡 在 Blender 等软件中烘焙自定义 AO 贴图</li>
          <li>💡 配合实时阴影获得更真实的光照效果</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 应用场景：</h3>
        <ul>
          <li>🎮 <strong>游戏开发</strong> - 增强游戏模型的真实感</li>
          <li>🏠 <strong>建筑可视化</strong> - 室内外场景的细节表现</li>
          <li>🚗 <strong>产品展示</strong> - 工业产品的精细渲染</li>
          <li>🎬 <strong>影视预览</strong> - 角色和道具的预览展示</li>
          <li>🎨 <strong>艺术创作</strong> - 数字艺术作品的材质表现</li>
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
    color: #42b983;
  }

  .features,
  .info-section,
  .code-tip,
  .controls-tip {
    margin-bottom: 16px;
  }

  .features h3,
  .info-section h3,
  .code-tip p:first-child,
  .controls-tip p:first-child {
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
