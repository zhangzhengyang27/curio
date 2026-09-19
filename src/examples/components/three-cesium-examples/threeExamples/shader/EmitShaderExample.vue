<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 10, 10]"
    alpha
    antialias
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

  controls.enableDamping = true
  
  const boxGeometry = new THREE.BoxGeometry(6, 6, 6);
  
  const vertexShader = `
  void main() {
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  
  }
  `
  const fragmentShader = `
  uniform vec2 u_resolution;
  uniform float iTime;
  vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
  {
      return a + b*cos( 6.283185*(c*t+d) );
  }
  void main() {
        vec3 finalcol = vec3(0.0);
      vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy) / u_resolution.y;
      vec2 uv0 = uv;
      for (float i = 0.0; i < 3.0; i++) {
         
          uv = fract(uv*5.5)-0.5;
          vec3 col = palette(length(uv0)+iTime,vec3(0.768, 0.648, 1.0), vec3(-0.252, -0.082, 0.0), vec3(0.5, 0.5, 0.0), vec3(0.5, 0.0, 0.0));
          
          float d = length(uv) * exp(-length(uv0));
  
          d = sin(d*8. + iTime)/8.;
          d = abs(d);
  
          d = pow(0.01 / d, 1.2);
          
          finalcol += col * d;
      }
      gl_FragColor = vec4(finalcol, 1.0);
  }
  `
  
  const boxMaterial = new THREE.ShaderMaterial({
      uniforms: {
          u_resolution: { value: new THREE.Vector2(ctx.container?.clientWidth, ctx.container?.clientHeight) },
          iTime: { value: 0 }
      },
      vertexShader,
      fragmentShader
  });
  
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
  
  scene.add(boxMesh);
  
  ctx.addUpdateCallback(() => {
    boxMaterial.uniforms.iTime.value += 0.01
  })
}
</script>
