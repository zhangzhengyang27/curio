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
    cameraPosition: { x: 0, y: 0, z: 3.5 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 1.5,
      maxDistance: 10
    },
    showAxesHelper: false,
    showGridHelper: false
  })

  // GUI 和对象引用
  let gui: GUI | null = null
  let shaderMesh: THREE.Mesh | null = null
  let shaderMaterial: THREE.ShaderMaterial | null = null

  /**
   * 简单的 2D 噪声函数（GLSL）
   * 基于正弦函数的伪噪声
   */
  const noiseGLSL = `
    // 简单的伪随机函数
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    // 2D 噪声函数
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      // 平滑插值
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    // 分形布朗运动（FBM）- 多层噪声叠加
    float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 5; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }
  `

  /**
   * 程序化棋盘格 - 顶点着色器
   */
  const checkerboardVertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  /**
   * 程序化棋盘格 - 片元着色器
   */
  const checkerboardFragmentShader = `
    precision mediump float;
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform float uScale;
    varying vec2 vUv;

    void main() {
      // 将 UV 坐标缩放后取整，判断奇偶
      vec2 uv = vUv * uScale;
      // 添加轻微的时间偏移使棋盘格有动感
      float checker = mod(floor(uv.x + sin(uTime * 0.5) * 0.1) + floor(uv.y + cos(uTime * 0.3) * 0.1), 2.0);
      vec3 color = mix(uColor1, uColor2, checker);
      gl_FragColor = vec4(color, 1.0);
    }
  `

  /**
   * 程序化噪声 - 片元着色器
   */
  const noiseFragmentShader = `
    precision mediump float;
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform float uScale;
    varying vec2 vUv;

    ${noiseGLSL}

    void main() {
      vec2 uv = vUv * uScale;
      // 使用 FBM 生成有机纹理，随时间流动
      float n = fbm(uv + uTime * 0.2);
      vec3 color = mix(uColor1, uColor2, n);
      gl_FragColor = vec4(color, 1.0);
    }
  `

  /**
   * 程序化条纹 - 片元着色器
   */
  const stripeFragmentShader = `
    precision mediump float;
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform float uScale;
    uniform float uAngle;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      // 旋转 UV 坐标产生斜条纹
      float rad = uAngle;
      mat2 rot = mat2(cos(rad), -sin(rad), sin(rad), cos(rad));
      uv = rot * uv;
      uv *= uScale;
      // 使用 sin 产生平滑条纹
      float stripe = sin(uv.x * 6.28318 + uTime) * 0.5 + 0.5;
      // 使用 step 产生硬边条纹
      stripe = step(0.5, fract(stripe));
      vec3 color = mix(uColor1, uColor2, stripe);
      gl_FragColor = vec4(color, 1.0);
    }
  `

  /**
   * 程序化圆环 - 片元着色器
   */
  const ringFragmentShader = `
    precision mediump float;
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform float uScale;
    varying vec2 vUv;

    void main() {
      vec2 uv = (vUv - 0.5) * uScale;
      // 计算到中心的距离
      float dist = length(uv);
      // 产生同心圆
      float ring = sin(dist * 20.0 - uTime * 2.0) * 0.5 + 0.5;
      ring = step(0.5, ring);
      vec3 color = mix(uColor1, uColor2, ring);
      gl_FragColor = vec4(color, 1.0);
    }
  `

  /**
   * 创建场景
   */
  const createScene = () => {
    if (!scene.value) return

    // 设置场景背景
    scene.value.background = new THREE.Color(0x111111)

    // ShaderMaterial uniforms
    const uniforms = {
      uTime: { value: 0.0 },
      uColor1: { value: new THREE.Color(0x222222) },
      uColor2: { value: new THREE.Color(0x42b983) },
      uScale: { value: 10.0 },
      uAngle: { value: 0.0 }
    }

    // 创建 ShaderMaterial，默认使用棋盘格
    shaderMaterial = new THREE.ShaderMaterial({
      vertexShader: checkerboardVertexShader,
      fragmentShader: checkerboardFragmentShader,
      uniforms: {
        ...uniforms,
        uColor1: { value: new THREE.Color(0x222222) },
        uColor2: { value: new THREE.Color(0x42b983) }
      },
      side: THREE.DoubleSide
    })

    // 创建一个球体作为展示物体
    const geometry = new THREE.SphereGeometry(1.5, 64, 64)
    shaderMesh = new THREE.Mesh(geometry, shaderMaterial)
    scene.value.add(shaderMesh)

    // 添加环境光（ShaderMaterial 不受光照影响，但可以添加辅助几何体）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.value.add(ambientLight)

    console.log("着色器材质场景创建成功")
  }

  const fragmentShaders = {
    checkerboard: checkerboardFragmentShader,
    noise: noiseFragmentShader,
    stripe: stripeFragmentShader,
    ring: ringFragmentShader
  }

  /**
   * 切换着色器效果
   */
  const switchEffect = (effectName: keyof typeof fragmentShaders) => {
    if (!shaderMaterial || !shaderMesh) return

    // 保存当前的 uniform 值
    const _currentUniforms = {
      uTime: shaderMaterial.uniforms.uTime.value,
      uColor1: shaderMaterial.uniforms.uColor1.value.clone(),
      uColor2: shaderMaterial.uniforms.uColor2.value.clone(),
      uScale: shaderMaterial.uniforms.uScale.value,
      uAngle: shaderMaterial.uniforms.uAngle.value
    }

    // 重新设置 fragmentShader
    shaderMaterial.fragmentShader = fragmentShaders[effectName]
    shaderMaterial.needsUpdate = true

    console.log(`切换到 ${effectName} 效果`)
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    if (!shaderMaterial) return

    gui = new GUI()
    gui.title("着色器材质控制")

    const params = {
      effect: "checkerboard",
      speed: 1.0,
      scale: 10.0,
      angle: 0.0,
      color1: "#222222",
      color2: "#42b983"
    }

    // 效果切换
    const effectFolder = gui.addFolder("🎨 效果选择")
    effectFolder
      .add(params, "effect", ["checkerboard", "noise", "stripe", "ring"])
      .name("着色器效果")
      .onChange((_value) => {
        switchEffect(_value as keyof typeof fragmentShaders)
      })
    effectFolder.open()

    // 参数调节
    const paramFolder = gui.addFolder("⚙️ 参数调节")
    paramFolder
      .add(params, "speed", 0, 5, 0.1)
      .name("动画速度")
      .onChange(() => {
        // 速度在 animate 中使用
      })

    paramFolder
      .add(params, "scale", 1, 30, 0.5)
      .name("纹理缩放")
      .onChange((value) => {
        shaderMaterial!.uniforms.uScale.value = value
      })

    paramFolder
      .add(params, "angle", 0, 6.28, 0.05)
      .name("条纹角度")
      .onChange((value) => {
        shaderMaterial!.uniforms.uAngle.value = value
      })

    paramFolder.open()

    // 颜色控制
    const colorFolder = gui.addFolder("🎨 颜色控制")
    colorFolder
      .addColor(params, "color1")
      .name("颜色1")
      .onChange((value) => {
        shaderMaterial!.uniforms.uColor1.value.set(value)
      })

    colorFolder
      .addColor(params, "color2")
      .name("颜色2")
      .onChange((value) => {
        shaderMaterial!.uniforms.uColor2.value.set(value)
      })
    colorFolder.open()

    // 技术说明
    const infoFolder = gui.addFolder("📖 技术说明")
    const info = {
      ShaderMaterial: "自定义着色器材质，完全控制渲染",
      vertexShader: "顶点着色器：处理顶点位置",
      fragmentShader: "片元着色器：处理像素颜色",
      uniforms: "从 JS 传入着色器的变量",
      "gl_FragColor": "片元着色器输出的最终颜色",
      checkerboard: "棋盘格：floor + mod 判断奇偶",
      noise: "噪声：FBM 分形布朗运动",
      stripe: "条纹：sin + step + 旋转变换",
      ring: "圆环：length 距离 + sin 同心圆"
    }
    for (const [key, value] of Object.entries(info)) {
      const obj: Record<string, string> = {}
      obj[key] = value
      infoFolder.add(obj, key).name(key).listen().disable()
    }
    infoFolder.open()

    // 保存速度参数引用，用于 animate 回调
    gui.userData = { params }
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理着色器材质
    if (shaderMaterial) {
      shaderMaterial.dispose()
      shaderMaterial = null
    }
    shaderMesh = null

    // 清理 GUI
    gui?.destroy()
    gui = null

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    createScene()
    initGUI()

    // 启动动画循环，更新 uniform
    let time = 0
    startAnimation(() => {
      if (!shaderMaterial) return

      // 获取动画速度
      const speed = gui?.userData?.params?.speed || 1.0
      time += 0.016 * speed

      // 更新时间 uniform
      shaderMaterial.uniforms.uTime.value = time

      // 球体缓慢自转
      if (shaderMesh) {
        shaderMesh.rotation.y += 0.002
      }
    })
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🔮 着色器材质综合应用"
    description="ShaderMaterial 实现程序化棋盘格、噪声、条纹、圆环效果"
  >
    <template #content>
      <div class="info-section">
        <h3>🎨 四种程序化效果：</h3>
        <ul>
          <li><strong>棋盘格（Checkerboard）</strong>：floor + mod 判断奇偶格，带时间偏移动画</li>
          <li><strong>噪声（Noise）</strong>：FBM 分形布朗运动，多层噪声叠加产生有机纹理</li>
          <li><strong>条纹（Stripe）</strong>：sin + step + UV旋转，可调角度的硬边条纹</li>
          <li><strong>圆环（Ring）</strong>：length 距离计算 + sin 产生动态同心圆</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 ShaderMaterial 核心概念：</h3>
        <ul>
          <li><strong>vertexShader</strong>：顶点着色器，处理每个顶点的位置、UV等</li>
          <li><strong>fragmentShader</strong>：片元着色器，计算每个像素的最终颜色</li>
          <li><strong>uniforms</strong>：从 JavaScript 传入着色器的全局变量</li>
          <li><strong>varying</strong>：从顶点着色器传递到片元着色器的插值变量</li>
          <li><strong>gl_FragColor</strong>：片元着色器的输出颜色</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 ShaderMaterial 基本结构：</p>
        <p><code>const material = new THREE.ShaderMaterial({</code></p>
        <p><code>&nbsp;&nbsp;vertexShader: '...',  // 顶点着色器字符串</code></p>
        <p><code>&nbsp;&nbsp;fragmentShader: '...', // 片元着色器字符串</code></p>
        <p><code>&nbsp;&nbsp;uniforms: { uTime: { value: 0.0 } }</code></p>
        <p><code>})</code></p>
      </div>

      <div class="code-tip">
        <p>💡 GLSL 噪声函数关键：</p>
        <p><code>random(vec2) → fract(sin(dot())) 伪随机</code></p>
        <p><code>noise(vec2) → 平滑插值的2D噪声</code></p>
        <p><code>fbm(vec2) → 多层噪声叠加（分形布朗运动）</code></p>
      </div>

      <div class="controls-tip">
        <p>🎮 操作提示：</p>
        <ul>
          <li>🖱️ 左键拖动：旋转视角</li>
          <li>🖱️ 滚轮：缩放</li>
          <li>🎚️ <strong>效果选择</strong>：切换4种程序化效果</li>
          <li>🎚️ <strong>动画速度</strong>：控制纹理流动速度</li>
          <li>🎚️ <strong>纹理缩放</strong>：控制图案密度</li>
          <li>🎚️ <strong>条纹角度</strong>：旋转条纹方向（仅条纹模式）</li>
          <li>🎚️ <strong>颜色1/2</strong>：实时修改两种颜色</li>
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
</style>
