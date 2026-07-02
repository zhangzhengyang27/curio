<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 容器引用
  const containerRef = shallowRef<HTMLDivElement | null>(null)

  // 使用公共的 Three.js 场景逻辑
  const {
    scene,
    renderer,
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 3, y: 2, z: 5 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 2,
      maxDistance: 15
    },
    showAxesHelper: false,
    showGridHelper: false
  })

  // GUI 和对象引用
  let gui: GUI | null = null
  let envTexture: THREE.Texture | null = null
  let metalSphere: THREE.Mesh | null = null
  let plasticCube: THREE.Mesh | null = null
  let glassSphere: THREE.Mesh | null = null
  // 保存原始环境贴图（用于单独设置 envMap）
  let originalEnvTexture: THREE.Texture | null = null

  /**
   * 创建场景物体
   */
  const createScene = () => {
    if (!scene.value || !renderer.value) return

    // 加载 HDR 环境贴图
    const rgbeLoader = new RGBELoader()
    rgbeLoader.load("/three-project/texture/050.hdr", (hdrTexture: any) => {
      if (!scene.value || !renderer.value) return
      // 使用 PMREMGenerator 将 HDR 转为环境贴图
      const pmremGenerator = new THREE.PMREMGenerator(renderer.value)
      pmremGenerator.compileEquirectangularShader()

      envTexture = pmremGenerator.fromEquirectangular(hdrTexture).texture
      originalEnvTexture = envTexture.clone()

      // 清理 HDR 纹理和 PMREM 生成器
      hdrTexture.dispose()
      pmremGenerator.dispose()

      // 设置场景背景
      scene.value.background = envTexture

      // 设置场景环境光照（影响所有 PBR 材质）
      scene.value.environment = envTexture

      // 创建金属球体
      const metalGeo = new THREE.SphereGeometry(0.8, 64, 64)
      const metalMat = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 1.0,
        roughness: 0.05
      })
      metalSphere = new THREE.Mesh(metalGeo, metalMat)
      metalSphere.position.set(-2.5, 0.8, 0)
      scene.value.add(metalSphere)

      // 创建塑料立方体
      const plasticGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2)
      const plasticMat = new THREE.MeshStandardMaterial({
        color: 0xff4444,
        metalness: 0.0,
        roughness: 0.4
      })
      plasticCube = new THREE.Mesh(plasticGeo, plasticMat)
      plasticCube.position.set(0, 0.8, 0)
      scene.value.add(plasticCube)

      // 创建玻璃球体（使用物理材质）
      const glassGeo = new THREE.SphereGeometry(0.8, 64, 64)
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.0,
        roughness: 0.0,
        transmission: 0.9,
        thickness: 1.5,
        ior: 1.5
      })
      glassSphere = new THREE.Mesh(glassGeo, glassMat)
      glassSphere.position.set(2.5, 0.8, 0)
      scene.value.add(glassSphere)

      // 创建地面
      const floorGeo = new THREE.PlaneGeometry(15, 15)
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.3,
        roughness: 0.8
      })
      const floor = new THREE.Mesh(floorGeo, floorMat)
      floor.rotation.x = -Math.PI / 2
      floor.position.y = -0.5
      scene.value.add(floor)

      // 初始化 GUI（等 HDR 加载完成）
      initGUI()
    })
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    const params = {
      envMapIntensity: 1.0,
      showBackground: true,
      showEnvironment: true,
      applyEnvMapToGlass: true
    }

    // 环境贴图控制
    const folder = gui.addFolder("🌍 环境贴图控制")
    folder
      .add(params, "envMapIntensity", 0, 5, 0.1)
      .name("环境贴图强度")
      .onChange((v) => {
        if (!scene.value) return
        scene.value.environmentIntensity = v
        scene.value.backgroundIntensity = v
      })

    folder
      .add(params, "showBackground")
      .name("显示背景 (scene.background)")
      .onChange((v) => {
        if (!scene.value) return
        scene.value.background = v ? envTexture : null
      })

    folder
      .add(params, "showEnvironment")
      .name("环境光照 (scene.environment)")
      .onChange((v) => {
        if (!scene.value) return
        scene.value.environment = v ? envTexture : null
      })

    folder.open()

    // 物体材质信息
    const infoFolder = gui.addFolder("📋 物体信息")
    infoFolder.add({ info: "左侧: 金属球 (metalness=1, roughness=0.05)" }, "info").name("金属球").disable()
    infoFolder.add({ info: "中间: 塑料方块 (metalness=0, roughness=0.4)" }, "info").name("塑料方块").disable()
    infoFolder.add({ info: "右侧: 玻璃球 (transmission=0.9, ior=1.5)" }, "info").name("玻璃球").disable()
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理环境贴图
    envTexture?.dispose()
    originalEnvTexture?.dispose()
    envTexture = null
    originalEnvTexture = null

    // 清理 GUI
    gui?.destroy()

    // 调用基础清理
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    createScene()
    startAnimation()
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🌍 环境贴图 (Environment Map)"
    description="使用 HDR 环境贴图为 PBR 材质提供真实的环境光照和反射"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🌐 <strong>scene.background</strong> - 将 HDR 作为场景背景</li>
          <li>💡 <strong>scene.environment</strong> - 为所有 PBR 材质提供环境光照</li>
          <li>🔍 <strong>envMapIntensity</strong> - 调节环境贴图的整体强度</li>
          <li>🔘 <strong>独立开关</strong> - 可分别控制背景和环境光照的显示</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 关键概念：</h3>
        <ul>
          <li><strong>PMREMGenerator</strong> - 将 HDR 转换为预过滤 Mipmap 环境贴图</li>
          <li><strong>scene.background</strong> - 控制场景背景显示</li>
          <li><strong>scene.environment</strong> - 为所有 MeshStandardMaterial 提供环境反射</li>
          <li><strong>environmentIntensity</strong> - 环境贴图对光照的影响强度</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 三种材质对比：</h3>
        <ul>
          <li>🔵 <strong>金属球</strong> - metalness=1, roughness=0.05，高反射</li>
          <li>🟥 <strong>塑料方块</strong> - metalness=0, roughness=0.4，漫反射为主</li>
          <li>🟢 <strong>玻璃球</strong> - transmission=0.9, 透明折射效果</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>const pmrem = new THREE.PMREMGenerator(renderer)</code></p>
        <p><code>const envTexture = pmrem.fromEquirectangular(hdrTexture).texture</code></p>
        <p><code>scene.background = envTexture</code></p>
        <p><code>scene.environment = envTexture</code></p>
      </div>

      <div class="controls-tip">
        <p>🎮 操作提示：</p>
        <ul style="margin-top: 8px">
          <li>• 使用 GUI 面板控制环境贴图参数</li>
          <li>• 关闭背景后可以看到纯色背景下的环境反射效果</li>
          <li>• 关闭环境光照后物体失去反射，变为纯色</li>
        </ul>
      </div>
    </template>

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
