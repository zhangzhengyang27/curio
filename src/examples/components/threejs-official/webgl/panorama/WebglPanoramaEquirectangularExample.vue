<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 75, near: 1, far: 1100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
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

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js webgl</a> - equirectangular panorama demo. photo by <a href=\"http://www.flickr.com/photos/jonragnarsson/2294472375/\" target=\"_blank\" rel=\"noopener\">Jón Ragnarsson</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			let isUserInteracting = false,
  				onPointerDownMouseX = 0, onPointerDownMouseY = 0,
  				lon = 0, onPointerDownLon = 0,
  				lat = 0, onPointerDownLat = 0,
  				phi = 0, theta = 0;
  
  			
  
  
  				const container = document.getElementById( 'container' );
  
  				
  
  				
  
  				const geometry = new THREE.SphereGeometry( 500, 60, 40 );
  				// invert the geometry on the x-axis so that all of the faces point inward
  				geometry.scale( - 1, 1, 1 );
  
  				const texture = new THREE.TextureLoader().load( ASSET_HOST + 'textures/2294472375_24a3b8ef46_o.jpg' );
  				texture.colorSpace = THREE.SRGBColorSpace;
  				const material = new THREE.MeshBasicMaterial( { map: texture } );
  
  				const mesh = new THREE.Mesh( geometry, material );
  
  				scene.add( mesh );
  
  				
  
  
  				container.style.touchAction = 'none';
  				container.addEventListener( 'pointerdown', onPointerDown );
  
  				document.addEventListener( 'wheel', onDocumentMouseWheel );
  
  				
  
  			
  
  
  			
  
  			function onPointerDown( event ) {
  
  				if ( event.isPrimary === false ) return;
  
  				isUserInteracting = true;
  
  				onPointerDownMouseX = event.clientX;
  				onPointerDownMouseY = event.clientY;
  
  				onPointerDownLon = lon;
  				onPointerDownLat = lat;
  
  				document.addEventListener( 'pointermove', onPointerMove );
  				document.addEventListener( 'pointerup', onPointerUp );
  
  			}
  
  			function onPointerMove( event ) {
  
  				if ( event.isPrimary === false ) return;
  
  				lon = ( onPointerDownMouseX - event.clientX ) * 0.1 + onPointerDownLon;
  				lat = ( event.clientY - onPointerDownMouseY ) * 0.1 + onPointerDownLat;
  
  			}
  
  			function onPointerUp( event ) {
  
  				if ( event.isPrimary === false ) return;
  
  				isUserInteracting = false;
  
  				document.removeEventListener( 'pointermove', onPointerMove );
  				document.removeEventListener( 'pointerup', onPointerUp );
  
  			}
  
  			function onDocumentMouseWheel( event ) {
  
  				const fov = camera.fov + event.deltaY * 0.05;
  
  				camera.fov = THREE.MathUtils.clamp( fov, 10, 75 );
  
  				camera.updateProjectionMatrix();
  
  			}
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    if ( isUserInteracting === false ) {
    					lon += 0.1;
    				}
    				lat = Math.max( - 85, Math.min( 85, lat ) );
    				phi = THREE.MathUtils.degToRad( 90 - lat );
    				theta = THREE.MathUtils.degToRad( lon );
    				const x = 500 * Math.sin( phi ) * Math.cos( theta );
    				const y = 500 * Math.cos( phi );
    				const z = 500 * Math.sin( phi ) * Math.sin( theta );
  })
  
  		
}
</script>
