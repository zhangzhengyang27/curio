<script setup>
  import { shallowRef, onMounted, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"

  const containerRef = shallowRef(null)
  let gui = null
  let particleSystem = null
  let particleData = []

  const params = {
    count: 2000,
    speed: 1,
    spread: 2,
    mode: 0 // 0=上升, 1=扩散, 2=旋涡
  }

  const modeNames = ["🔥 上升", "💨 扩散", "🌀 旋涡"]

  const { scene, camera: _camera, renderer: _renderer, controls: _controls, startAnimation, dispose: baseDispose } =
    useThreeScene(containerRef, {
      fov: 60,
      cameraPosition: { x: 0, y: 5, z: 12 },
      enableControls: true,
      controlsConfig: { enableDamping: true, dampingFactor: 0.05 },
      showAxesHelper: false
    })

  const initParticleData = (count) => {
    particleData = []
    for (let i = 0; i < count; i++) {
      particleData.push({
        life: Math.random(), // 0-1 生命周期
        maxLife: 0.5 + Math.random() * 1.5,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          0.01 + Math.random() * 0.03,
          (Math.random() - 0.5) * 0.02
        ),
        baseSize: 3 + Math.random() * 5
      })
    }
  }

  const createParticleSystem = () => {
    if (!scene.value) return
    if (particleSystem) {
      scene.value.remove(particleSystem)
      particleSystem.geometry.dispose()
      particleSystem.material.dispose()
    }

    initParticleData(params.count)

    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(params.count * 3)
    const colors = new Float32Array(params.count * 3)
    const sizes = new Float32Array(params.count)

    // 初始化粒子位置（底部随机分布）
    for (let i = 0; i < params.count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * params.spread * 2
      positions[i * 3 + 1] = Math.random() * 10 - 2
      positions[i * 3 + 2] = (Math.random() - 0.5) * params.spread * 2
      sizes[i] = particleData[i].baseSize
      // 暖色渐变
      const t = Math.random()
      colors[i * 3] = 1
      colors[i * 3 + 1] = 0.3 + t * 0.5
      colors[i * 3 + 2] = t * 0.2
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    })

    particleSystem = new THREE.Points(geometry, material)
    scene.value.add(particleSystem)
  }

  const updateParticles = () => {
    if (!particleSystem) return
    const positions = particleSystem.geometry.attributes.position.array
    const sizes = particleSystem.geometry.attributes.size.array
    const colors = particleSystem.geometry.attributes.color.array

    for (let i = 0; i < params.count; i++) {
      const pd = particleData[i]
      pd.life += 0.005 * params.speed

      // 生命周期结束，重生
      if (pd.life >= 1) {
        pd.life = 0
        positions[i * 3] = (Math.random() - 0.5) * params.spread * 2
        positions[i * 3 + 1] = -1 + Math.random() * 0.5
        positions[i * 3 + 2] = (Math.random() - 0.5) * params.spread * 2
        pd.velocity.set(
          (Math.random() - 0.5) * 0.02,
          0.01 + Math.random() * 0.03,
          (Math.random() - 0.5) * 0.02
        )
      }

      const x = positions[i * 3]
      const z = positions[i * 3 + 2]

      // 根据模式更新位置
      if (params.mode === 0) {
        // 上升模式
        positions[i * 3 + 1] += pd.velocity.y * params.speed
        positions[i * 3] += (Math.random() - 0.5) * 0.02
      } else if (params.mode === 1) {
        // 扩散模式
        const angle = Math.random() * Math.PI * 2
        positions[i * 3] += Math.cos(angle) * 0.02 * params.speed
        positions[i * 3 + 1] += pd.velocity.y * params.speed * 0.5
        positions[i * 3 + 2] += Math.sin(angle) * 0.02 * params.speed
      } else {
        // 旋涡模式
        const dist = Math.sqrt(x * x + z * z)
        const angle = Math.atan2(z, x) + 0.02 * params.speed
        positions[i * 3] = Math.cos(angle) * (dist + 0.005 * params.speed)
        positions[i * 3 + 1] += pd.velocity.y * params.speed * 0.8
        positions[i * 3 + 2] = Math.sin(angle) * (dist + 0.005 * params.speed)
      }

      // 根据生命周期调整大小和颜色
      const life = pd.life
      const fadeIn = Math.min(life * 5, 1)
      const fadeOut = 1 - Math.pow(life, 2)
      sizes[i] = pd.baseSize * fadeIn * fadeOut

      // 颜色：从亮黄到暗红
      colors[i * 3] = 1
      colors[i * 3 + 1] = (1 - life) * 0.8
      colors[i * 3 + 2] = (1 - life) * 0.3
    }

    particleSystem.geometry.attributes.position.needsUpdate = true
    particleSystem.geometry.attributes.size.needsUpdate = true
    particleSystem.geometry.attributes.color.needsUpdate = true
  }

  const initGUI = () => {
    gui = new GUI()
    gui.title("粒子系统控制")

    const folder = gui.addFolder("⚙️ 粒子参数")
    folder.add(params, "mode", { [modeNames[0]]: 0, [modeNames[1]]: 1, [modeNames[2]]: 2 }).name("效果模式")
    folder.add(params, "speed", 0.1, 3, 0.1).name("上升速度")
    folder.add(params, "spread", 0.5, 5, 0.1).name("扩散范围").onChange(() => createParticleSystem())
    folder.open()
  }

  const initScene = () => {
    if (!scene.value) return
    scene.value.background = new THREE.Color(0x050510)
    scene.value.add(new THREE.AmbientLight(0x222244, 1))
    createParticleSystem()
    initGUI()

    startAnimation(() => updateParticles())
  }

  onMounted(() => initScene())

  onUnmounted(() => {
    gui?.destroy()
    gui = null
    particleSystem = null
    particleData = []
    baseDispose()
  })
</script>

<template>
  <PageLayout
    title="✨ 粒子系统动画"
    description="使用 Points + BufferGeometry 创建带生命周期的粒子效果"
  >
    <template #content>
      <div class="features">
        <h3>粒子系统动画：</h3>
        <ul>
          <li>💧 <strong>THREE.Points + BufferGeometry</strong> - 粒子渲染</li>
          <li>🔄 粒子生命周期：出生 → 消亡 → 重生</li>
          <li>🎨 颜色渐变（亮黄 → 暗红）</li>
          <li>📐 大小随生命周期变化</li>
          <li>🔥 三种效果：上升 / 扩散 / 旋涡</li>
          <li>⚡ AdditiveBlending 叠加混合</li>
        </ul>
      </div>
    </template>
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
    position: relative;
    overflow: hidden;
  }
</style>
