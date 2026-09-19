<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[100, 100, 100]"
    alpha
    antialias
    @ready="onReady"
    @resize="onResize"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue'

let gui: any = null
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { animate } from 'animejs'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

let isRoaming: boolean = false
let camera2: any
let pointerlockControls: any
let rendererDomElement: any
const eye1 = new THREE.Object3D()
const itemData = { px: 0, py: 0, pz: 0, rx: 0, ry: 0, rz: 0 }

function onMouseDown() {
  if (isRoaming && pointerlockControls) {
    pointerlockControls.isLocked = true
  }
}

function onMouseUp() {
  if (isRoaming && pointerlockControls) {
    pointerlockControls.isLocked = false
    animate(camera2.quaternion, {
      x: 0,
      y: 0,
      z: 0,
      w: 1,
      ease: 'linear',
      duration: 500
    })
  }
}

function onReady(ctx: any) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  rendererDomElement = renderer.domElement

  const { width, height } = ctx.size.value
  camera2 = new THREE.PerspectiveCamera(75, width / height || 1, 0.1, 2000)
  camera2.position.set(0, 2, 0)

  const cameraHelper = new THREE.CameraHelper(camera2)
  scene.add(cameraHelper)

  eye1.add(camera2)
  scene.add(eye1)

  pointerlockControls = new PointerLockControls(camera2, renderer.domElement)

  scene.add(new THREE.AmbientLight(0xffffff, 1))
  scene.add(new THREE.DirectionalLight(0xffffff, 1.5))
  scene.add(new THREE.GridHelper(200, 20))

  const gltfLoader = new GLTFLoader()
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath(props.example?.globals?.FILE_HOST + 'js/three/draco/')
  gltfLoader.setDRACOLoader(dracoLoader)
  gltfLoader.load(props.example?.globals?.FILE_HOST + 'models/modern_city.glb', (gltf) => {
    gltf.scene.scale.set(0.03, 0.03, 0.03)
    scene.add(gltf.scene)
  })

  gui = new GUI()
  const btns = { startRoam: autoRun, stopAutoRun }
  gui.add(btns, 'startRoam').name('开启漫游/巡检')
  gui.add(btns, 'stopAutoRun').name('结束漫游/巡检')
  gui.add(cameraHelper, 'visible').name('相机辅助线')

  function resetEye() {
    eye1.position.set(0, 0, 0)
    eye1.rotation.set(0, 0, 0)
    itemData.px = 0
    itemData.py = 0
    itemData.pz = 0
    itemData.rx = 0
    itemData.ry = 0
    itemData.rz = 0
    pointerlockControls.enabled = true
    ctx.setCamera(camera)
  }

  function autoRun() {
    isRoaming = true
    pointerlockControls.enabled = false
    ctx.setCamera(camera2)

    itemData.px = eye1.position.x
    itemData.py = eye1.position.y
    itemData.pz = eye1.position.z
    itemData.rx = eye1.rotation.x
    itemData.ry = eye1.rotation.y
    itemData.rz = eye1.rotation.z

    const a90 = -Math.PI / 2
    const time1 = 6000
    const time2 = 6000
    const time3 = 1200

    animate(itemData, {
      px: [
        { to: 0, duration: time1 },
        { to: 30, duration: time1, delay: time3 },
        { to: 30, duration: time1, delay: time3 },
        { to: 0, duration: time1, delay: time3 }
      ],
      pz: [
        { to: -30, duration: time1 },
        { to: -30, duration: time1, delay: time3 },
        { to: 0, duration: time1, delay: time3 },
        { to: 0, duration: time1, delay: time3 }
      ],
      ry: [
        { to: a90, duration: time3, delay: time2 },
        { to: a90 * 2, duration: time3, delay: time2 },
        { to: a90 * 3, duration: time3, delay: time2 },
        { to: a90 * 4, duration: time3, delay: time2 }
      ],
      ease: 'linear',
      onUpdate: () => {
        const { px, py, pz, rx, ry, rz } = itemData
        eye1.position.set(px, py, pz)
        eye1.rotation.set(rx, ry, rz)
      },
      onComplete: () => resetEye()
    })
  }

  function stopAutoRun() {
    isRoaming = false
    resetEye()
  }

  renderer.domElement.addEventListener('mousedown', onMouseDown)
  renderer.domElement.addEventListener('mouseup', onMouseUp)
  renderer.domElement.addEventListener('mouseleave', onMouseUp)

  ctx.addUpdateCallback(() => {
    pointerlockControls.update()
  })
}

function onResize({ width, height }: any) {
  if (camera2) {
    camera2.aspect = width / height || 1
    camera2.updateProjectionMatrix()
  }
}

function onBeforeDispose() {
  if (rendererDomElement) {
    rendererDomElement.removeEventListener('mousedown', onMouseDown)
    rendererDomElement.removeEventListener('mouseup', onMouseUp)
    rendererDomElement.removeEventListener('mouseleave', onMouseUp);
  }
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
