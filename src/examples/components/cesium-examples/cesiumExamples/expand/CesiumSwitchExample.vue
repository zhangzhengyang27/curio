<template>
  <div class="cesium-switch-root">
    <CesiumExampleScene
      ref="cesiumSceneRef"
      :viewer-options="viewerOptions"
      @ready="onCesiumReady"
      @before-dispose="onBeforeDispose"
      class="cesium-switch-scene"
    />
    <div ref="threeBoxRef" class="cesium-switch-three" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as dat from 'dat.gui'
import gsap from 'gsap'
import CesiumExampleScene from '@/examples/components/CesiumExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const cesiumSceneRef = ref(null)
const threeBoxRef = ref(null)

let Cesium = null
let viewer = null
let entity = null
let clickHandler = null

let scene = null
let camera = null
let renderer = null
let controls = null
let animationId = null
let modelScene = null

let gui = null

const FILE_HOST = props.example?.globals?.FILE_HOST || '/external-examples/3d-file-server/'
const GLOBAL_CONFIG = {
  getFileUrl: (url) => FILE_HOST + url,
  ElMessage: (msg) => console.log('[ElMessage]', msg)
}

function viewerOptions(Cesium) {
  return {
    animation: false,
    baseLayerPicker: false,
    baseLayer: Cesium.ImageryLayer.fromProviderAsync(
      Cesium.ArcGisMapServerImageryProvider.fromUrl('https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer')
    ),
    fullscreenButton: false,
    timeline: false,
    infoBox: false,
  }
}

function initThree() {
  if (!threeBoxRef.value) return

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(75, threeBoxRef.value.clientWidth / threeBoxRef.value.clientHeight, 0.1, 1000000)
  camera.position.set(0, 1, 3)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true })
  renderer.setSize(threeBoxRef.value.clientWidth, threeBoxRef.value.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  threeBoxRef.value.appendChild(renderer.domElement)

  scene.add(new THREE.AmbientLight(0xffffff, 3))
  scene.add(new THREE.AxesHelper(1000))

  controls = new OrbitControls(camera, renderer.domElement)

  new GLTFLoader().load(GLOBAL_CONFIG.getFileUrl('models/glb/build2.glb'), (gltf) => {
    modelScene = gltf.scene
    modelScene.position.set(-5, 0, 5)
    scene.add(modelScene)
  })

  function animate() {
    animationId = requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()
}

function onWindowResize() {
  if (!camera || !renderer || !threeBoxRef.value) return
  camera.aspect = threeBoxRef.value.clientWidth / threeBoxRef.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(threeBoxRef.value.clientWidth, threeBoxRef.value.clientHeight)
}

function onCesiumReady(ctx) {
  Cesium = ctx.cesium
  viewer = ctx.viewer

  entity = viewer.entities.add({
    name: '房子',
    position: Cesium.Cartesian3.fromDegrees(116.3975, 39.9085, 0),
    model: {
      uri: GLOBAL_CONFIG.getFileUrl('models/glb/build2.glb'),
      minimumPixelSize: 100,
      maximumScale: 20000,
    }
  })

  viewer.zoomTo(entity, new Cesium.HeadingPitchRange(0, -Math.PI / 4, 200))

  clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  clickHandler.setInputAction(async (movement) => {
    const pickedObject = viewer.scene.pick(movement.position)
    if (Cesium.defined(pickedObject) && pickedObject.id === entity) {
      if (pickedObject.id.name === '房子') {
        viewer.flyTo(entity)
        setTimeout(() => {
          if (!threeBoxRef.value || !cesiumSceneRef.value) return
          threeBoxRef.value.style.display = 'block'
          cesiumSceneRef.value.$el.style.display = 'none'
          const oldPosition = camera.position.clone()
          camera.position.set(0, 40, 40)
          gsap.to(camera.position, { ...oldPosition, duration: 2 })
        }, 1800)
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  initThree()
  window.addEventListener('resize', onWindowResize)

  const options = { cesium: true, three: false }

  gui = new dat.GUI({ autoPlace: false })
  gui.domElement.style.position = 'absolute'
  gui.domElement.style.top = '10px'
  gui.domElement.style.right = '10px'
  gui.domElement.style.zIndex = '1000'
  cesiumSceneRef.value?.$el?.parentElement?.appendChild(gui.domElement)

  gui.add(options, 'cesium').name('Cesium').onChange((value) => {
    if (cesiumSceneRef.value) {
      cesiumSceneRef.value.$el.style.display = value ? 'block' : 'none'
    }
  })
  gui.add(options, 'three').name('Three.js').onChange((value) => {
    if (threeBoxRef.value) {
      threeBoxRef.value.style.display = value ? 'block' : 'none'
    }
  })

  gui.add({
    switch: () => {
      gsap.to(camera.position, {
        x: 0,
        y: 40,
        z: 40,
        duration: 1.5,
        onComplete: () => {
          if (threeBoxRef.value) threeBoxRef.value.style.display = 'none'
          if (cesiumSceneRef.value) cesiumSceneRef.value.$el.style.display = 'block'
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(116.3975, 39.9085, 200),
            duration: 1.5,
          })
        }
      })
    }
  }, 'switch').name('切换回Cesium')

  GLOBAL_CONFIG.ElMessage('点击模型切换到 Three.js场景')
}

function onBeforeDispose() {
  window.removeEventListener('resize', onWindowResize)

  if (gui) {
    try {
      gui.destroy()
    } catch (e) {}
    gui = null
  }

  if (clickHandler && !clickHandler.isDestroyed()) {
    try {
      clickHandler.destroy()
    } catch (e) {}
    clickHandler = null
  }

  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }

  if (renderer) {
    try {
      renderer.setAnimationLoop(null)
      renderer.dispose()
    } catch (e) {}
    renderer = null
  }

  if (controls) {
    try {
      controls.dispose()
    } catch (e) {}
    controls = null
  }

  if (modelScene) {
    try {
      modelScene.traverse((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
    } catch (e) {}
    modelScene = null
  }

  scene = null
  camera = null

  Cesium = null
  viewer = null
  entity = null
}
</script>

<style scoped>
.cesium-switch-root {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
}

.cesium-switch-scene,
.cesium-switch-three {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.cesium-switch-three {
  display: none;
}
</style>
