<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 70, near: 1, far: 1000 }"
    @ready="onReady"
  />
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';

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

  
  
  
  			const textureLoader = new THREE.TextureLoader();
  
  			
  
  
  				// CAMERA
  
  				
  				camera.position.z = 600;
  
  				// SCENE
  
  				
  
  				// BACKGROUND
  
  				const canvas = document.createElement( 'canvas' );
  				const ctx = canvas.getContext( '2d' );
  				canvas.width = canvas.height = 128;
  				ctx.fillStyle = '#ddd';
  				ctx.fillRect( 0, 0, 128, 128 );
  				ctx.fillStyle = '#555';
  				ctx.fillRect( 0, 0, 64, 64 );
  				ctx.fillStyle = '#999';
  				ctx.fillRect( 32, 32, 32, 32 );
  				ctx.fillStyle = '#555';
  				ctx.fillRect( 64, 64, 64, 64 );
  				ctx.fillStyle = '#777';
  				ctx.fillRect( 96, 96, 32, 32 );
  
  				mapBg = new THREE.CanvasTexture( canvas );
  				mapBg.colorSpace = THREE.SRGBColorSpace;
  				mapBg.wrapS = mapBg.wrapT = THREE.RepeatWrapping;
  				mapBg.repeat.set( 64, 32 );
  
  				scene.background = mapBg;
  
  				// OBJECTS
  
  				const blendings = [
  					{ name: 'No', constant: THREE.NoBlending },
  					{ name: 'Normal', constant: THREE.NormalBlending },
  					{ name: 'Additive', constant: THREE.AdditiveBlending },
  					{ name: 'Subtractive', constant: THREE.SubtractiveBlending },
  					{ name: 'Multiply', constant: THREE.MultiplyBlending }
  				];
  
  				const assignSRGB = ( texture ) => {
  
  					texture.colorSpace = THREE.SRGBColorSpace;
  
  				};
  
  				const map0 = textureLoader.load( ASSET_HOST + 'textures/uv_grid_opengl.jpg', assignSRGB );
  				const map1 = textureLoader.load( ASSET_HOST + 'textures/sprite0.jpg', assignSRGB );
  				const map2 = textureLoader.load( ASSET_HOST + 'textures/sprite0.png', assignSRGB );
  				const map3 = textureLoader.load( ASSET_HOST + 'textures/lensflare/lensflare0.png', assignSRGB );
  				const map4 = textureLoader.load( ASSET_HOST + 'textures/lensflare/lensflare0_alpha.png', assignSRGB );
  
  				const geo1 = new THREE.PlaneGeometry( 100, 100 );
  				const geo2 = new THREE.PlaneGeometry( 100, 25 );
  
  				addImageRow( map0, 300 );
  				addImageRow( map1, 150 );
  				addImageRow( map2, 0 );
  				addImageRow( map3, - 150 );
  				addImageRow( map4, - 300 );
  
  				function addImageRow( map, y ) {
  
  					for ( let i = 0; i < blendings.length; i ++ ) {
  
  						const blending = blendings[ i ];
  
  						const material = new THREE.MeshBasicMaterial( { map: map } );
  						material.transparent = true;
  						material.blending = blending.constant;
  
  						material.premultipliedAlpha = true;
  
  						const x = ( i - blendings.length / 2 ) * 110;
  						const z = 0;
  
  						let mesh = new THREE.Mesh( geo1, material );
  						mesh.position.set( x, y, z );
  						scene.add( mesh );
  
  						mesh = new THREE.Mesh( geo2, generateLabelMaterial( blending.name ) );
  						mesh.position.set( x, y - 75, z );
  						scene.add( mesh );
  
  					}
  
  				}
  
  				// RENDERER
  
  				
  
  
  				// EVENTS
  
  				
  
  			
  
  
  			//
  
  			
  
  
  			function generateLabelMaterial( text ) {
  
  				const canvas = document.createElement( 'canvas' );
  				const ctx = canvas.getContext( '2d' );
  				canvas.width = 128;
  				canvas.height = 32;
  
  				ctx.fillStyle = 'rgba( 0, 0, 0, 0.95 )';
  				ctx.fillRect( 0, 0, 128, 32 );
  
  				ctx.fillStyle = 'white';
  				ctx.font = 'bold 12pt arial';
  				ctx.fillText( text, 10, 22 );
  
  				const map = new THREE.CanvasTexture( canvas );
  				map.colorSpace = THREE.SRGBColorSpace;
  
  				const material = new THREE.MeshBasicMaterial( { map: map, transparent: true } );
  
  				return material;
  
  			}
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const time = Date.now() * 0.00025;
    				const ox = ( time * - 0.01 * mapBg.repeat.x ) % 1;
    				const oy = ( time * - 0.01 * mapBg.repeat.y ) % 1;
    				mapBg.offset.set( ox, oy );
  })
  
  		
}
</script>
