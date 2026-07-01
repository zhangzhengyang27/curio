<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[-0.02, 0.03, 0.05]"
    :camera-options="{ fov: 45, near: 0.01, far: 10 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader, DRACO_GLTF_CONFIG } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Shadow Map</span>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  			const params = {
  				exposure: 1.0,
  				toneMapping: 'Neutral',
  				blurriness: 0.3,
  				intensity: 1.0,
  			};
  
  			const toneMappingOptions = {
  				None: THREE.NoToneMapping,
  				Linear: THREE.LinearToneMapping,
  				Reinhard: THREE.ReinhardToneMapping,
  				Cineon: THREE.CineonToneMapping,
  				ACESFilmic: THREE.ACESFilmicToneMapping,
  				AgX: THREE.AgXToneMapping,
  				Neutral: THREE.NeutralToneMapping
  			};
  
  			init().catch( function ( err ) {
  
  				console.error( err );
  
  			} );
  
  			async 
  
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				renderer.toneMapping = toneMappingOptions[ params.toneMapping ];
  				renderer.toneMappingExposure = params.exposure;
  
  				
  				scene.backgroundBlurriness = params.blurriness;
  
  				const light = new THREE.DirectionalLight( 0xfff3ee, 3 ); // simulate sun
  				light.position.set( 1, 0.05, 0.7 );
  				scene.add( light );
  
  				// scene.add( new THREE.DirectionalLightHelper( light, 1, 0x000000 ) );
  
  				
  
  
  				
  				controls.enablePan = false;
  				controls.enableDamping = true;
  				controls.minDistance = 0.03;
  				controls.maxDistance = 0.2;
  				controls.target.set( 0, 0.03, 0 );
  				controls.update();
  
  				const hdrLoader = new HDRLoader()
  					.setPath( ASSET_HOST + 'textures/equirectangular/' );
  
  				const dracoLoader = new DRACOLoader();
  				dracoLoader.setDecoderPath( DRACO_GLTF_CONFIG );
  
  				const gltfLoader = new GLTFLoader();
  				gltfLoader.setDRACOLoader( dracoLoader );
  				gltfLoader.setPath( ASSET_HOST + 'models/gltf/' );
  
  				const [ texture, gltf ] = await Promise.all( [
  					hdrLoader.loadAsync( 'venice_sunset_1k.hdr' ),
  					gltfLoader.loadAsync( 'venice_mask.glb' ),
  				] );
  
  				// environment
  
  				texture.mapping = THREE.EquirectangularReflectionMapping;
  
  				scene.background = texture;
  				scene.environment = texture;
  
  				// model
  
  				scene.add( gltf.scene );
  
  				
  
  				//
  
  				gui = renderer.inspector.createParameters( 'Settings' );
  				const toneMappingFolder = gui.addFolder( 'Tone Mapping' );
  
  				toneMappingFolder.add( params, 'toneMapping', Object.keys( toneMappingOptions ) )
  
  					.name( 'type' )
  					.onChange( function () {
  
  						renderer.toneMapping = toneMappingOptions[ params.toneMapping ];
  
  					} );
  
  				toneMappingFolder.add( params, 'exposure', 0, 2 )
  
  					.onChange( function ( value ) {
  
  						renderer.toneMappingExposure = value;
  
  					} );
  
  				const backgroundFolder = gui.addFolder( 'Background' );
  
  				backgroundFolder.add( params, 'blurriness', 0, 1 )
  
  					.onChange( function ( value ) {
  
  						scene.backgroundBlurriness = value;
  
  					} );
  
  				backgroundFolder.add( params, 'intensity', 0, 1 )
  
  					.onChange( function ( value ) {
  
  						scene.backgroundIntensity = value;
  
  					} );
  
  			
  
  
  			
  
  			function animate() {
  
  				controls.update();
  
  
  
  			}
  
  		
}
</script>
