<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-options="{ fov: 45, near: 0.1, far: 2000 }"
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
import { texture, uv, time, oscTriangle } from 'three/tsl';
import { unzipSync } from 'three/examples/jsm/libs/fflate.module.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>2D Texture Array</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			//
  
  			let mesh;
  
  			const planeWidth = 50;
  			const planeHeight = 50;
  
  			
  
  
  				
  
  				
  				camera.position.z = 70;
  
  				
  
  				// width 256, height 256, depth 109, 8-bit, zip archived raw data
  
  				new THREE.FileLoader()
  					.setResponseType( 'arraybuffer' )
  					.load( ASSET_HOST + 'textures/3d/head256x256x109.zip', function ( data ) {
  
  						const zip = unzipSync( new Uint8Array( data as any ) );
  						const array = new Uint8Array( zip[ 'head256x256x109' ].buffer );
  
  						const map = new THREE.DataArrayTexture( array, 256, 256, 109 );
  						map.format = THREE.RedFormat;
  						map.needsUpdate = true;
  
  						let coord: any = uv();
  						coord = coord.setY( coord.y.oneMinus() ); // flip y
  
  						let oscLayers = oscTriangle( time.mul( .5 ) ); // [ /\/ ] triangle osc animation
  						oscLayers = oscLayers.add( 1 ).mul( .5 ); // convert osc range of [ -1, 1 ] to [ 0, 1 ]
  						oscLayers = oscLayers.mul( map.image.depth ); // scale osc range to texture depth
  
  						const material = new THREE.MeshBasicNodeMaterial();
  						material.colorNode = texture( map, coord ).depth( oscLayers ).r.remap( 0, 1, - .1, 1.8 ); // remap to make it more visible
  
  						const geometry = new THREE.PlaneGeometry( planeWidth, planeHeight );
  
  						mesh = new THREE.Mesh( geometry, material );
  
  						scene.add( mesh );
  
  					} );
  
  				
  
  
  				
  
  			
  
  
  			
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
