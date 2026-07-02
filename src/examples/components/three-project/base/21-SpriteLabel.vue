<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"

  const containerRef = shallowRef(null)

  const { scene, camera: _camera, startAnimation, onSceneReady, dispose: baseDispose } =
    useThreeScene(containerRef, {
      cameraPosition: { x: 6, y: 5, z: 8 },
      enableControls: true,
      controlsConfig: { enableDamping: true, dampingFactor: 0.05 },
      showGridHelper: true
    })

  let gui!: GUI
  const sprites: THREE.Sprite[] = []
  const meshItems: THREE.Mesh[] = []

  /**
   * 创建 Canvas 文字纹理 Sprite
   */
  const createTextSprite = (text: string, color = "#ffffff", fontSize = 36) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!
    canvas.width = 256
    canvas.height = 64

    // 背景
    ctx.fillStyle = "rgba(0,0,0,0.6)"
    ctx.roundRect(0, 0, canvas.width, canvas.height, 8)
    ctx.fill()

    // 文字
    ctx.font = `bold ${fontSize}px Arial`
    ctx.fillStyle = color
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(2.5, 0.625, 1)
    return sprite
  }

  const createScene = () => {
    const sceneValue = scene.value
    if (!sceneValue) return

    // 物体定义
    const items = [
      { name: "立方体", color: 0xe74c3c, create: () => new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), new THREE.MeshStandardMaterial({ color: 0xe74c3c })) },
      { name: "球体", color: 0x3498db, create: () => new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 32), new THREE.MeshStandardMaterial({ color: 0x3498db })) },
      { name: "圆锥", color: 0x2ecc71, create: () => new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.4, 32), new THREE.MeshStandardMaterial({ color: 0x2ecc71 })) },
      { name: "环面结", color: 0xf39c12, create: () => new THREE.Mesh(new THREE.TorusKnotGeometry(0.6, 0.2, 100, 16), new THREE.MeshStandardMaterial({ color: 0xf39c12 })) },
      { name: "二十面体", color: 0x9b59b6, create: () => new THREE.Mesh(new THREE.IcosahedronGeometry(0.7), new THREE.MeshStandardMaterial({ color: 0x9b59b6 })) }
    ]

    const spacing = 3.5
    items.forEach((item, i) => {
      const mesh = item.create()
      mesh.position.set(i * spacing - (items.length - 1) * spacing / 2, 0, 0)
      mesh.name = item.name
      sceneValue.add(mesh)
      meshItems.push(mesh)

      // 文字 Sprite 标签
      const sprite = createTextSprite(item.name, "#" + item.color.toString(16).padStart(6, "0"))
      sprite.position.set(0, 1.5, 0) // 在物体上方
      mesh.add(sprite)
      sprites.push(sprite)
    })

    // 灯光
    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    sceneValue.add(ambient)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(5, 10, 7)
    sceneValue.add(dirLight)
  }

  const animateCallback = () => {
    // Sprite 始终面向相机（Sprite 自带此特性）
    // 仅做物体旋转动画
    meshItems.forEach((m, i) => {
      m.rotation.y += 0.005 + i * 0.002
    })
  }

  const initGUI = () => {
    gui = new GUI()
    const params = {
      showLabels: true,
      labelScale: 1,
      labelOpacity: 1
    }

    gui.add(params, "showLabels").name("显示标签").onChange((v) => {
      sprites.forEach(s => { s.visible = v })
    })
    gui.add(params, "labelScale", 0.5, 2, 0.1).name("标签大小").onChange((v) => {
      sprites.forEach(s => { s.scale.set(2.5 * v, 0.625 * v, 1) })
    })
    gui.add(params, "labelOpacity", 0, 1, 0.05).name("标签透明度").onChange((v) => {
      sprites.forEach(s => { s.material.opacity = v })
    })
  }

  onSceneReady(() => {
    createScene()
    initGUI()
    startAnimation(animateCallback)
  })

  onUnmounted(() => {
    sprites.forEach(s => {
      const spriteMat = s.material as THREE.SpriteMaterial
      if (spriteMat.map) spriteMat.map.dispose()
      spriteMat.dispose()
    })
    meshItems.forEach(m => {
      m.geometry.dispose()
      const mat = m.material as THREE.Material
      mat.dispose()
    })
    gui?.destroy()
    baseDispose()
  })
</script>

<template>
  <PageLayout
    title="🏷️ Sprite 文字标签"
    description="Canvas 动态文字 Sprite 标签，始终面向相机"
  >
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🏷️ Canvas 动态生成文字纹理</li>
          <li>📌 Sprite 标签自动面向相机</li>
          <li>🔗 标签挂载在物体上方，跟随运动</li>
          <li>🎛️ GUI 控制显隐、大小、透明度</li>
        </ul>
      </div>
    </template>
    <div ref="containerRef" />
  </PageLayout>
</template>
