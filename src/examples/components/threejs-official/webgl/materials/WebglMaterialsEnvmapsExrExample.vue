<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 120]"
    :camera-options="{ fov: 40, near: 1, far: 1000 }"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">threejs</a> - Example of an IBL (Image based lighting) pipeline based around<br> equirectangular EXR lightprobe data. Created by <a href=\"https://github.com/richardmonette\" target=\"_blank\" rel=\"noopener\">Richard Monette</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			const params = {
  				envMap: 'EXR',
  				roughness: 0.0,
  				metalness: 0.0,
  				exposure: 1.0,
  				debug: false,
  			};
  
  			let container, stats;
  
  			let torusMesh, planeMesh;
  			let pngCubeRenderTarget, exrCubeRenderTarget;
  			let pngBackground, exrBackground;
  
  			
  
  
  				
  
  
  				
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  
  				//
  
  				let geometry = new THREE.TorusKnotGeometry( 18, 8, 150, 20 );
  				let material = new THREE.MeshStandardMaterial( {
  					metalness: params.metalness,
  					roughness: params.roughness,
  					envMapIntensity: 1.0
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
  
  				new EXRLoader().load( ASSET_HOST + 'textures/piz_compressed.exr', function ( texture ) {
  
  					texture.mapping = THREE.EquirectangularReflectionMapping;
  
  					exrCubeRenderTarget = pmremGenerator.fromEquirectangular( texture );
  					exrBackground = texture;
  
  				} );
  
  				new THREE.TextureLoader().load( ASSET_HOST + 'textures/equirectangular.png', function ( texture ) {
  
  					texture.mapping = THREE.EquirectangularReflectionMapping;
  					texture.colorSpace = THREE.SRGBColorSpace;
  
  					pngCubeRenderTarget = pmremGenerator.fromEquirectangular( texture );
  					pngBackground = texture;
  
  				} );
  
  				const pmremGenerator = new THREE.PMREMGenerator( renderer );
  				pmremGenerator.compileEquirectangularShader();
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				
  				controls.minDistance = 50;
  				controls.maxDistance = 300;
  
  				
  
  				const gui = new GUI();
  
  				gui.add( params, 'envMap', [ 'EXR', 'PNG' ] );
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
    				let newEnvMap = torusMesh.material.envMap;
    				let background = scene.background;
    				switch ( params.envMap ) {
    					case 'EXR':
    						newEnvMap = exrCubeRenderTarget ? exrCubeRenderTarget.texture : null;
    						background = exrBackground;
    						break;
    					case 'PNG':
    						newEnvMap = pngCubeRenderTarget ? pngCubeRenderTarget.texture : null;
    						background = pngBackground;
    						break;
    				}
    				if ( newEnvMap !== torusMesh.material.envMap ) {
    					torusMesh.material.envMap = newEnvMap;
    					torusMesh.material.needsUpdate = true;
    					planeMesh.material.map = newEnvMap;
    					planeMesh.material.needsUpdate = true;
    				}
    				torusMesh.rotation.y += 0.005;
    				planeMesh.visible = params.debug;
    				scene.background = background;
    				renderer.toneMappingExposure = params.exposure;
    }
    				stats.end();
  })
  
  			function render() {
  
  				torusMesh.material.roughness = params.roughness;
  				torusMesh.material.metalness = params.metalness;
  
  				let newEnvMap = torusMesh.material.envMap;
  				let background = scene.background;
  
  				switch ( params.envMap ) {
  
  					case 'EXR':
  						newEnvMap = exrCubeRenderTarget ? exrCubeRenderTarget.texture : null;
  						background = exrBackground;
  						break;
  					case 'PNG':
  						newEnvMap = pngCubeRenderTarget ? pngCubeRenderTarget.texture : null;
  						background = pngBackground;
  						break;
  
  				}
  
  				if ( newEnvMap !== torusMesh.material.envMap ) {
  
  					torusMesh.material.envMap = newEnvMap;
  					torusMesh.material.needsUpdate = true;
  
  					planeMesh.material.map = newEnvMap;
  					planeMesh.material.needsUpdate = true;
  
  				}
  
  				torusMesh.rotation.y += 0.005;
  				planeMesh.visible = params.debug;
  
  				scene.background = background;
  				renderer.toneMappingExposure = params.exposure;
  
  
  
  			}
  
  		
}
</script>
