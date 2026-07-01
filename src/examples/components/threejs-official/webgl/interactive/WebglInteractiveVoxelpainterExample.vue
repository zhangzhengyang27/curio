<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[500, 800, 1300]"
    :camera-look-at="[0, 0, 0]"
    :camera-options="{ fov: 45, near: 1, far: 10000 }"
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

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - voxel painter - webgl<br>\n\t\t\t<strong>click</strong>: add voxel, <strong>shift + click</strong>: remove voxel"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let plane;
  			let pointer, raycaster, isShiftDown = false;
  
  			let rollOverMesh, rollOverMaterial;
  			let cubeGeo, cubeMaterial;
  
  			const objects = [];
  
  			
  			render();
  
  			
  
  
  				
  
  
  
  				
  				scene.background = new THREE.Color( 0xf0f0f0 );
  
  				// roll-over helpers
  
  				const rollOverGeo = new THREE.BoxGeometry( 50, 50, 50 );
  				rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
  				rollOverMesh = new THREE.Mesh( rollOverGeo, rollOverMaterial );
  				scene.add( rollOverMesh );
  
  				// cubes
  
  				const map = new THREE.TextureLoader().load( ASSET_HOST + 'textures/square-outline-textured.png' );
  				map.colorSpace = THREE.SRGBColorSpace;
  				cubeGeo = new THREE.BoxGeometry( 50, 50, 50 );
  				cubeMaterial = new THREE.MeshLambertMaterial( { color: 0xfeb74c, map: map } );
  
  				// grid
  
  				const gridHelper = new THREE.GridHelper( 1000, 20 );
  				scene.add( gridHelper );
  
  				//
  
  				raycaster = new THREE.Raycaster();
  				pointer = new THREE.Vector2();
  
  				const geometry = new THREE.PlaneGeometry( 1000, 1000 );
  				geometry.rotateX( - Math.PI / 2 );
  
  				plane = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { visible: false } ) );
  				scene.add( plane );
  
  				objects.push( plane );
  
  				// lights
  
  				const ambientLight = new THREE.AmbientLight( 0x606060, 3 );
  				scene.add( ambientLight );
  
  				const directionalLight = new THREE.DirectionalLight( 0xffffff, 3 );
  				directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
  				scene.add( directionalLight );
  
  				
  
  
  
  
  				document.addEventListener( 'pointermove', onPointerMove );
  				document.addEventListener( 'pointerdown', onPointerDown );
  				document.addEventListener( 'keydown', onDocumentKeyDown );
  				document.addEventListener( 'keyup', onDocumentKeyUp );
  
  				//
  
  				
  
  			
  
  
  			
  
  			function onPointerMove( event ) {
  
  				pointer.set( ( event.clientX / (__stage.container?.clientWidth || window.innerWidth) ) * 2 - 1, - ( event.clientY / (__stage.container?.clientHeight || window.innerHeight) ) * 2 + 1 );
  
  				raycaster.setFromCamera( pointer, camera );
  
  				const intersects = raycaster.intersectObjects( objects, false );
  
  				if ( intersects.length > 0 ) {
  
  					const intersect = intersects[ 0 ];
  
  					rollOverMesh.position.copy( intersect.point ).add( intersect.face.normal );
  					rollOverMesh.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
  
  					render();
  
  				}
  
  			}
  
  			function onPointerDown( event ) {
  
  				pointer.set( ( event.clientX / (__stage.container?.clientWidth || window.innerWidth) ) * 2 - 1, - ( event.clientY / (__stage.container?.clientHeight || window.innerHeight) ) * 2 + 1 );
  
  				raycaster.setFromCamera( pointer, camera );
  
  				const intersects = raycaster.intersectObjects( objects, false );
  
  				if ( intersects.length > 0 ) {
  
  					const intersect = intersects[ 0 ];
  
  					// delete cube
  
  					if ( isShiftDown ) {
  
  						if ( intersect.object !== plane ) {
  
  							scene.remove( intersect.object );
  
  							objects.splice( objects.indexOf( intersect.object ), 1 );
  
  						}
  
  						// create cube
  
  					} else {
  
  						const voxel = new THREE.Mesh( cubeGeo, cubeMaterial );
  						voxel.position.copy( intersect.point ).add( intersect.face.normal );
  						voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
  						scene.add( voxel );
  
  						objects.push( voxel );
  
  					}
  
  					render();
  
  				}
  
  			}
  
  			function onDocumentKeyDown( event ) {
  
  				switch ( event.keyCode ) {
  
  					case 16: isShiftDown = true; break;
  
  				}
  
  			}
  
  			function onDocumentKeyUp( event ) {
  
  				switch ( event.keyCode ) {
  
  					case 16: isShiftDown = false; break;
  
  				}
  
  			}
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
