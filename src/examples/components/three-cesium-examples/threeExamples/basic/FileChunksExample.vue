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
import JSZip from 'jszip'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

async function onReady(ctx) {
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
  Object.assign(input.style, { position: 'absolute', top: '30px', left: '100px', zIndex: 9999 })
  document.body.appendChild(input)
  
  const zip = new JSZip();
  
  input.onchange = async (e) => {
  
    const file = e.target.files[0]
  
    const chunkSize = Math.ceil(file.size / 5) // 每个分片的大小，这里分成5份
  
    for (let i = 0; i * chunkSize < file.size; i++) {
  
      zip.file(`${i}.chunk`, file.slice(i * chunkSize, (i + 1) * chunkSize))
  
    }
  
    const zipBlob = await zip.generateAsync({ type: 'blob' })
  
    downloadBlob(zipBlob, file.name.split('.').slice(0, -1).join('.') + '_chunks.zip')
  
    // 演示如何加载分片压缩包
    loadZipChunksModel(zipBlob)
  
  }
  
  function downloadBlob(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
  
  function loadZipChunksModel(zipBlob) {
  
    const loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath(props.example?.globals?.FILE_HOST + 'js/three/draco/'))
  
    JSZip.loadAsync(zipBlob).then(async (unzipped) => {
  
      const chunkFiles = Object.keys(unzipped.files).filter(name => name.endsWith('.chunk')).sort((a, b) => parseInt(a) - parseInt(b))
  
      const chunks = []
      for (const chunkFile of chunkFiles) {
        const chunkData = await unzipped.files[chunkFile].async('arraybuffer')
        chunks.push(chunkData)
      }
  
      const completeArray = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0))
      let offset = 0
      for (const chunk of chunks) {
        completeArray.set(new Uint8Array(chunk), offset)
        offset += chunk.byteLength
      }
  
      const blob = new Blob([completeArray], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
  
      loader.load(url, (gltf) => {
        gltf.scene.traverse((child) => {
          if (child?.material) child.material.envMap = textureCube
        })
        scene.add(gltf.scene)
        URL.revokeObjectURL(url)
      })
  
    })
  
  }
}
</script>
