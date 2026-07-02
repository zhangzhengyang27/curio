<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 导入着色器
  import basicVertexShader from "./shader/raw/vertex.glsl?raw"
  import basicFragmentShader from "./shader/raw/fragment.glsl?raw"

  // 容器引用
  const containerRef = shallowRef(null)

  // 使用 Three.js 场景组合
  const { scene, startAnimation } = useThreeScene(containerRef, {
    fov: 90,
    cameraPosition: { x: 0, y: 0, z: 2 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05
    },
    showAxesHelper: true,
    axesHelperSize: 5
  })

  // 材质和网格
  let rawShaderMaterial: THREE.RawShaderMaterial | null = null
  let floor: THREE.Mesh | null = null
  const clock = new THREE.Clock()

  // 初始化场景内容
  const initContent = () => {
    if (!scene.value) return

    // 创建纹理加载器
    const textureLoader = new THREE.TextureLoader()
    const texture = textureLoader.load("/three-project/texture/ca.jpeg")

    // 创建原始着色器材质
    rawShaderMaterial = new THREE.RawShaderMaterial({
      vertexShader: basicVertexShader,
      fragmentShader: basicFragmentShader,
      side: THREE.DoubleSide, // 双面显示
      uniforms: {
        uTime: {
          value: 0 // 时间
        },
        uTexture: {
          value: texture // 纹理
        }
      }
    })

    // 创建平面几何体
    floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 64, 64), rawShaderMaterial)

    scene.value.add(floor)
    // 开始动画循环
    startAnimation(animate)
  }

  // 动画更新
  const animate = () => {
    const elapsedTime = clock.getElapsedTime()

    // 更新着色器 uniform
    if (rawShaderMaterial) {
      rawShaderMaterial.uniforms.uTime.value = elapsedTime
    }
  }

  // 清理资源
  const cleanup = () => {
    // 清理材质和几何体
    if (floor) {
      floor.geometry?.dispose()
      rawShaderMaterial?.dispose()
    }
  }

  // 组件挂载后初始化
  onMounted(() => {
    // 等待场景初始化完成
    setTimeout(() => {
      initContent()
    }, 100)
  })

  // 组件卸载时清理
  onUnmounted(() => {
    cleanup()
  })
</script>

<template>
  <PageLayout
    title="原始着色器材质"
    description="使用 RawShaderMaterial 创建波动效果 - 纹理贴图 + 时间动画"
  >
    <!-- 页面内容 -->
    <template #content>
      <div class="info-section">
        <h3>💡 技术要点</h3>
        <ul>
          <li>✅ RawShaderMaterial - 原始着色器材质</li>
          <li>✅ 手动定义所有顶点属性和 uniform</li>
          <li>✅ 纹理采样和 UV 坐标</li>
          <li>✅ sin 函数创建波动效果</li>
          <li>✅ 时间动画（uTime uniform）</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>🔍 关键代码</p>
        <p class="small-text">
          顶点着色器中使用 sin 函数：
        </p>
        <p class="small-text">
          modelPosition.z = sin((modelPosition.x + uTime) * 10.0) * 0.05
        </p>
        <p class="small-text">
          片元着色器中使用纹理：
        </p>
        <p class="small-text">
          texture2D(uTexture, vUv)
        </p>
      </div>

      <div class="controls-tip">
        <p>🎮 操作说明</p>
        <ul>
          <li>🖱️ 左键拖拽 - 旋转视角</li>
          <li>🖱️ 右键拖拽 - 平移视角</li>
          <li>🖱️ 滚轮 - 缩放视角</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📦 RawShaderMaterial vs ShaderMaterial</h3>
        <ul>
          <li>Raw：需要手动定义所有变量（attribute、uniform）</li>
          <li>Raw：需要手动计算投影矩阵</li>
          <li>Shader：自动注入常用变量和矩阵</li>
          <li>Raw：更底层，更灵活，适合学习 WebGL 原理</li>
        </ul>
      </div>
    </template>

    <!-- Three.js 容器 -->
    <div
      ref="containerRef"
      class="webgl-container"
    />
  </PageLayout>
</template>

<style scoped>
  .webgl-container {
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    overflow: hidden;
  }

  :deep(canvas) {
    display: block;
    outline: none;
  }
</style>
