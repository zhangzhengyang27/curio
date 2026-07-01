<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 20, 60]"
    :clear-color="color || 0xffffff"
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
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

  controls.enableDamping = true
  
  scene.add(new THREE.AmbientLight(0xffffff, 1))
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  
  directionalLight.position.set(0, 100, 0)
  
  scene.add(directionalLight)
  
  new GLTFLoader().load((props.example?.globals?.FILE_HOST + 'files/model/Fox.glb'), (gltf) => {
  
      gltf.scene.position.set(0, 0, -500)
  
      scene.add(gltf.scene)
  
  })
  
  new GLTFLoader().load((props.example?.globals?.FILE_HOST + 'models/glb/foorGround.glb'), (gltf) => {
  
      const model = gltf.scene
  
      model.position.z += 60
  
      model.position.x -= 200
  
      model.scale.set(10, 10, 10)
  
      scene.add(model)
  
  })
  
  function getFog(type, color) {
  
      if (type === 'linear') return new THREE.Fog(color || 0xffffff, 10, 800)
  
      else return new THREE.FogExp2(color || 0xffffff, 0.005)
  
  }
  
  const folder = new GUI()
  
  let fogFolder = null
  
  const fogOption = { type: scene.fog instanceof THREE.FogExp2 ? 'exp2' : 'linear', enable: !!scene.fog }
  
  folder.add(fogOption, 'type', ['linear', 'exp2']).name('雾类型').onChange((v) => {
  
      scene.fog = getFog(v, scene.fog?.color)
  
      setFogFolder(v)
  
  })
  
  folder.add(fogOption, 'enable').name('启用雾').onChange((v) => {
  
      if (v) scene.fog = getFog(fogOption.type)
  
      else scene.fog = null
  
      setFogFolder(fogOption.type)
  
  })
  
  fogOption.enable && setFogFolder(fogOption.type)
  
  function setFogFolder(type) {
  
      if (fogFolder) {
  
          fogFolder.destroy?.()
  
          fogFolder = null
  
      }
  
      if (!scene.fog) return
  
      fogFolder = folder.addFolder(type + '雾')
  
      fogFolder.addColor(scene.fog, 'color').name('颜色').onChange((v) => renderer.setClearColor(v))
  
      if (type === 'linear') {
  
          fogFolder.add(scene.fog, 'near').name('近点')
  
          fogFolder.add(scene.fog, 'far').name('远点')
  
      }
  
      else fogFolder.add(scene.fog, 'density').name('密度').min(0).max(0.1).step(0.00001)
  
  }
}
</script>
