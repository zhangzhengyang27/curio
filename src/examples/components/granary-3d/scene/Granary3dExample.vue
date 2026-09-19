<template>
  <div class="granary-example-root">
    <ExampleScene
      ref="sceneRef"
      camera="perspective"
      :camera-options="{ fov: 45, near: 1, far: 3000 }"
      :camera-position="[318, 162, 204]"
      clear-color="#005577"
      :default-lights="false"
      :enable-controls="true"
      css-renderer="css2d"
      @ready="onReady"
      @before-dispose="onBeforeDispose"
    />
    <div
      v-if="isLoading"
      class="granary-loading"
    >
      <div class="loading-spinner" />
      <span>粮仓模型加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as THREE from 'three'
import TWEEN from 'three/examples/jsm/libs/tween.module.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import ExampleScene from '../../ExampleScene.vue'
import messageData from '../messageData'

const sceneRef = ref(null)
const isLoading = ref(true)

let scene: any = null
let camera: any = null
let renderer: any = null
let addUpdateCallback: any = null

const modelGroup = new THREE.Group()
const granaryArr: any[] = []
const flames: any[] = []
const timeouts: any[] = []
let selectedMesh: any = null
let hoverMesh: any = null
let gltfScene: any = null
let infoPanelDom: any = null
let infoPanelLabel: any = null
let infoPanelElements: any = null
let weightTween: any = null

let showInfoPanel = false
let infoData = {
  granaryName: '',
  temperature: '',
  grain: '',
  grainImg: '',
  weight: 0,
  granaryHeight: '',
  grainHeight: '',
}
let displayedWeight = 0

let pointerDownPos: any = null
let isDragging = false

function pushTimeout(fn: () => void, delay: number) {
  const id = setTimeout(fn, delay)
  timeouts.push(id)
  return id
}

function clearAllTimeouts() {
  timeouts.forEach((id) => clearTimeout(id))
  timeouts.length = 0
}

function createNameTag(name: string) {
  const div = document.createElement('div')
  div.className = 'granary-name-tag'
  div.textContent = name
  const label = new CSS2DObject(div)
  label.center.set(0.5, 0.5)
  return label
}

function createInfoTag(name: string) {
  const div = document.createElement('div')
  div.className = 'granary-fire-tag'
  div.textContent = name
  const label = new CSS2DObject(div)
  label.center.set(0.5, 0.5)
  return label
}

function createInfoPanel() {
  const div = document.createElement('div')
  div.className = 'granary-info-panel'
  div.style.visibility = 'hidden'
  div.innerHTML = `
    <div class="panel-header">
      <h3 class="panel-title"></h3>
      <button class="close-btn">×</button>
    </div>
    <div class="panel-body">
      <div class="info-row">
        <span class="label">粮食品种</span>
        <span class="value grain">
          <img class="grain-icon" src="" alt="" />
          <span class="grain-name"></span>
        </span>
      </div>
      <div class="info-row">
        <span class="label">重量</span>
        <span class="value weight"><span class="weight-value">0</span> t</span>
      </div>
      <div class="info-row">
        <span class="label">温度</span>
        <span class="value temp"><span class="temp-value">0</span> ℃</span>
      </div>
      <div class="info-row">
        <span class="label">仓高</span>
        <span class="value"><span class="height-value">0</span> m</span>
      </div>
      <div class="info-row">
        <span class="label">粮高</span>
        <span class="value"><span class="grain-height-value">0</span> m</span>
      </div>
    </div>
  `

  const elements = {
    title: div.querySelector('.panel-title'),
    closeBtn: div.querySelector('.close-btn'),
    grainIcon: div.querySelector('.grain-icon'),
    grainName: div.querySelector('.grain-name'),
    weight: div.querySelector('.weight-value'),
    temp: div.querySelector('.temp-value'),
    height: div.querySelector('.height-value'),
    grainHeight: div.querySelector('.grain-height-value'),
  }

  elements.closeBtn!.addEventListener('click', closeInfoPanel)

  const label = new CSS2DObject(div)
  return { div, label, elements }
}

function updateInfoPanel() {
  if (!infoPanelElements) return
  infoPanelElements.title.textContent = infoData.granaryName
  infoPanelElements.grainIcon.src = infoData.grainImg || ''
  infoPanelElements.grainIcon.style.display = infoData.grainImg ? 'inline-block' : 'none'
  infoPanelElements.grainName.textContent = infoData.grain
  infoPanelElements.weight.textContent = displayedWeight
  infoPanelElements.temp.textContent = infoData.temperature
  infoPanelElements.height.textContent = infoData.granaryHeight
  infoPanelElements.grainHeight.textContent = infoData.grainHeight
  infoPanelDom.style.visibility = showInfoPanel ? 'visible' : 'hidden'
}

