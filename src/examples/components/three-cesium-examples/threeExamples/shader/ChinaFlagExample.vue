<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0.5, -0.5, 3]"
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

  const flagTexture = new THREE.TextureLoader().load((props.example?.globals?.FILE_HOST + "images/chinaFlag.jpg"))
  
  const flagMaterial = new THREE.RawShaderMaterial({
  
      vertexShader: `uniform mat4 projectionMatrix;
          uniform mat4 modelMatrix;
          uniform mat4 viewMatrix;
          uniform vec2 uFrequency;
          uniform float uTime;
          uniform float uStrength;
          attribute vec3 position;
          attribute vec2 uv;
          varying float vDark;
          varying vec2 vUv;
          void main() {
              vec4 modelPosition = modelMatrix * vec4(position, 1.0);
              float xFactor = clamp((modelPosition.x + 1.25) / 2.0, 0.0, 2.0); 
              float vWave = sin(modelPosition.x * uFrequency.x - uTime ) * xFactor * uStrength ;
              vWave += sin(modelPosition.y * uFrequency.y - uTime) * xFactor * uStrength * 0.5;
              modelPosition.y += sin(modelPosition.x * 2.0 + uTime * 0.5) * 0.05 * xFactor;
              modelPosition.z += vWave;
              vec4 viewPosition = viewMatrix * modelPosition;
              vec4 projectedPosition = projectionMatrix * viewPosition;
              gl_Position = projectedPosition;
              vUv = uv;
              vDark = vWave;
          }`,
  
      fragmentShader: `precision mediump float;
          varying float vDark;
          uniform sampler2D uTexture;
          varying vec2 vUv;
          void main(){
              vec4 textColor = texture2D(uTexture, vUv);
              textColor.rgb *= vDark + 0.85;
              gl_FragColor = textColor;
          }`,
  
      side: THREE.DoubleSide,
  
      uniforms: {
          
          uFrequency: { value: new THREE.Vector2(3, 3) },
          
          uTime: { value: 0 },
          
          uTexture: { value: flagTexture },
          
          uStrength: { value: 0.2 }
          
      }
  
  })
  
  const flagGeometry = new THREE.BoxGeometry(3, 2, 0.025, 64, 64)
  
  const flagMesh = new THREE.Mesh(flagGeometry, flagMaterial)
  
  scene.add(flagMesh)
  
  ctx.addUpdateCallback(() => {
    flagMaterial.uniforms.uTime.value += 0.06
  })
}
</script>
