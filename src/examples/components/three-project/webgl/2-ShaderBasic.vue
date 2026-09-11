<script setup lang="ts">
  import { shallowRef, onMounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

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
  /**
   * 创建着色器材质
   */
  const createShaderMaterial = () => {
    shaderMaterial = new THREE.ShaderMaterial({
      // 顶点着色器
      vertexShader: `
        void main(){
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        }
      `,
      // 片元着色器
      fragmentShader: `
        void main(){
          gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
        }
      `
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
   * 初始化场景
   */
  const initScene = () => {
    if (!scene.value || !camera.value || !renderer.value) return

    // 设置渲染器背景为透明
    if (renderer.value) {
      renderer.value.setClearAlpha(0)
    }

    // 创建着色器材质
    createShaderMaterial()

    // 创建平面
    createFloor()

    // 启动动画循环
    startAnimation(animate)
  }

  /**
   * 动画循环
   */
  const animate = () => {

    // 这里可以添加基于时间的动画
    // 例如：更新 shader 的 uniform 值
  }

  /**
   * 清理资源
   */
  const cleanup = () => {
    // 清理材质
    if (shaderMaterial) {
      shaderMaterial.dispose()
    }

    // 清理几何体
    if (floor) {
      floor.geometry.dispose()
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
  onMounted(() => {
    return () => {
      cleanup()
    }
  })
</script>

<template>
  <PageLayout
    title="🎨 认识 Shader"
    description="Three.js 着色器基础 - ShaderMaterial 的使用"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🎨 <strong>着色器材质</strong> - 使用 ShaderMaterial 创建自定义材质</li>
          <li>📐 <strong>顶点着色器</strong> - 处理顶点位置变换</li>
          <li>🎨 <strong>片元着色器</strong> - 设置像素颜色（黄色）</li>
          <li>📊 <strong>高分辨率网格</strong> - 64x64 分段的平面</li>
          <li>🎯 <strong>矩阵变换</strong> - projectionMatrix * viewMatrix * modelMatrix</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 什么是 Shader（着色器）？</h3>
        <ul>
          <li><strong>定义</strong>：在 GPU 上运行的小程序，用于计算图形的渲染效果</li>
          <li><strong>语言</strong>：使用 GLSL（OpenGL Shading Language）编写</li>
          <li><strong>两种类型</strong>：</li>
          <li>&nbsp;&nbsp;• <strong>顶点着色器（Vertex Shader）</strong>：处理每个顶点的位置</li>
          <li>&nbsp;&nbsp;• <strong>片元着色器（Fragment Shader）</strong>：处理每个像素的颜色</li>
          <li>💡 Three.js 封装了常见的着色器，但我们也可以自定义</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>const shaderMaterial = new THREE.ShaderMaterial({</code></p>
        <p><code>&nbsp;&nbsp;vertexShader: `...`, // 顶点着色器代码</code></p>
        <p><code>&nbsp;&nbsp;fragmentShader: `...` // 片元着色器代码</code></p>
        <p><code>})</code></p>
      </div>

      <div class="info-section">
        <h3>🔧 顶点着色器（Vertex Shader）：</h3>
        <ul>
          <li><strong>作用</strong>：处理每个顶点的位置变换</li>
          <li><strong>输入</strong>：position（顶点位置）、normal（法线）、uv（纹理坐标）等</li>
          <li><strong>输出</strong>：gl_Position（裁剪空间坐标）</li>
          <li><strong>矩阵变换</strong>：</li>
          <li>&nbsp;&nbsp;• <strong>modelMatrix</strong>：模型矩阵（本地空间 → 世界空间）</li>
          <li>&nbsp;&nbsp;• <strong>viewMatrix</strong>：视图矩阵（世界空间 → 观察空间）</li>
          <li>&nbsp;&nbsp;• <strong>projectionMatrix</strong>：投影矩阵（观察空间 → 裁剪空间）</li>
          <li>💡 完整变换：projectionMatrix * viewMatrix * modelMatrix * position</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎨 片元着色器（Fragment Shader）：</h3>
        <ul>
          <li><strong>作用</strong>：计算每个像素的颜色</li>
          <li><strong>输出</strong>：gl_FragColor（RGBA 颜色值）</li>
          <li><strong>颜色格式</strong>：vec4(R, G, B, A) 范围 0.0-1.0</li>
          <li><strong>本例颜色</strong>：vec4(1.0, 1.0, 0.0, 1.0) = 黄色</li>
          <li>&nbsp;&nbsp;• R = 1.0（红色通道满）</li>
          <li>&nbsp;&nbsp;• G = 1.0（绿色通道满）</li>
          <li>&nbsp;&nbsp;• B = 0.0（蓝色通道空）</li>
          <li>&nbsp;&nbsp;• A = 1.0（不透明）</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📐 PlaneGeometry 参数：</h3>
        <ul>
          <li><strong>width</strong>：平面宽度（1）</li>
          <li><strong>height</strong>：平面高度（1）</li>
          <li><strong>widthSegments</strong>：宽度分段数（64）</li>
          <li><strong>heightSegments</strong>：高度分段数（64）</li>
          <li>💡 分段数越多，顶点越多，可以实现更复杂的形变效果</li>
          <li>💡 本例 64x64 = 4096 个顶点，每个都会经过顶点着色器处理</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 GLSL 基础语法：</h3>
        <ul>
          <li><strong>数据类型</strong>：</li>
          <li>&nbsp;&nbsp;• <strong>float</strong>：浮点数（如 1.0）</li>
          <li>&nbsp;&nbsp;• <strong>vec2</strong>：2D 向量（如 vec2(1.0, 2.0)）</li>
          <li>&nbsp;&nbsp;• <strong>vec3</strong>：3D 向量（如 vec3(1.0, 2.0, 3.0)）</li>
          <li>&nbsp;&nbsp;• <strong>vec4</strong>：4D 向量（如 vec4(1.0, 2.0, 3.0, 4.0)）</li>
          <li>&nbsp;&nbsp;• <strong>mat4</strong>：4x4 矩阵</li>
          <li><strong>注意</strong>：GLSL 中数字必须带小数点，如 1.0 而不是 1</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔄 Three.js 内置变量：</h3>
        <ul>
          <li><strong>顶点着色器</strong>：</li>
          <li>&nbsp;&nbsp;• <strong>position</strong>：顶点位置（vec3）</li>
          <li>&nbsp;&nbsp;• <strong>normal</strong>：顶点法线（vec3）</li>
          <li>&nbsp;&nbsp;• <strong>uv</strong>：纹理坐标（vec2）</li>
          <li>&nbsp;&nbsp;• <strong>modelMatrix</strong>：模型矩阵（mat4）</li>
          <li>&nbsp;&nbsp;• <strong>viewMatrix</strong>：视图矩阵（mat4）</li>
          <li>&nbsp;&nbsp;• <strong>projectionMatrix</strong>：投影矩阵（mat4）</li>
          <li><strong>片元着色器</strong>：</li>
          <li>&nbsp;&nbsp;• <strong>gl_FragCoord</strong>：像素坐标（vec4）</li>
          <li>💡 这些变量由 Three.js 自动传入</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚡ ShaderMaterial vs 其他材质：</h3>
        <ul>
          <li><strong>MeshBasicMaterial</strong>：简单纯色，无光照计算</li>
          <li><strong>MeshStandardMaterial</strong>：PBR 材质，真实感强</li>
          <li><strong>ShaderMaterial</strong>：完全自定义，灵活度最高</li>
          <li><strong>优势</strong>：可以实现任何视觉效果</li>
          <li><strong>劣势</strong>：需要手动编写着色器代码</li>
          <li>💡 适合实现特殊效果，如水面、火焰、粒子等</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 学习路径：</h3>
        <ul>
          <li>📖 <strong>第一步</strong>：理解顶点着色器和片元着色器的分工</li>
          <li>📖 <strong>第二步</strong>：学习 GLSL 基础语法（数据类型、运算符、函数）</li>
          <li>📖 <strong>第三步</strong>：掌握矩阵变换（模型、视图、投影矩阵）</li>
          <li>📖 <strong>第四步</strong>：学习 uniform、attribute、varying 变量</li>
          <li>📖 <strong>第五步</strong>：实战练习（波浪、渐变、噪声等效果）</li>
          <li>
            💡 建议配合 <a
              href="https://thebookofshaders.com/"
              target="_blank"
            >The Book of Shaders</a> 学习
          </li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎨 下一步学习：</h3>
        <ul>
          <li>🔹 <strong>uniform</strong>：从 JavaScript 向着色器传递参数</li>
          <li>🔹 <strong>varying</strong>：从顶点着色器向片元着色器传递数据</li>
          <li>🔹 <strong>attribute</strong>：自定义顶点属性</li>
          <li>🔹 <strong>纹理采样</strong>：在着色器中使用纹理</li>
          <li>🔹 <strong>噪声函数</strong>：生成随机效果</li>
          <li>🔹 <strong>波浪效果</strong>：使用 sin/cos 函数</li>
        </ul>
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
