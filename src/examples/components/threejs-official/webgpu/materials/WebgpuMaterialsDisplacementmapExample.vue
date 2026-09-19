<template>
  <WebGPUExampleScene
    camera="perspective"
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
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Displacement Map</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  			const settings = {
  				metalness: 1.0,
  				roughness: 0.4,
  				ambientIntensity: 0.2,
  				aoMapIntensity: 1.0,
  				envMapIntensity: 1.0,
  				displacementScale: 2.436143, // from original model
  				normalScale: 1.0
  			};
  
  			let mesh, material: any;
  
  			let pointLight: any, ambientLight: any;
  
  			const height = 500; // of camera frustum
  
  			let r = 0.0;
  
  			
  			initGui();
  
  			// Init gui
  			function initGui() {
  
  				const gui = renderer.inspector.createParameters( 'settings' );
  
  				gui.add( settings, 'metalness', 0, 1 ).onChange( function ( value: any ) {
  
  					material.metalness = value;
  
  				} );
  
  				gui.add( settings, 'roughness', 0, 1 ).onChange( function ( value: any ) {
  
  					material.roughness = value;
  
  				} );
  
  				gui.add( settings, 'aoMapIntensity', 0, 1 ).onChange( function ( value: any ) {
  
  					material.aoMapIntensity = value;
  
  				} );
  
  				gui.add( settings, 'ambientIntensity', 0, 1 ).onChange( function ( value: any ) {
  
  					ambientLight.intensity = value;
  
  				} );
  
  				gui.add( settings, 'envMapIntensity', 0, 3 ).onChange( function ( value: any ) {
  
  					material.envMapIntensity = value;
  
  				} );
  
  				gui.add( settings, 'displacementScale', 0, 3.0 ).onChange( function ( value: any ) {
  
  					material.displacementScale = value;
  
  				} );
  
  				gui.add( settings, 'normalScale', - 1, 1 ).onChange( function ( value: any ) {
  
  					material.normalScale.set( 1, - 1 ).multiplyScalar( value );
  
  				} );
  
  			}
  
  			
  
  
  				
  
  				
  				renderer.inspector = new Inspector();
  
  
  				//
  
  				
  
  				const aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  				
  				camera.position.z = 1500;
  				scene.add( camera );
  
  				
  				controls.enableZoom = false;
  				controls.enableDamping = true;
  
  				// lights
  
  				ambientLight = new THREE.AmbientLight( 0xffffff, settings.ambientIntensity );
  				scene.add( ambientLight );
  
  				pointLight = new THREE.PointLight( 0xff0000, 1.5, 0, 0 );
  				pointLight.position.z = 2500;
  				scene.add( pointLight );
  
  				const pointLight2 = new THREE.PointLight( 0xff6666, 3, 0, 0 );
  				camera.add( pointLight2 );
  
  				const pointLight3 = new THREE.PointLight( 0x0000ff, 1.5, 0, 0 );
  				pointLight3.position.x = - 1000;
  				pointLight3.position.z = 1000;
  				scene.add( pointLight3 );
  
  				// env map
  
  				const path = ASSET_HOST + 'textures/cube/SwedishRoyalCastle/';
  				const format = '.jpg';
  				const urls = [
  					path + 'px' + format, path + 'nx' + format,
  					path + 'py' + format, path + 'ny' + format,
  					path + 'pz' + format, path + 'nz' + format
  				];
  
  				const reflectionCube = new THREE.CubeTextureLoader().load( urls );
  
  				// textures
  
  				const textureLoader = new THREE.TextureLoader();
  				const normalMap = textureLoader.load( ASSET_HOST + 'models/obj/ninja/normal.png' );
  				const aoMap = textureLoader.load( ASSET_HOST + 'models/obj/ninja/ao.jpg' );
  				const displacementMap = textureLoader.load( ASSET_HOST + 'models/obj/ninja/displacement.jpg' );
  
  				// material
  
  				material = new THREE.MeshStandardNodeMaterial( {
  
  					color: 0xc1c1c1,
  					roughness: settings.roughness,
  					metalness: settings.metalness,
  
  					normalMap: normalMap,
  					normalScale: new THREE.Vector2( 1, - 1 ), // why does the normal map require negation in this case?
  
  					aoMap: aoMap,
  					aoMapIntensity: 1,
  
  					displacementMap: displacementMap,
  					displacementScale: settings.displacementScale,
  					displacementBias: - 0.428408, // from original model
  
  					envMap: reflectionCube,
  					envMapIntensity: settings.envMapIntensity,
  
  					side: THREE.DoubleSide
  
  				} );
  
  				//
  
  				const loader = new OBJLoader();
  				loader.load( ASSET_HOST + 'models/obj/ninja/ninjaHead_Low.obj', function ( group ) {
  
  					const geometry = group.children[ 0 ].geometry;
  					geometry!.center();
  
  					mesh = new THREE.Mesh( geometry, material );
  					mesh.scale.multiplyScalar( 25 );
  					scene.add( mesh );
  
  				} );
  
  				//
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    {
    pointLight.position.x = 2500 * Math.cos( r );
    				pointLight.position.z = 2500 * Math.sin( r );
    				r += 0.01;
    }
  })
  
  			function render() {
  
  				pointLight.position.x = 2500 * Math.cos( r );
  				pointLight.position.z = 2500 * Math.sin( r );
  
  				r += 0.01;
  
  
  
  			}
  
  		
}
</script>
