<template>
  <ExampleScene
    camera="perspective"
    antialias
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
import { KMZLoader } from 'three/examples/jsm/loaders/KMZLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> -\n\t\t\t<a href=\"https://developers.google.com/kml/documentation/kmzarchives\" target=\"_blank\" rel=\"noopener\">KMZLoader</a>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  
  
  				
  				scene.background = new THREE.Color( 0x999999 );
  
  				const light = new THREE.DirectionalLight( 0xffffff, 3 );
  				light.position.set( 0.5, 1.0, 0.5 ).normalize();
  
  				scene.add( light );
  
  				
  
  				camera.position.y = 5;
  				camera.position.z = 10;
  
  				scene.add( camera );
  
  				const grid = new THREE.GridHelper( 50, 50, 0xffffff, 0x7b7b7b );
  				scene.add( grid );
  
  				
  
  
  
  
  				const loader = new KMZLoader();
  				loader.load( './models/kmz/Box.kmz', function ( kmz ) {
  
  					kmz.scene.position.y = 0.5;
  					scene.add( kmz.scene );
  					render();
  
  				} );
  
  
  				controls.addEventListener( 'change', render );
  				controls.update();
  
  				
  
  			
  
  
  			
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
