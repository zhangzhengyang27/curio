<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
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

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { texture, textureStore, Fn, instanceIndex, float, uvec2, vec4 } from 'three/tsl';
import WebGPU from 'three/examples/jsm/capabilities/WebGPU.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a>\n\t\t\t\t<span>Compute Texture</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			init().then( render );
  
  
  
  				if ( WebGPU.isAvailable() === false ) {
  
  					document.body.appendChild( WebGPU.getErrorMessage() );
  
  					throw new Error( 'No WebGPU support' );
  
  				}
  
  				const aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  				
  				camera.position.z = 1;
  
  				
  
  				// texture
  
  				const width = 512, height = 512;
  
  				const storageTexture = new THREE.StorageTexture( width, height );
  				//storageTexture.minFilter = THREE.LinearMipMapLinearFilter;
  
  				// create function
  
  				const computeTexture = Fn( ( { storageTexture } ) => {
  
  					const posX = instanceIndex.mod( width );
  					const posY = instanceIndex.div( width );
  					const indexUV = uvec2( posX, posY );
  
  					// https://www.shadertoy.com/view/Xst3zN
  
  					const x = float( posX ).div( 50.0 );
  					const y = float( posY ).div( 50.0 );
  
  					const v1 = x.sin();
  					const v2 = y.sin();
  					const v3 = x.add( y ).sin();
  					const v4 = x.mul( x ).add( y.mul( y ) ).sqrt().add( 5.0 ).sin();
  					const v = v1.add( v2, v3, v4 );
  
  					const r = v.sin();
  					const g = v.add( Math.PI ).sin();
  					const b = v.add( Math.PI ).sub( 0.5 ).sin();
  
  					textureStore( storageTexture, indexUV, vec4( r, g, b, 1 ) ).toWriteOnly();
  
  				} );
  
  				// compute
  
  				const computeNode = computeTexture( { storageTexture } ).compute( width * height );
  
  				const material = new THREE.MeshBasicNodeMaterial( { color: 0x00ff00 } );
  				material.colorNode = texture( storageTexture );
  
  				const plane = new THREE.Mesh( new THREE.PlaneGeometry( 1, 1 ), material );
  				scene.add( plane );
  
  				
  
  
  
  
  				// compute texture
  				renderer.compute( computeNode );
  
  				
  
  			
  
  
  			
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
