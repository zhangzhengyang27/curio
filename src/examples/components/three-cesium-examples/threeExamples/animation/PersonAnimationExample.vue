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
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import gsap from 'gsap'
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

  scene.add(new THREE.AmbientLight(0xffffff, 4), new THREE.GridHelper(40, 20))
  
  let group: any = null
  
  new GLTFLoader().load(props.example?.globals?.FILE_HOST + 'files/model/Soldier.glb',
  
      gltf => {
  
          group = gltf.scene
  
          scene.add(group)
  
          const clock = new THREE.Clock() // 时钟
  
          const mixer = new THREE.AnimationMixer(group) // 模型动画
  
          group.mixerAnimateRender = () => mixer.update(clock.getDelta()) // 动画帧
  
          group.currentAction = mixer.clipAction(gltf.animations[3]) // walk 动画
  
      }
  
  )
  
  const raycaster = new THREE.Raycaster() // 射线
  
  const targetPositon = new THREE.Vector3() // 目标位置
  
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) // 碰撞面
  
  // 点击事件
  ctx.canvas.addEventListener('click', (event: any) => {
  
      const mouse = new THREE.Vector2((event.offsetX / event.target.clientWidth) * 2 - 1, -(event.offsetY / event.target.clientHeight) * 2 + 1)
  
      raycaster.setFromCamera(mouse, camera)
  
      raycaster.ray.intersectPlane(plane, targetPositon)
  
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial())
  
      mesh.position.copy(targetPositon)
  
      scene.add(mesh)
  
      goAddress(group, targetPositon)
  
  })
  
  let oldgsap: any = null
  
  function goAddress(group: any, targetPositon: any) {
  
      oldgsap?.kill() // 停止上一个动画
  
      const distance = group.position.distanceTo(targetPositon) // 距离
  
      const vector = camera.position.clone().sub(group.position) // camera 和 group 差向量
  
      group.lookAt(targetPositon) // 模型朝向
  
      group.rotation.y += Math.PI  // 朝向纠正
  
      const duration = distance / 3  // 距离 / 速度
  
      oldgsap = gsap.to(group.position, {
  
          ...targetPositon, duration, ease: "none",
  
          onStart: () => {
  
              controls.enabled = false // 禁止控制
  
              group.currentAction.play() // 播放动画
  
          },
  
          onUpdate: () => {
  
              group.mixerAnimateRender() // 动画帧
  
              controls.target.copy(group.position) // 目标跟随
              
              camera.position.lerp(group.position.clone().add(vector), 0.1) // 相机跟随
  
          },
  
          onComplete: () => controls.enabled = true // 恢复控制
  
      })
  
  }
}
</script>
