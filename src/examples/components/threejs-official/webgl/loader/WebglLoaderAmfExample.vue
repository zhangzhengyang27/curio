<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, -9, 6]"
    :camera-options="{ fov: 35, near: 1, far: 500 }"
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
import { AMFLoader } from 'three/examples/jsm/loaders/AMFLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - AMF loader"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  
  
  				
  				scene.background = new THREE.Color( 0x999999 );
  
  				scene.add( new THREE.AmbientLight( 0x999999 ) );
  
  				
  
  				// Z is up for objects intended to be 3D printed.
  
  				camera.up.set( 0, 0, 1 );
  
  
  				camera.add( new THREE.PointLight( 0xffffff, 250 ) );
  
  				scene.add( camera );
  
  				const grid = new THREE.GridHelper( 50, 50, 0xffffff, 0x555555 );
  				grid.rotateOnAxis( new THREE.Vector3( 1, 0, 0 ), 90 * ( Math.PI / 180 ) );
  				scene.add( grid );
  
  				
  
  
  
  
  				const loader = new AMFLoader();
  				loader.load( './models/amf/rook.amf', function ( amfobject ) {
  
  					scene.add( amfobject );
  					render();
  
  				} );
  
  
  				controls.addEventListener( 'change', render );
  				controls.target.set( 0, 0, 2 );
  				controls.enableZoom = false;
  				controls.update();
  
  				
  
  			
  
  
  			
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
