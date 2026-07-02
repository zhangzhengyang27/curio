<!-- @ts-nocheck -->
<script setup>
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import gsap from "gsap"

  // 容器引用
  const containerRef = shallowRef(null)

  // 立方体引用
  let cube = null
  let animate1 = null

  // 使用封装的场景
  const { scene, camera, renderer, controls, startAnimation } = useThreeScene(containerRef, {
    fov: 75,
    cameraPosition: { x: 0, y: 0, z: 10 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05
    },
    showAxesHelper: true,
    axesHelperSize: 5,
    showGridHelper: false
  })

  /**
   * 初始化场景内容
   */
  const initContent = () => {
    if (!scene.value) return

    // 创建立方体几何体
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 })
    cube = new THREE.Mesh(cubeGeometry, cubeMaterial)

    // 设置初始旋转
    cube.rotation.set(Math.PI / 4, 0, 0, "XZY")

    // 将立方体添加到场景
    scene.value.add(cube)

    console.log("立方体已创建:", cube)
  }

  /**
   * 设置 GSAP 动画
   */
  const setupGsapAnimation = () => {
    if (!cube) return

    // 位置动画：左右移动
    animate1 = gsap.to(cube.position, {
      x: 5,
      duration: 5,
      ease: "power1.inOut",
      // 无限次循环
      repeat: -1,
      // 往返运动
      yoyo: true,
      // 延迟 2 秒开始
      delay: 2,
      onComplete: () => {
        console.log("动画完成")
      },
      onStart: () => {
        console.log("动画开始")
      }
    })

    // 旋转动画：360度旋转
    gsap.to(cube.rotation, {
      x: 2 * Math.PI,
      duration: 5,
      ease: "power1.inOut"
    })
  }

  /**
   * 处理双击事件：暂停/恢复动画
   */
  const handleDoubleClick = () => {
    if (!animate1) return

    if (animate1.isActive()) {
      // 暂停动画
      animate1.pause()
      console.log("动画已暂停")
    } else {
      // 恢复动画
      animate1.resume()
      console.log("动画已恢复")
    }
  }

  // 组件挂载后初始化
  onMounted(() => {
    // 等待场景初始化完成
    setTimeout(() => {
      // 初始化场景内容
      initContent()

      // 设置 GSAP 动画
      setupGsapAnimation()

      // 开始渲染循环
      startAnimation()

      // 添加双击事件监听
      window.addEventListener("dblclick", handleDoubleClick)
    }, 100)
  })

  // 组件卸载时清理
  onUnmounted(() => {
    // 移除双击事件监听
    window.removeEventListener("dblclick", handleDoubleClick)

    // 停止 GSAP 动画
    if (animate1) {
      animate1.kill()
    }

    // 清理几何体和材质
    if (cube) {
      cube.geometry.dispose()
      cube.material.dispose()
    }
  })
</script>

<template>
  <PageLayout
    title="GSAP 动画库"
    description="使用 GSAP 动画库实现流畅的补间动画效果"
  >
    <!-- 内容区域 -->
    <template #content>
      <div class="controls-tip">
        <p>🎬 双击屏幕：暂停/恢复动画</p>
      </div>

      <div class="features">
        <h3>🎯 动画效果</h3>
        <ul>
          <li>✅ 立方体左右移动（往返运动）</li>
          <li>✅ 立方体 360° 旋转</li>
          <li>✅ 延迟 2 秒后开始动画</li>
          <li>✅ 无限循环播放</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>📚 GSAP 核心特性</h3>
        <ul>
          <li>repeat: -1 - 无限循环</li>
          <li>yoyo: true - 往返运动</li>
          <li>delay: 2 - 延迟启动</li>
          <li>ease: "power1.inOut" - 缓动函数</li>
        </ul>
      </div>

      <p class="small-text">
        📌 使用鼠标拖拽可旋转视角，滚轮缩放
      </p>
    </template>

    <!-- 导航链接 -->
    <template #navigation>
      <router-link
        to="/base/tween-animation"
        class="link"
      >
        📊 对比 Tween.js
      </router-link>
    </template>

    <!-- Three.js 容器 -->
    <div
      ref="containerRef"
      class="three-container"
    />
  </PageLayout>
</template>

<style scoped>
  .three-container {
    width: 100%;
    height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
</style>
