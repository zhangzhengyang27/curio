<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"

  // 着色器效果配置
  const shaderEffects = [
    { id: 1, name: "UV 渐变", code: "vec4(vUv, 0.0, 1.0)" },
    { id: 2, name: "UV 彩色", code: "vec4(vUv, 1.0, 1.0)" },
    { id: 3, name: "左到右渐变", code: "vec4(vec3(vUv.x), 1.0)" },
    { id: 4, name: "下到上渐变", code: "vec4(vec3(vUv.y), 1.0)" },
    { id: 5, name: "上到下渐变", code: "vec4(vec3(1.0-vUv.y), 1.0)" },
    { id: 6, name: "短范围渐变", code: "vec4(vec3(vUv.y * 10.0), 1.0)" },
    { id: 7, name: "取模重复", code: "vec4(vec3(mod(vUv.y * 10.0, 1.0)), 1.0)" },
    { id: 8, name: "条纹效果", code: "vec4(vec3(step(0.5, mod(vUv.y * 10.0, 1.0))), 1.0)" },
    { id: 9, name: "细条纹", code: "vec4(vec3(step(0.8, mod(vUv.y * 10.0, 1.0))), 1.0)" },
    { id: 10, name: "垂直条纹", code: "vec4(vec3(step(0.8, mod(vUv.x * 10.0, 1.0))), 1.0)" },
    { id: 11, name: "十字条纹", code: "vec4(vec3(step(0.8, mod(vUv.x * 10.0, 1.0)) + step(0.8, mod(vUv.y * 10.0, 1.0))), 1.0)" },
    { id: 12, name: "网格", code: "vec4(vec3(step(0.8, mod(vUv.x * 10.0, 1.0)) * step(0.8, mod(vUv.y * 10.0, 1.0))), 1.0)" },
    { id: 13, name: "方块阵列", code: "vec4(vec3(step(0.2, mod(vUv.x * 10.0, 1.0)) * step(0.2, mod(vUv.y * 10.0, 1.0))), 1.0)" },
    { id: 16, name: "中心渐变", code: "vec4(vec3(abs(vUv.x - 0.5)), 1.0)" },
    { id: 17, name: "菱形渐变", code: "vec4(vec3(min(abs(vUv.x - 0.5), abs(vUv.y - 0.5))), 1.0)" },
    { id: 18, name: "正方形渐变", code: "vec4(vec3(max(abs(vUv.x - 0.5), abs(vUv.y - 0.5))), 1.0)" },
    { id: 19, name: "方框", code: "vec4(vec3(step(0.2, max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)))), 1.0)" },
    { id: 20, name: "小正方形", code: "vec4(vec3(1.0 - step(0.2, max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)))), 1.0)" },
    { id: 21, name: "阶梯渐变", code: "vec4(vec3(floor(vUv.x*10.0)/10.0), 1.0)" },
    { id: 22, name: "棋盘渐变", code: "vec4(vec3(floor(vUv.x*10.0)/10.0*floor(vUv.y*10.0)/10.0), 1.0)" },
    { id: 25, name: "径向渐变", code: "vec4(vec3(length(vUv)), 1.0)" },
    { id: 26, name: "圆形渐变", code: "vec4(vec3(1.0 - distance(vUv,vec2(0.5,0.5))), 1.0)" },
    { id: 31, name: "实心圆", code: "vec4(vec3(1.0 - step(0.5, distance(vUv,vec2(0.5))+0.25)), 1.0)" },
    { id: 34, name: "渐变圆环", code: "vec4(vec3(abs(distance(vUv,vec2(0.5))-0.25)), 1.0)" },
    { id: 36, name: "圆环", code: "vec4(vec3(1.0 - step(0.1, abs(distance(vUv,vec2(0.5))-0.25))), 1.0)" }
  ]

  // Canvas 引用数组 (使用 2D canvas)
  const canvasRefs = ref<HTMLCanvasElement[]>([])

  //  WebGL 对象 (共享)
  let scene: THREE.Scene | null = null
  let camera: THREE.OrthographicCamera | null = null
  let renderer: THREE.WebGLRenderer | null = null
  let animationId: number | null = null
  let gui: GUI | null = null

  // 所有材质
  const materials: THREE.ShaderMaterial[] = []

  // GUI 参数
  const params = {
    autoRotate: false
  }

  /**
   * 创建着色器材质
   */
  const createShaderMaterial = (effectConfig: { id: number; name: string; code: string }) => {
    const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`

    const fragmentShader = `
precision mediump float;
varying vec2 vUv;
uniform float uTime;

void main() {
  gl_FragColor = ${effectConfig.code};
}
`

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 }
      },
      side: THREE.DoubleSide
    })
  }

  /**
   * 初始化共享的 WebGL 场景
   */
  const initWebGLScene = () => {
    // 创建场景
    scene = new THREE.Scene()

    // 创建相机
    camera = new THREE.OrthographicCamera(-0.6, 0.6, 0.6, -0.6, 0.1, 10)
    camera.position.set(0, 0, 2)

    // 创建离屏渲染器
    const canvas = document.createElement("canvas")
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
    renderer.setSize(512, 512)
    renderer.setPixelRatio(1)

    console.log("WebGL scene initialized")
  }

  /**
   * 初始化所有 2D Canvas
   */
  const initCanvases = () => {
    shaderEffects.forEach((effect, index) => {
      const canvas2d = canvasRefs.value[index]
      if (!canvas2d) return

      // 创建材质
      const material = createShaderMaterial(effect)
      materials.push(material)

      // 设置 canvas 尺寸
      const size = 512
      canvas2d.width = size
      canvas2d.height = size
    })

    console.log("Initialized", materials.length, "materials")
  }

  /**
   * 渲染效果到 2D Canvas
   */
  const renderToCanvas = (materialIndex: number, canvas2d: HTMLCanvasElement) => {
    if (!scene || !camera || !renderer || !materials[materialIndex]) return

    const material = materials[materialIndex]

    // 清空场景
    scene.clear()

    // 创建临时网格
    const geometry = new THREE.PlaneGeometry(1, 1)
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // 渲染到 WebGL canvas
    renderer.render(scene, camera)

    // 将 WebGL canvas 内容复制到 2D canvas
    const ctx = canvas2d.getContext("2d")
    if (ctx) {
      ctx.clearRect(0, 0, canvas2d.width, canvas2d.height)
      ctx.drawImage(renderer.domElement, 0, 0, canvas2d.width, canvas2d.height)
    }

    // 清理
    geometry.dispose()
    scene.remove(mesh)
  }

  /**
   * 动画循环
   */
  const animate = () => {
    animationId = requestAnimationFrame(animate)

    const time = performance.now() * 0.001

    // 更新所有材质的时间
    materials.forEach((material) => {
      if (material.uniforms && material.uniforms.uTime) {
        material.uniforms.uTime.value = time
      }
    })

    // 渲染每个效果到对应的 canvas
    canvasRefs.value.forEach((canvas, index) => {
      if (canvas && index < materials.length) {
        renderToCanvas(index, canvas)
      }
    })
  }

  /**
   * 创建 GUI
   */
  const createGUI = () => {
    gui = new GUI()
    gui.add(params, "autoRotate").name("自动旋转")
  }

  /**
   * 清理资源
   */
  const cleanup = () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }

    if (gui) {
      gui.destroy()
    }

    // 清理材质
    materials.forEach((material) => {
      material.dispose()
    })
    materials.length = 0

    if (renderer) {
      renderer.dispose()
    }
  }

  // 组件挂载
  onMounted(() => {
    setTimeout(() => {
      initWebGLScene()
      initCanvases()
      createGUI()
      animate()
    }, 200)
  })

  // 组件卸载
  onUnmounted(() => {
    cleanup()
  })
</script>

<template>
  <PageLayout
    title="🎨 着色器效果画廊"
    description="同时展示 25+ 种着色器视觉效果"
  >
    <!-- 画廊网格 -->
    <div class="shader-gallery">
      <div
        v-for="(effect, index) in shaderEffects"
        :key="effect.id"
        class="gallery-item"
      >
        <canvas
          :ref="
            (el: any) => {
              if (el) canvasRefs[index] = el
            }
          "
          class="effect-canvas"
        />
        <div class="effect-label">
          <span class="effect-id">{{ effect.id }}</span>
          <span class="effect-name">{{ effect.name }}</span>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<style scoped>
  .shader-gallery {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-auto-rows: 1fr;
    gap: 2px;
    background: #000;
    z-index: 0;
    overflow-y: auto;
    padding: 2px;
  }

  .gallery-item {
    position: relative;
    background: #1a1a1a;
    border-radius: 4px;
    overflow: hidden;
    aspect-ratio: 1;
    transition: transform 0.3s ease;
  }

  .gallery-item:hover {
    transform: scale(1.05);
    z-index: 10;
    box-shadow: 0 0 20px rgba(66, 185, 131, 0.5);
  }

  .effect-canvas {
    width: 100%;
    height: 100%;
    display: block;
    image-rendering: auto;
  }

  .effect-label {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    color: #fff;
    padding: 8px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 2;
  }

  .gallery-item:hover .effect-label {
    opacity: 1;
  }

  .effect-id {
    background: #42b983;
    color: #000;
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    min-width: 24px;
    text-align: center;
  }

  .effect-name {
    font-weight: 500;
    flex: 1;
  }

  /* 响应式网格 */
  @media (max-width: 1200px) {
    .shader-gallery {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  @media (max-width: 768px) {
    .shader-gallery {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 480px) {
    .shader-gallery {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* 滚动条样式 */
  .shader-gallery::-webkit-scrollbar {
    width: 8px;
  }

  .shader-gallery::-webkit-scrollbar-track {
    background: #1a1a1a;
  }

  .shader-gallery::-webkit-scrollbar-thumb {
    background: #42b983;
    border-radius: 4px;
  }

  .shader-gallery::-webkit-scrollbar-thumb:hover {
    background: #35a372;
  }
</style>
