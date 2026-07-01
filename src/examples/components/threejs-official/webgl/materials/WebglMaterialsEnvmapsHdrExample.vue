<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 120]"
    :camera-options="{ fov: 40, near: 1, far: 1000 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HDRCubeTextureLoader } from 'three/examples/jsm/loaders/HDRCubeTextureLoader.js';
import { DebugEnvironment } from 'three/examples/jsm/environments/DebugEnvironment.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">threejs</a> - High dynamic range (RGBE) Image-based Lighting (IBL)<br />using run-time generated pre-filtered roughness mipmaps (PMREM)<br/>\n\t\t\tCreated by Prashant Sharma and <a href=\"http://clara.io/\" target=\"_blank\" rel=\"noopener\">Ben Houston</a>."
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  
  
  			const params = {
  				envMap: 'HDR',
  				roughness: 0.0,
  				metalness: 0.0,
  				exposure: 1.0,
  				debug: false
  			};
  
  			let container, stats;
  
  			let torusMesh, planeMesh;
  			let generatedCubeRenderTarget, ldrCubeRenderTarget, hdrCubeRenderTarget;
  			let ldrCubeMap, hdrCubeMap;
  
  			
  
  
  				
  
  
  				
  				scene.background = new THREE.Color( 0x000000 );
  
  				
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  
  				//
  
  				let geometry = new THREE.TorusKnotGeometry( 18, 8, 150, 20 );
  				// let geometry = new THREE.SphereGeometry( 26, 64, 32 );
  				let material = new THREE.MeshStandardMaterial( {
  					color: 0xffffff,
  					metalness: params.metalness,
  					roughness: params.roughness
  				} );
  
  				torusMesh = new THREE.Mesh( geometry, material );
  				scene.add( torusMesh );
  
  
  				geometry = new THREE.PlaneGeometry( 200, 200 );
  				material = new THREE.MeshBasicMaterial();
  
  				planeMesh = new THREE.Mesh( geometry, material );
  				planeMesh.position.y = - 50;
  				planeMesh.rotation.x = - Math.PI * 0.5;
  				scene.add( planeMesh );
  
  				THREE.DefaultLoadingManager.onLoad = function ( ) {
  
  					pmremGenerator.dispose();
  
  				};
  
  				const hdrUrls = [ 'px.hdr', 'nx.hdr', 'py.hdr', 'ny.hdr', 'pz.hdr', 'nz.hdr' ];
  				hdrCubeMap = new HDRCubeTextureLoader()
  					.setPath( './textures/cube/pisaHDR/' )
  					.load( hdrUrls, function () {
  
  						hdrCubeRenderTarget = pmremGenerator.fromCubemap( hdrCubeMap );
  
  						hdrCubeMap.magFilter = THREE.LinearFilter;
  						hdrCubeMap.needsUpdate = true;
  
  					} );
  
  				const ldrUrls = [ 'px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png' ];
  				ldrCubeMap = new THREE.CubeTextureLoader()
  					.setPath( './textures/cube/pisa/' )
  					.load( ldrUrls, function () {
  
  						ldrCubeRenderTarget = pmremGenerator.fromCubemap( ldrCubeMap );
  
  					} );
  
  				const pmremGenerator = new THREE.PMREMGenerator( renderer );
  				pmremGenerator.compileCubemapShader();
  
  				const envScene = new DebugEnvironment();
  				generatedCubeRenderTarget = pmremGenerator.fromScene( envScene );
  
  
  
  				//renderer.toneMapping = ReinhardToneMapping;
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				
  				controls.minDistance = 50;
  				controls.maxDistance = 300;
  
  				
  
  				const gui = new GUI();
  
  				gui.add( params, 'envMap', [ 'Generated', 'LDR', 'HDR' ] );
  				gui.add( params, 'roughness', 0, 1, 0.01 );
  				gui.add( params, 'metalness', 0, 1, 0.01 );
  				gui.add( params, 'exposure', 0, 2, 0.01 );
  				gui.add( params, 'debug' );
  				gui.open();
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    stats.begin();
    {
    torusMesh.material.roughness = params.roughness;
    				torusMesh.material.metalness = params.metalness;
    				let renderTarget, cubeMap;
    				switch ( params.envMap ) {
    					case 'Generated':
    						renderTarget = generatedCubeRenderTarget;
    						cubeMap = generatedCubeRenderTarget.texture;
    						break;
    					case 'LDR':
    						renderTarget = ldrCubeRenderTarget;
    						cubeMap = ldrCubeMap;
    						break;
    					case 'HDR':
    						renderTarget = hdrCubeRenderTarget;
    						cubeMap = hdrCubeMap;
    						break;
    				}
    				const newEnvMap = renderTarget ? renderTarget.texture : null;
    				if ( newEnvMap && newEnvMap !== torusMesh.material.envMap ) {
    					torusMesh.material.envMap = newEnvMap;
    					torusMesh.material.needsUpdate = true;
    					planeMesh.material.map = newEnvMap;
    					planeMesh.material.needsUpdate = true;
    				}
    				torusMesh.rotation.y += 0.005;
    				planeMesh.visible = params.debug;
    				scene.background = cubeMap;
    				renderer.toneMappingExposure = params.exposure;
    }
    				stats.end();
  })
  
  			function render() {
  
  				torusMesh.material.roughness = params.roughness;
  				torusMesh.material.metalness = params.metalness;
  
  				let renderTarget, cubeMap;
  
  				switch ( params.envMap ) {
  
  					case 'Generated':
  						renderTarget = generatedCubeRenderTarget;
  						cubeMap = generatedCubeRenderTarget.texture;
  						break;
  					case 'LDR':
  						renderTarget = ldrCubeRenderTarget;
  						cubeMap = ldrCubeMap;
  						break;
  					case 'HDR':
  						renderTarget = hdrCubeRenderTarget;
  						cubeMap = hdrCubeMap;
  						break;
  
  				}
  
  				const newEnvMap = renderTarget ? renderTarget.texture : null;
  
  				if ( newEnvMap && newEnvMap !== torusMesh.material.envMap ) {
  
  					torusMesh.material.envMap = newEnvMap;
  					torusMesh.material.needsUpdate = true;
  
  					planeMesh.material.map = newEnvMap;
  					planeMesh.material.needsUpdate = true;
  
  				}
  
  				torusMesh.rotation.y += 0.005;
  				planeMesh.visible = params.debug;
  
  				scene.background = cubeMap;
  				renderer.toneMappingExposure = params.exposure;
  
  
  
  			}
  
  		
}
</script>
