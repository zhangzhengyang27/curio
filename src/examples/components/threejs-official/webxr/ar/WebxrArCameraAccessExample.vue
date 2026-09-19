<template>
  <WebXRExampleScene
    camera="perspective"
    antialias
    alpha
    :camera-options="{ fov: 70, near: 0.01, far: 20 }"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </WebXRExampleScene>
</template>

<script setup lang="ts">
import WebXRExampleScene from '@/examples/components/WebXRExampleScene.vue'
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> ar - camera access<br/>"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			const timer = new THREE.Timer();
  			timer.connect( document );
  
  			let cube: any;
  
  			
  
  
  				
  
  				
  
  				
  
  				const defaultLight = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 3 );
  				defaultLight.position.set( 0.5, 1, 0.25 );
  				scene.add( defaultLight );
  
  				//
  
  				
  
  
  				//
  
  				document.body.appendChild( ARButton.createButton( renderer, { requiredFeatures: [ 'camera-access' ] } ) );
  
  				//
  
  				const boxGeometry = new THREE.BoxGeometry( 1, 1, 1 );
  				const boxMaterial = new THREE.MeshStandardMaterial();
  				cube = new THREE.Mesh( boxGeometry, boxMaterial );
  				cube.position.z = - 3;
  
  				scene.add( cube );
  
  				//
  
  				
  
  			
  
  
  			
  
  			//
  
  			function setCameraTexture() {
  
  				if ( ! renderer.xr.getSession() ) {
  
  					if ( cube.material.map ) {
  
  						cube.material.map = null;
  						cube.material.needsUpdate = true;
  
  					}
  
  					return;
  
  				}
  
  				const frame = renderer.xr.getFrame();
  				const referenceSpace = renderer.xr.getReferenceSpace();
  
  				if ( ! frame || ! referenceSpace ) return;
  
  				const viewerPose = frame.getViewerPose( referenceSpace );
  
  				if ( ! viewerPose ) return;
  
  				const view = viewerPose.views.find( (view: any) => view.camera );
  			
  				const cameraTexture = renderer.xr.getCameraTexture( view.camera );
  
  				if ( cube.material.map === cameraTexture ) return;
  
  				cube.material.map = cameraTexture;
  				cube.material.needsUpdate = true;
  			
  			}
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    timer.update();
    				const delta = timer.getDelta();
    {
    if ( ! renderer.xr.getSession() ) {
    					if ( cube.material.map ) {
    						cube.material.map = null;
    						cube.material.needsUpdate = true;
    					}
    					return;
    				}
    				const frame = renderer.xr.getFrame();
    				const referenceSpace = renderer.xr.getReferenceSpace();
    				if ( ! frame || ! referenceSpace ) return;
    				const viewerPose = frame.getViewerPose( referenceSpace );
    				if ( ! viewerPose ) return;
    				const view = viewerPose.views.find( (view: any) => view.camera );
    				const cameraTexture = renderer.xr.getCameraTexture( view.camera );
    				if ( cube.material.map === cameraTexture ) return;
    				cube.material.map = cameraTexture;
    				cube.material.needsUpdate = true;
    }
    				cube.rotation.x += delta;
    				cube.rotation.y += delta;
  })
  
  		
}
</script>
