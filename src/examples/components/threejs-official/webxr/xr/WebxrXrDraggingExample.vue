<template>
  <WebXRExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 1.6, 3]"
    :camera-options="{ fov: 50, near: 0.1, far: 10 }"
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
import { XRButton } from 'three/examples/jsm/webxr/XRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> xr - dragging"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  			let container;
  
  			let controller1, controller2;
  			let controllerGrip1, controllerGrip2;
  
  			let raycaster;
  
  			const intersected = [];
  
  			let group;
  
  			
  
  
  				
  				scene.background = new THREE.Color( 0x808080 );
  
  				
  
  
  				
  				controls.target.set( 0, 1.6, 0 );
  				controls.update();
  
  				const floorGeometry = new THREE.PlaneGeometry( 6, 6 );
  				const floorMaterial = new THREE.ShadowMaterial( { opacity: 0.25, blending: THREE.CustomBlending, transparent: false } );
  				const floor = new THREE.Mesh( floorGeometry, floorMaterial );
  				floor.rotation.x = - Math.PI / 2;
  				floor.receiveShadow = true;
  				scene.add( floor );
  
  				scene.add( new THREE.HemisphereLight( 0xbcbcbc, 0xa5a5a5, 3 ) );
  
  				const light = new THREE.DirectionalLight( 0xffffff, 3 );
  				light.position.set( 0, 6, 0 );
  				light.castShadow = true;
  				light.shadow.camera.top = 3;
  				light.shadow.camera.bottom = - 3;
  				light.shadow.camera.right = 3;
  				light.shadow.camera.left = - 3;
  				light.shadow.mapSize.set( 4096, 4096 );
  				scene.add( light );
  
  				group = new THREE.Group();
  				scene.add( group );
  
  				const geometries = [
  					new THREE.BoxGeometry( 0.2, 0.2, 0.2 ),
  					new THREE.ConeGeometry( 0.2, 0.2, 64 ),
  					new THREE.CylinderGeometry( 0.2, 0.2, 0.2, 64 ),
  					new THREE.IcosahedronGeometry( 0.2, 8 ),
  					new THREE.TorusGeometry( 0.2, 0.04, 64, 32 )
  				];
  
  				for ( let i = 0; i < 50; i ++ ) {
  
  					const geometry = geometries[ Math.floor( Math.random() * geometries.length ) ];
  					const material = new THREE.MeshStandardMaterial( {
  						color: Math.random() * 0xffffff,
  						roughness: 0.7,
  						metalness: 0.0
  					} );
  
  					const object = new THREE.Mesh( geometry, material );
  
  					object.position.x = Math.random() * 4 - 2;
  					object.position.y = Math.random() * 2;
  					object.position.z = Math.random() * 4 - 2;
  
  					object.rotation.x = Math.random() * 2 * Math.PI;
  					object.rotation.y = Math.random() * 2 * Math.PI;
  					object.rotation.z = Math.random() * 2 * Math.PI;
  
  					object.scale.setScalar( Math.random() + 0.5 );
  
  					object.castShadow = true;
  					object.receiveShadow = true;
  
  					group.add( object );
  
  				}
  
  				//
  
  				
  
  
  				renderer.shadowMap.enabled = true;
  				document.body.appendChild( XRButton.createButton( renderer, {
  					'optionalFeatures': [ 'depth-sensing' ],
  					'depthSensing': { 'usagePreference': [ 'gpu-optimized' ], 'dataFormatPreference': [] }
  				} ) );
  
  				// controllers
  
  				controller1 = renderer.xr.getController( 0 );
  				controller1.addEventListener( 'selectstart', onSelectStart );
  				controller1.addEventListener( 'selectend', onSelectEnd );
  				scene.add( controller1 );
  
  				controller2 = renderer.xr.getController( 1 );
  				controller2.addEventListener( 'selectstart', onSelectStart );
  				controller2.addEventListener( 'selectend', onSelectEnd );
  				scene.add( controller2 );
  
  				const controllerModelFactory = new XRControllerModelFactory();
  
  				controllerGrip1 = renderer.xr.getControllerGrip( 0 );
  				controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
  				scene.add( controllerGrip1 );
  
  				controllerGrip2 = renderer.xr.getControllerGrip( 1 );
  				controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
  				scene.add( controllerGrip2 );
  
  				//
  
  				const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );
  
  				const line = new THREE.Line( geometry );
  				line.name = 'line';
  				line.scale.z = 5;
  
  				controller1.add( line.clone() );
  				controller2.add( line.clone() );
  
  				raycaster = new THREE.Raycaster();
  
  				//
  
  				
  
  			
  
  
  			
  
  			function onSelectStart( event ) {
  
  				const controller = event.target;
  
  				const intersections = getIntersections( controller );
  
  				if ( intersections.length > 0 ) {
  
  					const intersection = intersections[ 0 ];
  
  					const object = intersection.object;
  					object.material.emissive.b = 1;
  					controller.attach( object );
  
  					controller.userData.selected = object;
  
  				}
  
  				controller.userData.targetRayMode = event.data.targetRayMode;
  
  			}
  
  			function onSelectEnd( event ) {
  
  				const controller = event.target;
  
  				if ( controller.userData.selected !== undefined ) {
  
  					const object = controller.userData.selected;
  					object.material.emissive.b = 0;
  					group.attach( object );
  
  					controller.userData.selected = undefined;
  
  				}
  
  			}
  
  			function getIntersections( controller ) {
  
  				controller.updateMatrixWorld();
  
  				raycaster.setFromXRController( controller );
  
  				return raycaster.intersectObjects( group.children, false );
  
  			}
  
  			function intersectObjects( controller ) {
  
  				// Do not highlight in mobile-ar
  
  				if ( controller.userData.targetRayMode === 'screen' ) return;
  
  				// Do not highlight when already selected
  
  				if ( controller.userData.selected !== undefined ) return;
  
  				const line = controller.getObjectByName( 'line' );
  				const intersections = getIntersections( controller );
  
  				if ( intersections.length > 0 ) {
  
  					const intersection = intersections[ 0 ];
  
  					const object = intersection.object;
  					object.material.emissive.r = 1;
  					intersected.push( object );
  
  					line.scale.z = intersection.distance;
  
  				} else {
  
  					line.scale.z = 5;
  
  				}
  
  			}
  
  			function cleanIntersected() {
  
  				while ( intersected.length ) {
  
  					const object = intersected.pop();
  					object.material.emissive.r = 0;
  
  				}
  
  			}
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    while ( intersected.length ) {
    					const object = intersected.pop();
    					object.material.emissive.r = 0;
    				}
    }
    				intersectObjects( controller1 );
    				intersectObjects( controller2 );
  })
  
  		
}
</script>
