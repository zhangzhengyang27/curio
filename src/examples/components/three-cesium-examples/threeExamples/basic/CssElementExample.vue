<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 75, near: 0.1, far: 1000 }"
    :camera-position="[10, 10, 10]"
    css-renderer="both"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup>
import * as THREE from 'three'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const HOST = props.example?.globals?.HOST || '/external-examples/three-cesium-examples/'

let css2dObjects = []
let css3dObjects = []

function createDom(text) {
  const div = document.createElement('div')
  div.style.display = 'flex'
  div.style.flexDirection = 'column'
  div.style.alignItems = 'center'
  div.style.color = 'white'

  const img = document.createElement('img')
  img.src = HOST + '/files/author/z2586300277.png'
  img.style.width = '50px'
  img.style.height = '50px'
  img.style.pointerEvents = 'auto'

  const span = document.createElement('span')
  span.textContent = text
  span.style.pointerEvents = 'auto'

  div.appendChild(img)
  div.appendChild(span)
  return div
}

function setCss2dDOM(dom, position, scene) {
  dom.style.pointerEvents = 'auto'
  const mesh = new CSS2DObject(dom)
  mesh.position.set(position.x, position.y, position.z)
  scene.add(mesh)
  css2dObjects.push(mesh)
  return mesh
}

function setCss3dDOM(dom, position, scene) {
  const mesh = new CSS3DObject(dom)
  mesh.position.set(position.x, position.y, position.z)
  mesh.scale.multiplyScalar(0.02)
  scene.add(mesh)
  css3dObjects.push(mesh)
  return mesh
}

function onReady(ctx) {
  const scene = ctx.scene

  scene.add(new THREE.AxesHelper(500))

  for (let i = 0; i < 5; i++) {
    setCss2dDOM(createDom('2D' + i), { x: 0, y: 0, z: i * 2 }, scene)
    setCss3dDOM(createDom('3D' + i), { x: 0, y: i * 2, z: 0 }, scene)
  }
}

function onBeforeDispose() {
  css2dObjects = []
  css3dObjects = []
}
</script>
