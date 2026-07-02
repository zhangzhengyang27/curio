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

  // Three.js 对象引用
  let box!: THREE.Mesh
  let gui!: GUI

  const createBox = () => {
    if (!scene.value) return

    // 创建长方体几何体 (宽, 高, 深度)
    const boxGeometry = new THREE.BoxGeometry(1, 1, 100)

    // 创建基础材质
    const boxMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00 // 绿色
    })

    // 创建网格
    box = new THREE.Mesh(boxGeometry, boxMaterial)

    // 添加到场景
    scene.value.add(box)
  }

  /**
   * 创建雾效果
   */
  const createFog = () => {
    if (!scene.value) return

    // 创建线性雾 (颜色, 近距离, 远距离)
    scene.value.fog = new THREE.Fog(0x999999, 0.1, 50)

    // 设置场景背景色与雾颜色一致
    scene.value.background = new THREE.Color(0x999999)
  }

  const initGUI = () => {
    gui = new GUI()

    // 雾效果参数
    const fogParams = {
      type: "Fog", // 雾类型
      color: 0x999999,
      near: 0.1,
      far: 50,
      density: 0.1 // 指数雾密度
    }

    // 雾类型选择
    gui
      .add(fogParams, "type", ["Fog", "FogExp2"])
      .name("雾类型")
      .onChange((value: string) => {
        if (!scene.value) return
        if (value === "Fog") {
          // 线性雾
          scene.value.fog = new THREE.Fog(fogParams.color, fogParams.near, fogParams.far)
        } else {
          // 指数雾
          scene.value.fog = new THREE.FogExp2(fogParams.color, fogParams.density)
        }
        updateGUIControls(value)
      })

    // 雾颜色控制
    gui
      .addColor(fogParams, "color")
      .name("雾颜色")
      .onChange((value: number) => {
        if (!scene.value || !scene.value.fog) return
        scene.value.fog.color.setHex(value)
        if (scene.value.background instanceof THREE.Color) {
          scene.value.background.setHex(value)
        }
      })

    // 线性雾参数控制
    const fogFolder = gui.addFolder("线性雾参数 (Fog)")
    fogFolder
      .add(fogParams, "near")
      .min(0.1)
      .max(10)
      .step(0.1)
      .name("近距离 (near)")
      .onChange((value: number) => {
        if (scene.value && scene.value.fog && scene.value.fog instanceof THREE.Fog) {
          scene.value.fog.near = value
        }
      })

    fogFolder
      .add(fogParams, "far")
      .min(10)
      .max(100)
      .step(1)
      .name("远距离 (far)")
      .onChange((value: number) => {
        if (scene.value && scene.value.fog && scene.value.fog instanceof THREE.Fog) {
          scene.value.fog.far = value
        }
      })

    // 指数雾参数控制
    const fogExp2Folder = gui.addFolder("指数雾参数 (FogExp2)")
    fogExp2Folder.close() // 默认关闭

    fogExp2Folder
      .add(fogParams, "density")
      .min(0.001)
      .max(0.2)
      .step(0.001)
      .name("密度 (density)")
      .onChange((value: number) => {
        if (scene.value && scene.value.fog && scene.value.fog instanceof THREE.FogExp2) {
          scene.value.fog.density = value
        }
      })

    // 长方体位置控制
    const boxFolder = gui.addFolder("长方体控制")
    boxFolder.add(box.position, "x").min(-5).max(5).step(0.1).name("X 轴位置")

    boxFolder.add(box.position, "y").min(-5).max(5).step(0.1).name("Y 轴位置")

    boxFolder.add(box.position, "z").min(-50).max(50).step(1).name("Z 轴位置")

    // 长方体旋转控制
    boxFolder.add(box.rotation, "x").min(-Math.PI).max(Math.PI).step(0.01).name("X 轴旋转")

    boxFolder.add(box.rotation, "y").min(-Math.PI).max(Math.PI).step(0.01).name("Y 轴旋转")

    boxFolder.add(box.rotation, "z").min(-Math.PI).max(Math.PI).step(0.01).name("Z 轴旋转")

    // 保存文件夹引用以便切换
    ;(gui as any).__fogFolder = fogFolder
    ;(gui as any).__fogExp2Folder = fogExp2Folder
  }

  /**
   * 更新 GUI 控制器显示
   */
  const updateGUIControls = (fogType: string) => {
    if (fogType === "Fog") {
      ;(gui as any).__fogFolder.open()
      ;(gui as any).__fogExp2Folder.close()
    } else {
      ;(gui as any).__fogFolder.close()
      ;(gui as any).__fogExp2Folder.open()
    }
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
    createBox()
    createFog()
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
    title="🌫️ 指数雾与线性雾"
    description="学习 Three.js 中的两种雾效果：线性雾 (Fog) 和指数雾 (FogExp2)"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>雾效果类型：</h3>
        <ul>
          <li>🌫️ <strong>线性雾 (Fog)</strong> - 雾的浓度线性增加</li>
          <li>💨 <strong>指数雾 (FogExp2)</strong> - 雾的浓度指数增加</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📝 参数说明：</h3>
        <ul>
          <li><strong>线性雾 (Fog)</strong>：</li>
          <li style="margin-left: 20px">
            • near - 雾开始的最近距离
          </li>
          <li style="margin-left: 20px">
            • far - 雾结束的最远距离
          </li>
          <li style="margin-left: 20px">
            • 雾的浓度在 near 和 far 之间线性增加
          </li>
          <li style="margin-top: 10px">
            <strong>指数雾 (FogExp2)</strong>：
          </li>
          <li style="margin-left: 20px">
            • density - 雾的密度系数
          </li>
          <li style="margin-left: 20px">
            • 雾的浓度随距离指数增长
          </li>
          <li style="margin-left: 20px">
            • 更接近真实世界的雾效果
          </li>
        </ul>
      </div>

      <div class="controls-tip">
        <p>💡 使用提示：</p>
        <ul>
          <li>使用右侧 GUI 面板切换雾类型</li>
          <li>调整雾参数观察效果变化</li>
          <li>移动长方体到不同距离观察雾效果</li>
          <li>线性雾适合需要精确控制的场景</li>
          <li>指数雾更接近现实效果</li>
          <li>鼠标拖拽旋转视角，滚轮缩放</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>🔧 实现代码：</p>
        <p style="margin-top: 8px">
          线性雾：<code style="background: rgba(0, 0, 0, 0.3); padding: 2px 6px; border-radius: 3px">scene.fog = new THREE.Fog(color, near, far)</code>
        </p>
        <p style="margin-top: 4px">
          指数雾：<code style="background: rgba(0, 0, 0, 0.3); padding: 2px 6px; border-radius: 3px">scene.fog = new THREE.FogExp2(color, density)</code>
        </p>
      </div>
    </template>

    <!-- Three.js 容器 -->
    <div ref="containerRef" />
  </PageLayout>
</template>

<style scoped>
  /* 组件特定样式可以在这里添加 */
</style>
