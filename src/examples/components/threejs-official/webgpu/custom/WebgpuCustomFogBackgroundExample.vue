<template>
  <WebGPUExampleScene
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
  </WebGPUExampleScene>
</template>

<script setup lang="ts">
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { pass, color, rangeFogFactor } from 'three/tsl';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Custom Fog Background</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let renderPipeline;
  
  			
  
  
  				
  
  
  				
  
  				
  
  
  				renderer.toneMapping = THREE.NoToneMapping; // apply tone mapping in post processing, instead
  
  
  				// post processing
  
  				// render scene pass
  				const scenePass = pass( scene, camera );
  				const scenePassViewZ = scenePass.getViewZNode();
  
  				// fog color
  				const fogColor = color( 0x4080cc ); // in sRGB color space
  
  				// get fog factor from the scene pass context
  				// equivalent to: scene.fog = new THREE.Fog( 0x4080cc, 2.7, 4 );
  				const fogFactor = rangeFogFactor( 2.7, 4 ).context( { getViewZ: () => scenePassViewZ } );
  
  				// tone-mapped scene pass
  				const scenePassTM = scenePass.toneMapping( THREE.ACESFilmicToneMapping, 1 );
  
  				// mix fog using fog factor and fog color
  				const compose = fogFactor.mix( scenePassTM, fogColor );
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  				renderPipeline.outputColorTransform = true; // no tone mapping will be applied, only the default color space transform
  				renderPipeline.outputNode = compose;
  
  				//
  
  				new UltraHDRLoader()
  					.setPath( ASSET_HOST + 'textures/equirectangular/' )
  					.load( 'royal_esplanade_2k.hdr.jpg', function ( texture ) {
  
  						texture.mapping = THREE.EquirectangularReflectionMapping;
  						scene.environment = texture;
  
  						// model
  
  						const loader = new GLTFLoader().setPath( ASSET_HOST + 'models/gltf/DamagedHelmet/glTF/' );
  						loader.load( 'DamagedHelmet.gltf', function ( gltf ) {
  
  							scene.add( gltf.scene );
  
  						} );
  
  					} );
  
  				//
  
  
  				controls.minDistance = 2;
  				controls.maxDistance = 5;
  				controls.target.set( 0, - 0.1, - 0.2 );
  				controls.update();
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    renderPipeline.render();
  })
  
  		
}
</script>
