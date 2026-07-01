<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 2]"
    :clear-color="0x00acec"
    @ready="onReady"
  />
</template>

<script setup>
import { Sprite, SpriteMaterial, TextureLoader } from 'three'
import ExampleScene from '../../ExampleScene.vue'

function onReady(ctx) {
  const { scene } = ctx

  const material = new SpriteMaterial({
    color: 0x00acec,
    alphaToCoverage: true,
  })
  const textureLoader = new TextureLoader()
  const grassDiffLoader = textureLoader.loadAsync(
    '/external-examples/threejs-lesson/06-materials/public/textures/grass/grass-diff.jpg'
  )
  const grassMaskLoader = textureLoader.loadAsync(
    '/external-examples/threejs-lesson/06-materials/public/textures/grass/grass-mask.jpg'
  )
  Promise.all([grassDiffLoader, grassMaskLoader]).then((textures) => {
    material.map = textures[0]
    material.alphaMap = textures[1]
  })

  const sprite = new Sprite(material)
  scene.add(sprite)
}
</script>
