<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[3, 2, 3]"
    :camera-options="{ fov: 45, near: 0.1, far: 100 }"
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
import { PositionalAudioHelper } from 'three/examples/jsm/helpers/PositionalAudioHelper.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener noreferrer\">three.js</a> webaudio - orientation<br/>\n\t\tmusic by <a href=\"http://www.newgrounds.com/audio/listen/376737\" target=\"_blank\" rel=\"noopener noreferrer\">skullbeatz</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  		const startButton = document.getElementById( 'startButton' );
  		startButton.addEventListener( 'click', init );
  
  		
  
  
  			const overlay = document.getElementById( 'overlay' );
  			overlay.remove();
  
  			const container = document.getElementById( 'container' );
  
  			//
  
  			
  
  
  			const reflectionCube = new THREE.CubeTextureLoader()
  				.setPath( ASSET_HOST + 'textures/cube/SwedishRoyalCastle/' )
  				.load( [ 'px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg' ] );
  
  			
  			scene.background = new THREE.Color( 0xa0a0a0 );
  			scene.fog = new THREE.Fog( 0xa0a0a0, 2, 20 );
  
  			//
  
  			const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d, 3 );
  			hemiLight.position.set( 0, 20, 0 );
  			scene.add( hemiLight );
  
  			const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
  			dirLight.position.set( 5, 5, 0 );
  			dirLight.castShadow = true;
  			dirLight.shadow.camera.top = 1;
  			dirLight.shadow.camera.bottom = - 1;
  			dirLight.shadow.camera.left = - 1;
  			dirLight.shadow.camera.right = 1;
  			dirLight.shadow.camera.near = 0.1;
  			dirLight.shadow.camera.far = 20;
  			scene.add( dirLight );
  
  			// scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );
  
  			//
  
  			const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 50, 50 ), new THREE.MeshPhongMaterial( { color: 0xcbcbcb, depthWrite: false } ) );
  			mesh.rotation.x = - Math.PI / 2;
  			mesh.receiveShadow = true;
  			scene.add( mesh );
  
  			const grid = new THREE.GridHelper( 50, 50, 0xc1c1c1, 0xc1c1c1 );
  			scene.add( grid );
  
  			//
  
  			const listener = new THREE.AudioListener();
  			camera.add( listener );
  
  			const audioElement = document.getElementById( 'music' );
  			audioElement.play();
  
  			const positionalAudio = new THREE.PositionalAudio( listener );
  			positionalAudio.setMediaElementSource( audioElement );
  			positionalAudio.setRefDistance( 1 );
  			positionalAudio.setDirectionalCone( 180, 230, 0.1 );
  
  			const helper = new PositionalAudioHelper( positionalAudio, 0.1 );
  			positionalAudio.add( helper );
  
  			//
  
  			const gltfLoader = new GLTFLoader();
  			gltfLoader.load( ASSET_HOST + 'models/gltf/BoomBox.glb', function ( gltf ) {
  
  				const boomBox = gltf.scene;
  				boomBox.position.set( 0, 0.2, 0 );
  				boomBox.scale.set( 20, 20, 20 );
  
  				boomBox.traverse( function ( object ) {
  
  					if ( object.isMesh ) {
  
  						object.material.envMap = reflectionCube;
  						object.geometry.rotateY( - Math.PI );
  						object.castShadow = true;
  
  					}
  
  				} );
  
  				boomBox.add( positionalAudio );
  				scene.add( boomBox );
  		
  				} );
  
  			// sound is damped behind this wall
  
  			const wallGeometry = new THREE.BoxGeometry( 2, 1, 0.1 );
  			const wallMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, transparent: true, opacity: 0.5 } );
  
  			const wall = new THREE.Mesh( wallGeometry, wallMaterial );
  			wall.position.set( 0, 0.5, - 0.5 );
  			scene.add( wall );
  
  
  			//
  
  			
  
  
  			renderer.shadowMap.enabled = true;
  
  
  			//
  
  
  			controls.target.set( 0, 0.1, 0 );
  			controls.update();
  			controls.minDistance = 0.5;
  			controls.maxDistance = 10;
  			controls.maxPolarAngle = 0.5 * Math.PI;
  
  			//
  
  			
  
  		
  
  
  		
  
  		function animate() {
  
  
  
  		}
  
  	
}
</script>
