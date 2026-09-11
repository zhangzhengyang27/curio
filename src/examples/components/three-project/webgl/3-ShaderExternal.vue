<script setup lang="ts">
  import { shallowRef, onMounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 导入外部 GLSL 着色器文件
  import basicVertexShader from "./shader/basic/vertex.glsl?raw"
  import basicFragmentShader from "./shader/basic/fragment.glsl?raw"

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
   * 创建着色器材质（使用外部 GLSL 文件）
   */
  const createShaderMaterial = () => {
    shaderMaterial = new THREE.ShaderMaterial({
      // 顶点着色器（从外部文件导入）
      vertexShader: basicVertexShader,
      // 片元着色器（从外部文件导入）
      fragmentShader: basicFragmentShader
    })

    console.log("顶点着色器代码：", basicVertexShader)
    console.log("片元着色器代码：", basicFragmentShader)
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
    title="📦 外部 GLSL 文件"
    description="使用外部 GLSL 文件组织着色器代码"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>📦 <strong>外部 GLSL 文件</strong> - 将着色器代码独立为 .glsl 文件</li>
          <li>🎨 <strong>着色器模块化</strong> - 更好的代码组织和复用</li>
          <li>📐 <strong>顶点着色器</strong> - vertex.glsl 文件</li>
          <li>🎨 <strong>片元着色器</strong> - fragment.glsl 文件</li>
          <li>📊 <strong>高分辨率网格</strong> - 64x64 分段的平面</li>
          <li>🔧 <strong>Vite 支持</strong> - 使用 ?raw 后缀导入为字符串</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 为什么使用外部 GLSL 文件？</h3>
        <ul>
          <li><strong>代码分离</strong>：将 GLSL 代码从 JavaScript 中分离，结构更清晰</li>
          <li><strong>语法高亮</strong>：.glsl 文件可以获得编辑器的语法高亮支持</li>
          <li><strong>代码复用</strong>：着色器代码可以在多个地方复用</li>
          <li><strong>便于维护</strong>：复杂的着色器代码独立管理更方便</li>
          <li><strong>团队协作</strong>：着色器工程师和前端工程师可以分工协作</li>
          <li>💡 推荐用于复杂的着色器项目</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 导入 GLSL 文件（Vite）：</p>
        <p><code>import vertexShader from './shader/vertex.glsl?raw'</code></p>
        <p><code>import fragmentShader from './fragment.glsl?raw'</code></p>
        <p><code /></p>
        <p><code>const material = new THREE.ShaderMaterial({</code></p>
        <p><code>&nbsp;&nbsp;vertexShader, // 使用导入的字符串</code></p>
        <p><code>&nbsp;&nbsp;fragmentShader</code></p>
        <p><code>})</code></p>
        <p><code /></p>
        <p>⚠️ 注意：必须使用 <strong>?raw</strong> 后缀将文件作为字符串导入</p>
      </div>

      <div class="info-section">
        <h3>🔧 Vite 配置说明：</h3>
        <ul>
          <li><strong>?raw 后缀</strong>：告诉 Vite 将文件内容作为字符串导入</li>
          <li><strong>不需要额外配置</strong>：Vite 原生支持 ?raw 导入</li>
          <li><strong>其他构建工具</strong>：</li>
          <li>&nbsp;&nbsp;• <strong>Webpack</strong>：需要配置 raw-loader</li>
          <li>&nbsp;&nbsp;• <strong>Rollup</strong>：需要 @rollup/plugin-string</li>
          <li>💡 Vite 开箱即用，无需额外配置</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 实际应用场景：</h3>
        <ul>
          <li><strong>简单着色器</strong>：内联字符串即可（如前一个示例）</li>
          <li><strong>复杂着色器</strong>：使用外部文件（推荐）</li>
          <li><strong>着色器库</strong>：创建可复用的着色器模块</li>
          <li><strong>团队项目</strong>：便于分工和版本控制</li>
          <li>💡 根据项目复杂度选择合适的方式</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔍 调试技巧：</h3>
        <ul>
          <li>📖 使用 <code>console.log</code> 查看导入的着色器代码</li>
          <li>📖 检查 GLSL 语法错误（浏览器控制台会显示）</li>
          <li>
            📖 使用 <a
              href="https://www.shadertoy.com/"
              target="_blank"
            >Shadertoy</a> 在线测试着色器
          </li>
          <li>
            📖 使用 <a
              href="https://thebookofshaders.com/edit.php"
              target="_blank"
            >The Book of Shaders Editor</a>
          </li>
          <li>💡 着色器编译错误会在控制台详细显示</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📚 GLSL 编辑器插件推荐：</h3>
        <ul>
          <li><strong>VS Code</strong>：</li>
          <li>&nbsp;&nbsp;• <strong>Shader languages support for VS Code</strong></li>
          <li>&nbsp;&nbsp;• <strong>GLSL Lint</strong> - 语法检查</li>
          <li>&nbsp;&nbsp;• <strong>WebGL GLSL Editor</strong> - 语法高亮</li>
          <li><strong>其他编辑器</strong>：</li>
          <li>&nbsp;&nbsp;• <strong>WebStorm</strong>：内置 GLSL 支持</li>
          <li>&nbsp;&nbsp;• <strong>Sublime Text</strong>：OpenGL Shading Language 插件</li>
          <li>💡 安装插件后可获得代码补全和错误提示</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 下一步学习：</h3>
        <ul>
          <li>🔹 <strong>Uniform 变量</strong>：从 JavaScript 向着色器传递参数</li>
          <li>🔹 <strong>Varying 变量</strong>：顶点着色器向片元着色器传递数据</li>
          <li>🔹 <strong>纹理采样</strong>：在着色器中使用图片纹理</li>
          <li>🔹 <strong>着色器模块化</strong>：使用 #include 或字符串拼接</li>
          <li>🔹 <strong>复杂效果</strong>：波浪、噪声、粒子等</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚡ 性能优化建议：</h3>
        <ul>
          <li>📖 避免在片元着色器中进行复杂计算</li>
          <li>📖 尽量在顶点着色器中计算，通过 varying 传递</li>
          <li>📖 使用 uniform 缓存不变的值</li>
          <li>📖 避免在着色器中使用条件分支（if/else）</li>
          <li>💡 片元着色器执行次数 >> 顶点着色器</li>
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

  code {
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 6px;
    border-radius: 3px;
    font-family: "Courier New", monospace;
    font-size: 11px;
    color: #42b983;
  }

  pre {
    background: rgba(255, 255, 255, 0.1);
    padding: 12px;
    border-radius: 6px;
    font-family: "Courier New", monospace;
    font-size: 12px;
    color: #42b983;
    overflow-x: auto;
  }

  a {
    color: #42b983;
    text-decoration: underline;
  }

  a:hover {
    color: #35495e;
  }
</style>
