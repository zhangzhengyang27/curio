<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 容器引用
  const containerRef = shallowRef(null)

  // 使用公共的 Three.js 场景逻辑
  const {
    scene,
    camera,
    renderer,
    startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 2, y: 2, z: 15 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05
    },
    showAxesHelper: true
  })

  // Three.js 对象引用
  let gui!: GUI
  let spheres: THREE.Mesh[] = [] // 保存球体引用
  let raycaster!: THREE.Raycaster // 射线投射器
  let mouse!: THREE.Vector2 // 鼠标位置
  let raycasterInterval: ReturnType<typeof setInterval> | null = null

  /**
   * 创建三个球体
   */
  const createSpheres = () => {
    if (!scene.value) return

    // 球体 1 - 绿色（左侧）
    const sphere1 = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x00ff00
      })
    )
    sphere1.position.x = -4
    sphere1.name = "球体1"
    scene.value.add(sphere1)
    spheres.push(sphere1)

    // 球体 2 - 蓝色（中间）
    const sphere2 = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x0000ff
      })
    )
    sphere2.name = "球体2"
    scene.value.add(sphere2)
    spheres.push(sphere2)

    // 球体 3 - 紫色（右侧）
    const sphere3 = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xff00ff
      })
    )
    sphere3.position.x = 4
    sphere3.name = "球体3"
    scene.value.add(sphere3)
    spheres.push(sphere3)

    console.log("场景子对象:", scene.value.children)
  }

  /**
   * 初始化光线投射
   */
  const initRaycaster = () => {
    // 创建射线投射器
    raycaster = new THREE.Raycaster()
    // 创建鼠标向量
    mouse = new THREE.Vector2()
  }

  /**
   * 处理鼠标点击事件
   */
  const handleClick = (event: MouseEvent) => {
    if (!camera.value || !renderer.value) return

    console.log("鼠标点击位置:", event.clientX, event.clientY)

    // 将鼠标位置归一化为设备坐标 (-1 到 +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -((event.clientY / window.innerHeight) * 2 - 1)

    console.log("归一化坐标:", mouse.x, mouse.y)

    // 通过相机和鼠标位置更新射线
    raycaster.setFromCamera(mouse, camera.value)

    // 计算物体和射线的交点
    const intersects = raycaster.intersectObjects(spheres)

    console.log("相交物体:", intersects)

    if (intersects.length > 0) {
      const object = intersects[0].object as THREE.Mesh
      const material = object.material as THREE.MeshBasicMaterial

      // 切换选中状态
      if ((object as any)._isSelect) {
        // 如果已选中，恢复原始颜色
        console.log("取消选中，恢复颜色:", (object as any)._originColor)
        material.color!.set((object as any)._originColor)
        ;(object as any)._isSelect = false
      } else {
        // 如果未选中，保存原始颜色并设置为红色
        ;(object as any)._isSelect = true
        ;(object as any)._originColor = material.color!.getHex()
        material.color!.set(0xff0000)
        console.log(`选中 ${object.name}，原始颜色:`, (object as any)._originColor)
      }
    }
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    // 球体控制文件夹
    const spheresFolder = gui.addFolder("球体控制")

    spheres.forEach((sphere, index) => {
      const folder = spheresFolder.addFolder(`球体 ${index + 1}`)

      // 位置控制
      folder.add(sphere.position, "x").min(-10).max(10).step(0.1).name("X 轴位置")
      folder.add(sphere.position, "y").min(-10).max(10).step(0.1).name("Y 轴位置")
      folder.add(sphere.position, "z").min(-10).max(10).step(0.1).name("Z 轴位置")

      // 缩放控制
      folder
        .add(sphere.scale, "x")
        .min(0.1)
        .max(3)
        .step(0.1)
        .name("缩放")
        .onChange((value) => {
          sphere.scale.set(value, value, value)
        })

      // 颜色控制
      const sphereMaterial = sphere.material as THREE.MeshBasicMaterial
      const colorParams = {
        color: sphereMaterial.color!.getHex()
      }

      folder
        .addColor(colorParams, "color")
        .name("颜色")
        .onChange((value: number) => {
          sphereMaterial.color!.setHex(value)
          // 更新原始颜色
          ;(sphere as any)._originColor = value
        })

      // 可见性控制
      folder.add(sphere, "visible").name("显示")

      // 重置按钮
      const resetParams = {
        reset: () => {
          ;(sphere as any)._isSelect = false
          sphereMaterial.color!.setHex((sphere as any)._originColor || colorParams.color)
        }
      }
      folder.add(resetParams, "reset").name("重置选中状态")
    })

    // 射线投射信息
    const infoFolder = gui.addFolder("射线投射信息")
    const info = {
      selectedCount: 0,
      totalSpheres: spheres.length,
      tip: "点击球体进行交互"
    }

    infoFolder.add(info, "selectedCount").name("已选中数量").listen()
    infoFolder.add(info, "totalSpheres").name("球体总数")

    // 更新选中数量
    raycasterInterval = setInterval(() => {
      info.selectedCount = spheres.filter((s) => (s as any)._isSelect).length
    }, 100)

    // 全局控制
    const globalFolder = gui.addFolder("全局控制")
    const globalParams = {
      resetAll: () => {
        spheres.forEach((sphere) => {
          const mat = sphere.material as THREE.MeshBasicMaterial
          ;(sphere as any)._isSelect = false
          mat.color!.setHex((sphere as any)._originColor || 0xffffff)
        })
      },
      selectAll: () => {
        spheres.forEach((sphere) => {
          const mat = sphere.material as THREE.MeshBasicMaterial
          if (!(sphere as any)._isSelect) {
            ;(sphere as any)._isSelect = true
            ;(sphere as any)._originColor = mat.color!.getHex()
            mat.color!.set(0xff0000)
          }
        })
      }
    }

    globalFolder.add(globalParams, "resetAll").name("重置所有")
    globalFolder.add(globalParams, "selectAll").name("全部选中")
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 清理定时器
    if (raycasterInterval) {
      clearInterval(raycasterInterval)
      raycasterInterval = null
    }

    // 移除点击事件监听
    window.removeEventListener("click", handleClick)

    // 清理球体
    spheres.forEach((sphere) => {
      sphere.geometry.dispose()
      const mat = sphere.material as THREE.MeshBasicMaterial
      mat.dispose()
    })
    spheres = []

    gui?.destroy()
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    createSpheres()
    initRaycaster()
    initGUI()
    startAnimation()
  })

  // 生命周期 - 添加点击事件监听
  onMounted(() => {
    // 延迟添加事件监听，确保场景已初始化
    setTimeout(() => {
      window.addEventListener("click", handleClick)
    }, 100)
  })

  // 生命周期 - 移除事件监听
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🎯 光线投射实现 3D 物体交互"
    description="使用 Raycaster 实现鼠标点击与 3D 物体的交互"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🎯 <strong>光线投射</strong> - Raycaster 射线投射检测</li>
          <li>🖱️ <strong>鼠标交互</strong> - 点击物体改变颜色</li>
          <li>🔄 <strong>状态切换</strong> - 点击切换选中/取消选中</li>
          <li>🎨 <strong>颜色管理</strong> - 自动保存和恢复原始颜色</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔧 实现步骤：</h3>
        <ul>
          <li>1️⃣ 创建 Raycaster 和鼠标向量</li>
          <li>2️⃣ 监听鼠标点击事件</li>
          <li>3️⃣ 将鼠标坐标归一化（X: -1 到 1, Y: -1 到 1）</li>
          <li>4️⃣ 使用 setFromCamera 更新射线</li>
          <li>5️⃣ 使用 intersectObjects 检测交点</li>
          <li>6️⃣ 根据检测结果执行交互逻辑</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>🔧 核心代码：</p>
        <p style="margin-top: 8px">
          归一化坐标：<code style="background: rgba(0, 0, 0, 0.3); padding: 2px 6px; border-radius: 3px">mouse.x = (clientX / width) * 2 - 1</code>
        </p>
        <p style="margin-top: 4px">
          更新射线：<code style="background: rgba(0, 0, 0, 0.3); padding: 2px 6px; border-radius: 3px">raycaster.setFromCamera(mouse, camera)</code>
        </p>
        <p style="margin-top: 4px">
          检测交点：<code style="background: rgba(0, 0, 0, 0.3); padding: 2px 6px; border-radius: 3px">raycaster.intersectObjects(objects)</code>
        </p>
      </div>

      <div class="info-section">
        <h3>📚 应用场景：</h3>
        <ul>
          <li>🎮 3D 游戏中的物体选择</li>
          <li>🏗️ 建筑可视化的交互标注</li>
          <li>🛒 电商 3D 产品展示的交互</li>
          <li>🎨 3D 建模工具的选择功能</li>
          <li>🗺️ 地图应用的点击定位</li>
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

  /* 添加鼠标悬停提示 */
  :deep(canvas) {
    cursor: pointer;
  }
</style>
