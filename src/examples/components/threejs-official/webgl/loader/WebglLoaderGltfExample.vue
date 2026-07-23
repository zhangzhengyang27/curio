<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[-1.8, 0.6, 2.7]"
    :camera-options="{ fov: 45, near: 0.25, far: 20 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - GLTFLoader<br />\n\t\t\t<a href=\"https://hdrihaven.com/hdri/?h=royal_esplanade\" target=\"_blank\" rel=\"noopener\">Royal Esplanade</a> from <a href=\"https://hdrihaven.com/\" target=\"_blank\" rel=\"noopener\">HDRI Haven</a>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  			let currentModel, mixer;
  			let currentLoadId = 0;
  
  			const timer = new THREE.Timer();
  
  			
  
  
  				
  
  				
  
  
  				
  
  				new UltraHDRLoader()
  					.setPath( ASSET_HOST + 'textures/equirectangular/' )
  					.load( 'royal_esplanade_2k.hdr.jpg', function ( texture ) {
  
  						texture.mapping = THREE.EquirectangularReflectionMapping;
  
  						scene.background = texture;
  						scene.environment = texture;
  
  						// model
  
  						fetch( 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/model-index.json' )
  							.then( response => response.json() )
  							.then( models => {
  
  								gui = new GUI();
  								const modelNames = models.map( m => m.name );
  								const params = { model: 'DamagedHelmet' };
  
  								if ( ! modelNames.includes( params.model ) && modelNames.length > 0 ) {
  
  									params.model = modelNames[ 0 ];
  
  								}
  
  								gui.add( params, 'model', modelNames ).onChange( name => {
  
  									const modelInfo = models.find( m => m.name === name );
  									loadModel( modelInfo );
  
  								} );
  
  								gui.add( scene, 'backgroundBlurriness', 0, 1 );
  
  								const initialModel = models.find( m => m.name === params.model );
  								if ( initialModel ) loadModel( initialModel );
  
  							} );
  
  					} );
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  
  
  				
  				controls.enableDamping = true;
  				controls.minDistance = 2;
  				controls.maxDistance = 10;
  				controls.target.set( 0, 0, - 0.2 );
  				controls.update();
  
  				
  
  			
  
  
  			function loadModel( modelInfo ) {
  
  				const variants = modelInfo.variants;
  				const variant = variants[ 'glTF-Binary' ] || variants[ 'glTF' ];
  				const url = `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/${ modelInfo.name }/${ variant.endsWith( '.glb' ) ? 'glTF-Binary' : 'glTF' }/${ variant }`;
  
  				if ( currentModel ) {
  
  					scene.remove( currentModel );
  					currentModel = null;
  
  				}
  
  				if ( mixer ) {
  
  					mixer.stopAllAction();
  					mixer = null;
  
  				}
  
  				const loadId = ++ currentLoadId;
  
  				const loader = new GLTFLoader();
  				loader.load( url, async function ( gltf ) {
  
  					if ( loadId !== currentLoadId ) return;
  
  					currentModel = gltf.scene;
  
  					// wait until the model can be added to the scene without blocking due to shader compilation
  
  					await renderer.compileAsync( currentModel, camera, scene );
  
  					if ( loadId !== currentLoadId ) return;
  
  					scene.add( currentModel );
  
  					fitCameraToSelection( camera, controls, currentModel );
  
  					// animations
  
  					if ( gltf.animations.length > 0 ) {
  
  						mixer = new THREE.AnimationMixer( currentModel );
  
  						for ( const animation of gltf.animations ) {
  
  							mixer.clipAction( animation ).play();
  
  						}
  
  					}
  
  				} );
  
  			}
  
  			function fitCameraToSelection( camera, controls, selection, fitOffset = 1.3 ) {
  
  				const box = new THREE.Box3();
  				box.setFromObject( selection );
  
  				const size = box.getSize( new THREE.Vector3() );
  				const center = box.getCenter( new THREE.Vector3() );
  
  				const maxSize = Math.max( size.x, size.y, size.z );
  				const fitHeightDistance = maxSize / ( 2 * Math.atan( Math.PI * camera.fov / 360 ) );
  				// const fitWidthDistance = fitHeightDistance / camera.aspect;
  				// const distance = fitOffset * Math.max( fitHeightDistance, fitWidthDistance );
  				const distance = fitOffset * fitHeightDistance;
  
  				const direction = controls.target.clone().sub( camera.position ).normalize().multiplyScalar( distance );
  
  				controls.maxDistance = distance * 10;
  				controls.minDistance = distance / 10;
  				controls.target.copy( center );
  
  				camera.near = distance / 100;
  				camera.far = distance * 100;
  				camera.updateProjectionMatrix();
  
  				camera.position.copy( controls.target ).sub( direction );
  
  				controls.update();
  
  			}
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				if ( mixer ) mixer.update( timer.getDelta() );
  })
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
