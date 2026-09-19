<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-position="[1, 2.5, -3.5]"
    :camera-options="{ fov: 45, near: 0.1, far: 100 }"
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
import { pass, vec3, vec4, mrt, screenUV, velocity, builtinShadowContext } from 'three/tsl';
import { sss } from 'three/examples/jsm/tsl/display/SSSNode.js';
import { traa } from 'three/examples/jsm/tsl/display/TRAANode.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader, DRACO_GLTF_CONFIG } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>SSS</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  			let renderPipeline: any;
  
  			
  
  
  				
  
  
  				
  				scene.background = new THREE.Color( 0xa0a0a0 );
  				scene.fog = new THREE.Fog( 0xa0a0a0, 10, 50 );
  
  				// lights
  
  				const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d, 2 );
  				hemiLight.position.set( 0, 20, 0 );
  				scene.add( hemiLight );
  
  				const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
  				dirLight.position.set( - 3, 10, - 10 );
  				dirLight.castShadow = true;
  				dirLight.shadow.bias = - 0.001; // remove self-shadowing artifacts
  				dirLight.shadow.camera.top = 4;
  				dirLight.shadow.camera.bottom = - 4;
  				dirLight.shadow.camera.left = - 4;
  				dirLight.shadow.camera.right = 4;
  				dirLight.shadow.camera.near = 0.1;
  				dirLight.shadow.camera.far = 40;
  				dirLight.shadow.mapSize.width = 1024;
  				dirLight.shadow.mapSize.height = 1024;
  				scene.add( dirLight );
  
  				// scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );
  
  				// ground
  
  				const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), new THREE.MeshPhongMaterial( { color: 0xcbcbcb, depthWrite: false } ) );
  				mesh.rotation.x = - Math.PI / 2;
  				mesh.receiveShadow = true;
  				scene.add( mesh );
  
  				//
  
  				const dracoLoader = new DRACOLoader();
  				dracoLoader.setDecoderPath( DRACO_GLTF_CONFIG );
  
  				const loader = new GLTFLoader();
  				loader.setDRACOLoader( dracoLoader );
  				loader.load( ASSET_HOST + 'models/gltf/nemetona.glb', function ( gltf ) {
  
  					const model = gltf.scene;
  					model.rotation.y = Math.PI;
  					model.scale.setScalar( 10 );
  					model.position.y = 0.45;
  			
  					scene.add( model );
  
  					model.traverse( function ( object ) {
  
  						if ( object.isMesh ) {
  			
  							object.castShadow = true;
  							object.receiveShadow = true;
  							( object.material as any ).aoMap = null; // remove AO to better see the effect of shadows
  
  						}
  
  					} );
  
  				} );
  
  				//
  
  				
  
  
  				renderer.shadowMap.enabled = true;
  				renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  				renderer.inspector = new Inspector();
  
  
  				// post-processing
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  
  				// pre-pass
  
  				const prePass = pass( scene, camera );
  				prePass.name = 'Pre-Pass';
  				prePass.transparent = false;
  
  				prePass.setMRT( mrt( {
  					output: velocity
  				} ) );
  
  				const prePassDepth = prePass.getTextureNode( 'depth' ).toInspector( 'Depth', () => prePass.getLinearDepthNode() );
  				const prePassVelocity = prePass.getTextureNode( 'output' ).toInspector( 'Velocity' );
  
  				// scene pass
  
  				const scenePass = pass( scene, camera ).toInspector( 'Color' );
  
  				// sss
  
  				const sssPass = sss( prePassDepth, camera, dirLight );
  				sssPass.maxDistance.value = 0.2;
  				sssPass.useTemporalFiltering = true;
  
  				// scene context
  
  				const sssSample = sssPass.getTextureNode().sample( screenUV ).r;
  				const sssContext = builtinShadowContext( sssSample, dirLight );
  
  				scenePass.contextNode = sssContext;
  
  				// traa
  
  				const traaPass = traa( scenePass, prePassDepth, prePassVelocity, camera );
  				renderPipeline.outputNode = traaPass;
  
  				//
  
  				
  				controls.minDistance = 1;
  				controls.maxDistance = 20;
  				controls.target.set( 0, 2, 0 );
  				controls.enableDamping = true;
  				controls.update();
  
  				//
  
  				const params = {
  					output: 0
  				};
  
  				const types = { 'Scene with Shadow Maps + SSS': 0, 'Scene with Shadow Maps': 1, 'SSS': 2, };
  
  				const gui = renderer.inspector.createParameters( 'SSS settings' );
  				gui.add( params, 'output', types ).onChange( updatePostprocessing );
  				gui.add( sssPass.shadowIntensity, 'value', 0, 1 ).name( 'shadow intensity' );
  				gui.add( sssPass.maxDistance, 'value', 0.01, 1 ).name( 'max ray distance' );
  				gui.add( sssPass.quality, 'value', 0, 1 ).name( 'quality' );
  				gui.add( sssPass.thickness, 'value', 0.01, 0.1 ).name( 'thickness' );
  				gui.add( sssPass, 'useTemporalFiltering' ).name( 'temporal filtering' ).onChange( updatePostprocessing );
  
  				function updatePostprocessing() {
  
  					scenePass.contextNode = params.output !== 1 ? sssContext : null;
  
  					if ( params.output === 2 ) {
  
  						renderPipeline.outputNode = vec4( vec3( sssPass.r ), 1 );
  
  					} else {
  
  						renderPipeline.outputNode = sssPass.useTemporalFiltering ? traaPass : scenePass;
  
  					}
  
  					renderPipeline.needsUpdate = true;
  
  
  				}
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    renderPipeline.render();
  })
  
  		
}
</script>
