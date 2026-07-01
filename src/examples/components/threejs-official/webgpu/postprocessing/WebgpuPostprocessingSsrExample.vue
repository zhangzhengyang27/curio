<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-position="[3, 2, 3]"
    :camera-options="{ fov: 35, near: 0.1, far: 50 }"
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

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { pass, mrt, output, normalView, metalness, roughness, screenUV, color, sample, packNormalToRGB, unpackRGBToNormal, vec2, colorSpaceToWorking } from 'three/tsl';
import { ssr } from 'three/examples/jsm/tsl/display/SSRNode.js';
import { smaa } from 'three/examples/jsm/tsl/display/SMAANode.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>SSR</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  		const params = {
  			quality: 0.5,
  			blurQuality: 1,
  			maxDistance: 1,
  			intensity: 1,
  			thickness: 0.03,
  			binaryRefine: false,
  			roughness: 1,
  			enabled: true
  		};
  
  		let model, renderPipeline, ssrPass;
  
  
  		
  		async 
  
  
  			
  
  
  			
  			scene.backgroundNode = screenUV.distance( .5 ).remap( 0, 0.5 ).mix( color( 0x888877 ), color( 0x776666 ) );
  
  			const dracoLoader = new DRACOLoader();
  
  			const loader = new GLTFLoader();
  			loader.setDRACOLoader( dracoLoader );
  			loader.load( ASSET_HOST + 'models/gltf/steampunk_camera.glb', function ( gltf ) {
  
  				model = gltf.scene;
  
  				model.traverse( function ( object ) {
  
  					if ( object.material ) {
  
  						if ( object.material.name === 'Lense_Casing' ) {
  
  							object.material.transparent = true;
  
  						}
  
  						// Avoid overdrawing
  						object.material.side = THREE.FrontSide;
  
  					}
  
  				} );
  
  				model.position.y = 0.1;
  				scene.add( model );
  
  			} );
  
  			// Add a reflective plane under the camera
  
  			const floorGeometry = new THREE.CircleGeometry( 2, 64 );
  			const floorMaterial = new THREE.MeshStandardMaterial( {
  				color: 0xffffff,
  				metalness: 1,
  				roughness: 0.5
  			} );
  			const floor = new THREE.Mesh( floorGeometry, floorMaterial );
  			floor.rotation.x = - Math.PI / 2;
  			floor.position.y = - 0.8;
  			scene.add( floor );
  
  			//
  
  			
  			// renderer.setPixelRatio( window.devicePixelRatio );
  
  			renderer.toneMapping = THREE.ACESFilmicToneMapping;
  			renderer.inspector = new Inspector();
  
  
  			const environment = new RoomEnvironment();
  			const pmremGenerator = new THREE.PMREMGenerator( renderer );
  
  			scene.environment = pmremGenerator.fromScene( environment, 0.04 ).texture;
  			scene.environmentIntensity = 1.25;
  			pmremGenerator.dispose();
  
  			//
  
  			renderPipeline = new THREE.RenderPipeline( renderer );
  
  			const scenePass = pass( scene, camera );
  			scenePass.setMRT( mrt( {
  				output: output,
  				normal: packNormalToRGB( normalView ),
  				metalrough: vec2( metalness, roughness ) // pack metalness and roughness into a single attachment
  			} ) );
  
  			const scenePassColor = scenePass.getTextureNode( 'output' ).toInspector( 'Color' );
  			const scenePassNormal = scenePass.getTextureNode( 'normal' ).toInspector( 'Normal', ( node ) => {
  
  				return colorSpaceToWorking( node, THREE.SRGBColorSpace );
  
  			} );
  			const scenePassDepth = scenePass.getTextureNode( 'depth' ).toInspector( 'Depth', () => {
  
  				return scenePass.getLinearDepthNode();
  
  			} );
  			const scenePassMetalRough = scenePass.getTextureNode( 'metalrough' ).toInspector( 'Metalness-Roughness' );
  
  			// optional: optimize bandwidth by reducing the texture precision for normals and metal/roughness
  
  			const normalTexture = scenePass.getTexture( 'normal' );
  			normalTexture.type = THREE.UnsignedByteType;
  
  			const metalRoughTexture = scenePass.getTexture( 'metalrough' );
  			metalRoughTexture.type = THREE.UnsignedByteType;
  
  			const sceneNormal = sample( ( uv ) => {
  
  				return unpackRGBToNormal( scenePassNormal.sample( uv ) );
  
  			} );
  
  			//
  
  			ssrPass = ssr( scenePassColor, scenePassDepth, sceneNormal, {
  				metalnessNode: scenePassMetalRough.r,
  				roughnessNode: scenePassMetalRough.g
  			} ).toInspector( 'SSR' );
  
  			// blend SSR over beauty (SSR outputs premultiplied color, so use additive blending)
  
  			const outputNode = smaa( scenePassColor.add( ssrPass.rgb ) );
  
  			renderPipeline.outputNode = outputNode;
  
  			//
  
  			
  			controls.enableDamping = true;
  			controls.update();
  
  			
  
  			// GUI
  
  			const gui = renderer.inspector.createParameters( 'Settings' );
  			const ssrFolder = gui.addFolder( 'SSR' );
  			ssrFolder.add( params, 'quality', 0, 1 ).onChange( updateParameters );
  			ssrFolder.add( params, 'blurQuality', 1, 3, 1 ).onChange( updateParameters );
  			ssrFolder.add( params, 'maxDistance', 0, 1 ).onChange( updateParameters );
  			ssrFolder.add( params, 'intensity', 0, 1 ).onChange( updateParameters );
  			ssrFolder.add( params, 'thickness', 0, 0.05 ).onChange( updateParameters );
  			ssrFolder.add( params, 'binaryRefine' ).name( 'binary refine' ).onChange( updateParameters );
  			ssrFolder.add( params, 'enabled' ).onChange( () => {
  
  				if ( params.enabled === true ) {
  
  					renderPipeline.outputNode = outputNode;
  
  				} else {
  
  					renderPipeline.outputNode = scenePass;
  
  				}
  
  				renderPipeline.needsUpdate = true;
  
  			} );
  			const modelFolder = gui.addFolder( 'Model' );
  			modelFolder.add( params, 'roughness', 0, 1 ).onChange( ( value ) => {
  
  				model.traverse( function ( object ) {
  
  					if ( object.material ) {
  
  						object.material.roughness = value;
  
  					}
  
  				} );
  
  			} );
  
  			updateParameters();
  
  		
  
  
  		function updateParameters() {
  
  			ssrPass.quality.value = params.quality;
  			// blurQuality is a build-time constant: assigning it recompiles the blur material
  			// (the setter no-ops when the value is unchanged).
  			ssrPass.blurQuality = params.blurQuality;
  			ssrPass.maxDistance.value = params.maxDistance;
  			ssrPass.intensity.value = params.intensity;
  			ssrPass.thickness.value = params.thickness;
  			// build-time constant: assigning it recompiles the SSR material (setter no-ops if unchanged)
  			ssrPass.binaryRefine = params.binaryRefine;
  
  		}
  
  		
  
  		__stage.addUpdateCallback((_delta, _elapsed) => {
    renderPipeline.render();
  })
  
  	
}
</script>
