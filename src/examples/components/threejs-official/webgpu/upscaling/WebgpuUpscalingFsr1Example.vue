<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
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

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';
import { fsr1 } from 'three/examples/jsm/tsl/display/FSR1Node.js';
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

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>FSR 1</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  			const params = {
  				upscaleMethod: 'FSR1',
  				resolutionScale: 0.5,
  			};
  
  			let renderPipeline, mixer, timer;
  
  			
  
  
  				
  
  
  				
  
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
  
  				const scenePass = pass( scene, camera ).toInspector( 'Color' );
  				scenePass.setResolutionScale( params.resolutionScale );
  
  				// FSR 1
  
  				const fsr1Node = fsr1( scenePass ).toInspector( 'FSR1' );
  
  				//
  
  				function updatePipeline() {
  
  					if ( params.upscaleMethod === 'FSR1' ) {
  
  						renderPipeline.outputNode = fsr1Node;
  
  					} else {
  
  						renderPipeline.outputNode = scenePass;
  
  					}
  
  					renderPipeline.needsUpdate = true;
  
  				}
  
  				// gui
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( params, 'upscaleMethod', [ 'Bilinear', 'FSR1' ] ).onChange( updatePipeline );
  				gui.add( params, 'resolutionScale', 0.25, 1.0, 0.25 ).onChange( ( value ) => {
  
  					scenePass.setResolutionScale( value );
  
  				} );
  
  				updatePipeline();
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				if ( mixer ) {
    					mixer.update( delta );
    				}
    				renderPipeline.render();
  })
  
  		
}
</script>
