<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 150, 1300]"
    :camera-options="{ fov: 45, near: 1, far: 4000 }"
    :enable-controls="false"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MD2CharacterComplex } from 'three/examples/jsm/misc/MD2CharacterComplex.js';
import { Gyroscope } from 'three/examples/jsm/misc/Gyroscope.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - MD2 Loader<br />\n\t\t\tuse arrows to control characters, mouse for camera"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  
  
  			let SCREEN_WIDTH = (__stage.container?.clientWidth || window.innerWidth);
  			let SCREEN_HEIGHT = (__stage.container?.clientHeight || window.innerHeight);
  
  			let container, stats;
  
  
  			const characters = [];
  			let nCharacters = 0;
  
  			let cameraControls;
  
  			let controls = {
  
  				moveForward: false,
  				moveBackward: false,
  				moveLeft: false,
  				moveRight: false
  
  			};
  
  			const timer = new THREE.Timer();
  			timer.connect( document );
  
  			
  
  
  				// CAMERA
  
  				
  
  
  				// SCENE
  
  				
  				scene.background = new THREE.Color( 0xffffff );
  				scene.fog = new THREE.Fog( 0xffffff, 1000, 4000 );
  
  				scene.add( camera );
  
  				// LIGHTS
  
  				scene.add( new THREE.AmbientLight( 0x666666, 3 ) );
  
  				const light = new THREE.DirectionalLight( 0xffffff, 7 );
  				light.position.set( 200, 450, 500 );
  
  				light.castShadow = true;
  
  				light.shadow.mapSize.width = 1024;
  				light.shadow.mapSize.height = 512;
  
  				light.shadow.camera.near = 100;
  				light.shadow.camera.far = 1200;
  
  				light.shadow.camera.left = - 1000;
  				light.shadow.camera.right = 1000;
  				light.shadow.camera.top = 350;
  				light.shadow.camera.bottom = - 350;
  
  				scene.add( light );
  				// scene.add( new THREE.CameraHelper( light.shadow.camera ) );
  
  
  				//  GROUND
  
  				const gt = new THREE.TextureLoader().load( ASSET_HOST + 'textures/terrain/grasslight-big.jpg' );
  				const gg = new THREE.PlaneGeometry( 16000, 16000 );
  				const gm = new THREE.MeshPhongMaterial( { color: 0xffffff, map: gt } );
  
  				const ground = new THREE.Mesh( gg, gm );
  				ground.rotation.x = - Math.PI / 2;
  				ground.material.map.repeat.set( 64, 64 );
  				ground.material.map.wrapS = THREE.RepeatWrapping;
  				ground.material.map.wrapT = THREE.RepeatWrapping;
  				ground.material.map.colorSpace = THREE.SRGBColorSpace;
  				// note that because the ground does not cast a shadow, .castShadow is left false
  				ground.receiveShadow = true;
  
  				scene.add( ground );
  
  				// RENDERER
  
  				
  
  
  				//
  
  				renderer.shadowMap.enabled = true;
  				renderer.shadowMap.type = THREE.PCFShadowMap;
  
  				// STATS
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				// EVENTS
  
  				
  				document.addEventListener( 'keydown', onKeyDown );
  				document.addEventListener( 'keyup', onKeyUp );
  
  				// CONTROLS
  
  				cameraControls = new OrbitControls( camera, renderer.domElement );
  				cameraControls.target.set( 0, 50, 0 );
  				cameraControls.update();
  
  				// CHARACTER
  
  				const configOgro = {
  
  					baseUrl: ASSET_HOST + 'models/md2/ogro/',
  
  					body: 'ogro.md2',
  					skins: [ 'grok.jpg', 'ogrobase.png', 'arboshak.png', 'ctf_r.png', 'ctf_b.png', 'darkam.png', 'freedom.png',
  							 'gib.png', 'gordogh.png', 'igdosh.png', 'khorne.png', 'nabogro.png',
  							 'sharokh.png' ],
  					weapons: [[ 'weapon.md2', 'weapon.jpg' ]],
  					animations: {
  						move: 'run',
  						idle: 'stand',
  						jump: 'jump',
  						attack: 'attack',
  						crouchMove: 'cwalk',
  						crouchIdle: 'cstand',
  						crouchAttach: 'crattack'
  					},
  
  					walkSpeed: 350,
  					crouchSpeed: 175
  
  				};
  
  				const nRows = 1;
  				const nSkins = configOgro.skins.length;
  
  				nCharacters = nSkins * nRows;
  
  				for ( let i = 0; i < nCharacters; i ++ ) {
  
  					const character = new MD2CharacterComplex();
  					character.scale = 3;
  					character.controls = controls;
  					characters.push( character );
  
  				}
  
  				const baseCharacter = new MD2CharacterComplex();
  				baseCharacter.scale = 3;
  
  				baseCharacter.onLoadComplete = function () {
  
  					let k = 0;
  
  					for ( let j = 0; j < nRows; j ++ ) {
  
  						for ( let i = 0; i < nSkins; i ++ ) {
  
  							const cloneCharacter = characters[ k ];
  
  							cloneCharacter.shareParts( baseCharacter );
  
  							// cast and receive shadows
  							cloneCharacter.enableShadows( true );
  
  							cloneCharacter.setWeapon( 0 );
  							cloneCharacter.setSkin( i );
  
  							cloneCharacter.root.position.x = ( i - nSkins / 2 ) * 150;
  							cloneCharacter.root.position.z = j * 250;
  
  							scene.add( cloneCharacter.root );
  
  							k ++;
  
  						}
  
  					}
  
  					const gyro = new Gyroscope();
  					gyro.add( camera );
  					gyro.add( light, light.target );
  
  					characters[ Math.floor( nSkins / 2 ) ].root.add( gyro );
  
  				};
  
  				baseCharacter.loadParts( configOgro );
  
  			
  
  
  			// EVENT HANDLERS
  
  			
  
  			function onKeyDown( event ) {
  
  				switch ( event.code ) {
  
  					case 'ArrowUp':
  					case 'KeyW': controls.moveForward = true; break;
  
  					case 'ArrowDown':
  					case 'KeyS': controls.moveBackward = true; break;
  
  					case 'ArrowLeft':
  					case 'KeyA': controls.moveLeft = true; break;
  
  					case 'ArrowRight':
  					case 'KeyD': controls.moveRight = true; break;
  
  					// case 'KeyC': controls.crouch = true; break;
  					// case 'Space': controls.jump = true; break;
  					// case 'ControlLeft':
  					// case 'ControlRight': controls.attack = true; break;
  
  				}
  
  			}
  
  			function onKeyUp( event ) {
  
  				switch ( event.code ) {
  
  					case 'ArrowUp':
  					case 'KeyW': controls.moveForward = false; break;
  
  					case 'ArrowDown':
  					case 'KeyS': controls.moveBackward = false; break;
  
  					case 'ArrowLeft':
  					case 'KeyA': controls.moveLeft = false; break;
  
  					case 'ArrowRight':
  					case 'KeyD': controls.moveRight = false; break;
  
  					// case 'KeyC': controls.crouch = false; break;
  					// case 'Space': controls.jump = false; break;
  					// case 'ControlLeft':
  					// case 'ControlRight': controls.attack = false; break;
  
  				}
  
  			}
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    {
    const delta = timer.getDelta();
    				for ( let i = 0; i < nCharacters; i ++ ) {
    					characters[ i ].update( delta );
    				}
    }
    				stats.update();
  })
  
  			function render() {
  
  				const delta = timer.getDelta();
  
  				for ( let i = 0; i < nCharacters; i ++ ) {
  
  					characters[ i ].update( delta );
  
  				}
  
  
  
  			}
  
  		
}
</script>
