<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 50, near: 1, far: 10000 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Custom CubeMap Mipmaps</span>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let container;
  
  
  			
  			// load customized cube texture
  			async function loadCubeTextureWithMipmaps() {
  
  				const path = ASSET_HOST + 'textures/cube/angus/';
  				const format = '.jpg';
  				const mipmaps = [];
  				const maxLevel = 8;
  
  				async function loadCubeTexture( urls ) {
  
  					return new Promise( function ( resolve ) {
  
  						new THREE.CubeTextureLoader().load( urls, function ( cubeTexture ) {
  
  							resolve( cubeTexture );
  
  						} );
  
  
  					} );
  
  				}
  
  				// load mipmaps
  				const pendings = [];
  
  				for ( let level = 0; level <= maxLevel; ++ level ) {
  
  					const urls = [];
  
  					for ( let face = 0; face < 6; ++ face ) {
  
  						urls.push( path + 'cube_m0' + level + '_c0' + face + format );
  
  					}
  
  					const mipmapLevel = level;
  
  					pendings.push( loadCubeTexture( urls ).then( function ( cubeTexture ) {
  
  						mipmaps[ mipmapLevel ] = cubeTexture;
  
  					} ) );
  
  				}
  
  				await Promise.all( pendings );
  
  				const customizedCubeTexture = mipmaps.shift();
  				customizedCubeTexture.mipmaps = mipmaps;
  				customizedCubeTexture.colorSpace = THREE.SRGBColorSpace;
  				customizedCubeTexture.minFilter = THREE.LinearMipMapLinearFilter;
  				customizedCubeTexture.magFilter = THREE.LinearFilter;
  				customizedCubeTexture.generateMipmaps = false;
  				customizedCubeTexture.needsUpdate = true;
  
  				return customizedCubeTexture;
  
  			}
  
  			
  
  
  				
  				camera.position.z = 500;
  
  				
  
  				loadCubeTextureWithMipmaps().then( function ( cubeTexture ) {
  
  					// model
  					const sphere = new THREE.SphereGeometry( 100, 128, 128 );
  
  					// manual mipmaps
  					let material = new THREE.MeshBasicMaterial( { color: 0xffffff, envMap: cubeTexture } );
  					material.name = 'manual mipmaps';
  
  					let mesh = new THREE.Mesh( sphere, material );
  					mesh.position.set( 100, 0, 0 );
  					scene.add( mesh );
  
  
  					// auto mipmaps
  					material = material.clone();
  					material.name = 'auto mipmaps';
  
  					const autoCubeTexture = cubeTexture.clone();
  					autoCubeTexture.mipmaps = [];
  					autoCubeTexture.generateMipmaps = true;
  					autoCubeTexture.needsUpdate = true;
  
  					material.envMap = autoCubeTexture;
  
  					mesh = new THREE.Mesh( sphere, material );
  					mesh.position.set( - 100, 0, 0 );
  					scene.add( mesh );
  
  				} );
  
  				//renderer
  				
  
  
  				//controls
  
  				controls.minPolarAngle = Math.PI / 4;
  				controls.maxPolarAngle = Math.PI / 1.5;
  
  				
  
  			
  
  
  			
  
  			function animate() {
  
  
  
  			}
  
  		
}
</script>
