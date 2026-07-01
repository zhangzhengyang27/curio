<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[7, 7, 7]"
    alpha
    antialias
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
  
  const gridHelper = new THREE.GridHelper(10, 10)
  
  scene.add(gridHelper)
  
  // 生成一个管道
  const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-5, 0, 0),
      new THREE.Vector3(0, 2.5, 0),
      new THREE.Vector3(5, 0, 0)
  ])
  
  const map = new THREE.TextureLoader().load(props.example?.globals?.FILE_HOST + '/images/texture/flyLine1.png')
  
  map.wrapS = THREE.RepeatWrapping
  
  map.repeat.set(5, 2)
  
  const tube = new THREE.TubeGeometry(curve, 200, 0.2, 2, false);
  
  const material = new THREE.MeshBasicMaterial({ map, transparent: true })
  
  const mesh = new THREE.Mesh(tube, material)
  
  scene.add(mesh)
  
  // 生成一个飞线
  const curve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3, 0, 3),
      new THREE.Vector3(0, 2, 0),
      new THREE.Vector3(3, 0, -4),
      
  ])
  
  const map1 = new THREE.TextureLoader().load(props.example?.globals?.FILE_HOST + '/images/texture/flyLine4.png')
  
  map1.wrapS = THREE.RepeatWrapping
  
  map1.wrapT = THREE.RepeatWrapping
  
  map1.repeat.set(3, 1)
  
  const tube1 = new THREE.TubeGeometry(curve1, 200, 0.03, 20, false);
  
  const material1 = new THREE.MeshBasicMaterial({map:map1, transparent: true , side: THREE.DoubleSide})
  
  const mesh1 = new THREE.Mesh(tube1, material1)
  
  scene.add(mesh1)
  
  const mesh2 = mesh.clone()
  
  mesh2.rotation.y = Math.PI / 2
  
  scene.add(mesh2)
  
  ctx.addUpdateCallback(() => {
    map.offset.x -= 0.01
        map1.offset.x -= 0.01
  })
}
</script>
