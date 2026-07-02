<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // Canvas 容器引用
  const canvasRef = shallowRef<HTMLCanvasElement | null>(null)

  // WebGL 上下文和资源引用
  let gl: WebGLRenderingContext | null = null
  let program: WebGLProgram | null = null
  let vShader: WebGLShader | null = null
  let fShader: WebGLShader | null = null
  let pBuffer: WebGLBuffer | null = null

  /**
   * 初始化 WebGL 上下文
   */
  const initWebGL = () => {
    if (!canvasRef.value) return

    // 设置 canvas 的宽高
    canvasRef.value.width = window.innerWidth
    canvasRef.value.height = window.innerHeight

    // 获取 webgl 上下文
    gl = canvasRef.value.getContext("webgl")

    if (!gl) {
      console.error("浏览器不支持 WebGL")
      return
    }
  }

  /**
   * 创建着色器
   */
  const createShaders = () => {
    if (!gl) return
    // 创建顶点着色器
    vShader = gl.createShader(gl.VERTEX_SHADER)
    if (!vShader) return

    // 顶点着色器源码
    gl.shaderSource(
      vShader,
      `
        attribute vec4 v_position;
        void main(){
          gl_Position = v_position;
        }
      `
    )
    // 编译顶点着色器
    gl.compileShader(vShader)

    // 创建片元着色器
    fShader = gl.createShader(gl.FRAGMENT_SHADER)
    if (!fShader) return

    // 片元着色器源码
    gl.shaderSource(
      fShader,
      `
        void main(){
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
      `
    )

    // 编译片元着色器
    gl.compileShader(fShader)
  }

  /**
   * 创建着色器程序
   */
  const createProgram = () => {
    if (!gl || !vShader || !fShader) return
    // 创建着色器程序链接顶点着色器和片元着色器
    program = gl.createProgram()
    if (!program) return

    // 添加顶点着色器
    gl.attachShader(program, vShader)

    // 添加片元着色器
    gl.attachShader(program, fShader)

    // 链接着色器程序
    gl.linkProgram(program)

    // 使用着色器程序
    gl.useProgram(program)
  }

  /**
   * 创建顶点数据并绘制
   */
  const setupVertexData = () => {
    if (!gl || !program) return
    // 获取 attribute 变量位置
    const position = gl.getAttribLocation(program, "v_position")

    // 创建缓冲区
    pBuffer = gl.createBuffer()

    // 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer)

    // 设置顶点数据（三角形的三个顶点）
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]),
      gl.STATIC_DRAW // 静态绘制
    )

    // 将顶点数据提供给 attribute 变量
    gl.vertexAttribPointer(
      position, // 告诉 attribute 变量从哪里获取数据
      2, // 每次迭代提供 2 个单位的数据
      gl.FLOAT, // 每个单位的数据类型是 32 位浮点型
      false, // 不需要归一化数据
      0, // 步长为 0
      0 // 从缓冲区的哪个位置开始读取数据
    )

    // 开启 attribute 变量
    gl.enableVertexAttribArray(position)

    // 绘制三角形
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  /**
   * 初始化场景
   */
  const initScene = () => {
    // 初始化 WebGL
    initWebGL()

    if (!gl) return

    // 创建着色器
    createShaders()

    // 创建着色器程序
    createProgram()

    // 设置顶点数据并绘制
    setupVertexData()
  }

  /**
   * 清理资源
   */
  const cleanup = () => {
    if (gl && pBuffer) {
      gl.deleteBuffer(pBuffer)
    }

    if (gl && program) {
      if (vShader) {
        gl.detachShader(program, vShader)
        gl.deleteShader(vShader)
      }
      if (fShader) {
        gl.detachShader(program, fShader)
        gl.deleteShader(fShader)
      }
      gl.deleteProgram(program)
    }

    // 清空引用
    gl = null
    program = null
    vShader = null
    fShader = null
    pBuffer = null
  }

  /**
   * 监听窗口大小变化
   */
  const handleResize = () => {
    if (!canvasRef.value || !gl) return

    // 更新 canvas 尺寸
    canvasRef.value.width = window.innerWidth
    canvasRef.value.height = window.innerHeight

    // 更新视口
    gl.viewport(0, 0, canvasRef.value.width, canvasRef.value.height)

    // 重新绘制
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  // 组件挂载后初始化
  onMounted(() => {
    initScene()
    window.addEventListener("resize", handleResize)
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    window.removeEventListener("resize", handleResize)
    cleanup()
  })
</script>

<template>
  <PageLayout
    title="🔺 WebGL 基础三角形"
    description="原生 WebGL 绘制红色三角形 - 顶点着色器与片元着色器"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🎨 <strong>原生 WebGL</strong> - 不使用 Three.js 框架</li>
          <li>🔺 <strong>绘制三角形</strong> - WebGL 的 Hello World</li>
          <li>📐 <strong>顶点着色器</strong> - 处理顶点位置变换</li>
          <li>🎨 <strong>片元着色器</strong> - 设置像素颜色（红色）</li>
          <li>📊 <strong>缓冲区</strong> - 使用 Float32Array 传递顶点数据</li>
          <li>🔄 <strong>响应式</strong> - 监听窗口大小变化</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 什么是 WebGL？</h3>
        <ul>
          <li><strong>定义</strong>：基于 OpenGL ES 的 JavaScript API，用于在浏览器中渲染 2D/3D 图形</li>
          <li><strong>运行环境</strong>：在 GPU 上运行，性能强大</li>
          <li><strong>着色器语言</strong>：使用 GLSL（OpenGL Shading Language）</li>
          <li><strong>Three.js 关系</strong>：Three.js 是基于 WebGL 的高级封装库</li>
          <li>💡 本例展示了最基础的 WebGL 绘图流程</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>// 1. 创建顶点着色器</code></p>
        <p><code>const vShader = gl.createShader(gl.VERTEX_SHADER)</code></p>
        <p><code>gl.shaderSource(vShader, glslCode)</code></p>
        <p><code>gl.compileShader(vShader)</code></p>
        <p><code /></p>
        <p><code>// 2. 创建片元着色器</code></p>
        <p><code>const fShader = gl.createShader(gl.FRAGMENT_SHADER)</code></p>
        <p><code /></p>
        <p><code>// 3. 创建着色器程序</code></p>
        <p><code>const program = gl.createProgram()</code></p>
        <p><code>gl.attachShader(program, vShader)</code></p>
        <p><code>gl.attachShader(program, fShader)</code></p>
        <p><code>gl.linkProgram(program)</code></p>
        <p><code /></p>
        <p><code>// 4. 设置顶点数据</code></p>
        <p><code>gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)</code></p>
        <p><code /></p>
        <p><code>// 5. 绘制</code></p>
        <p><code>gl.drawArrays(gl.TRIANGLES, 0, 3)</code></p>
      </div>

      <div class="info-section">
        <h3>🔧 顶点着色器（Vertex Shader）：</h3>
        <ul>
          <li><strong>作用</strong>：处理每个顶点的位置变换</li>
          <li><strong>输入</strong>：attribute 变量（顶点属性）</li>
          <li><strong>输出</strong>：gl_Position（裁剪空间坐标）</li>
          <li><strong>执行次数</strong>：每个顶点执行一次</li>
          <li>💡 本例中三个顶点，执行 3 次</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎨 片元着色器（Fragment Shader）：</h3>
        <ul>
          <li><strong>作用</strong>：计算每个像素的颜色</li>
          <li><strong>输出</strong>：gl_FragColor（RGBA 颜色值）</li>
          <li><strong>执行次数</strong>：每个像素执行一次</li>
          <li><strong>颜色格式</strong>：vec4(R, G, B, A) 范围 0.0-1.0</li>
          <li><strong>本例颜色</strong>：vec4(1.0, 0.0, 0.0, 1.0) = 红色</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📐 坐标系统：</h3>
        <ul>
          <li><strong>WebGL 坐标</strong>：范围 -1.0 到 1.0</li>
          <li><strong>中心点</strong>：(0, 0) 在屏幕中央</li>
          <li><strong>X 轴</strong>：-1（左）到 1（右）</li>
          <li><strong>Y 轴</strong>：-1（下）到 1（上）</li>
          <li><strong>本例顶点</strong>：</li>
          <li>&nbsp;&nbsp;• (0.0, 0.5) - 顶部中间</li>
          <li>&nbsp;&nbsp;• (-0.5, -0.5) - 左下角</li>
          <li>&nbsp;&nbsp;• (0.5, -0.5) - 右下角</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔄 WebGL 渲染流程：</h3>
        <ul>
          <li><strong>1. 创建着色器</strong> - createShader() 创建顶点/片元着色器</li>
          <li><strong>2. 编译着色器</strong> - shaderSource() + compileShader()</li>
          <li><strong>3. 创建程序</strong> - createProgram() 链接两个着色器</li>
          <li><strong>4. 准备数据</strong> - 创建缓冲区，上传顶点数据</li>
          <li><strong>5. 配置属性</strong> - vertexAttribPointer() 告诉 GPU 如何读取数据</li>
          <li><strong>6. 绘制</strong> - drawArrays() 执行渲染</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📊 Buffer 缓冲区：</h3>
        <ul>
          <li><strong>createBuffer()</strong>：创建缓冲区对象</li>
          <li><strong>bindBuffer()</strong>：绑定缓冲区到目标</li>
          <li><strong>bufferData()</strong>：将数据上传到 GPU</li>
          <li><strong>Float32Array</strong>：32 位浮点数组，GPU 可直接使用</li>
          <li><strong>STATIC_DRAW</strong>：数据不会频繁改变</li>
          <li>💡 数据从 CPU 内存传输到 GPU 内存</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 绘制模式（gl.drawArrays）：</h3>
        <ul>
          <li><strong>TRIANGLES</strong>：每 3 个顶点绘制一个三角形</li>
          <li><strong>TRIANGLE_STRIP</strong>：三角形带，共享顶点</li>
          <li><strong>TRIANGLE_FAN</strong>：三角形扇，从第一个顶点扇形展开</li>
          <li><strong>LINES</strong>：每 2 个顶点绘制一条线</li>
          <li><strong>POINTS</strong>：绘制点</li>
          <li>💡 本例使用 TRIANGLES，最基础的模式</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 学习建议：</h3>
        <ul>
          <li>📖 理解顶点着色器和片元着色器的分工</li>
          <li>📖 熟悉 WebGL 坐标系（-1 到 1）</li>
          <li>📖 掌握缓冲区的创建和数据传递</li>
          <li>📖 学习 GLSL 着色器语言基础</li>
          <li>💡 这是 WebGL 的基础，Three.js 也是基于这些原理</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚡ Three.js vs 原生 WebGL：</h3>
        <ul>
          <li><strong>WebGL</strong>：底层 API，需要手动管理所有细节</li>
          <li><strong>Three.js</strong>：高级封装，自动处理着色器、矩阵变换等</li>
          <li><strong>学习顺序</strong>：先学 Three.js，再深入 WebGL</li>
          <li><strong>实际开发</strong>：大多数场景使用 Three.js 即可</li>
          <li>💡 了解 WebGL 原理有助于理解 Three.js</li>
        </ul>
      </div>
    </template>

    <!-- WebGL Canvas 容器 -->
    <canvas ref="canvasRef" />
  </PageLayout>
</template>

<style scoped>
  canvas {
    width: 100vw;
    height: 100vh;
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 0;
  }
</style>
