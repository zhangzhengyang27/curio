<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
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

  // GUI 和模型引用
  let gui!: GUI
  let boxHelper: THREE.Box3Helper | null = null
  let sphereMesh: THREE.Mesh | null = null

  /**
   * 加载环境贴图
   */
  const loadEnvironmentMap = () => {
    if (!scene.value) return

    const rgbeLoader = new RGBELoader()
    rgbeLoader.load("/three-project/texture/3DTotal-Medieval_City_0001_4k.hdr", (envMap) => {
      // 设置球形贴图
      envMap.mapping = THREE.EquirectangularReflectionMapping
      if (!scene.value) return
      // 设置场景背景
      scene.value.background = envMap
      // 设置场景环境贴图（影响物体的反射和折射）
      scene.value.environment = envMap
      console.log("环境贴图加载成功")
    })
  }

  /**
   * 加载 GLTF 模型并计算包围盒
   */
  const loadGltfModel = () => {
    if (!scene.value) return

    // 实例化 GLTF 加载器
    const gltfLoader = new GLTFLoader()

    // 加载 Duck 模型
    gltfLoader.load(
      "/three-project/model/Duck.glb",
      (gltf) => {
        console.log("Duck 模型加载成功:", gltf)
        if (!scene.value) return
        scene.value.add(gltf.scene)

        // 获取鸭子的网格对象
        const duckMesh = gltf.scene.getObjectByName("LOD3spShape")
        if (!duckMesh) {
          console.error("找不到 LOD3spShape 对象")
          return
        }

        const duckGeometry = duckMesh.geometry as THREE.BufferGeometry | undefined
        if (!duckGeometry) {
          console.error("Duck 模型没有几何体")
          return
        }

        // ========== 计算包围盒 ==========
        // 计算几何体的包围盒
        duckGeometry.computeBoundingBox()

        // 获取包围盒（此时是局部坐标系）
        if (!duckGeometry.boundingBox) {
          console.error("无法计算包围盒")
          return
        }
        let duckBox = duckGeometry.boundingBox.clone()

        // 更新世界矩阵
        duckMesh.updateWorldMatrix(true, true)

        // 将包围盒转换到世界坐标系
        duckBox.applyMatrix4(duckMesh.matrixWorld)

        // 获取包围盒中心点
        const center = duckBox.getCenter(new THREE.Vector3())
        console.log("包围盒中心点:", center)
        console.log("包围盒:", duckBox)
        console.log("Duck Mesh:", duckMesh)

        // 创建包围盒辅助器（黄色线框）
        boxHelper = new THREE.Box3Helper(duckBox, 0xffff00)
        scene.value.add(boxHelper)

        // ========== 计算包围球 ==========
        // 获取几何体的包围球
        if (!duckGeometry.boundingSphere) {
          console.error("无法计算包围球")
          return
        }
        let duckSphere = duckGeometry.boundingSphere.clone()

        // 将包围球转换到世界坐标系
        duckSphere.applyMatrix4(duckMesh.matrixWorld)
        console.log("包围球:", duckSphere)

        // 创建包围球辅助器（红色线框球体）
        const sphereGeometry = new THREE.SphereGeometry(duckSphere.radius, 16, 16)
        const sphereMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          wireframe: true
        })
        sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial)
        sphereMesh.position.copy(duckSphere.center)
        scene.value.add(sphereMesh)

        // 添加 GUI 控制
        initGUI()
      },
      (progress) => {
        console.log("Duck 加载进度:", (progress.loaded / progress.total) * 100 + "%")
      },
      (error) => {
        console.error("Duck 模型加载失败:", error)
      }
    )
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    // 包围盒可见性控制
    const boundingParams = {
      showBoundingBox: true,
      showBoundingSphere: true
    }

    const boundingFolder = gui.addFolder("包围盒控制")

    boundingFolder
      .add(boundingParams, "showBoundingBox")
      .name("显示包围盒")
      .onChange((value) => {
        if (boxHelper) {
          boxHelper.visible = value
        }
      })

    boundingFolder
      .add(boundingParams, "showBoundingSphere")
      .name("显示包围球")
      .onChange((value) => {
        if (sphereMesh) {
          sphereMesh.visible = value
        }
      })

    boundingFolder.open()
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理包围盒辅助器
    if (boxHelper) {
      scene.value?.remove(boxHelper)
      boxHelper = null
    }

    // 清理包围球网格
    if (sphereMesh) {
      sphereMesh.geometry?.dispose()
      const mat = sphereMesh.material as THREE.Material
      mat.dispose()
      scene.value?.remove(sphereMesh)
      sphereMesh = null
    }

    // 清理 GUI
    gui?.destroy()

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    loadEnvironmentMap()
    loadGltfModel()
    startAnimation()
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="📦 包围盒与包围球"
    description="学习如何计算和可视化 3D 模型的包围盒（Bounding Box）和包围球（Bounding Sphere）"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>📦 <strong>包围盒计算</strong> - 使用 Box3 计算模型的 包围盒</li>
          <li>🔴 <strong>包围球计算</strong> - 计算最小包围球</li>
          <li>🌍 <strong>世界坐标转换</strong> - 将局部包围盒转换到世界坐标系</li>
          <li>🎨 <strong>可视化辅助</strong> - 黄色线框显示包围盒，红色线框显示包围球</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 包围体说明：</h3>
        <ul>
          <li><strong>包围盒（Bounding Box）</strong> - AABB（轴对齐包围盒），立方体形状</li>
          <li><strong>包围球（Bounding Sphere）</strong> - 球形包围体，半径最小化</li>
          <li><strong>用途</strong> - 碰撞检测、视锥剔除、对象选择</li>
          <li><strong>性能</strong> - 包围球计算更快，包围盒更精确</li>
          <li>💡 通常先用包围球粗略检测，再用包围盒精确检测</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔧 核心 API：</h3>
        <ul>
          <li><code>geometry.computeBoundingBox()</code> - 计算包围盒</li>
          <li><code>geometry.boundingBox</code> - 获取包围盒对象</li>
          <li><code>geometry.boundingSphere</code> - 获取包围球对象</li>
          <li><code>box.applyMatrix4(matrix)</code> - 应用变换矩阵</li>
          <li><code>box.getCenter(target)</code> - 获取包围盒中心点</li>
          <li><code>Box3Helper(box, color)</code> - 包围盒可视化辅助器</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>🔧 核心代码：</p>
        <p style="margin-top: 8px">
          计算包围盒：<code style="background: rgba(0, 0, 0, 0.3); padding: 2px 6px; border-radius: 3px">geometry.computeBoundingBox()</code>
        </p>
        <p style="margin-top: 4px">
          世界坐标转换：<code style="background: rgba(0, 0, 0, 0.3); padding: 2px 6px; border-radius: 3px">box.applyMatrix4(mesh.matrixWorld)</code>
        </p>
        <p style="margin-top: 4px">
          可视化辅助：<code style="background: rgba(0, 0, 0, 0.3); padding: 2px 6px; border-radius: 3px">new THREE.Box3Helper(box, 0xffff00)</code>
        </p>
      </div>

      <div class="info-section">
        <h3>💡 注意事项：</h3>
        <ul>
          <li>⚠️ <strong>坐标系转换</strong> - 包围盒初始在局部坐标系，需要转换到世界坐标系</li>
          <li>⚠️ <strong>矩阵更新</strong> - 使用 <code>updateWorldMatrix()</code> 确保矩阵是最新的</li>
          <li>⚠️ <strong>克隆对象</strong> - 应用矩阵会修改原对象，建议先克隆</li>
          <li>⚠️ <strong>动态更新</strong> - 模型变换后需要重新计算包围体</li>
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
  }

  .features,
  .info-section,
  .code-tip {
    margin-bottom: 16px;
  }

  .features h3,
  .info-section h3,
  .code-tip p:first-child {
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
