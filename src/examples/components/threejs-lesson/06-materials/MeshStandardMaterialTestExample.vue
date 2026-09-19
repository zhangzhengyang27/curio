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
import { Color, EquirectangularReflectionMapping, Mesh, MeshStandardMaterial, SphereGeometry } from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import ExampleScene from '../../ExampleScene.vue'

function onReady(ctx: any) {
  const { scene } = ctx

  new RGBELoader()
    .loadAsync('/external-examples/threejs-lesson/06-materials/public/textures/environment/shop.hdr')
    .then((texture) => {
      texture.mapping = EquirectangularReflectionMapping
      scene.environment = texture
    })

  const sphereGeometry = new SphereGeometry(1, 36, 36)
  const mat = new MeshStandardMaterial({ color: 0xaaaaaa })
  mat.emissive = new Color(0x00acec)
  mat.emissiveIntensity = 0.3
  mat.roughness = 0.567

  scene.add(new Mesh(sphereGeometry, mat))
}
</script>
