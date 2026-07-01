<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[10, 10, 10]"
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
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
  
  scene.add(new THREE.AxesHelper(50))
  
  const R = () => Math.random() * 10 - 5
  
  const list = []
  
  for (let i = 0; i < 30; i++) {
  
      const div = createDom('D' + i)
  
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff }))
  
      mesh.position.set(R(), R(), R())
  
      scene.add(mesh)
  
      mesh.div = div
  
      list.push(mesh)
  
  }
  
  function updateCSS2DVisibility() {
  
      list.forEach(mesh => {
  
          const worldPosition = mesh.getWorldPosition(new THREE.Vector3())
  
          worldPosition.project(camera);
  
          const width = renderer.domElement.clientWidth
  
          const height = renderer.domElement.clientHeight
  
          const screenX = (worldPosition.x + 1) / 2 * width
  
          const screenY = (-worldPosition.y + 1) / 2 * height
  
          mesh.div.style.left = screenX + 'px'
  
          mesh.div.style.top = screenY + 'px'
        
      })
  
  }
  
  ctx.addUpdateCallback(() => {
    updateCSS2DVisibility()
  })
  
  // 创建dom
  function createDom(text) {
  
      const div = document.createElement('div')
  
      div.style.position = 'absolute'
  
      const img = document.createElement('img')
  
      img.src = props.example?.globals?.HOST + '/files/author/KallkaGo.jpg'
  
      img.style.width = '50px'
  
      img.style.height = '50px'
  
      div.appendChild(img)
  
      div.innerHTML += text
  
      div.style.color = 'white'
  
      document.body.appendChild(div)
  
      return div
  
  }
}
</script>
