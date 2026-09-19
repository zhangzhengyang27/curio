<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 100, 400]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue'

let gui: any = null
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
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

  
  scene.add(new THREE.AmbientLight(0xffffff, 1))
  
  // 天空
  const urls = [0, 1, 2, 3, 4, 5].map(k => (props.example?.globals?.FILE_HOST + 'files/sky/skyBox0/' + (k + 1) + '.png'));
  const textureCube = new THREE.CubeTextureLoader().load(urls);
  scene.background = textureCube;
  scene.backgroundBlurriness = 0.5;
  
  // 地面
  const groundGeometry = new THREE.PlaneGeometry(10000, 10000);
  const map = new THREE.TextureLoader().load(props.example?.globals?.FILE_HOST + 'images/channels/black.png')
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({ map, envMap: textureCube });
  const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
  groundMesh.rotation.x = -Math.PI / 2;
  scene.add(groundMesh);
  
  // 加载模型 fbx
  new FBXLoader().load(props.example?.globals?.HOST + '/files/model/city.FBX', (object3d) => {
      scene.add(object3d)
      object3d.scale.set(0.06, 0.06, 0.06)
  })
  
  // 创建第一人称漫游控制器
  const pointLockControls: any = new PointerLockControls(camera, renderer.domElement);
  pointLockControls.speed = 2
  
  // 处理键盘事件以实现相机的移动
  const keyboard: any = {};
  const moveForward = () => pointLockControls.moveForward(pointLockControls.speed)
  const moveBackward = () => pointLockControls.moveForward(-pointLockControls.speed)
  const moveLeft = () => pointLockControls.moveRight(-pointLockControls.speed)
  const moveRight = () => pointLockControls.moveRight(pointLockControls.speed)
  const moveUp = () => pointLockControls.getObject().position.y += pointLockControls.speed
  const moveDown = () => pointLockControls.getObject().position.y -= pointLockControls.speed
  
  // 第一人称
  pointLockControls.pointLockRender = () => {
      if (keyboard['KeyW']) moveForward();
      else if (keyboard['KeyA']) moveLeft();
      else if (keyboard['KeyS']) moveBackward();
      else if (keyboard['KeyD']) moveRight();
      else if (keyboard['ArrowUp']) moveUp();
      else if (keyboard['ArrowDown']) moveDown();
  }
  
  // 键盘事件 
  const onKeyDown = function (event: any) {
      event.preventDefault();
      keyboard[event.code] = true
  }
  
  // 键盘事件
  const onKeyUp = function (event: any) {
      event.preventDefault();
      keyboard[event.code] = false
  }
  
  // 锁定事件
  pointLockControls.addEventListener('lock', () => {
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
  })
  
  // 解锁事件
  pointLockControls.addEventListener('unlock', () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
  })
  
  gui = new GUI()
  gui.add(pointLockControls, 'isLocked').onChange((v: any) => v ? pointLockControls.lock() : pointLockControls.unlock()).name('漫游').listen()
  gui.add(pointLockControls, 'speed').name('漫游速度')
  
  (globalThis as any).GLOBAL_CONFIG.ElMessage('键盘事件：WASD移动, esc退出')
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
