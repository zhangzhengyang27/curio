<template>
  <ExampleScene
    camera="perspective"
    antialias
    custom-render
    :camera-options="{ fov: 70, near: 1, far: 10000 }"
    :enable-controls="false"
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

<script setup lang="ts">
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - gpu picking"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  let gl_Position;
  let out_id;
  let vid;
  
  
  
  
  
  			let container, stats;
  
  			let pickingTexture: any, pickingScene: any;
  			let highlightBox: any;
  
  			const pickingData: any[] = []
  
  			const pointer = new THREE.Vector2();
  			const offset = new THREE.Vector3( 10, 10, 10 );
  			const clearColor = new THREE.Color();
  
  			
  
  
  				container = __stage.container;
  
  				
  				camera.position.z = 1000;
  
  				
  				scene.background = new THREE.Color( 0xffffff );
  
  				scene.add( new THREE.AmbientLight( 0xcccccc ) );
  
  				const light = new THREE.DirectionalLight( 0xffffff, 3 );
  				light.position.set( 0, 500, 2000 );
  				scene.add( light );
  
  				const defaultMaterial = new THREE.MeshPhongMaterial( {
  					color: 0xffffff,
  					flatShading: true,
  					vertexColors: true,
  					shininess: 0
  				} );
  
  				// set up the picking texture to use a 32 bit integer so we can write and read integer ids from it
  				pickingScene = new THREE.Scene();
  				pickingTexture = new THREE.WebGLRenderTarget( 1, 1, {
  
  					type: THREE.IntType,
  					format: THREE.RGBAIntegerFormat,
  					internalFormat: 'RGBA32I',
  
  				} );
  				const pickingMaterial = new THREE.ShaderMaterial( {
  
  					glslVersion: THREE.GLSL3,
  
  					vertexShader: /* glsl */`
  						attribute int id;
  						flat varying int vid;
  						void main() {
  
  							vid = id;
  							gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  
  						}
  					`,
  
  					fragmentShader: /* glsl */`
  						layout(location = 0) out int out_id;
  						flat varying int vid;
  
  						void main() {
  
  							out_id = vid;
  
  						}
  					`,
  
  				} );
  
  				function applyId( geometry: any, id: any ) {
  
  					const position = geometry.attributes.position;
  					const array = new Int16Array( position.count );
  					array.fill( id );
  
  					const bufferAttribute = new THREE.Int16BufferAttribute( array, 1, false );
  					bufferAttribute.gpuType = THREE.IntType;
  					geometry.setAttribute( 'id', bufferAttribute );
  
  				}
  
  				function applyVertexColors( geometry: any, color: any ) {
  
  					const position = geometry.attributes.position;
  					const colors = [];
  
  					for ( let i = 0; i < position.count; i ++ ) {
  
  						colors.push( color.r, color.g, color.b );
  
  					}
  
  					geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
  
  				}
  
  				const geometries = [];
  				const matrix = new THREE.Matrix4();
  				const quaternion = new THREE.Quaternion();
  				const color = new THREE.Color();
  
  				for ( let i = 0; i < 5000; i ++ ) {
  
  					const geometry = new THREE.BoxGeometry();
  
  					const position = new THREE.Vector3();
  					position.x = Math.random() * 10000 - 5000;
  					position.y = Math.random() * 6000 - 3000;
  					position.z = Math.random() * 8000 - 4000;
  
  					const rotation = new THREE.Euler();
  					rotation.x = Math.random() * 2 * Math.PI;
  					rotation.y = Math.random() * 2 * Math.PI;
  					rotation.z = Math.random() * 2 * Math.PI;
  
  					const scale = new THREE.Vector3();
  					scale.x = Math.random() * 200 + 100;
  					scale.y = Math.random() * 200 + 100;
  					scale.z = Math.random() * 200 + 100;
  
  					quaternion.setFromEuler( rotation );
  					matrix.compose( position, quaternion, scale );
  
  					geometry.applyMatrix4( matrix );
  
  					// give the geometry's vertices a random color to be displayed and an integer
  					// identifier as a vertex attribute so boxes can be identified after being merged.
  					applyVertexColors( geometry, color.setHex( Math.random() * 0xffffff ) );
  					applyId( geometry, i );
  
  					geometries.push( geometry );
  
  					pickingData[ i ] = {
  
  						position: position,
  						rotation: rotation,
  						scale: scale
  
  					};
  
  				}
  
  				const mergedGeometry = BufferGeometryUtils.mergeGeometries( geometries );
  				scene.add( new THREE.Mesh( mergedGeometry, defaultMaterial ) );
  				pickingScene.add( new THREE.Mesh( mergedGeometry, pickingMaterial ) );
  
  				highlightBox = new THREE.Mesh(
  					new THREE.BoxGeometry(),
  					new THREE.MeshLambertMaterial( { color: 0xffff00 } )
  				);
  				scene.add( highlightBox );
  
  				
  
  
  				controls.rotateSpeed = 1.0;
  				controls.zoomSpeed = 1.2;
  				controls.panSpeed = 0.8;
  				controls.noZoom = false;
  				controls.noPan = false;
  				controls.staticMoving = true;
  				controls.dynamicDampingFactor = 0.3;
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				renderer.domElement.addEventListener( 'pointermove', onPointerMove );
  
  			
  
  
  			//
  
  			function onPointerMove( e: any ) {
  
  				pointer.x = e.clientX;
  				pointer.y = e.clientY;
  
  			}
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    {
    {
    // render the picking scene off-screen
    				// set the view offset to represent just a single pixel under the mouse
    				const dpr = window.devicePixelRatio;
    				camera.setViewOffset(
    					renderer.domElement.width, renderer.domElement.height,
    					Math.floor( pointer.x * dpr ), Math.floor( pointer.y * dpr ),
    					1, 1
    				);
    				// render the scene
    				renderer.setRenderTarget( pickingTexture );
    				// clear the background to - 1 meaning no item was hit
    				clearColor.setRGB( - 1, - 1, - 1 );
    				renderer.setClearColor( clearColor );
    				// Restore active render target to canvas
    				renderer.setRenderTarget( null );
    				// clear the view offset so rendering returns to normal
    				camera.clearViewOffset();
    				// create buffer for reading single pixel
    				const pixelBuffer = new Int32Array( 4 );
    				// read the pixel
    				renderer
    					.readRenderTargetPixelsAsync( pickingTexture, 0, 0, 1, 1, pixelBuffer )
    					.then( () => {
    						const id = pixelBuffer[ 0 ];
    						if ( id !== - 1 ) {
    							// move our highlightBox so that it surrounds the picked object
    							const data = pickingData[ id ];
    							highlightBox.position.copy( data.position );
    							highlightBox.rotation.copy( data.rotation );
    							highlightBox.scale.copy( data.scale ).add( offset );
    							highlightBox.visible = true;
    						} else {
    							highlightBox.visible = false;
    						}
    					} );
    }
    }
    				stats.update();
  })
  
  			function pick() {
  
  				// render the picking scene off-screen
  				// set the view offset to represent just a single pixel under the mouse
  				const dpr = window.devicePixelRatio;
  				camera.setViewOffset(
  					renderer.domElement.width, renderer.domElement.height,
  					Math.floor( pointer.x * dpr ), Math.floor( pointer.y * dpr ),
  					1, 1
  				);
  
  				// render the scene
  				renderer.setRenderTarget( pickingTexture );
  
  				// clear the background to - 1 meaning no item was hit
  				clearColor.setRGB( - 1, - 1, - 1 );
  				renderer.setClearColor( clearColor );
  				renderer.render( pickingScene, camera );
  
  				// Restore active render target to canvas
  				renderer.setRenderTarget( null );
  
  				// clear the view offset so rendering returns to normal
  				camera.clearViewOffset();
  
  				// create buffer for reading single pixel
  				const pixelBuffer = new Int32Array( 4 );
  
  				// read the pixel
  				renderer
  					.readRenderTargetPixelsAsync( pickingTexture, 0, 0, 1, 1, pixelBuffer )
  					.then( () => {
  
  						const id = pixelBuffer[ 0 ];
  						if ( id !== - 1 ) {
  
  							// move our highlightBox so that it surrounds the picked object
  							const data = pickingData[ id ];
  							highlightBox.position.copy( data.position );
  							highlightBox.rotation.copy( data.rotation );
  							highlightBox.scale.copy( data.scale ).add( offset );
  							highlightBox.visible = true;
  
  						} else {
  
  							highlightBox.visible = false;
  
  						}
  
  					} );
  
  			}
  
  			function render() {
  
  				controls.update();
  
  				pick();
  
  
  
  			}
  
  		
}
</script>
