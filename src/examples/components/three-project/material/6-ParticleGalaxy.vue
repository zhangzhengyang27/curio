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
    controls,
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 0, y: 0, z: 10 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05
    },
    showAxesHelper: false
  })

  // GUI 和对象引用
  let gui: GUI | null = null
  let points: THREE.Points | null = null
  let pointsMaterial: THREE.PointsMaterial | null = null
  let particlesGeometry: THREE.BufferGeometry | null = null

  /**
   * 创建粒子星河
   */
  const createParticleGalaxy = (count = 5000) => {
    if (!scene.value) return

    // 创建粒子几何体
    particlesGeometry = new THREE.BufferGeometry()

    // 设置缓冲区数组
    const positions = new Float32Array(count * 3)
    // 设置粒子顶点颜色
    const colors = new Float32Array(count * 3)

    // 随机设置顶点位置和颜色
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 100 // 随机位置 -50 到 50
      colors[i] = Math.random() // 随机颜色 0-1
    }

    // 设置几何体属性
    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))

    // 载入纹理
    const textureLoader = new THREE.TextureLoader()
    const texture = textureLoader.load("/three-project/texture/particles/1.png")

    // 设置点材质
    pointsMaterial = new THREE.PointsMaterial({
      size: 0.5, // 粒子大小
      color: 0xfff000, // 基础颜色（黄色）
      sizeAttenuation: true, // 根据相机深度衰减
      map: texture, // 纹理贴图
      alphaMap: texture, // 透明度贴图
      transparent: true, // 启用透明
      depthWrite: false, // 禁用深度写入（避免粒子遮挡问题）
      blending: THREE.AdditiveBlending, // 加法混合（发光效果）
      vertexColors: true // 启用顶点颜色
    })

    // 创建粒子系统
    points = new THREE.Points(particlesGeometry, pointsMaterial)
    scene.value.add(points)

    console.log("粒子星河创建成功")
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    if (!pointsMaterial || !points) return

    gui = new GUI()
    gui.title("粒子星河控制")

    // 粒子材质控制
    const materialFolder = gui.addFolder("🎨 材质属性")

    materialFolder
      .add(pointsMaterial, "size", 0.1, 5, 0.1)
      .name("粒子大小")
      .onChange(() => {
        if (!pointsMaterial) return
        pointsMaterial.needsUpdate = true
      })

    materialFolder
      .add(pointsMaterial, "sizeAttenuation")
      .name("深度衰减")
      .onChange(() => {
        if (!pointsMaterial) return
        pointsMaterial.needsUpdate = true
      })

    materialFolder.addColor(pointsMaterial, "color").name("基础颜色")

    materialFolder.open()

    // 粒子系统控制
    const systemFolder = gui.addFolder("⚙️ 粒子系统")

    const systemSettings = {
      particleCount: 5000,
      rotationSpeed: 0.1,
      autoRotate: false
    }

    systemFolder
      .add(systemSettings, "particleCount", 1000, 20000, 1000)
      .name("粒子数量")
      .onChange((value) => {
        // 移除旧的粒子系统
        if (points) {
          if (!scene.value) return
          scene.value.remove(points)
        }
        if (particlesGeometry) {
          particlesGeometry.dispose()
        }
        if (pointsMaterial) {
          pointsMaterial.dispose()
        }

        // 重新生成粒子系统
        createParticleGalaxy(value)
      })

    systemFolder.add(systemSettings, "rotationSpeed", 0, 1, 0.01).name("旋转速度")

    systemFolder
      .add(systemSettings, "autoRotate")
      .name("自动旋转")
      .onChange((value) => {
        if (controls.value) {
          controls.value.autoRotate = value
          controls.value.autoRotateSpeed = systemSettings.rotationSpeed * 10
        }
      })

    systemFolder.open()

    // 混合模式
    const blendingFolder = gui.addFolder("🌟 混合模式")

    const blendingModes = {
      mode: "AdditiveBlending"
    }

    blendingFolder
      .add(blendingModes, "mode", ["NormalBlending", "AdditiveBlending", "SubtractiveBlending", "MultiplyBlending"])
      .name("混合模式")
      .onChange((value) => {
        if (!pointsMaterial) return
        switch (value) {
          case "NormalBlending":
            pointsMaterial.blending = THREE.NormalBlending
            break
          case "AdditiveBlending":
            pointsMaterial.blending = THREE.AdditiveBlending
            break
          case "SubtractiveBlending":
            pointsMaterial.blending = THREE.SubtractiveBlending
            break
          case "MultiplyBlending":
            pointsMaterial.blending = THREE.MultiplyBlending
            break
        }
        pointsMaterial.needsUpdate = true
      })

    blendingFolder.open()

    // 材质信息
    const infoFolder = gui.addFolder("📊 粒子系统信息")
    const info = {
      particleCount: 5000,
      materialType: pointsMaterial.type,
      blending: "AdditiveBlending",
      vertexColors: true,
      sizeAttenuation: pointsMaterial.sizeAttenuation
    }

    infoFolder.add(info, "particleCount").name("粒子数量").listen()
    infoFolder.add(info, "materialType").name("材质类型").listen()
    infoFolder.add(info, "blending").name("混合模式").listen()
    infoFolder.add(info, "vertexColors").name("顶点颜色").listen()
    infoFolder.add(info, "sizeAttenuation").name("深度衰减").listen()

    // 实时更新信息
    setInterval(() => {
      if (pointsMaterial) {
        info.sizeAttenuation = pointsMaterial.sizeAttenuation
        info.blending =
          pointsMaterial.blending === THREE.NormalBlending
            ? "NormalBlending"
            : pointsMaterial.blending === THREE.AdditiveBlending
            ? "AdditiveBlending"
            : pointsMaterial.blending === THREE.SubtractiveBlending
            ? "SubtractiveBlending"
            : "MultiplyBlending"
      }
    }, 100)

    infoFolder.open()

    // 添加说明信息
    const technicalFolder = gui.addFolder("📖 技术说明")
    const technicalInfo = {
      Points: "粒子系统",
      BufferGeometry: "高性能几何体",
      PointsMaterial: "点材质",
      AdditiveBlending: "加法混合（发光效果）",
      vertexColors: "顶点颜色",
      sizeAttenuation: "深度衰减"
    }

    for (const [key, value] of Object.entries(technicalInfo)) {
      const obj: Record<string, string> = {}
      obj[key] = value
      technicalFolder.add(obj, key).name(key).listen().disable()
    }
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理粒子系统
    if (points && scene.value) {
      scene.value.remove(points)
    }
    if (particlesGeometry) {
      particlesGeometry.dispose()
      particlesGeometry = null
    }
    if (pointsMaterial) {
      pointsMaterial.dispose()
      pointsMaterial = null
    }
    points = null

    // 清理 GUI
    gui?.destroy()
    gui = null

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    // 启用渲染器阴影和物理光照
    if (renderer.value) {
      renderer.value.shadowMap.enabled = true
    }

    // 创建粒子星河
    createParticleGalaxy()
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
    title="✨ 粒子星河效果"
    description="使用 Points 和 PointsMaterial 创建绚丽的粒子星河"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>✨ <strong>Points</strong> - 粒子系统（5000个粒子）</li>
          <li>🎨 <strong>PointsMaterial</strong> - 点材质（纹理、颜色、透明度）</li>
          <li>🌈 <strong>vertexColors</strong> - 顶点颜色（随机彩色粒子）</li>
          <li>🌟 <strong>AdditiveBlending</strong> - 加法混合（发光效果）</li>
          <li>📐 <strong>sizeAttenuation</strong> - 深度衰减（近大远小）</li>
          <li>🔄 <strong>BufferGeometry</strong> - 高性能几何体</li>
          <li>🎛️ GUI 实时调整粒子参数</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 什么是粒子系统（Points）？</h3>
        <ul>
          <li><strong>定义</strong>：Three.js 中用于渲染大量点的高性能系统</li>
          <li><strong>特点</strong>：每个粒子都是一个顶点，不是完整的几何体</li>
          <li><strong>优势</strong>：可同时渲染成千上万个粒子而不影响性能</li>
          <li><strong>应用</strong>：星空、雨雪、粒子特效、点云数据</li>
          <li>💡 本例展示了 5000 个随机颜色的粒子组成的星河</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎨 PointsMaterial 核心属性：</h3>
        <ul>
          <li><strong>size</strong> - 粒子大小（像素单位）</li>
          <li><strong>color</strong> - 基础颜色（可被顶点颜色覆盖）</li>
          <li><strong>vertexColors</strong> - 启用顶点颜色（每个粒子不同颜色）</li>
          <li><strong>sizeAttenuation</strong> - 深度衰减（近大远小的透视效果）</li>
          <li><strong>map</strong> - 纹理贴图（粒子的形状）</li>
          <li><strong>alphaMap</strong> - 透明度贴图</li>
          <li><strong>transparent</strong> - 启用透明度</li>
          <li><strong>blending</strong> - 混合模式（控制粒子叠加效果）</li>
          <li><strong>depthWrite</strong> - 深度写入（false 避免遮挡问题）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🌟 混合模式详解：</h3>
        <ul>
          <li><strong>NormalBlending</strong>（正常混合）：</li>
          <li>&nbsp;&nbsp;• 标准的 alpha 混合</li>
          <li>&nbsp;&nbsp;• 后面的粒子遮挡前面的粒子</li>
          <li><strong>AdditiveBlending</strong>（加法混合）★ 本例使用：</li>
          <li>&nbsp;&nbsp;• 颜色相加，重叠区域更亮</li>
          <li>&nbsp;&nbsp;• 创建发光效果</li>
          <li>&nbsp;&nbsp;• 适合星空、火花等效果</li>
          <li><strong>SubtractiveBlending</strong>（减法混合）：</li>
          <li>&nbsp;&nbsp;• 颜色相减，重叠区域更暗</li>
          <li><strong>MultiplyBlending</strong>（乘法混合）：</li>
          <li>&nbsp;&nbsp;• 颜色相乘，产生变暗效果</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔄 BufferGeometry 高性能原理：</h3>
        <ul>
          <li><strong>Float32Array</strong> - 使用类型化数组存储顶点数据</li>
          <li><strong>直接传输</strong> - 数据直接传输到 GPU，无需转换</li>
          <li><strong>内存效率</strong> - 比普通数组占用更少内存</li>
          <li><strong>setAttribute</strong> - 灵活定义顶点属性</li>
          <li>&nbsp;&nbsp;• position：顶点位置（x, y, z）</li>
          <li>&nbsp;&nbsp;• color：顶点颜色（r, g, b）</li>
          <li>💡 每个属性都是 Float32Array，每3个值代表一个顶点的完整数据</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📐 深度衰减（sizeAttenuation）：</h3>
        <ul>
          <li><strong>启用时（true）</strong>：</li>
          <li>&nbsp;&nbsp;• 粒子大小受相机距离影响</li>
          <li>&nbsp;&nbsp;• 远处粒子变小，近处粒子变大</li>
          <li>&nbsp;&nbsp;• 符合真实世界的透视效果</li>
          <li>&nbsp;&nbsp;• 适合星空、雨雪等自然效果</li>
          <li><strong>禁用时（false）</strong>：</li>
          <li>&nbsp;&nbsp;• 粒子大小保持恒定</li>
          <li>&nbsp;&nbsp;• 无论距离多远都一样大</li>
          <li>&nbsp;&nbsp;• 适合 UI 元素、图标等</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>// 创建粒子几何体</code></p>
        <p><code>const geometry = new THREE.BufferGeometry()</code></p>
        <p><code>const positions = new Float32Array(count * 3)</code></p>
        <p><code>const colors = new Float32Array(count * 3)</code></p>
        <p><code /></p>
        <p><code>// 随机设置顶点</code></p>
        <p><code>for (let i = 0; i &lt; count * 3; i++) {</code></p>
        <p><code>&nbsp;&nbsp;positions[i] = (Math.random() - 0.5) * 100</code></p>
        <p><code>&nbsp;&nbsp;colors[i] = Math.random()</code></p>
        <p><code>}</code></p>
        <p><code /></p>
        <p><code>// 设置属性</code></p>
        <p><code>geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))</code></p>
        <p><code>geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))</code></p>
        <p><code /></p>
        <p><code>// 创建材质</code></p>
        <p><code>const material = new THREE.PointsMaterial({</code></p>
        <p><code>&nbsp;&nbsp;size: 0.5,</code></p>
        <p><code>&nbsp;&nbsp;vertexColors: true,</code></p>
        <p><code>&nbsp;&nbsp;blending: THREE.AdditiveBlending,</code></p>
        <p><code>&nbsp;&nbsp;transparent: true,</code></p>
        <p><code>&nbsp;&nbsp;depthWrite: false</code></p>
        <p><code>})</code></p>
        <p><code /></p>
        <p><code>// 创建粒子系统</code></p>
        <p><code>const points = new THREE.Points(geometry, material)</code></p>
      </div>

      <div class="info-section">
        <h3>🎯 技术要点：</h3>
        <ul>
          <li>💡 <code>depthWrite: false</code> - 避免粒子之间的遮挡问题</li>
          <li>💡 <code>transparent: true</code> - 启用透明度，配合 alphaMap</li>
          <li>💡 <code>blending</code> - 控制粒子叠加效果，发光关键</li>
          <li>💡 <code>Float32Array</code> - 高效的顶点数据存储</li>
          <li>💡 <code>vertexColors</code> - 每个粒子不同颜色</li>
          <li>💡 纹理贴图 - 定义粒子形状（圆形、星形等）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚠️ 注意事项：</h3>
        <ul>
          <li>🔸 <strong>粒子数量</strong>：过多粒子会影响性能，建议不超过 50000</li>
          <li>🔸 <strong>渲染顺序</strong>：透明粒子的渲染顺序很重要</li>
          <li>🔸 <strong>深度写入</strong>：depthWrite: false 避免遮挡，但可能引起其他问题</li>
          <li>🔸 <strong>纹理尺寸</strong>：粒子纹理建议使用 2 的幂次方尺寸</li>
          <li>🔸 <strong>材质更新</strong>：修改某些参数后需设置 needsUpdate = true</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🚀 性能优化建议：</h3>
        <ul>
          <li>💡 使用 <strong>BufferGeometry</strong> 而不是 Geometry</li>
          <li>💡 合理控制粒子数量，根据设备性能调整</li>
          <li>💡 使用纹理图集减少纹理切换</li>
          <li>💡 考虑使用 <strong>InstancedMesh</strong> 渲染复杂粒子</li>
          <li>💡 适当降低粒子更新频率</li>
          <li>💡 使用简单的粒子纹理</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 应用场景：</h3>
        <ul>
          <li>🌌 <strong>星空背景</strong> - 创建逼真的宇宙星空</li>
          <li>🌨️ <strong>天气效果</strong> - 雨、雪、雾等自然效果</li>
          <li>✨ <strong>粒子特效</strong> - 爆炸、火花、魔法效果</li>
          <li>📊 <strong>数据可视化</strong> - 点云数据、散点图</li>
          <li>🎮 <strong>游戏特效</strong> - 尘埃、烟雾、能量粒子</li>
          <li>🎨 <strong>艺术创作</strong> - 抽象艺术、视觉装置</li>
        </ul>
      </div>

      <div class="controls-tip">
        <p>🎮 操作提示：</p>
        <ul>
          <li>🖱️ 左键拖动：旋转视角</li>
          <li>🖱️ 右键拖动：平移视角</li>
          <li>🖱️ 滚轮：缩放</li>
          <li>🎚️ <strong>GUI 面板</strong>：实时调整所有粒子参数</li>
          <li>&nbsp;&nbsp;• 粒子大小：调节每个粒子的尺寸</li>
          <li>&nbsp;&nbsp;• 深度衰减：开关透视效果</li>
          <li>&nbsp;&nbsp;• 基础颜色：调整整体色调</li>
          <li>&nbsp;&nbsp;• 粒子数量：动态调整粒子数量（1000-20000）</li>
          <li>&nbsp;&nbsp;• 自动旋转：开启场景自动旋转</li>
          <li>&nbsp;&nbsp;• 混合模式：切换不同的混合效果</li>
          <li>💡 <strong>建议</strong>：尝试切换混合模式观察不同的视觉效果</li>
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
