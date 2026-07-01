<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[26, -40, 5]"
    :camera-options="{ fov: 60, near: 1, far: 1000 }"
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

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Rhino3dmLoader } from 'three/examples/jsm/loaders/3DMLoader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - Rhino 3DM loader"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  			let gui;
  
  			
  
  
  				THREE.Object3D.DEFAULT_UP.set( 0, 0, 1 );
  
  				
  
  
  				const directionalLight = new THREE.DirectionalLight( 0xffffff, 6 );
  				directionalLight.position.set( 0, 0, 2 );
  				scene.add( directionalLight );
  
  				const loader = new Rhino3dmLoader();
  				loader.setLibraryPath( 'https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/' );
  				loader.load( ASSET_HOST + 'models/3dm/Rhino_Logo.3dm', function ( object ) {
  
  					scene.add( object );
  					initGUI( object.userData.layers );
  
  					// hide spinner
  					document.getElementById( 'loader' ).style.display = 'none';
  
  				}, function ( progress ) {
  
  					console.log( ( progress.loaded / progress.total * 100 ) + '%' );
  
  				}, function ( error ) {
  
  					console.log( error );
  
  				} );
  
  				
  
  				
  
  			
  
  
  			function resize() {
  
  				const width = (__stage.container?.clientWidth || window.innerWidth);
  				const height = (__stage.container?.clientHeight || window.innerHeight);
  
  				camera.aspect = width / height;
  				camera.updateProjectionMatrix();
  
  
  
  			}
  
  			function animate() {
  
  				controls.update();
  
  
  			}
  
  			function initGUI( layers ) {
  
  				gui = new GUI( { title: 'layers' } );
  
  				for ( let i = 0; i < layers.length; i ++ ) {
  
  					const layer = layers[ i ];
  					gui.add( layer, 'visible' ).name( layer.name ).onChange( function ( val ) {
  
  						const name = this.object.name;
  
  						scene.traverse( function ( child ) {
  
  							if ( child.userData.hasOwnProperty( 'attributes' ) ) {
  
  								if ( 'layerIndex' in child.userData.attributes ) {
  
  									const layerName = layers[ child.userData.attributes.layerIndex ].name;
  
  									if ( layerName === name ) {
  
  										child.visible = val;
  										layer.visible = val;
  
  									}
  
  								}
  
  							}
  
  						} );
  
  					} );
  
  				}
  
  			}
  		
}
</script>
