<template>
  <ExampleScene
    camera="perspective"
    custom-render
    :camera-options="{ fov: 90, near: 0.01, far: 100 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - simple global illumination (<a href=\"http://www.iquilezles.org/www/articles/simplegi/simplegi.htm\">article</a>)"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			class GIMesh extends THREE.Mesh {
  
  				copy( source ) {
  
  					super.copy( source );
  
  					this.geometry = source.geometry.clone();
  
  					return this;
  
  				}
  
  			}
  
  			//
  
  			const SimpleGI = function ( renderer, scene ) {
  
  				const SIZE = 32, SIZE2 = SIZE * SIZE;
  
  
  
  				scene.updateMatrixWorld( true );
  
  				let clone = scene.clone();
  				clone.matrixWorldAutoUpdate = false;
  
  				const rt = new THREE.WebGLRenderTarget( SIZE, SIZE );
  
  				const normalMatrix = new THREE.Matrix3();
  
  				const position = new THREE.Vector3();
  				const normal = new THREE.Vector3();
  
  				let bounces = 0;
  				let currentVertex = 0;
  
  				const color = new Float32Array( 3 );
  				const buffer = new Uint8Array( SIZE2 * 4 );
  
  				__stage.addUpdateCallback((_delta, _elapsed) => {
    if ( bounces === 3 ) return;
    					const object = scene.children[ 0 ]; // torusKnot
    					const geometry = object.geometry;
    					const attributes = geometry.attributes;
    					const positions = attributes.position.array;
    					const normals = attributes.normal.array;
    					if ( attributes.color === undefined ) {
    						const colors = new Float32Array( positions.length );
    						geometry.setAttribute( 'color', new THREE.BufferAttribute( colors, 3 ).setUsage( THREE.DynamicDrawUsage ) );
    					}
    					const colors = attributes.color.array;
    					const startVertex = currentVertex;
    					const totalVertex = positions.length / 3;
    					for ( let i = 0; i < 32; i ++ ) {
    						if ( currentVertex >= totalVertex ) break;
    						position.fromArray( positions, currentVertex * 3 );
    						position.applyMatrix4( object.matrixWorld );
    						normal.fromArray( normals, currentVertex * 3 );
    						normal.applyMatrix3( normalMatrix.getNormalMatrix( object.matrixWorld ) ).normalize();
    						camera.position.copy( position );
    						renderer.setRenderTarget( rt );
    						renderer.readRenderTargetPixels( rt, 0, 0, SIZE, SIZE, buffer );
    						color[ 0 ] = 0;
    						color[ 1 ] = 0;
    						color[ 2 ] = 0;
    						for ( let k = 0, kl = buffer.length; k < kl; k += 4 ) {
    							color[ 0 ] += buffer[ k + 0 ];
    							color[ 1 ] += buffer[ k + 1 ];
    							color[ 2 ] += buffer[ k + 2 ];
    						}
    						colors[ currentVertex * 3 + 0 ] = color[ 0 ] / ( SIZE2 * 255 );
    						colors[ currentVertex * 3 + 1 ] = color[ 1 ] / ( SIZE2 * 255 );
    						colors[ currentVertex * 3 + 2 ] = color[ 2 ] / ( SIZE2 * 255 );
    						currentVertex ++;
    					}
    					attributes.color.addUpdateRange( startVertex * 3, ( currentVertex - startVertex ) * 3 );
    					attributes.color.needsUpdate = true;
    					if ( currentVertex >= totalVertex ) {
    						clone = scene.clone();
    						clone.matrixWorldAutoUpdate = false;
    						bounces ++;
    						currentVertex = 0;
    					}
  })
  
  			};
  
  			//
  
  
  			
  
  
  				
  				camera.position.z = 4;
  
  				
  
  				// torus knot
  
  				const torusGeometry = new THREE.TorusKnotGeometry( 0.75, 0.3, 128, 32, 1 );
  				const material = new THREE.MeshBasicMaterial( { vertexColors: true } );
  
  				const torusKnot = new GIMesh( torusGeometry, material );
  				scene.add( torusKnot );
  
  				// room
  
  				const materials = [];
  
  				for ( let i = 0; i < 8; i ++ ) {
  
  					materials.push( new THREE.MeshBasicMaterial( { color: Math.random() * 0xffffff, side: THREE.BackSide } ) );
  
  				}
  
  				const boxGeometry = new THREE.BoxGeometry( 3, 3, 3 );
  
  				const box = new THREE.Mesh( boxGeometry, materials );
  				scene.add( box );
  
  				//
  
  				
  
  
  				new SimpleGI( renderer, scene );
  
  
  				controls.minDistance = 1;
  				controls.maxDistance = 10;
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    renderer.setRenderTarget( null );
  })
  
  		
}
</script>
