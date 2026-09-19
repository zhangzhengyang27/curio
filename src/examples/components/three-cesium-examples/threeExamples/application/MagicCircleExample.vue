<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 45, near: 0.001, far: 100 }"
    :camera-position="[0, 2, 4]"
    shadow-map
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(ctx: any) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  renderer.shadowMap.enabled = true
  scene.background = new THREE.Color(0x000000)

  controls.minDistance = 0.001
  controls.target.set(0, 1, 0)

  const gridHelper = new THREE.GridHelper(2)
  scene.add(gridHelper)

  const ambientLight = new THREE.AmbientLight(0xffffff, 1)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
  directionalLight.position.set(60, 30, -30)
  directionalLight.castShadow = true
  scene.add(directionalLight)

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 4)
  directionalLight2.position.set(60, 30, 30)
  directionalLight2.castShadow = true
  scene.add(directionalLight2)

  const FILE_HOST = props.example?.globals?.FILE_HOST || '/external-examples/3d-file-server/'
  const baseUrl = FILE_HOST + 'threeExamples/application/magicCircle/'

  const textureLoader = new THREE.TextureLoader()
  const pointTextures = [1, 2, 3, 4].map((i) => textureLoader.load(baseUrl + `point${i}.png`))
  const magicTexture = textureLoader.load(baseUrl + 'magic.png')
  const guangyunTexture = textureLoader.load(baseUrl + 'guangyun.png')

  const height = 2
  const circleRadius = 1
  const ringRadius = 0.5
  const ringScaleOffset = 0.01
  const circleRotateSpeed = 0.02
  const ringRotateSpeed = 0.01
  const particlesMinSize = 0.04
  const particlesMaxSize = 0.15
  const particlesRangeRadius = 0.8
  const particlesFloatSpeed = 0.01

  const circleMeshes: any[] = []
  const ring1Meshes: any[] = []
  const ring2Meshes: any[] = []
  const particles: any[] = []

  const group = new THREE.Group()

  const circleGeo = new THREE.CircleGeometry(circleRadius, 64)
  const circleMat = new THREE.MeshBasicMaterial({
    map: magicTexture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  })
  const circle = new THREE.Mesh(circleGeo, circleMat)
  circle.rotateX(-Math.PI / 2)
  circleMeshes.push(circle)
  group.add(circle)

  const ringGeo = getCylinderGeo(ringRadius, height)
  const ringMat = new THREE.MeshBasicMaterial({
    map: guangyunTexture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  })
  const ring1 = new THREE.Mesh(ringGeo, ringMat)
  ring1Meshes.push(ring1)
  group.add(ring1)

  const ring2 = ring1.clone()
  ring2.userData.ringScaleOffset = ringScaleOffset
  group.add(ring2)
  ring2Meshes.push(ring2)

  for (let j = 0; j < 10; j++) {
    for (let i = 0; i < pointTextures.length; i++) {
      const p = getParticles(
        particlesRangeRadius,
        height,
        pointTextures[i],
        particlesMinSize,
        particlesMaxSize,
        particlesFloatSpeed
      )
      particles.push(p)
      group.add(p)
    }
  }

  scene.add(group)

  ctx.addUpdateCallback(() => {
    circleMeshes.forEach((m) => m.rotateZ(circleRotateSpeed))
    ring1Meshes.forEach((m) => m.rotateY(ringRotateSpeed))
    ring2Meshes.forEach((m) => {
      m.rotateY(-ringRotateSpeed)
      if (m.scale.x < 0.9 || m.scale.x > 1.4) {
        m.userData.ringScaleOffset *= -1
      }
      m.scale.x -= m.userData.ringScaleOffset
      m.scale.z -= m.userData.ringScaleOffset
    })
    particles.forEach((p) => {
      p.position.y += p.userData.floatSpeed
      if (p.position.y >= height) {
        p.position.y = 0
        p.position.x = Math.random() * p.userData.radius * 2 - p.userData.radius
        p.position.z = Math.random() * p.userData.radius * 2 - p.userData.radius
        p.userData.floatSpeed = 0.001 + Math.random() * particlesFloatSpeed
      }
    })
  })

  function getParticles(radius: number, h: number, texture: any, pointMinSize: number, pointMaxSize: number, pointFloatSpeed: number) {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3))
    const material = new THREE.PointsMaterial({
      size: Math.random() * (pointMaxSize - pointMinSize) + pointMinSize,
      map: texture,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
      opacity: 0.2 + Math.random() * 0.8
    })
    const p = new THREE.Points(geometry, material)
    p.userData.floatSpeed = 0.001 + Math.random() * pointFloatSpeed
    p.userData.radius = radius
    p.position.x = Math.random() * radius * 2 - radius
    p.position.y = Math.random() * h
    p.position.z = Math.random() * radius * 2 - radius
    return p
  }

  function getCylinderGeo(radius = 1, h = 1, segment = 64) {
    const bottomPos: any[] = []
    const topPos: any[] = []
    const bottomUvs: any[] = []
    const topUvs: any[] = []
    const angleOffset = (Math.PI * 2) / segment
    const uvOffset = 1 / (segment - 1)
    for (let i = 0; i < segment; i++) {
      const x = Math.cos(angleOffset * i) * radius
      const z = Math.sin(angleOffset * i) * radius
      bottomPos.push(x, 0, z)
      topPos.push(x, h, z)
      bottomUvs.push(i * uvOffset, 0)
      topUvs.push(i * uvOffset, 1)
    }
    const positions = bottomPos.concat(topPos)
    const uvs = bottomUvs.concat(topUvs)
    const index: any[] = []
    for (let i = 0; i < segment; i++) {
      if (i != segment - 1) {
        index.push(i + segment + 1, i, i + segment)
        index.push(i, i + segment + 1, i + 1)
      } else {
        index.push(segment, i, i + segment)
        index.push(i, segment, 0)
      }
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2))
    geo.setIndex(new THREE.BufferAttribute(new Uint16Array(index), 1))
    return geo
  }
}
</script>
