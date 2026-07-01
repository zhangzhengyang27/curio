<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 8, 8]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
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
  
  const earthGeometry = new THREE.SphereGeometry(2.5, 32, 16)
  
  const earthMaterial = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load(props.example?.globals?.FILE_HOST + 'threeExamples/shader/earth1.jpg') })
  
  const earth = new THREE.Mesh(earthGeometry, earthMaterial)
  
  scene.add(earth)
  
  const geometry = new THREE.SphereGeometry(3, 32, 16)
  
  const material = new THREE.ShaderMaterial({
  
    uniforms: {
  
      iTime: { value: 0.0 },
  
      pointNum: { value: new THREE.Vector2(64, 32) },
  
      uColor: { value: new THREE.Color('#bbd9ec') }
  
    },
  
    transparent: true,
  
    vertexShader: `
      varying vec2 vUv;
      void main(){
      vUv=uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  
    fragmentShader: `
      float PI = acos(-1.0);
      uniform vec3 uColor;
      uniform vec2 pointNum;
      uniform float iTime;                        
      varying vec2 vUv;
      void main(){
      vec2 uv = vUv+ vec2(0.0, iTime);
        float current = abs(sin(uv.y * PI) );             
      if(current < 0.99) {      
        current=current*0.5;
      }
      float d = distance(fract(uv * pointNum), vec2(0.5, 0.5));
      if(d > current*0.2 ) {
         discard;
      } else {
         gl_FragColor =vec4(uColor,current);
      }
    }`
  
  })
  
  const folder = new GUI()
  
  folder.addColor(material.uniforms.uColor, 'value')
  
  folder.add(material.uniforms.pointNum.value, 'x', 1, 128).name('pointNumX')
  
  folder.add(material.uniforms.pointNum.value, 'y', 1, 128).name('pointNumY')
  
  const sphere = new THREE.Mesh(geometry, material)
  
  scene.add(sphere)
  
  ctx.addUpdateCallback(() => {
    earth.rotation.y += 0.002
      material.uniforms.iTime.value += 0.002
  })
}
</script>
