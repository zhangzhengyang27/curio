<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 容器引用
  const containerRef = shallowRef<HTMLDivElement | null>(null)

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
  let cube: THREE.Mesh | null = null
  let envMap: THREE.Texture | null = null
  let thicknessMap: THREE.Texture | null = null

  // 材质信息定时器句柄，用于组件卸载时清理
  let infoUpdateTimer: ReturnType<typeof setInterval> | null = null

  /**
   * 加载纹理贴图
   */
  const loadTextures = () => {
    const textureLoader = new THREE.TextureLoader()

    // 加载厚度贴图
    thicknessMap = textureLoader.load(
      "/three-project/texture/diamond/diamond_emissive.png",
      () => {
        console.log("厚度贴图加载成功")
      },
      undefined,
      (error) => {
        console.error("厚度贴图加载失败:", error)
      }
    )
  }

  /**
   * 加载 HDR 环境贴图
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

        console.log("HDR 环境贴图加载成功")
      },
      undefined,
      (error) => {
        console.error("HDR 环境贴图加载失败:", error)
      }
    )
  }

  /**
   * 创建透光立方体
   */
  const createTranslucentCube = () => {
    if (!scene.value || !thicknessMap) return

    // 创建几何体
    const geometry = new THREE.BoxGeometry(1, 1, 1)

    // 创建物理材质（支持透光效果）
    const material = new THREE.MeshPhysicalMaterial({
      transparent: true, // 启用透明
      transmission: 0.95, // 透光性（0-1，1为完全透明）
      roughness: 0.05, // 粗糙度（越小越光滑）
      thickness: 2, // 厚度（影响光线穿透时的折射效果）
      ior: 1.5, // 折射率（Index of Refraction，控制光线弯曲程度）
      reflectivity: 0.5, // 反射率（控制非金属材质的反射强度）
      attenuationColor: new THREE.Color(0.9, 0.9, 0), // 衰减颜色（光线穿过物体时的颜色衰减）
      attenuationDistance: 1, // 衰减距离（光线衰减到衰减颜色所需的距离）
      thicknessMap: thicknessMap // 厚度贴图（定义物体不同部分的厚度）
    })

    // 创建网格
    cube = new THREE.Mesh(geometry, material)
    scene.value.add(cube)

    console.log("透光立方体创建成功")
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = (): void => {
    if (!cube) return
    const mat = cube.material as THREE.MeshPhysicalMaterial

    gui = new GUI()

    // 透光材质参数
    const materialFolder = gui.addFolder("💎 透光材质参数")

    materialFolder
      .add(mat as any, "transmission", 0, 1, 0.01)
      .name("透光性 (Transmission)")
      .onChange(() => {
        mat.needsUpdate = true
      })

    materialFolder
      .add(mat as any, "roughness", 0, 1, 0.01)
      .name("粗糙度 (Roughness)")
      .onChange(() => {
        mat.needsUpdate = true
      })

    materialFolder
      .add(mat as any, "thickness", 0, 5, 0.1)
      .name("厚度 (Thickness)")
      .onChange(() => {
        mat.needsUpdate = true
      })

    materialFolder
      .add(mat as any, "attenuationDistance", 0, 10, 0.1)
      .name("衰减距离 (Attenuation Distance)")
      .onChange(() => {
        mat.needsUpdate = true
      })

    materialFolder
      .add(mat as any, "ior", 1.0, 2.333, 0.01)
      .name("折射率 (IOR)")
      .onChange(() => {
        mat.needsUpdate = true
      })

    materialFolder
      .add(mat as any, "reflectivity", 0, 1, 0.01)
      .name("反射率 (Reflectivity)")
      .onChange(() => {
        mat.needsUpdate = true
      })

    // 衰减颜色控制
    const attenuationColorParams = {
      color: "#e6e600" // 对应 (0.9, 0.9, 0)
    }

    materialFolder
      .addColor(attenuationColorParams, "color")
      .name("衰减颜色 (Attenuation Color)")
      .onChange((value: string | number) => {
        mat.attenuationColor.set(value)
        mat.needsUpdate = true
      })

    materialFolder.open()

    // 材质信息
    const infoFolder = gui.addFolder("📊 材质信息")
    interface MaterialInfo {
      materialType: string
      transmission: number
      thickness: number
      ior: number
      reflectivity: number
      hasThicknessMap: boolean
    }
    const info: MaterialInfo = {
      materialType: mat.type,
      transmission: mat.transmission ?? 0,
      thickness: mat.thickness ?? 0,
      ior: mat.ior ?? 0,
      reflectivity: mat.reflectivity ?? 0,
      hasThicknessMap: !!mat.thicknessMap
    }

    infoFolder.add(info, "materialType").name("材质类型").listen()
    infoFolder.add(info, "transmission").name("当前透光性").listen()
    infoFolder.add(info, "thickness").name("当前厚度").listen()
    infoFolder.add(info, "ior").name("当前折射率").listen()
    infoFolder.add(info, "reflectivity").name("当前反射率").listen()
    infoFolder.add(info, "hasThicknessMap").name("有厚度贴图").listen()

    // 实时更新信息
    infoUpdateTimer = setInterval(() => {
      if (cube && cube.material) {
        const m = cube.material as THREE.MeshPhysicalMaterial
        info.transmission = m.transmission ?? 0
        info.thickness = m.thickness ?? 0
        info.ior = m.ior ?? 0
        info.reflectivity = m.reflectivity ?? 0
        info.hasThicknessMap = !!m.thicknessMap
      }
    }, 100)

    infoFolder.open()
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = (): void => {
    // 清理材质信息定时器
    if (infoUpdateTimer) {
      clearInterval(infoUpdateTimer)
      infoUpdateTimer = null
    }

    // 清理环境贴图
    if (envMap) {
      envMap.dispose()
      envMap = null
    }

    // 清理厚度贴图
    if (thicknessMap) {
      thicknessMap.dispose()
      thicknessMap = null
    }

    // 清理立方体
    if (cube) {
      if (cube.geometry) {
        cube.geometry.dispose()
      }
      const mat = cube.material as THREE.MeshPhysicalMaterial
      if (mat) {
        mat.dispose()
      }
      scene.value?.remove(cube)
      cube = null
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
    // 创建透光立方体
    createTranslucentCube()
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
    title="💎 物理材质透光效果"
    description="使用 MeshPhysicalMaterial 实现真实的透光、折射和光线衰减效果"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>💎 <strong>透光性</strong> - Transmission 控制光线穿透程度</li>
          <li>📏 <strong>厚度控制</strong> - Thickness 影响光线折射效果</li>
          <li>🔍 <strong>折射率</strong> - IOR 精确控制光线弯曲程度</li>
          <li>✨ <strong>反射率</strong> - Reflectivity 控制表面反射强度</li>
          <li>🎨 <strong>衰减颜色</strong> - Attenuation Color 定义光线穿过物体时的颜色变化</li>
          <li>📐 <strong>衰减距离</strong> - Attenuation Distance 控制颜色衰减的速度</li>
          <li>🗺️ <strong>厚度贴图</strong> - Thickness Map 为不同区域定义不同厚度</li>
          <li>🌍 <strong>HDR 环境</strong> - 真实的环境光照和折射效果</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 什么是 MeshPhysicalMaterial？</h3>
        <ul>
          <li><strong>定义</strong>：Three.js 中最高级的 PBR 材质</li>
          <li><strong>特点</strong>：基于物理的渲染，支持高级光学效果</li>
          <li><strong>优势</strong>：真实的透光、清漆、光泽等效果</li>
          <li><strong>继承</strong>：扩展自 MeshStandardMaterial</li>
          <li>💡 专为高质量渲染设计，适合产品展示</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔬 透光性原理 (Transmission)：</h3>
        <ul>
          <li><strong>定义</strong>：光线穿透物体的能力</li>
          <li><strong>范围</strong>：0-1（0 = 不透光，1 = 完全透光）</li>
          <li><strong>效果</strong>：模拟玻璃、水晶、液体等透明材质</li>
          <li><strong>区别</strong>：不同于 opacity（透明度），transmission 会产生真实的折射</li>
          <li>💡 高 transmission 值会让物体看起来像玻璃</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📏 厚度 (Thickness) 详解：</h3>
        <ul>
          <li><strong>作用</strong>：定义物体的物理厚度</li>
          <li><strong>影响</strong>：厚度越大，光线穿过时折射越明显</li>
          <li><strong>配合使用</strong>：与 transmission 配合创建真实感</li>
          <li><strong>厚度贴图</strong>：可使用 thicknessMap 定义不同区域的厚度</li>
          <li>💡 薄物体（如气泡）用小值，厚物体（如实心玻璃）用大值</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎨 衰减颜色 (Attenuation Color)：</h3>
        <ul>
          <li><strong>定义</strong>：光线穿过物体时被吸收的颜色</li>
          <li><strong>原理</strong>：模拟彩色玻璃或有色液体的效果</li>
          <li><strong>示例</strong>：</li>
          <li>&nbsp;&nbsp;• 白色 (1,1,1)：无颜色衰减</li>
          <li>&nbsp;&nbsp;• 红色 (1,0,0)：吸收绿色和蓝色，保留红色</li>
          <li>&nbsp;&nbsp;• 黄色 (1,1,0)：吸收蓝色，保留红绿（本例使用）</li>
          <li>💡 配合厚度和衰减距离创建彩色玻璃效果</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📐 衰减距离 (Attenuation Distance)：</h3>
        <ul>
          <li><strong>定义</strong>：光线衰减到衰减颜色所需的距离</li>
          <li><strong>单位</strong>：与场景单位一致</li>
          <li><strong>效果</strong>：</li>
          <li>&nbsp;&nbsp;• 距离小：颜色衰减快，物体颜色深</li>
          <li>&nbsp;&nbsp;• 距离大：颜色衰减慢，物体颜色浅</li>
          <li><strong>组合效果</strong>：thickness + attenuationDistance 共同决定最终颜色</li>
          <li>💡 调整此值可模拟不同浓度的有色液体</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔍 折射率 (IOR - Index of Refraction)：</h3>
        <ul>
          <li><strong>定义</strong>：光线在不同介质中传播速度的比值</li>
          <li><strong>范围</strong>：1.0 - 2.333（Three.js 限制范围）</li>
          <li><strong>物理意义</strong>：控制光线通过物体时的弯曲程度</li>
          <li><strong>常见材质的 IOR 值</strong>：</li>
          <li>&nbsp;&nbsp;• 真空/空气：1.0</li>
          <li>&nbsp;&nbsp;• 水：1.333</li>
          <li>&nbsp;&nbsp;• 玻璃：1.5 - 1.9</li>
          <li>&nbsp;&nbsp;• 钻石：2.417（超出范围，用 2.333）</li>
          <li>&nbsp;&nbsp;• 塑料：1.4 - 1.6</li>
          <li>&nbsp;&nbsp;• 水晶：1.54</li>
          <li>💡 IOR 值越高，折射效果越强，物体看起来越"厚重"</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>✨ 反射率 (Reflectivity)：</h3>
        <ul>
          <li><strong>定义</strong>：非金属材质的反射强度</li>
          <li><strong>范围</strong>：0-1（0 = 无反射，1 = 最大反射）</li>
          <li><strong>作用</strong>：控制表面反射环境的强度</li>
          <li><strong>注意</strong>：仅影响非金属材质（metalness = 0）</li>
          <li><strong>建议值</strong>：</li>
          <li>&nbsp;&nbsp;• 普通玻璃：0.5</li>
          <li>&nbsp;&nbsp;• 高反射玻璃：0.7 - 0.9</li>
          <li>&nbsp;&nbsp;• 磨砂表面：0.1 - 0.3</li>
          <li>💡 配合 transmission 创建真实的玻璃反射效果</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>// 创建物理材质</code></p>
        <p><code>const material = new THREE.MeshPhysicalMaterial({</code></p>
        <p><code>&nbsp;&nbsp;transparent: true,</code></p>
        <p><code>&nbsp;&nbsp;transmission: 0.95, // 透光性</code></p>
        <p><code>&nbsp;&nbsp;roughness: 0.05, // 粗糙度</code></p>
        <p><code>&nbsp;&nbsp;thickness: 2, // 厚度</code></p>
        <p><code>&nbsp;&nbsp;ior: 1.5, // 折射率（玻璃）</code></p>
        <p><code>&nbsp;&nbsp;reflectivity: 0.5, // 反射率</code></p>
        <p><code>&nbsp;&nbsp;attenuationColor: new THREE.Color(0.9, 0.9, 0),</code></p>
        <p><code>&nbsp;&nbsp;attenuationDistance: 1, // 衰减距离</code></p>
        <p><code>&nbsp;&nbsp;thicknessMap: thicknessMap // 厚度贴图</code></p>
        <p><code>})</code></p>
      </div>

      <div class="info-section">
        <h3>🎯 参数组合建议：</h3>
        <ul>
          <li><strong>透明玻璃</strong>：</li>
          <li>&nbsp;&nbsp;• transmission: 1.0, thickness: 0.5, ior: 1.5</li>
          <li>&nbsp;&nbsp;• reflectivity: 0.5, roughness: 0.0</li>
          <li>&nbsp;&nbsp;• attenuationColor: (1,1,1)</li>
          <li><strong>毛玻璃</strong>：</li>
          <li>&nbsp;&nbsp;• transmission: 0.9, roughness: 0.3, ior: 1.5</li>
          <li>&nbsp;&nbsp;• reflectivity: 0.3, thickness: 1.0</li>
          <li><strong>有色玻璃</strong>：</li>
          <li>&nbsp;&nbsp;• transmission: 0.95, thickness: 2.0, ior: 1.6</li>
          <li>&nbsp;&nbsp;• reflectivity: 0.5, attenuationColor: 彩色</li>
          <li>&nbsp;&nbsp;• attenuationDistance: 1.0</li>
          <li><strong>水晶/宝石</strong>：</li>
          <li>&nbsp;&nbsp;• transmission: 0.8, roughness: 0.0, ior: 2.0</li>
          <li>&nbsp;&nbsp;• reflectivity: 0.9, thickness: 3.0</li>
          <li>&nbsp;&nbsp;• attenuationDistance: 0.5</li>
          <li><strong>钻石</strong>：</li>
          <li>&nbsp;&nbsp;• transmission: 0.9, ior: 2.333（最大值）</li>
          <li>&nbsp;&nbsp;• reflectivity: 1.0, roughness: 0.0</li>
          <li>&nbsp;&nbsp;• thickness: 1.5</li>
          <li><strong>水</strong>：</li>
          <li>&nbsp;&nbsp;• transmission: 1.0, ior: 1.333, reflectivity: 0.2</li>
          <li>&nbsp;&nbsp;• roughness: 0.0, thickness: 5.0</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🗺️ 厚度贴图 (Thickness Map)：</h3>
        <ul>
          <li><strong>用途</strong>：为物体不同部分定义不同厚度</li>
          <li><strong>格式</strong>：通常使用灰度图</li>
          <li>&nbsp;&nbsp;• 白色：最厚部分</li>
          <li>&nbsp;&nbsp;• 黑色：最薄部分</li>
          <li><strong>效果</strong>：创建更真实的不均匀透光效果</li>
          <li><strong>本例</strong>：使用钻石发光贴图作为厚度贴图</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚙️ 实现要点：</h3>
        <ul>
          <li>1️⃣ <strong>启用透明</strong> - transparent: true 是必需的</li>
          <li>2️⃣ <strong>HDR 环境</strong> - 提供真实的光照和反射</li>
          <li>3️⃣ <strong>低粗糙度</strong> - 透光材质通常很光滑</li>
          <li>4️⃣ <strong>合理厚度</strong> - 根据物体尺寸调整</li>
          <li>5️⃣ <strong>颜色搭配</strong> - attenuationColor 与 attenuationDistance 配合</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔄 与其他透明效果对比：</h3>
        <ul>
          <li><strong>Opacity（透明度）</strong>：</li>
          <li>&nbsp;&nbsp;• 简单的 alpha 混合</li>
          <li>&nbsp;&nbsp;• 无折射效果</li>
          <li>&nbsp;&nbsp;• 性能开销小</li>
          <li><strong>Transmission（透光性）</strong>：</li>
          <li>&nbsp;&nbsp;• 真实的光线穿透和折射</li>
          <li>&nbsp;&nbsp;• 受环境影响</li>
          <li>&nbsp;&nbsp;• 性能开销较大</li>
          <li><strong>Refraction（折射）</strong>：</li>
          <li>&nbsp;&nbsp;• 环境贴图折射</li>
          <li>&nbsp;&nbsp;• 表面效果</li>
          <li>&nbsp;&nbsp;• 中等性能开销</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚠️ 注意事项：</h3>
        <ul>
          <li>🔸 <strong>性能影响</strong>：transmission 是计算密集型特性</li>
          <li>🔸 <strong>渲染器配置</strong>：可能需要启用 physicallyCorrectLights</li>
          <li>🔸 <strong>环境依赖</strong>：效果依赖环境贴图质量</li>
          <li>🔸 <strong>渲染顺序</strong>：透明物体渲染顺序很重要</li>
          <li>🔸 <strong>材质更新</strong>：修改参数后需设置 needsUpdate = true</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔬 IOR 与 Transmission 的关系：</h3>
        <ul>
          <li><strong>协同工作</strong>：IOR 和 Transmission 共同创建透光效果</li>
          <li><strong>IOR 的作用</strong>：</li>
          <li>&nbsp;&nbsp;• 控制光线弯曲的角度</li>
          <li>&nbsp;&nbsp;• 影响菲涅尔反射（视角变化时的反射强度）</li>
          <li>&nbsp;&nbsp;• 值越高，边缘反射越强</li>
          <li><strong>Transmission 的作用</strong>：</li>
          <li>&nbsp;&nbsp;• 控制有多少光线能穿透</li>
          <li>&nbsp;&nbsp;• 值越高，越透明</li>
          <li><strong>最佳实践</strong>：</li>
          <li>&nbsp;&nbsp;• 高 IOR + 高 Transmission = 钻石效果</li>
          <li>&nbsp;&nbsp;• 低 IOR + 高 Transmission = 空气泡泡</li>
          <li>&nbsp;&nbsp;• 中 IOR + 中 Transmission = 普通玻璃</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🚀 进阶技巧：</h3>
        <ul>
          <li>💡 使用 <strong>clearcoat</strong> 参数添加清漆层</li>
          <li>💡 使用 <strong>sheen</strong> 模拟织物的光泽</li>
          <li>💡 调整 <strong>ior</strong> 模拟不同真实材质的折射</li>
          <li>💡 结合 <strong>normalMap</strong> 创建凹凸玻璃表面</li>
          <li>💡 使用多个透光物体创建复杂光学效果</li>
          <li>💡 <strong>reflectivity</strong> 配合环境贴图创建镜面反射</li>
          <li>💡 动画改变 IOR 值创建"物质变化"效果</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 应用场景：</h3>
        <ul>
          <li>🍷 <strong>产品展示</strong> - 玻璃瓶、香水瓶、酒杯等</li>
          <li>💎 <strong>珠宝渲染</strong> - 宝石、水晶、钻石</li>
          <li>🏠 <strong>建筑可视化</strong> - 玻璃幕墙、窗户</li>
          <li>🎮 <strong>游戏特效</strong> - 能量护盾、魔法效果</li>
          <li>🔬 <strong>科学可视化</strong> - 液体、透明材料模拟</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📚 物理材质完整特性：</h3>
        <ul>
          <li>继承自 MeshStandardMaterial 的所有特性</li>
          <li>• metalness, roughness, map, normalMap 等</li>
          <li><strong>新增特性</strong>：</li>
          <li>• clearcoat（清漆层）</li>
          <li>• clearcoatRoughness（清漆粗糙度）</li>
          <li>• sheen（光泽）</li>
          <li>• transmission（透光性）★ 本例演示</li>
          <li>• thickness（厚度）★ 本例演示</li>
          <li>• ior（折射率）★ 本例演示</li>
          <li>• reflectivity（反射率）★ 本例演示</li>
          <li>• attenuationColor（衰减颜色）★ 本例演示</li>
          <li>• attenuationDistance（衰减距离）★ 本例演示</li>
        </ul>
      </div>

      <div class="controls-tip">
        <p>🎮 操作提示：</p>
        <ul>
          <li>🖱️ 左键拖动：旋转视角</li>
          <li>🖱️ 右键拖动：平移视角</li>
          <li>🖱️ 滚轮：缩放</li>
          <li>🎚️ <strong>GUI 面板</strong>：实时调整所有材质参数</li>
          <li>&nbsp;&nbsp;• Transmission：调节透光程度</li>
          <li>&nbsp;&nbsp;• Roughness：调节表面粗糙度</li>
          <li>&nbsp;&nbsp;• Thickness：调节物体厚度</li>
          <li>&nbsp;&nbsp;• Attenuation Distance：调节颜色衰减速度</li>
          <li>&nbsp;&nbsp;• IOR：调节折射率（尝试不同材质）</li>
          <li>&nbsp;&nbsp;• Reflectivity：调节反射强度</li>
          <li>&nbsp;&nbsp;• Attenuation Color：选择衰减颜色</li>
          <li>💡 <strong>建议</strong>：先尝试调整 IOR 观察折射变化，再调整其他参数</li>
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
