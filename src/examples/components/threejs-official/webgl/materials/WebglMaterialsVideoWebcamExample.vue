<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 60, near: 0.1, far: 100 }"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </ExampleScene>
</template>

<script setup lang="ts">
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - video webcam input"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  
  			
  
  
  				
  				camera.position.z = 0.01;
  
  				
  
  				const video = document.createElement( 'video' );
  				video.muted = true;
  				video.playsInline = true;
  
  				const texture = new THREE.VideoTexture( video );
  				texture.colorSpace = THREE.SRGBColorSpace;
  
  				const geometry = new THREE.PlaneGeometry( 16, 9 );
  				geometry.scale( 0.5, 0.5, 0.5 );
  				const material = new THREE.MeshBasicMaterial( { map: texture } );
  
  				const count = 128;
  				const radius = 32;
  
  				for ( let i = 1, l = count; i <= l; i ++ ) {
  
  					const phi = Math.acos( - 1 + ( 2 * i ) / l );
  					const theta = Math.sqrt( l * Math.PI ) * phi;
  
  					const mesh = new THREE.Mesh( geometry, material );
  					mesh.position.setFromSphericalCoords( radius, phi, theta );
  					mesh.lookAt( camera.position );
  					scene.add( mesh );
  
  				}
  
  				
  
  
  				controls.enableZoom = false;
  				controls.enablePan = false;
  
  				
  
  				//
  
  				if ( navigator.mediaDevices && navigator.mediaDevices.getUserMedia ) {
  
  					const constraints = { video: { width: 1280, height: 720, facingMode: 'user' } };
  
  					navigator.mediaDevices.getUserMedia( constraints ).then( function ( stream ) {
  
  						// apply the stream to the video element used in the texture
  
  						video.srcObject = stream;
  						video.play();
  
  					} ).catch( function ( error ) {
  
  						console.error( 'Unable to access the camera/webcam.', error );
  
  					} );
  
  				} else {
  
  					console.error( 'MediaDevices interface not available.' );
  
  				}
  
  			
  
  
  			
  
  			function animate() {
  
  
  
  			}
  
  		
}
</script>
