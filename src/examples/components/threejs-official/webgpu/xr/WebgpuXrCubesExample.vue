<template>
  <WebGPUExampleScene
    camera="perspective"
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
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { BoxLineGeometry } from 'three/examples/jsm/geometries/BoxLineGeometry.js';
import { XRButton } from 'three/examples/jsm/webxr/XRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { setupWebGLXRFallback } from 'three/examples/jsm/webxr/WebGLXRFallback.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> xr - interactive cubes"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			const timer = new THREE.Timer();
  			timer.connect( document );
  
  			const rendererParameters = { antialias: true, outputBufferType: THREE.UnsignedByteType, multiview: true };
  			const controllerModelFactory = new XRControllerModelFactory();
  
  			let container;
  
  
  
  
  			let controller, controllerGrip;
  			let INTERSECTED;
  
  			
  
  
  				
  				scene.background = new THREE.Color( 0x505050 );
  
  				
  
  				scene.add( camera );
  
  				room = new THREE.LineSegments(
  					new BoxLineGeometry( 6, 6, 6, 10, 10, 10 ).translate( 0, 3, 0 ),
  					new THREE.LineBasicMaterial( { color: 0xbcbcbc } )
  				);
  				scene.add( room );
  
  				scene.add( new THREE.HemisphereLight( 0xa5a5a5, 0x898989, 3 ) );
  
  				const light = new THREE.DirectionalLight( 0xffffff, 3 );
  				light.position.set( 1, 1, 1 ).normalize();
  				scene.add( light );
  
  				const geometry = new THREE.BoxGeometry( 0.15, 0.15, 0.15 );
  
  				for ( let i = 0; i < 200; i ++ ) {
  
  					const object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
  
  					object.position.x = Math.random() * 4 - 2;
  					object.position.y = Math.random() * 4;
  					object.position.z = Math.random() * 4 - 2;
  
  					object.rotation.x = Math.random() * 2 * Math.PI;
  					object.rotation.y = Math.random() * 2 * Math.PI;
  					object.rotation.z = Math.random() * 2 * Math.PI;
  
  					object.scale.x = Math.random() + 0.5;
  					object.scale.y = Math.random() + 0.5;
  					object.scale.z = Math.random() + 0.5;
  
  					object.userData.velocity = new THREE.Vector3();
  					object.userData.velocity.x = Math.random() * 0.01 - 0.005;
  					object.userData.velocity.y = Math.random() * 0.01 - 0.005;
  					object.userData.velocity.z = Math.random() * 0.01 - 0.005;
  
  					room.add( object );
  
  				}
  
  				raycaster = new THREE.Raycaster();
  
  				renderer = createRenderer();
  				setRenderer( renderer );
  				setupWebGLXRFallback( renderer, () => createRenderer( true ), setRenderer );
  
  				//
  
  				
  
  				//
  
  				document.body.appendChild( XRButton.createButton( renderer, { optionalFeatures: [ 'webgpu' ] } ) );
  
  			
  
  
  			function createRenderer( forceWebGL = false ) {
  
  				const parameters = { ...rendererParameters };
  
  				if ( forceWebGL === true ) parameters.forceWebGL = true;
  
  
  
  				renderer.xr.enabled = true;
  
  				return renderer;
  
  			}
  
  			function setRenderer( newRenderer, oldRenderer = null ) {
  
  				if ( controller !== undefined ) scene.remove( controller );
  				if ( controllerGrip !== undefined ) scene.remove( controllerGrip );
  
  				if ( oldRenderer === null ) {
  
  					container.appendChild( newRenderer.domElement );
  
  				} else {
  
  					container.replaceChild( newRenderer.domElement, oldRenderer.domElement );
  					oldRenderer.dispose();
  
  				}
  
  				renderer = newRenderer;
  				setupControllers();
  
  			}
  
  			function setupControllers() {
  
  				controller = renderer.xr.getController( 0 );
  				controller.addEventListener( 'selectstart', onSelectStart );
  				controller.addEventListener( 'selectend', onSelectEnd );
  				controller.addEventListener( 'connected', function ( event ) {
  
  					const targetRayMode = event.data.targetRayMode;
  
  					if ( targetRayMode === 'tracked-pointer' || targetRayMode === 'gaze' ) {
  
  						this.add( buildController( event.data ) );
  
  					}
  
  				} );
  				controller.addEventListener( 'disconnected', function () {
  
  					this.remove( this.children[ 0 ] );
  
  				} );
  				scene.add( controller );
  
  				controllerGrip = renderer.xr.getControllerGrip( 0 );
  				controllerGrip.add( controllerModelFactory.createControllerModel( controllerGrip ) );
  				scene.add( controllerGrip );
  
  			}
  
  			function onSelectStart() {
  
  				this.userData.isSelecting = true;
  
  			}
  
  			function onSelectEnd() {
  
  				this.userData.isSelecting = false;
  
  			}
  
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
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta() * 60;
    				if ( controller.userData.isSelecting === true ) {
    					const cube = room.children[ 0 ];
    					room.remove( cube );
    					cube.position.copy( controller.position );
    					cube.userData.velocity.x = ( Math.random() - 0.5 ) * 0.02 * delta;
    					cube.userData.velocity.y = ( Math.random() - 0.5 ) * 0.02 * delta;
    					cube.userData.velocity.z = ( Math.random() * 0.01 - 0.05 ) * delta;
    					cube.userData.velocity.applyQuaternion( controller.quaternion );
    					room.add( cube );
    				}
    				// find intersections
    				raycaster.setFromXRController( controller );
    				const intersects = raycaster.intersectObjects( room.children, false );
    				if ( intersects.length > 0 ) {
    					if ( INTERSECTED != intersects[ 0 ].object ) {
    						if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
    						INTERSECTED = intersects[ 0 ].object;
    						INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
    						INTERSECTED.material.emissive.setHex( 0xff0000 );
    					}
    				} else {
    					if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
    					INTERSECTED = undefined;
    				}
    				// Keep cubes inside room
    				for ( let i = 0; i < room.children.length; i ++ ) {
    					const cube = room.children[ i ];
    					cube.userData.velocity.multiplyScalar( 1 - ( 0.001 * delta ) );
    					cube.position.add( cube.userData.velocity );
    					if ( cube.position.x < - 3 || cube.position.x > 3 ) {
    						cube.position.x = THREE.MathUtils.clamp( cube.position.x, - 3, 3 );
    						cube.userData.velocity.x = - cube.userData.velocity.x;
    					}
    					if ( cube.position.y < 0 || cube.position.y > 6 ) {
    						cube.position.y = THREE.MathUtils.clamp( cube.position.y, 0, 6 );
    						cube.userData.velocity.y = - cube.userData.velocity.y;
    					}
    					if ( cube.position.z < - 3 || cube.position.z > 3 ) {
    						cube.position.z = THREE.MathUtils.clamp( cube.position.z, - 3, 3 );
    						cube.userData.velocity.z = - cube.userData.velocity.z;
    					}
    					cube.rotation.x += cube.userData.velocity.x * 2 * delta;
    					cube.rotation.y += cube.userData.velocity.y * 2 * delta;
    					cube.rotation.z += cube.userData.velocity.z * 2 * delta;
    				}
  })
  
  		
}
</script>
