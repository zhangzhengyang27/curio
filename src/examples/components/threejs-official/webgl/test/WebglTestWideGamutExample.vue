<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 35, near: 0.1, far: 100 }"
    custom-render
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
import { DisplayP3ColorSpace, DisplayP3ColorSpaceImpl, LinearDisplayP3ColorSpace, LinearDisplayP3ColorSpaceImpl } from 'three/examples/jsm/math/ColorSpaces.js';
import WebGL from 'three/examples/jsm/capabilities/WebGL.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - wide gamut test<br />"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  const scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let container, loader;
  			let sceneL, sceneR, textureL, textureR;
  
  			let sliderPos = (__stage.container?.clientWidth || window.innerWidth) / 2;
  
  			const slider = document.querySelector( '.slider' );
  
  			const isP3Context = WebGL.isColorSpaceAvailable( DisplayP3ColorSpace );
  
  			THREE.ColorManagement.define( {
  
  				[ DisplayP3ColorSpace ]: DisplayP3ColorSpaceImpl,
  				[ LinearDisplayP3ColorSpace ]: LinearDisplayP3ColorSpaceImpl
  
  			} );
  
  			if ( isP3Context ) {
  
  				THREE.ColorManagement.workingColorSpace = LinearDisplayP3ColorSpace;
  
  			}
  
  			
  
  
  				container = document.querySelector( '.container' );
  
  				sceneL = new THREE.Scene();
  				sceneR = new THREE.Scene();
  
  				
  				camera.position.z = 6;
  
  				loader = new THREE.TextureLoader();
  
  				initTextures();
  				initSlider();
  
  				
  
  
  				renderer.setScissorTest( true );
  
  
  				if ( isP3Context && window.matchMedia( '( color-gamut: p3 )' ).matches ) {
  
  					renderer.outputColorSpace = DisplayP3ColorSpace;
  
  				}
  
  				
  				window.matchMedia( '( color-gamut: p3 )' ).addEventListener( 'change', onGamutChange );
  
  			
  
  
  			async function initTextures() {
  
  				const path = ASSET_HOST + 'textures/wide_gamut/logo_{colorSpace}.png';
  
  				textureL = await loader.loadAsync( path.replace( '{colorSpace}', 'srgb' ) );
  				textureR = await loader.loadAsync( path.replace( '{colorSpace}', 'p3' ) );
  
  				textureL.colorSpace = THREE.SRGBColorSpace;
  				textureR.colorSpace = DisplayP3ColorSpace;
  
  				sceneL.background = THREE.TextureUtils.contain( textureL, (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight) );
  				sceneR.background = THREE.TextureUtils.contain( textureR, (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight) );
  
  			}
  
  			function initSlider() {
  
  				function onPointerDown() {
  
  					if ( event.isPrimary === false ) return;
  
  					window.addEventListener( 'pointermove', onPointerMove );
  					window.addEventListener( 'pointerup', onPointerUp );
  
  				}
  
  				function onPointerUp() {
  
  					window.removeEventListener( 'pointermove', onPointerMove );
  					window.removeEventListener( 'pointerup', onPointerUp );
  
  				}
  
  				function onPointerMove( e ) {
  
  					if ( event.isPrimary === false ) return;
  
  					updateSlider( e.pageX );
  
  				}
  
  				updateSlider( sliderPos );
  
  				slider.style.touchAction = 'none'; // disable touch scroll
  				slider.addEventListener( 'pointerdown', onPointerDown );
  
  			}
  
  			function updateSlider( offset ) {
  
  				sliderPos = Math.max( 10, Math.min( (__stage.container?.clientWidth || window.innerWidth) - 10, offset ) );
  
  				slider.style.left = sliderPos - ( slider.offsetWidth / 2 ) + 'px';
  
  			}
  
  			
  
  			function onGamutChange( { matches } ) {
  
  				renderer.outputColorSpace = isP3Context && matches ? DisplayP3ColorSpace : THREE.SRGBColorSpace;
  
  				textureL.needsUpdate = true;
  				textureR.needsUpdate = true;
  
  			}
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    renderer.setScissor( 0, 0, sliderPos, (__stage.container?.clientHeight || window.innerHeight) );
    				renderer.render( sceneL, camera );
    				renderer.setScissor( sliderPos, 0, (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) );
    				renderer.render( sceneR, camera );
  })
  
  		
}
</script>
