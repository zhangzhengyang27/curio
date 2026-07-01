<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 1000]"
    :clear-color="0x000000"
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
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

  init(document.getElementById('box'))
  
  function init(DOM) {
  
    scene.add(camera);
  
    DOM.appendChild(renderer.domElement)
  
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
  
    const axes = new THREE.AxesHelper(55000)
    scene.add(axes)
  
    // 着色器天空
    const shaderSky = () => {
      // 顶点着色
      const vertexShader = `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`;
      // 片元
      const fragmentShader = `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;
    void main() {
        float h = normalize( vWorldPosition + offset ).y;
        gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h, 0.0 ), exponent ), 0.0 ) ), 1.0 );
    }`
      const uniforms = {
        topColor: { value: new THREE.Color(0x0077ff) },
        bottomColor: { value: new THREE.Color('aliceblue') },
        offset: { value: 400 },
        exponent: { value: 0.6 },
      };
      const skyGeo = new THREE.SphereGeometry(4000, 32, 15);
      const skyMat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.DoubleSide,
      });
      return new THREE.Mesh(skyGeo, skyMat)
    }
    scene.add(shaderSky()) 
  
  }
}
</script>
