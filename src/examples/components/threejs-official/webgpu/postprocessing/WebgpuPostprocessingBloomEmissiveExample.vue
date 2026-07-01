<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-position="[-1.8, 0.6, 2.7]"
    :camera-options="{ fov: 45, near: 0.25, far: 20 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { pass, mrt, output, emissive, vec4 } from 'three/tsl';
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Emissive Bloom</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let renderPipeline;
  
  			
  
  
  				
  
  				//
  
  				
  
  
  				
  
  				new HDRLoader()
  					.setPath( ASSET_HOST + 'textures/equirectangular/' )
  					.load( 'moonless_golf_1k.hdr', function ( texture ) {
  
  						texture.mapping = THREE.EquirectangularReflectionMapping;
  
  						scene.background = texture;
  						scene.environment = texture;
  
  						// model
  
  						const loader = new GLTFLoader().setPath( ASSET_HOST + 'models/gltf/DamagedHelmet/glTF/' );
  						loader.load( 'DamagedHelmet.gltf', function ( gltf ) {
  
  							scene.add( gltf.scene );
  
  						} );
  
  					} );
  
  				//
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.inspector = new Inspector();
  
  
  				//
  
  				const scenePass = pass( scene, camera );
  
  				// set up MRT with emissive
  
  				const mrtNode = mrt( {
  					output: output,
  					emissive: vec4( emissive, output.a )
  				} );
  
  				mrtNode.setBlendMode( 'emissive', new THREE.BlendMode( THREE.NormalBlending ) );
  
  				scenePass.setMRT( mrtNode );
  
  				// optimize the bandwidth
  
  				const emissiveTexture = scenePass.getTexture( 'emissive' );
  				emissiveTexture.type = THREE.UnsignedByteType;
  
  				//
  
  				const outputPass = scenePass.getTextureNode().toInspector( 'Color' );
  				const emissivePass = scenePass.getTextureNode( 'emissive' ).toInspector( 'Emissive' );
  
  				const bloomPass = bloom( emissivePass, 2.5, .5 );
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  				renderPipeline.outputNode = outputPass.add( bloomPass );
  
  				//
  
  
  				controls.minDistance = 2;
  				controls.maxDistance = 10;
  				controls.target.set( 0, 0, - 0.2 );
  				controls.update();
  
  				
  
  				//
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  
  				const bloomFolder = gui.addFolder( 'Bloom' );
  				bloomFolder.add( bloomPass.strength, 'value', 0.0, 5.0 ).name( 'strength' );
  				bloomFolder.add( bloomPass.radius, 'value', 0.0, 1.0 ).name( 'radius' );
  
  				const toneMappingFolder = gui.addFolder( 'Tone Mapping' );
  				toneMappingFolder.add( renderer, 'toneMappingExposure', 0.1, 2 ).name( 'exposure' );
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    renderPipeline.render();
  })
  
  		
}
</script>
