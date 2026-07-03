<template>
  <ExampleScene
    camera="orthographic"
    :camera-options="{ size: 120 }"
    :camera-position="[-102, 205, -342]"
    :camera-look-at="[0, 0, 0]"
    :clear-color="0xb9d3ff"
    :enable-controls="true"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup>
import * as THREE from 'three'
import ExampleScene from '../../ExampleScene.vue'
import { pushEarthLessonsBaseUrl, popEarthLessonsBaseUrl } from './useEarthLessonsBaseUrl.js'

const baseUrl = '/external-examples/earth-lessons/09-railway-lines/'
const rotationSpeed = 0.001

async function onReady(ctx) {
  pushEarthLessonsBaseUrl(baseUrl)

  const { earth } = await import(`${baseUrl}earth.js`)
  ctx.scene.add(earth)

  const dir1 = new THREE.DirectionalLight(0xffffff, 0.6)
  dir1.position.set(400, 200, 300)
  ctx.scene.add(dir1)

  const dir2 = new THREE.DirectionalLight(0xffffff, 0.6)
  dir2.position.set(-400, -200, -300)
  ctx.scene.add(dir2)

  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  ctx.scene.add(ambient)

  ctx.addUpdateCallback(() => {
    earth.rotation.y += rotationSpeed
  })
}

function onBeforeDispose() {
  popEarthLessonsBaseUrl()
}
</script>
