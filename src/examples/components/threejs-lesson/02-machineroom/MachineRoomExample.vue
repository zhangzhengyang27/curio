<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 10, 15]"
    :camera-look-at="[0, 0, 0]"
    :clear-color="0x1a1a2a"
    :shadow-map="true"
    @ready="onReady"
  ></ExampleScene>
</template>

<script setup>
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import ExampleScene from '../../ExampleScene.vue'

const modelPath = '/external-examples/threejs-lesson/02-machineroom/public/models/'
const gltfLoader = new GLTFLoader()
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()

let cabinets = []
let curCabinet = null
let maps = new Map()
let ctxRef = null

function crtTexture(imgName) {
  let texture = maps.get(imgName)
  if (!texture) {
    texture = new THREE.TextureLoader().load(modelPath + imgName)
    texture.flipY = false
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    maps.set(imgName, texture)
  }
  return texture
}

function changeMat(obj, map, color) {
  if (map) {
    obj.material = new THREE.MeshBasicMaterial({
      map: crtTexture(map.name),
    })
  } else {
    obj.material = new THREE.MeshBasicMaterial({ color })
  }
}

function loadGLTF(scene) {
  gltfLoader.load(modelPath + 'machineRoom.gltf', ({ scene: { children } }) => {
    children.forEach((obj) => {
      const { map, color } = obj.material || {}
      changeMat(obj, map, color)
      if (obj.name && obj.name.includes('cabinet')) {
        cabinets.push(obj)
      }
    })
    scene.add(...children)
  })
}

function selectCabinet(x, y) {
  if (!ctxRef) return
  const { camera, renderer } = ctxRef
  const { width, height } = renderer.domElement
  pointer.set((x / width) * 2 - 1, -(y / height) * 2 + 1)
  raycaster.setFromCamera(pointer, camera)
  const intersect = raycaster.intersectObjects(cabinets)[0]
  const intersectObj = intersect ? intersect.object : null

  if (curCabinet && curCabinet !== intersectObj) {
    curCabinet.material.setValues({ map: maps.get('cabinet.jpg') })
  }
  if (intersectObj) {
    if (intersectObj !== curCabinet) {
      curCabinet = intersectObj
      intersectObj.material.setValues({ map: maps.get('cabinet-hover.jpg') })
    }
  } else if (curCabinet) {
    curCabinet = null
  }
}

function onReady(ctx) {
  ctxRef = ctx
  const { scene, canvas } = ctx

  const ambient = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xffffff, 1)
  dir.position.set(5, 10, 5)
  scene.add(dir)

  crtTexture('cabinet-hover.jpg')
  loadGLTF(scene)

  canvas.addEventListener('mousemove', (e) => {
    selectCabinet(e.offsetX, e.offsetY)
  })
}
</script>
