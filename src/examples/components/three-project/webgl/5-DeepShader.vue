<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import deepVertexShader from "./shader/deep/vertex.glsl?raw"
  import deepFragmentShader from "./shader/deep/fragment.glsl?raw"

  // 容器引用
  const containerRef = shallowRef<HTMLDivElement | null>(null)

  // 使用 Three.js 场景 composable
  const { scene, camera, renderer, startAnimation } = useThreeScene(containerRef, {
    fov: 90,
    cameraPosition: { x: 0, y: 0, z: 2 },
    enableControls: true,
    showAxesHelper: true,
    axesHelperSize: 5,
    showGridHelper: false,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05
    }
  })

  // 着色器材质
  let shaderMaterial: THREE.ShaderMaterial | null = null
  // 平面网格
  let floor: THREE.Mesh | null = null
  // 时钟
  const clock = new THREE.Clock()
  // GUI 控制器
  let gui: GUI | null = null
  // 纹理
  let texture: THREE.Texture | null = null

  // GUI 参数
  const params = {
    uFrequency: 10,
    uScale: 0.1
  }

  /**
   * 加载纹理
   */
  const loadTexture = () => {
    const textureLoader = new THREE.TextureLoader()
    texture = textureLoader.load("/three-project/texture/ca.jpeg")
  }

  /**
   * 创建着色器材质
   */
  const createShaderMaterial = () => {
    shaderMaterial = new THREE.ShaderMaterial({
      vertexShader: deepVertexShader,
      fragmentShader: deepFragmentShader,
      uniforms: {
        uColor: {
          value: new THREE.Color("purple")
        },
        // 波浪的频率
        uFrequency: {
          value: params.uFrequency
        },
        // 波浪的幅度
        uScale: {
          value: params.uScale
        },
        // 动画时间
        uTime: {
          value: 0
        },
        uTexture: {
          value: texture
        }
      },
      side: THREE.DoubleSide,
      transparent: true
    })
  }

  /**
   * 创建平面
   */
  const createFloor = () => {
    // 创建平面几何体（宽度、高度、宽度分段、高度分段）
    const geometry = new THREE.PlaneGeometry(1, 1, 64, 64)

    // 创建网格
    floor = new THREE.Mesh(geometry, shaderMaterial!)

    // 添加到场景
    if (scene.value) {
      scene.value.add(floor)
    }
  }

  /**
   * 创建 GUI 控制器
   */
  const createGUI = () => {
    gui = new GUI()

    gui
      .add(params, "uFrequency")
      .min(0)
      .max(50)
      .step(0.1)
      .name("波浪频率")
      .onChange((value) => {
        if (shaderMaterial) {
          shaderMaterial.uniforms.uFrequency.value = value
        }
      })

    gui
      .add(params, "uScale")
      .min(0)
      .max(1)
      .step(0.01)
      .name("波浪幅度")
      .onChange((value) => {
        if (shaderMaterial) {
          shaderMaterial.uniforms.uScale.value = value
        }
      })
  }

  /**
   * 初始化场景
   */
  const initScene = () => {
    if (!scene.value || !camera.value || !renderer.value) return

    // 设置渲染器背景为透明
    if (renderer.value) {
      renderer.value.setClearAlpha(0)
    }

    // 加载纹理
    loadTexture()

    // 创建着色器材质
    createShaderMaterial()

    // 创建平面
    createFloor()

    // 创建 GUI 控制器
    createGUI()

    // 启动动画循环
    startAnimation(animate)
  }

  /**
   * 动画循环
   */
  const animate = () => {
    const elapsedTime = clock.getElapsedTime()

    // 更新 shader 的时间 uniform
    if (shaderMaterial) {
      shaderMaterial.uniforms.uTime.value = elapsedTime
    }
  }

  /**
   * 清理资源
   */
  const cleanup = () => {
    // 销毁 GUI
    if (gui) {
      gui.destroy()
      gui = null
    }

    // 清理材质
    if (shaderMaterial) {
      shaderMaterial.dispose()
    }

    // 清理几何体
    if (floor) {
      floor.geometry.dispose()
    }

    // 清理纹理
    if (texture) {
      texture.dispose()
    }
  }

  // 组件挂载后初始化
  onMounted(() => {
    // 等待 useThreeScene 初始化完成
    setTimeout(() => {
      initScene()
    }, 100)
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    cleanup()
  })
