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

  /**
   * 加载纹理
   */
  const loadTexture = () => {
    const textureLoader = new THREE.TextureLoader()

    // 加载纹理（这里使用 door 纹理，如果你有 amber 纹理请替换路径）
    texture = textureLoader.load("/three-project/texture/amber/base_color.jpg", () => {
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

    // 创建基础材质
    planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: texture
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

    // 纹理重复设置
    const repeatFolder = gui.addFolder("🔁 纹理重复")

    const repeatParams = {
      repeatX: 1,
      repeatY: 1,
      wrapS: "ClampToEdge",
      wrapT: "ClampToEdge"
    }

    // 水平重复次数
    repeatFolder
      .add(repeatParams, "repeatX", 1, 10, 1)
      .name("水平重复次数")
      .onChange((value) => {
        if (texture) {
          texture.repeat.x = value
          texture.needsUpdate = true
        }
      })

    // 垂直重复次数
    repeatFolder
      .add(repeatParams, "repeatY", 1, 10, 1)
      .name("垂直重复次数")
      .onChange((value) => {
        if (texture) {
          texture.repeat.y = value
          texture.needsUpdate = true
        }
      })

    // 水平包裹模式
    repeatFolder
      .add(repeatParams, "wrapS", ["ClampToEdge", "RepeatWrapping", "MirroredRepeat"])
      .name("水平包裹模式")
      .onChange((value) => {
        if (texture) {
          switch (value) {
            case "ClampToEdge":
              texture.wrapS = THREE.ClampToEdgeWrapping
              break
            case "RepeatWrapping":
              texture.wrapS = THREE.RepeatWrapping
              break
            case "MirroredRepeat":
              texture.wrapS = THREE.MirroredRepeatWrapping
              break
          }
          texture.needsUpdate = true
        }
      })

    // 垂直包裹模式
    repeatFolder
      .add(repeatParams, "wrapT", ["ClampToEdge", "RepeatWrapping", "MirroredRepeat"])
      .name("垂直包裹模式")
      .onChange((value) => {
        if (texture) {
          switch (value) {
            case "ClampToEdge":
              texture.wrapT = THREE.ClampToEdgeWrapping
              break
            case "RepeatWrapping":
              texture.wrapT = THREE.RepeatWrapping
              break
            case "MirroredRepeat":
              texture.wrapT = THREE.MirroredRepeatWrapping
              break
          }
          texture.needsUpdate = true
        }
      })

    repeatFolder.open()

    // 纹理偏移设置
    const offsetFolder = gui.addFolder("📐 纹理偏移")

    const offsetParams = {
      offsetX: 0,
      offsetY: 0
    }

    // 水平偏移
    offsetFolder
      .add(offsetParams, "offsetX", -1, 1, 0.01)
      .name("水平偏移")
      .onChange((value) => {
        if (texture) {
          texture.offset.x = value
          texture.needsUpdate = true
        }
      })

    // 垂直偏移
    offsetFolder
      .add(offsetParams, "offsetY", -1, 1, 0.01)
      .name("垂直偏移")
      .onChange((value) => {
        if (texture) {
          texture.offset.y = value
          texture.needsUpdate = true
        }
      })

    offsetFolder.open()

    // 纹理旋转设置
    const rotationFolder = gui.addFolder("🔄 纹理旋转")

    const rotationParams = {
      rotation: 45, // 度数
      centerX: 0.5,
      centerY: 0.5
    }

    // 旋转角度
    rotationFolder
      .add(rotationParams, "rotation", 0, 360, 1)
      .name("旋转角度（度）")
      .onChange((value) => {
        if (texture) {
          texture.rotation = (value * Math.PI) / 180
          texture.needsUpdate = true
        }
      })

    // 旋转中心 X
    rotationFolder
      .add(rotationParams, "centerX", 0, 1, 0.01)
      .name("旋转中心 X")
      .onChange((value) => {
        if (texture) {
          texture.center.x = value
          texture.needsUpdate = true
        }
      })

    // 旋转中心 Y
    rotationFolder
      .add(rotationParams, "centerY", 0, 1, 0.01)
      .name("旋转中心 Y")
      .onChange((value) => {
        if (texture) {
          texture.center.y = value
          texture.needsUpdate = true
        }
      })

    // 设置初始旋转（45度）
    if (texture) {
      texture.center.set(0.5, 0.5)
      texture.rotation = Math.PI / 4
    }

    rotationFolder.open()

    // 快捷操作
    const quickFolder = gui.addFolder("⚡ 快捷操作")

    const quickActions = {
      reset: () => {
        if (texture) {
          // 重置所有参数
          texture.repeat.set(1, 1)
          texture.offset.set(0, 0)
          texture.rotation = 0
          texture.center.set(0.5, 0.5)
          texture.wrapS = THREE.ClampToEdgeWrapping
          texture.wrapT = THREE.ClampToEdgeWrapping
          texture.needsUpdate = true

          // 重置 GUI 参数
          repeatParams.repeatX = 1
          repeatParams.repeatY = 1
          repeatParams.wrapS = "ClampToEdge"
          repeatParams.wrapT = "ClampToEdge"
          offsetParams.offsetX = 0
          offsetParams.offsetY = 0
          rotationParams.rotation = 0
          rotationParams.centerX = 0.5
          rotationParams.centerY = 0.5

          // 刷新 GUI 显示
          if (!gui) return
          gui.controllersRecursive().forEach((controller) => {
            controller.updateDisplay()
          })

          console.log("已重置所有参数")
        }
      },
      preset4x4: () => {
        if (texture) {
          texture.repeat.set(4, 4)
          texture.wrapS = THREE.RepeatWrapping
          texture.wrapT = THREE.RepeatWrapping
          texture.needsUpdate = true

          repeatParams.repeatX = 4
          repeatParams.repeatY = 4
          repeatParams.wrapS = "RepeatWrapping"
          repeatParams.wrapT = "RepeatWrapping"

          if (!gui) return
          gui.controllersRecursive().forEach((controller) => {
            controller.updateDisplay()
          })

          console.log("已应用 4x4 重复预设")
        }
      },
      presetMirror: () => {
        if (texture) {
          texture.repeat.set(4, 4)
          texture.wrapS = THREE.MirroredRepeatWrapping
          texture.wrapT = THREE.MirroredRepeatWrapping
          texture.needsUpdate = true

          repeatParams.repeatX = 4
          repeatParams.repeatY = 4
          repeatParams.wrapS = "MirroredRepeat"
          repeatParams.wrapT = "MirroredRepeat"

          if (!gui) return
          gui.controllersRecursive().forEach((controller) => {
            controller.updateDisplay()
          })

          console.log("已应用镜像重复预设")
        }
      }
    }

    quickFolder.add(quickActions, "reset").name("🔄 重置所有参数")
    quickFolder.add(quickActions, "preset4x4").name("📦 应用 4x4 重复")
    quickFolder.add(quickActions, "presetMirror").name("🪞 应用镜像重复")

    quickFolder.open()
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
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
    title="🎨 纹理变换"
    description="学习纹理的位移、旋转、缩放和重复等基础变换操作"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🔁 <strong>纹理重复</strong> - 控制纹理在 UV 方向的重复次数</li>
          <li>📐 <strong>纹理偏移</strong> - 调整纹理在平面上的位置</li>
          <li>🔄 <strong>纹理旋转</strong> - 以指定中心点旋转纹理</li>
          <li>📦 <strong>包裹模式</strong> - 支持边缘夹紧、重复、镜像重复三种模式</li>
          <li>⚡ <strong>快捷预设</strong> - 一键应用常用的纹理变换效果</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 纹理重复（Repeat）：</h3>
        <ul>
          <li><strong>texture.repeat</strong> - 设置纹理重复次数</li>
          <li><code>texture.repeat.set(x, y)</code> - x 为水平重复，y 为垂直重复</li>
          <li><strong>默认值</strong>：(1, 1) - 不重复，纹理铺满整个面</li>
          <li><strong>注意</strong>：需要配合 wrapS 和 wrapT 使用才能看到重复效果</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 包裹模式（Wrapping）：</h3>
        <ul>
          <li><strong>ClampToEdge</strong> - 边缘像素延伸（默认值）</li>
          <li><strong>RepeatWrapping</strong> - 纹理重复平铺</li>
          <li><strong>MirroredRepeat</strong> - 镜像重复，每次重复会翻转</li>
          <li><code>texture.wrapS</code> - 水平方向包裹模式</li>
          <li><code>texture.wrapT</code> - 垂直方向包裹模式</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📐 纹理偏移（Offset）：</h3>
        <ul>
          <li><strong>texture.offset</strong> - 纹理在 UV 坐标中的偏移</li>
          <li><code>texture.offset.set(x, y)</code> - 设置偏移量</li>
          <li><strong>范围</strong>：通常在 0-1 之间，可以为负值</li>
          <li><strong>效果</strong>：0.5 表示偏移半个纹理单位</li>
          <li>💡 可用于实现纹理动画（如流动效果）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔄 纹理旋转（Rotation）：</h3>
        <ul>
          <li><strong>texture.rotation</strong> - 纹理旋转角度（弧度）</li>
          <li><strong>texture.center</strong> - 旋转中心点（默认左下角 0,0）</li>
          <li><code>texture.center.set(0.5, 0.5)</code> - 设置中心点为纹理中心</li>
          <li><strong>弧度转换</strong>：角度 × π / 180</li>
          <li>💡 本示例默认以中心点旋转 45 度</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码示例：</p>
        <p><code>// 4x4 重复</code></p>
        <p><code>texture.repeat.set(4, 4)</code></p>
        <p><code>texture.wrapS = THREE.RepeatWrapping</code></p>
        <p><code>texture.wrapT = THREE.RepeatWrapping</code></p>
        <br>
        <p><code>// 镜像重复</code></p>
        <p><code>texture.wrapS = THREE.MirroredRepeatWrapping</code></p>
        <br>
        <p><code>// 纹理偏移</code></p>
        <p><code>texture.offset.set(0.5, 0.5)</code></p>
        <br>
        <p><code>// 纹理旋转（45度）</code></p>
        <p><code>texture.center.set(0.5, 0.5) // 设置旋转中心</code></p>
        <p><code>texture.rotation = Math.PI / 4 // 旋转45度</code></p>
      </div>

      <div class="info-section">
        <h3>🎨 UV 坐标系：</h3>
        <ul>
          <li><strong>U 轴</strong> - 水平方向，从左到右 (0 → 1)</li>
          <li><strong>V 轴</strong> - 垂直方向，从下到上 (0 → 1)</li>
          <li><strong>原点</strong> - 左下角为 (0, 0)</li>
          <li><strong>右上角</strong> - 为 (1, 1)</li>
          <li>💡 纹理坐标独立于几何体坐标系</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 实用技巧：</h3>
        <ul>
          <li>🔸 使用 GUI 面板实时调整参数观察效果</li>
          <li>🔸 点击"应用 4x4 重复"查看平铺效果</li>
          <li>🔸 点击"应用镜像重复"查看镜像效果</li>
          <li>🔸 调整旋转中心点，观察不同的旋转效果</li>
          <li>🔸 点击"重置所有参数"恢复初始状态</li>
          <li>🔸 修改 <code>texture.needsUpdate = true</code> 来应用变更</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎮 应用场景：</h3>
        <ul>
          <li>🏗️ <strong>建筑材质</strong> - 墙砖、地板等重复纹理</li>
          <li>🌊 <strong>流动效果</strong> - 通过动画偏移实现水流、传送带</li>
          <li>🎨 <strong>图案设计</strong> - 创建对称、重复的装饰图案</li>
          <li>🎯 <strong>UV 动画</strong> - 结合 offset 制作纹理动画</li>
          <li>🎪 <strong>万花筒效果</strong> - 使用镜像重复创建对称图案</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚠️ 注意事项：</h3>
        <ul>
          <li>🔸 修改纹理属性后需要设置 <code>texture.needsUpdate = true</code></li>
          <li>🔸 旋转角度使用弧度制，不是角度制</li>
          <li>🔸 默认旋转中心在左下角 (0, 0)，通常需要设置为中心 (0.5, 0.5)</li>
          <li>🔸 ClampToEdge 模式下设置 repeat 无效</li>
          <li>🔸 纹理重复会影响 mipmaps 的生成</li>
        </ul>
      </div>

      <div class="controls-tip">
        <p>🎮 操作提示：</p>
        <ul style="margin-top: 8px">
          <li>• 使用鼠标左键拖拽旋转视角</li>
          <li>• 使用鼠标滚轮缩放视图</li>
          <li>• 使用鼠标右键平移视图</li>
          <li>• 使用右侧 GUI 面板调整纹理参数</li>
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
