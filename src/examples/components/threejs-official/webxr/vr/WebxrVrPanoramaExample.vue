<template>
  <WebXRExampleScene
    camera="perspective"
    :camera-options="{ fov: 70, near: 1, far: 1000 }"
    @ready="onReady"
  />
</template>

<script setup>
import WebXRExampleScene from '@/examples/components/WebXRExampleScene.vue'
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

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

  
  
  
  
  			
  
  
  				
  
  
  				renderer.xr.setReferenceSpaceType( 'local' );
  
  
  				//
  
  				
  
  				
  				camera.layers.enable( 1 );
  
  				const geometry = new THREE.BoxGeometry( 100, 100, 100 );
  				geometry.scale( 1, 1, - 1 );
  
  				const textures = getTexturesFromAtlasFile( ASSET_HOST + 'textures/cube/sun_temple_stripe_stereo.jpg', 12 );
  
  				const materials = [];
  
  				for ( let i = 0; i < 6; i ++ ) {
  
  					materials.push( new THREE.MeshBasicMaterial( { map: textures[ i ] } ) );
  
  				}
  
  				const skyBox = new THREE.Mesh( geometry, materials );
  				skyBox.layers.set( 1 );
  				scene.add( skyBox );
  
  
  				const materialsR = [];
  
  				for ( let i = 6; i < 12; i ++ ) {
  
  					materialsR.push( new THREE.MeshBasicMaterial( { map: textures[ i ] } ) );
  
  				}
  
  				const skyBoxR = new THREE.Mesh( geometry, materialsR );
  				skyBoxR.layers.set( 2 );
  				scene.add( skyBoxR );
  
  				
  
  			
  
  
  			function getTexturesFromAtlasFile( atlasImgUrl, tilesNum ) {
  
  				const textures = [];
  
  				for ( let i = 0; i < tilesNum; i ++ ) {
  
  					textures[ i ] = new THREE.Texture();
  
  				}
  
  				const loader = new THREE.ImageLoader();
  				loader.load( atlasImgUrl, function ( imageObj ) {
  
  					let canvas, context;
  					const tileWidth = imageObj.height;
  
  					for ( let i = 0; i < textures.length; i ++ ) {
  
  						canvas = document.createElement( 'canvas' );
  						context = canvas.getContext( '2d' );
  						canvas.height = tileWidth;
  						canvas.width = tileWidth;
  						context.drawImage( imageObj, tileWidth * i, 0, tileWidth, tileWidth, 0, 0, tileWidth, tileWidth );
  						textures[ i ].colorSpace = THREE.SRGBColorSpace;
  						textures[ i ].image = canvas;
  						textures[ i ].needsUpdate = true;
  
  					}
  
  				} );
  
  				return textures;
  
  			}
  
  			
  
  			function animate() {
  
  
  
  			}
  
  		
}
</script>
