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

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> xr - haptics"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  			let container;
  
  
  
  			let controller1, controller2;
  			let controllerGrip1, controllerGrip2;
  
  			const box = new THREE.Box3();
  
  
  
  			
  
  
  				
  				scene.background = new THREE.Color( 0x808080 );
  
  				
  
  
  				listener = new THREE.AudioListener();
  				camera.add( listener );
  
  				
  				controls.target.set( 0, 1.6, 0 );
  				controls.update();
  
  				const floorGeometry = new THREE.PlaneGeometry( 4, 4 );
  				const floorMaterial = new THREE.ShadowMaterial( { opacity: 0.25, blending: THREE.CustomBlending, transparent: false } );
  				const floor = new THREE.Mesh( floorGeometry, floorMaterial );
  				floor.rotation.x = - Math.PI / 2;
  				floor.receiveShadow = true;
  				scene.add( floor );
  
  				scene.add( new THREE.HemisphereLight( 0xbcbcbc, 0xa5a5a5, 3 ) );
  
  				const light = new THREE.DirectionalLight( 0xffffff, 3 );
  				light.position.set( 0, 6, 0 );
  				light.castShadow = true;
  				light.shadow.camera.top = 2;
  				light.shadow.camera.bottom = - 2;
  				light.shadow.camera.right = 2;
  				light.shadow.camera.left = - 2;
  				light.shadow.mapSize.set( 4096, 4096 );
  				scene.add( light );
  
  				group = new THREE.Group();
  				group.position.z = - 0.5;
  				scene.add( group );
  				const BOXES = 10;
  
  				for ( let i = 0; i < BOXES; i ++ ) {
  
  					const intensity = ( i + 1 ) / BOXES;
  					const w = 0.1;
  					const h = 0.05 * i + 0.5;
  					const geometry = new THREE.BoxGeometry( w, h, w );
  					geometry.translate( 0, h / 2, 0 );
  					const material = new THREE.MeshStandardMaterial( {
  						color: new THREE.Color( intensity, 0.1, 0.1 ),
  						roughness: 0.7,
  						metalness: 0.0
  					} );
  
  					const object = new THREE.Mesh( geometry, material );
  					object.position.x = ( i - 5 ) * ( w + 0.05 );
  					object.castShadow = true;
  					object.receiveShadow = true;
  					object.userData = {
  						index: i + 1,
  						intensity: intensity
  					};
  
  					group.add( object );
  
  				}
  
  				//
  
  				
  
  
  				renderer.shadowMap.enabled = true;
  				document.body.appendChild( XRButton.createButton( renderer ) );
  
  				// controllers
  
  				controller1 = renderer.xr.getController( 0 );
  				scene.add( controller1 );
  
  				controller2 = renderer.xr.getController( 1 );
  				scene.add( controller2 );
  
  				const controllerModelFactory = new XRControllerModelFactory();
  
  				controllerGrip1 = renderer.xr.getControllerGrip( 0 );
  				controllerGrip1.addEventListener( 'connected', controllerConnected );
  				controllerGrip1.addEventListener( 'disconnected', controllerDisconnected );
  				controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
  				scene.add( controllerGrip1 );
  
  				controllerGrip2 = renderer.xr.getControllerGrip( 1 );
  				controllerGrip2.addEventListener( 'connected', controllerConnected );
  				controllerGrip2.addEventListener( 'disconnected', controllerDisconnected );
  				controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
  				scene.add( controllerGrip2 );
  
  				//
  
  				
  
  			
  
  
  			function controllerConnected( event ) {
  
  				const oscillator = listener.context.createOscillator();
  				oscillator.type = 'sine';
  				oscillator.start();
  
  				const audio = new THREE.PositionalAudio( listener );
  				audio.setNodeSource( oscillator );
  				audio.setRefDistance( 20 );
  				audio.setVolume( 0 );
  
  				this.userData.gamepad = event.data.gamepad;
  				this.userData.colliding = false;
  				this.userData.audio = audio;
  
  				this.add( audio );
  
  			}
  
  			function controllerDisconnected() {
  
  				const audio = this.userData.audio;
  				audio.source.stop();
  
  				this.remove( audio );
  
  			}
  
  			
  
  
  			function handleCollisions() {
  
  				for ( let i = 0; i < group.children.length; i ++ ) {
  
  					group.children[ i ].collided = false;
  
  				}
  
  				handleController( controllerGrip1 );
  				handleController( controllerGrip2 );
  
  				for ( let i = 0; i < group.children.length; i ++ ) {
  
  					const child = group.children[ i ];
  					if ( ! child.collided ) {
  
  						// reset uncollided boxes
  						child.material.emissive.b = 0;
  						child.scale.setScalar( 1 );
  
  					}
  
  				}
  
  			}
  
  			// minor pentatonic scale, so whichever notes is stricken would be more pleasant
  			const musicScale = [ 0, 3, 5, 7, 10 ];
  
  			function handleController( controller ) {
  
  				controller.userData.colliding = false;
  
  				const audio = controller.userData.audio;
  				const gamepad = controller.userData.gamepad;
  
  				if ( audio === undefined || gamepad === undefined ) return;
  
  				const oscillator = audio.source;
  				const supportHaptic = 'hapticActuators' in gamepad && gamepad.hapticActuators != null && gamepad.hapticActuators.length > 0;
  
  				const sphere = {
  					radius: 0.03,
  					center: controller.position
  				};
  
  				for ( let i = 0; i < group.children.length; i ++ ) {
  
  					const child = group.children[ i ];
  					box.setFromObject( child );
  
  					if ( box.intersectsSphere( sphere ) ) {
  
  						child.material.emissive.b = 1;
  						const intensity = child.userData.index / group.children.length;
  						child.scale.setScalar( 1 + Math.random() * 0.1 * intensity );
  
  						if ( supportHaptic ) {
  
  							gamepad.hapticActuators[ 0 ].pulse( intensity, 100 );
  
  						}
  
  						const musicInterval = musicScale[ child.userData.index % musicScale.length ] + 12 * Math.floor( child.userData.index / musicScale.length );
  						oscillator.frequency.value = 110 * Math.pow( 2, musicInterval / 12 );
  						controller.userData.colliding = true;
  						group.children[ i ].collided = true;
  
  					}
  
  				}
  
  				if ( controller.userData.colliding ) {
  
  					audio.setVolume( 0.5 );
  
  				} else {
  
  					audio.setVolume( 0 );
  
  				}
  
  			}
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    for ( let i = 0; i < group.children.length; i ++ ) {
    					group.children[ i ].collided = false;
    				}
    				handleController( controllerGrip1 );
    				handleController( controllerGrip2 );
    				for ( let i = 0; i < group.children.length; i ++ ) {
    					const child = group.children[ i ];
    					if ( ! child.collided ) {
    						// reset uncollided boxes
    						child.material.emissive.b = 0;
    						child.scale.setScalar( 1 );
    					}
    				}
    }
  })
  
  		
}
</script>
