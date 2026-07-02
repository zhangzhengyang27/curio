<script setup lang="ts">
  import { shallowRef, type ShallowRef } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  // 容器引用
  const containerRef: ShallowRef<HTMLDivElement | null> = shallowRef(null)

  // 使用公共的 Three.js 场景逻辑
  const { scene, startAnimation, onSceneReady } = useThreeScene(containerRef, {
    cameraPosition: { x: 2, y: 2, z: 5 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 2,
      maxDistance: 10
    },
    showAxesHelper: true,
    showGridHelper: true
  })

  // 立方体
  let cube: THREE.Mesh

  /**
   * 创建立方体
   */
  const createCube = (): void => {
    if (!scene.value) return

    // 创建立方体几何体
    const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1)
    const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    cube = new THREE.Mesh(geometry, material)
    scene.value.add(cube)

    // 添加边框线
    const edges: THREE.EdgesGeometry = new THREE.EdgesGeometry(geometry)
    const lineMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({ color: 0xffffff })
    const wireframe: THREE.LineSegments = new THREE.LineSegments(edges, lineMaterial)
    cube.add(wireframe)
  }

  /**
   * 动画回调
   */
  const animateCallback = (): void => {
    if (cube) {
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01
    }
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    createCube()
    startAnimation(animateCallback)
  })
</script>

<template>
  <PageLayout
    title="Three.js 旋转立方体"
    description="这是一个简单的 Three.js 示例"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="controls-tip">
        <p>💡 <strong>控制提示：</strong></p>
        <ul>
          <li>🖱️ 左键拖动：旋转视角</li>
          <li>🖱️ 右键拖动：平移视角</li>
          <li>⚙️ 滚轮：缩放视图</li>
        </ul>
      </div>
    </template>

    <!-- Three.js 容器 -->
    <div ref="containerRef" />
  </PageLayout>
</template>
