<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 0, 70]"
    :camera-options="{ fov: 60, near: 1, far: 1000 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GCodeLoader } from 'three/examples/jsm/loaders/GCodeLoader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - GCode loader"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  
  			let loader;
  
  			let model;
  
  			const params = {
  				asset: 'benchy'
  			};
  
  			const assets = [
  				'benchy',
  				'test_m82',
  				'test_m83',
  			];
  
  			const positions = [
  				new THREE.Vector3( - 100, - 20, 100 ),
  				new THREE.Vector3( 0, 0, 0 ),
  				new THREE.Vector3( 0, 0, 0 ),
  			];
  
  			
  			render();
  
  			
  
  
  				
  
  
  				
  
  				loader = new GCodeLoader();
  				loadAsset( params.asset );
  
  				
  
  
  
  
  				
  				controls.addEventListener( 'change', render ); // use if there is no animation loop
  				controls.minDistance = 10;
  				controls.maxDistance = 100;
  
  				
  
  				const gui = new GUI();
  
  			
  				gui.add( params, 'asset', assets ).onChange( function ( value ) {
  
  					if ( model ) {
  
  						model.traverse( function ( object ) {
  
  							if ( object.material ) object.material.dispose();
  							if ( object.geometry ) object.geometry.dispose();
  
  						} );
  
  						scene.remove( model );
  
  					}
  
  					loadAsset( value );
  
  				} );
  
  				gui.open();
  
  
  			
  
  
  			function loadAsset( asset ) {
  
  				loader.load( ASSET_HOST + 'models/gcode/' + asset + '.gcode', function ( object ) {
  
  					model = object;
  					model.position.copy( positions[ assets.indexOf( asset ) ] );
  					scene.add( model );
  					controls.reset();
  
  				} );
  
  			}
  
  			function resize() {
  
  				camera.aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  				camera.updateProjectionMatrix();
  
  
  
  				render();
  
  			}
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
