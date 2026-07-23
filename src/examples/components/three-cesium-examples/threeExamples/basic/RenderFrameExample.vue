<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[10, 10, 10]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import { onUnmounted } from 'vue'

let gui = null
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'lil-gui'
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
  
  const stats = new Stats()
  
  stats.dom.style.top = '50px'
  
  document.body.appendChild(stats.dom)
  
  const clock = new THREE.Clock()
  
  let timeS = 0, fps = 60, renderT = 1 / fps
  
  gui = new GUI()
     
  gui.add({ fps }, 'fps', 1, 300).onFinishChange(v => {
  
      fps = v
  
      renderT = 1 / fps
  
  })
  
  ctx.addUpdateCallback(() => {
    timeS += clock.getDelta()
        if (timeS > renderT) {
            stats.update()
            timeS = 0
        }
  })
  
  const loader = new GLTFLoader()
  
  loader.setDRACOLoader(new DRACOLoader().setDecoderPath(props.example?.globals?.FILE_HOST + 'js/three/draco/'))
  
  const urls = [0, 1, 2, 3, 4, 5].map(k => (props.example?.globals?.FILE_HOST + 'files/sky/skyBox0/' + (k + 1) + '.png'));
  
  const textureCube = new THREE.CubeTextureLoader().load(urls);
  
  loader.load(
  
      props.example?.globals?.FILE_HOST + '/models/glb/build3.glb',
  
      gltf => {
  
          gltf.scene.traverse(child => {
  
              if (child.isMesh) child.material.envMap = textureCube
  
          })
  
          scene.add(gltf.scene)
  
      }
  
  )
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
