<template>
  <WebGPUExampleScene
    camera="perspective"
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
import { output, normalView, pass, step, diffuseColor, emissive, packNormalToRGB, screenUV, mix, mrt, Fn } from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Multiple Render Targets (MRT)</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let renderPipeline;
  
  			
  
  
  				
  
  				// scene
  
  				
  
  
  				
  
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
  
  				// renderer
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.inspector = new Inspector();
  
  
  				// post processing
  
  				const scenePass = pass( scene, camera, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter } );
  				scenePass.setMRT( mrt( {
  					output: output,
  					normal: packNormalToRGB( normalView ),
  					diffuse: diffuseColor,
  					emissive: emissive
  				} ) );
  
  				// optimize textures
  
  				const normalTexture = scenePass.getTexture( 'normal' );
  				const diffuseTexture = scenePass.getTexture( 'diffuse' );
  				const emissiveTexture = scenePass.getTexture( 'emissive' );
  
  				normalTexture.type = diffuseTexture.type = emissiveTexture.type = THREE.UnsignedByteType;
  
  				// post processing - mrt
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  				renderPipeline.outputColorTransform = false;
  				renderPipeline.outputNode = Fn( () => {
  
  					const output = scenePass.getTextureNode( 'output' ); // output name is optional here
  					const normal = scenePass.getTextureNode( 'normal' );
  					const diffuse = scenePass.getTextureNode( 'diffuse' );
  					const emissive = scenePass.getTextureNode( 'emissive' );
  
  					const out = mix( output.renderOutput(), output, step( 0.2, screenUV.x ) );
  					const nor = mix( out, normal, step( 0.4, screenUV.x ) );
  					const emi = mix( nor, emissive, step( 0.6, screenUV.x ) );
  					const dif = mix( emi, diffuse, step( 0.8, screenUV.x ) );
  
  					return dif;
  
  				} )();
  
  				// controls
  
  
  				controls.minDistance = 2;
  				controls.maxDistance = 10;
  				controls.target.set( 0, 0, - 0.2 );
  				controls.update();
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    renderPipeline.render();
  })
  
  		
}
</script>
