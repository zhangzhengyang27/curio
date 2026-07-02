<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
  import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"
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

  // GUI 和对象引用
  let gui!: GUI
  let wireframeGeometryInterval: ReturnType<typeof setInterval> | null = null
  let edgesArray: { edges: THREE.LineSegments; originalMesh: THREE.Mesh }[] = [] // 保存所有边缘线段
  let loadedModel: THREE.Object3D | null = null // 保存加载的模型
  let currentMode: string = "edges" // 当前模式：edges 或 wireframe

  /**
   * 为网格创建边缘线段
   */
  const createEdgesForMesh = (mesh: THREE.Mesh, mode: string = "edges") => {
    if (!mesh.geometry) return null

    const geometry = mesh.geometry
    let edgesGeometry!: THREE.BufferGeometry

    if (mode === "edges") {
      // 使用 EdgesGeometry（只显示边缘）
      edgesGeometry = new THREE.EdgesGeometry(geometry)
    } else {
      // 使用 WireframeGeometry（显示所有三角形边）
      edgesGeometry = new THREE.WireframeGeometry(geometry)
    }

    // 创建线段材质
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff
    })

    // 创建线段
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial)

    // 更新网格的世界转换矩阵
    mesh.updateWorldMatrix(true, true)

    // 复制矩阵并应用到线段
    edges.matrix.copy(mesh.matrixWorld)
    // 分解矩阵
    edges.matrix.decompose(edges.position, edges.quaternion, edges.scale)

    return edges
  }

  /**
   * 加载 GLTF 模型并创建线框
   */
  const loadGltfModel = () => {
    if (!scene.value) return

    // 实例化 GLTF 加载器
    const gltfLoader = new GLTFLoader()

    // 实例化 DRACO 解码器
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath("/three-project/draco/")
    gltfLoader.setDRACOLoader(dracoLoader)

    // 加载城市模型
    gltfLoader.load(
      "/three-project/model/city.glb",
      (gltf) => {
        console.log("城市模型加载成功:", gltf)
        if (!scene.value) return
        const sceneValue = scene.value
        loadedModel = gltf.scene

        // 遍历模型的所有子对象
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            // 为每个网格创建边缘线段
            const mesh = child as THREE.Mesh
            const edges = createEdgesForMesh(mesh, currentMode)
            if (edges) {
              sceneValue.add(edges)
              edgesArray.push({
                edges: edges,
                originalMesh: mesh
              })
            }
          }
        })

        console.log(`已创建 ${edgesArray.length} 个线框对象`)
      },
      (progress) => {
        const percent = (progress.loaded / progress.total) * 100
        console.log(`模型加载进度: ${percent.toFixed(2)}%`)
      },
      (error) => {
        console.error("模型加载失败:", error)
      }
    )
  }

  /**
   * 切换线框模式
   */
  const switchMode = (newMode: string) => {
    if (!scene.value || currentMode === newMode) return
    const sceneValue = scene.value

    console.log(`切换模式: ${currentMode} -> ${newMode}`)
    currentMode = newMode

    // 移除所有现有的边缘线段
    edgesArray.forEach((item) => {
      sceneValue.remove(item.edges)
      item.edges.geometry?.dispose()
      const mat = item.edges.material as THREE.Material
      mat.dispose()
    })

    // 清空数组
    const meshes = edgesArray.map((item) => item.originalMesh)
    edgesArray = []

    // 重新创建边缘线段
    meshes.forEach((mesh) => {
      const edges = createEdgesForMesh(mesh, newMode)
      if (edges) {
        sceneValue.add(edges)
        edgesArray.push({
          edges: edges,
          originalMesh: mesh
        })
      }
    })

    console.log(`模式切换完成，重新创建了 ${edgesArray.length} 个线框对象`)
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    // 线框模式控制
    const wireframeFolder = gui.addFolder("线框模式")

    const wireframeParams = {
      mode: "edges", // 默认模式
      showEdges: true, // 是否显示线框
      edgeColor: 0xffffff // 线框颜色
    }

    // 保存 mode controller 的引用，以便后续更新
    const modeController = wireframeFolder
      .add(wireframeParams, "mode", ["edges", "wireframe"])
      .name("模式")
      .onChange((value) => {
        switchMode(value)
      })

    wireframeFolder
      .add(wireframeParams, "showEdges")
      .name("显示线框")
      .onChange((value) => {
        edgesArray.forEach((item) => {
          if (item.edges) {
            item.edges.visible = value
          }
        })
      })

    wireframeFolder
      .addColor(wireframeParams, "edgeColor")
      .name("线框颜色")
      .onChange((value: number) => {
        edgesArray.forEach((item) => {
          if (item.edges && item.edges.material) {
            const mat = item.edges.material as THREE.LineBasicMaterial
            mat.color!.setHex(value)
          }
        })
      })

    // 快捷切换按钮
    const buttonParams = {
      switchToEdges: () => {
        // 使用 setValue 会自动触发 onChange，同时更新 GUI 显示
        modeController.setValue("edges")
      },
      switchToWireframe: () => {
        modeController.setValue("wireframe")
      }
    }

    wireframeFolder.add(buttonParams, "switchToEdges").name("🔲 切换到边缘模式")
    wireframeFolder.add(buttonParams, "switchToWireframe").name("🕸️ 切换到线框模式")

    wireframeFolder.open()

    // 模型信息
    const infoFolder = gui.addFolder("模型信息")
    const info = {
      edgeCount: 0,
      mode: "EdgeGeometry"
    }

    infoFolder.add(info, "edgeCount").name("线框数量").listen()
    infoFolder.add(info, "mode").name("当前模式").listen()

    // 实时更新信息
    wireframeGeometryInterval = setInterval(() => {
      info.edgeCount = edgesArray.length
      info.mode = currentMode === "edges" ? "EdgesGeometry" : "WireframeGeometry"
    }, 100)
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理定时器
    if (wireframeGeometryInterval) {
      clearInterval(wireframeGeometryInterval)
      wireframeGeometryInterval = null
    }

    // 清理边缘线段
    edgesArray.forEach((item) => {
      if (item.edges) {
        item.edges.geometry?.dispose()
        if (item.edges.material) {
          const mat = item.edges.material as THREE.Material
          mat.dispose()
        }
        scene.value?.remove(item.edges)
      }
    })
    edgesArray = []

    // 清理加载的模型
    if (loadedModel) {
      loadedModel.traverse((child) => {
        if (child.geometry) {
          const geo = child.geometry as THREE.BufferGeometry
          geo.dispose()
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose())
          } else {
            const mat = child.material as THREE.Material
            mat.dispose()
          }
        }
      })
      loadedModel = null
    }

    // 清理 GUI
    gui?.destroy()

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    loadGltfModel()
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
    title="🕸️ 线框几何体"
    description="学习如何使用 EdgesGeometry 和 WireframeGeometry 创建模型的线框效果"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🔲 <strong>边缘几何体</strong> - EdgesGeometry 只显示模型边缘</li>
          <li>🕸️ <strong>线框几何体</strong> - WireframeGeometry 显示所有三角形边</li>
          <li>🔄 <strong>动态切换</strong> - 实时切换两种模式</li>
          <li>🎨 <strong>颜色控制</strong> - 自定义线框颜色</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 两种几何体对比：</h3>
        <ul>
          <li><strong>EdgesGeometry（边缘几何体）：</strong></li>
          <li style="margin-left: 20px">
            ✅ 只显示相邻面夹角大于阈值的边
          </li>
          <li style="margin-left: 20px">
            ✅ 线条更少，性能更好
          </li>
          <li style="margin-left: 20px">
            ✅ 适合显示物体的轮廓和主要边缘
          </li>
          <li style="margin-left: 20px">
            ✅ 常用于：建筑可视化、CAD 模型展示
          </li>
          <li style="margin-top: 8px">
            <strong>WireframeGeometry（线框几何体）：</strong>
          </li>
          <li style="margin-left: 20px">
            🕸️ 显示所有三角形的边
          </li>
          <li style="margin-left: 20px">
            🕸️ 线条更多，展示网格结构
          </li>
          <li style="margin-left: 20px">
            🕸️ 适合查看模型的拓扑结构
          </li>
          <li style="margin-left: 20px">
            🕸️ 常用于：模型调试、网格分析
          </li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔧 核心代码：</h3>
        <ul>
          <li><code>new THREE.EdgesGeometry(geometry)</code> - 创建边缘几何体</li>
          <li><code>new THREE.WireframeGeometry(geometry)</code> - 创建线框几何体</li>
          <li><code>new THREE.LineSegments(geometry, material)</code> - 创建线段对象</li>
          <li><code>mesh.updateWorldMatrix(true, true)</code> - 更新世界矩阵</li>
          <li><code>edges.matrix.copy(mesh.matrixWorld)</code> - 复制矩阵</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 矩阵变换说明：</h3>
        <ul>
          <li>📐 <strong>World Matrix</strong> - 物体在世界坐标系中的变换矩阵</li>
          <li>🔄 <strong>更新矩阵</strong> - 确保获取最新的位置、旋转、缩放</li>
          <li>📋 <strong>复制矩阵</strong> - 将原始网格的变换应用到线框</li>
          <li>🎯 <strong>分解矩阵</strong> - 将矩阵分解为位置、旋转（四元数）、缩放</li>
          <li>✨ 这样线框就能与原始模型完美对齐</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>🔧 矩阵变换代码：</p>
        <p style="margin-top: 8px; font-family: 'Courier New', monospace; font-size: 11px">
          mesh.updateWorldMatrix(true, true)<br>
          edges.matrix.copy(mesh.matrixWorld)<br>
          edges.matrix.decompose(edges.position, edges.quaternion, edges.scale)
        </p>
      </div>

      <div class="info-section">
        <h3>🎯 应用场景：</h3>
        <ul>
          <li>🏗️ <strong>建筑可视化</strong> - 显示建筑结构的线框轮廓</li>
          <li>🎨 <strong>艺术效果</strong> - 创建科技感的线框风格</li>
          <li>🔍 <strong>模型调试</strong> - 查看模型的拓扑结构</li>
          <li>📐 <strong>CAD 展示</strong> - 工程图纸的 3D 展示</li>
          <li>🎮 <strong>游戏场景</strong> - 未来科技、黑客帝国风格</li>
          <li>🔧 <strong>网格分析</strong> - 检查模型质量和三角面数</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚙️ 使用技巧：</h3>
        <ul>
          <li>💡 使用 GUI 面板切换不同的线框模式</li>
          <li>💡 调整线框颜色以适应不同的场景背景</li>
          <li>💡 EdgesGeometry 更适合展示，性能更好</li>
          <li>💡 WireframeGeometry 更适合调试和分析</li>
          <li>💡 可以隐藏原始模型，只显示线框</li>
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

  .code-tip p {
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.8;
  }
</style>
