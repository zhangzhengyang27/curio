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
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { XREstimatedLight } from 'three/examples/jsm/webxr/XREstimatedLight.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> ar - lighting estimation<br/>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let controller;
  			let defaultEnvironment;
  
  			
  
  
  				
  
  				
  
  				
  
  				const defaultLight = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 );
  				defaultLight.position.set( 0.5, 1, 0.25 );
  				scene.add( defaultLight );
  
  				//
  
  				
  
  
  				// Don't add the XREstimatedLight to the scene initially.
  				// It doesn't have any estimated lighting values until an AR session starts.
  
  				const xrLight = new XREstimatedLight( renderer );
  
  				xrLight.addEventListener( 'estimationstart', () => {
  
  					// Swap the default light out for the estimated one once we start getting some estimated values.
  					scene.add( xrLight );
  					scene.remove( defaultLight );
  
  					// The estimated lighting also provides an environment cubemap, which we can apply here.
  					if ( xrLight.environment ) {
  
  						scene.environment = xrLight.environment;
  
  					}
  
  				} );
  
  				xrLight.addEventListener( 'estimationend', () => {
  
  					// Swap the lights back when we stop receiving estimated values.
  					scene.add( defaultLight );
  					scene.remove( xrLight );
  
  					// Revert back to the default environment.
  					scene.environment = defaultEnvironment;
  
  				} );
  
  				//
  
  				new UltraHDRLoader()
  					.setPath( ASSET_HOST + 'textures/equirectangular/' )
  					.load( 'royal_esplanade_2k.hdr.jpg', function ( texture ) {
  
  						texture.mapping = THREE.EquirectangularReflectionMapping;
  
  						defaultEnvironment = texture;
  
  						scene.environment = defaultEnvironment;
  
  					} );
  
  				//
  
  				// In order for lighting estimation to work, 'light-estimation' must be included as either an optional or required feature.
  				document.body.appendChild( ARButton.createButton( renderer, { optionalFeatures: [ 'light-estimation' ] } ) );
  
  				//
  
  				const ballGeometry = new THREE.SphereGeometry( 0.175, 32, 32 );
  				const ballGroup = new THREE.Group();
  				ballGroup.position.z = - 2;
  
  				const rows = 3;
  				const cols = 3;
  
  				for ( let i = 0; i < rows; i ++ ) {
  
  					for ( let j = 0; j < cols; j ++ ) {
  
  						const ballMaterial = new THREE.MeshStandardMaterial( {
  							color: 0xdddddd,
  							roughness: i / rows,
  							metalness: j / cols
  						} );
  						const ballMesh = new THREE.Mesh( ballGeometry, ballMaterial );
  						ballMesh.position.set( ( i + 0.5 - rows * 0.5 ) * 0.4, ( j + 0.5 - cols * 0.5 ) * 0.4, 0 );
  						ballGroup.add( ballMesh );
  
  					}
  
  				}
  
  				scene.add( ballGroup );
  
  				//
  
  				function onSelect() {
  
  					ballGroup.position.set( 0, 0, - 2 ).applyMatrix4( controller.matrixWorld );
  					ballGroup.quaternion.setFromRotationMatrix( controller.matrixWorld );
  
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
