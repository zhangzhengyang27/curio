<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-look-at="[0, 0, 0]"
    :camera-options="{ fov: 75, near: 0.25, far: 10 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Video Panorama</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			let isUserInteracting = false,
  				lon = 0, lat = 0,
  				phi = 0, theta = 0,
  				onPointerDownPointerX = 0,
  				onPointerDownPointerY = 0,
  				onPointerDownLon = 0,
  				onPointerDownLat = 0;
  
  			const distance = .5;
  
  			
  
  
  				const container = document.getElementById( 'container' );
  
  				
  
  				
  
  				const geometry = new THREE.SphereGeometry( 5, 60, 40 );
  				// invert the geometry on the x-axis so that all of the faces point inward
  				geometry.scale( - 1, 1, 1 );
  
  				const video = document.getElementById( 'video' );
  				video.play();
  
  				const texture = new THREE.VideoTexture( video );
  				texture.colorSpace = THREE.SRGBColorSpace;
  				const material = new THREE.MeshBasicMaterial( { map: texture } );
  
  				const mesh = new THREE.Mesh( geometry, material );
  				scene.add( mesh );
  
  				
  
  
  				document.addEventListener( 'pointerdown', onPointerDown );
  				document.addEventListener( 'pointermove', onPointerMove );
  				document.addEventListener( 'pointerup', onPointerUp );
  
  				//
  
  				
  
  			
  
  
  			
  
  			function onPointerDown( event ) {
  
  				isUserInteracting = true;
  
  				onPointerDownPointerX = event.clientX;
  				onPointerDownPointerY = event.clientY;
  
  				onPointerDownLon = lon;
  				onPointerDownLat = lat;
  
  			}
  
  			function onPointerMove( event ) {
  
  				if ( isUserInteracting === true ) {
  
  					lon = ( onPointerDownPointerX - event.clientX ) * 0.1 + onPointerDownLon;
  					lat = ( onPointerDownPointerY - event.clientY ) * 0.1 + onPointerDownLat;
  
  				}
  
  			}
  
  			function onPointerUp() {
  
  				isUserInteracting = false;
  
  			}
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    lat = Math.max( - 85, Math.min( 85, lat ) );
    				phi = THREE.MathUtils.degToRad( 90 - lat );
    				theta = THREE.MathUtils.degToRad( lon );
    				camera.position.x = distance * Math.sin( phi ) * Math.cos( theta );
    				camera.position.y = distance * Math.cos( phi );
    				camera.position.z = distance * Math.sin( phi ) * Math.sin( theta );
    }
  })
  
  			function update() {
  
  				lat = Math.max( - 85, Math.min( 85, lat ) );
  				phi = THREE.MathUtils.degToRad( 90 - lat );
  				theta = THREE.MathUtils.degToRad( lon );
  
  				camera.position.x = distance * Math.sin( phi ) * Math.cos( theta );
  				camera.position.y = distance * Math.cos( phi );
  				camera.position.z = distance * Math.sin( phi ) * Math.sin( theta );
  
  
  
  
  
  			}
  
  		
}
</script>
