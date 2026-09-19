<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[5, 2, 8]"
    :clear-color="0xbfe3dd"
    antialias
    custom-render
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue'

let gui: any = null
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { GUI } from 'lil-gui'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(ctx: any) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  controls.enableDamping = true
  
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  
  const composer = new EffectComposer(renderer);
  
  const renderPass = new RenderPass(scene, camera)
  composer.addPass(renderPass);
  
  const outputPass = new OutputPass()
  composer.addPass(outputPass)
  
  const data = { renderType: 'effect' }
  
  const ToneMappingList = {
      No: THREE.NoToneMapping,
      Linear: THREE.LinearToneMapping,
      Reinhard: THREE.ReinhardToneMapping,
      Cineon: THREE.CineonToneMapping,
      ACESFilmic: THREE.ACESFilmicToneMapping,
      AgX: THREE.AgXToneMapping,
      Neutral: THREE.NeutralToneMapping,
      Custom: THREE.CustomToneMapping
  }
  
  gui = new GUI()
  gui.add(renderer, 'outputColorSpace', [THREE.SRGBColorSpace, THREE.LinearSRGBColorSpace])
  gui.add(renderer, 'toneMapping', Object.keys(ToneMappingList)).onChange((value: any) => renderer.toneMapping = (ToneMappingList as any)[value])
  gui.add(renderer, 'toneMappingExposure', 0, 10)
  gui.add(data, 'renderType', ['effect', 'normal', 'both'])
  gui.add(outputPass, 'enabled').name('OutputPass_enabled')
  
  ctx.addUpdateCallback(() => {
    if (data.renderType === 'effect') composer.render()
        else {
            composer.render()
        }
  })
  
  const loader = new GLTFLoader()
  loader.setDRACOLoader(new DRACOLoader().setDecoderPath(props.example?.globals?.FILE_HOST + 'js/three/draco/'))
  loader.load(
      props.example?.globals?.FILE_HOST + '/files/model/LittlestTokyo.glb',
      gltf => {
          gltf.scene.position.set(1, 1, 0);
          gltf.scene.scale.set(0.01, 0.01, 0.01);
          scene.add(gltf.scene)
      }
  )
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
