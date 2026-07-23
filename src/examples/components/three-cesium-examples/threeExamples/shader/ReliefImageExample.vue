<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[1, 1, 1]"
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import { onUnmounted } from 'vue'

let gui = null
import * as THREE from "three";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
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

  var stats;
  
  var cubeMaterial;
  
  init();
  
  createGUI();
  
  function init() {
      // scene
      
  
      // camera
      
      camera.target = new THREE.Vector3(0, 0, 0);
  
      // renderer
      
      controls.enableDamping = true;
      controls.minDistance = 2;
      controls.maxDistance = 10;
      stats = new Stats();
      ctx.overlay?.appendChild(stats.dom)
  
      // light
      initLight();
  
      // model
      initModel();
  
      // event
      
  }
  
  function initLight() {
      var light = new THREE.DirectionalLight(0xffffff);
      light.position.set(0, 200, 100);
      scene.add(light);
  }
  
  // model
  function initModel() {
      const cubeShader = {
          uniforms: {
              tDiffuse: { type: 't', value: new THREE.TextureLoader().load(props.example?.globals?.FILE_HOST + 'threeExamples/shader/dlam.jpg') },
              fScale: { type: "float", value: 100.00 },
          },
          vertexShader: `  varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
          fragmentShader: `  varying vec2 vUv;
          uniform sampler2D tDiffuse;
          uniform float fScale;
          const highp vec3 W = vec3(0.2125, 0.7154, 0.0721);
          const vec4 bkColor = vec4(0.5, 0.5, 0.5, 1.0);
        
          void main() {
            vec2 upLeftUV = vec2(vUv.x-1.0/fScale, vUv.y-1.0/fScale);
            vec4 curColor = texture2D(tDiffuse, vUv);
            vec4 upLeftColor = texture2D(tDiffuse, upLeftUV);
            vec4 delColor = curColor - upLeftColor;
            float luminance = dot(delColor.rgb, W);
            gl_FragColor = vec4(vec3(luminance), 0.0) + bkColor;
          }`,
      }
      cubeMaterial = new THREE.ShaderMaterial({
          uniforms: cubeShader.uniforms,
          vertexShader: cubeShader.vertexShader,
          fragmentShader: cubeShader.fragmentShader,
          side: THREE.DoubleSide
      });
  
      var geometry = new THREE.PlaneGeometry();
      var cube = new THREE.Mesh(geometry, cubeMaterial);
      scene.add(cube);
  }
  
  ctx.addUpdateCallback(() => {
    stats.update();
  })
  
  function onWindowResize() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
  
  }
  
  function createGUI() {
      gui = new GUI();
      gui.add(cubeMaterial.uniforms['fScale'], 'value', 50.0, 500.0).step(1.0).name('fScale');
  }
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
