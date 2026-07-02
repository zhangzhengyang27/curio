<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
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

  // Three.js 对象引用
  let plane!: THREE.Mesh
  let planeMaterial!: THREE.MeshBasicMaterial
  let texture!: THREE.Texture // 保存纹理引用
  let gui!: GUI

  /**
   * 创建纹理平面
   */
  const createTexturePlane = () => {
    if (!scene.value) return

    // 创建纹理加载器
    const textureLoader = new THREE.TextureLoader()

    // 加载纹理
    texture = textureLoader.load("/three-project/texture/waterCover/CityNewYork002_COL_VAR1_1K.png")
    // 设置纹理颜色空间（默认为 SRGBColorSpace）
    texture.colorSpace = THREE.SRGBColorSpace

    // 加载 AO 贴图（环境光遮蔽）
    const aoMap = textureLoader.load("/three-project/texture/waterCover/CityNewYork002_AO_1K.jpg")

    // 透明度贴图
    textureLoader.load("/three-project/texture/door/height.jpg")

    // 光照贴图
    textureLoader.load("/three-project/texture/colors.png")

    // 高光贴图
    const specularMap = textureLoader.load("/three-project/texture/waterCover/CityNewYork002_GLOSS_1K.jpg")

    // 加载 HDR 环境贴图
    const rgbeLoader = new RGBELoader()

    rgbeLoader.load("/three-project/texture/3DTotal-Medieval_City_0001_4k.hdr", (envMap) => {
      // 设置球形贴图
      envMap.mapping = THREE.EquirectangularReflectionMapping
      // 设置环境贴图
      if (!scene.value) return
      scene.value.background = envMap
      scene.value.environment = envMap
      // 设置 plane 的环境贴图
      if (planeMaterial) {
        planeMaterial.envMap = envMap
        planeMaterial.needsUpdate = true
      }
    })

    // 创建平面几何体
    const planeGeometry = new THREE.PlaneGeometry(1, 1)

    // 创建基础材质
    planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: texture,
      transparent: true, // 允许透明
      aoMap: aoMap, // 设置 AO 贴图
      aoMapIntensity: 1, // AO 强度
      // 透明度贴图（可选）
      // alphaMap: alphaMap,
      // 设置光照贴图（可选）
      // lightMap: lightMap,
      // 设置高光贴图
      specularMap: specularMap,
      reflectivity: 0.5 // 反射率
    })

    // 创建平面网格
    plane = new THREE.Mesh(planeGeometry, planeMaterial)

    // 将平面添加到场景中
    scene.value.add(plane)
  }

  const initGUI = () => {
    gui = new GUI()

    // 纹理颜色空间参数
    const textureParams = {
      colorSpace: "SRGBColorSpace"
    }

    // 颜色空间选项
    const colorSpaceOptions: Record<string, string> = {
      SRGBColorSpace: THREE.SRGBColorSpace,
      LinearSRGBColorSpace: THREE.LinearSRGBColorSpace,
      NoColorSpace: THREE.NoColorSpace
    }

    // 添加纹理颜色空间控制
    gui
      .add(textureParams, "colorSpace", Object.keys(colorSpaceOptions))
      .name("纹理颜色空间")
      .onChange((value) => {
        texture.colorSpace = colorSpaceOptions[value]
        texture.needsUpdate = true
        planeMaterial.needsUpdate = true
      })

    // 添加 AO 强度控制
    gui.add(planeMaterial, "aoMapIntensity").min(0).max(1).step(0.01).name("AO 强度")

    // 添加反射率控制
    gui.add(planeMaterial, "reflectivity").min(0).max(1).step(0.01).name("反射率")

    // 添加透明度控制
    gui.add(planeMaterial, "opacity").min(0).max(1).step(0.01).name("透明度")

    // 场景雾控制
    gui.addFolder("场景雾效果")

    // 平面位置控制
    const positionFolder = gui.addFolder("平面位置")
    positionFolder.add(plane.position, "x").min(-5).max(5).step(0.1).name("X 轴位置")

    positionFolder.add(plane.position, "y").min(-5).max(5).step(0.1).name("Y 轴位置")

    positionFolder.add(plane.position, "z").min(-5).max(5).step(0.1).name("Z 轴位置")

    // 平面旋转控制
    const rotationFolder = gui.addFolder("平面旋转")
    rotationFolder.add(plane.rotation, "x").min(-Math.PI).max(Math.PI).step(0.01).name("X 轴旋转")

    rotationFolder.add(plane.rotation, "y").min(-Math.PI).max(Math.PI).step(0.01).name("Y 轴旋转")

    rotationFolder.add(plane.rotation, "z").min(-Math.PI).max(Math.PI).step(0.01).name("Z 轴旋转")
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    gui?.destroy()
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    createTexturePlane()
    initGUI()
    startAnimation()
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🖼️ 基础材质纹理贴图"
    description="学习如何在 Three.js 中使用各种纹理贴图"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>纹理贴图类型：</h3>
        <ul>
          <li>🎨 颜色贴图 (Color Map)</li>
          <li>🌑 AO 贴图 (Ambient Occlusion)</li>
          <li>✨ 高光贴图 (Specular Map)</li>
          <li>🌍 HDR 环境贴图</li>
          <li>👻 透明度贴图 (Alpha Map)</li>
          <li>💡 光照贴图 (Light Map)</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎨 纹理颜色空间：</h3>
        <ul>
          <li><strong>SRGBColorSpace</strong> - 标准 sRGB（用于颜色贴图）</li>
          <li><strong>LinearSRGBColorSpace</strong> - 线性 sRGB（用于数据贴图）</li>
          <li><strong>NoColorSpace</strong> - 无颜色空间（保持原始数据）</li>
        </ul>
      </div>

      <div class="controls-tip">
        <p>💡 使用提示：</p>
        <ul>
          <li>使用右侧 GUI 面板切换颜色空间</li>
          <li>调整雾效果参数观察场景变化</li>
          <li>观察不同颜色空间对纹理的影响</li>
          <li>鼠标拖拽旋转视角</li>
          <li>滚轮缩放视图</li>
        </ul>
      </div>
    </template>

    <!-- Three.js 容器 -->
    <div ref="containerRef" />
  </PageLayout>
</template>

<style scoped>
  /* 组件特定样式可以在这里添加 */
</style>
