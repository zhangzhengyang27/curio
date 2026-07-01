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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - multiple scenes comparison<br />"
function onReady(__stage) {
  const scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			let sceneL, sceneR;
  
  			let sliderPos = (__stage.container?.clientWidth || window.innerWidth) / 2;
  
  			
  
  
  				container = document.querySelector( '.container' );
  
  				sceneL = new THREE.Scene();
  				sceneL.background = new THREE.Color( 0xBCD48F );
  
  				sceneR = new THREE.Scene();
  				sceneR.background = new THREE.Color( 0x8FBCD4 );
  
  				
  				camera.position.z = 6;
  
  				
  
  				const light = new THREE.HemisphereLight( 0xffffff, 0x444444, 3 );
  				light.position.set( - 2, 2, 2 );
  				sceneL.add( light.clone() );
  				sceneR.add( light.clone() );
  
  				initMeshes();
  				initSlider();
  
  				
  
  
  				renderer.setScissorTest( true );
  				
  
  			
  
  
  			function initMeshes() {
  
  				const geometry = new THREE.IcosahedronGeometry( 1, 3 );
  
  				const meshL = new THREE.Mesh( geometry, new THREE.MeshStandardMaterial() );
  				sceneL.add( meshL );
  
  				const meshR = new THREE.Mesh( geometry, new THREE.MeshStandardMaterial( { wireframe: true } ) );
  				sceneR.add( meshR );
  
  			}
  
  			function initSlider() {
  
  				const slider = document.querySelector( '.slider' );
  
  				function onPointerDown() {
  
  					if ( event.isPrimary === false ) return;
  
  					controls.enabled = false;
  
  					window.addEventListener( 'pointermove', onPointerMove );
  					window.addEventListener( 'pointerup', onPointerUp );
  
  				}
  
  				function onPointerUp() {
  
  					controls.enabled = true;
  
  					window.removeEventListener( 'pointermove', onPointerMove );
  					window.removeEventListener( 'pointerup', onPointerUp );
  
  				}
  
  				function onPointerMove( e ) {
  
  					if ( event.isPrimary === false ) return;
  
  					sliderPos = Math.max( 0, Math.min( (__stage.container?.clientWidth || window.innerWidth), e.pageX ) );
  
  					slider.style.left = sliderPos - ( slider.offsetWidth / 2 ) + 'px';
  
  				}
  
  				slider.style.touchAction = 'none'; // disable touch scroll
  				slider.addEventListener( 'pointerdown', onPointerDown );
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    renderer.setScissor( 0, 0, sliderPos, (__stage.container?.clientHeight || window.innerHeight) );
    				renderer.render( sceneL, camera );
    				renderer.setScissor( sliderPos, 0, (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) );
    				renderer.render( sceneR, camera );
  })
  
  		
}
</script>
