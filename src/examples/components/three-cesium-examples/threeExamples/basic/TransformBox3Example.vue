<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 50, near: 0.1, far: 1000 }"
    :camera-position="[0, 3, 6]"
    antialias
    alpha
    shadow-map
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup>
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const FILE_HOST = props.example?.globals?.FILE_HOST || '/external-examples/3d-file-server/'

let guiRef = null
let transformControls = null
let box3Helper = null

function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  renderer.shadowMap.needsUpdate = true
  controls.enableDamping = true

  guiRef = new GUI()

  transformControls = new TransformControls(camera, renderer.domElement)
  guiRef.add(transformControls, 'mode', ['translate', 'rotate', 'scale']).name('模式')

  transformControls.addEventListener('dragging-changed', (event) => {
    controls.enabled = !event.value
  })

  const box3 = new THREE.Box3()
  box3Helper = new THREE.Box3Helper(box3, 0xffff00)
  scene.add(box3Helper)

  transformControls.addEventListener('change', () => {
    if (transformControls.object) {
      box3Helper.box = box3.setFromObject(transformControls.object)
    }
  })

  scene.add(transformControls.getHelper())

  const texture = new RGBELoader().load(FILE_HOST + 'files/hdr/1k.hdr', (t) => {
    t.mapping = THREE.EquirectangularReflectionMapping
  })

  new GLTFLoader().load(FILE_HOST + 'files/model/Fox.glb', (gltf) => {
    const model = gltf.scene
    model.scale.set(0.01, 0.01, 0.01)
    model.traverse((child) => {
      if (child.isMesh) child.material.envMap = texture
    })
    scene.add(model)
    transformControls.attach(model)
  })
}

function onBeforeDispose() {
  if (transformControls) {
    transformControls.dispose()
    transformControls = null
  }
  if (guiRef) {
    guiRef.destroy()
    guiRef = null
  }
  box3Helper = null
}
</script>
