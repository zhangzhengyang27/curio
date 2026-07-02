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
  let spheres: THREE.Mesh[] = [] // 保存所有球体
  let boxHelper: THREE.Box3Helper | null = null // 合并后的包围盒辅助器
  let mergedBox: THREE.Box3 | null = null // 合并后的包围盒
  let mergedBoundingBoxInterval: ReturnType<typeof setInterval> | null = null

  /**
   * 创建三个小球
   */
  const createSpheres = () => {
    if (!scene.value) return

    // 球体 1 - 红色（左侧）
    const sphere1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
    sphere1.position.x = -3
    sphere1.name = "红色球体"
    scene.value.add(sphere1)
    spheres.push(sphere1)

    // 球体 2 - 绿色（中间）
    const sphere2 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), new THREE.MeshBasicMaterial({ color: 0x00ff00 }))
    sphere2.position.x = 0
    sphere2.name = "绿色球体"
    scene.value.add(sphere2)
    spheres.push(sphere2)

    // 球体 3 - 蓝色（右侧）
    const sphere3 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), new THREE.MeshBasicMaterial({ color: 0x0000ff }))
    sphere3.position.x = 3
    sphere3.name = "蓝色球体"
    scene.value.add(sphere3)
    spheres.push(sphere3)

    console.log("三个球体已创建")
  }

  /**
   * 创建合并的包围盒
   */
  const createMergedBoundingBox = () => {
    if (!scene.value) return

    // 创建一个空的包围盒用于合并
    mergedBox = new THREE.Box3()

    // 遍历所有球体，合并它们的包围盒
    for (let i = 0; i < spheres.length; i++) {
      // 方法一：手动计算包围盒并转换到世界坐标系
      // spheres[i].geometry.computeBoundingBox()
      // let box3 = spheres[i].geometry.boundingBox.clone()
      // spheres[i].updateWorldMatrix(true, true)
      // box3.applyMatrix4(spheres[i].matrixWorld)

      // 方法二：使用 setFromObject 直接获取世界坐标系的包围盒（推荐）
      const box3 = new THREE.Box3().setFromObject(spheres[i])

      // 合并包围盒
      mergedBox.union(box3)

      console.log(`球体 ${i + 1} 的包围盒:`, box3)
    }

    console.log("合并后的包围盒:", mergedBox)

    // 获取包围盒中心点
    const center = mergedBox.getCenter(new THREE.Vector3())
    console.log("包围盒中心点:", center)

    // 获取包围盒尺寸
    const size = mergedBox.getSize(new THREE.Vector3())
    console.log("包围盒尺寸:", size)

    // 创建包围盒辅助器（黄色线框）
    boxHelper = new THREE.Box3Helper(mergedBox, 0xffff00)
    scene.value.add(boxHelper)
  }

  /**
   * 更新合并的包围盒
   * 当球体位置改变时调用此方法
   */
  const updateMergedBoundingBox = () => {
    if (!scene.value || !mergedBox) return

    // 保存旧的可见性状态
    const wasVisible = boxHelper ? boxHelper.visible : true

    // 重新创建一个空的包围盒
    mergedBox = new THREE.Box3()

    // 重新合并所有球体的包围盒
    for (let i = 0; i < spheres.length; i++) {
      const box3 = new THREE.Box3().setFromObject(spheres[i])
      mergedBox.union(box3)
    }

    // 移除旧的辅助器
    if (boxHelper) {
      scene.value.remove(boxHelper)
    }

    // 创建新的辅助器，并恢复可见性状态
    boxHelper = new THREE.Box3Helper(mergedBox, 0xffff00)
    boxHelper.visible = wasVisible
    scene.value.add(boxHelper)

    console.log("包围盒已更新")
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    // 球体控制
    spheres.forEach((sphere, _index) => {
      const folder = gui.addFolder(`${sphere.name}`)

      folder
        .add(sphere.position, "x")
        .min(-10)
        .max(10)
        .step(0.1)
        .name("X 轴位置")
        .onChange(() => {
          updateMergedBoundingBox()
        })

      folder
        .add(sphere.position, "y")
        .min(-10)
        .max(10)
        .step(0.1)
        .name("Y 轴位置")
        .onChange(() => {
          updateMergedBoundingBox()
        })

      folder
        .add(sphere.position, "z")
        .min(-10)
        .max(10)
        .step(0.1)
        .name("Z 轴位置")
        .onChange(() => {
          updateMergedBoundingBox()
        })

      folder.add(sphere, "visible").name("显示/隐藏")
    })

    // 包围盒控制
    const boxFolder = gui.addFolder("合并包围盒控制")

    const boxParams = {
      showBox: true, // 控制包围盒可见性
      updateBox: () => {
        updateMergedBoundingBox()
      },
      resetPositions: () => {
        spheres[0].position.set(-3, 0, 0)
        spheres[1].position.set(0, 0, 0)
        spheres[2].position.set(3, 0, 0)
        updateMergedBoundingBox()
      }
    }

    boxFolder
      .add(boxParams, "showBox")
      .name("显示包围盒")
      .onChange((value) => {
        if (boxHelper) {
          boxHelper.visible = value
        }
      })

    boxFolder.add(boxParams, "updateBox").name("🔄 更新包围盒")
    boxFolder.add(boxParams, "resetPositions").name("♻️ 重置位置")

    // 包围盒信息
    const infoFolder = gui.addFolder("包围盒信息")
    const info = {
      center: "计算中...",
      size: "计算中...",
      sphereCount: spheres.length
    }

    infoFolder.add(info, "center").name("中心点").listen()
    infoFolder.add(info, "size").name("尺寸").listen()
    infoFolder.add(info, "sphereCount").name("球体数量")

    // 实时更新信息
    mergedBoundingBoxInterval = setInterval(() => {
      if (mergedBox) {
        const center = mergedBox.getCenter(new THREE.Vector3())
        const size = mergedBox.getSize(new THREE.Vector3())
        info.center = `(${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`
        info.size = `${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}`
      }
    }, 100)
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理定时器
    if (mergedBoundingBoxInterval) {
      clearInterval(mergedBoundingBoxInterval)
      mergedBoundingBoxInterval = null
    }

    // 清理包围盒辅助器
    if (boxHelper) {
      scene.value?.remove(boxHelper)
      boxHelper = null
    }

    // 清理球体
    spheres.forEach((sphere) => {
      sphere.geometry?.dispose()
      const mat = sphere.material as THREE.Material
      mat.dispose()
      scene.value?.remove(sphere)
    })
    spheres = []

    // 清理 GUI
    gui?.destroy()

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    createSpheres()
    createMergedBoundingBox()
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
    title="📦 几何体合并包围盒"
    description="学习如何合并多个物体的包围盒，创建一个包含所有物体的统一包围盒"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🎨 <strong>多个球体</strong> - 三个不同颜色的球体</li>
          <li>📦 <strong>包围盒合并</strong> - 使用 Box3.union() 合并包围盒</li>
          <li>🔄 <strong>动态更新</strong> - 移动球体时自动更新合并包围盒</li>
          <li>📊 <strong>实时信息</strong> - 显示包围盒的中心点和尺寸</li>
          <li>🎮 <strong>交互控制</strong> - 使用 GUI 调整球体位置</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 包围盒合并说明：</h3>
        <ul>
          <li><strong>单个包围盒</strong> - 每个物体都有自己的包围盒</li>
          <li><strong>合并操作</strong> - 使用 <code>box.union(otherBox)</code> 合并</li>
          <li><strong>结果</strong> - 得到一个能包含所有物体的最小包围盒</li>
          <li><strong>应用场景</strong> - 场景优化、碰撞检测、视锥剔除</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔧 两种方法对比：</h3>
        <ul>
          <li><strong>方法一（手动计算）：</strong></li>
          <li style="margin-left: 20px">
            1️⃣ 调用 <code>geometry.computeBoundingBox()</code>
          </li>
          <li style="margin-left: 20px">
            2️⃣ 获取 <code>geometry.boundingBox</code>
          </li>
          <li style="margin-left: 20px">
            3️⃣ 使用 <code>updateWorldMatrix()</code> 更新矩阵
          </li>
          <li style="margin-left: 20px">
            4️⃣ 使用 <code>applyMatrix4()</code> 转换到世界坐标系
          </li>
          <li style="margin-top: 8px">
            <strong>方法二（推荐）：</strong>
          </li>
          <li style="margin-left: 20px">
            ✅ 直接使用 <code>new Box3().setFromObject(object)</code>
          </li>
          <li style="margin-left: 20px">
            ✅ 自动处理世界坐标系转换
          </li>
          <li style="margin-left: 20px">
            ✅ 代码更简洁，更不容易出错
          </li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 应用场景：</h3>
        <ul>
          <li>🎮 <strong>场景管理</strong> - 计算整个场景的边界</li>
          <li>🎯 <strong>碰撞检测</strong> - 粗略碰撞检测优化</li>
          <li>👁️ <strong>视锥剔除</strong> - 判断物体组是否在视野内</li>
          <li>📷 <strong>相机适配</strong> - 自动调整相机位置以查看所有物体</li>
          <li>🔍 <strong>选择框</strong> - 3D 建模软件的多选功能</li>
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
