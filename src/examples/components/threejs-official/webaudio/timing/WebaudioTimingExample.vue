<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[7, 3, 7]"
    :camera-options="{ fov: 45, near: 0.1, far: 100 }"
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

<script setup lang="ts">
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener noreferrer\">three.js</a> webaudio - timing<br/>\n\t\tsound effect by <a href=\"https://freesound.org/people/michorvath/sounds/269718/\" target=\"_blank\" rel=\"noopener noreferrer\">michorvath</a>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  		const objects: any[] = []
  
  		const speed = 2.5;
  		const height = 3;
  		const offset = 0.5;
  
  		const startButton = document.createElement( 'button' );
  		startButton.textContent = 'Click to Start';
  		startButton.style.cssText = 'padding:12px 24px;font-size:16px;cursor:pointer;';
  		__stage.overlay?.appendChild( startButton );
  		startButton.addEventListener( 'click', init );
  
  		function init() {
  			startButton.remove();
  
  			const container = __stage.container;
  
  			
  
  			timer = new THREE.Timer();
  			timer.connect( document );
  
  			//
  
  			
  
  
  			// lights
  
  			const ambientLight = new THREE.AmbientLight( 0xcccccc );
  			scene.add( ambientLight );
  
  			const directionalLight = new THREE.DirectionalLight( 0xffffff, 2.5 );
  			directionalLight.position.set( 0, 5, 5 );
  			scene.add( directionalLight );
  
  			const d = 5;
  			directionalLight.castShadow = true;
  			directionalLight.shadow.camera.left = - d;
  			directionalLight.shadow.camera.right = d;
  			directionalLight.shadow.camera.top = d;
  			directionalLight.shadow.camera.bottom = - d;
  
  			directionalLight.shadow.camera.near = 1;
  			directionalLight.shadow.camera.far = 20;
  
  			directionalLight.shadow.mapSize.x = 1024;
  			directionalLight.shadow.mapSize.y = 1024;
  
  			// audio
  
  			const audioLoader = new THREE.AudioLoader();
  
  			const listener = new THREE.AudioListener();
  			camera.add( listener );
  
  			// floor
  
  			const floorGeometry = new THREE.PlaneGeometry( 10, 10 );
  			const floorMaterial = new THREE.MeshLambertMaterial( { color: 0x4676b6 } );
  
  			const floor = new THREE.Mesh( floorGeometry, floorMaterial );
  			floor.rotation.x = Math.PI * - 0.5;
  			floor.receiveShadow = true;
  			scene.add( floor );
  
  			// objects
  
  			const count = 5;
  			const radius = 3;
  
  			const ballGeometry = new THREE.SphereGeometry( 0.3, 32, 16 );
  			ballGeometry.translate( 0, 0.3, 0 );
  			const ballMaterial = new THREE.MeshLambertMaterial( { color: 0xcccccc } );
  
  			// create objects when audio buffer is loaded
  
  			audioLoader.load( ASSET_HOST + 'sounds/ping_pong.mp3', function ( buffer ) {
  
  				for ( let i = 0; i < count; i ++ ) {
  
  					const s = i / count * Math.PI * 2;
  
  					const ball = new THREE.Mesh( ballGeometry, ballMaterial );
  					ball.castShadow = true;
  					ball.userData.down = false;
  
  					ball.position.x = radius * Math.cos( s );
  					ball.position.z = radius * Math.sin( s );
  
  					const audio = new THREE.PositionalAudio( listener );
  					audio.setBuffer( buffer );
  					ball.add( audio );
  
  					scene.add( ball );
  					objects.push( ball );
  
  				}
  
  				} );
  
  			//
  
  			
  
  
  			renderer.shadowMap.enabled = true;
  
  
  			//
  
  
  			controls.minDistance = 1;
  			controls.maxDistance = 25;

		}

		let timer: any;
		__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
			if (!timer) return;
			timer.update();
			const time = timer.getElapsed();
    			for ( let i = 0; i < objects.length; i ++ ) {
    				const ball = objects[ i ];
    				const previousHeight = ball.position.y;
    				ball.position.y = Math.abs( Math.sin( i * offset + ( time * speed ) ) * height );
    				if ( ball.position.y < previousHeight ) {
    					ball.userData.down = true;
    				} else {
    					if ( ball.userData.down === true ) {
    						// ball changed direction from down to up
    						const audio = ball.children[ 0 ];
    						audio.play(); // play audio with perfect timing when ball hits the surface
    						ball.userData.down = false;
    					}
    				}
    			}
  })
  
  	
}
</script>
