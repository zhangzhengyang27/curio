<template>
  <WebXRExampleScene
    camera="perspective"
    antialias
    alpha
    :camera-options="{ fov: 70, near: 0.01, far: 20 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebXRExampleScene>
</template>

<script setup>
import WebXRExampleScene from '@/examples/components/WebXRExampleScene.vue'
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { XRPlanes } from 'three/examples/jsm/webxr/XRPlanes.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> ar - plane detection<br/>"
function onReady(__stage) {
  const scene = __stage.scene
  const camera = __stage.camera
  const renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			//
  
  
  
  
  			document.body.appendChild( ARButton.createButton( renderer, {
  				requiredFeatures: [ 'plane-detection' ]
  			} ) );
  
  			
  
  			//
  
  
  
  			const planes = new XRPlanes( renderer );
  			scene.add( planes );
  
  
  
  			const light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 3 );
  			light.position.set( 0.5, 1, 0.25 );
  			scene.add( light );
  
  			//
  
  			
  
  			function animate() {
  
  
  
  			}
  
  		
}
</script>
