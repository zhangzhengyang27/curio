<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[5, 5, 5]"
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from "three";
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

  const { innerWidth, innerHeight } = window;
  const aspect = innerWidth / innerHeight;
  
  class Base {
      constructor() {
          this.init();
          this.main();
      }
      main() {
          const geometry = new THREE.PlaneGeometry(10,10,100,100);
  
          const vertexShader = `
          varying vec2 vUv;
  
          void main(){
              vUv = uv;
  
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  
          }
          `;
          const fragmentShader = `
          uniform float iTime;
          varying vec2 vUv;
          #define PI 3.14159
  
          vec3 palette(float t){
              vec3 a = vec3(0.5,0.5,0.5);
              vec3 b = vec3(0.5,0.5,0.5);
              vec3 c = vec3(1.0,1.0,1.0);
              vec3 d = vec3(0.263,0.416,0.557);
  
              return a+b*cos(PI*2.0*(c*t+d));
          }
  
          vec4 mainImage(){
              vec3 finalColor = vec3(0.0);
              vec2 uuv = vUv*2.0-1.0;
              vec2 uv = vUv*2.0-1.0;
              for(float i = 0.0;i<4.0;i++){
                  uv = fract(uv*1.5)-0.5;
                  float d = length(uv) * exp(-length(uuv));
  
                  vec3 col = palette(length(uuv) + i*.4 + iTime*.4);
  
                  d = sin(d*8. + iTime)/8.;
                  d = abs(d);
  
                  d = pow(0.01 / d, 1.2);
  
                  finalColor += col * d;
              }
              return  vec4(finalColor,1.0);
          }
          void main(){
              gl_FragColor = mainImage();
          }
          `;
          const material = new THREE.ShaderMaterial({
              vertexShader,
              fragmentShader,
              uniforms: {
                  iTime: {
                      value: 0,
                  },
              },
              side: THREE.DoubleSide,
          });
  
          const plane = new THREE.Mesh(geometry, material);
          this.material = plane.material;
          scene.add(plane);
      }
      init() {
          this.clock = new THREE.Clock();

          const grid = new THREE.GridHelper(100);
          scene.add(grid);
  
          const light = new THREE.AmbientLight(0xffffff, 0.5);
          scene.add(light);
      }
      animate() {
          
          
          this.material.uniforms.iTime.value += 0.01;
      }
  }
  const base = new Base();
  ctx.addUpdateCallback(() => base.animate())
}
</script>
