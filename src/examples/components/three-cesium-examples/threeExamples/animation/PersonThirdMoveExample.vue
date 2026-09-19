<template>
  <ExampleScene
    camera="perspective"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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

  const urls = [0, 1, 2, 3, 4, 5].map(k => (props.example?.globals?.FILE_HOST + 'files/sky/skyBox0/' + (k + 1) + '.png'))
  
  const textureCube = new THREE.CubeTextureLoader().load(urls)
  
  scene.background = textureCube
  
  scene.add(new THREE.GridHelper(100, 40))
  
  let character: any
  
  new GLTFLoader().load(props.example?.globals?.FILE_HOST + "files/model/Fox.glb", (gltf) => {
  
    character = gltf.scene
    character.traverse((i: any) => i.isMesh && (i.material.envMap = textureCube))
  
    scene.add(character)
    character.scale.multiplyScalar(0.03)
  
    const mixer = new THREE.AnimationMixer(character) // 模型动画
    const action = mixer.clipAction(gltf.animations[1])
    const clock = new THREE.Clock()
    character.mixerUpdate = () => mixer.update(clock.getDelta())
    action.play()
  
  })
  
  // 相机参数
  const cameraOffset = new THREE.Vector3(0, 5, -5);
  const smoothFactor = 0.1;
  const moveSpeed = 0.06;
  const turnSpeed = 0.03;
  
  // 移动状态
  const keys = { w: false, s: false, a: false, d: false };
  document.addEventListener('keydown', (e: any) => (keys as any)[e.key.toLowerCase()] = true);
  document.addEventListener('keyup', (e: any) => (keys as any)[e.key.toLowerCase()] = false);
  
  function update() {
  
    if (!character) return
  
    if (keys.a) character.rotation.y += turnSpeed;
    if (keys.d) character.rotation.y -= turnSpeed;
    if (keys.w || keys.s) {
      const dir = new THREE.Vector3();
      character.getWorldDirection(dir);
      character.position.add(dir.multiplyScalar(keys.w ? moveSpeed : -moveSpeed));
    }
    character.mixerUpdate()
  
    const targetPos = character.position.clone().add(cameraOffset.clone().applyQuaternion(character.quaternion));
    camera.position.lerp(targetPos, smoothFactor);
  
  }
  
  // 动画循环
  
  ctx.addUpdateCallback(() => {
    update()
  })
  
  // 窗口自适应
  console.log('[ElMessage]', '键盘事件：WASD移动')
}
</script>
