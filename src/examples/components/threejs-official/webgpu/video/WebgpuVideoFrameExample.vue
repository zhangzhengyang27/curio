<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-position="[0, 0, 1]"
    :camera-options="{ fov: 75, near: 0.25, far: 10 }"
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
import { MP4Demuxer } from 'three/examples/jsm/libs/demuxer_mp4.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Video Frames</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  
  
  				
  
  
  				
  
  				const geometry = new THREE.PlaneGeometry();
  
  				const videoTexture = new THREE.VideoFrameTexture();
  				videoTexture.colorSpace = THREE.SRGBColorSpace;
  
  				const decoder = new VideoDecoder( {
  					output( frame ) {
  
  						// To avoid video decoder stalls, we should close the VideoFrame which is no longer needed. https://w3c.github.io/webcodecs/#dom-videodecoder-decode
  						if ( videoTexture.image instanceof VideoFrame ) videoTexture.image.close();
  
  						videoTexture.setFrame( frame );
  			
  					},
  					error( e ) {
  
  						console.error( 'VideoDecoder:', e );
  
  					}
  				} );
  
  				new MP4Demuxer( ASSET_HOST + 'textures/sintel.mp4', {
  					onConfig( config ) {
  
  						decoder.configure( config );
  
  					},
  					onChunk( chunk ) {
  
  						decoder.decode( chunk );
  
  					},
  					setStatus( kind, status ) {
  
  						console.info( 'MP4Demuxer:', kind );
  
  						if ( kind === 'fetch' && status === 'Done' ) {
  
  							decoder.flush().then( () => {
  
  								decoder.close();
  
  								// In case our VideoFrameTexture is no longer needed, we should close its backed VideoFrame, see issue #30379:
  								if ( videoTexture.image instanceof VideoFrame ) videoTexture.image.close();
  
  								videoTexture.image = null;
  
  								scene.remove( mesh );
  
  							} );
  
  						}
  
  					}
  				} );
  			
  				const material = new THREE.MeshBasicMaterial( { map: videoTexture } );
  
  				const mesh = new THREE.Mesh( geometry, material );
  				scene.add( mesh );
  
  				
  
  
  				//
  
  				
  
  			
  
  
  			
  
  			function animate() {
  
  
  
  			}
  
  
  		
}
</script>
