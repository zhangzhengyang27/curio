<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
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
  let planeMesh: THREE.Mesh | null = null
  let planeMaterial: THREE.MeshLambertMaterial | THREE.MeshPhongMaterial | null = null
  let envMap: THREE.Texture | null = null

  // 纹理引用
  let colorTexture: THREE.Texture | null = null
  let specularTexture: THREE.Texture | null = null
  let normalTexture: THREE.Texture | null = null
  let dispTexture: THREE.Texture | null = null
  let aoTexture: THREE.Texture | null = null

  /**
   * 加载 HDR 环境贴图
   */
  const loadHDREnvironment = () => {
    const rgbeLoader = new RGBELoader()

    rgbeLoader.load(
      "/three-project/texture/3DTotal-Medieval_City_0001_4k.hdr",
      (texture) => {
        // 设置球形贴图
        texture.mapping = THREE.EquirectangularReflectionMapping
        envMap = texture

        // 设置环境贴图
        if (scene.value) {
          scene.value.background = texture
          scene.value.environment = texture
        }

        // 如果平面材质已创建，应用环境贴图
        if (planeMaterial) {
          planeMaterial.envMap = texture
          planeMaterial.needsUpdate = true
        }

        console.log("HDR 环境贴图加载成功")
      },
      undefined,
      (error) => {
        console.error("HDR 环境贴图加载失败:", error)
      }
    )
  }

  /**
   * 加载纹理
   */
  const loadTextures = () => {
    const textureLoader = new THREE.TextureLoader()

    // 颜色贴图
    colorTexture = textureLoader.load("/three-project/texture/waterCover/CityNewYork002_COL_VAR1_1K.png")
    colorTexture.colorSpace = THREE.SRGBColorSpace

    // 高光贴图
    specularTexture = textureLoader.load("/three-project/texture/waterCover/CityNewYork002_GLOSS_1K.jpg")

    // 法线贴图
    normalTexture = textureLoader.load("/three-project/texture/waterCover/CityNewYork002_NRM_1K.jpg")

    // 位移贴图
    dispTexture = textureLoader.load("/three-project/texture/waterCover/CityNewYork002_DISP_1K.jpg")

    // 环境光遮蔽贴图
    aoTexture = textureLoader.load("/three-project/texture/waterCover/CityNewYork002_AO_1K.jpg")

    console.log("所有纹理开始加载")
  }

  /**
   * 添加光源
   */
  const addLights = () => {
    if (!scene.value) return

    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    scene.value.add(ambientLight)

    // 点光源
    const pointLight = new THREE.PointLight(0xffffff, 1)
    pointLight.position.set(0, 3, 0)
    scene.value.add(pointLight)

    console.log("光源添加成功")
  }

  /**
   * 创建平面 - Lambert 材质
   */
  const createLambertPlane = () => {
    if (!scene.value) return

    // 创建平面几何体（高细分度以展示位移效果）
    const planeGeometry = new THREE.PlaneGeometry(1, 1, 200, 200)

    // 创建 Lambert 材质
    planeMaterial = new THREE.MeshLambertMaterial({
      map: colorTexture, // 颜色贴图
      transparent: true, // 透明
      normalMap: normalTexture, // 法线贴图
      bumpMap: dispTexture, // 凹凸贴图
      displacementMap: dispTexture, // 位移贴图
      displacementScale: 0.02, // 位移强度
      aoMap: aoTexture // 环境光遮蔽贴图
    })

    planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
    planeMesh.rotation.x = -Math.PI / 2
    scene.value.add(planeMesh)

    console.log("Lambert 平面创建成功")
  }

  /**
   * 切换到 Phong 材质
   */
  const switchToPhongMaterial = () => {
    if (!planeMesh) return

    const newMaterial = new THREE.MeshPhongMaterial({
      map: colorTexture, // 颜色贴图
      specularMap: specularTexture, // 高光贴图
      transparent: true, // 透明
      normalMap: normalTexture, // 法线贴图
      bumpMap: dispTexture, // 凹凸贴图
      displacementMap: dispTexture, // 位移贴图
      displacementScale: 0.02, // 位移强度
      aoMap: aoTexture // 环境光遮蔽贴图
    })

    // 如果有环境贴图，应用到新材质
    if (envMap) {
      newMaterial.envMap = envMap
    }

    // 清理旧材质
    if (planeMaterial) {
      planeMaterial.dispose()
    }

    planeMesh.material = newMaterial
    planeMaterial = newMaterial

    console.log("已切换到 Phong 材质")
  }

  /**
   * 切换到 Lambert 材质
   */
  const switchToLambertMaterial = () => {
    if (!planeMesh) return

    const newMaterial = new THREE.MeshLambertMaterial({
      map: colorTexture,
      transparent: true,
      normalMap: normalTexture,
      bumpMap: dispTexture,
      displacementMap: dispTexture,
      displacementScale: 0.02,
      aoMap: aoTexture
    })

    // 如果有环境贴图，应用到新材质
    if (envMap) {
      newMaterial.envMap = envMap
    }

    // 清理旧材质
    if (planeMaterial) {
      planeMaterial.dispose()
    }

    planeMesh.material = newMaterial
    planeMaterial = newMaterial

    console.log("已切换到 Lambert 材质")
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    // 材质控制
    const materialFolder = gui.addFolder("材质控制")

    const materialParams = {
      materialType: "Lambert",
      displacementScale: 0.02,
      opacity: 1.0
    }

    // 材质类型切换
    materialFolder
      .add(materialParams, "materialType", ["Lambert", "Phong"])
      .name("材质类型")
      .onChange((value) => {
        if (value === "Phong") {
          switchToPhongMaterial()
        } else {
          switchToLambertMaterial()
        }
      })

    // 位移强度控制
    materialFolder
      .add(materialParams, "displacementScale", 0, 0.1, 0.001)
      .name("位移强度")
      .onChange((value) => {
        if (planeMaterial) {
          planeMaterial.displacementScale = value
        }
      })

    // 透明度控制
    materialFolder
      .add(materialParams, "opacity", 0, 1, 0.01)
      .name("透明度")
      .onChange((value) => {
        if (planeMaterial) {
          planeMaterial.opacity = value
        }
      })

    materialFolder.open()

    // 纹理贴图控制
    const textureFolder = gui.addFolder("纹理贴图")

    const textureParams = {
      useColorMap: true,
      useNormalMap: true,
      useBumpMap: true,
      useDisplacementMap: true,
      useAOMap: true
    }

    textureFolder
      .add(textureParams, "useColorMap")
      .name("颜色贴图")
      .onChange((value) => {
        if (planeMaterial) {
          planeMaterial.map = value ? colorTexture : null
          planeMaterial.needsUpdate = true
        }
      })

    textureFolder
      .add(textureParams, "useNormalMap")
      .name("法线贴图")
      .onChange((value) => {
        if (planeMaterial) {
          planeMaterial.normalMap = value ? normalTexture : null
          planeMaterial.needsUpdate = true
        }
      })

    textureFolder
      .add(textureParams, "useBumpMap")
      .name("凹凸贴图")
      .onChange((value) => {
        if (planeMaterial) {
          planeMaterial.bumpMap = value ? dispTexture : null
          planeMaterial.needsUpdate = true
        }
      })

    textureFolder
      .add(textureParams, "useDisplacementMap")
      .name("位移贴图")
      .onChange((value) => {
        if (planeMaterial) {
          planeMaterial.displacementMap = value ? dispTexture : null
          planeMaterial.needsUpdate = true
        }
      })

    textureFolder
      .add(textureParams, "useAOMap")
      .name("AO 贴图")
      .onChange((value) => {
        if (planeMaterial) {
          planeMaterial.aoMap = value ? aoTexture : null
          planeMaterial.needsUpdate = true
        }
      })

    textureFolder.open()

    // 材质信息
    const infoFolder = gui.addFolder("材质信息")
    const info = {
      currentType: "加载中...",
      hasSpecularMap: false
    }

    infoFolder.add(info, "currentType").name("当前材质").listen()
    infoFolder.add(info, "hasSpecularMap").name("是否有高光贴图").listen()

    // 实时更新信息
    setInterval(() => {
      if (planeMaterial) {
        info.currentType = planeMaterial.type
        info.hasSpecularMap = planeMaterial.type === "MeshPhongMaterial"
      }
    }, 100)
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理纹理
    const textures = [colorTexture, specularTexture, normalTexture, dispTexture, aoTexture, envMap]
    textures.forEach((texture) => {
      if (texture) {
        texture.dispose()
      }
    })

    // 清理平面
    if (planeMesh) {
      if (planeMesh.geometry) {
        planeMesh.geometry.dispose()
      }
      if (planeMaterial) {
        planeMaterial.dispose()
      }
      scene.value?.remove(planeMesh)
      planeMesh = null
      planeMaterial = null
    }

    // 清理 GUI
    gui?.destroy()

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    // 加载纹理
    loadTextures()
    // 加载 HDR 环境贴图
    loadHDREnvironment()
    // 添加光源
    addLights()
    // 创建平面
    createLambertPlane()
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
    title="💡 Lambert 和 Phong 材质"
    description="学习和对比 MeshLambertMaterial 和 MeshPhongMaterial 两种经典光照材质"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>💡 <strong>Lambert 材质</strong> - 漫反射光照模型</li>
          <li>✨ <strong>Phong 材质</strong> - 漫反射 + 镜面反射光照模型</li>
          <li>🔄 <strong>实时切换</strong> - 动态切换两种材质对比效果</li>
          <li>🎨 <strong>多重贴图</strong> - 颜色、法线、位移、AO、高光贴图</li>
          <li>🌍 <strong>HDR 环境</strong> - 使用 HDR 环境贴图增强真实感</li>
          <li>🎮 <strong>GUI 调试</strong> - 实时调整材质参数和贴图开关</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 Lambert 材质（MeshLambertMaterial）：</h3>
        <ul>
          <li><strong>光照模型</strong>：仅支持漫反射（Diffuse）</li>
          <li><strong>计算方式</strong>：基于 Lambert 余弦定律</li>
          <li><strong>性能</strong>：计算简单，性能较好</li>
          <li><strong>外观特点</strong>：表面较为柔和，无高光</li>
          <li><strong>适用场景</strong>：哑光材质、布料、墙面等</li>
          <li><strong>不支持</strong>：高光贴图（specularMap）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>✨ Phong 材质（MeshPhongMaterial）：</h3>
        <ul>
          <li><strong>光照模型</strong>：漫反射 + 镜面反射（Specular）</li>
          <li><strong>计算方式</strong>：基于 Phong 反射模型</li>
          <li><strong>性能</strong>：计算较复杂，性能中等</li>
          <li><strong>外观特点</strong>：有明显高光，更真实</li>
          <li><strong>适用场景</strong>：金属、塑料、水面等光滑表面</li>
          <li><strong>支持</strong>：高光贴图（specularMap）控制高光强度</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 两者对比：</h3>
        <ul>
          <li><strong>计算复杂度</strong>：Lambert &lt; Phong</li>
          <li><strong>渲染性能</strong>：Lambert &gt; Phong</li>
          <li><strong>视觉效果</strong>：Lambert &lt; Phong</li>
          <li><strong>高光效果</strong>：Lambert ❌ | Phong ✅</li>
          <li><strong>真实感</strong>：Lambert 中 | Phong 高</li>
          <li>💡 可以在 GUI 面板切换材质类型实时对比</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🗺️ 纹理贴图说明：</h3>
        <ul>
          <li><strong>颜色贴图（map）</strong> - 定义表面的基础颜色</li>
          <li><strong>法线贴图（normalMap）</strong> - 模拟表面细节法线，不改变几何体</li>
          <li><strong>凹凸贴图（bumpMap）</strong> - 通过灰度模拟高度起伏</li>
          <li><strong>位移贴图（displacementMap）</strong> - 真实改变几何体顶点位置</li>
          <li><strong>AO 贴图（aoMap）</strong> - 环境光遮蔽，增强细节暗部</li>
          <li><strong>高光贴图（specularMap）</strong> - 控制高光强度分布（仅 Phong）</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>// Lambert 材质</code></p>
        <p><code>new THREE.MeshLambertMaterial({</code></p>
        <p><code>&nbsp;&nbsp;map: colorTexture,</code></p>
        <p><code>&nbsp;&nbsp;normalMap: normalTexture,</code></p>
        <p><code>&nbsp;&nbsp;displacementMap: dispTexture</code></p>
        <p><code>})</code></p>
        <br>
        <p><code>// Phong 材质（多了高光贴图）</code></p>
        <p><code>new THREE.MeshPhongMaterial({</code></p>
        <p><code>&nbsp;&nbsp;map: colorTexture,</code></p>
        <p><code>&nbsp;&nbsp;specularMap: specularTexture,</code></p>
        <p><code>&nbsp;&nbsp;normalMap: normalTexture</code></p>
        <p><code>})</code></p>
      </div>

      <div class="info-section">
        <h3>🎨 位移贴图详解：</h3>
        <ul>
          <li><strong>displacementMap</strong> - 真实改变顶点位置</li>
          <li><strong>displacementScale</strong> - 控制位移强度（默认 1）</li>
          <li>⚠️ <strong>需要高细分度</strong> - 需要足够多的顶点（如 200x200）</li>
          <li>💡 本例使用 200x200 细分，展示水面起伏效果</li>
          <li>🎮 可在 GUI 调整位移强度查看效果</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 学习要点：</h3>
        <ul>
          <li>🔸 理解漫反射和镜面反射的区别</li>
          <li>🔸 掌握不同贴图类型的作用和用法</li>
          <li>🔸 了解位移贴图需要高细分度的原因</li>
          <li>🔸 学会使用 HDR 环境贴图提升真实感</li>
          <li>🔸 根据场景需求选择合适的材质类型</li>
          <li>🔸 性能优化：简单场景用 Lambert，复杂场景用 Phong</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚡ 性能建议：</h3>
        <ul>
          <li>💡 <strong>移动端</strong> - 优先使用 Lambert 材质</li>
          <li>💡 <strong>桌面端</strong> - 可以使用 Phong 材质</li>
          <li>💡 <strong>现代项目</strong> - 推荐使用 MeshStandardMaterial（PBR）</li>
          <li>💡 <strong>位移贴图</strong> - 谨慎使用，对性能影响较大</li>
          <li>💡 <strong>纹理尺寸</strong> - 根据实际需求选择合适的分辨率</li>
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
