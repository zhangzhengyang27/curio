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

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { If, vec4, float, time, cos, pow, vec2, uv, texture, Fn } from 'three/tsl';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Texture Gradient</span>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  const scene = __stage.scene
  const camera = __stage.camera
  const renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			// WebGPU Backend
  			init();
  
  			// WebGL Backend
  			init( true );
  
  			async function init( forceWebGL = false ) {
  
  				const aspect = ( (__stage.container?.clientWidth || window.innerWidth) / 2 ) / (__stage.container?.clientHeight || window.innerHeight);
  
  				camera.position.z = 2;
  
  
  
  				// texture
  
  				const material = new THREE.MeshBasicNodeMaterial( { color: 0xffffff } );
  
  				// load async brick_diffuse
  				const map = await new THREE.TextureLoader().loadAsync( ASSET_HOST + 'textures/uv_grid_opengl.jpg' );
  
  				material.colorNode = Fn( () => {
  
  					const color = vec4( 1. ).toVar();
  
  					const vuv = uv().toVar();
  					const blur = pow( float( 0.0625 ).sub( cos( vuv.x.mul( 20.0 ).add( time ) ) ).mul( 0.0625 ), 2.0 );
  
  					const grad = vec2( blur ).toVar();
  
  					If( vuv.y.greaterThan( 0.5 ), () => {
  
  						grad.assign( 0 );
  			
  					} );
  
  					color.assign(
  						texture( map, vuv.add( vec2( blur, blur ).mul( 0.5 ) ) ).grad( grad, grad ).mul( 0.25 )
  							.add( texture( map, vuv.add( vec2( blur, blur.negate() ).mul( 0.5 ) ) ).grad( grad, grad ).mul( 0.25 ) )
  							.add( texture( map, vuv.add( vec2( blur.negate(), blur ).mul( 0.5 ) ) ).grad( grad, grad ).mul( 0.25 ) )
  							.add( texture( map, vuv.add( vec2( blur.negate(), blur.negate() ).mul( 0.5 ) ) ).grad( grad, grad ).mul( 0.25 ) )
  					);
  
  
  					If( vuv.y.greaterThan( 0.497 ).and( vuv.y.lessThan( 0.503 ) ), () => {
  
  						color.assign( 1 );
  
  					} );
  			
  
  					return color;
  
  				} )();
  			
  				//
  
  				const box = new THREE.Mesh( new THREE.PlaneGeometry( 1, 1 ), material );
  				scene.add( box );
  
  
  
  
  				renderer.domElement.style.position = 'absolute';
  				renderer.domElement.style.top = '0';
  				renderer.domElement.style.left = '0';
  				renderer.domElement.style.width = '50%';
  				renderer.domElement.style.height = '100%';
  
  				if ( forceWebGL ) {
  
  					renderer.domElement.style.left = '50%';
  
  					scene.background = new THREE.Color( 0x212121 );
  			
  				} else {
  
  					scene.background = new THREE.Color( 0x313131 );
  
  				}
  
  				//
  
  				function animate() {
  
  
  			
  				}
  
  				
  
  				
  
  			}
  
  		
}
</script>
