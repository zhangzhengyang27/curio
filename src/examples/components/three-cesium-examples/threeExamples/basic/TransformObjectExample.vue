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

function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  renderer.shadowMap.needsUpdate = true

  controls.enableDamping = true

  guiRef = new GUI()

  transformControls = new TransformControls(camera, renderer.domElement)
  transformControls.addEventListener('dragging-changed', (event) => {
    controls.enabled = !event.value
  })
  scene.add(transformControls.getHelper())

  guiRef.add(transformControls, 'mode', ['translate', 'rotate', 'scale']).name('模式')

  new GLTFLoader().load(FILE_HOST + 'files/model/Fox.glb', (gltf) => {
    const model = gltf.scene
    model.scale.set(0.01, 0.01, 0.01)
    model.traverse((child) => {
      if (child.isMesh) child.castShadow = true
    })
    scene.add(model)
    guiRef.add({ '控制模型': () => transformControls.attach(model) }, '控制模型')
  })

  const pointLight = new THREE.DirectionalLight(0xffffff, 1)
  pointLight.position.set(1, 2, 0)
  pointLight.castShadow = true
  scene.add(pointLight)

  guiRef.add({ '控制光源': () => transformControls.attach(pointLight) }, '控制光源')

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  )
  plane.position.y -= 0.5
  plane.rotation.x = -Math.PI / 2
  plane.receiveShadow = true
  scene.add(plane)

  guiRef.add({ '控制平面': () => transformControls.attach(plane) }, '控制平面')
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
}
</script>
