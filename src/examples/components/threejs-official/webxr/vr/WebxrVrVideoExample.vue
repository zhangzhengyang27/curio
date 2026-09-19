<template>
  <WebXRExampleScene
    camera="perspective"
    :camera-options="{ fov: 70, near: 1, far: 2000 }"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </WebXRExampleScene>
</template>

<script setup lang="ts">
import WebXRExampleScene from '@/examples/components/WebXRExampleScene.vue'
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> vr - 360 stereo video<br />\n\t\t\tstereoscopic panoramic render by <a href=\"http://pedrofe.com/rendering-for-oculus-rift-with-arnold/\" target=\"_blank\" rel=\"noopener\">pedrofe</a>. scene from <a href=\"http://www.meryproject.com/\" target=\"_blank\" rel=\"noopener\">mery project</a>."
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  
  
  				const container = __stage.container;
  				container.addEventListener( 'click', function () {
  
  					video.play();
  
  				} );
  
  				
  				camera.layers.enable( 1 ); // render left view when no stereo available
  
  				// video
  
  				const video = document.createElement( 'video' );
  				video.muted = true;
  				video.loop = true;
  				video.playsInline = true;
  				video.src = ASSET_HOST + 'textures/MaryOculus.webm';
  				video.play();
  
  				const texture = new THREE.VideoTexture( video );
  				texture.colorSpace = THREE.SRGBColorSpace;
  
  				
  				scene.background = new THREE.Color( 0x101010 );
  
  				// left
  
  				const geometry1 = new THREE.SphereGeometry( 500, 60, 40 );
  				// invert the geometry on the x-axis so that all of the faces point inward
  				geometry1.scale( - 1, 1, 1 );
  
  				const uvs1 = geometry1.attributes.uv.array;
  
  				for ( let i = 0; i < uvs1.length; i += 2 ) {
  
  					uvs1[ i ] *= 0.5;
  
  				}
  
  				const material1 = new THREE.MeshBasicMaterial( { map: texture } );
  
  				const mesh1 = new THREE.Mesh( geometry1, material1 );
  				mesh1.rotation.y = - Math.PI / 2;
  				mesh1.layers.set( 1 ); // display in left eye only
  				scene.add( mesh1 );
  
  				// right
  
  				const geometry2 = new THREE.SphereGeometry( 500, 60, 40 );
  				geometry2.scale( - 1, 1, 1 );
  
  				const uvs2 = geometry2.attributes.uv.array;
  
  				for ( let i = 0; i < uvs2.length; i += 2 ) {
  
  					uvs2[ i ] *= 0.5;
  					uvs2[ i ] += 0.5;
  
  				}
  
  				const material2 = new THREE.MeshBasicMaterial( { map: texture } );
  
  				const mesh2 = new THREE.Mesh( geometry2, material2 );
  				mesh2.rotation.y = - Math.PI / 2;
  				mesh2.layers.set( 2 ); // display in right eye only
  				scene.add( mesh2 );
  
  				//
  
  				
  
  
  				renderer.xr.setReferenceSpaceType( 'local' );
  
  
  				//
  
  				
  
  			
  
  
  			
  
  			function animate() {
  
  
  
  			}
  
  		
}
</script>
