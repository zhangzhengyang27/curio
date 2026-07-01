<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 0, -6]"
    :camera-options="{ fov: 50, near: 1, far: 500 }"
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
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - UltraHDR texture loader <br/>\n\t\t\tConverted from hdr with <a href=\"https://gainmap-creator.mono-grid.com/\" target=\"_blank\" rel=\"noopener\">converter</a>. <br />"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  
  
  			const params = {
  				autoRotate: true,
  				metalness: 1.0,
  				roughness: 0.0,
  				exposure: 1.0,
  				resolution: '2k',
  				type: 'HalfFloatType'
  			};
  
  			let torusMesh, loader;
  
  			
  
  
  				
  
  
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = params.exposure;
  
  				torusMesh = new THREE.Mesh(
  					new THREE.TorusKnotGeometry( 1, 0.4, 128, 128, 1, 3 ),
  					new THREE.MeshStandardMaterial( { roughness: params.roughness, metalness: params.metalness } )
  				 );
  				scene.add( torusMesh );
  
  				
  
  
  				
  			
  				loader = new UltraHDRLoader();
  				loader.setDataType( THREE.FloatType );
  
  				const loadEnvironment = function ( resolution = '2k', type = 'HalfFloatType' ) {
  
  					loader.setDataType( THREE[ type ] );
  
  					loader.load( `textures/equirectangular/spruit_sunrise_${resolution}.hdr.jpg`, function ( texture ) {
  
  						texture.mapping = THREE.EquirectangularReflectionMapping;
  						texture.needsUpdate = true;
  
  						scene.background = texture;
  						scene.environment = texture;
  
  					} );
  
  				};
  
  				loadEnvironment( params.resolution, params.type );
  
  				const gui = new GUI();
  
  				gui.add( params, 'autoRotate' );
  				gui.add( params, 'metalness', 0, 1, 0.01 );
  				gui.add( params, 'roughness', 0, 1, 0.01 );
  				gui.add( params, 'exposure', 0, 4, 0.01 );
  				gui.add( params, 'resolution', [ '2k', '4k' ] ).onChange( ( value ) => {
  
  					loadEnvironment( value, params.type );
  			
  				} );
  				gui.add( params, 'type', [ 'HalfFloatType', 'FloatType' ] ).onChange( ( value ) => {
  
  					loadEnvironment( params.resolution, value );
  			
  				} );
  
  				gui.open();
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    torusMesh.material.roughness = params.roughness;
    				torusMesh.material.metalness = params.metalness;
    				if ( params.autoRotate ) {
    					torusMesh.rotation.y += 0.005;
    				}
    				renderer.toneMappingExposure = params.exposure;
  })
  
  		
}
</script>
