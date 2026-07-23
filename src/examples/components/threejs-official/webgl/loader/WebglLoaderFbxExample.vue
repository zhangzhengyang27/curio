<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[100, 200, 300]"
    :camera-options="{ fov: 45, near: 1, far: 2000 }"
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
import { onUnmounted } from 'vue'

let gui = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - FBXLoader<br />\n\t\t\tCharacter and animation from <a href=\"https://www.mixamo.com/\" target=\"_blank\" rel=\"noopener\">Mixamo</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			const manager = new THREE.LoadingManager();
  
  			let stats, object, loader, guiMorphsFolder;
  
  
  			const timer = new THREE.Timer();
  			timer.connect( document );
  
  			const params = {
  				asset: 'Samba Dancing'
  			};
  
  			const assets = [
  				'Samba Dancing',
  				'morph_test',
  				'monkey',
  				'monkey_embedded_texture',
  				'vCube',
  				'archer/ArcherRi01',
  				'warrior/Warrior',
  				'stanford-bunny',
  				'mixamo',
  				'RotationTest',
  				'exampleWindow',
  				'Head_69',
  				'morph-translation',
  			];
  
  			const scales = new Map();
  			scales.set( 'warrior/Warrior', 100 );
  			scales.set( 'archer/ArcherRi01', 100 );
  			scales.set( 'stanford-bunny', 0.001 );
  			scales.set( 'Head_69', 100 );
  
  			
  
  
  				
  
  				
  
  
  				
  				scene.background = new THREE.Color( 0xa0a0a0 );
  				scene.fog = new THREE.Fog( 0xa0a0a0, 200, 1000 );
  
  				const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444, 5 );
  				hemiLight.position.set( 0, 200, 0 );
  				scene.add( hemiLight );
  
  				const dirLight = new THREE.DirectionalLight( 0xffffff, 5 );
  				dirLight.position.set( 0, 200, 100 );
  				dirLight.castShadow = true;
  				dirLight.shadow.camera.top = 180;
  				dirLight.shadow.camera.bottom = - 100;
  				dirLight.shadow.camera.left = - 120;
  				dirLight.shadow.camera.right = 120;
  				scene.add( dirLight );
  
  				// scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );
  
  				// ground
  				const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
  				mesh.rotation.x = - Math.PI / 2;
  				mesh.receiveShadow = true;
  				scene.add( mesh );
  
  				const grid = new THREE.GridHelper( 2000, 20, 0x000000, 0x000000 );
  				grid.material.opacity = 0.2;
  				grid.material.transparent = true;
  				scene.add( grid );
  			
  				loader = new FBXLoader( manager );
  				loadAsset( params.asset );
  
  				
  
  
  				renderer.shadowMap.enabled = true;
  
  
  
  				controls.target.set( 0, 100, 0 );
  				controls.update();
  
  				
  
  				// stats
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				gui = new GUI();
  				gui.add( params, 'asset', assets ).onChange( function ( value ) {
  
  					loadAsset( value );
  
  				} );
  
  				guiMorphsFolder = gui.addFolder( 'Morphs' ).hide();
  
  			
  
  
  			function loadAsset( asset ) {
  
  				loader.load( ASSET_HOST + 'models/fbx/' + asset + '.fbx', function ( group ) {
  
  					if ( object ) {
  
  						object.traverse( function ( child ) {
  
  							if ( child.isSkinnedMesh ) {
  
  								child.skeleton.dispose();
  
  							}
  
  							if ( child.material ) {
  
  								const materials = Array.isArray( child.material ) ? child.material : [ child.material ];
  								materials.forEach( material => {
  
  									if ( material.map ) material.map.dispose();
  									material.dispose();
  			
  								} );
  			
  							}
  			
  							if ( child.geometry ) child.geometry.dispose();
  
  						} );
  
  						scene.remove( object );
  
  					}
  
  					//
  
  					object = group;
  
  					const scale = scales.get( asset );
  					object.scale.setScalar( scale || 1 );
  
  					if ( object.animations && object.animations.length ) {
  
  						mixer = new THREE.AnimationMixer( object );
  
  						const action = mixer.clipAction( object.animations[ 0 ] );
  						action.play();
  
  					} else {
  
  						mixer = null;
  
  					}
  
  					guiMorphsFolder.children.forEach( ( child ) => child.destroy() );
  					guiMorphsFolder.hide();
  
  					object.traverse( function ( child ) {
  
  						if ( child.isMesh ) {
  
  							child.castShadow = true;
  							child.receiveShadow = true;
  
  							if ( child.morphTargetDictionary ) {
  
  								guiMorphsFolder.show();
  								const meshFolder = guiMorphsFolder.addFolder( child.name || child.uuid );
  								Object.keys( child.morphTargetDictionary ).forEach( ( key ) => {
  			
  									meshFolder.add( child.morphTargetInfluences, child.morphTargetDictionary[ key ], 0, 1, 0.01 );
  			
  								} );
  			
  							}
  
  						}
  
  					} );
  
  					scene.add( object );
  
  				} );
  
  			}
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				if ( mixer ) mixer.update( delta );
    				stats.update();
  })
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
