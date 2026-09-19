<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 1]"
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
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

  const vertexShader = ` 
      varying vec2 vUv;
      void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`
  
  const fragmentShader = `
      #define R_LUMINANCE 0.298912
      #define G_LUMINANCE 0.586611
      #define B_LUMINANCE 0.114478
  
      varying vec2 vUv;
      uniform sampler2D tDiffuse;
      const vec3 monochromeScale = vec3(R_LUMINANCE, G_LUMINANCE, B_LUMINANCE);
  
      void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float grayColor = dot(color.rgb, monochromeScale);
      color = vec4(vec3(grayColor), 1.0);
      gl_FragColor = vec4(color);
      }
  `
  
  const uniforms = {
  
      tDiffuse: { type: 't', value: new THREE.TextureLoader().load(props.example?.globals?.HOST + 'files/author/z2586300277.png') }
  
  }
  
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
  
  const geometry = new THREE.PlaneGeometry();
  
  const mesh = new THREE.Mesh(geometry, material);
  
  scene.add(mesh);
}
</script>
