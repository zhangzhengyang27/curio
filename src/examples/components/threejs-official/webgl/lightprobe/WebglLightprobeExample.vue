<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 0, 30]"
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
import { onUnmounted } from 'vue'

import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator.js';
import { LightProbeHelper } from 'three/examples/jsm/helpers/LightProbeHelper.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - light probe"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  
  
  			let mesh;
  
  			let gui;
  
  
  			let directionalLight;
  
  			// linear color space
  			const API = {
  				lightProbeIntensity: 1.0,
  				directionalLightIntensity: 0.6,
  				envMapIntensity: 1
  			};
  
  			
  
  
  				// renderer
  				
  
  
  
  
  				// tone mapping
  				renderer.toneMapping = THREE.NoToneMapping;
  
  
  				// scene
  				
  
  				// camera
  				
  
  
  				// controls
  
  				controls.addEventListener( 'change', render );
  				controls.minDistance = 10;
  				controls.maxDistance = 50;
  				controls.enablePan = false;
  
  				// probe
  				lightProbe = new THREE.LightProbe();
  				scene.add( lightProbe );
  
  				// light
  				directionalLight = new THREE.DirectionalLight( 0xffffff, API.directionalLightIntensity );
  				directionalLight.position.set( 10, 10, 10 );
  				scene.add( directionalLight );
  
  				// envmap
  				const genCubeUrls = function ( prefix, postfix ) {
  
  					return [
  						prefix + 'px' + postfix, prefix + 'nx' + postfix,
  						prefix + 'py' + postfix, prefix + 'ny' + postfix,
  						prefix + 'pz' + postfix, prefix + 'nz' + postfix
  					];
  
  				};
  
  				const urls = genCubeUrls( ASSET_HOST + 'textures/cube/pisa/', '.png' );
  
  				new THREE.CubeTextureLoader().load( urls, function ( cubeTexture ) {
  
  					scene.background = cubeTexture;
  
  					lightProbe.copy( LightProbeGenerator.fromCubeTexture( cubeTexture ) );
  					lightProbe.intensity = API.lightProbeIntensity;
  					lightProbe.position.set( - 10, 0, 0 ); // position not used in scene lighting calculations (helper honors the position, however)
  
  					const geometry = new THREE.SphereGeometry( 5, 64, 32 );
  					//const geometry = new THREE.TorusKnotGeometry( 4, 1.5, 256, 32, 2, 3 );
  
  					const material = new THREE.MeshStandardMaterial( {
  						color: 0xffffff,
  						metalness: 0,
  						roughness: 0,
  						envMap: cubeTexture,
  						envMapIntensity: API.envMapIntensity,
  					} );
  
  					// mesh
  					mesh = new THREE.Mesh( geometry, material );
  					scene.add( mesh );
  
  					// helper
  					const helper = new LightProbeHelper( lightProbe, 1 );
  					scene.add( helper );
  
  					render();
  
  				} );
  
  
  				// gui
  				gui = new GUI( { title: 'Intensity' } );
  
  				gui.add( API, 'lightProbeIntensity', 0, 1, 0.02 )
  					.name( 'light probe' )
  					.onChange( function () {
  
  						lightProbe.intensity = API.lightProbeIntensity; render();
  
  					} );
  
  				gui.add( API, 'directionalLightIntensity', 0, 1, 0.02 )
  					.name( 'directional light' )
  					.onChange( function () {
  
  						directionalLight.intensity = API.directionalLightIntensity; render();
  
  					} );
  
  				gui.add( API, 'envMapIntensity', 0, 1, 0.02 )
  					.name( 'envMap' )
  					.onChange( function () {
  
  						mesh.material.envMapIntensity = API.envMapIntensity; render();
  
  					} );
  
  				// listener
  				
  
  			
  
  
  			
  
  			function render() {
  
  
  
  			}
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
