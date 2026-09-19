<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[-0.02, 0.03, 0.05]"
    :camera-options="{ fov: 45, near: 0.01, far: 10 }"
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
import { onUnmounted } from 'vue'

import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

let gui: any = null

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - Tone Mapping<br />\n\t\t\tVenice Mask by\n\t\t\t<a href=\"https://sketchfab.com/D.art\" target=\"_blank\" rel=\"noopener\">DailyArt</a> is licensed under <a href=\"https://creativecommons.org/licenses/by-nc/4.0/\" target=\"_blank\" rel=\"noopener\">CC Attribution-NonCommercial</a><br />\n\t\t\t<a href=\"https://hdrihaven.com/hdri/?h=venice_sunset\" target=\"_blank\" rel=\"noopener\">Venice Sunset</a> from <a href=\"https://hdrihaven.com/\" target=\"_blank\" rel=\"noopener\">HDRI Haven</a>"
async function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  				let guiExposure: any = null;
  
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
  				Neutral: THREE.NeutralToneMapping,
  				Custom: THREE.CustomToneMapping
  			};
  
  			init().catch( function ( err: any ) {
  
  				console.error( err );
  
  			} );
  
			async function init() {
  
  
  				
  
  
  				renderer.toneMapping = (toneMappingOptions as any)[ params.toneMapping ];
  				renderer.toneMappingExposure = params.exposure;
  
  				// Set CustomToneMapping to Uncharted2
  				// source: http://filmicworlds.com/blog/filmic-tonemapping-operators/
  
  				THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
  
  					'vec3 CustomToneMapping( vec3 color ) { return color; }',
  
  					`#define Uncharted2Helper( x ) max( ( ( x * ( 0.15 * x + 0.10 * 0.50 ) + 0.20 * 0.02 ) / ( x * ( 0.15 * x + 0.50 ) + 0.20 * 0.30 ) ) - 0.02 / 0.30, vec3( 0.0 ) )
  
  					float toneMappingWhitePoint = 1.0;
  
  					vec3 CustomToneMapping( vec3 color ) {
  						color *= toneMappingExposure;
  						return saturate( Uncharted2Helper( color ) / Uncharted2Helper( vec3( toneMappingWhitePoint ) ) );
  
  					}`
  
  				);
  
  				
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
  
  				gui = new GUI();
  				const toneMappingFolder = gui.addFolder( 'Tone Mapping' );
  
  				toneMappingFolder.add( params, 'toneMapping', Object.keys( toneMappingOptions ) )
  
  					.name( 'type' )
  					.onChange( function () {
  
  						updateGUI();
  
  						renderer.toneMapping = (toneMappingOptions as any)[ params.toneMapping ];
  
  					} );
  
  				guiExposure = toneMappingFolder.add( params, 'exposure', 0, 2 )
  
  					.onChange( function ( value: any ) {
  
  						renderer.toneMappingExposure = value;
  
  					} );
  
  				const backgroundFolder = gui.addFolder( 'Background' );
  
  				backgroundFolder.add( params, 'blurriness', 0, 1 )
  
  					.onChange( function ( value: any ) {
  
  						scene.backgroundBlurriness = value;
  
  					} );
  
  				backgroundFolder.add( params, 'intensity', 0, 1 )
  
  					.onChange( function ( value: any ) {
  
  						scene.backgroundIntensity = value;
  
  					} );
  
  				updateGUI();
  
  				gui.open();
  
			}
  			
  
  
  			function updateGUI() {
  
  				if ( params.toneMapping === 'None' ) {
  
  					guiExposure.hide();
  
  				} else {
  
  					guiExposure.show();
  
  				}
  
  			}
  
  			
  
  			function animate() {
  
  				controls.update();
  
  
  
  			}
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
