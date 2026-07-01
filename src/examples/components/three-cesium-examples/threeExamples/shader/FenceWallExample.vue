<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 40, 40]"
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
          const geometry = new THREE.CylinderGeometry(30, 30, 20, 4, 64, true);
          const material = new THREE.ShaderMaterial({
              side: THREE.DoubleSide,
              transparent: true,
              depthWrite: false,
              uniforms: {
                  uTime: this.deltaTime,
              },
              vertexShader: `
                          varying vec2 vUv; 
                          void main(){
                              vUv = uv;
                              gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                          }
                          `,
              fragmentShader: `
                          uniform float uTime;
                          varying vec2 vUv;
                          #define PI 3.14159265
  
                          void main(){
  
                          vec4 baseColor = vec4(0.0,1.,0.5,1.);
  						
                          vec4 finalColor;
                              
                          float amplitude = 1.;
                          float frequency = 10.;
                          
                          float x = vUv.x;
  
                          float y = sin(x * frequency) ;
                          float t = 0.01*(-uTime*130.0);
                          y += sin(x*frequency*2.1 + t)*4.5;
                          y += sin(x*frequency*1.72 + t*1.121)*4.0;
                          y += sin(x*frequency*2.221 + t*0.437)*5.0;
                          y += sin(x*frequency*3.1122+ t*4.269)*2.5;
                          y *= amplitude*0.06;
                          y /= 3.;
                          y += 0.55;
  
                          vec4 color = gl_FragColor.rgba;
  
                          float r = step(0.5, fract(vUv.y - uTime));
  
                          baseColor.a = step(vUv.y,y) * (y-vUv.y)/y;
                          
                          gl_FragColor = baseColor;
  
                          }
                          `,
          });
          const cylinder = new THREE.Mesh(geometry, material);
          cylinder.position.y += 10;
          scene.add(cylinder);
      }
      init() {
          this.clock = new THREE.Clock();

          this.deltaTime = {
              value: 0,
          };
  
          const grid = new THREE.GridHelper(100);
          scene.add(grid);
  
          const light = new THREE.AmbientLight(0xffffff, 0.5);
          scene.add(light);
      }
      animate() {
          
          
          this.deltaTime.value = this.clock.getElapsedTime();
      }
  }
  const base = new Base();
  ctx.addUpdateCallback(() => base.animate())
}
</script>
