<template>
  <div ref="containerRef" class="multiple-canvas-container">
    <div v-if="!webgpuAvailable" class="webgpu-error" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three/webgpu'
import { color } from 'three/tsl'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import WebGPU from 'three/examples/jsm/capabilities/WebGPU.js'

const containerRef = ref(null)
const webgpuAvailable = ref(true)

let animationId = null
let renderer = null
const scenes = []

onMounted(() => {
  if (!containerRef.value) return

  if (WebGPU.isAvailable() === false) {
    webgpuAvailable.value = false
    containerRef.value.appendChild(WebGPU.getErrorMessage())
    return
  }

  const container = containerRef.value

  const content = document.createElement('div')
  content.id = 'content'
  content.innerHTML = '<div id="info"><a href="https://threejs.org" target="_blank" rel="noopener">three.js</a> - multiple canvas</div>'
  container.appendChild(content)

  const geometries = [
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.SphereGeometry(0.5, 12, 8),
    new THREE.DodecahedronGeometry(0.5),
    new THREE.CylinderGeometry(0.5, 0.5, 1, 12)
  ]

  for (let i = 0; i < 40; i++) {
    const scene = new THREE.Scene()
    scene.backgroundNode = color(0xeeeeee)

    const element = document.createElement('div')
    element.className = 'list-item'

    const sceneCanvas = document.createElement('canvas')
    element.appendChild(sceneCanvas)

    const descriptionElement = document.createElement('div')
    descriptionElement.innerText = 'Scene ' + (i + 1)
    element.appendChild(descriptionElement)

    const canvasTarget = new THREE.CanvasTarget(sceneCanvas)
    canvasTarget.setPixelRatio(window.devicePixelRatio)
    canvasTarget.setSize(200, 200)

    scene.userData.canvasTarget = canvasTarget
    content.appendChild(element)

    const camera = new THREE.PerspectiveCamera(50, 1, 1, 10)
    camera.position.z = 2
    scene.userData.camera = camera

    const controls = new OrbitControls(camera, canvasTarget.domElement)
    controls.minDistance = 2
    controls.maxDistance = 5
    controls.enablePan = false
    controls.enableZoom = false
    scene.userData.controls = controls

    const geometry = geometries[geometries.length * Math.random() | 0]
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(Math.random(), 1, 0.75, THREE.SRGBColorSpace),
      roughness: 0.5,
      metalness: 0,
      flatShading: true
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
    scene.userData.mesh = mesh

    scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x444444, 3))

    const light = new THREE.DirectionalLight(0xffffff, 1.5)
    light.position.set(1, 1, 1)
    scene.add(light)

    scenes.push(scene)
  }

  renderer = new THREE.WebGPURenderer({ antialias: true })
  renderer.setClearColor(0xffffff, 1)
  renderer.setPixelRatio(window.devicePixelRatio)

  function animate() {
    animationId = requestAnimationFrame(animate)

    scenes.forEach((scene) => {
      const { canvasTarget, camera, controls, mesh } = scene.userData
      mesh.rotation.y = Date.now() * 0.001
      controls.update()
      renderer.setCanvasTarget(canvasTarget)
      renderer.render(scene, camera)
    })
  }

  animate()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (renderer) {
    renderer.dispose()
    renderer = null
  }
  scenes.length = 0
})
</script>

<style scoped>
.multiple-canvas-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  background: #fff;
  color: #444;
}

.multiple-canvas-container :deep(#content) {
  padding: 3em 0 0 0;
}

.multiple-canvas-container :deep(#info) {
  text-align: center;
  margin-bottom: 1em;
}

.multiple-canvas-container :deep(.list-item) {
  display: inline-block;
  margin: 1em;
  padding: 1em;
  box-shadow: 1px 2px 4px 0px rgba(0, 0, 0, 0.25);
}

.multiple-canvas-container :deep(.list-item > canvas:nth-child(1)) {
  width: 200px;
  height: 200px;
}

.multiple-canvas-container :deep(.list-item > div:nth-child(2)) {
  color: #888;
  font-family: sans-serif;
  font-size: large;
  width: 200px;
  margin-top: 0.5em;
}
</style>
