<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[700, 200, -500]"
    :camera-options="{ fov: 40, near: 1, far: 10000 }"
    @ready="onReady"
  />
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { vec4, color, positionLocal, mix } from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let container;
  
  
  			const params = {
  				intensity: 1
  			};
  
  			
  			async 
  
  
  				const { innerWidth, innerHeight } = window;
  
  				// CAMERA
  
  				
  
  
  				// SCENE
  
  				
  
  				// LIGHTS
  
  				const light = new THREE.DirectionalLight( 0xd5deff );
  				light.position.x = 300;
  				light.position.y = 250;
  				light.position.z = - 500;
  				scene.add( light );
  
  				// SKYDOME
  
  				const topColor = new THREE.Color().copy( light.color );
  				const bottomColor = new THREE.Color( 0xffffff );
  				const offset = 400;
  				const exponent = 0.6;
  
  				const h = positionLocal.add( offset ).normalize().y;
  
  				const skyMat = new THREE.MeshBasicNodeMaterial();
  				skyMat.colorNode = vec4( mix( color( bottomColor ), color( topColor ), h.max( 0.0 ).pow( exponent ) ), 1.0 );
  				skyMat.side = THREE.BackSide;
  
  				const sky = new THREE.Mesh( new THREE.SphereGeometry( 4000, 32, 15 ), skyMat );
  				scene.add( sky );
  
  				// MODEL
  
  				const loader = new THREE.ObjectLoader();
  				const object = await loader.loadAsync( ASSET_HOST + 'models/json/lightmap/lightmap.json' );
  				scene.add( object );
  
  				// RENDERER
  
  				
  				renderer.inspector = new Inspector();
  
  
  				// CONTROLS
  
  
  				controls.maxPolarAngle = 0.9 * Math.PI / 2;
  				controls.enableZoom = false;
  
  				// GUI
  
  				const gui = renderer.inspector.createParameters( 'Parameters' );
  
  				gui.add( params, 'intensity', 0, 1 ).name( 'Light Map Intensity' ).onChange( ( value ) => {
  
  					for ( const material of object.material ) {
  
  						material.lightMapIntensity = value;
  
  					}
  
  				} );
  
  				//
  
  				
  
  			
  
  
  			
  
  			//
  
  			function animate() {
  
  
  
  			}
  
  		
}
</script>
