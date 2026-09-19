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
import { Color, EquirectangularReflectionMapping, Mesh, MeshPhysicalMaterial, SphereGeometry, TextureLoader } from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import ExampleScene from '../../ExampleScene.vue'

function onReady(ctx: any) {
  const { scene } = ctx

  new RGBELoader()
    .loadAsync('/external-examples/threejs-lesson/06-materials/public/textures/environment/shop.hdr')
    .then((texture) => {
      texture.mapping = EquirectangularReflectionMapping
      scene.environment = texture
      scene.background = texture
    })

  const textureLoader = new TextureLoader()
  const alphaTexture3 = textureLoader.load('/external-examples/threejs-lesson/06-materials/public/textures/ball/alpha3.png')

  const sphereGeometry = new SphereGeometry(1, 36, 36)
  const mat = new MeshPhysicalMaterial()
  mat.clearcoat = 1
  mat.specularIntensity = 10
  mat.specularIntensityMap = alphaTexture3
  mat.specularColor = new Color('red')

  scene.add(new Mesh(sphereGeometry, mat))
}
</script>