</script>

<template>
  <PageLayout
    title="🌊 深入理解 Shader"
    description="高级着色器技术 - 噪声、波纹、渐变等特效"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🎨 <strong>复杂着色器效果</strong> - 包含多种视觉效果示例</li>
          <li>🌊 <strong>噪声与波纹</strong> - Perlin 噪声、波浪效果</li>
          <li>🎛️ <strong>GUI 调试</strong> - 使用 lil-gui 实时调整参数</li>
          <li>⚡ <strong>动态动画</strong> - 基于时间的 uniform 更新</li>
          <li>🖼️ <strong>纹理采样</strong> - 在着色器中使用纹理</li>
          <li>📐 <strong>UV 变换</strong> - 旋转、缩放、变形等 UV 操作</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 什么是高级着色器技术？</h3>
        <ul>
          <li><strong>噪声函数</strong>：生成自然随机效果（云、烟雾、地形）</li>
          <li><strong>UV 变换</strong>：修改纹理坐标实现动态效果</li>
          <li><strong>数学函数</strong>：sin、cos、atan 等创建周期性图案</li>
          <li><strong>混合函数</strong>：mix、step 等实现颜色渐变和过渡</li>
          <li>💡 本例展示了 40+ 种着色器效果技巧</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>// 创建着色器材质</code></p>
        <p><code>const material = new THREE.ShaderMaterial({</code></p>
        <p><code>&nbsp;&nbsp;vertexShader: deepVertexShader,</code></p>
        <p><code>&nbsp;&nbsp;fragmentShader: deepFragmentShader,</code></p>
        <p><code>&nbsp;&nbsp;uniforms: {</code></p>
        <p><code>&nbsp;&nbsp;&nbsp;&nbsp;uTime: { value: 0 },</code></p>
        <p><code>&nbsp;&nbsp;&nbsp;&nbsp;uFrequency: { value: 10 },</code></p>
        <p><code>&nbsp;&nbsp;&nbsp;&nbsp;uScale: { value: 0.1 }</code></p>
        <p><code>&nbsp;&nbsp;}</code></p>
        <p><code>})</code></p>
      </div>

      <div class="info-section">
        <h3>🎨 着色器效果分类：</h3>
        <ul>
          <li><strong>1. 渐变效果（1-6）</strong>：</li>
          <li>&nbsp;&nbsp;• 基于 UV 坐标的线性渐变</li>
          <li>&nbsp;&nbsp;• 从左到右、从下到上、短范围渐变</li>
          <li>&nbsp;&nbsp;• 使用：<code>vUv.x</code>、<code>vUv.y</code>、<code>1.0 - vUv.y</code></li>
          <li><strong>2. 条纹效果（7-14）</strong>：</li>
          <li>&nbsp;&nbsp;• 使用 <code>mod()</code> 实现重复</li>
          <li>&nbsp;&nbsp;• 使用 <code>step()</code> 创建硬边界</li>
          <li>&nbsp;&nbsp;• 条纹相加、相乘、相减实现不同图案</li>
          <li><strong>3. 几何图案（15-23）</strong>：</li>
          <li>&nbsp;&nbsp;• 使用 <code>abs()</code>、<code>min()</code>、<code>max()</code></li>
          <li>&nbsp;&nbsp;• 正方形、T 型、网格等图案</li>
          <li>&nbsp;&nbsp;• 使用 <code>floor()</code>、<code>ceil()</code> 实现阶梯效果</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🌀 圆形与径向效果（24-36）：</h3>
        <ul>
          <li><strong>distance()</strong>：计算两点距离</li>
          <li>&nbsp;&nbsp;• 圆形、圆环、靶心效果</li>
          <li>&nbsp;&nbsp;• 星星、十字光芒</li>
          <li><strong>length()</strong>：向量长度</li>
          <li>&nbsp;&nbsp;• 径向渐变</li>
          <li><strong>旋转变换</strong>：</li>
          <li>&nbsp;&nbsp;• 自定义 rotate() 函数</li>
          <li>&nbsp;&nbsp;• 旋转飞镖、动态选择效果</li>
          <li>💡 公式：<code>0.15 / distance(...) - 1.0</code> 创建发光效果</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📐 波浪与变形（37-39）：</h3>
        <ul>
          <li><strong>波浪 UV</strong>：</li>
          <li>&nbsp;&nbsp;• <code>vUv.y + sin(vUv.x * 30.0) * 0.1</code></li>
          <li>&nbsp;&nbsp;• 水平波浪、垂直波浪、双向波浪</li>
          <li><strong>应用</strong>：</li>
          <li>&nbsp;&nbsp;• 波浪环、扭曲效果</li>
          <li>&nbsp;&nbsp;• 结合 distance() 实现复杂图案</li>
          <li>💡 调整频率（30.0）和振幅（0.1）可改变波浪效果</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🌟 角度与旋转效果（40-45）：</h3>
        <ul>
          <li><strong>atan(x, y)</strong>：计算角度</li>
          <li>&nbsp;&nbsp;• 螺旋渐变：<code>(angle + 3.14) / 6.28</code></li>
          <li>&nbsp;&nbsp;• 雷达扫射效果</li>
          <li>&nbsp;&nbsp;• 动态旋转：结合 uTime</li>
          <li><strong>万花筒</strong>：</li>
          <li>&nbsp;&nbsp;• <code>mod(angle * 10.0, 1.0)</code></li>
          <li><strong>光芒四射</strong>：</li>
          <li>&nbsp;&nbsp;• <code>sin(angle * 100.0)</code></li>
          <li>💡 角度范围：-π 到 π（需要归一化到 0-1）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🌫️ 噪声效果（46-end）：</h3>
        <ul>
          <li><strong>随机函数 random()</strong>：</li>
          <li>&nbsp;&nbsp;• 伪随机数生成</li>
          <li>&nbsp;&nbsp;• 基于 UV 坐标的随机效果</li>
          <li><strong>噪声函数 noise()</strong>：</li>
          <li>&nbsp;&nbsp;• 平滑的随机值</li>
          <li>&nbsp;&nbsp;• 烟雾、云朵效果</li>
          <li><strong>Perlin 噪声 cnoise()</strong>：</li>
          <li>&nbsp;&nbsp;• 经典 Perlin 噪声算法</li>
          <li>&nbsp;&nbsp;• 自然的地形、波纹效果</li>
          <li>&nbsp;&nbsp;• 结合 sin() 创建动态波纹</li>
          <li><strong>动态噪声</strong>：</li>
          <li>&nbsp;&nbsp;• <code>cnoise(vUv * 10.0 + uTime)</code></li>
          <li>&nbsp;&nbsp;• 流动的云、水波纹</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎨 颜色混合技术：</h3>
        <ul>
          <li><strong>mix(a, b, t)</strong>：线性插值</li>
          <li>&nbsp;&nbsp;• t = 0：返回 a</li>
          <li>&nbsp;&nbsp;• t = 1：返回 b</li>
          <li>&nbsp;&nbsp;• 0 &lt; t &lt; 1：返回 a 和 b 的混合</li>
          <li><strong>示例</strong>：</li>
          <li>&nbsp;&nbsp;• <code>vec3 mixColor = mix(color1, color2, strength)</code></li>
          <li>&nbsp;&nbsp;• strength 可以是噪声值、距离、UV 坐标等</li>
          <li>💡 本例混合了紫色、绿色和 UV 颜色</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔧 Uniform 变量：</h3>
        <ul>
          <li><strong>uTime</strong>：时间变量，用于动画</li>
          <li><strong>uFrequency</strong>：波浪频率，控制波纹数量</li>
          <li><strong>uScale</strong>：波浪幅度，控制噪声强度</li>
          <li><strong>uColor</strong>：颜色值</li>
          <li><strong>uTexture</strong>：纹理采样器</li>
          <li>💡 Uniform 从 JavaScript 传入，所有像素共享相同值</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📊 Varying 变量：</h3>
        <ul>
          <li><strong>vUv</strong>：UV 纹理坐标</li>
          <li>&nbsp;&nbsp;• 从顶点着色器传递到片元着色器</li>
          <li>&nbsp;&nbsp;• 范围 0.0 到 1.0</li>
          <li>&nbsp;&nbsp;• vUv.x：水平坐标（左 0 → 右 1）</li>
          <li>&nbsp;&nbsp;• vUv.y：垂直坐标（下 0 → 上 1）</li>
          <li>💡 GPU 会自动插值，每个像素获得不同的 vUv 值</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚡ 常用 GLSL 函数：</h3>
        <ul>
          <li><strong>数学函数</strong>：sin, cos, tan, atan, pow, sqrt, abs</li>
          <li><strong>插值函数</strong>：mix, smoothstep, step</li>
          <li><strong>几何函数</strong>：length, distance, dot, cross, normalize</li>
          <li><strong>取整函数</strong>：floor, ceil, fract, mod</li>
          <li><strong>范围函数</strong>：min, max, clamp</li>
          <li>💡 所有函数都在 GPU 上并行执行，性能极高</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 精度说明：</h3>
        <ul>
          <li><strong>highp</strong>：高精度（-2^16 到 2^16）</li>
          <li>&nbsp;&nbsp;• 最精确，但性能开销大</li>
          <li><strong>mediump</strong>：中精度（-2^10 到 2^10）</li>
          <li>&nbsp;&nbsp;• 平衡精度和性能</li>
          <li><strong>lowp</strong>：低精度（-2^8 到 2^8）</li>
          <li>&nbsp;&nbsp;• 最快，适合颜色值</li>
          <li>💡 本例使用 lowp，适合大多数视觉效果</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 学习建议：</h3>
        <ul>
          <li>📖 逐个取消注释效果代码，观察视觉变化</li>
          <li>📖 修改参数值，理解每个函数的作用</li>
          <li>📖 组合多个效果，创造新的视觉效果</li>
          <li>📖 使用 GUI 实时调整参数</li>
          <li>
            📖 参考 <a
              href="https://thebookofshaders.com/"
              target="_blank"
            >The Book of Shaders</a>
          </li>
          <li>
            📖 访问 <a
              href="https://www.shadertoy.com/"
              target="_blank"
            >Shadertoy</a> 获取灵感
          </li>
          <li>💡 着色器编程需要大量练习，建议每天尝试一个新效果</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎨 实际应用场景：</h3>
        <ul>
          <li><strong>水面效果</strong>：波浪 + 噪声 + 反射</li>
          <li><strong>火焰效果</strong>：噪声 + 渐变 + 动画</li>
          <li><strong>粒子系统</strong>：随机 + 噪声 + 时间</li>
          <li><strong>全息效果</strong>：干涉条纹 + 透明度</li>
          <li><strong>雷达扫描</strong>：角度 + 旋转 + 发光</li>
          <li><strong>地形生成</strong>：Perlin 噪声 + 高度图</li>
          <li><strong>后期处理</strong>：屏幕空间效果、故障艺术</li>
          <li>💡 着色器是实现高性能视觉效果的核心技术</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚡ 性能优化技巧：</h3>
        <ul>
          <li>🔹 减少条件分支（if/else），使用 step()、mix() 替代</li>
          <li>🔹 避免在片元着色器中进行复杂计算</li>
          <li>🔹 尽量在顶点着色器中计算，通过 varying 传递</li>
          <li>🔹 使用低精度（lowp）处理颜色值</li>
          <li>🔹 预计算常量，不要在 shader 中重复计算</li>
          <li>🔹 合理使用纹理采样，避免过多的 texture2D 调用</li>
          <li>💡 每个像素都会执行片元着色器，优化至关重要</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>🎛️ 调试技巧：</p>
        <p>• <strong>可视化变量</strong>：<code>gl_FragColor = vec4(value, value, value, 1.0)</code></p>
        <p>• <strong>归一化颜色</strong>：确保值在 0.0-1.0 范围</p>
        <p>• <strong>分步测试</strong>：先实现基础效果，再添加复杂度</p>
        <p>• <strong>使用 GUI</strong>：实时调整 uniform 参数</p>
        <p>• <strong>查看控制台</strong>：编译错误会显示行号</p>
      </div>
    </template>

    <!-- Three.js 容器 -->
    <div
      ref="containerRef"
      class="three-container"
    />
  </PageLayout>
</template>

<style scoped>
  .three-container {
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 0;
  }
</style>
