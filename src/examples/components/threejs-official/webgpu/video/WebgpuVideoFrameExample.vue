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

<script setup lang="ts">
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
// @ts-expect-error demuxer_mp4.js 无类型声明(env.d.ts 候选: declare module 'three/examples/jsm/libs/demuxer_mp4.js')
import { MP4Demuxer } from 'three/examples/jsm/libs/demuxer_mp4.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Video Frames</span>"
function onReady(__stage: any) {
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
  					onConfig( config: any ) {
  
  						decoder.configure( config );
  
  					},
  					onChunk( chunk: any ) {
  
  						decoder.decode( chunk );
  
  					},
  					setStatus( kind: any, status: any ) {
  
  						console.info( 'MP4Demuxer:', kind );
  
  						if ( kind === 'fetch' && status === 'Done' ) {
  
  							decoder.flush().then( () => {
  
  								decoder.close();
  
  								// In case our VideoFrameTexture is no longer needed, we should close its backed VideoFrame, see issue #30379:
  								if ( videoTexture.image instanceof VideoFrame ) videoTexture.image.close();
  
  								(videoTexture.image as any) = null;
  
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
