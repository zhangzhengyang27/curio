<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 50, near: 0.1, far: 1000 }"
    :camera-position="[20, 20, 20]"
    css-renderer="css3d"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup>
import * as THREE from 'three'
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const HOST = props.example?.globals?.HOST || '/external-examples/three-cesium-examples/'

let list = []
let meshs = []

function createDom(text) {
  const div = document.createElement('div')
  div.style.position = 'absolute'
  div.style.transition = 'all 0.2s'
  div.style.display = 'flex'
  div.style.flexDirection = 'column'
  div.style.alignItems = 'center'
  div.style.color = 'white'
  div.style.pointerEvents = 'none'

  const img = document.createElement('img')
  img.src = HOST + '/files/author/flowers-10.jpg'
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

function setCss3dDOM(div, position, scene) {
  const mesh = new CSS3DObject(div)
  mesh.div = div
  mesh.position.set(position.x, position.y, position.z)
  scene.add(mesh)
  return mesh
}

function createRender(mesh, camera) {
  const direction = new THREE.Vector3().subVectors(mesh.position, camera.position).normalize()
  const raycaster = new THREE.Raycaster(camera.position, direction, 0, mesh.position.distanceTo(camera.position))
  const intersects = raycaster.intersectObjects(meshs)
  mesh.div.style.opacity = intersects.length > 0 ? '0' : '1'
}

function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera

  scene.add(new THREE.GridHelper(50, 10))

  const R = () => Math.random() * 20 - 10

  for (let i = 0; i < 100; i++) {
    const mesh = setCss3dDOM(createDom('顽皮宝' + i), { x: R(), y: R(), z: R() }, scene)
    mesh.scale.multiplyScalar(0.02)
    mesh.lookAt(R(), R(), R())
    mesh.update = () => createRender(mesh, camera)
    list.push(mesh)

    if (i % 40 === 0) {
      const boxGeometry = new THREE.TorusKnotGeometry(4, 0.6, 100, 16)
      const boxMesh = new THREE.Mesh(boxGeometry, new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff, transparent: true, opacity: 0.45 }))
      boxMesh.position.set(R(), R(), R())
      meshs.push(boxMesh)
      scene.add(boxMesh)
    }
  }

  ctx.addUpdateCallback(() => {
    meshs.forEach((mesh) => {
      mesh.rotation.y += 0.01
      mesh.rotation.x += 0.01
    })
    list.forEach((mesh) => mesh.update())
  })
}

function onBeforeDispose() {
  list = []
  meshs = []
}
</script>
