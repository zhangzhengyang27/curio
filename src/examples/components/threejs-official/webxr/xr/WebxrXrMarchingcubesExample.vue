<template>
  <WebXRExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 1.6, 3]"
    :camera-options="{ fov: 50, near: 0.01, far: 50 }"
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

<script setup>
import WebXRExampleScene from '@/examples/components/WebXRExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import { XRButton } from 'three/examples/jsm/webxr/XRButton.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> xr - marching cubes"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  			let container;
  
  			let controller1, controller2;
  
  			let blob;
  
  			let points = [];
  
  			
  			initBlob();
  
  			
  
  
  				
  				scene.background = new THREE.Color( 0x222222 );
  
  				
  
  
  				
  				controls.target.set( 0, 1.6, 0 );
  				controls.update();
  
  				const grid = new THREE.GridHelper( 4, 1, 0x111111, 0x111111 );
  				scene.add( grid );
  
  				scene.add( new THREE.HemisphereLight( 0x888877, 0x777788, 3 ) );
  
  				const light = new THREE.DirectionalLight( 0xffffff, 3 );
  				light.position.set( 0, 6, 0 );
  				scene.add( light );
  
  				//
  
  				
  
  
  				document.body.appendChild( XRButton.createButton( renderer ) );
  
  				// controllers
  
  				function onSelectStart() {
  
  					this.userData.isSelecting = true;
  
  				}
  
  				function onSelectEnd() {
  
  					this.userData.isSelecting = false;
  
  				}
  
  				controller1 = renderer.xr.getController( 0 );
  				controller1.addEventListener( 'selectstart', onSelectStart );
  				controller1.addEventListener( 'selectend', onSelectEnd );
  				controller1.userData.id = 0;
  				scene.add( controller1 );
  
  				controller2 = renderer.xr.getController( 1 );
  				controller2.addEventListener( 'selectstart', onSelectStart );
  				controller2.addEventListener( 'selectend', onSelectEnd );
  				controller2.userData.id = 1;
  				scene.add( controller2 );
  
  				//
  
  				const pivot = new THREE.Mesh( new THREE.IcosahedronGeometry( 0.01, 3 ) );
  				pivot.name = 'pivot';
  				pivot.position.z = - 0.05;
  
  				const group = new THREE.Group();
  				group.add( pivot );
  
  				controller1.add( group.clone() );
  				controller2.add( group.clone() );
  
  				//
  
  				
  
  			
  
  
  			function initBlob() {
  
  				/*
  				const path = ASSET_HOST + 'textures/cube/SwedishRoyalCastle/';
  				const format = '.jpg';
  				const urls = [
  					path + 'px' + format, path + 'nx' + format,
  					path + 'py' + format, path + 'ny' + format,
  					path + 'pz' + format, path + 'nz' + format
  				];
  
  				const reflectionCube = new THREE.CubeTextureLoader().load( urls );
  				*/
  
  				const material = new THREE.MeshStandardMaterial( {
  					color: 0xffffff,
  					// envMap: reflectionCube,
  					roughness: 0.9,
  					metalness: 0.0,
  					transparent: true
  				} );
  
  				blob = new MarchingCubes( 64, material, false, false, 500000 );
  				blob.position.y = 1;
  				scene.add( blob );
  
  				initPoints();
  
  			}
  
  			function initPoints() {
  
  				points = [
  					{ position: new THREE.Vector3(), strength: 0.04, subtract: 10 },
  					{ position: new THREE.Vector3(), strength: - 0.08, subtract: 10 }
  				];
  
  			}
  
  			
  
  			//
  
  			function transformPoint( vector ) {
  
  				vector.x = ( vector.x + 1.0 ) / 2.0;
  				vector.y = ( vector.y / 2.0 );
  				vector.z = ( vector.z + 1.0 ) / 2.0;
  
  			}
  
  			function handleController( controller ) {
  
  				const pivot = controller.getObjectByName( 'pivot' );
  
  				if ( pivot ) {
  
  					const id = controller.userData.id;
  					const matrix = pivot.matrixWorld;
  
  					points[ id ].position.setFromMatrixPosition( matrix );
  					transformPoint( points[ id ].position );
  
  					if ( controller.userData.isSelecting ) {
  
  						const strength = points[ id ].strength / 2;
  
  						const vector = new THREE.Vector3().setFromMatrixPosition( matrix );
  
  						transformPoint( vector );
  
  						points.push( { position: vector, strength: strength, subtract: 10 } );
  
  					}
  
  				}
  
  			}
  
  			function updateBlob() {
  
  				blob.reset();
  
  				for ( let i = 0; i < points.length; i ++ ) {
  
  					const point = points[ i ];
  					const position = point.position;
  
  					blob.addBall( position.x, position.y, position.z, point.strength, point.subtract );
  
  				}
  
  				blob.update();
  
  			}
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    handleController( controller1 );
    				handleController( controller2 );
    {
    blob.reset();
    				for ( let i = 0; i < points.length; i ++ ) {
    					const point = points[ i ];
    					const position = point.position;
    					blob.addBall( position.x, position.y, position.z, point.strength, point.subtract );
    				}
    				blob.update();
    }
  })
  
  		
}
</script>
