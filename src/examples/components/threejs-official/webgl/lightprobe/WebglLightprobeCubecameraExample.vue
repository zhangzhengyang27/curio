<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 0, 30]"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LightProbeHelper } from 'three/examples/jsm/helpers/LightProbeHelper.js';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - light probe from cubeCamera"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let cubeCamera;
  
  			let lightProbe;
  
  			
  
  
  				// renderer
  				
  
  
  
  
  				// scene
  				
  
  				// camera
  				
  
  
  				const cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 256 );
  
  				cubeCamera = new THREE.CubeCamera( 1, 1000, cubeRenderTarget );
  
  				// controls
  
  				controls.addEventListener( 'change', render );
  				controls.minDistance = 10;
  				controls.maxDistance = 50;
  				controls.enablePan = false;
  
  				// probe
  				lightProbe = new THREE.LightProbe();
  				scene.add( lightProbe );
  
  				// envmap
  				const genCubeUrls = function ( prefix, postfix ) {
  
  					return [
  						prefix + 'px' + postfix, prefix + 'nx' + postfix,
  						prefix + 'py' + postfix, prefix + 'ny' + postfix,
  						prefix + 'pz' + postfix, prefix + 'nz' + postfix
  					];
  
  				};
  
  				const urls = genCubeUrls( ASSET_HOST + 'textures/cube/pisa/', '.png' );
  
  				new THREE.CubeTextureLoader().load( urls, async function ( cubeTexture ) {
  
  					scene.background = cubeTexture;
  
  					cubeCamera.update( renderer, scene );
  
  					const probe = await LightProbeGenerator.fromCubeRenderTarget( renderer, cubeRenderTarget );
  
  					lightProbe.copy( probe );
  
  					scene.add( new LightProbeHelper( lightProbe, 5 ) );
  
  					render();
  
  				} );
  
  				// listener
  				
  
  			
  
  
  			
  
  			function render() {
  
  
  
  			}
  
  		
  __stage.setCamera(camera)
}
</script>
