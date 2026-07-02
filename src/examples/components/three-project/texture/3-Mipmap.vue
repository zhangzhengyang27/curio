<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
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
  let planeMaterial: THREE.MeshBasicMaterial | null = null
  let texture: THREE.Texture | null = null
  let maxAnisotropy: number = 0
  let mipmapInterval: ReturnType<typeof setInterval> | null = null

  /**
   * 加载纹理
   */
  const loadTexture = () => {
    const textureLoader = new THREE.TextureLoader()

    // 加载纹理 - 使用砖块纹理
    texture = textureLoader.load("/three-project/texture/brick/brick_diffuse.jpg", () => {
      console.log("纹理加载成功")

      // 获取各向异性过滤的最大值
      if (renderer.value) {
        maxAnisotropy = renderer.value.capabilities.getMaxAnisotropy()
        console.log("最大各向异性值:", maxAnisotropy)
      }
    })

    // 设置纹理的颜色空间
    texture.colorSpace = THREE.SRGBColorSpace

    // 设置默认的缩小过滤器为 LinearMipmapLinearFilter
    texture.minFilter = THREE.LinearMipmapLinearFilter
  }

  /**
   * 创建平面
   */
  const createPlane = () => {
    if (!scene.value) return

    // 创建平面几何体
    const planeGeometry = new THREE.PlaneGeometry(1, 1)

    // 创建基础材质
    planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: texture,
      transparent: true
    })

    planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
    scene.value.add(planeMesh)

    console.log("平面创建成功")
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    // 放大过滤器控制
    const magFilterFolder = gui.addFolder("🔍 放大过滤器 (magFilter)")

    const magFilterParams = {
      magFilter: "LinearFilter"
    }

    magFilterFolder
      .add(magFilterParams, "magFilter", ["NearestFilter", "LinearFilter"])
      .name("放大过滤器")
      .onChange((value) => {
        if (texture) {
          switch (value) {
            case "NearestFilter":
              texture.magFilter = THREE.NearestFilter
              break
            case "LinearFilter":
              texture.magFilter = THREE.LinearFilter
              break
          }
          texture.needsUpdate = true
          console.log("magFilter:", value)
        }
      })

    magFilterFolder.open()

    // 缩小过滤器控制
    const minFilterFolder = gui.addFolder("🔎 缩小过滤器 (minFilter)")

    const minFilterParams = {
      minFilter: "LinearMipmapLinearFilter"
    }

    const minFilterOptions = [
      "NearestFilter",
      "LinearFilter",
      "NearestMipmapNearestFilter",
      "NearestMipmapLinearFilter",
      "LinearMipmapNearestFilter",
      "LinearMipmapLinearFilter"
    ]

    minFilterFolder
      .add(minFilterParams, "minFilter", minFilterOptions)
      .name("缩小过滤器")
      .onChange((value) => {
        if (texture) {
          switch (value) {
            case "NearestFilter":
              texture.minFilter = THREE.NearestFilter
              break
            case "LinearFilter":
              texture.minFilter = THREE.LinearFilter
              break
            case "NearestMipmapNearestFilter":
              texture.minFilter = THREE.NearestMipmapNearestFilter
              break
            case "NearestMipmapLinearFilter":
              texture.minFilter = THREE.NearestMipmapLinearFilter
              break
            case "LinearMipmapNearestFilter":
              texture.minFilter = THREE.LinearMipmapNearestFilter
              break
            case "LinearMipmapLinearFilter":
              texture.minFilter = THREE.LinearMipmapLinearFilter
              break
          }
          texture.needsUpdate = true
          console.log("minFilter:", value)
        }
      })

    minFilterFolder.open()

    // Mipmap 控制
    const mipmapFolder = gui.addFolder("🗂️ Mipmap 控制")

    const mipmapParams = {
      generateMipmaps: true
    }

    mipmapFolder
      .add(mipmapParams, "generateMipmaps")
      .name("生成 Mipmap")
      .onChange((value) => {
        if (texture) {
          texture.generateMipmaps = value
          texture.needsUpdate = true
          console.log("generateMipmaps:", value)

          if (!value) {
            console.warn("⚠️ 关闭 Mipmap 后，使用 Mipmap 过滤器可能会出现黑屏")
          }
        }
      })

    mipmapFolder.open()

    // 各向异性过滤
    const anisotropyFolder = gui.addFolder("🎯 各向异性过滤")

    const anisotropyParams = {
      anisotropy: 1,
      maxAnisotropy: maxAnisotropy || 16
    }

    anisotropyFolder
      .add(anisotropyParams, "anisotropy", 1, anisotropyParams.maxAnisotropy, 1)
      .name("各向异性级别")
      .onChange((value) => {
        if (texture) {
          texture.anisotropy = value
          texture.needsUpdate = true
          console.log("anisotropy:", value)
        }
      })

    anisotropyFolder.add(anisotropyParams, "maxAnisotropy").name("硬件最大值").disable()

    anisotropyFolder.open()

    // 纹理信息
    const infoFolder = gui.addFolder("📊 纹理信息")

    const info = {
      magFilter: "LinearFilter",
      minFilter: "LinearMipmapLinearFilter",
      generateMipmaps: true,
      anisotropy: 1,
      format: "RGBAFormat"
    }

    infoFolder.add(info, "magFilter").name("当前放大过滤器").listen()
    infoFolder.add(info, "minFilter").name("当前缩小过滤器").listen()
    infoFolder.add(info, "generateMipmaps").name("是否生成 Mipmap").listen()
    infoFolder.add(info, "anisotropy").name("当前各向异性").listen()
    infoFolder.add(info, "format").name("纹理格式").listen()

    // 实时更新信息
    mipmapInterval = setInterval(() => {
      if (texture) {
        // 过滤器映射
        const filterMap: Record<number, string> = {
          1003: "NearestFilter",
          1006: "LinearFilter",
          1004: "NearestMipmapNearestFilter",
          1005: "NearestMipmapLinearFilter",
          1007: "LinearMipmapNearestFilter",
          1008: "LinearMipmapLinearFilter"
        }

        info.magFilter = filterMap[texture.magFilter] || String(texture.magFilter)
        info.minFilter = filterMap[texture.minFilter] || String(texture.minFilter)
        info.generateMipmaps = texture.generateMipmaps
        info.anisotropy = texture.anisotropy

        const formatMap: Record<number, string> = {
          1023: "RGBAFormat",
          1022: "RGBFormat",
          1021: "AlphaFormat"
        }
        info.format = formatMap[texture.format] || String(texture.format)
      }
    }, 100)

    // 快捷预设
    const presetFolder = gui.addFolder("⚡ 快捷预设")

    const presets = {
      pixelArt: () => {
        if (texture) {
          texture.magFilter = THREE.NearestFilter
          texture.minFilter = THREE.NearestFilter
          texture.generateMipmaps = false
          texture.needsUpdate = true

          magFilterParams.magFilter = "NearestFilter"
          minFilterParams.minFilter = "NearestFilter"
          mipmapParams.generateMipmaps = false

          if (!gui) return
          gui.controllersRecursive().forEach((controller) => {
            controller.updateDisplay()
          })

          console.log("已应用像素艺术预设")
        }
      },
      highQuality: () => {
        if (texture) {
          texture.magFilter = THREE.LinearFilter
          texture.minFilter = THREE.LinearMipmapLinearFilter
          texture.generateMipmaps = true
          texture.anisotropy = maxAnisotropy
          texture.needsUpdate = true

          magFilterParams.magFilter = "LinearFilter"
          minFilterParams.minFilter = "LinearMipmapLinearFilter"
          mipmapParams.generateMipmaps = true
          anisotropyParams.anisotropy = maxAnisotropy

          if (!gui) return
          gui.controllersRecursive().forEach((controller) => {
            controller.updateDisplay()
          })

          console.log("已应用高质量预设")
        }
      },
      performance: () => {
        if (texture) {
          texture.magFilter = THREE.LinearFilter
          texture.minFilter = THREE.LinearMipmapNearestFilter
          texture.generateMipmaps = true
          texture.anisotropy = 1
          texture.needsUpdate = true

          magFilterParams.magFilter = "LinearFilter"
          minFilterParams.minFilter = "LinearMipmapNearestFilter"
          mipmapParams.generateMipmaps = true
          anisotropyParams.anisotropy = 1

          if (!gui) return
          gui.controllersRecursive().forEach((controller) => {
            controller.updateDisplay()
          })

          console.log("已应用性能优先预设")
        }
      }
    }

    presetFolder.add(presets, "pixelArt").name("🎮 像素艺术风格")
    presetFolder.add(presets, "highQuality").name("💎 高质量")
    presetFolder.add(presets, "performance").name("⚡ 性能优先")

    presetFolder.open()
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理定时器
    if (mipmapInterval) {
      clearInterval(mipmapInterval)
      mipmapInterval = null
    }

    // 清理纹理
    if (texture) {
      texture.dispose()
      texture = null
    }

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
    loadTexture()
    // 创建平面
    createPlane()
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
    title="🗂️ Mipmap 与纹理过滤"
    description="深入理解 Mipmap、纹理过滤器和各向异性过滤的原理与应用"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🔍 <strong>放大过滤器</strong> - Nearest 和 Linear 两种模式</li>
          <li>🔎 <strong>缩小过滤器</strong> - 6 种过滤器模式选择</li>
          <li>🗂️ <strong>Mipmap</strong> - 多级渐远纹理技术</li>
          <li>🎯 <strong>各向异性过滤</strong> - 提升斜视角纹理清晰度</li>
          <li>⚡ <strong>快捷预设</strong> - 像素艺术、高质量、性能优先</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 什么是 Mipmap？</h3>
        <ul>
          <li><strong>定义</strong>：多级渐远纹理（Mipmapping）</li>
          <li><strong>原理</strong>：预先生成不同分辨率的纹理版本</li>
          <li><strong>结构</strong>：原始纹理 → 1/2 → 1/4 → 1/8 → ... → 1×1</li>
          <li><strong>优势</strong>：提升渲染性能，减少摩尔纹和闪烁</li>
          <li><strong>缺点</strong>：额外占用 1/3 的显存空间</li>
          <li>💡 Three.js 默认自动生成 Mipmap</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔍 放大过滤器 (magFilter)：</h3>
        <ul>
          <li><strong>使用场景</strong>：纹理被放大显示（近距离观看）</li>
          <li><strong>NearestFilter</strong> - 最近邻过滤</li>
          <li>&nbsp;&nbsp;• 选择最接近的像素</li>
          <li>&nbsp;&nbsp;• 优点：性能最好，像素风格</li>
          <li>&nbsp;&nbsp;• 缺点：有明显像素颗粒感</li>
          <li><strong>LinearFilter</strong> - 线性过滤（默认）</li>
          <li>&nbsp;&nbsp;• 对周围 4 个像素进行插值</li>
          <li>&nbsp;&nbsp;• 优点：平滑，无颗粒感</li>
          <li>&nbsp;&nbsp;• 缺点：可能模糊</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔎 缩小过滤器 (minFilter)：</h3>
        <ul>
          <li><strong>使用场景</strong>：纹理被缩小显示（远距离观看）</li>
          <li><strong>不使用 Mipmap：</strong></li>
          <li>&nbsp;&nbsp;• <strong>NearestFilter</strong> - 最近邻，性能好，质量差</li>
          <li>&nbsp;&nbsp;• <strong>LinearFilter</strong> - 线性插值，质量一般</li>
          <li><strong>使用 Mipmap：</strong></li>
          <li>&nbsp;&nbsp;• <strong>NearestMipmapNearestFilter</strong> - 选择最近的 Mipmap 层</li>
          <li>&nbsp;&nbsp;• <strong>NearestMipmapLinearFilter</strong> - 两个 Mipmap 层插值</li>
          <li>&nbsp;&nbsp;• <strong>LinearMipmapNearestFilter</strong> - Mipmap 内线性过滤</li>
          <li>&nbsp;&nbsp;• <strong>LinearMipmapLinearFilter</strong> - 三线性过滤（默认，最佳质量）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 各向异性过滤 (Anisotropy)：</h3>
        <ul>
          <li><strong>作用</strong>：改善斜视角下的纹理质量</li>
          <li><strong>原理</strong>：沿纹理拉伸方向采样更多像素</li>
          <li><strong>级别</strong>：1、2、4、8、16（越高质量越好）</li>
          <li><strong>默认值</strong>：1（不启用）</li>
          <li><strong>最大值</strong>：取决于 GPU 硬件能力</li>
          <li><code>texture.anisotropy = 16</code> - 设置为最高级别</li>
          <li>💡 对性能有一定影响，建议按需使用</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码示例：</p>
        <p><code>// 放大过滤器（近距离）</code></p>
        <p><code>texture.magFilter = THREE.NearestFilter // 像素风格</code></p>
        <p><code>texture.magFilter = THREE.LinearFilter // 平滑（默认）</code></p>
        <br>
        <p><code>// 缩小过滤器（远距离）</code></p>
        <p><code>texture.minFilter = THREE.LinearMipmapLinearFilter // 最佳质量（默认）</code></p>
        <p><code>texture.minFilter = THREE.NearestFilter // 像素风格，不使用 Mipmap</code></p>
        <br>
        <p><code>// Mipmap 控制</code></p>
        <p><code>texture.generateMipmaps = true // 生成 Mipmap（默认）</code></p>
        <p><code>texture.generateMipmaps = false // 不生成（用于像素艺术）</code></p>
        <br>
        <p><code>// 各向异性过滤</code></p>
        <p><code>const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()</code></p>
        <p><code>texture.anisotropy = maxAnisotropy // 设置为硬件最大值</code></p>
        <br>
        <p><code>// 应用更改</code></p>
        <p><code>texture.needsUpdate = true</code></p>
      </div>

      <div class="info-section">
        <h3>📊 过滤器对比表：</h3>
        <ul>
          <li><strong>质量排序</strong>：</li>
          <li>&nbsp;&nbsp;LinearMipmapLinear > LinearMipmapNearest > NearestMipmapLinear > NearestMipmapNearest > Linear > Nearest</li>
          <li><strong>性能排序</strong>（从快到慢）：</li>
          <li>&nbsp;&nbsp;Nearest > Linear > NearestMipmapNearest > LinearMipmapNearest > NearestMipmapLinear > LinearMipmapLinear</li>
          <li><strong>内存占用</strong>：</li>
          <li>&nbsp;&nbsp;• 使用 Mipmap：原始纹理的 1.33 倍</li>
          <li>&nbsp;&nbsp;• 不使用 Mipmap：原始纹理大小</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎨 应用场景推荐：</h3>
        <ul>
          <li><strong>像素艺术游戏</strong>：</li>
          <li>&nbsp;&nbsp;• magFilter: NearestFilter</li>
          <li>&nbsp;&nbsp;• minFilter: NearestFilter</li>
          <li>&nbsp;&nbsp;• generateMipmaps: false</li>
          <li><strong>高质量 3D 场景</strong>：</li>
          <li>&nbsp;&nbsp;• magFilter: LinearFilter</li>
          <li>&nbsp;&nbsp;• minFilter: LinearMipmapLinearFilter</li>
          <li>&nbsp;&nbsp;• anisotropy: maxAnisotropy</li>
          <li><strong>移动端/性能优先</strong>：</li>
          <li>&nbsp;&nbsp;• magFilter: LinearFilter</li>
          <li>&nbsp;&nbsp;• minFilter: LinearMipmapNearestFilter</li>
          <li>&nbsp;&nbsp;• anisotropy: 1 或 4</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔬 三线性过滤详解：</h3>
        <ul>
          <li><strong>LinearMipmapLinearFilter</strong> 包含三次插值：</li>
          <li>1️⃣ 在较小的 Mipmap 层内进行双线性插值</li>
          <li>2️⃣ 在较大的 Mipmap 层内进行双线性插值</li>
          <li>3️⃣ 在两个 Mipmap 层之间进行线性插值</li>
          <li>💡 质量最好，但计算量最大</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚠️ 常见问题：</h3>
        <ul>
          <li><strong>纹理模糊</strong>：</li>
          <li>&nbsp;&nbsp;• 尝试增加各向异性过滤级别</li>
          <li>&nbsp;&nbsp;• 检查纹理分辨率是否足够</li>
          <li><strong>纹理有颗粒感</strong>：</li>
          <li>&nbsp;&nbsp;• 将 magFilter 改为 LinearFilter</li>
          <li>&nbsp;&nbsp;• 使用 Mipmap 和合适的 minFilter</li>
          <li><strong>纹理闪烁</strong>：</li>
          <li>&nbsp;&nbsp;• 启用 Mipmap 生成</li>
          <li>&nbsp;&nbsp;• 使用 LinearMipmapLinearFilter</li>
          <li><strong>黑屏或错误</strong>：</li>
          <li>&nbsp;&nbsp;• 使用 Mipmap 过滤器时必须 generateMipmaps = true</li>
          <li>&nbsp;&nbsp;• 或改用不需要 Mipmap 的过滤器</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 性能优化建议：</h3>
        <ul>
          <li>🔸 根据实际需求选择合适的过滤器</li>
          <li>🔸 不需要高质量时可关闭各向异性过滤</li>
          <li>🔸 像素艺术必须关闭 Mipmap 并使用 NearestFilter</li>
          <li>🔸 移动端建议使用 LinearMipmapNearestFilter</li>
          <li>🔸 纹理尺寸使用 2 的幂次方（256, 512, 1024 等）</li>
          <li>🔸 压缩纹理可以显著减少显存占用</li>
        </ul>
      </div>

      <div class="controls-tip">
        <p>🎮 操作提示：</p>
        <ul style="margin-top: 8px">
          <li>• 使用鼠标缩放视图，观察不同距离下的纹理效果</li>
          <li>• 切换不同的过滤器，对比质量差异</li>
          <li>• 调整各向异性级别，观察斜视角效果</li>
          <li>• 尝试三种快捷预设，了解不同场景的配置</li>
          <li>• 关闭 Mipmap 后观察远距离的纹理质量变化</li>
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
