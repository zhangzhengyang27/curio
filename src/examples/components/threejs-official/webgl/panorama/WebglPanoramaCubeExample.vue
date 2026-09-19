<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 90, near: 0.1, far: 100 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - cube panorama demo"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  			
  
  
  				const container = __stage.container;
  
  				
  
  
  				camera.position.z = 0.01;
  
  				
  				controls.enableZoom = false;
  				controls.enablePan = false;
  				controls.enableDamping = true;
  				controls.rotateSpeed = - 0.25;
  
  				const textures = getTexturesFromAtlasFile( ASSET_HOST + 'textures/cube/sun_temple_stripe.jpg', 6 );
  
  				const materials = [];
  
  				for ( let i = 0; i < 6; i ++ ) {
  
  					materials.push( new THREE.MeshBasicMaterial( { map: textures[ i ] } ) );
  
  				}
  
  				const skyBox = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), materials );
  				skyBox.geometry.scale( 1, 1, - 1 );
  				scene.add( skyBox );
  
  				
  
  			
  
  
  			function getTexturesFromAtlasFile( atlasImgUrl: any, tilesNum: any ) {
  
  				const textures: any = [];
  
  				for ( let i = 0; i < tilesNum; i ++ ) {
  
  					textures[ i ] = new THREE.Texture();
  
  				}
  
  				new THREE.ImageLoader()
  					.load( atlasImgUrl, ( image ) => {
  
  						let canvas, context;
  						const tileWidth = image.height;
  
  						for ( let i = 0; i < textures.length; i ++ ) {
  
  							canvas = document.createElement( 'canvas' );
  							context = canvas.getContext( '2d' );
  							canvas.height = tileWidth;
  							canvas.width = tileWidth;
  							context!.drawImage( image, tileWidth * i, 0, tileWidth, tileWidth, 0, 0, tileWidth, tileWidth );
  							textures[ i ].colorSpace = THREE.SRGBColorSpace;
  							textures[ i ].image = canvas;
  							textures[ i ].needsUpdate = true;
  
  						}
  
  					} );
  
  				return textures;
  
  			}
  
  			
  
  			function animate() {
  
  				controls.update(); // required when damping is enabled
  
  
  
  			}
  
  		
}
</script>
