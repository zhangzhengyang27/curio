<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[5, 5, 5]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
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
  
  scene.add(new THREE.AmbientLight(0xffffff, 3))
  
  const urls = [0, 1, 2, 3, 4, 5].map(k => (props.example?.globals?.FILE_HOST + 'files/sky/skyBox0/' + (k + 1) + '.png'));
  
  const textureCube = new THREE.CubeTextureLoader().load(urls);
  
  scene.background = textureCube
  
  const objLoader = new OBJLoader()
  
  const mtlLoader = new MTLLoader()
  
  mtlLoader.load(props.example?.globals?.FILE_HOST + 'files/model/house/house.mtl', (mtl) => {
  
      mtl.preload()
  
      objLoader.setMaterials(mtl)
  
      objLoader.load(props.example?.globals?.FILE_HOST + 'files/model/house/house.obj', (obj) => scene.add(obj))
  
  })
  
  const exporter = new GLTFExporter();
  
  const button = document.createElement('button');
  button.textContent = '导出模型';
  button.style.position = 'absolute';
  button.style.top = '10px';
  button.style.left = '100px';
  ctx.container.appendChild(button);
  
  button.onclick = async () => {
  
      exporter.parse(scene, (result) => {
  
          const outBlob = result instanceof ArrayBuffer
              ? new Blob([result], { type: 'model/gltf-binary' })
              : new Blob([JSON.stringify(result, null, 2)], { type: 'model/gltf+json' })
  
          const link = document.createElement('a')
          link.href = URL.createObjectURL(outBlob)
          link.download = result instanceof ArrayBuffer ? 'scene.glb' : 'scene.gltf'
          link.click()
          URL.revokeObjectURL(link.href)
  
      }, { binary: true, onlyVisible: true, embedImages: true } as any)
  
  }
}
</script>
