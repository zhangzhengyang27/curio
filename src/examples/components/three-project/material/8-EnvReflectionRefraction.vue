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
    renderer,
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 0, y: 2, z: 6 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 2,
      maxDistance: 20
    },
    showAxesHelper: false,
    showGridHelper: false
  })

  // GUI 和对象引用
  let gui: GUI | null = null
  let meshes: { mesh: THREE.Mesh; material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial; name: string }[] = []
  let hdrTexture: THREE.Texture | null = null

  /**
   * 创建四个不同材质的球体
   */
  const createScene = () => {
    if (!scene.value) return

    // 设置场景背景为深色
    scene.value.background = new THREE.Color(0x111122)

    // 1. 金属球 - 完美镜面反射
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 1.0,
      roughness: 0.0,
      envMapIntensity: 1.0
    })
    const metalSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 64, 64),
      metalMaterial
    )
    metalSphere.position.set(-3, 0, 0)
    scene.value.add(metalSphere)
    meshes.push({ mesh: metalSphere, material: metalMaterial, name: "金属球" })

    // 2. 塑料球 - 漫反射+少量高光
    const plasticMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6644,
      metalness: 0.0,
      roughness: 0.5,
      envMapIntensity: 0.5
    })
    const plasticSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 64, 64),
      plasticMaterial
    )
    plasticSphere.position.set(-1, 0, 0)
    scene.value.add(plasticSphere)
    meshes.push({ mesh: plasticSphere, material: plasticMaterial, name: "塑料球" })

    // 3. 玻璃球 - 透射折射
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.0,
      transmission: 1.0,
      ior: 1.5,
      thickness: 0.5,
      envMapIntensity: 1.0
    })
    const glassSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 64, 64),
      glassMaterial
    )
    glassSphere.position.set(1, 0, 0)
    scene.value.add(glassSphere)
    meshes.push({ mesh: glassSphere, material: glassMaterial, name: "玻璃球" })

    // 4. 磨砂金属 - 模糊反射
    const roughMetalMaterial = new THREE.MeshStandardMaterial({
      color: 0xddddff,
      metalness: 1.0,
      roughness: 0.7,
      envMapIntensity: 1.0
    })
    const roughMetalSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 64, 64),
      roughMetalMaterial
    )
    roughMetalSphere.position.set(3, 0, 0)
    scene.value.add(roughMetalSphere)
    meshes.push({ mesh: roughMetalSphere, material: roughMetalMaterial, name: "磨砂金属" })

    // 添加地面（帮助观察反射）
    const floorGeometry = new THREE.PlaneGeometry(20, 20)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x333344,
      metalness: 0.2,
      roughness: 0.8,
      envMapIntensity: 0.3
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1
    scene.value.add(floor)
    meshes.push({ mesh: floor, material: floorMaterial, name: "地面" })

    // 添加方向光辅助观察
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5)
    dirLight.position.set(5, 10, 5)
    scene.value.add(dirLight)

    const ambLight = new THREE.AmbientLight(0x404040, 0.3)
    scene.value.add(ambLight)

    // 加载 HDR 环境贴图
    const loader = new RGBELoader()
    loader.load("/three-project/texture/050.hdr", (texture) => {
      if (!renderer.value || !scene.value) return

      texture.mapping = THREE.EquirectangularReflectionMapping
      hdrTexture = texture

      // 设置场景环境贴图
      scene.value.environment = texture
      // 设置场景背景为 HDR
      scene.value.background = texture

      console.log("HDR 环境贴图加载成功")
    }, undefined, (err) => {
      console.warn("HDR 加载失败，尝试备用贴图", err)
      // 如果 050.hdr 失败，尝试 2k.hdr
      loader.load("/three-project/texture/2k.hdr", (texture) => {
        if (!renderer.value || !scene.value) return

        texture.mapping = THREE.EquirectangularReflectionMapping
        hdrTexture = texture

        scene.value.environment = texture
        scene.value.background = texture

        console.log("备用 HDR 环境贴图加载成功")
      })
    })

    console.log("环境反射与折射材质场景创建成功")
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    if (meshes.length === 0) return

    gui = new GUI()
    gui.title("环境反射与折射控制")

    // 通用参数
    const globalParams = {
      envMapIntensity: 1.0,
      autoRotate: true,
      rotationSpeed: 0.5
    }

    // 全局控制
    const globalFolder = gui.addFolder("🌍 全局控制")
    globalFolder
      .add(globalParams, "envMapIntensity", 0, 3, 0.1)
      .name("envMapIntensity")
      .onChange((value) => {
        meshes.forEach((item) => {
          if ('envMapIntensity' in item.material) {
            (item.material as THREE.MeshStandardMaterial).envMapIntensity = value
          }
        })
      })

    globalFolder
      .add(globalParams, "autoRotate")
      .name("自动旋转")
      .onChange(() => {})

    globalFolder
      .add(globalParams, "rotationSpeed", 0, 2, 0.05)
      .name("旋转速度")
      .onChange(() => {})

    globalFolder.open()

    // 为每个球体创建控制面板
    if (!gui) return
    const g = gui
    meshes.forEach((item) => {
      if (item.name === "地面") return // 跳过地面

      const folder = g.addFolder(`🔮 ${item.name}`)

      // metalness 控制
      if ("metalness" in item.material) {
        const standardMaterial = item.material as THREE.MeshStandardMaterial
        const matParams: { metalness: number; roughness: number } = {
          metalness: standardMaterial.metalness ?? 0,
          roughness: standardMaterial.roughness ?? 0
        }
        folder
          .add(matParams, "metalness", 0, 1, 0.01)
          .name("metalness（金属度）")
          .onChange((value: number) => {
            standardMaterial.metalness = value
          })

        folder
          .add(matParams, "roughness", 0, 1, 0.01)
          .name("roughness（粗糙度）")
          .onChange((value: number) => {
            standardMaterial.roughness = value
          })
      }

      // MeshPhysicalMaterial 特有属性
      if (item.material.isMeshPhysicalMaterial) {
        const physicalMaterial = item.material as THREE.MeshPhysicalMaterial
        const physicalParams: { transmission: number; ior: number; thickness: number } = {
          transmission: physicalMaterial.transmission ?? 0,
          ior: physicalMaterial.ior ?? 0,
          thickness: physicalMaterial.thickness ?? 0
        }
        folder
          .add(physicalParams, "transmission", 0, 1, 0.01)
          .name("transmission（透射率）")
          .onChange((value: number) => {
            physicalMaterial.transmission = value
          })

        folder
          .add(physicalParams, "ior", 1, 2.5, 0.01)
          .name("ior（折射率）")
          .onChange((value: number) => {
            physicalMaterial.ior = value
          })

        folder
          .add(physicalParams, "thickness", 0, 3, 0.1)
          .name("thickness（厚度）")
          .onChange((value: number) => {
            physicalMaterial.thickness = value
          })
      }

      folder.open()
    })

    // 技术说明
    const infoFolder = gui.addFolder("📖 技术说明")
    const info = {
      metalness: "金属度：0=非金属，1=纯金属",
      roughness: "粗糙度：0=光滑镜面，1=粗糙漫反射",
      transmission: "透射率：0=不透明，1=完全透明（玻璃）",
      ior: "折射率：1.0=空气，1.5=玻璃，2.4=钻石",
      thickness: "厚度：影响折射的弯曲程度",
      envMapIntensity: "环境贴图强度：控制反射/折射的亮度"
    }
    for (const [key, value] of Object.entries(info)) {
      const obj: Record<string, string> = {}
      obj[key] = value
      infoFolder.add(obj, key).name(key).listen().disable()
    }
    infoFolder.close()
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理 HDR 纹理
    if (hdrTexture) {
      hdrTexture.dispose()
      hdrTexture = null
    }

    // 清理 meshes 引用
    meshes = []

    // 清理 GUI
    gui?.destroy()
    gui = null

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    // MeshPhysicalMaterial 的 transmission 需要渲染器支持
    if (renderer.value) {
      // 确保 toneMapping 和 encoding 正确
      renderer.value.toneMapping = THREE.ACESFilmicToneMapping
      renderer.value.toneMappingExposure = 1.0
    }

    createScene()
    initGUI()

    // 带旋转的动画循环
    startAnimation(() => {
      if (!scene.value) return
      // 球体自动旋转（缓慢绕Y轴）
      meshes.forEach((item) => {
        if (item.name !== "地面") {
          item.mesh.rotation.y += 0.003
        }
      })
    })
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🪞 环境反射与折射材质"
    description="MeshStandardMaterial 与 MeshPhysicalMaterial 的 PBR 渲染效果"
  >
    <template #content>
      <div class="info-section">
        <h3>🔮 四种材质对比：</h3>
        <ul>
          <li><strong>金属球</strong>：metalness=1, roughness=0 → 完美镜面反射</li>
          <li><strong>塑料球</strong>：metalness=0, roughness=0.5 → 漫反射+少量高光</li>
          <li><strong>玻璃球</strong>：transmission=1, ior=1.5 → 透射折射效果</li>
          <li><strong>磨砂金属</strong>：metalness=1, roughness=0.7 → 模糊反射</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 PBR 材质核心参数：</h3>
        <ul>
          <li><strong>metalness</strong>：0=电介质（塑料、木材），1=金属</li>
          <li><strong>roughness</strong>：0=镜面光滑，1=完全粗糙</li>
          <li><strong>transmission</strong>：MeshPhysicalMaterial 特有，控制透射</li>
          <li><strong>ior</strong>：折射率，影响光线弯曲程度</li>
          <li><strong>thickness</strong>：透射体的厚度，影响折射量</li>
          <li><strong>envMapIntensity</strong>：环境贴图对材质的影响强度</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 环境贴图：</p>
        <p><code>RGBELoader 加载 HDR → EquirectangularReflectionMapping</code></p>
        <p><code>scene.environment = hdrTexture // 所有 PBR 材质自动使用</code></p>
      </div>

      <div class="controls-tip">
        <p>🎮 操作提示：</p>
        <ul>
          <li>🖱️ 左键拖动：旋转视角</li>
          <li>🖱️ 滚轮：缩放</li>
          <li>🎚️ 调节每个球体的 metalness / roughness</li>
          <li>🎚️ 玻璃球可调节 transmission / ior / thickness</li>
          <li>🎚️ 全局 envMapIntensity 控制反射亮度</li>
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
