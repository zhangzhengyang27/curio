<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 容器引用
  const containerRef = shallowRef(null)

  // 使用公共的 Three.js 场景逻辑
  const {
    scene,
    renderer,
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
  let duckMesh: THREE.Mesh | null = null
  let glassMaterial: THREE.MeshPhongMaterial | null = null
  let envMap: THREE.Texture | null = null
  let loadedModel: THREE.Group | null = null
  let originalMaterial: THREE.Material | null = null

  /**
   * 加载 HDR 环境贴图（使用折射映射）
   */
  const loadHDREnvironment = () => {
    const rgbeLoader = new RGBELoader()

    rgbeLoader.load(
      "/three-project/texture/3DTotal-Medieval_City_0001_4k.hdr",
      (texture) => {
        // 重要：使用折射映射而不是反射映射
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
   * 添加环境光
   */
  const addLights = () => {
    if (!scene.value) return

    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 1)
    scene.value.add(ambientLight)

    console.log("环境光添加成功")
  }

  /**
   * 创建玻璃/水晶材质
   */
  const createGlassMaterial = () => {
    if (!envMap || !originalMaterial) return null

    return new THREE.MeshPhongMaterial({
      map: originalMaterial.map, // 保留原始颜色贴图
      refractionRatio: 0.7, // 折射率（0-1，越小折射越强）
      reflectivity: 0.99, // 反射率（0-1）
      envMap: envMap, // 环境贴图
      transparent: true, // 启用透明
      opacity: 0.9, // 透明度
      shininess: 100 // 高光强度
    })
  }

  /**
   * 加载 GLTF 模型
   */
  const loadGltfModel = () => {
    if (!scene.value || !envMap) return

    const gltfLoader = new GLTFLoader()

    gltfLoader.load(
      "/three-project/model/Duck.glb",
      (gltf) => {
        console.log("Duck 模型加载成功:", gltf)
        loadedModel = gltf.scene
        scene.value?.add(gltf.scene)

        // 获取鸭子网格
        const found = gltf.scene.getObjectByName("LOD3spShape")
        duckMesh = found instanceof THREE.Mesh ? found : null

        if (duckMesh) {
          // 保存原始材质
          originalMaterial = Array.isArray(duckMesh.material)
            ? duckMesh.material[0]
            : duckMesh.material
          console.log("原始材质:", originalMaterial)

          // 应用玻璃材质
          glassMaterial = createGlassMaterial()
          if (glassMaterial) {
            duckMesh.material = glassMaterial
            console.log("玻璃材质应用成功")
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
   * 更新玻璃材质参数
   */
  interface GlassMaterialParams {
    refractionRatio?: number
    reflectivity?: number
    opacity?: number
    shininess?: number
  }

  const updateGlassMaterial = (params: GlassMaterialParams) => {
    if (!glassMaterial) return

    if (params.refractionRatio !== undefined) {
      glassMaterial.refractionRatio = params.refractionRatio
    }
    if (params.reflectivity !== undefined) {
      glassMaterial.reflectivity = params.reflectivity
    }
    if (params.opacity !== undefined) {
      glassMaterial.opacity = params.opacity
    }
    if (params.shininess !== undefined) {
      glassMaterial.shininess = params.shininess
    }

    glassMaterial.needsUpdate = true
  }

  /**
   * 切换映射模式
   */
  const toggleMappingMode = (useRefraction: boolean) => {
    if (!envMap) return

    if (useRefraction) {
      // 折射模式（玻璃效果）
      envMap.mapping = THREE.EquirectangularRefractionMapping
      console.log("切换到折射模式")
    } else {
      // 反射模式（镜面效果）
      envMap.mapping = THREE.EquirectangularReflectionMapping
      console.log("切换到反射模式")
    }

    // 更新材质
    if (glassMaterial) {
      glassMaterial.envMap = envMap
      glassMaterial.needsUpdate = true
    }
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    // 玻璃材质参数
    const glassFolder = gui.addFolder("🔮 玻璃材质参数")

    const glassParams = {
      refractionRatio: 0.7,
      reflectivity: 0.99,
      opacity: 0.9,
      shininess: 100,
      useRefraction: true
    }

    // 折射率控制
    glassFolder
      .add(glassParams, "refractionRatio", 0, 1, 0.01)
      .name("折射率")
      .onChange((value) => {
        updateGlassMaterial({ refractionRatio: value })
      })

    // 反射率控制
    glassFolder
      .add(glassParams, "reflectivity", 0, 1, 0.01)
      .name("反射率")
      .onChange((value) => {
        updateGlassMaterial({ reflectivity: value })
      })

    // 透明度控制
    glassFolder
      .add(glassParams, "opacity", 0, 1, 0.01)
      .name("透明度")
      .onChange((value) => {
        updateGlassMaterial({ opacity: value })
      })

    // 高光强度控制
    glassFolder
      .add(glassParams, "shininess", 0, 200, 1)
      .name("高光强度")
      .onChange((value) => {
        updateGlassMaterial({ shininess: value })
      })

    // 映射模式切换
    glassFolder
      .add(glassParams, "useRefraction")
      .name("使用折射（玻璃）")
      .onChange((value) => {
        toggleMappingMode(value)
      })

    glassFolder.open()

    // 材质信息
    const infoFolder = gui.addFolder("📊 材质信息")
    const info = {
      materialType: "加载中...",
      mappingMode: "折射",
      hasEnvMap: false
    }

    infoFolder.add(info, "materialType").name("材质类型").listen()
    infoFolder.add(info, "mappingMode").name("映射模式").listen()
    infoFolder.add(info, "hasEnvMap").name("是否有环境贴图").listen()

    // 实时更新信息
    setInterval(() => {
      if (glassMaterial) {
        info.materialType = glassMaterial.type
        info.hasEnvMap = !!glassMaterial.envMap
        if (envMap) {
          info.mappingMode = envMap.mapping === THREE.EquirectangularRefractionMapping ? "折射" : "反射"
        }
      }
    }, 100)

    infoFolder.open()
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理环境贴图
    if (envMap) {
      envMap.dispose()
      envMap = null
    }

    // 清理玻璃材质
    if (glassMaterial) {
      glassMaterial.dispose()
      glassMaterial = null
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
    // 先加载 HDR 环境贴图（使用折射映射）
    loadHDREnvironment()
    // 添加光源
    addLights()
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
    title="💎 Phong 玻璃水晶效果"
    description="使用 MeshPhongMaterial 配合环境贴图折射创建逼真的玻璃/水晶材质效果"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>💎 <strong>玻璃效果</strong> - 使用折射映射创建透明玻璃材质</li>
          <li>🔮 <strong>水晶效果</strong> - 高反射率模拟水晶质感</li>
          <li>🌍 <strong>环境折射</strong> - HDR 环境贴图折射映射</li>
          <li>🔄 <strong>实时调节</strong> - 动态调整折射率、反射率等参数</li>
          <li>✨ <strong>模式切换</strong> - 折射模式 vs 反射模式对比</li>
          <li>🎮 <strong>GUI 调试</strong> - 实时调整材质参数查看效果</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔬 折射原理：</h3>
        <ul>
          <li><strong>折射现象</strong>：光线通过不同介质时发生弯曲</li>
          <li><strong>折射率</strong>：refractionRatio，控制光线弯曲程度（0-1）</li>
          <li><strong>值越小</strong>：折射越强，玻璃越"厚重"</li>
          <li><strong>值越大</strong>：折射越弱，接近透明</li>
          <li>💡 真实玻璃的折射率约 0.67（空气/玻璃 = 1/1.5）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>✨ 反射与折射对比：</h3>
        <ul>
          <li><strong>反射（Reflection）</strong>：</li>
          <li>&nbsp;&nbsp;• 光线在表面反弹，如镜子</li>
          <li>&nbsp;&nbsp;• 使用 <code>EquirectangularReflectionMapping</code></li>
          <li>&nbsp;&nbsp;• 适合：金属、镜面、水面</li>
          <li><strong>折射（Refraction）</strong>：</li>
          <li>&nbsp;&nbsp;• 光线穿透物体并弯曲，如玻璃</li>
          <li>&nbsp;&nbsp;• 使用 <code>EquirectangularRefractionMapping</code></li>
          <li>&nbsp;&nbsp;• 适合：玻璃、水晶、宝石、液体</li>
          <li>💡 可在 GUI 切换模式实时对比效果</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎨 核心参数说明：</h3>
        <ul>
          <li><strong>refractionRatio</strong> - 折射率（0-1）</li>
          <li>&nbsp;&nbsp;• 0.7：标准玻璃效果（推荐）</li>
          <li>&nbsp;&nbsp;• 0.5-0.6：厚重玻璃、水晶</li>
          <li>&nbsp;&nbsp;• 0.8-0.9：薄玻璃、泡泡</li>
          <li><strong>reflectivity</strong> - 反射率（0-1）</li>
          <li>&nbsp;&nbsp;• 0.99：高反射，水晶般闪亮</li>
          <li>&nbsp;&nbsp;• 0.5：中等反射，普通玻璃</li>
          <li>&nbsp;&nbsp;• 0.1：低反射，磨砂玻璃</li>
          <li><strong>opacity</strong> - 透明度（0-1）</li>
          <li><strong>shininess</strong> - 高光强度（0-200）</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>// 1. 设置环境贴图为折射映射</code></p>
        <p><code>envMap.mapping = THREE.EquirectangularRefractionMapping</code></p>
        <br>
        <p><code>// 2. 创建玻璃材质</code></p>
        <p><code>new THREE.MeshPhongMaterial({</code></p>
        <p><code>&nbsp;&nbsp;refractionRatio: 0.7, // 折射率</code></p>
        <p><code>&nbsp;&nbsp;reflectivity: 0.99, // 反射率</code></p>
        <p><code>&nbsp;&nbsp;envMap: envMap, // 环境贴图</code></p>
        <p><code>&nbsp;&nbsp;transparent: true // 透明</code></p>
        <p><code>})</code></p>
      </div>

      <div class="info-section">
        <h3>🎯 实现要点：</h3>
        <ul>
          <li>1️⃣ <strong>加载 HDR 环境贴图</strong> - 提供真实环境光照</li>
          <li>2️⃣ <strong>设置折射映射</strong> - <code>EquirectangularRefractionMapping</code></li>
          <li>3️⃣ <strong>配置材质参数</strong> - refractionRatio 和 reflectivity</li>
          <li>4️⃣ <strong>启用透明</strong> - transparent: true</li>
          <li>5️⃣ <strong>添加环境光</strong> - 照亮场景整体</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔮 不同材质效果建议：</h3>
        <ul>
          <li><strong>普通玻璃</strong>：</li>
          <li>&nbsp;&nbsp;• refractionRatio: 0.67-0.7</li>
          <li>&nbsp;&nbsp;• reflectivity: 0.5-0.7</li>
          <li><strong>水晶/钻石</strong>：</li>
          <li>&nbsp;&nbsp;• refractionRatio: 0.5-0.6</li>
          <li>&nbsp;&nbsp;• reflectivity: 0.95-0.99</li>
          <li>&nbsp;&nbsp;• shininess: 150-200</li>
          <li><strong>冰块</strong>：</li>
          <li>&nbsp;&nbsp;• refractionRatio: 0.75-0.8</li>
          <li>&nbsp;&nbsp;• reflectivity: 0.6-0.8</li>
          <li>&nbsp;&nbsp;• opacity: 0.7-0.85</li>
          <li><strong>泡泡</strong>：</li>
          <li>&nbsp;&nbsp;• refractionRatio: 0.85-0.95</li>
          <li>&nbsp;&nbsp;• reflectivity: 0.9-0.99</li>
          <li>&nbsp;&nbsp;• opacity: 0.3-0.5</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚠️ 注意事项：</h3>
        <ul>
          <li>🔸 <strong>HDR 环境贴图</strong>：折射效果依赖高质量的环境贴图</li>
          <li>🔸 <strong>映射模式</strong>：必须设置为 <code>RefractionMapping</code></li>
          <li>🔸 <strong>透明度</strong>：需要启用 <code>transparent: true</code></li>
          <li>🔸 <strong>渲染顺序</strong>：透明物体可能需要注意渲染顺序</li>
          <li>🔸 <strong>性能</strong>：环境贴图折射比反射计算量稍大</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🚀 进阶技巧：</h3>
        <ul>
          <li>💡 结合 <strong>normalMap</strong> 创建表面纹理的玻璃</li>
          <li>💡 使用多层材质模拟双层玻璃</li>
          <li>💡 动态改变折射率实现"变形"动画</li>
          <li>💡 配合后期处理实现更真实的光学效果</li>
          <li>💡 使用 <strong>MeshPhysicalMaterial</strong> 获得更真实的玻璃（PBR）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📚 相关知识：</h3>
        <ul>
          <li><strong>斯涅尔定律</strong>：描述折射率与入射角的关系</li>
          <li><strong>全反射</strong>：入射角大于临界角时发生</li>
          <li><strong>色散</strong>：不同波长光的折射率不同（彩虹效果）</li>
          <li><strong>菲涅尔效应</strong>：视角不同，反射/折射比例不同</li>
          <li>💡 Three.js 简化了物理模型，便于实时渲染</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 应用场景：</h3>
        <ul>
          <li>🏺 <strong>产品展示</strong> - 玻璃器皿、香水瓶等</li>
          <li>💎 <strong>珠宝展示</strong> - 钻石、宝石、水晶</li>
          <li>🏠 <strong>建筑可视化</strong> - 玻璃幕墙、窗户</li>
          <li>🎮 <strong>游戏场景</strong> - 透明物体、魔法效果</li>
          <li>🔬 <strong>科学可视化</strong> - 液体、透明材料模拟</li>
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
