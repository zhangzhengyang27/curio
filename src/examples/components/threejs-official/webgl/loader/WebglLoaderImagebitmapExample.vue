<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 4, 7]"
    :camera-look-at="[0, 0, 0]"
    :camera-options="{ fov: 30, near: 1, far: 1500 }"
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

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - Texture loader using ImageBitmap"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let group, cubes;
  
  			
  			function addImageBitmap() {
  
  				new THREE.ImageBitmapLoader()
  					.setOptions( { imageOrientation: 'flipY' } )
  					.load( ASSET_HOST + 'textures/planets/earth_atmos_2048.jpg?' + performance.now(), function ( imageBitmap ) {
  
  						const texture = new THREE.CanvasTexture( imageBitmap );
  						texture.colorSpace = THREE.SRGBColorSpace;
  						const material = new THREE.MeshBasicMaterial( { map: texture } );
  
  						// ImageBitmap should be disposed when done with it.
  
  						texture.onUpdate = disposeImageBitmap;
  
  						addCube( material );
  
  					}, function ( p ) {
  
  						console.log( p );
  
  					}, function ( e ) {
  
  						console.log( e );
  
  					} );
  
  			}
  
  			function addImage() {
  
  				new THREE.ImageLoader()
  					.setCrossOrigin( '*' )
  					.load( ASSET_HOST + 'textures/planets/earth_atmos_2048.jpg?' + performance.now(), function ( image ) {
  
  						const texture = new THREE.CanvasTexture( image );
  						texture.colorSpace = THREE.SRGBColorSpace;
  						const material = new THREE.MeshBasicMaterial( { color: 0xff8888, map: texture } );
  						addCube( material );
  
  					} );
  
  			}
  
  			const geometry = new THREE.BoxGeometry();
  
  			function addCube( material ) {
  
  				const cube = new THREE.Mesh( geometry, material );
  				cube.position.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
  				cube.rotation.set( Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI );
  				cubes.add( cube );
  
  			}
  
  			
  
  
  				
  
  				// CAMERA
  
  				
  
  
  
  				// SCENE
  
  				
  
  				//
  
  				group = new THREE.Group();
  				scene.add( group );
  
  				group.add( new THREE.GridHelper( 4, 12, 0x888888, 0x444444 ) );
  
  				cubes = new THREE.Group();
  				group.add( cubes );
  
  				// RENDERER
  
  				
  
  
  				// TESTS
  
  				setTimeout( addImage, 300 );
  				setTimeout( addImage, 600 );
  				setTimeout( addImage, 900 );
  				setTimeout( addImageBitmap, 1300 );
  				setTimeout( addImageBitmap, 1600 );
  				setTimeout( addImageBitmap, 1900 );
  
  				// EVENTS
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    group.rotation.y = performance.now() / 3000;
  })
  
  			function disposeImageBitmap( texture ) {
  
  				texture.source.data.close();
  				texture.onUpdate = null; // make sure this callback is executed only once per texture
  
  			}
  
  		
}
</script>
