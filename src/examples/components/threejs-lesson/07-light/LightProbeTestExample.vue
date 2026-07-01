<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 6]"
    @ready="onReady"
  ></ExampleScene>
</template>

<script setup>
import * as THREE from 'three'
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator.js'
import ExampleScene from '../../ExampleScene.vue'

function onReady(ctx) {
  const { scene } = ctx

  const lightProbe = new THREE.LightProbe()
  scene.add(lightProbe)

  const genCubeUrls = function (prefix, postfix) {
    return [
      prefix + 'px' + postfix,
      prefix + 'nx' + postfix,
      prefix + 'py' + postfix,
      prefix + 'ny' + postfix,
      prefix + 'pz' + postfix,
      prefix + 'nz' + postfix,
    ]
  }
  const urls = genCubeUrls(
    '/external-examples/threejs-lesson/07-light/public/textures/pisa/',
    '.png'
  )

  new THREE.CubeTextureLoader().load(urls, function (cubeTexture) {
    cubeTexture.colorSpace = THREE.SRGBColorSpace
    scene.background = cubeTexture
    lightProbe.copy(LightProbeGenerator.fromCubeTexture(cubeTexture))

    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0,
      envMap: cubeTexture,
      envMapIntensity: 2,
    })
    const sphereGeometry = new THREE.SphereGeometry(1, 36, 36)

    scene.add(new THREE.Mesh(sphereGeometry, mat))
  })
}
</script>
