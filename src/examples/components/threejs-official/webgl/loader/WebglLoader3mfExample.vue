<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[-100, -250, 100]"
    :camera-options="{ fov: 35, near: 1, far: 500 }"
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
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a>\n\t\t\t<a href=\"http://3mf.io\" target=\"_blank\" rel=\"noopener\">3MF File format</a>\n\t\t\t<div>3MF loader test by <a href=\"https://github.com/technohippy\" target=\"_blank\" rel=\"noopener\">technohippy</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  
  			let object, loader;
  
  			const params = {
  				asset: 'cube_gears'
  			};
  
  			const assets = [
  				'cube_gears',
  				'facecolors',
  				'multipletextures',
  				'vertexcolors'
  			];
  
  			
  
  
  				
  
  
  
  
  				
  				scene.background = new THREE.Color( 0x333333 );
  
  				
  
  				// Z is up for objects intended to be 3D printed.
  
  				camera.up.set( 0, 0, 1 );
  
  				scene.add( camera );
  
  				
  				controls.addEventListener( 'change', render );
  				controls.minDistance = 50;
  				controls.maxDistance = 400;
  				controls.enablePan = false;
  				controls.update();
  
  				scene.add( new THREE.AmbientLight( 0xffffff, 0.6 ) );
  
  				const light = new THREE.DirectionalLight( 0xffffff, 2 );
  				light.position.set( - 1, - 2.5, 1 );
  				scene.add( light );
  
  				const manager = new THREE.LoadingManager();
  
  				manager.onLoad = function () {
  
  					const aabb = new THREE.Box3().setFromObject( object );
  					const center = aabb.getCenter( new THREE.Vector3() );
  
  					object.position.x += ( object.position.x - center.x );
  					object.position.y += ( object.position.y - center.y );
  					object.position.z += ( object.position.z - center.z );
  
  					controls.reset();
  
  					scene.add( object );
  					render();
  
  				};
  
  				loader = new ThreeMFLoader( manager );
  				loadAsset( params.asset );
  
  				
  
  				//
  
  				const gui = new GUI();
  				gui.add( params, 'asset', assets ).onChange( function ( value ) {
  
  					loadAsset( value );
  
  				} );
  
  			
  
  
  			function loadAsset( asset ) {
  
  				loader.load( ASSET_HOST + 'models/3mf/' + asset + '.3mf', function ( group ) {
  
  					if ( object ) {
  
  						object.traverse( function ( child ) {
  
  							if ( child.material ) child.material.dispose();
  							if ( child.material && child.material.map ) child.material.map.dispose();
  							if ( child.geometry ) child.geometry.dispose();
  
  						} );
  
  						scene.remove( object );
  
  					}
  
  					//
  
  					object = group;
  
  				} );
  
  			}
  
  			
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
