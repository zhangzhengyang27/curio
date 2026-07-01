<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 75, near: 0.1, far: 10000 }"
    :camera-position="[0, 0, 1200]"
    css-renderer="css3d"
    custom-render
    @ready="onReady"
    @resize="onResize"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup>
import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const FILE_HOST = props.example?.globals?.FILE_HOST || '/external-examples/3d-file-server/'

let composerRef = null
let rendererRef = null
let cameraRef = null

function createText(scene, font) {
  const text = `           Three-Cesium-Examples

                Thanks From BiBi





    Stars Collect Forward Comment
`
  const geometry = new TextGeometry(text, {
    font,
    size: 80,
    depth: 5,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 8,
    bevelSize: 3,
    bevelOffset: 0,
    bevelSegments: 5
  })
  geometry.center()
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 'pink' }))
  scene.add(mesh)
}

function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls
  const container = ctx.container

  rendererRef = renderer
  cameraRef = camera

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  scene.add(new THREE.AmbientLight(0xffffff, 2))

  controls.enableDamping = true

  const renderPass = new RenderPass(scene, camera)
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 0.5, 0.4, 0.1)
  const composer = new EffectComposer(renderer)
  composer.addPass(renderPass)
  composer.addPass(bloomPass)
  composerRef = composer

  const iframeDOM = document.createElement('iframe')
  iframeDOM.src = '//player.bilibili.com/player.html?isOutside=true&aid=116435523210402&bvid=BV1h3oTB7EER&cid=37658037265&p=1'
  iframeDOM.style.width = '100%'
  iframeDOM.style.height = '80%'
  iframeDOM.style.border = 'none'
  iframeDOM.style.pointerEvents = 'auto'
  const mesh = new CSS3DObject(iframeDOM)
  mesh.scale.multiplyScalar(1.2)
  mesh.position.y -= 120
  scene.add(mesh)

  new FontLoader().load(FILE_HOST + 'files/json/font.json', (font) => createText(scene, font))

  ctx.addUpdateCallback(() => {
    composer.render()
  })
}

function onResize({ width, height }) {
  if (!cameraRef || !rendererRef || !composerRef) return
  cameraRef.aspect = width / height || 1
  cameraRef.updateProjectionMatrix()
  rendererRef.setSize(width, height)
  composerRef.setSize(width, height)
}

function onBeforeDispose() {
  if (composerRef) {
    composerRef.dispose()
    composerRef = null
  }
}
</script>
