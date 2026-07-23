<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 30, 30]"
    :camera-look-at="[0, 0, 0]"
    :clear-color="0x444444"
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import { onUnmounted } from 'vue'

let gui = null
import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const state = {
  animateBones: false,
}

let mesh = null
let skeletonHelper = null

function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera
  const controls = ctx.controls

  controls.enableZoom = false

  const lights = []
  lights[0] = new THREE.DirectionalLight(0xffffff, 3)
  lights[1] = new THREE.DirectionalLight(0xffffff, 3)
  lights[2] = new THREE.DirectionalLight(0xffffff, 3)

  lights[0].position.set(0, 200, 0)
  lights[1].position.set(100, 200, 100)
  lights[2].position.set(-100, -200, -100)

  scene.add(lights[0])
  scene.add(lights[1])
  scene.add(lights[2])

  initBones(scene)
  setupDatGui()

  ctx.addUpdateCallback(() => {
    if (state.animateBones && mesh) {
      const time = Date.now() * 0.001
      for (let i = 0; i < mesh.skeleton.bones.length; i++) {
        mesh.skeleton.bones[i].rotation.z = (Math.sin(time) * 2) / mesh.skeleton.bones.length
      }
    }
  })
}

function createGeometry(sizing) {
  const geometry = new THREE.BoxGeometry(5, sizing.height, 5, 1, sizing.segmentCount * 10)
  const position = geometry.attributes.position
  const vertex = new THREE.Vector3()
  const skinIndices = []
  const skinWeights = []

  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i)
    const y = vertex.y + sizing.halfHeight
    const skinIndex = Math.floor(y / sizing.segmentHeight)
    const skinWeight = (y % sizing.segmentHeight) / sizing.segmentHeight

    skinIndices.push(skinIndex, skinIndex + 1, 0, 0)
    skinWeights.push(1 - skinWeight, skinWeight, 0, 0)
  }

  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4))
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4))

  return geometry
}

function createBones(sizing) {
  const bones = []
  let prevBone = new THREE.Bone()
  bones.push(prevBone)
  prevBone.position.y = -sizing.halfHeight

  for (let i = 0; i < sizing.segmentCount; i++) {
    const bone = new THREE.Bone()
    bone.position.y = sizing.segmentHeight
    bones.push(bone)
    prevBone.add(bone)
    prevBone = bone
  }

  return bones
}

function createMesh(geometry, bones, scene) {
  const material = new THREE.MeshPhongMaterial({
    color: 0x156289,
    emissive: 0x072534,
    side: THREE.DoubleSide,
    flatShading: true,
  })

  const skinnedMesh = new THREE.SkinnedMesh(geometry, material)
  const skeleton = new THREE.Skeleton(bones)

  skinnedMesh.add(bones[0])
  skinnedMesh.bind(skeleton)

  skeletonHelper = new THREE.SkeletonHelper(skinnedMesh)
  skeletonHelper.material.linewidth = 2
  scene.add(skeletonHelper)

  return skinnedMesh
}

function setupDatGui() {
  gui = new GUI()
  let folder = gui.addFolder('General Options')

  folder.add(state, 'animateBones')
  folder.controllers[0].name('Animate Bones')

  folder.add(mesh, 'pose')
  folder.controllers[1].name('.pose()')

  const bones = mesh.skeleton.bones
  for (let i = 0; i < bones.length; i++) {
    const bone = bones[i]
    folder = gui.addFolder('Bone ' + i)

    folder.add(bone.position, 'x', -10 + bone.position.x, 10 + bone.position.x)
    folder.add(bone.position, 'y', -10 + bone.position.y, 10 + bone.position.y)
    folder.add(bone.position, 'z', -10 + bone.position.z, 10 + bone.position.z)

    folder.add(bone.rotation, 'x', -Math.PI * 0.5, Math.PI * 0.5)
    folder.add(bone.rotation, 'y', -Math.PI * 0.5, Math.PI * 0.5)
    folder.add(bone.rotation, 'z', -Math.PI * 0.5, Math.PI * 0.5)

    folder.add(bone.scale, 'x', 0, 2)
    folder.add(bone.scale, 'y', 0, 2)
    folder.add(bone.scale, 'z', 0, 2)

    folder.controllers[0].name('position.x')
    folder.controllers[1].name('position.y')
    folder.controllers[2].name('position.z')
    folder.controllers[3].name('rotation.x')
    folder.controllers[4].name('rotation.y')
    folder.controllers[5].name('rotation.z')
    folder.controllers[6].name('scale.x')
    folder.controllers[7].name('scale.y')
    folder.controllers[8].name('scale.z')
  }
}

function initBones(scene) {
  const segmentHeight = 8
  const segmentCount = 4
  const height = segmentHeight * segmentCount
  const halfHeight = height * 0.5

  const sizing = {
    segmentHeight,
    segmentCount,
    height,
    halfHeight,
  }

  const geometry = createGeometry(sizing)
  const bones = createBones(sizing)
  mesh = createMesh(geometry, bones, scene)

  mesh.scale.multiplyScalar(1)
  scene.add(mesh)
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
