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
import { storage, If, vec3, uv, uint, float, Fn, instanceIndex, workgroupBarrier } from 'three/tsl';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a>\n\t\t\t<br />This example demonstrates fetching an external element from a StorageBuffer.\n\t\t\t<br />The left canvas uses the WebGPU Backend, while the right uses the WebGL Backend.\n\t\t\t<div id=\"timestamps\" style=\"\n\t\t\t\tposition: absolute;\n\t\t\t\ttop: 60px;\n\t\t\t\tleft: 0;\n\t\t\t\tpadding: 10px;\n\t\t\t\tbackground: rgba( 0, 0, 0, 0.5 );\n\t\t\t\tcolor: #fff;\n\t\t\t\tfont-family: monospace;\n\t\t\t\tfont-size: 12px;\n\t\t\t\tline-height: 1.5;\n\t\t\t\tpointer-events: none;\n\t\t\t\ttext-align: left;\n\t\t\t\">"
function onReady(__stage) {
  const scene = __stage.scene
  const camera = __stage.camera
  const renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			const timestamps = {
  				webgpu: document.getElementById( 'timestamps' ),
  				webgl: document.getElementById( 'timestamps_webgl' )
  			};
  
  			// WebGPU Backend
  			init();
  
  			// WebGL Backend
  			init( true );
  
  			async function init( forceWebGL = false ) {
  
  				const aspect = ( (__stage.container?.clientWidth || window.innerWidth) / 2 ) / (__stage.container?.clientHeight || window.innerHeight);
  
  				camera.position.z = 1;
  
  
  
  				// texture
  
  				const size = 32; // non power of two buffer size is not well supported in WebGPU
  				const barCount = 32;
  
  				const type = [ 'float', 'vec2', 'vec3', 'vec4' ];
  
  				const arrayBufferNodes = [];
  
  				for ( let i = 0; i < type.length; i ++ ) {
  
  					const typeSize = i + 1;
  					const array = new Array( size * typeSize ).fill( 0 );
  
  					const arrayBuffer = new THREE.StorageInstancedBufferAttribute( new Float32Array( array ), typeSize );
  
  					arrayBufferNodes.push( storage( arrayBuffer, type[ i ], size ).setPBO( true ) );
  
  				}
  
  				const computeInitOrder = Fn( () => {
  
  					for ( let i = 0; i < type.length; i ++ ) {
  
  						arrayBufferNodes[ i ].element( instanceIndex ).assign( instanceIndex );
  
  					}
  
  				} );
  
  				const computeInvertOrder = Fn( () => {
  
  					for ( let i = 0; i < type.length; i ++ ) {
  
  						const invertIndex = arrayBufferNodes[ i ].element( uint( size - 1 ).sub( instanceIndex ) ).toVar();
  						workgroupBarrier();
  						arrayBufferNodes[ i ].element( instanceIndex ).assign( invertIndex );
  
  					}
  
  				} );
  
  				// compute
  
  				const computeInit = computeInitOrder().compute( size );
  
  				const compute = computeInvertOrder().compute( size );
  
  				const material = new THREE.MeshBasicNodeMaterial( { color: 0x00ff00 } );
  
  				material.colorNode = Fn( () => {
  
  					const index = uint( uv().x.mul( size ).floor() ).toVar();
  
  					If( index.greaterThanEqual( size ), () => {
  
  						index.assign( uint( size ).sub( 1 ) );
  
  					} );
  
  					const color = vec3( 0, 0, 0 ).toVar();
  
  					If( uv().y.greaterThan( 0.0 ), () => {
  
  						const indexValue = arrayBufferNodes[ 0 ].element( index ).toVar();
  						const value = float( indexValue ).div( float( size ) ).mul( barCount ).floor().div( barCount );
  			
  						color.assign( vec3( value, 0, 0 ) );
  
  					} );
  
  					If( uv().y.greaterThan( 0.25 ), () => {
  
  						const indexValue = arrayBufferNodes[ 1 ].element( index ).toVar();
  						const value = float( indexValue ).div( float( size ) ).mul( barCount ).floor().div( barCount );
  			
  						color.assign( vec3( 0, value, 0 ) );
  
  					} );
  
  					If( uv().y.greaterThan( 0.5 ), () => {
  
  						const indexValue = arrayBufferNodes[ 2 ].element( index ).toVar();
  						const value = float( indexValue ).div( float( size ) ).mul( barCount ).floor().div( barCount );
  			
  						color.assign( vec3( 0, 0, value ) );
  
  					} );
  
  					If( uv().y.greaterThan( 0.75 ), () => {
  
  						const indexValue = arrayBufferNodes[ 3 ].element( index ).toVar();
  						const value = float( indexValue ).div( float( size ) ).mul( barCount ).floor().div( barCount );
  			
  						color.assign( vec3( value, value, value ) );
  
  					} );
  
  					return color;
  
  				} )();
  			
  				//
  
  				const plane = new THREE.Mesh( new THREE.PlaneGeometry( 1, 1 ), material );
  				scene.add( plane );
  
  
  
  
  
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
  
  
  				renderer.compute( computeInit );
  
  				//
  
  				renderer.info.autoReset = false;
  
  				 const stepAnimation = async function () {
  
  					renderer.info.reset();
  
  					renderer.compute( compute );
  
  
  					renderer.resolveTimestampsAsync( THREE.TimestampQuery.COMPUTE );
  					renderer.resolveTimestampsAsync( THREE.TimestampQuery.RENDER );
  
  					timestamps[ forceWebGL ? 'webgl' : 'webgpu' ].innerHTML = `
  
  							Compute ${renderer.info.compute.frameCalls} pass in ${renderer.info.compute.timestamp.toFixed( 6 )}ms<br>
  							Draw ${renderer.info.render.drawCalls} pass in ${renderer.info.render.timestamp.toFixed( 6 )}ms`;
  
  					setTimeout( stepAnimation, 1000 );
  			
  				};
  
  				stepAnimation();
  
  				
  
  				
  
  			}
  
  		
}
</script>
