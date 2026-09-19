<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-position="[-0.5, 0, 12]"
    :camera-options="{ fov: 25, near: 0.1, far: 100 }"
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
import { mrt, output, pass, velocity } from 'three/tsl';
import { taau } from 'three/examples/jsm/tsl/display/TAAUNode.js';
import { sharpen } from 'three/examples/jsm/tsl/display/SharpenNode.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>TAAU</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  			const params = {
  				upscaleMethod: 'TAAU',
  				resolutionScale: 0.5,
  				sharpening: true,
  				sharpness: 0.2,
  			};
  
  			let renderPipeline: any, mixer: any, timer;
  
  			
  
  
  				
  
  
  				
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  			
  				// model
  
  				const dracoLoader = new DRACOLoader();
  				const loader = new GLTFLoader();
  				loader.setDRACOLoader( dracoLoader );
  
  				loader.load( ASSET_HOST + 'models/gltf/LittlestTokyo.glb', function ( gltf ) {
  
  					const model = gltf.scene;
  					model.scale.set( 0.01, 0.01, 0.01 );
  					scene.add( model );
  
  					mixer = new THREE.AnimationMixer( model );
  					mixer.clipAction( gltf.animations[ 0 ] ).play();
  
  				} );
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				const pmremGenerator = new THREE.PMREMGenerator( renderer );
  
  				
  				scene.background = new THREE.Color( 0xbfe3dd );
  				scene.environment = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;
  
  				// controls
  
  				
  				controls.enableDamping = true;
  				controls.target.set( - 0.5, 0, 0 );
  
  				// render pipeline
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  				const scenePass = pass( scene, camera );
  				scenePass.setResolutionScale( params.resolutionScale );
  				scenePass.setMRT( mrt( {
  					output: output,
  					velocity: velocity
  				} ) );
  
  				const scenePassColor = scenePass.getTextureNode( 'output' ).toInspector( 'Color' );
  				const scenePassDepth = scenePass.getTextureNode( 'depth' ).toInspector( 'Depth', () => {
  
  					return scenePass.getLinearDepthNode();
  
  				} );
  				const scenePassVelocity = scenePass.getTextureNode( 'velocity' ).toInspector( 'Velocity' );
  
  				const taauNode = taau( scenePassColor, scenePassDepth, scenePassVelocity, camera );
  				const sharpenNode = sharpen( taauNode.getTextureNode(), params.sharpness );
  
  				function updatePipeline() {
  
  					if ( params.upscaleMethod === 'TAAU' ) {
  
  						renderPipeline.outputNode = params.sharpening ? sharpenNode : taauNode;
  
  					} else {
  
  						renderPipeline.outputNode = scenePass;
  
  					}
  
  					renderPipeline.needsUpdate = true;
  
  				}
  
  				// gui
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( params, 'upscaleMethod', [ 'Bilinear', 'TAAU' ] ).onChange( updatePipeline );
  				gui.add( params, 'resolutionScale', 0.25, 1.0, 0.25 ).onChange( ( value: any ) => {
  
  					scenePass.setResolutionScale( value );
  
  				} );
  				gui.add( params, 'sharpening' ).onChange( updatePipeline );
  				gui.add( params, 'sharpness', 0, 2, 0.05 ).onChange( ( value: any ) => {
  
  					(sharpenNode.sharpness as any).value = value;
  
  				} );
  
  				updatePipeline();
  
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    timer.update();
    				const delta = timer.getDelta();
    				if ( mixer ) {
    					mixer.update( delta );
    				}
    				renderPipeline.render();
  })
  
  		
}
</script>
