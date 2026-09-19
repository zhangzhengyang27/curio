<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[6, 3, 15]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue'

let gui: any = null
import * as THREE from 'three'
import { Water } from 'three/examples/jsm/objects/Water.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
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
  
  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
  
  const water = new Water(
      waterGeometry,
      {
          textureWidth: 512,
          textureHeight: 512,
          waterNormals: new THREE.TextureLoader().load(  props.example?.globals?.FILE_HOST +  '/images/texture/waternormals.jpg', function (texture) {
            
              texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  
          }),
          sunDirection: new THREE.Vector3(),
          sunColor: 0xffffff,
          waterColor: 0x001e0f,
          distortionScale: 3.7,
          fog: scene.fog !== undefined
      }
  );
  
  water.rotation.x = - Math.PI / 2;
  
  scene.add(water);
  
  // 文件地址
  const urls = [0, 1, 2, 3, 4, 5].map(k => (props.example?.globals?.FILE_HOST + 'files/sky/skyBox0/' + (k + 1) + '.png'));
  
  const textureCube = new THREE.CubeTextureLoader().load(urls);
  
  scene.background = textureCube;
  
  new GLTFLoader().load('/external-examples/3d-file-server/models/glb/wajueji.glb',
  
      gltf => {
  
          gltf.scene.traverse((child: any) => {
  
              if (child.isMesh) {
  
                  child.material.envMap = textureCube
  
              }
  
          })
  
          scene.add(gltf.scene)
  
      }
  
  )
  
  gui = new GUI();
  
  gui.addColor(water.material.uniforms['waterColor'], 'value').name('waterColor');
  
  gui.addColor(water.material.uniforms['sunColor'], 'value').name('sunColor');
  
  gui.add(water.material.uniforms['sunDirection'].value, 'x', - 1, 1).name('sunX');
  
  ctx.addUpdateCallback(() => {
    water.material.uniforms['time'].value += 1.0 / 60.0;
  })
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
