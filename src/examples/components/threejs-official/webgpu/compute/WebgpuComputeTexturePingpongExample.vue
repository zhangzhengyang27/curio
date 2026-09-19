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

<script setup lang="ts">
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { storageTexture, textureStore, Fn, instanceIndex, uniform, float, vec2, vec4, uvec2, ivec2, int, NodeAccess } from 'three/tsl';
import WebGPU from 'three/examples/jsm/capabilities/WebGPU.js';

let material: any;


const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a>\n\t\t\t\t<span>Compute Ping/Pong Texture</span>"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let computeInitNode, computeToPing, computeToPong;
  			let pingTexture, pongTexture;
  
  			let phase = true;
  			let lastUpdate = - 1;
  
  			const width = 512, height = 512;
  
  			const seed = uniform( new THREE.Vector2() );
  
  			
  
  
  				if ( WebGPU.isAvailable() === false ) {
  
  					document.body.appendChild( WebGPU.getErrorMessage() );
  
  					throw new Error( 'No WebGPU support' );
  
  				}
  
  				const aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  				
  				camera.position.z = 1;
  
  				
  
  				// texture
  
  				const hdr = true;
  
  				pingTexture = new THREE.StorageTexture( width, height );
  				pongTexture = new THREE.StorageTexture( width, height );
  
  				if ( hdr ) {
  
  					pingTexture.type = THREE.HalfFloatType;
  					pongTexture.type = THREE.HalfFloatType;
  
  				}
  
  				const rand2 = Fn( ( [ n ]: any ) => {
  
  					return n.dot( vec2( 12.9898, 4.1414 ) ).sin().mul( 43758.5453 ).fract();
  
  				} );
  
  				// Create storage texture nodes with proper access
  				const writePing = storageTexture( pingTexture ).setAccess( NodeAccess.WRITE_ONLY );
  				const readPing = storageTexture( pingTexture ).setAccess( NodeAccess.READ_ONLY );
  				const writePong = storageTexture( pongTexture ).setAccess( NodeAccess.WRITE_ONLY );
  				const readPong = storageTexture( pongTexture ).setAccess( NodeAccess.READ_ONLY );
  
  				const computeInit = Fn( () => {
  
  					const posX = instanceIndex.mod( width );
  					const posY = instanceIndex.div( width );
  					const indexUV = uvec2( posX, posY );
  					const uv = vec2( float( posX ).div( width ), float( posY ).div( height ) );
  
  					const r = (rand2 as any)( (uv.add as any)( seed.mul( 100 ) ) ).sub( (rand2 as any)( (uv.add as any)( seed.mul( 300 ) ) ) );
  					const g = (rand2 as any)( (uv.add as any)( seed.mul( 200 ) ) ).sub( (rand2 as any)( (uv.add as any)( seed.mul( 300 ) ) ) );
  					const b = (rand2 as any)( (uv.add as any)( seed.mul( 200 ) ) ).sub( (rand2 as any)( (uv.add as any)( seed.mul( 100 ) ) ) );
  
  					textureStore( writePing, indexUV, vec4( r, g, b, 1 ) );
  
  				} );
  
  				computeInitNode = computeInit().compute( width * height );
  
  				// compute ping-pong: blur function using .load() for textureLoad
  				const blur = Fn( ( [ readTex, uv ]: any ) => {
  
  					const c0 = readTex.load( uv.add( ivec2( - 1, 1 ) ) );
  					const c1 = readTex.load( uv.add( ivec2( - 1, - 1 ) ) );
  					const c2 = readTex.load( uv.add( ivec2( 0, 0 ) ) );
  					const c3 = readTex.load( uv.add( ivec2( 1, - 1 ) ) );
  					const c4 = readTex.load( uv.add( ivec2( 1, 1 ) ) );
  
  					return c0.add( c1 ).add( c2 ).add( c3 ).add( c4 ).div( 5.0 );
  
  				} );
  
  				// compute loop: read from one texture, blur, write to another
  				const computePingPong = Fn( ( [ readTex, writeTex ]: any ) => {
  
  					const posX = instanceIndex.mod( width );
  					const posY = instanceIndex.div( width );
  					const indexUV = ivec2( int( posX ), int( posY ) );
  
  					const color = (blur as any)( readTex, indexUV );
  
  					textureStore( writeTex, indexUV, vec4( color.rgb.mul( 1.05 ), 1 ) );
  
  				} );
  
			computeToPong = (computePingPong as any)( readPing, writePong ).compute( width * height );
				computeToPing = (computePingPong as any)( readPong, writePing ).compute( width * height );
  
  				//
  
  				material = new THREE.MeshBasicMaterial( { color: 0xffffff, map: pongTexture } );
  
  				const plane = new THREE.Mesh( new THREE.PlaneGeometry( 1, 1 ), material );
  				scene.add( plane );
  
  				
  
  
  				// compute init
  
  				renderer.compute( computeInitNode );
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    const time = performance.now();
    				const seconds = Math.floor( time / 1000 );
    				// reset every second
    				if ( phase && seconds !== lastUpdate ) {
    					seed.value.set( Math.random(), Math.random() );
    					renderer.compute( computeInitNode );
    					lastUpdate = seconds;
    				}
    				// compute step
    				renderer.compute( phase ? computeToPong : computeToPing );
    				material.map = phase ? pongTexture : pingTexture;
    				phase = ! phase;
    				// render step
    				// update material texture node
  })
  
  		
}
</script>
