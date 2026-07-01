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

  controls.enableDamping = true
  
  scene.add(new THREE.AxesHelper(500), new THREE.AmbientLight(0xffffff, 2))
  
  // 文件地址
  const urls = [0, 1, 2, 3, 4, 5].map(k => (props.example?.globals?.FILE_HOST + 'files/sky/skyBox0/' + (k + 1) + '.png'));
  
  const textureCube = new THREE.CubeTextureLoader().load(urls);
  
  scene.background = textureCube;
  
  // 创建一个文件上传的输入框
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.glb'
  Object.assign(input.style, {
    position: 'absolute',
    top: '30px',
    left: '100px',
    zIndex: 9999
  })
  input.onchange = (e) => {
    const file = e.target.files[0]
    const url = URL.createObjectURL(file)
    new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath(props.example?.globals?.FILE_HOST + 'js/three/draco/')).load(url, (gltf) => {
      gltf.scene.traverse((child) => {
        if (child?.material) child.material.envMap = textureCube
      })
      scene.add(gltf.scene)
  
      // 主视图
      const box3 = new THREE.Box3().setFromObject(gltf.scene)
      const center = box3.getCenter(new THREE.Vector3())
      const size = box3.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const fov = camera.fov * (Math.PI / 180)
      const distance = (maxDim / 2) / Math.tan(fov / 2)
      controls.target.copy(center)
      controls.update()
  
    })
    URL.revokeObjectURL(url)
  }
  document.body.appendChild(input)
}
</script>
