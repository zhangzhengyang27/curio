<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[30, 30, 30]"
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import { Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene, TextureLoader, WebGLRenderer } from 'three'
import * as THREE from 'three'
import gsap from 'gsap'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  const size = { width: window.innerWidth, height: window.innerHeight }
  
  const circlePlane = new PlaneGeometry(6, 6)
  const circleTexture = new TextureLoader().load(props.example?.globals?.FILE_HOST + 'images/channels/label.png')
  const circleMaterial = new MeshBasicMaterial({
      color: 0xffffff,
      map: circleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
  })
  const circleMesh = new Mesh(circlePlane, circleMaterial)
  circleMesh.rotation.x = -Math.PI / 2
  gsap.to(circleMesh.scale, {
      duration: 1 + Math.random() * 0.5,
      x: 1.5,
      y: 1.5,
      repeat: -1
  })
  
  const lightPillarTexture = new THREE.TextureLoader().load(props.example?.globals?.FILE_HOST + 'images/channels/light_column.png')
  const lightPillarGeometry = new THREE.PlaneGeometry(3, 20)
  const lightPillarMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: lightPillarTexture,
      alphaMap: lightPillarTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
  })
  const lightPillar = new THREE.Mesh(lightPillarGeometry, lightPillarMaterial)
  lightPillar.add(lightPillar.clone().rotateY(Math.PI / 2))
  circleMesh.position.set(0, -10, 0)
  
  lightPillar.add(circleMesh)
  scene.add(lightPillar)
}
</script>
