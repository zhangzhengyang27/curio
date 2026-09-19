<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 3, 6]"
    :camera-look-at="[0, 0, 0]"
    :clear-color="0xaaaaaa"
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import {
  EquirectangularReflectionMapping,
  Fog,
  Mesh,
  MeshBasicMaterial,
  MultiplyOperation,
  SphereGeometry,
  TextureLoader,
} from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import ExampleScene from '../../ExampleScene.vue'

function onReady(ctx: any) {
  const { scene } = ctx

  const textureLoader = new TextureLoader()
  const ballColorTexture = textureLoader.load('/external-examples/threejs-lesson/06-materials/public/textures/ball/color.jpg')
  const ballAmbientOcclusionTexture = textureLoader.load(
    '/external-examples/threejs-lesson/06-materials/public/textures/ball/ambientOcclusion.jpg'
  )
  const lightTexture = textureLoader.load('/external-examples/threejs-lesson/06-materials/public/textures/ball/light.jpg')

  const sphereGeometry = new SphereGeometry(1, 36, 36)
  sphereGeometry.setAttribute('uv2', sphereGeometry.attributes.uv)

  const mat = new MeshBasicMaterial({})
  mat.map = ballColorTexture
  mat.transparent = true
  mat.aoMap = ballAmbientOcclusionTexture
  mat.lightMap = lightTexture
  mat.lightMapIntensity = 1.3

  new RGBELoader()
    .loadAsync('/external-examples/threejs-lesson/06-materials/public/textures/environment/shop.hdr')
    .then((texture) => {
      texture.mapping = EquirectangularReflectionMapping
      mat.envMap = texture
    })

  mat.reflectivity = 0.5
  mat.combine = MultiplyOperation
  scene.fog = new Fog(0xffffff, 3, 10)
  mat.fog = false
  mat.refractionRatio = 0.2

  scene.add(new Mesh(sphereGeometry, mat))
}
</script>
