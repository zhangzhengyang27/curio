<template>
  <ExampleScene
    camera="perspective"
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
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - (normal + ao + displacement + environment) map demo.<br />\n\t\t\tninja head from <a href=\"https://gpuopen.com/archive/gamescgi/amd-gpu-meshmapper/\" target=\"_blank\" rel=\"noopener\">AMD GPU MeshMapper</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			let stats;
  
  
  			const settings = {
  				metalness: 1.0,
  				roughness: 0.4,
  				ambientIntensity: 0.2,
  				aoMapIntensity: 1.0,
  				envMapIntensity: 1.0,
  				displacementScale: 2.436143, // from original model
  				normalScale: 1.0
  			};
  
  			let mesh, material;
  
  			let pointLight, ambientLight;
  
  			const height = 500; // of camera frustum
  
  			let r = 0.0;
  
  			
  			initGui();
  
  			// Init gui
  			function initGui() {
  
  				const gui = new GUI();
  				//let gui = gui.addFolder( "Material" );
  				gui.add( settings, 'metalness' ).min( 0 ).max( 1 ).onChange( function ( value ) {
  
  					material.metalness = value;
  
  				} );
  
  				gui.add( settings, 'roughness' ).min( 0 ).max( 1 ).onChange( function ( value ) {
  
  					material.roughness = value;
  
  				} );
  
  				gui.add( settings, 'aoMapIntensity' ).min( 0 ).max( 1 ).onChange( function ( value ) {
  
  					material.aoMapIntensity = value;
  
  				} );
  
  				gui.add( settings, 'ambientIntensity' ).min( 0 ).max( 1 ).onChange( function ( value ) {
  
  					ambientLight.intensity = value;
  
  				} );
  
  				gui.add( settings, 'envMapIntensity' ).min( 0 ).max( 3 ).onChange( function ( value ) {
  
  					material.envMapIntensity = value;
  
  				} );
  
  				gui.add( settings, 'displacementScale' ).min( 0 ).max( 3.0 ).onChange( function ( value ) {
  
  					material.displacementScale = value;
  
  				} );
  
  				gui.add( settings, 'normalScale' ).min( - 1 ).max( 1 ).onChange( function ( value ) {
  
  					material.normalScale.set( 1, - 1 ).multiplyScalar( value );
  
  				} );
  
  			}
  
  			
  
  
  				
  
  				
  
  
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
  
  				material = new THREE.MeshStandardMaterial( {
  
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
  					geometry.center();
  
  					mesh = new THREE.Mesh( geometry, material );
  					mesh.scale.multiplyScalar( 25 );
  					scene.add( mesh );
  
  				} );
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    stats.begin();
    {
    pointLight.position.x = 2500 * Math.cos( r );
    				pointLight.position.z = 2500 * Math.sin( r );
    				r += 0.01;
    }
    				stats.end();
  })
  
  			function render() {
  
  				pointLight.position.x = 2500 * Math.cos( r );
  				pointLight.position.z = 2500 * Math.sin( r );
  
  				r += 0.01;
  
  
  
  			}
  
  		
}
</script>
