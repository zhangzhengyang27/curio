<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[-1.8, 0.6, 2.7]"
    :camera-options="{ fov: 45, near: 0.25, far: 20 }"
    custom-render
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { LUTPass } from 'three/examples/jsm/postprocessing/LUTPass.js';
import { LUTCubeLoader } from 'three/examples/jsm/loaders/LUTCubeLoader.js';
import { LUT3dlLoader } from 'three/examples/jsm/loaders/LUT3dlLoader.js';
import { LUTImageLoader } from 'three/examples/jsm/loaders/LUTImageLoader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

let gui: any = null

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - 3D LUTs<br />\n\t\t\tBattle Damaged Sci-fi Helmet by\n\t\t\t<a href=\"https://sketchfab.com/theblueturtle_\" target=\"_blank\" rel=\"noopener\">theblueturtle_</a><br />\n\t\t\t<a href=\"https://hdrihaven.com/hdri/?h=royal_esplanade\" target=\"_blank\" rel=\"noopener\">Royal Esplanade</a> from <a href=\"https://hdrihaven.com/\" target=\"_blank\" rel=\"noopener\">HDRI Haven</a><br />\n\t\t\tLUTs from <a href=\"https://www.rocketstock.com/free-after-effects-templates/35-free-luts-for-color-grading-videos/\">RocketStock</a>, <a href=\"https://www.freepresets.com/product/free-luts-cinematic/\">FreePresets.com</a>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			const params = {
  				enabled: true,
  				lut: 'Bourbon 64.CUBE',
  				intensity: 1
  			};
  
  			const lutMap = {
  				'Bourbon 64.CUBE': null,
  				'Chemical 168.CUBE': null,
  				'Clayton 33.CUBE': null,
  				'Cubicle 99.CUBE': null,
  				'Remy 24.CUBE': null,
  				'Presetpro-Cinematic.3dl': null,
  				'NeutralLUT': null,
  				'B&WLUT': null,
  				'NightLUT': null
  			};
  
    
  			let composer, lutPass;
  
  			
  
  
  				
  
  				
  
  
  				
  
  				new UltraHDRLoader()
  					.setPath( ASSET_HOST + 'textures/equirectangular/' )
  					.load( 'royal_esplanade_2k.hdr.jpg', function ( texture ) {
  
  						texture.mapping = THREE.EquirectangularReflectionMapping;
  
  						scene.background = texture;
  						scene.environment = texture;
  
  						// model
  
  						const loader = new GLTFLoader().setPath( ASSET_HOST + 'models/gltf/DamagedHelmet/glTF/' );
  						loader.load( 'DamagedHelmet.gltf', function ( gltf ) {
  
  							scene.add( gltf.scene );
  
  						} );
  
  					} );
  
  				Object.keys( lutMap ).forEach( name => {
  
  					if ( /\.CUBE$/i.test( name ) ) {
  
  						new LUTCubeLoader()
  							.load( 'luts/' + name, function ( result ) {
  
  								(lutMap as any)[ name ] = result;
  
  							} );
  
  					} else if ( /\LUT$/i.test( name ) ) {
  
  						new LUTImageLoader()
  							.load( `luts/${name}.png`, function ( result ) {
  
  								(lutMap as any)[ name ] = result;
  
  							} );
  
  					} else {
  
  						new LUT3dlLoader()
  							.load( 'luts/' + name, function ( result ) {
  
  								(lutMap as any)[ name ] = result;
  
  							} );
  
  					}
  
  				} );
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  
  
  				composer = new EffectComposer( renderer );
  
  
  				composer.addPass( new RenderPass( scene, camera ) );
  				composer.addPass( new OutputPass() );
  
  				lutPass = new LUTPass();
  				composer.addPass( lutPass );
  
  
  				controls.minDistance = 2;
  				controls.maxDistance = 10;
  				controls.target.set( 0, 0, - 0.2 );
  				controls.update();
  
  				gui = new GUI();
  				(gui as any).width = 350;
  				gui.add( params, 'enabled' );
  				gui.add( params, 'lut', Object.keys( lutMap ) );
  				gui.add( params, 'intensity' ).min( 0 ).max( 1 );
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    lutPass.enabled = params.enabled && Boolean( (lutMap as any)[ params.lut ] );
    				lutPass.intensity = params.intensity;
    				if ( (lutMap as any)[ params.lut ] ) {
    					const lut = (lutMap as any)[ params.lut ];
    					lutPass.lut = lut.texture3D;
    				}
    				composer.render();
  })
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
