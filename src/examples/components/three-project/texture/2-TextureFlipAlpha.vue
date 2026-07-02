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
  let planeMesh: THREE.Mesh | null = null
  let planeMaterial: THREE.MeshBasicMaterial | null = null
  let texture: THREE.Texture | null = null
  let textureFlipAlphaInterval: ReturnType<typeof setInterval> | null = null

  /**
   * 加载纹理
   */
  const loadTexture = () => {
    const textureLoader = new THREE.TextureLoader()

    // 加载纹理 - 使用 rain.png
    texture = textureLoader.load("/three-project/texture/rain.png", () => {
      console.log("纹理加载成功")
    })

    // 设置纹理的颜色空间
    texture.colorSpace = THREE.SRGBColorSpace
  }

  /**
   * 创建平面
   */
  const createPlane = () => {
    if (!scene.value) return

    // 创建平面几何体
    const planeGeometry = new THREE.PlaneGeometry(1, 1)

    // 创建基础材质 - 启用透明
    planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: texture,
      transparent: true // 允许透明
    })

    planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
    scene.value.add(planeMesh)

    console.log("平面创建成功")
  }

  /**
   * 设置场景背景
   */
  const setupScene = () => {
    if (!scene.value) return

    // 设置白色背景，便于观察透明效果
    scene.value.background = new THREE.Color(0xffffff)
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    if (!texture) return
    gui = new GUI()

    // 纹理翻转控制
    const flipFolder = gui.addFolder("🔄 纹理翻转")

    const flipParams = {
      flipY: true
    }

    flipFolder
      .add(flipParams, "flipY")
      .name("垂直翻转 (flipY)")
      .onChange((value) => {
        if (texture) {
          texture.flipY = value
          texture.needsUpdate = true
          console.log("flipY:", value)
        }
      })

    flipFolder.open()

    // Alpha 预乘控制
    const alphaFolder = gui.addFolder("🎨 Alpha 预乘")

    alphaFolder
      .add(texture, "premultiplyAlpha")
      .name("预乘 Alpha")
      .onChange(() => {
        if (!texture) return
        texture.needsUpdate = true
        console.log("premultiplyAlpha:", texture.premultiplyAlpha)
      })

    alphaFolder.open()

    // 材质透明度控制
    const materialFolder = gui.addFolder("🎭 材质控制")

    const materialParams = {
      opacity: 1.0,
      transparent: true
    }

    materialFolder
      .add(materialParams, "opacity", 0, 1, 0.01)
      .name("不透明度")
      .onChange((value) => {
        if (planeMaterial) {
          planeMaterial.opacity = value
        }
      })

    materialFolder
      .add(materialParams, "transparent")
      .name("启用透明")
      .onChange((value) => {
        if (planeMaterial) {
          planeMaterial.transparent = value
          planeMaterial.needsUpdate = true
        }
      })

    materialFolder.open()

    // 背景颜色控制
    const bgFolder = gui.addFolder("🌈 背景颜色")

    const bgParams = {
      backgroundColor: "#ffffff"
    }

    bgFolder
      .addColor(bgParams, "backgroundColor")
      .name("背景色")
      .onChange((value) => {
        if (scene.value) {
          scene.value.background = new THREE.Color(value)
        }
      })

    bgFolder.open()

    // 纹理信息
    const infoFolder = gui.addFolder("📊 纹理信息")

    const info = {
      flipY: true,
      premultiplyAlpha: false,
      format: "RGBAFormat",
      minFilter: "LinearMipmapLinearFilter",
      magFilter: "LinearFilter"
    }

    infoFolder.add(info, "flipY").name("当前 flipY").listen()
    infoFolder.add(info, "premultiplyAlpha").name("当前预乘 Alpha").listen()
    infoFolder.add(info, "format").name("纹理格式").listen()
    infoFolder.add(info, "minFilter").name("缩小过滤").listen()
    infoFolder.add(info, "magFilter").name("放大过滤").listen()

    // 实时更新信息
    textureFlipAlphaInterval = setInterval(() => {
      if (texture) {
        info.flipY = texture.flipY
        info.premultiplyAlpha = texture.premultiplyAlpha

        // 格式映射
        const formatMap: Record<number, string> = {
          1023: "RGBAFormat",
          1022: "RGBFormat",
          1021: "AlphaFormat"
        }
        info.format = formatMap[texture.format] ?? String(texture.format)

        // 过滤器映射
        const filterMap: Record<number, string> = {
          1006: "NearestFilter",
          1008: "LinearFilter",
          1009: "NearestMipmapNearestFilter",
          1010: "NearestMipmapLinearFilter",
          1011: "LinearMipmapNearestFilter",
          1012: "LinearMipmapLinearFilter"
        }
        info.minFilter = filterMap[texture.minFilter] || String(texture.minFilter)
        info.magFilter = filterMap[texture.magFilter] || String(texture.magFilter)
      }
    }, 100)

    // 快捷操作
    const quickFolder = gui.addFolder("⚡ 快捷操作")

    const quickActions = {
      resetFlipY: () => {
        if (texture) {
          texture.flipY = true
          texture.needsUpdate = true
          flipParams.flipY = true
          if (!gui) return
          gui.controllersRecursive().forEach((controller) => {
            controller.updateDisplay()
          })
          console.log("已重置 flipY 为默认值 (true)")
        }
      },
      togglePremultiply: () => {
        if (texture) {
          texture.premultiplyAlpha = !texture.premultiplyAlpha
          texture.needsUpdate = true
          if (!gui) return
          gui.controllersRecursive().forEach((controller) => {
            controller.updateDisplay()
          })
          console.log("已切换预乘 Alpha:", texture.premultiplyAlpha)
        }
      }
    }

    quickFolder.add(quickActions, "resetFlipY").name("🔄 重置 flipY")
    quickFolder.add(quickActions, "togglePremultiply").name("🎨 切换预乘 Alpha")

    quickFolder.open()
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理定时器
    if (textureFlipAlphaInterval) {
      clearInterval(textureFlipAlphaInterval)
      textureFlipAlphaInterval = null
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
    // 设置场景
    setupScene()
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
    title="🔄 纹理翻转与 Alpha 预乘"
    description="学习纹理的垂直翻转和 Alpha 预乘的概念与应用"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🔄 <strong>纹理翻转</strong> - 控制纹理的垂直翻转 (flipY)</li>
          <li>🎨 <strong>Alpha 预乘</strong> - 理解和控制 premultiplyAlpha</li>
          <li>🎭 <strong>透明材质</strong> - 展示透明纹理的正确显示</li>
          <li>🌈 <strong>背景控制</strong> - 调整背景色观察透明效果</li>
          <li>📊 <strong>实时信息</strong> - 显示纹理的各项属性</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 纹理翻转 (flipY)：</h3>
        <ul>
          <li><strong>定义</strong>：控制纹理是否在垂直方向翻转</li>
          <li><strong>默认值</strong>：true（Three.js 默认翻转）</li>
          <li><strong>原因</strong>：OpenGL 和图片坐标系的 Y 轴方向相反</li>
          <li><code>texture.flipY = true</code> - 翻转纹理（默认）</li>
          <li><code>texture.flipY = false</code> - 不翻转纹理</li>
          <li>⚠️ 修改后需要设置 <code>texture.needsUpdate = true</code></li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 为什么需要 flipY？</h3>
        <ul>
          <li><strong>图片坐标系</strong> - 原点在左上角，Y 轴向下</li>
          <li><strong>OpenGL 坐标系</strong> - 原点在左下角，Y 轴向上</li>
          <li><strong>WebGL</strong> - 基于 OpenGL，使用左下角为原点</li>
          <li><strong>Three.js</strong> - 默认翻转纹理以匹配图片坐标系</li>
          <li>💡 大多数情况下保持默认的 <code>flipY = true</code></li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎨 Alpha 预乘 (premultiplyAlpha)：</h3>
        <ul>
          <li><strong>定义</strong>：是否将 RGB 通道与 Alpha 通道预先相乘</li>
          <li><strong>默认值</strong>：false</li>
          <li><strong>用途</strong>：处理透明纹理的混合问题</li>
          <li><strong>预乘公式</strong>：RGB_final = RGB_original × Alpha</li>
          <li><code>texture.premultiplyAlpha = true</code> - 启用预乘</li>
          <li><code>texture.premultiplyAlpha = false</code> - 不预乘（默认）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔬 什么是 Alpha 预乘？</h3>
        <ul>
          <li><strong>普通 Alpha</strong>：颜色和透明度分别存储</li>
          <li><strong>预乘 Alpha</strong>：颜色值已经乘以透明度</li>
          <li><strong>示例</strong>：</li>
          <li>&nbsp;&nbsp;- 普通：RGB(255, 0, 0) Alpha(0.5)</li>
          <li>&nbsp;&nbsp;- 预乘：RGB(127.5, 0, 0) Alpha(0.5)</li>
          <li>💡 预乘可以避免某些混合问题和边缘瑕疵</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 何时使用预乘 Alpha？</h3>
        <ul>
          <li>✅ <strong>导出工具已预乘</strong> - 某些工具导出的纹理已预乘</li>
          <li>✅ <strong>边缘问题</strong> - 透明边缘出现白边或黑边</li>
          <li>✅ <strong>正确混合</strong> - 需要正确的 Alpha 混合效果</li>
          <li>❌ <strong>普通纹理</strong> - 大多数情况下不需要</li>
          <li>❌ <strong>不透明纹理</strong> - 完全不透明的纹理不需要</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码示例：</p>
        <p><code>// 加载纹理</code></p>
        <p><code>const texture = textureLoader.load('/texture/rain.png')</code></p>
        <br>
        <p><code>// 控制垂直翻转</code></p>
        <p><code>texture.flipY = true // 默认值，翻转</code></p>
        <p><code>texture.flipY = false // 不翻转</code></p>
        <br>
        <p><code>// 控制 Alpha 预乘</code></p>
        <p><code>texture.premultiplyAlpha = false // 默认值，不预乘</code></p>
        <p><code>texture.premultiplyAlpha = true // 启用预乘</code></p>
        <br>
        <p><code>// 应用更改</code></p>
        <p><code>texture.needsUpdate = true</code></p>
        <br>
        <p><code>// 材质需要启用透明</code></p>
        <p><code>new THREE.MeshBasicMaterial({</code></p>
        <p><code>&nbsp;&nbsp;map: texture,</code></p>
        <p><code>&nbsp;&nbsp;transparent: true // 必须启用</code></p>
        <p><code>})</code></p>
      </div>

      <div class="info-section">
        <h3>🔧 常见问题与解决：</h3>
        <ul>
          <li><strong>纹理倒置</strong> - 检查 flipY 设置是否正确</li>
          <li><strong>透明边缘有瑕疵</strong> - 尝试启用 premultiplyAlpha</li>
          <li><strong>透明不显示</strong> - 确保材质 transparent 为 true</li>
          <li><strong>颜色不对</strong> - 检查 premultiplyAlpha 是否设置错误</li>
          <li><strong>修改不生效</strong> - 确保设置了 needsUpdate = true</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📐 坐标系对比：</h3>
        <ul>
          <li><strong>图片坐标系（通常）</strong>：</li>
          <li>&nbsp;&nbsp;- 原点：左上角 (0, 0)</li>
          <li>&nbsp;&nbsp;- X 轴：向右递增</li>
          <li>&nbsp;&nbsp;- Y 轴：向下递增</li>
          <li><strong>OpenGL/WebGL 纹理坐标</strong>：</li>
          <li>&nbsp;&nbsp;- 原点：左下角 (0, 0)</li>
          <li>&nbsp;&nbsp;- U 轴（X）：向右递增 (0 → 1)</li>
          <li>&nbsp;&nbsp;- V 轴（Y）：向上递增 (0 → 1)</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎮 实践建议：</h3>
        <ul>
          <li>🔸 使用 GUI 面板切换 flipY 观察效果</li>
          <li>🔸 切换预乘 Alpha 观察透明边缘变化</li>
          <li>🔸 调整背景色以更好地观察透明效果</li>
          <li>🔸 查看纹理信息了解各项属性</li>
          <li>🔸 大多数情况下使用默认设置即可</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🌟 应用场景：</h3>
        <ul>
          <li>🌧️ <strong>透明图片</strong> - PNG、WebP 等带 Alpha 通道的图片</li>
          <li>🎨 <strong>UI 元素</strong> - 游戏 UI、图标等透明元素</li>
          <li>🌿 <strong>树叶、草地</strong> - 使用 Alpha 贴图的植物</li>
          <li>💧 <strong>粒子效果</strong> - 烟雾、火焰、水滴等效果</li>
          <li>🪟 <strong>玻璃、窗户</strong> - 半透明材质</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚠️ 注意事项：</h3>
        <ul>
          <li>🔸 修改 flipY 或 premultiplyAlpha 后必须设置 needsUpdate = true</li>
          <li>🔸 flipY 主要用于纹理加载时，运行时修改较少</li>
          <li>🔸 premultiplyAlpha 需要根据纹理来源决定是否启用</li>
          <li>🔸 不是所有透明问题都需要预乘 Alpha 解决</li>
          <li>🔸 某些格式（如 glTF）会自动处理 Alpha 预乘</li>
        </ul>
      </div>

      <div class="controls-tip">
        <p>🎮 操作提示：</p>
        <ul style="margin-top: 8px">
          <li>• 使用鼠标左键拖拽旋转视角</li>
          <li>• 使用鼠标滚轮缩放视图</li>
          <li>• 使用鼠标右键平移视图</li>
          <li>• 使用右侧 GUI 面板调整纹理参数</li>
          <li>• 观察白色背景下的透明效果</li>
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
