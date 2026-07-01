<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[400, 400, 400]"
    antialias
    custom-render
    @ready="onReady"
    @resize="onResize"
  />
</template>

<script setup>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const ORTHO = 500

let renderer = null
let scene = null
let camera = null
let mainComposer = null
let subCams = []
let subComposers = []
let mainControls = null
let subControls = []
let mixer = null
let clock = null
let layoutState = null

function layout(container) {
  const W = container.clientWidth
  const H = container.clientHeight
  const subH = Math.floor(H * 0.35)
  return { W, H, subH, mainH: H - subH, subW: Math.floor(W / 3) }
}

function makeComposer(renderer, scene, cam, w, h) {
  const c = new EffectComposer(renderer)
  c.addPass(new RenderPass(scene, cam))
  c.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 0.8, 0, 0))
  c.setSize(w, h)
  return c
}

function makeOrtho(pos, up, aspect) {
  const cam = new THREE.OrthographicCamera(-ORTHO * aspect, ORTHO * aspect, ORTHO, -ORTHO, 0.1, 5000)
  cam.position.copy(pos)
  cam.up.copy(up)
  cam.lookAt(0, 0, 0)
  return cam
}

function onReady(ctx) {
  scene = ctx.scene
  camera = ctx.camera
  renderer = ctx.renderer
  const container = ctx.container

  layoutState = layout(container)
  const { W, mainH, subH, subW } = layoutState

  camera.fov = 75
  camera.near = 0.1
  camera.far = 1000
  camera.aspect = W / mainH
  camera.updateProjectionMatrix()

  mainComposer = makeComposer(renderer, scene, camera, W, mainH)

  subCams = [
    makeOrtho(new THREE.Vector3(0, 0, 2000), new THREE.Vector3(0, 1, 0), subW / subH),
    makeOrtho(new THREE.Vector3(2000, 0, 0), new THREE.Vector3(0, 1, 0), subW / subH),
    makeOrtho(new THREE.Vector3(0, 2000, 0), new THREE.Vector3(0, 0, -1), subW / subH),
  ]
  subComposers = subCams.map(cam => makeComposer(renderer, scene, cam, subW, subH))

  mainControls = ctx.controls
  subControls = subCams.map(cam => {
    const ctrl = new OrbitControls(cam, renderer.domElement)
    ctrl.enabled = false
    return ctrl
  })

  renderer.domElement.addEventListener('pointerdown', onPointerDown, { capture: true })

  clock = new THREE.Clock()
  mixer = null

  const loader = new GLTFLoader()
  loader.setDRACOLoader(new DRACOLoader().setDecoderPath(props.example?.globals?.FILE_HOST + 'js/three/draco/'))

  const textureCube = new THREE.CubeTextureLoader().load(
    [1, 2, 3, 4, 5, 6].map(k => props.example?.globals?.FILE_HOST + 'files/sky/skyBox0/' + k + '.png')
  )

  loader.load(props.example?.globals?.FILE_HOST + '/files/model/LittlestTokyo.glb', gltf => {
    gltf.scene.traverse(child => {
      if (child.isMesh) child.material.envMap = textureCube
    })
    scene.add(gltf.scene)
    mixer = new THREE.AnimationMixer(gltf.scene)
    gltf.animations.forEach(clip => mixer.clipAction(clip).play())
  })

  ctx.addUpdateCallback(() => {
    const { W, subH, mainH, subW } = layoutState

    renderer.setScissorTest(true)

    renderer.setViewport(0, subH, W, mainH)
    renderer.setScissor(0, subH, W, mainH)
    mainComposer.render()

    subComposers.forEach((c, i) => {
      renderer.setViewport(i * subW, 0, subW, subH)
      renderer.setScissor(i * subW, 0, subW, subH)
      c.render()
    })

    mainControls.update()
    subControls.forEach(c => c.update())
    if (mixer) mixer.update(clock.getDelta())
  })
}

function onPointerDown(e) {
  const rendererDom = renderer.domElement
  const rect = rendererDom.getBoundingClientRect()
  const containerLayout = layout(rendererDom.parentElement)
  const { mainH, subW } = containerLayout
  const py = e.clientY - rect.top
  const px = e.clientX - rect.left

  mainControls.enabled = false
  subControls.forEach(c => (c.enabled = false))

  if (py < mainH) {
    mainControls.enabled = true
  } else {
    subControls[Math.min(Math.floor(px / subW), 2)].enabled = true
  }
}

function onResize({ width, height }) {
  if (!renderer || !camera) return
  const subH = Math.floor(height * 0.35)
  const mainH = height - subH
  const subW = Math.floor(width / 3)
  layoutState = { W: width, H: height, subH, mainH, subW }

  renderer.setSize(width, height)

  camera.aspect = width / mainH
  camera.updateProjectionMatrix()
  mainComposer.setSize(width, mainH)

  const aspect = subW / subH
  subCams.forEach(cam => {
    cam.left = -ORTHO * aspect
    cam.right = ORTHO * aspect
    cam.updateProjectionMatrix()
  })
  subComposers.forEach(c => c.setSize(subW, subH))
}
</script>
