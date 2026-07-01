<template>
  <ExampleScene
    camera="perspective"
    antialias
    alpha
    :camera-position="[-5, 0.5, 0]"
    :camera-options="{ fov: 40, near: 1, far: 2000 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">threejs</a> - transmission - alpha"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			const params = {
  				color: 0xffffff,
  				transmission: 1,
  				opacity: 1,
  				metalness: 0,
  				roughness: 0,
  				ior: 1.5,
  				thickness: 0.01,
  				attenuationColor: 0xffffff,
  				attenuationDistance: 1,
  				specularIntensity: 1,
  				specularColor: 0xffffff,
  				envMapIntensity: 1,
  				lightIntensity: 1,
  				exposure: 1
  			};
  
  
  			let mesh, material;
  
  			const hdrEquirect = new UltraHDRLoader()
  				.setPath( ASSET_HOST + 'textures/equirectangular/' )
  				.load( 'royal_esplanade_2k.hdr.jpg', function () {
  
  					hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
  
  					new GLTFLoader()
  						.setPath( ASSET_HOST + 'models/gltf/' )
  						.load( 'DragonAttenuation.glb', function ( gltf ) {
  
  							gltf.scene.traverse( function ( child ) {
  
  								if ( child.isMesh && child.material.isMeshPhysicalMaterial ) {
  
  									mesh = child;
  									material = mesh.material;
  
  									const color = new THREE.Color();
  
  									params.color = color.copy( mesh.material.color ).getHex();
  									params.roughness = mesh.material.roughness;
  									params.metalness = mesh.material.metalness;
  
  									params.ior = mesh.material.ior;
  									params.specularIntensity = mesh.material.specularIntensity;
  
  									params.transmission = mesh.material.transmission;
  									params.thickness = mesh.material.thickness;
  									params.attenuationColor = color.copy( mesh.material.attenuationColor ).getHex();
  									params.attenuationDistance = mesh.material.attenuationDistance;
  
  								}
  
  							} );
  
  							
  							scene.add( gltf.scene );
  
  							scene.environment = hdrEquirect;
  							//scene.background = hdrEquirect;
  
  							render();
  
  						} );
  
  				} );
  
  			
  
  
  				
  
  
  				renderer.shadowMap.enabled = true;
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = params.exposure;
  
  				// accommodate CSS table
  				renderer.domElement.style.position = 'absolute';
  				renderer.domElement.style.top = 0;
  
  				
  
  				
  
  
  
  				controls.addEventListener( 'change', render ); // use if there is no animation loop
  				controls.minDistance = 5;
  				controls.maxDistance = 20;
  				controls.target.y = 0.5;
  				controls.update();
  
  				
  
  				//
  
  				const gui = new GUI();
  
  				gui.addColor( params, 'color' )
  					.onChange( function () {
  
  						material.color.set( params.color );
  						render();
  
  					} );
  
  				gui.add( params, 'transmission', 0, 1, 0.01 )
  					.onChange( function () {
  
  						material.transmission = params.transmission;
  						render();
  
  					} );
  
  				gui.add( params, 'opacity', 0, 1, 0.01 )
  					.onChange( function () {
  
  						material.opacity = params.opacity;
  						const transparent = params.opacity < 1;
  
  						if ( transparent !== material.transparent ) {
  
  							material.transparent = transparent;
  							material.needsUpdate = true;
  
  						}
  
  						render();
  
  					} );
  
  				gui.add( params, 'metalness', 0, 1, 0.01 )
  					.onChange( function () {
  
  						material.metalness = params.metalness;
  						render();
  
  					} );
  
  				gui.add( params, 'roughness', 0, 1, 0.01 )
  					.onChange( function () {
  
  						material.roughness = params.roughness;
  						render();
  
  					} );
  
  				gui.add( params, 'ior', 1, 2, 0.01 )
  					.onChange( function () {
  
  						material.ior = params.ior;
  						render();
  
  					} );
  
  				gui.add( params, 'thickness', 0, 5, 0.01 )
  					.onChange( function () {
  
  						material.thickness = params.thickness;
  						render();
  
  					} );
  
  				gui.addColor( params, 'attenuationColor' )
  					.name( 'attenuation color' )
  					.onChange( function () {
  
  						material.attenuationColor.set( params.attenuationColor );
  						render();
  
  					} );
  
  				gui.add( params, 'attenuationDistance', 0, 1, 0.01 )
  					.onChange( function () {
  
  						material.attenuationDistance = params.attenuationDistance;
  						render();
  
  					} );
  
  				gui.add( params, 'specularIntensity', 0, 1, 0.01 )
  					.onChange( function () {
  
  						material.specularIntensity = params.specularIntensity;
  						render();
  
  					} );
  
  				gui.addColor( params, 'specularColor' )
  					.onChange( function () {
  
  						material.specularColor.set( params.specularColor );
  						render();
  
  					} );
  
  				gui.add( params, 'envMapIntensity', 0, 1, 0.01 )
  					.name( 'envMap intensity' )
  					.onChange( function () {
  
  						material.envMapIntensity = params.envMapIntensity;
  						render();
  
  					} );
  
  				gui.add( params, 'exposure', 0, 1, 0.01 )
  					.onChange( function () {
  
  						renderer.toneMappingExposure = params.exposure;
  						render();
  
  					} );
  
  				gui.open();
  
  			
  
  
  			
  
  			//
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
