<script setup lang="ts">
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import * as TWEEN from "three/examples/jsm/libs/tween.module.js"
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
  let sphere1!: THREE.Mesh
  let tween!: TWEEN.Tween<THREE.Vector3>
  let tween2!: TWEEN.Tween<THREE.Vector3>

  /**
   * 创建球体
   */
  const createSphere = () => {
    if (!scene.value) return

    // 创建绿色球体
    sphere1 = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x00ff00
      })
    )
    sphere1.position.x = -4
    scene.value.add(sphere1)

    console.log("球体已创建，初始位置:", sphere1.position)
  }

  /**
   * 初始化补间动画
   */
  const initTween = () => {
    // 创建从左到右的补间动画
    tween = new TWEEN.Tween(sphere1.position)
    tween.to({ x: 4 }, 1000) // 1秒内移动到 x = 4
    tween.easing(TWEEN.Easing.Quadratic.InOut) // 设置缓动函数

    // 创建从右到左的补间动画
    tween2 = new TWEEN.Tween(sphere1.position)
    tween2.to({ x: -4 }, 1000) // 1秒内移动到 x = -4

    // 链接两个动画，形成循环
    tween.chain(tween2)
    tween2.chain(tween)

    // 添加动画事件监听
    tween.onStart(() => {
      console.log("动画开始")
    })

    tween.onUpdate(() => {
      // console.log("动画更新:", sphere1.position.x)
    })

    tween.onComplete(() => {
      console.log("动画完成")
    })

    tween.onStop(() => {
      console.log("动画停止")
    })

    // 启动补间动画
    tween.start()

    console.log("补间动画已初始化并启动")
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()

    // 球体控制
    const sphereFolder = gui.addFolder("球体控制")
    sphereFolder.add(sphere1.position, "x").min(-10).max(10).step(0.1).name("X 轴位置").listen()
    sphereFolder.add(sphere1.position, "y").min(-10).max(10).step(0.1).name("Y 轴位置")
    sphereFolder.add(sphere1.position, "z").min(-10).max(10).step(0.1).name("Z 轴位置")

    // 颜色控制
    const colorParams = {
      color: 0x00ff00
    }
    sphereFolder
      .addColor(colorParams, "color")
      .name("球体颜色")
      .onChange((value: number) => {
        const material = sphere1.material as THREE.MeshBasicMaterial
        material.color!.setHex(value)
      })

    // 动画控制
    const animationFolder = gui.addFolder("动画控制")

    const animParams = {
      start: () => {
        console.log("启动动画")
        tween.start()
      },
      stop: () => {
        console.log("停止动画")
        tween.stop()
        tween2.stop()
      },
      reset: () => {
        console.log("重置位置")
        tween.stop()
        tween2.stop()
        sphere1.position.x = -4
      },
      speed: 1000, // 动画速度（毫秒）
      updateSpeed: () => {
        console.log("更新动画速度:", animParams.speed)
        // 停止当前动画
        tween.stop()
        tween2.stop()
        // 重新创建动画并应用新速度
        tween = new TWEEN.Tween(sphere1.position)
        tween.to({ x: 4 }, animParams.speed)
        tween.easing(TWEEN.Easing.Quadratic.InOut)

        tween2 = new TWEEN.Tween(sphere1.position)
        tween2.to({ x: -4 }, animParams.speed)

        tween.chain(tween2)
        tween2.chain(tween)
        tween.start()
      }
    }

    animationFolder.add(animParams, "start").name("▶️ 启动")
    animationFolder.add(animParams, "stop").name("⏸️ 停止")
    animationFolder.add(animParams, "reset").name("🔄 重置")
    animationFolder.add(animParams, "speed").min(100).max(5000).step(100).name("动画速度(ms)")
    animationFolder.add(animParams, "updateSpeed").name("🔧 应用速度")

    // 缓动函数选择
    const easingFolder = gui.addFolder("缓动函数")
    const easingParams = {
      easing: "Quadratic.InOut",
      applyEasing: () => {
        console.log("应用缓动函数:", easingParams.easing)
        tween.stop()
        tween2.stop()

        // 根据选择的缓动函数创建新动画
        const easingFunc = getEasingFunction(easingParams.easing)

        tween = new TWEEN.Tween(sphere1.position)
        tween.to({ x: 4 }, animParams.speed)
        tween.easing(easingFunc)

        tween2 = new TWEEN.Tween(sphere1.position)
        tween2.to({ x: -4 }, animParams.speed)
        tween2.easing(easingFunc)

        tween.chain(tween2)
        tween2.chain(tween)
        tween.start()
      }
    }

    easingFolder
      .add(easingParams, "easing", [
        "Linear.None",
        "Quadratic.In",
        "Quadratic.Out",
        "Quadratic.InOut",
        "Cubic.In",
        "Cubic.Out",
        "Cubic.InOut",
        "Quartic.In",
        "Quartic.Out",
        "Quartic.InOut",
        "Quintic.In",
        "Quintic.Out",
        "Quintic.InOut",
        "Sinusoidal.In",
        "Sinusoidal.Out",
        "Sinusoidal.InOut",
        "Exponential.In",
        "Exponential.Out",
        "Exponential.InOut",
        "Circular.In",
        "Circular.Out",
        "Circular.InOut",
        "Elastic.In",
        "Elastic.Out",
        "Elastic.InOut",
        "Back.In",
        "Back.Out",
        "Back.InOut",
        "Bounce.In",
        "Bounce.Out",
        "Bounce.InOut"
      ])
      .name("缓动类型")

    easingFolder.add(easingParams, "applyEasing").name("🎨 应用缓动")

    console.log("GUI 调试面板已初始化")
  }

  /**
   * 获取缓动函数
   */
  const getEasingFunction = (easingName: string) => {
    const parts = easingName.split(".")
    return (TWEEN.Easing as Record<string, any>)[parts[0]][parts[1]]
  }

  /**
   * 自定义动画循环
   */
  const customAnimate = () => {
    // 更新 TWEEN
    TWEEN.update()
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
    // 停止补间动画
    if (tween) tween.stop()
    if (tween2) tween2.stop()

    // 清理球体
    if (sphere1) {
      sphere1.geometry.dispose()
      const material = sphere1.material as THREE.MeshBasicMaterial
      material.dispose()
    }

    // 清理 GUI
    gui?.destroy()

    // 调用基础清理
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    createSphere()
    initTween()
    initGUI()
    // 启动动画循环，并传入自定义回调
    startAnimation(customAnimate)
  })

  // 组件卸载时清理
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🎬 Tween.js 补间动画"
    description="使用 Tween.js 实现流畅的补间动画效果"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🎬 <strong>补间动画</strong> - Tween.js 补间动画库</li>
          <li>🔄 <strong>循环动画</strong> - 链式动画循环播放</li>
          <li>⚡ <strong>缓动函数</strong> - 多种缓动效果可选</li>
          <li>🎮 <strong>动画控制</strong> - 启动/停止/重置动画</li>
          <li>⚙️ <strong>速度调节</strong> - 实时调整动画速度</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🔧 实现步骤：</h3>
        <ul>
          <li>1️⃣ 导入 Tween.js 库</li>
          <li>2️⃣ 创建 Tween 对象并设置目标属性</li>
          <li>3️⃣ 设置缓动函数（easing）</li>
          <li>4️⃣ 使用 chain() 链接多个动画</li>
          <li>5️⃣ 在动画循环中调用 TWEEN.update()</li>
          <li>6️⃣ 使用事件监听器监控动画状态</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📚 缓动函数类型：</h3>
        <ul>
          <li>🔹 <strong>Linear</strong> - 线性匀速</li>
          <li>🔹 <strong>Quadratic</strong> - 二次方缓动</li>
          <li>🔹 <strong>Cubic</strong> - 三次方缓动</li>
          <li>🔹 <strong>Sinusoidal</strong> - 正弦曲线缓动</li>
          <li>🔹 <strong>Exponential</strong> - 指数曲线缓动</li>
          <li>🔹 <strong>Circular</strong> - 圆形曲线缓动</li>
          <li>🔹 <strong>Elastic</strong> - 弹性缓动</li>
          <li>🔹 <strong>Back</strong> - 回退缓动</li>
          <li>🔹 <strong>Bounce</strong> - 弹跳缓动</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎯 应用场景：</h3>
        <ul>
          <li>📱 UI 动画效果</li>
          <li>🎮 游戏角色移动</li>
          <li>📊 数据可视化动画</li>
          <li>🎨 相机运动路径</li>
          <li>🌟 粒子动画效果</li>
        </ul>
      </div>
    </template>

    <!-- Three.js 容器 -->
    <div ref="containerRef" />
  </PageLayout>
</template>

<style scoped>
  code {
    background: rgba(0, 0, 0, 0.3);
    padding: 2px 6px;
    border-radius: 3px;
    font-family: "Courier New", monospace;
    font-size: 11px;
    color: #42b983;
  }
</style>
