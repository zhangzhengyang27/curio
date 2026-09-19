<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 50, near: 0.1, far: 10 }"
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
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// @ts-expect-error CDN URL 模块无类型声明(运行时由 Vite 解析)
import lottie from 'https://cdn.jsdelivr.net/npm/lottie-web@5.13.0/+esm';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - lottie<br/></br>\n\t\t\t<input id=\"scrubber\" type=\"range\" value=\"0\" style=\"width: 300px\">"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  			let mesh;
  
  			
  
  
  				
  				camera.position.z = 2.5;
  
  				
  				scene.background = new THREE.Color( 0x111111 );
  
  				// lottie
  
  				const loader = new THREE.FileLoader();
  				loader.setResponseType( 'json' );
  				loader.load( ASSET_HOST + 'textures/lottie/24017-lottie-logo-animation.json', function ( data ) {
  
  					const container = document.createElement( 'div' );
  					const dpr = window.devicePixelRatio;
  					container.style.width = ( data as any ).w * dpr + 'px';
  					container.style.height = ( data as any ).h * dpr + 'px';
  					document.body.appendChild( container );
  
  					const animation = lottie.loadAnimation( {
  						container: container,
  						animType: 'canvas',
  						loop: true,
  						autoplay: true,
  						animationData: data,
  						rendererSettings: { dpr: dpr }
  					} );
  
  					const texture = new THREE.CanvasTexture( animation.container );
  					texture.minFilter = THREE.NearestFilter;
  					texture.generateMipmaps = false;
  					texture.colorSpace = THREE.SRGBColorSpace;
  
  					animation.addEventListener( 'enterFrame', function () {
  
  						texture.needsUpdate = true;
  
  					} );
  
  					container.style.display = 'none'; // must be done after loadAnimation() otherwise canvas has 0 dimensions
  
  					setupControls( animation );
  
  					// texture = new THREE.TextureLoader().load( ASSET_HOST + 'textures/uv_grid_directx.jpg' );
  					// texture.colorSpace = THREE.SRGBColorSpace;
  
  					const geometry = new RoundedBoxGeometry( 1, 1, 1, 7, 0.1 );
  					const material = new THREE.MeshStandardMaterial( { roughness: 0, map: texture } );
  					mesh = new THREE.Mesh( geometry, material );
  					scene.add( mesh );
  
  				} );
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  
  
  				const environment = new RoomEnvironment();
  				const pmremGenerator = new THREE.PMREMGenerator( renderer );
  
  				scene.environment = pmremGenerator.fromScene( environment, 0.04 ).texture;
  
  				
  				controls.autoRotate = true;
  
  				//
  
  				
  
  			
  
  
  			function setupControls( animation: any ) {
  
  				// Lottie animation API
  				// https://airbnb.io/lottie/#/web
  
  				// There are a few undocumented properties:
  				// console.log( animation );
  
  				const scrubber = document.createElement( 'input' );
  				scrubber.type = 'range';
  				scrubber.style.cssText = 'position:absolute;bottom:10px;left:10px;width:200px;';
  				__stage.overlay?.appendChild( scrubber );
  				scrubber.max = animation.totalFrames;
  
  				scrubber.addEventListener( 'pointerdown', function () {
  
  					animation.pause();
  
  				} );
  
  				scrubber.addEventListener( 'pointerup', function () {
  
  					animation.play();
  
  				} );
  
  				scrubber.addEventListener( 'input', function () {
  
  					animation.goToAndStop( parseFloat( scrubber.value ), true );
  
  				} );
  
  				animation.addEventListener( 'enterFrame', function () {
  
  					scrubber.value = animation.currentFrame;
  
  				} );
  
  			}
  
  			
  
  			//
  
  			function animate() {
  
  				controls.update();
  
  
  
  			}
  
  		
}
</script>
