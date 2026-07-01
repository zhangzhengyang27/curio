<template>
  <WebXRExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 1, 3]"
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
import { BoxLineGeometry } from 'three/examples/jsm/geometries/BoxLineGeometry.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> vr - teleport"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let controller1, controller2;
  			let controllerGrip1, controllerGrip2;
  
  			let room, marker, floor, baseReferenceSpace;
  
  
  			const tempMatrix = new THREE.Matrix4();
  
  			
  
  
  				
  				scene.background = new THREE.Color( 0x505050 );
  
  				
  
  
  				room = new THREE.LineSegments(
  					new BoxLineGeometry( 6, 6, 6, 10, 10, 10 ).translate( 0, 3, 0 ),
  					new THREE.LineBasicMaterial( { color: 0xbcbcbc } )
  				);
  				scene.add( room );
  
  				scene.add( new THREE.HemisphereLight( 0xa5a5a5, 0x898989, 3 ) );
  
  				const light = new THREE.DirectionalLight( 0xffffff, 3 );
  				light.position.set( 1, 1, 1 ).normalize();
  				scene.add( light );
  
  				marker = new THREE.Mesh(
  					new THREE.CircleGeometry( 0.25, 32 ).rotateX( - Math.PI / 2 ),
  					new THREE.MeshBasicMaterial( { color: 0xbcbcbc } )
  				);
  				scene.add( marker );
  
  				floor = new THREE.Mesh(
  					new THREE.PlaneGeometry( 4.8, 4.8, 2, 2 ).rotateX( - Math.PI / 2 ),
  					new THREE.MeshBasicMaterial( { color: 0xbcbcbc, transparent: true, opacity: 0.25 } )
  				);
  				scene.add( floor );
  
  				raycaster = new THREE.Raycaster();
  
  				
  
  
  				renderer.xr.addEventListener( 'sessionstart', () => baseReferenceSpace = renderer.xr.getReferenceSpace() );
  				// controllers
  
  				function onSelectStart() {
  
  					this.userData.isSelecting = true;
  
  				}
  
  				function onSelectEnd() {
  
  					this.userData.isSelecting = false;
  
  					if ( INTERSECTION ) {
  
  						const offsetPosition = { x: - INTERSECTION.x, y: - INTERSECTION.y, z: - INTERSECTION.z, w: 1 };
  						const offsetRotation = new THREE.Quaternion();
  						const transform = new XRRigidTransform( offsetPosition, offsetRotation );
  						const teleportSpaceOffset = baseReferenceSpace.getOffsetReferenceSpace( transform );
  
  						renderer.xr.setReferenceSpace( teleportSpaceOffset );
  
  					}
  
  				}
  
  				controller1 = renderer.xr.getController( 0 );
  				controller1.addEventListener( 'selectstart', onSelectStart );
  				controller1.addEventListener( 'selectend', onSelectEnd );
  				controller1.addEventListener( 'connected', function ( event ) {
  
  					this.add( buildController( event.data ) );
  
  				} );
  				controller1.addEventListener( 'disconnected', function () {
  
  					this.remove( this.children[ 0 ] );
  
  				} );
  				scene.add( controller1 );
  
  				controller2 = renderer.xr.getController( 1 );
  				controller2.addEventListener( 'selectstart', onSelectStart );
  				controller2.addEventListener( 'selectend', onSelectEnd );
  				controller2.addEventListener( 'connected', function ( event ) {
  
  					this.add( buildController( event.data ) );
  
  				} );
  				controller2.addEventListener( 'disconnected', function () {
  
  					this.remove( this.children[ 0 ] );
  
  				} );
  				scene.add( controller2 );
  
  				// The XRControllerModelFactory will automatically fetch controller models
  				// that match what the user is holding as closely as possible. The models
  				// should be attached to the object returned from getControllerGrip in
  				// order to match the orientation of the held device.
  
  				const controllerModelFactory = new XRControllerModelFactory();
  
  				controllerGrip1 = renderer.xr.getControllerGrip( 0 );
  				controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
  				scene.add( controllerGrip1 );
  
  				controllerGrip2 = renderer.xr.getControllerGrip( 1 );
  				controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
  				scene.add( controllerGrip2 );
  
  				//
  
  				window.addEventListener( 'resize', onWindowResize, false );
  
  			
  
  
  			function buildController( data ) {
  
  				let geometry, material;
  
  				switch ( data.targetRayMode ) {
  
  					case 'tracked-pointer':
  
  						geometry = new THREE.BufferGeometry();
  						geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) );
  						geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );
  
  						material = new THREE.LineBasicMaterial( { vertexColors: true, blending: THREE.AdditiveBlending } );
  
  						return new THREE.Line( geometry, material );
  
  					case 'gaze':
  
  						geometry = new THREE.RingGeometry( 0.02, 0.04, 32 ).translate( 0, 0, - 1 );
  						material = new THREE.MeshBasicMaterial( { opacity: 0.5, transparent: true } );
  						return new THREE.Mesh( geometry, material );
  
  				}
  
  			}
  
  			function onWindowResize() {
  
  				camera.aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  				camera.updateProjectionMatrix();
  
  
  
  			}
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    INTERSECTION = undefined;
    				if ( controller1.userData.isSelecting === true ) {
    					tempMatrix.identity().extractRotation( controller1.matrixWorld );
    					raycaster.ray.origin.setFromMatrixPosition( controller1.matrixWorld );
    					raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix );
    					const intersects = raycaster.intersectObjects( [ floor ] );
    					if ( intersects.length > 0 ) {
    						INTERSECTION = intersects[ 0 ].point;
    					}
    				} else if ( controller2.userData.isSelecting === true ) {
    					tempMatrix.identity().extractRotation( controller2.matrixWorld );
    					raycaster.ray.origin.setFromMatrixPosition( controller2.matrixWorld );
    					raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix );
    					const intersects = raycaster.intersectObjects( [ floor ] );
    					if ( intersects.length > 0 ) {
    						INTERSECTION = intersects[ 0 ].point;
    					}
    				}
    				if ( INTERSECTION ) marker.position.copy( INTERSECTION );
    				marker.visible = INTERSECTION !== undefined;
  })
  
  		
}
</script>
