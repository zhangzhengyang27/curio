<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 400, 400]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
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

  const loadingDiv = document.createElement('div')
  loadingDiv.innerText = '加载中...'
  Object.assign(loadingDiv.style, {
      pointerEvents: 'none',
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%,-50%)',
      color: 'white',
      fontSize: '20px',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: '10px 20px',
      borderRadius: '5px'
  })
  
  document.body.appendChild(loadingDiv)
  
  controls.enableDamping = true
  
  scene.add(new THREE.AmbientLight(0xffffff, 3))
  
  const manager = new THREE.LoadingManager();
  
  manager.onStart = function (url, itemsLoaded, itemsTotal) {
      loadingDiv.innerText = '开始加载'
  };
  
  manager.onLoad = function () {
      loadingDiv.innerHTML = '加载完成'
  };
  
  manager.onProgress = function (url, itemsLoaded, itemsTotal) {
      loadingDiv.innerText = '导入' + (itemsLoaded / itemsTotal * 100).toFixed(2) + '%' 
  }
  
  manager.onError = function (url) {
  
  }
  
  const loader = new GLTFLoader(manager)
  
  loader.setDRACOLoader(new DRACOLoader().setDecoderPath(props.example?.globals?.FILE_HOST + 'js/three/draco/'))
  
  loader.load(
  
      props.example?.globals?.FILE_HOST + '/files/model/LittlestTokyo.glb?time=' + new Date().getTime(),
  
      gltf => {
  
          scene.add(gltf.scene)
  
      },
  
      xhr => {
  
          loadingDiv.innerText = '下载' + (xhr.loaded / xhr.total * 100).toFixed(2) + '%'
  
      }
  
  )
}
</script>
