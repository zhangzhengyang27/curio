<script setup lang="ts">
  import { onUnmounted, shallowRef, type ShallowRef } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 容器引用
  const containerRef: ShallowRef<HTMLDivElement | null> = shallowRef(null)

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
  let cube: THREE.Mesh
  let parentCube: THREE.Mesh
  let gui: GUI

  // GUI 事件对象
  interface EventObj {
    Fullscreen: () => void
    ExitFullscreen: () => void
  }

  // 颜色参数
  interface ColorParams {
    cubeColor: string
  }

  /**
   * 创建自定义几何体
   */
  const createGeometry = (): void => {
    if (!scene.value) return

    // 创建几何体
    const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1)

    // 创建材质
    const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    const parentMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    parentMaterial.wireframe = true

    // 创建网格
    parentCube = new THREE.Mesh(geometry, parentMaterial)
    cube = new THREE.Mesh(geometry, material)

    // 设置父立方体
    parentCube.add(cube)
    parentCube.position.set(-3, 0, 0)
    parentCube.rotation.x = Math.PI / 4

    // 设置子立方体
    cube.position.set(3, 0, 0)
    cube.rotation.x = Math.PI / 4

    // 将网格添加到场景中
    scene.value.add(parentCube)
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = (): void => {
    gui = new GUI()

    // 事件对象
    const eventObj: EventObj = {
      Fullscreen: () => {
        document.body.requestFullscreen()
        console.log("全屏")
      },
      ExitFullscreen: () => {
        document.exitFullscreen()
        console.log("退出全屏")
      }
    }

    // 添加全屏控制
    gui.add(eventObj, "Fullscreen").name("全屏")
    gui.add(eventObj, "ExitFullscreen").name("退出全屏")

    // 控制立方体的位置
    const folder = gui.addFolder("立方体位置")

    folder
      .add(cube.position, "x")
      .min(-10)
      .max(10)
      .step(1)
      .name("立方体x轴位置")
      .onChange((val: number) => {
        console.log("立方体x轴位置", val)
      })

    folder
      .add(cube.position, "y")
      .min(-10)
      .max(10)
      .step(1)
      .name("立方体y轴位置")
      .onFinishChange((val: number) => {
        console.log("立方体y轴位置", val)
      })

    folder.add(cube.position, "z").min(-10).max(10).step(1).name("立方体z轴位置")

    // 控制父元素线框模式
    const parentMaterial = parentCube.material as THREE.MeshBasicMaterial
    const wireframeParams: { wireframe: boolean } = {
      wireframe: !!parentMaterial.wireframe
    }
    gui
      .add(wireframeParams, "wireframe")
      .name("父元素线框模式")
      .onChange((val: boolean) => {
        parentMaterial.wireframe = val
      })

    // 控制立方体颜色
    const colorParams: ColorParams = {
      cubeColor: "#00ff00"
    }

    gui
      .addColor(colorParams, "cubeColor")
      .name("立方体颜色")
      .onChange((val: string) => {
        const cubeMaterial = cube.material as THREE.MeshBasicMaterial
        cubeMaterial.color!.set(val)
      })
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = (): void => {
    // 清理 GUI
    gui?.destroy()
    // 调用基础清理
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    createGeometry()
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
    title="🎛️ lil-gui 调试面板"
    description="使用右侧的 GUI 面板调试 3D 场景参数"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>✨ 实时调整立方体位置</li>
          <li>🎨 动态修改物体颜色</li>
          <li>📐 切换线框模式</li>
          <li>🖥️ 全屏/退出全屏</li>
        </ul>
      </div>
    </template>

    <!-- Three.js 容器 -->
    <div ref="containerRef" />
  </PageLayout>
</template>
