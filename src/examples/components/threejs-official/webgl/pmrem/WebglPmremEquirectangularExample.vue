<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 0, 8]"
    :camera-options="{ fov: 45, near: 0.25, far: 20 }"
    @ready="onReady"
  />
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  
  
  				
  
  				
  
  
  				
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  
  
  
  
  				controls.minDistance = 2;
  				controls.maxDistance = 10;
  				controls.update();
  
  				new UltraHDRLoader()
  					.setPath( ASSET_HOST + 'textures/equirectangular/' )
  					.load( 'royal_esplanade_2k.hdr.jpg', function ( map ) {
  
  						map.mapping = THREE.EquirectangularReflectionMapping;
  
  						const pmremGenerator = new THREE.PMREMGenerator( renderer );
  						const envMap = pmremGenerator.fromEquirectangular( map ).texture;
  
  						scene.background = envMap;
  						scene.backgroundBlurriness = 0.5;
  
  						pmremGenerator.dispose();
  
  						const geometry = new THREE.SphereGeometry( 0.4, 64, 64 );
  
  						for ( let i = 0; i < 6; i ++ ) {
  
  							for ( let j = 0; j < 5; j ++ ) {
  
  								const material = new THREE.MeshPhysicalMaterial( {
  									roughness: i / 5,
  									metalness: j / 4,
  									envMap: envMap
  								} );
  
  								const mesh = new THREE.Mesh( geometry, material );
  								mesh.position.x = i - 2.5;
  								mesh.position.y = j - 2;
  								scene.add( mesh );
  
  							}
  
  						}
  
  					} );
  
  				
  
  			
  
  
  			
  
  			//
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