function animateWeight(target: number) {
  if (weightTween) weightTween.stop()
  displayedWeight = 0
  const obj = { value: 0 }
  weightTween = new TWEEN.Tween(obj)
    .to({ value: target }, 600)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => {
      displayedWeight = Math.floor(obj.value)
      updateInfoPanel()
    })
    .onComplete(() => {
      weightTween = null
    })
    .start()
}

function openInfoPanel(mesh: any, point: any) {
  const data = (messageData as Record<string, any>)[mesh.name]
  if (!data) return
  selectedMesh = mesh
  infoData = { ...data }
  showInfoPanel = true
  updateInfoPanel()
  infoPanelLabel.position.copy(point)
  animateWeight(data.weight)
}

function closeInfoPanel() {
  showInfoPanel = false
  if (infoPanelDom) infoPanelDom.style.visibility = 'hidden'
  if (selectedMesh && selectedMesh.userData.originalColor) {
    selectedMesh.material.color.copy(selectedMesh.userData.originalColor)
  }
  selectedMesh = null
  if (weightTween) {
    weightTween.stop()
    weightTween = null
  }
}

function getGranaryHeightOffset(parentName: string) {
  if (parentName === '立筒仓') return 36
  if (parentName === '浅圆仓') return 20
  if (parentName === '平房仓') return 17
  return 0
}

function disposeFlame(flame: any) {
  const geometries = new Set()
  const materials = new Set()
  const textures = new Set()
  flame.traverse((obj: any) => {
    if (obj.geometry) geometries.add(obj.geometry)
    if (obj.material) {
      materials.add(obj.material)
      if (obj.material.map) textures.add(obj.material.map)
    }
  })
  geometries.forEach((g: any) => g.dispose())
  textures.forEach((t: any) => t.dispose())
  materials.forEach((m: any) => m.dispose())
}

function createFlame() {
  const w = 25
  const h = 1.6 * w
  const geometry = new THREE.PlaneGeometry(w, h)
  geometry.translate(0, h / 2, 0)

  const textureLoader = new THREE.TextureLoader()
  const texture = textureLoader.load('/granary-3d/assets/火焰.png')
  const num = 15
  texture.repeat.set(1 / num, 1)

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    depthWrite: false,
  })

  const mesh = new THREE.Mesh(geometry, material)
  const flame = new THREE.Group()
  flame.add(
    mesh,
    mesh.clone().rotateY(Math.PI / 2),
    mesh.clone().rotateY(Math.PI / 4),
    mesh.clone().rotateY((Math.PI / 4) * 3)
  )

  let t = 0
  let rafId: number | null = null

  function updateLoop() {
    t += 0.1
    if (t > num) t = 0
    texture.offset.x = Math.floor(t) / num
    rafId = requestAnimationFrame(updateLoop)
  }

  updateLoop()

  ;(flame as any).stop = () => {
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
  }

  return flame
}

function createGranaryFlame(gltfScene: any, name: string) {
  const granary = gltfScene.getObjectByName(name)
  if (!granary || !granary.parent) return null
  const pos = new THREE.Vector3()
  granary.getWorldPosition(pos)
  const flame = createFlame()
  flame.position.copy(pos)
  flame.position.y += getGranaryHeightOffset(granary.parent.name) - 4

  const messageTag = createInfoTag('粮仓 ' + name + ' 失火了 ！！！')
  messageTag.position.y += 20
  flame.add(messageTag)
  flame.userData.tag = messageTag

  return flame
}

