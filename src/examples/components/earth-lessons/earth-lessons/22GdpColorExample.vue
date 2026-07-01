<template>
  <ExampleScene
    camera="orthographic"
    :camera-options="{ size: 120 }"
    :camera-position="[165, 164, -339]"
    :camera-look-at="[0, 0, 0]"
    :clear-color="0xb9d3ff"
    :enable-controls="true"
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import ExampleScene from '../../ExampleScene.vue'

const baseUrl = '/external-examples/earth-lessons/22-gdp-color/'
const rotationSpeed = 0.004

function resolveExampleUrl(url) {
  if (typeof url !== 'string') return url
  if (/^https?:\/\//.test(url) || url.startsWith('/')) return url
  const base = window.__EXAMPLE_BASE_URL__ || baseUrl
  const relative = url.startsWith('./') ? url.slice(2) : url
  return base + relative
}

let loadersPatched = false
function patchLoaders() {
  if (loadersPatched) return
  loadersPatched = true

  const originalTextureLoad = THREE.TextureLoader.prototype.load
  THREE.TextureLoader.prototype.load = function (url, onLoad, onProgress, onError) {
    return originalTextureLoad.call(this, resolveExampleUrl(url), onLoad, onProgress, onError)
  }

  const originalFileLoad = THREE.FileLoader.prototype.load
  THREE.FileLoader.prototype.load = function (url, onLoad, onProgress, onError) {
    return originalFileLoad.call(this, resolveExampleUrl(url), onLoad, onProgress, onError)
  }
}

async function onReady(ctx) {
  patchLoaders()
  window.__EXAMPLE_BASE_URL__ = baseUrl

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
</script>
