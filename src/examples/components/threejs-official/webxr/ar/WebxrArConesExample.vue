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

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> ar - cones<br/>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let controller;
  
  			
  
  
  				
  
  				
  
  				
  
  				const light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 3 );
  				light.position.set( 0.5, 1, 0.25 );
  				scene.add( light );
  
  				//
  
  				
  
  
  				//
  
  				document.body.appendChild( ARButton.createButton( renderer ) );
  
  				//
  
  				const geometry = new THREE.CylinderGeometry( 0, 0.05, 0.2, 32 ).rotateX( Math.PI / 2 );
  
  				function onSelect() {
  
  					const material = new THREE.MeshPhongMaterial( { color: 0xffffff * Math.random() } );
  					const mesh = new THREE.Mesh( geometry, material );
  					mesh.position.set( 0, 0, - 0.3 ).applyMatrix4( controller.matrixWorld );
  					mesh.quaternion.setFromRotationMatrix( controller.matrixWorld );
  					scene.add( mesh );
  
  				}
  
  				controller = renderer.xr.getController( 0 );
  				controller.addEventListener( 'select', onSelect );
  				scene.add( controller );
  
  				//
  
  				
  
  			
  
  
  			
  
  			//
  
  			function animate() {
  
  
  
  			}
  
  		
}
</script>