function onModelLoaded(gltf: any) {
  if (!scene) return
  isLoading.value = false
  gltfScene = gltf.scene
  console.log('粮仓模型加载完成', gltf)

  gltf.scene.traverse((object: any) => {
    if (object.type === 'Mesh') {
      const newMaterial = new THREE.MeshLambertMaterial({
        map: object.material?.map,
        color: object.material?.color ? object.material.color.clone() : 0xffffff,
      })
      object.material = newMaterial
      object.userData.originalColor = newMaterial.color!.clone()
    }
  })

  const granaryGroup = gltf.scene.getObjectByName('粮仓')
  if (granaryGroup) {
    granaryGroup.traverse((obj: any) => {
      if (obj.type === 'Mesh') {
        granaryArr.push(obj)

        const label = createNameTag(obj.name)
        const pos = new THREE.Vector3()
        obj.getWorldPosition(pos)
        pos.y += getGranaryHeightOffset(obj.parent?.name)
        label.position.copy(pos)
        obj.userData.label = label
        modelGroup.add(label)
      }
    })
  }

  modelGroup.add(gltf.scene)
  scene.add(modelGroup)

  // 火焰演示：1 秒后 Q_05 起火
  pushTimeout(() => {
    if (!scene) return
    const flame = createGranaryFlame(gltf.scene, 'Q_05')
    if (flame) {
      modelGroup.add(flame)
      flames.push(flame)
    }
  }, 1000)

  // P_05 起火，3 秒后熄灭
  const p05Flame = createGranaryFlame(gltf.scene, 'P_05')
  if (p05Flame) {
    modelGroup.add(p05Flame)
    flames.push(p05Flame)

    pushTimeout(() => {
      if (!scene) return
      disposeFlame(p05Flame)
      ;(p05Flame as any).stop()
      modelGroup.remove(p05Flame)
      if (p05Flame.userData.tag) {
        p05Flame.remove(p05Flame.userData.tag)
      }
      const index = flames.indexOf(p05Flame)
      if (index > -1) flames.splice(index, 1)
    }, 3000)
  }
}

function onModelError(error: unknown) {
  isLoading.value = false
  console.error('粮仓模型加载失败', error)
}

function updateHoverState(event: PointerEvent) {
  if (!camera || !renderer || granaryArr.length === 0) return

  const rect = renderer.domElement.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
  const intersects = raycaster.intersectObjects(granaryArr)

  if (hoverMesh && hoverMesh !== selectedMesh) {
    hoverMesh.material.color.copy(hoverMesh.userData.originalColor)
    hoverMesh = null
  }

  if (intersects.length > 0) {
    const mesh = intersects[0].object as THREE.Mesh
    if (mesh !== selectedMesh) {
      const hoverMat = mesh.material as THREE.MeshPhongMaterial & { color: THREE.Color }
      hoverMat.color.set(0x88ffff)
      hoverMesh = mesh
      renderer.domElement.style.cursor = 'pointer'
    }
  } else {
    renderer.domElement.style.cursor = 'default'
  }
}

function onPointerDown(event: PointerEvent) {
  pointerDownPos = { x: event.clientX, y: event.clientY }
  isDragging = false
}

function onPointerMove(event: PointerEvent) {
  if (pointerDownPos) {
    const dx = event.clientX - pointerDownPos.x
    const dy = event.clientY - pointerDownPos.y
    if (Math.sqrt(dx * dx + dy * dy) > 5) {
      isDragging = true
    }
  }
  updateHoverState(event)
}

function onPointerUp() {
  pointerDownPos = null
}

function handleClick(event: MouseEvent) {
  if (!camera || !renderer || isDragging) return

  const rect = renderer.domElement.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
  const intersects = raycaster.intersectObjects(granaryArr)

  if (intersects.length > 0) {
    const mesh = intersects[0].object as THREE.Mesh
    if (selectedMesh && selectedMesh !== mesh) {
      ;(selectedMesh.material as THREE.MeshPhongMaterial & { color: THREE.Color }).color.copy(selectedMesh.userData.originalColor)
    }
    ;(mesh.material as THREE.MeshPhongMaterial & { color: THREE.Color }).color.set(0x00ffff)
    openInfoPanel(mesh, intersects[0].point)
  } else {
    closeInfoPanel()
  }
}

const labelPosition = new THREE.Vector3()
const cameraToLabel = new THREE.Vector3()

function updateLabelVisibility() {
  if (!camera || !gltfScene || granaryArr.length === 0) return

  const raycaster = new THREE.Raycaster()

  granaryArr.forEach((mesh) => {
    const label = mesh.userData.label
    if (!label) return

    label.getWorldPosition(labelPosition)
    cameraToLabel.copy(labelPosition).sub(camera.position).normalize()
    raycaster.set(camera.position, cameraToLabel)

    const distanceToLabel = camera.position.distanceTo(labelPosition)
    const intersects = raycaster.intersectObjects(gltfScene.children, true)
    const isOccluded = intersects.some((hit) => hit.distance < distanceToLabel - 1)
    label.element.style.opacity = isOccluded ? '0' : '1'
  })
}

