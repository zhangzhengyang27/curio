<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 60, near: 10, far: 20000 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - webgl terrain raycasting demo"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  
  
  			let container, stats;
  
  
  			let mesh, texture;
  
  			const worldWidth = 256, worldDepth = 256,
  				worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;
  
  			let helper;
  
  			const raycaster = new THREE.Raycaster();
  			const pointer = new THREE.Vector2();
  
  			
  
  
  				container = document.getElementById( 'container' );
  				container.innerHTML = '';
  
  				
  
  
  				scene.background = new THREE.Color( 0xbfd1e5 );
  
  				
  
  				
  				controls.minDistance = 1000;
  				controls.maxDistance = 10000;
  				controls.maxPolarAngle = Math.PI / 2;
  
  				//
  
  				const data = generateHeight( worldWidth, worldDepth );
  
  				controls.target.y = data[ worldHalfWidth + worldHalfDepth * worldWidth ] + 500;
  				camera.position.y = controls.target.y + 2000;
  				camera.position.x = 2000;
  				controls.update();
  
  				const geometry = new THREE.PlaneGeometry( 7500, 7500, worldWidth - 1, worldDepth - 1 );
  				geometry.rotateX( - Math.PI / 2 );
  
  				const vertices = geometry.attributes.position.array;
  
  				for ( let i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
  
  					vertices[ j + 1 ] = data[ i ] * 10;
  
  				}
  
  				//
  
  				texture = new THREE.CanvasTexture( generateTexture( data, worldWidth, worldDepth ) );
  				texture.wrapS = THREE.ClampToEdgeWrapping;
  				texture.wrapT = THREE.ClampToEdgeWrapping;
  				texture.colorSpace = THREE.SRGBColorSpace;
  
  				mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { map: texture } ) );
  				scene.add( mesh );
  
  				const geometryHelper = new THREE.ConeGeometry( 20, 100, 3 );
  				geometryHelper.translate( 0, 50, 0 );
  				geometryHelper.rotateX( Math.PI / 2 );
  				helper = new THREE.Mesh( geometryHelper, new THREE.MeshNormalMaterial() );
  				scene.add( helper );
  
  				container.addEventListener( 'pointermove', onPointerMove );
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  			
  
  
  			
  
  			function generateHeight( width, height ) {
  
  				const size = width * height, data = new Uint8Array( size ),
  					perlin = new ImprovedNoise(), z = Math.random() * 100;
  
  				let quality = 1;
  
  				for ( let j = 0; j < 4; j ++ ) {
  
  					for ( let i = 0; i < size; i ++ ) {
  
  						const x = i % width, y = ~ ~ ( i / width );
  						data[ i ] += Math.abs( perlin.noise( x / quality, y / quality, z ) * quality * 1.75 );
  
  					}
  
  					quality *= 5;
  
  				}
  
  				return data;
  
  			}
  
  			function generateTexture( data, width, height ) {
  
  				// bake lighting into texture
  
  				let context, image, imageData, shade;
  
  				const vector3 = new THREE.Vector3( 0, 0, 0 );
  
  				const sun = new THREE.Vector3( 1, 1, 1 );
  				sun.normalize();
  
  				const canvas = document.createElement( 'canvas' );
  				canvas.width = width;
  				canvas.height = height;
  
  				context = canvas.getContext( '2d' );
  				context.fillStyle = '#000';
  				context.fillRect( 0, 0, width, height );
  
  				image = context.getImageData( 0, 0, canvas.width, canvas.height );
  				imageData = image.data;
  
  				for ( let i = 0, j = 0, l = imageData.length; i < l; i += 4, j ++ ) {
  
  					vector3.x = data[ j - 2 ] - data[ j + 2 ];
  					vector3.y = 2;
  					vector3.z = data[ j - width * 2 ] - data[ j + width * 2 ];
  					vector3.normalize();
  
  					shade = vector3.dot( sun );
  
  					imageData[ i ] = ( 96 + shade * 128 ) * ( 0.5 + data[ j ] * 0.007 );
  					imageData[ i + 1 ] = ( 32 + shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );
  					imageData[ i + 2 ] = ( shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );
  
  				}
  
  				context.putImageData( image, 0, 0 );
  
  				// Scaled 4x
  
  				const canvasScaled = document.createElement( 'canvas' );
  				canvasScaled.width = width * 4;
  				canvasScaled.height = height * 4;
  
  				context = canvasScaled.getContext( '2d' );
  				context.scale( 4, 4 );
  				context.drawImage( canvas, 0, 0 );
  
  				image = context.getImageData( 0, 0, canvasScaled.width, canvasScaled.height );
  				imageData = image.data;
  
  				for ( let i = 0, l = imageData.length; i < l; i += 4 ) {
  
  					const v = ~ ~ ( Math.random() * 5 );
  
  					imageData[ i ] += v;
  					imageData[ i + 1 ] += v;
  					imageData[ i + 2 ] += v;
  
  				}
  
  				context.putImageData( image, 0, 0 );
  
  				return canvasScaled;
  
  			}
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    }
    				stats.update();
  })
  
  			function render() {
  
  
  
  			}
  
  			function onPointerMove( event ) {
  
  				pointer.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
  				pointer.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
  				raycaster.setFromCamera( pointer, camera );
  
  				// See if the ray from the camera into the world hits one of our meshes
  				const intersects = raycaster.intersectObject( mesh );
  
  				// Toggle rotation bool for meshes that we clicked
  				if ( intersects.length > 0 ) {
  
  					helper.position.set( 0, 0, 0 );
  					helper.lookAt( intersects[ 0 ].face.normal );
  
  					helper.position.copy( intersects[ 0 ].point );
  
  				}
  
  			}
  
  		
}
</script>
