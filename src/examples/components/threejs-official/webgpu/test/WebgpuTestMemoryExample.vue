<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-options="{ fov: 60, near: 1, far: 10000 }"
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
import { pass, mrt, packNormalToRGB, normalView, screenUV, context, sample, unpackRGBToNormal } from 'three/tsl';
import { outline } from 'three/examples/jsm/tsl/display/OutlineNode.js';
import { ao } from 'three/examples/jsm/tsl/display/GTAONode.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>WebGPU Memory Test I</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let generateMeshes = true;
  			let mesh;
  			let renderPipeline;
  			let aoNode, outlineNode, scenePass, prePass;
  			const selectedObjects = [];
  
  			const params = {
  				castShadow: true,
  				enablePP: false,
  				enableOutline: true,
  				enableAO: true,
  				recreateLight: () => {
  
  					// Remove existing light
  					if ( light ) {
  
  						scene.remove( light );
  						light.dispose();
  						light = null;
  
  					}
  
  					// Create new directional light
  					light = new THREE.DirectionalLight( 0xffffff, 1 );
  					light.position.set( Math.random() * 200 - 100, 100, Math.random() * 200 - 100 );
  					light.castShadow = params.castShadow;
  					scene.add( light );
  
  				},
  				start: () => {
  
  					generateMeshes = true;
  
  				},
  				stop: () => {
  
  					generateMeshes = false;
  
  				}
  			};
  
  			
  
  
  				
  
  				
  				camera.position.z = 200;
  
  				
  				scene.background = new THREE.Color( 0xffffff );
  
  				
  				renderer.shadowMap.enabled = true;
  
  
  				renderer.inspector = new Inspector();
  
  
  				light = new THREE.DirectionalLight( 0xffffff, 1 );
  				light.position.set( 0, 100, 0 );
  				light.castShadow = true;
  				scene.add( light );
  
  				const planeGeometry = new THREE.PlaneGeometry( 1000, 1000 );
  				const planeMaterial = new THREE.MeshLambertMaterial( { color: 0xcccccc } );
  				const plane = new THREE.Mesh( planeGeometry, planeMaterial );
  				plane.rotation.x = - Math.PI / 2;
  				plane.position.y = - 100;
  				plane.receiveShadow = true;
  				scene.add( plane );
  
  				// Inspector UI
  				const gui = renderer.inspector.createParameters( 'Settings' );
  
  				gui.add( params, 'castShadow' ).name( 'Cast Shadow' ).onChange( ( value ) => {
  
  					if ( light ) light.castShadow = value;
  
  				} );
  
  				const ppFolder = gui.addFolder( 'Post Processing' );
  				ppFolder.add( params, 'enablePP' ).name( 'Enable' ).onChange( updatePostProcessing );
  				ppFolder.add( params, 'enableOutline' ).name( 'Outline' ).onChange( updatePostProcessing );
  				ppFolder.add( params, 'enableAO' ).name( 'AO' ).onChange( updatePostProcessing );
  
  				gui.add( params, 'recreateLight' ).name( 'Recreate Directional Light' );
  				gui.add( params, 'start' ).name( 'Start Creating Meshes' );
  				gui.add( params, 'stop' ).name( 'Stop Creating Meshes' );
  
  				
  
  			
  
  
  			function updatePostProcessing() {
  
  				if ( renderPipeline ) {
  
  					renderPipeline.dispose();
  					renderPipeline = null;
  
  				}
  
  				if ( scenePass ) {
  
  					scenePass.dispose();
  					scenePass = null;
  
  				}
  
  				if ( prePass ) {
  
  					prePass.dispose();
  					prePass = null;
  
  				}
  
  				if ( aoNode ) {
  
  					aoNode.dispose();
  					aoNode = null;
  
  				}
  
  				if ( outlineNode ) {
  
  					outlineNode.dispose();
  					outlineNode = null;
  
  				}
  
  				if ( params.enablePP ) {
  
  					renderPipeline = new THREE.RenderPipeline( renderer );
  
  					scenePass = pass( scene, camera );
  					let colorNode = scenePass;
  
  					if ( params.enableAO ) {
  
  						prePass = pass( scene, camera );
  						prePass.setMRT( mrt( {
  							output: packNormalToRGB( normalView )
  						} ) );
  
  						const prePassNormal = sample( ( uv ) => {
  
  							return unpackRGBToNormal( prePass.getTextureNode().sample( uv ) );
  
  						} );
  						const prePassDepth = prePass.getTextureNode( 'depth' );
  
  						aoNode = ao( prePassDepth, prePassNormal, camera );
  
  						scenePass.contextNode = context( {
  							ao: aoNode.getTextureNode().sample( screenUV ).r
  						} );
  
  					}
  
  					if ( params.enableOutline ) {
  
  						outlineNode = outline( scene, camera, {
  							selectedObjects: selectedObjects
  						} );
  						colorNode = colorNode.add( outlineNode );
  
  					}
  
  					renderPipeline.outputNode = colorNode;
  
  				}
  
  			}
  
  			
  
  			function createImage() {
  
  				const canvas = document.createElement( 'canvas' );
  				canvas.width = 256;
  				canvas.height = 256;
  
  				const canvas2DContext = canvas.getContext( '2d' );
  				canvas2DContext.fillStyle = 'rgb(' + Math.floor( Math.random() * 256 ) + ',' + Math.floor( Math.random() * 256 ) + ',' + Math.floor( Math.random() * 256 ) + ')';
  				canvas2DContext.fillRect( 0, 0, 256, 256 );
  
  				return canvas;
  
  			}
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    if ( generateMeshes ) {
    					if ( mesh ) {
    						scene.remove( mesh );
    						mesh.geometry.dispose();
    						mesh.material.map.dispose();
    						mesh.material.dispose();
    					}
    					const geometry = new THREE.SphereGeometry( 50, Math.random() * 64, Math.random() * 32 );
    					const texture = new THREE.CanvasTexture( createImage() );
    					const material = new THREE.MeshLambertMaterial( { map: texture } );
    					mesh = new THREE.Mesh( geometry, material );
    					mesh.castShadow = true;
    					scene.add( mesh );
    					if ( outlineNode ) {
    						selectedObjects[ 0 ] = mesh;
    					}
    				}
    				if ( renderPipeline ) {
    					renderPipeline.render();
    				} else {
    				}
  })
  
  		
}
</script>