function onReady(ctx: any) {
  scene = ctx.scene
  camera = ctx.camera
  renderer = ctx.renderer
  addUpdateCallback = ctx.addUpdateCallback

  if (renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace
  }

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
  directionalLight.position.set(400, 200, 300)
  scene.add(directionalLight)

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6)
  directionalLight2.position.set(-400, -200, -300)
  scene.add(directionalLight2)

  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)

  scene.fog = new THREE.Fog(0x005577, -100, 1000)

  const panel = createInfoPanel()
  infoPanelDom = panel.div
  infoPanelLabel = panel.label
  infoPanelElements = panel.elements
  scene.add(infoPanelLabel)

  const loader = new GLTFLoader()
  loader.load('/granary-3d/assets/model.glb', onModelLoaded, undefined, onModelError)

  renderer.domElement.addEventListener('click', handleClick)
  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointermove', onPointerMove)
  renderer.domElement.addEventListener('pointerup', onPointerUp)

  addUpdateCallback(() => {
    TWEEN.update()
    updateLabelVisibility()
  })
}

function onBeforeDispose() {
  if (renderer) {
    renderer.domElement.removeEventListener('click', handleClick)
    renderer.domElement.removeEventListener('pointerdown', onPointerDown)
    renderer.domElement.removeEventListener('pointermove', onPointerMove)
    renderer.domElement.removeEventListener('pointerup', onPointerUp)
  }

  clearAllTimeouts()
  closeInfoPanel()

  flames.forEach((flame) => {
    disposeFlame(flame)
    if (flame.stop) flame.stop()
    if (flame.userData.tag) {
      flame.remove(flame.userData.tag)
    }
    modelGroup.remove(flame)
  })
  flames.length = 0

  if (infoPanelLabel) {
    scene.remove(infoPanelLabel)
    infoPanelLabel = null
  }
  infoPanelDom = null
  infoPanelElements = null

  granaryArr.forEach((mesh) => {
    mesh.userData.label = null
  })
  granaryArr.length = 0

  gltfScene = null
  // modelGroup 保留在 scene 中，由 ExampleScene 统一 dispose

  scene = null
  camera = null
  renderer = null
  addUpdateCallback = null
}
</script>

<style scoped>
.granary-example-root {
  position: relative;
  width: 100%;
  height: 100%;
}

.granary-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(0, 20, 40, 0.85);
  color: #4fc3f7;
  font-size: 14px;
  z-index: 10;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(79, 195, 247, 0.2);
  border-top-color: #4fc3f7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.granary-name-tag {
  background: linear-gradient(#00ffff, #00ffff) left top,
    linear-gradient(#00ffff, #00ffff) left top,
    linear-gradient(#00ffff, #00ffff) right bottom,
    linear-gradient(#00ffff, #00ffff) right bottom;
  background-repeat: no-repeat;
  background-size: 1px 6px, 6px 1px;
  background-color: rgba(0, 0, 0, 0.4);
  color: #ffffff;
  font-size: 14px;
  padding: 6px 10px;
  pointer-events: none;
  white-space: nowrap;
  transition: opacity 0.2s;
}

.granary-fire-tag {
  background: rgba(255, 50, 0, 0.6);
  color: #fff;
  font-size: 14px;
  padding: 6px 10px;
  border-radius: 4px;
  pointer-events: none;
  white-space: nowrap;
}

.granary-info-panel {
  width: 260px;
  background: rgba(15, 15, 35, 0.92);
  border-radius: 14px;
  padding: 16px;
  color: #fff;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
  font-size: 13px;
}

.granary-info-panel .panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.granary-info-panel .panel-title {
  margin: 0;
  font-size: 16px;
  color: #4fc3f7;
}

.granary-info-panel .close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 20px;
  cursor: pointer;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.granary-info-panel .close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.granary-info-panel .panel-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.granary-info-panel .info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.granary-info-panel .label {
  color: #888;
  font-size: 13px;
}

.granary-info-panel .value {
  font-weight: 600;
  font-size: 13px;
  color: #ddd;
}

.granary-info-panel .value.weight {
  color: #00cccc;
}

.granary-info-panel .value.temp {
  color: #ff6666;
}

.granary-info-panel .value.grain {
  display: flex;
  align-items: center;
  gap: 6px;
}

.granary-info-panel .grain-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  display: none;
}
</style>