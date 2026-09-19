<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[5, 5, 5]"
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
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

  const { innerWidth, innerHeight } = window;
  const aspect = innerWidth / innerHeight;
  
  class Base {
      clock: any
      loader: any
      elapsedTime: any

      constructor() {
          this.init();
          this.main();
      }
      main() {
          const geometry = new THREE.PlaneGeometry(10, 10, 10, 10);
          const material = new THREE.ShaderMaterial({
              side: THREE.DoubleSide,
              transparent: true,
              uniforms: {
                  uTime: this.elapsedTime,
              },
              vertexShader: `
                              varying vec2 vUv;
                              void main() {
                                  vUv = uv;
                                  
                                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                              }
                          `,
              fragmentShader: `
                              varying vec2 vUv;
                              uniform float uTime;
  
                              void main(){
                                  vec3 color = vec3(1.0,0.0,0.0);
  
                                  vec2 center = vec2(0.5,0.5);
  
                                  float dis = distance(vUv,center);
  
                                  float p = 6.0;
  
                                  float r =  fract(dis* p - uTime)/3. + step(0.99, fract(dis* p - uTime));
                                  
                                  
                                  if(dis> 0.5 ){
                                      r = 0.0;
                                  } 
  
                                  gl_FragColor = vec4(color,r);
                              }
                          `,
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.rotation.x = Math.PI / 2;
          scene.add(mesh);
      }
      init() {
          this.clock = new THREE.Clock();

          this.loader = new GLTFLoader();

          this.elapsedTime = { value: 0 };
  
          const grid = new THREE.GridHelper(100);
          scene.add(grid);
  
          const light = new THREE.AmbientLight(0xffffff, 0.5);
          scene.add(light);
      }
      animate() {
          this.elapsedTime.value = this.clock.getElapsedTime();
          
          
      }
  }
  const base = new Base();
  ctx.addUpdateCallback(() => base.animate())
}
</script>
