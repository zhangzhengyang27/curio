<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 0, 4]"
    :camera-options="{ fov: 45, near: 0.01, far: 10 }"
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
import { TIFFLoader } from 'three/examples/jsm/loaders/TIFFLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - TIFF texture loader</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  
  
  				
  
  
  				
  
  
  
  
  				
  
  				const loader = new TIFFLoader();
  
  				const geometry = new THREE.PlaneGeometry();
  
  				// uncompressed
  
  				loader.load( ASSET_HOST + 'textures/tiff/crate_uncompressed.tif', function ( texture ) {
  
  					texture.colorSpace = THREE.SRGBColorSpace;
  
  					const material = new THREE.MeshBasicMaterial( { map: texture } );
  
  					const mesh = new THREE.Mesh( geometry, material );
  					mesh.position.set( - 1.5, 0, 0 );
  
  					scene.add( mesh );
  
  					render();
  
  				} );
  
  				// LZW
  
  				loader.load( ASSET_HOST + 'textures/tiff/crate_lzw.tif', function ( texture ) {
  
  					texture.colorSpace = THREE.SRGBColorSpace;
  
  					const material = new THREE.MeshBasicMaterial( { map: texture } );
  
  					const mesh = new THREE.Mesh( geometry, material );
  					mesh.position.set( 0, 0, 0 );
  
  					scene.add( mesh );
  
  					render();
  
  				} );
  
  				// JPEG
  
  				loader.load( ASSET_HOST + 'textures/tiff/crate_jpeg.tif', function ( texture ) {
  
  					texture.colorSpace = THREE.SRGBColorSpace;
  
  					const material = new THREE.MeshBasicMaterial( { map: texture } );
  
  					const mesh = new THREE.Mesh( geometry, material );
  					mesh.position.set( 1.5, 0, 0 );
  
  					scene.add( mesh );
  
  					render();
  
  				} );
  
  				//
  
  				
  
  			
  
  
  			
  
  
  			//
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
