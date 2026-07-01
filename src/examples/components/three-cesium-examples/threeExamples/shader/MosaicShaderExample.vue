<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 1]"
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import * as dat from 'dat.gui'
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

  const vertexShader = ` 
      varying vec2 vUv;
      void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`
  
  const fragmentShader = `
      varying vec2 vUv;
      uniform sampler2D tDiffuse;
      uniform vec2 vScreenSize;
      uniform float fMosaicScale;
      void main() {
      vec2 vUv2 = vUv;
      vUv2.x = floor(vUv2.x * vScreenSize.x / fMosaicScale) / (vScreenSize.x / fMosaicScale) + (fMosaicScale / 2.0) / vScreenSize.x;
      vUv2.y = floor(vUv2.y * vScreenSize.y / fMosaicScale) / (vScreenSize.y / fMosaicScale) + (fMosaicScale / 2.0) / vScreenSize.y;
  
      vec4 color = texture2D(tDiffuse, vUv2);
      gl_FragColor = color;
  }`
  
  const uniforms = {
  
      tDiffuse: { type: 't', value: new THREE.TextureLoader().load(props.example?.globals?.HOST + 'files/author/z2586300277.png') },
  
      vScreenSize: { type: "v2", value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  
      fMosaicScale: { type: "f", value: 20.0 },
  
  }
  
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
  
  const geometry = new THREE.PlaneGeometry();
  
  const mesh = new THREE.Mesh(geometry, material);
  
  scene.add(mesh);
  
  var gui = new dat.GUI();
  gui.add(uniforms['fMosaicScale'], 'value', 1.0, 100.0).step(1.0).name('mosaicScale');
}
</script>
