<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 6]"
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js'
import ExampleScene from '../../ExampleScene.vue'

function onReady(ctx: any) {
  const { scene } = ctx

  const textureLoader = new THREE.TextureLoader()
  const textureFlare0 = textureLoader.load(
    '/external-examples/threejs-lesson/07-light/public/textures/lensflare/lensflare0.png'
  )
  const textureFlare3 = textureLoader.load(
    '/external-examples/threejs-lesson/07-light/public/textures/lensflare/lensflare3.png'
  )

  const light = new THREE.PointLight(0x00acec)
  light.position.set(0, 0, 2)

  scene.add(light)

  const lensflare = new Lensflare()
  lensflare.addElement(new LensflareElement(textureFlare0, 700, 0, light.color))
  lensflare.addElement(new LensflareElement(textureFlare3, 60, 0.6))
  lensflare.addElement(new LensflareElement(textureFlare3, 70, 0.7))
  lensflare.addElement(new LensflareElement(textureFlare3, 120, 0.9))
  lensflare.addElement(new LensflareElement(textureFlare3, 70, 1))
  light.add(lensflare)
}
</script>
