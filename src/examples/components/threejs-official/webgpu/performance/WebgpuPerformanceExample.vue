<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[60, 60, 60]"
    :camera-options="{ fov: 45, near: 0.1, far: 100 }"
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
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Performance</span>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let model;
  
  			const options = { static: true };
  
  			
  			function setStatic( object, value ) {
  
  				object.traverse( child => {
  
  					if ( child.isMesh ) {
  
  						child.static = value;
  
  					}
  
  				} );
  
  			}
  
  			
  
  
  				
  
  				
  
  
  				
  
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 1;
  				renderer.inspector = new Inspector();
  				//
  
  				new UltraHDRLoader()
  					.setPath( ASSET_HOST + 'textures/equirectangular/' )
  					.load( 'royal_esplanade_2k.hdr.jpg', function ( texture ) {
  
  						texture.mapping = THREE.EquirectangularReflectionMapping;
  
  						scene.environment = texture;
  
  						// model
  
  						const dracoLoader = new DRACOLoader();
  						dracoLoader.setDecoderPath( DRACO_GLTF_CONFIG );
  
  						const loader = new GLTFLoader().setPath( ASSET_HOST + 'models/gltf/' );
  						loader.setDRACOLoader( dracoLoader );
  
  						loader.load( 'dungeon_warkarma.glb', async function ( gltf ) {
  
  							model = gltf.scene;
  
  							// wait until the model can be added to the scene without blocking due to shader compilation
  
  							await renderer.compileAsync( model, camera, scene );
  
  							scene.add( model );
  
  							//
  
  							setStatic( model, options.static );
  			
  						} );
  
  					} );
  
  
  				controls.minDistance = 2;
  				controls.maxDistance = 60;
  				controls.target.set( 0, 0, - 0.2 );
  				controls.update();
  
  				// gui
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( options, 'static' ).onChange( () => {
  
  					setStatic( model, options.static );
  
  				} );
  
  				
  
  			
  
  
  			
  
  			//
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
